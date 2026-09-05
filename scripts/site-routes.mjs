/**
 * The public page inventory of maitreya.org.il - ONE list that drives
 * pre-rendering (prerender.mjs), the sitemap, llms.txt, the .htaccess page
 * rules and the link checker. Keep it in sync with the routes in src/App.tsx.
 *
 * URL scheme: Hebrew (primary) unprefixed at the root, English under /en.
 * Retreat landing pages keep their historical /events/... paths.
 *
 * A route is { path, lang, alternates?: { he, en }, priority, changefreq,
 * kind } where `alternates` lists the same page in each language (used for
 * hreflang and the sitemap's xhtml:link entries).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DIST = path.join(ROOT, "dist");
export const ORIGIN = "https://maitreya.org.il";

/** Client-rendered areas: served the SPA shell (index.html), never pre-rendered or indexed. */
export const SPA_PREFIXES = ["courses", "admin", "auth", "reset-password", "discover", "heb"];

/** Minimal frontmatter reader (flat `key: value` pairs, quotes optional) - mirrors src/site/frontmatter.ts. */
export function readFrontmatter(file) {
  const raw = fs.readFileSync(file, "utf8");
  const meta = {};
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (m) {
    for (const line of m[1].split("\n")) {
      const i = line.indexOf(":");
      if (i === -1) continue;
      let v = line.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      meta[line.slice(0, i).trim()] = v;
    }
  }
  return { meta, body: m ? raw.slice(m[0].length).trim() : raw.trim() };
}

export function listContent(lang, kind) {
  const dir = path.join(ROOT, "content", lang, kind);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ slug: f.replace(/\.md$/, ""), ...readFrontmatter(path.join(dir, f)) }));
}

const pageMeta = (lang, name) => {
  const file = path.join(ROOT, "content", lang, "pages", `${name}.md`);
  return fs.existsSync(file) ? readFrontmatter(file).meta : {};
};

export function getRoutes() {
  const routes = [];
  const bilingual = (sub, { priority, changefreq, kind, he = true, en = true }) => {
    const alt = {};
    if (he) alt.he = sub || "/";
    if (en) alt.en = `/en${sub}`;
    if (he) routes.push({ path: sub || "/", lang: "he", alternates: alt, priority, changefreq, kind });
    if (en) routes.push({ path: `/en${sub}`, lang: "en", alternates: alt, priority, changefreq, kind });
  };

  bilingual("", { priority: 1.0, changefreq: "weekly", kind: "home" });
  bilingual("/events", { priority: 0.9, changefreq: "weekly", kind: "page" });
  bilingual("/about", { priority: 0.8, changefreq: "monthly", kind: "page" });
  bilingual("/articles", { priority: 0.7, changefreq: "monthly", kind: "page" });
  bilingual("/gallery", { priority: 0.5, changefreq: "monthly", kind: "page", en: false });
  bilingual("/dana", { priority: 0.6, changefreq: "yearly", kind: "page" });
  bilingual("/contact", { priority: 0.5, changefreq: "yearly", kind: "page" });

  for (const lang of ["he", "en"]) {
    for (const a of listContent(lang, "articles")) {
      const p = lang === "he" ? `/articles/${a.slug}` : `/en/articles/${a.slug}`;
      routes.push({
        path: p,
        lang,
        alternates: { [lang]: p },
        priority: 0.7,
        changefreq: "yearly",
        kind: "article",
        title: a.meta.title,
        description: a.meta.description,
        date: a.meta.date,
      });
    }
  }

  // App pages outside the content layer (React components with their own SEO hooks)
  // The schedule page carries robots noindex on purpose (internal schedule) - pre-rendered, but not listed for crawlers
  routes.push({ path: "/practices", lang: "he", alternates: { he: "/practices" }, priority: 0.9, changefreq: "weekly", kind: "app", noindex: true });
  const retreat = (he, en, priority = 0.8) => {
    routes.push({ path: he, lang: "he", alternates: { he, ...(en ? { en } : {}) }, priority, changefreq: "monthly", kind: "event" });
    if (en) routes.push({ path: en, lang: "en", alternates: { he, en }, priority, changefreq: "monthly", kind: "event" });
  };
  retreat("/events/yamantaka-online-2026", null, 0.9);
  retreat("/events/uma-zub-tri", null, 0.7);
  retreat("/events/ein-gedi-healing-retreat", "/events/en/ein-gedi-healing-retreat", 0.7);
  retreat("/events/heart-of-wisdom-retreat", "/events/en/heart-of-wisdom-retreat", 0.7);
  for (const terms of ["/events/ein-gedi-healing-retreat/terms", "/events/online-terms"]) {
    routes.push({ path: terms, lang: "he", alternates: { he: terms }, priority: 0.2, changefreq: "yearly", kind: "page" });
  }

  return routes;
}

/** Where a route's pre-rendered HTML lives inside dist ("/" -> _pages/index.html, "/en/about" -> _pages/en/about.html). */
export function pageFile(routePath) {
  const rel = routePath === "/" ? "index" : routePath.replace(/^\//, "");
  return path.join(DIST, "_pages", `${rel}.html`);
}

/** Human-readable descriptions for llms.txt, from the content files where they exist. */
export function describeRoute(route) {
  if (route.title) return { title: route.title, description: route.description };
  const name = route.path === "/" || route.path === "/en" ? "home" : route.path.replace(/^\/(en\/)?/, "");
  const meta = pageMeta(route.lang, name);
  return { title: meta.title, description: meta.description };
}
