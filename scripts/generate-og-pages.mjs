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

function injectOgTags(template, { title, description, image }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description || title);

  let html = template;

  if (image) {
    const safeImage = escapeHtml(image);
    if (/<meta property="og:image" content="[^"]*"/.test(html)) {
      html = html.replace(
        /<meta property="og:image" content="[^"]*"/,
        `<meta property="og:image" content="${safeImage}"`
      );
    } else {
      html = html.replace(
        /<meta property="og:type"[^>]*>/,
        (match) => `${match}\n    <meta property="og:image" content="${safeImage}" />`
      );
    }
  }

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

// Static event pages with hardcoded OG tags
const STATIC_EVENTS = [
  {
    route: "events/ein-gedi-healing-retreat",
    title: "ריטריט ריפוי בודהיסטי בים המלח | 1-6 ביוני 2026 | מאיטרייה סנגהה ישראל",
    description:
      "ריטריט הילינג בעין גדי - דרך הריפוי וההילינג הבודהיסטי. שישה ימים של חניכות ותרגולי ריפוי עומק עם לאמה גלן מולין ודרופון צ׳ונגוואל-לה. 1-6 ביוני 2026, בית ספר שדה עין גדי.",
    image: "https://maitreya.org.il/p/og-ein-gedi-healing-retreat.png",
  },
  {
    route: "events/heart-of-wisdom-retreat",
    title: "ריטריט מהמודרה: לב החוכמה עם לאמה גלן | 28-30 במאי 2026 | מאיטרייה סנגהה ישראל",
    description:
      "ריטריט עירוני של שלושה ימי לימוד ותרגול של שיטות החוכמה הייחודיות של הבודהיזם הטנטרי עם לאמה גלן, כולל חניכה למנג׳ושרי הלבן. תל אביב, 28-30 במאי 2026.",
    image: "https://maitreya.org.il/p/og-heart-of-wisdom-retreat.png",
  },
  {
    route: "events/en/heart-of-wisdom-retreat",
    title: "Mahamudra: Heart of Wisdom Retreat with Lama Glenn | May 28-30, 2026 | Maitreya Sangha Israel",
    description:
      "A three-day online retreat exploring the unique wisdom methods of Buddhist Tantra with Lama Glenn Mullin, including a White Manjushri empowerment. Live on Zoom, May 28-30, 2026.",
    image: "https://maitreya.org.il/p/og-heart-of-wisdom-retreat-en.png",
  },
  {
    route: "events/en/ein-gedi-healing-retreat",
    title: "The Path of Tantric Healing with Lama Glenn | June 1-6, 2026 | Maitreya Sangha Israel",
    description:
      "Six days of deep healing and longevity practices from Tibetan Buddhist Tantra with Lama Glenn Mullin and Drupon Chongwol-la. Live on Zoom, June 1-6, 2026.",
    image: "https://maitreya.org.il/p/og-ein-gedi-healing-retreat-en.png",
  },
];

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

  // Generate OG pages for static event landing pages
  console.log(`Generating OG pages for ${STATIC_EVENTS.length} event(s)...`);

  for (const event of STATIC_EVENTS) {
    const eventPage = injectOgTags(template, {
      title: event.title,
      description: event.description,
      image: event.image,
    });
    writeHtml(path.join(DIST, event.route, "index.html"), eventPage);
    console.log(`  ✓ ${event.route}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
