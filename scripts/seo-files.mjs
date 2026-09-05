/**
 * Writes the crawler-facing files into dist/ after pre-rendering:
 *   sitemap.xml - every public page, with hreflang pairs for bilingual pages
 *   robots.txt  - everything open except the app-only areas
 *   llms.txt    - a plain-text guide for AI assistants (title + description
 *                 per page, taken from the pre-rendered meta tags)
 */
import fs from "node:fs";
import path from "node:path";
import { DIST, ORIGIN, getRoutes, describeRoute } from "./site-routes.mjs";

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const abs = (p) => `${ORIGIN}${p === "/" ? "/" : p}`;

export function buildSitemap(allRoutes) {
  const routes = allRoutes.filter((r) => !r.noindex);
  const L = ['<?xml version="1.0" encoding="UTF-8"?>'];
  L.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');
  for (const r of routes) {
    L.push("  <url>");
    L.push(`    <loc>${esc(abs(r.path))}</loc>`);
    if (r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date)) L.push(`    <lastmod>${r.date}</lastmod>`);
    L.push(`    <changefreq>${r.changefreq}</changefreq>`);
    L.push(`    <priority>${r.priority.toFixed(1)}</priority>`);
    const alt = r.alternates || {};
    if (alt.he && alt.en) {
      L.push(`    <xhtml:link rel="alternate" hreflang="he" href="${esc(abs(alt.he))}" />`);
      L.push(`    <xhtml:link rel="alternate" hreflang="en" href="${esc(abs(alt.en))}" />`);
      L.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(abs(alt.he))}" />`);
    }
    L.push("  </url>");
  }
  L.push("</urlset>");
  return L.join("\n") + "\n";
}

export function buildRobots() {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /auth/",
    "Disallow: /reset-password",
    "Disallow: /_pages/",
    "",
    `Sitemap: ${ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");
}

export function buildLlms(allRoutes, captured) {
  const routes = allRoutes.filter((r) => !r.noindex);
  const line = (r) => {
    const c = captured.get(r.path) || {};
    const d = describeRoute(r);
    const title = c.title || d.title || r.path;
    const desc = c.description || d.description || "";
    return `- [${title}](${abs(r.path)})${desc ? `: ${desc}` : ""}`;
  };
  const he = routes.filter((r) => r.lang === "he" && r.kind !== "article" && r.kind !== "event");
  const en = routes.filter((r) => r.lang === "en" && r.kind !== "article" && r.kind !== "event");
  const events = routes.filter((r) => r.kind === "event");
  const articles = routes.filter((r) => r.kind === "article");
  return [
    "# Maitreya Sangha Israel (מאיטרייה סנגהה ישראל)",
    "",
    "> The Israeli student community of Lama Glenn Mullin and Drupon Chongwol-la: a non-profit (amuta) that organizes Tibetan Buddhist teachings, retreats and empowerments in Israel and online, weekly Zoom practice sessions (Tummo and other practices), and Hebrew translations. The site is primarily in Hebrew (RTL) with an English section under /en.",
    "",
    "Contact: maitreyasanghaisrael@gmail.com. Teachers: Lama Glenn Mullin (Tibetan Buddhist tantra teacher, translator of over thirty books, student of the 14th Dalai Lama and his gurus) and Drupon Chongwol-la (Lama Glenn's retreat master, Vajrayana and Tummo teacher). Events are announced on the events page and the mailing list; weekly practice times are on the practices page.",
    "",
    "## Site pages (Hebrew)",
    ...he.map(line),
    "",
    "## Site pages (English)",
    ...en.map(line),
    "",
    "## Events and retreats",
    ...events.map(line),
    "",
    "## Articles",
    ...articles.map(line),
    "",
    "## Notes for assistants",
    "- Every page above is served as full HTML (no JavaScript needed to read it).",
    `- Machine-readable index: ${ORIGIN}/sitemap.xml`,
    "- Registration and payment for retreats happen on the event pages; do not invent prices or dates - quote the page.",
    "",
  ].join("\n");
}

export function writeSeoFiles(captured = new Map()) {
  const routes = getRoutes();
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), buildSitemap(routes));
  fs.writeFileSync(path.join(DIST, "robots.txt"), buildRobots());
  fs.writeFileSync(path.join(DIST, "llms.txt"), buildLlms(routes, captured));
  console.log(`sitemap.xml (${routes.length} urls), robots.txt, llms.txt written`);
}
