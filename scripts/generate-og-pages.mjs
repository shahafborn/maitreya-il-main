/**
 * Post-build: social-preview shells for the course pages.
 *
 * The course pages (/courses/<slug>, /courses/<slug>/register) are
 * client-rendered behind sign-in, so they are not pre-rendered. Crawlers
 * (WhatsApp, Facebook) still need the right <title>/OG tags, so this writes
 * one copy of the app shell per published course with those tags injected,
 * into dist/_pages/courses/... - the .htaccess routes the clean URL there.
 *
 * Reads the published courses from Supabase. Env comes from the CI secrets
 * or, for local builds, from .env.local.
 */
import fs from "node:fs";
import path from "node:path";
import { DIST, ROOT } from "./site-routes.mjs";

const SITE_NAME = "Maitreya Sangha Israel";

function loadEnvLocal() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

async function fetchCourses(url, key) {
  const res = await fetch(`${url}/rest/v1/courses?select=slug,title,description&is_published=eq.true`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
  return res.json();
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function injectOgTags(template, { title, description }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description || title);
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${safeTitle}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${safeDesc}"`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${safeDesc}"`);
}

function writeHtml(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

export async function generateCoursePages() {
  loadEnvLocal();
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (process.env.CI) throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    console.warn("Course preview pages skipped: no Supabase env (set .env.local for local builds)");
    return;
  }
  const template = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");
  const courses = await fetchCourses(url, key);
  console.log(`Generating preview pages for ${courses.length} course(s)...`);
  for (const course of courses) {
    const page = injectOgTags(template, { title: `${course.title} | ${SITE_NAME}`, description: course.description });
    writeHtml(path.join(DIST, "_pages", "courses", `${course.slug}.html`), page);
    writeHtml(path.join(DIST, "_pages", "courses", course.slug, "register.html"), page);
    console.log(`  ✓ courses/${course.slug}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  generateCoursePages().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
