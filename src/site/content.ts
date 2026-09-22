/**
 * Content loader for the site pages (home, about, articles, events, ...).
 *
 * All site content lives in /content/<lang>/... as markdown files with a
 * simple one-level frontmatter block (see content/README.md for the editing
 * guide). Files are bundled at build time via import.meta.glob, so a content
 * edit is a normal commit + build - no CMS, no runtime fetching.
 *
 * Frontmatter format intentionally supports ONLY `key: value` string pairs
 * (quotes optional). Nested YAML is not supported - keep content flat.
 */

import { parseFrontmatter } from "./frontmatter";

export type SiteLang = "he" | "en";

/** The site's public origin - used for canonical URLs, hreflang and structured data. */
export const SITE_ORIGIN = "https://maitreya.org.il";

/**
 * Builds the in-app path for a site page in a language.
 * URL scheme (decided at the domain cutover, 2026-09-05): Hebrew is the
 * primary language and lives UNPREFIXED at the root ("/", "/about",
 * "/articles/<slug>"); English lives under "/en" ("/en", "/en/about").
 * Every link in the site chrome and pages goes through here, so the scheme
 * is a one-line change if it ever needs to move.
 *
 * @example sitePath("he", "/about") -> "/about"; sitePath("en", "") -> "/en"
 */
export function sitePath(lang: SiteLang, sub: string = ""): string {
  const clean = sub === "/" ? "" : sub;
  if (lang === "he") return clean || "/";
  return `/en${clean}`;
}

/** Sub-paths that exist in BOTH languages (gallery and the articles themselves are Hebrew-only today). */
export const BILINGUAL_PAGES = ["", "/about", "/events", "/articles", "/dana", "/contact"];

/** The same page in the other language, or null when it has no twin there. */
export function twinPath(lang: SiteLang, sub: string): string | null {
  const clean = sub === "/" ? "" : sub;
  if (!BILINGUAL_PAGES.includes(clean)) return null;
  const other: SiteLang = lang === "he" ? "en" : "he";
  return sitePath(other, clean);
}

export interface PageContent {
  /** Flat frontmatter fields; missing keys read as "". */
  meta: Record<string, string>;
  /** Markdown body after the frontmatter block. */
  body: string;
}

export interface ArticleItem extends PageContent {
  slug: string;
  title: string;
  date: string;
  description: string;
}

export interface EventItem {
  slug: string;
  title: string;
  /** ISO dates from frontmatter. */
  start: string;
  end: string;
  location: string;
  teacher: string;
  summary: string;
  /** Optional link to a landing page (in-app path or full URL). */
  url: string;
  /** Optional picture (public path under /media/), shown on the homepage card and the events row. */
  image: string;
}

const files = import.meta.glob("/content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function parse(raw: string): PageContent {
  const { meta, body } = parseFrontmatter(raw);
  return { meta, body };
}

function filesUnder(prefix: string): Array<{ slug: string; content: PageContent }> {
  return Object.entries(files)
    .filter(([path]) => path.startsWith(prefix))
    .map(([path, raw]) => ({
      slug: path.slice(prefix.length).replace(/\.md$/, ""),
      content: parse(raw),
    }));
}

/** A single page file, e.g. getPage("he", "home"). Returns empty content if missing. */
export function getPage(lang: SiteLang, name: string): PageContent {
  const raw = files[`/content/${lang}/pages/${name}.md`];
  return raw ? parse(raw) : { meta: {}, body: "" };
}

/** All articles for a language, newest first. */
export function getArticles(lang: SiteLang): ArticleItem[] {
  return filesUnder(`/content/${lang}/articles/`)
    .map(({ slug, content }) => ({
      ...content,
      slug,
      title: content.meta.title ?? "",
      date: content.meta.date ?? "",
      description: content.meta.description ?? "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** A single article by slug, or null. */
export function getArticle(lang: SiteLang, slug: string): ArticleItem | null {
  return getArticles(lang).find((a) => a.slug === slug) ?? null;
}

function toEvent({ slug, content }: { slug: string; content: PageContent }): EventItem {
  return {
    slug,
    title: content.meta.title ?? "",
    start: content.meta.start ?? "",
    end: content.meta.end ?? content.meta.start ?? "",
    location: content.meta.location ?? "",
    teacher: content.meta.teacher ?? "",
    summary: content.meta.summary ?? "",
    url: content.meta.url ?? "",
    image: content.meta.image ?? "",
  };
}

/**
 * Events split into upcoming (end >= today) and past (latest first).
 *
 * Upcoming puts everything that has NOT started yet first, soonest first, and
 * anything already under way after it (Shahaf, 2026-09-16 - the Death and Dying
 * series, six Sundays that began on 13.9, was sitting above the December
 * retreats on both the home page and the events page).
 *
 * The reasoning is what a visitor can act on: a course you can still book from
 * the beginning belongs above one that is halfway through. It is derived from
 * the dates rather than pinned per event, so it keeps holding as events come
 * and go - nothing to remember in December.
 *
 * Used by SiteHome and SiteEventsIndex, so both surfaces stay in one order.
 */
export function getEvents(lang: SiteLang): { upcoming: EventItem[]; past: EventItem[] } {
  const today = new Date().toISOString().slice(0, 10);
  const all = filesUnder(`/content/${lang}/events/`).map(toEvent);
  const started = (e: EventItem) => e.start <= today;
  return {
    upcoming: all
      .filter((e) => e.end >= today)
      .sort((a, b) =>
        started(a) !== started(b)
          ? Number(started(a)) - Number(started(b))
          : a.start.localeCompare(b.start),
      ),
    past: all.filter((e) => e.end < today).sort((a, b) => b.start.localeCompare(a.start)),
  };
}

/**
 * Format an ISO date range for display: "1-6.6.2026" in Hebrew, and
 * "June 1-6, 2026" in English. A numeric range like 2-4.12.2026 reads as a typo
 * to an English reader, and these ranges now carry the cards on the English
 * retreat pages, not only the events list.
 */
export function formatEventDates(ev: EventItem, lang: SiteLang): string {
  if (!ev.start) return "";
  const s = new Date(ev.start + "T00:00:00");
  const e = new Date((ev.end || ev.start) + "T00:00:00");
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const locale = lang === "he" ? "he-IL" : "en-US";
  if (ev.start === ev.end || !ev.end) {
    return s.toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (lang === "en") {
    const month = (d: Date) => d.toLocaleDateString(locale, { month: "long" });
    return sameMonth
      ? `${month(s)} ${s.getDate()}-${e.getDate()}, ${e.getFullYear()}`
      : `${month(s)} ${s.getDate()} - ${month(e)} ${e.getDate()}, ${e.getFullYear()}`;
  }
  if (sameMonth) {
    return `${s.getDate()}-${e.getDate()}.${s.getMonth() + 1}.${s.getFullYear()}`;
  }
  return `${s.getDate()}.${s.getMonth() + 1} - ${e.getDate()}.${e.getMonth() + 1}.${e.getFullYear()}`;
}
