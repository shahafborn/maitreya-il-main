/**
 * Post-build script: generates per-course HTML files with correct OG meta tags.
 *
 * Reads dist/index.html as a template, fetches all published courses from
 * Supabase, and writes route-specific HTML files so that social media crawlers
 * (WhatsApp, Facebook, Twitter) see the right preview for each course URL.
 *
 * The SPA JS bundle is identical — only the <title> and OG tags differ.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "../dist");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const SITE_NAME = "Maitreya Sangha Israel";

async function fetchCourses() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/courses?select=slug,title,description&is_published=eq.true`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
  return res.json();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function injectOgTags(template, { title, description }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description || title);

  let html = template;

  // Replace <title>
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${safeTitle}</title>`
  );

  // Replace og:title
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${safeTitle}"`
  );

  // Replace og:description
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${safeDesc}"`
  );

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${safeDesc}"`
  );

  return html;
}

function writeHtml(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

async function main() {
  const template = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");
  const courses = await fetchCourses();

  console.log(`Generating OG pages for ${courses.length} course(s)...`);

  for (const course of courses) {
    const courseTitle = `${course.title} | ${SITE_NAME}`;
    const registerTitle = `${course.title} | ${SITE_NAME}`;
    const desc = course.description || course.title;

    // /courses/<slug>/index.html
    const coursePage = injectOgTags(template, {
      title: courseTitle,
      description: desc,
    });
    writeHtml(path.join(DIST, "courses", course.slug, "index.html"), coursePage);

    // /courses/<slug>/register/index.html
    const registerPage = injectOgTags(template, {
      title: registerTitle,
      description: desc,
    });
    writeHtml(
      path.join(DIST, "courses", course.slug, "register", "index.html"),
      registerPage
    );

    console.log(`  ✓ ${course.slug}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
