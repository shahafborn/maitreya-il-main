/**
 * Redirect map for the domain cutover (WordPress -> this app at the root).
 *
 * This file is the SINGLE source of truth: build-htaccess.mjs turns it into
 * the .htaccess that ships in dist/, check-links.mjs and the tests emulate it
 * with `resolve()`, and smoke-test.mjs verifies the live server against it.
 * The inventory it covers is the vault's url-inventory-2026-08-14.md (every
 * URL in the old Yoast sitemaps) plus the app's own /p/ prefix.
 *
 * Rules are applied in the order listed in `resolve()`; the generated
 * .htaccess keeps the same order.
 */

/** Exact old paths (no trailing slash; the rule also accepts one) -> new path. */
export const EXACT = [
  // Hebrew core pages (Polylang served Hebrew under /he/)
  ["/he/home", "/"],
  ["/he", "/"],
  ["/he/about", "/about"],
  ["/he/contact", "/contact"],
  ["/he/gallery", "/gallery"],
  ["/he/articles", "/articles"],
  ["/he/articles/category/uncategorized", "/articles"],
  ["/he/our_events", "/events"],
  ["/he/join-mailing-list-heb", "/#newsletter"],
  ["/he/lg2025-tantra-in-the-modern-world", "/events#lg2025-tantra-in-the-modern-world"],
  // English pages (WordPress served English at the root with no clean tree)
  ["/home-english", "/en"],
  ["/en/home-english", "/en"],
  ["/mailing-list-eng", "/en#newsletter"],
  ["/en/mailing-list-eng", "/en#newsletter"],
  ["/lg26-introduction_to_tantra_en", "/en/events#lg26-introduction_to_tantra_en"],
  ["/12-weeks-vajrayogini-teaching-series-lama-glenn-august-2025", "/en/events#12-weeks-vajrayogini-teaching-series-lama-glenn-august-2025"],
  ["/visit-of-lama-glenn-mullin-in-israel-november-2025", "/en/events"],
  ["/en/visit-of-lama-glenn-mullin-in-israel-november-2025", "/en/events"],
  ["/home-english/lg26-the-path-of-tantric-healing-retreat-eng", "/events/en/ein-gedi-healing-retreat"],
  ["/home-english/lg26-the-path-of-tantric-healing-retreat-eng/tc-eng-poth-retreat-lg2026", "/events/en/ein-gedi-healing-retreat"],
  // Event pages that have a live landing page in the app
  ["/he/our_events/lg26-the-path-of-buddhist-healing-retreat-he-1", "/events/ein-gedi-healing-retreat"],
  ["/he/our_events/lg202606-healingretreat-terms", "/events/ein-gedi-healing-retreat/terms"],
  ["/he/our_events/tos_online_event", "/events/online-terms"],
  // WordPress itself already pointed these at the Ein Gedi 2026 page (its own redirect rules)
  ["/he/our_events/lg25_11_dc_healingyogas", "/events/ein-gedi-healing-retreat"],
  ["/he/our_events/lg26-05-form-healing-4days", "/events/ein-gedi-healing-retreat"],
  // The app's own aliases of the Ein Gedi page (also under the old /p/ prefix, so it is one hop)
  ["/events/ein-gedi-v1", "/events/ein-gedi-healing-retreat"],
  ["/events/ein-gedi-v2", "/events/ein-gedi-healing-retreat"],
  ["/p/events/ein-gedi-v1", "/events/ein-gedi-healing-retreat"],
  ["/p/events/ein-gedi-v2", "/events/ein-gedi-healing-retreat"],
  // Yoast sitemaps -> the app's sitemap (keeps Search Console continuity)
  ["/sitemap_index.xml", "/sitemap.xml"],
  ["/page-sitemap.xml", "/sitemap.xml"],
  ["/post-sitemap.xml", "/sitemap.xml"],
  ["/category-sitemap.xml", "/sitemap.xml"],
  ["/sitemap.xml.gz", "/sitemap.xml"],
];

/**
 * Pattern rules (JS regex source, matched against the path WITHOUT leading
 * slash and WITHOUT trailing slash) -> replacement using $1.
 */
export const PATTERNS = [
  // Hebrew articles keep their slugs
  ["he/articles/([^/]+)", "/articles/$1"],
  // The legacy 2025 event pages live on as entries in the events archive
  ["he/our_events/([^/]+)", "/events#$1"],
  // The November 2025 visit sub-pages (English) live on in the English events archive
  ["(?:en/)?visit-of-lama-glenn-mullin-in-israel-november-2025/([^/]+)", "/en/events#$1"],
  // Anything else under the old Polylang prefixes lands on the language home
  ["he/.*", "/"],
  // The app used to live under /p/ - every old link keeps working
  ["p", "/"],
  ["p/(.*?)", "/$1"],
];

/** WordPress internals: gone for good (410), nothing to redirect to. */
export const GONE = [
  "wp-admin(?:/.*)?",
  "wp-login\\.php",
  "wp-content(?:/.*)?",
  "wp-includes(?:/.*)?",
  "wp-json(?:/.*)?",
  "xmlrpc\\.php",
  "wp-cron\\.php",
  "feed(?:/.*)?",
  "comments/feed(?:/.*)?",
];

/** Client-rendered areas served the SPA shell (must match SPA_PREFIXES in site-routes.mjs). */
export const SPA_PREFIXES = ["courses", "admin", "auth", "reset-password", "discover", "heb"];

const stripSlash = (p) => (p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p);

/**
 * Emulates the server's decision for a path. `isPage(path)` says whether a
 * pre-rendered page exists, `isFile(path)` whether a static file exists.
 * Returns one hop: { status: 301, location } | { status: 410 } |
 * { status: 200, kind: "page" | "file" | "spa" } | { status: 404 }.
 */
export function step(input, { isPage, isFile }) {
  const [pathOnly, query = ""] = input.split("?");
  const [pathNoHash, hash = ""] = pathOnly.split("#");
  const q = query ? `?${query}` : "";
  const bare = stripSlash(pathNoHash);
  const rel = bare.replace(/^\//, "");

  for (const [from, to] of EXACT) {
    if (bare === from) return { status: 301, location: withQuery(to, q) };
  }
  for (const [src, to] of PATTERNS) {
    const m = rel.match(new RegExp(`^${src}$`));
    if (m) return { status: 301, location: withQuery(to.replace("$1", m[1] ?? ""), q) };
  }
  for (const src of GONE) {
    if (new RegExp(`^${src}$`).test(rel)) return { status: 410 };
  }
  if (pathNoHash.length > 1 && pathNoHash.endsWith("/") && !isFile(pathNoHash)) {
    return { status: 301, location: `${bare}${q}` };
  }
  if (isPage(bare)) return { status: 200, kind: "page" };
  if (isFile(pathNoHash)) return { status: 200, kind: "file" };
  if (SPA_PREFIXES.some((p) => rel === p || rel.startsWith(`${p}/`))) return { status: 200, kind: "spa" };
  void hash;
  return { status: 404 };
}

function withQuery(to, q) {
  if (!q) return to;
  const [base, hash] = to.split("#");
  return hash ? `${base}${q}#${hash}` : `${base}${q}`;
}

/** Follows redirects to the end. Returns { hops: [...], final }. */
export function resolve(input, ctx, maxHops = 5) {
  const hops = [];
  let cur = input;
  for (let i = 0; i < maxHops; i++) {
    const r = step(cur, ctx);
    hops.push({ path: cur, ...r });
    if (r.status !== 301) return { hops, final: r, path: cur };
    cur = r.location;
  }
  return { hops, final: { status: 508 }, path: cur };
}
