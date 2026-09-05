/**
 * Pre-renders every public page to real HTML after `vite build`.
 *
 * Why: the site must be readable without JavaScript - by Google, by social
 * crawlers (WhatsApp/Facebook previews) and by AI assistants. The app is a
 * client-rendered React SPA, so we render each route in a headless browser
 * (Playwright/Chromium) against the freshly built dist/, and splice what the
 * browser produced (the <title>, meta tags, canonical/hreflang links,
 * JSON-LD and the #root markup) into the build's index.html template.
 *
 * Output: dist/_pages/<route>.html ("/" -> _pages/index.html,
 * "/en/about" -> _pages/en/about.html) plus dist/404.html. The .htaccess
 * (build-htaccess.mjs) maps each clean URL to its file.
 *
 * On page load the app boots normally (createRoot); src/prerendered.ts keeps
 * the pre-rendered markup on screen while a lazy route chunk loads, so there
 * is no flash of "Loading...". External requests (analytics, fonts, YouTube,
 * Supabase) are blocked during pre-rendering - they are not part of the
 * markup and only slow the build down.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright";
import { DIST, getRoutes, pageFile } from "./site-routes.mjs";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/** Tiny static server for dist/ with SPA fallback (what the real server does for unknown paths). */
function startServer() {
  const index = fs.readFileSync(path.join(DIST, "index.html"));
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      const file = path.join(DIST, p);
      if (file.startsWith(DIST) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.setHeader("Content-Type", MIME[path.extname(file)] ?? "application/octet-stream");
        fs.createReadStream(file).pipe(res);
      } else {
        res.setHeader("Content-Type", MIME[".html"]);
        res.end(index);
      }
    });
    srv.listen(0, "127.0.0.1", () => resolve(srv));
  });
}

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Splices the captured page into the build template. */
export function compose(template, cap) {
  let html = template.replace(/<html[^>]*>/, `<html lang="${esc(cap.lang || "he")}" dir="${esc(cap.dir || "rtl")}">`);
  html = html.replace(/<title>[^<]*<\/title>\s*/, "");
  html = html.replace(/[ \t]*<meta name="description"[^>]*>\s*/g, "");
  html = html.replace(/[ \t]*<meta property="og:[^"]*"[^>]*>\s*/g, "");

  const head = [`<title>${esc(cap.title)}</title>`];
  for (const m of cap.metas) {
    head.push(
      m.property
        ? `<meta property="${esc(m.property)}" content="${esc(m.content)}" />`
        : `<meta name="${esc(m.name)}" content="${esc(m.content)}" />`,
    );
  }
  head.push(...cap.links);
  for (const href of cap.styles) {
    if (!html.includes(`href="${href}"`)) head.push(`<link rel="stylesheet" crossorigin href="${esc(href)}">`);
  }
  for (const j of cap.jsonld) {
    head.push(`<script type="application/ld+json">${j.replace(/</g, "\\u003c")}</script>`);
  }
  html = html.replace("</head>", `    ${head.join("\n    ")}\n  </head>`);
  if (!html.includes('<div id="root"></div>')) throw new Error("template has no empty #root - cannot pre-render");
  html = html.replace('<div id="root"></div>', `<div id="root">${cap.root}</div>`);
  return html;
}

const CAPTURE = () => ({
  lang: document.documentElement.getAttribute("lang") || "",
  dir: document.documentElement.getAttribute("dir") || "",
  title: document.title,
  metas: [...document.head.querySelectorAll("meta[name], meta[property]")]
    .filter((m) => /^(description|keywords|robots|og:|twitter:)/.test(m.getAttribute("name") || m.getAttribute("property") || ""))
    .map((m) => ({ name: m.getAttribute("name"), property: m.getAttribute("property"), content: m.getAttribute("content") || "" })),
  links: [...document.head.querySelectorAll('link[rel="canonical"], link[rel="alternate"]')].map((l) => l.outerHTML),
  jsonld: [...document.head.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent || ""),
  styles: [...document.head.querySelectorAll('link[rel="stylesheet"][href^="/"]')].map((l) => l.getAttribute("href")),
  root: document.getElementById("root")?.innerHTML || "",
});

async function renderRoute(page, origin, routePath) {
  await page.goto(`${origin}${routePath}`, { waitUntil: "networkidle" });
  // Wait until a page component (not the Suspense fallback) has rendered and its SEO effect ran
  await page.waitForFunction(
    () => {
      const r = document.getElementById("root");
      if (!r || r.children.length === 0) return false;
      const t = r.textContent || "";
      if (/Loading\.\.\.|טוען\.\.\./.test(t) && r.children.length === 1) return false;
      return document.title !== "" && document.title !== "Maitreya Sangha Israel";
    },
    { timeout: 20000 },
  );
  await page.waitForTimeout(200);
  const cap = await page.evaluate(CAPTURE);
  if (!cap.root.trim()) throw new Error(`empty render for ${routePath}`);
  return cap;
}

export async function prerender() {
  const template = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route("**/*", (route) => {
    const host = new URL(route.request().url()).hostname;
    return host === "127.0.0.1" ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  const routes = getRoutes();
  const captured = new Map();
  console.log(`Pre-rendering ${routes.length} pages...`);
  for (const route of routes) {
    const cap = await renderRoute(page, origin, route.path);
    const file = pageFile(route.path);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, compose(template, cap));
    const desc = cap.metas.find((m) => m.name === "description")?.content || "";
    captured.set(route.path, { title: cap.title, description: desc });
    console.log(`  ✓ ${route.path}  (${cap.title.slice(0, 60)})`);
  }

  // The 404 page: an unknown route renders NotFound
  const nf = await renderRoute(page, origin, "/__not_found__");
  fs.writeFileSync(path.join(DIST, "404.html"), compose(template, nf));
  console.log("  ✓ 404.html");

  await browser.close();
  server.close();
  if (errors.length) {
    console.error("JavaScript errors during pre-render:\n" + errors.join("\n"));
    process.exit(1);
  }
  return captured;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  prerender().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
