/**
 * <lastmod> for the sitemap: the date of the last git commit that changed a
 * page's OWN visible text. Google only trusts lastmod when it tracks real content
 * changes, so:
 *   - shared layout/components are left out (a footer tweak is not a page update);
 *   - markdown content files count on any commit;
 *   - a page component counts only on commits whose diff touches words a visitor
 *     reads - Hebrew letters for Hebrew pages, an English phrase inside a string
 *     or JSX text for English pages, comments ignored. A code-only commit (payment
 *     handling, a refactor) does not move the date. (2026-09-27: without this, one
 *     payment fix dated nine event pages "updated 23.9".)
 *
 * Needs full git history: in a shallow clone every file would show the latest
 * commit's date, so lastmod is omitted rather than faked. The deploy workflow
 * checks out with fetch-depth: 0 for this reason.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT } from "./site-routes.mjs";

const git = (args) => execFileSync("git", ["-C", ROOT, ...args], { encoding: "utf8" }).trim();

function historyAvailable() {
  try {
    return git(["rev-parse", "--is-shallow-repository"]) === "false";
  } catch {
    return false; // no git at all
  }
}

/** route path -> page component file, read from src/App.tsx (<Route path=... element={<X ...} /> + X's import). */
function appRouteFiles() {
  const app = fs.readFileSync(path.join(ROOT, "src", "App.tsx"), "utf8");
  const imports = new Map();
  for (const m of app.matchAll(/const (\w+) = lazy\(\(\) => import\("\.\/([^"]+)"\)\)/g)) imports.set(m[1], m[2]);
  for (const m of app.matchAll(/^import (\w+) from "\.\/([^"]+)";/gm)) imports.set(m[1], m[2]);
  const files = new Map();
  for (const m of app.matchAll(/<Route path="([^"]+)" element=\{<(\w+)/g)) {
    const rel = imports.get(m[2]);
    if (!rel) continue;
    const file = ["tsx", "ts"].map((ext) => path.join("src", `${rel}.${ext}`)).find((f) => fs.existsSync(path.join(ROOT, f)));
    if (file) files.set(m[1], file);
  }
  return files;
}

/** Repo-relative files/dirs whose last change is this route's last change. */
function sourcesFor(route, routeFiles) {
  const src = [];
  const comp = routeFiles.get(route.path);
  if (comp) src.push(comp);
  if (route.kind === "home" || route.kind === "page") {
    const name = route.path === "/" || route.path === "/en" ? "home" : route.path.replace(/^\/(en\/)?/, "");
    const md = path.join("content", route.lang, "pages", `${name}.md`);
    if (fs.existsSync(path.join(ROOT, md))) src.push(md);
    // The home page and the events list show the events entries (and the home page the visit promo).
    if (route.kind === "home" || name === "events") src.push(path.join("content", route.lang, "events"));
    if (route.kind === "home") {
      const promo = path.join("content", route.lang, "pages", "visit-promo.md");
      if (fs.existsSync(path.join(ROOT, promo))) src.push(promo);
    }
  }
  return src;
}

const HEBREW = /[א-ת]/;
// Three+ words inside quotes/backticks or between JSX tags: copy, not code.
const ENGLISH_COPY = /(["'`>])[^"'`<>{}]*[A-Za-z]{2,} [A-Za-z]{2,} [A-Za-z]{2,}[^"'`<>{}]*(["'`<]|$)/;
const COMMENT = /^\s*(\/\/|\/?\*|\{\/\*)/;

/** Did this diff change words a visitor reads, in this language? */
function touchesCopy(diff, lang) {
  return diff
    .split("\n")
    .filter((l) => (l.startsWith("+") || l.startsWith("-")) && !l.startsWith("+++") && !l.startsWith("---"))
    .map((l) => l.slice(1))
    .filter((l) => !COMMENT.test(l))
    .some((l) => (lang === "he" ? HEBREW.test(l) : ENGLISH_COPY.test(l)));
}

/** Last date a page component's visible copy changed, newest commit first. */
const componentCache = new Map();
function componentCopyDate(file, lang) {
  const key = `${file}|${lang}`;
  if (componentCache.has(key)) return componentCache.get(key);
  let found = null;
  const commits = git(["log", "--format=%H %cs", "--", file]).split("\n").filter(Boolean);
  for (const line of commits) {
    const [hash, date] = line.split(" ");
    const diff = git(["show", "--format=", "-U0", "-w", hash, "--", file]); // -w: re-indenting copy is not a change
    if (touchesCopy(diff, lang)) {
      found = date;
      break;
    }
  }
  componentCache.set(key, found);
  return found;
}

/** Map of route path -> YYYY-MM-DD, for every route whose sources have history. Empty in a shallow clone. */
export function lastmodByRoute(routes) {
  const out = new Map();
  if (!historyAvailable()) {
    console.warn("lastmod: shallow or missing git history - sitemap written without <lastmod> for app pages");
    return out;
  }
  const routeFiles = appRouteFiles();
  for (const r of routes) {
    const dates = sourcesFor(r, routeFiles)
      .map((src) =>
        src.startsWith("src" + path.sep) || src.startsWith("src/")
          ? componentCopyDate(src, r.lang)
          : git(["log", "-1", "--format=%cs", "--", src]),
      )
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || ""));
    if (dates.length) out.set(r.path, dates.sort().at(-1));
  }
  return out;
}
