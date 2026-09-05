/**
 * Post-build chain (runs from `npm run build` right after `vite build`):
 *   1. prerender.mjs        - real HTML for every public page + 404.html
 *   2. generate-og-pages.mjs - social-preview shells for the course pages
 *   3. seo-files.mjs        - sitemap.xml, robots.txt, llms.txt
 *   4. build-htaccess.mjs   - redirects + page routing + headers
 *   5. check-links.mjs      - a broken internal link fails the build
 */
import { prerender } from "./prerender.mjs";
import { generateCoursePages } from "./generate-og-pages.mjs";
import { writeSeoFiles } from "./seo-files.mjs";
import { writeHtaccess } from "./build-htaccess.mjs";
import { checkLinks } from "./check-links.mjs";

const captured = await prerender();
await generateCoursePages();
writeSeoFiles(captured);
writeHtaccess();
checkLinks();
