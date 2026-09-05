/**
 * Build-time link checker: no page can ship with a link that would 404.
 *
 * Reads every pre-rendered page in dist/_pages, collects internal links and
 * asset references, and resolves each one the way the server would
 * (redirects.mjs `resolve` + the pre-rendered page set + the files in dist).
 * A 404/410 fails the build. Internal links that would bounce through a
 * redirect are reported as warnings (they work, but should be direct).
 * Absolute links to maitreya.org.il are checked as internal paths; social
 * preview images (og:image) must exist as files in dist.
 */
import fs from "node:fs";
import path from "node:path";
import { DIST, ORIGIN } from "./site-routes.mjs";
import { resolve } from "./redirects.mjs";
import { listPrerenderedPages } from "./build-htaccess.mjs";

function collectFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...collectFiles(full));
    else if (e.name.endsWith(".html")) out.push(full);
  }
  return out;
}

export function checkLinks() {
  const pages = new Set(listPrerenderedPages());
  const isPage = (p) => pages.has(p);
  const isFile = (p) => {
    const f = path.join(DIST, decodeURIComponent(p));
    return f.startsWith(DIST) && fs.existsSync(f) && fs.statSync(f).isFile();
  };

  const files = [...collectFiles(path.join(DIST, "_pages")), path.join(DIST, "404.html")];
  const errors = [];
  const warnings = [];
  let checked = 0;

  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const rel = path.relative(DIST, file);
    const refs = new Set();
    for (const m of html.matchAll(/\b(?:href|src|content)="([^"]*)"/g)) refs.add(m[1]);
    for (let ref of refs) {
      if (!ref || ref.startsWith("#") || /^(mailto:|tel:|javascript:|data:|blob:)/.test(ref)) continue;
      if (ref.startsWith(ORIGIN)) ref = ref.slice(ORIGIN.length) || "/";
      if (/^(https?:)?\/\//.test(ref)) continue; // external
      if (!ref.startsWith("/")) continue; // relative or plain text content= values
      checked++;
      const { final, hops, path: last } = resolve(ref, { isPage, isFile });
      if (final.status === 404 || final.status === 410 || final.status === 508) {
        errors.push(`${rel}: ${ref} -> ${final.status}${hops.length > 1 ? ` (via ${hops.map((h) => h.path).join(" -> ")})` : ""}`);
      } else if (hops.length > 1) {
        warnings.push(`${rel}: ${ref} redirects to ${last}`);
      }
    }
  }

  if (warnings.length) console.warn(`Link checker warnings (${warnings.length}):\n  ` + warnings.join("\n  "));
  if (errors.length) {
    console.error(`Link checker FAILED (${errors.length} broken references):\n  ` + errors.join("\n  "));
    process.exit(1);
  }
  console.log(`Link checker: ${checked} references in ${files.length} pages, all resolve`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  checkLinks();
}
