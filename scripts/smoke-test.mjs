/**
 * Smoke test for a deployed (or locally Apache-served) build.
 *
 *   node scripts/smoke-test.mjs https://maitreya.org.il
 *   node scripts/smoke-test.mjs http://127.0.0.1:8089     (see scripts/local-apache.sh)
 *
 * Walks the legacy URL inventory (each must 301 to a live page), every
 * public route (must be real HTML with a title, canonical and content),
 * the crawler files, a 404, a 410, the /p/ prefix, headers and caching.
 * Exits non-zero on any failure - run it right after the cutover and again
 * after every deploy that touches routing.
 */
import { getRoutes, ORIGIN } from "./site-routes.mjs";
import { LEGACY_PATHS, GONE_PATHS } from "./legacy-urls.mjs";
import { resolve } from "./redirects.mjs";

const base = (process.argv[2] || ORIGIN).replace(/\/$/, "");
const results = [];
const ok = (name, pass, detail = "") => results.push({ name, pass, detail });

async function get(p, redirect = "manual") {
  const res = await fetch(`${base}${p}`, { redirect, headers: { "User-Agent": "maitreya-smoke-test" } });
  const body = /text|xml|json/.test(res.headers.get("content-type") || "") ? await res.text() : "";
  return { status: res.status, location: res.headers.get("location"), headers: res.headers, body };
}

function toPath(location) {
  if (!location) return null;
  return location.startsWith("http") ? location.replace(/^https?:\/\/[^/]+/, "") : location;
}

/** Follows redirects by hand so each hop can be asserted; strips the #fragment before requesting. */
async function follow(p, max = 5) {
  const hops = [p];
  let cur = p;
  for (let i = 0; i < max; i++) {
    const r = await get(cur.split("#")[0]);
    if (r.status === 301 || r.status === 302 || r.status === 308) {
      cur = toPath(r.location);
      hops.push(`${r.status}->${cur}`);
      continue;
    }
    return { status: r.status, hops, body: r.body, path: cur };
  }
  return { status: 508, hops, body: "", path: cur };
}

const routes = getRoutes();
const routePaths = new Set(routes.map((r) => r.path));

// 1. Legacy inventory: every old URL ends on a live page, with the expected final path
for (const p of LEGACY_PATHS) {
  const expected = resolve(p, { isPage: (x) => routePaths.has(x) || x.startsWith("/courses/"), isFile: () => false });
  const r = await follow(p);
  const wantPath = expected.path.split("#")[0].split("?")[0];
  const gotPath = r.path.split("#")[0].split("?")[0];
  ok(`legacy ${p}`, r.status === 200 && gotPath === wantPath, `${r.hops.join(" ")} => ${r.status} (expected ${wantPath})`);
}

// 2. Gone
for (const p of GONE_PATHS) {
  const r = await get(p);
  ok(`gone ${p}`, r.status === 410, `status ${r.status}`);
}

// 3. Every public route is real HTML
for (const route of routes) {
  const r = await get(route.path);
  const html = r.body || "";
  const hasContent = /<div id="root">\s*<\S/.test(html);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] || "";
  const canonical = html.includes('rel="canonical"');
  const desc = /<meta name="description" content="[^"]{20,}"/.test(html);
  ok(
    `page ${route.path}`,
    r.status === 200 && hasContent && title.length > 5 && canonical && desc,
    `status ${r.status}, content ${hasContent}, title "${title.slice(0, 40)}", canonical ${canonical}, description ${desc}`,
  );
}

// 4. Trailing slash + _pages direct hits + /p/ with query string
{
  const a = await get("/about/");
  ok("trailing slash /about/ -> /about", a.status === 301 && toPath(a.location) === "/about", `${a.status} ${a.location}`);
  const b = await get("/_pages/about.html");
  ok("_pages direct hit redirects", b.status === 301 && toPath(b.location) === "/about", `${b.status} ${b.location}`);
  const c = await get("/p/events/yamantaka-online-2026?utm=x");
  ok("/p/ keeps the query string", c.status === 301 && toPath(c.location) === "/events/yamantaka-online-2026?utm=x", `${c.status} ${c.location}`);
  const d = await get("/he/join-mailing-list-heb/");
  ok("mailing list page -> home newsletter anchor", d.status === 301 && toPath(d.location) === "/#newsletter", `${d.status} ${d.location}`);
}

// 5. 404 is a real 404 with our page; app areas get the shell
{
  const r = await get("/no-such-page-xyz");
  ok("unknown URL is 404", r.status === 404 && /404/.test(r.body), `status ${r.status}`);
  const s = await get("/courses/anything");
  ok("/courses/* serves the app shell", s.status === 200 && s.body.includes('<div id="root">'), `status ${s.status}`);
  const t = await get("/admin");
  ok("/admin serves the app shell", t.status === 200, `status ${t.status}`);
  const u = await get("/auth/callback");
  ok("/auth/callback serves the app shell", u.status === 200, `status ${u.status}`);
}

// 6. Crawler files
{
  const s = await get("/sitemap.xml");
  ok("sitemap.xml", s.status === 200 && s.body.includes("<urlset") && s.body.includes(`${ORIGIN}/en`), `status ${s.status}`);
  const r = await get("/robots.txt");
  ok("robots.txt", r.status === 200 && r.body.includes("Sitemap:"), `status ${r.status}`);
  const l = await get("/llms.txt");
  ok("llms.txt", l.status === 200 && l.body.includes("Maitreya"), `status ${l.status}`);
  const y = await get("/sitemap_index.xml");
  ok("old Yoast sitemap -> sitemap.xml", y.status === 301 && toPath(y.location) === "/sitemap.xml", `${y.status} ${y.location}`);
}

// 7. Headers and caching
{
  const h = await get("/");
  ok("home: nosniff header", h.headers.get("x-content-type-options") === "nosniff", String(h.headers.get("x-content-type-options")));
  ok("home: html not cached", /no-cache/.test(h.headers.get("cache-control") || ""), String(h.headers.get("cache-control")));
  ok("home: Hebrew RTL document", /<html lang="he" dir="rtl">/.test(h.body), "");
  const asset = h.body.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
  if (asset) {
    const a = await get(asset);
    ok("assets: immutable cache", a.status === 200 && /immutable/.test(a.headers.get("cache-control") || ""), `${a.status} ${a.headers.get("cache-control")}`);
  } else ok("assets: script tag found in home", false, "no /assets/*.js in home html");
  const og = h.body.match(/property="og:image" content="([^"]+)"/)?.[1];
  if (og) {
    const o = await get(toPath(og));
    ok("home: og:image resolves", o.status === 200, `${og} -> ${o.status}`);
  } else ok("home: og:image present", false, "");
  const en = await get("/en");
  ok("english home: LTR document", /<html lang="en" dir="ltr">/.test(en.body), "");
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.pass ? "" : `  -- ${r.detail}`}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed against ${base}`);
process.exit(failed.length ? 1 : 0);
