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

export type SiteLang = "he" | "en";

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
}

const files = import.meta.glob("/content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function parse(raw: string): PageContent {
  const meta: Record<string, string> = {};
  let body = raw;
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (match) {
    body = raw.slice(match[0].length);
    for (const line of match[1].split("\n")) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key) meta[key] = value;
    }
  }
  return { meta, body: body.trim() };
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
  };
}

/** Events split into upcoming (end >= today, soonest first) and past (latest first). */
export function getEvents(lang: SiteLang): { upcoming: EventItem[]; past: EventItem[] } {
  const today = new Date().toISOString().slice(0, 10);
  const all = filesUnder(`/content/${lang}/events/`).map(toEvent);
  return {
    upcoming: all.filter((e) => e.end >= today).sort((a, b) => a.start.localeCompare(b.start)),
    past: all.filter((e) => e.end < today).sort((a, b) => b.start.localeCompare(a.start)),
  };
}

/** Format an ISO date range for display, e.g. "1-6.6.2026" / "28-30.5.2026". */
export function formatEventDates(ev: EventItem, lang: SiteLang): string {
  if (!ev.start) return "";
  const s = new Date(ev.start + "T00:00:00");
  const e = new Date((ev.end || ev.start) + "T00:00:00");
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (ev.start === ev.end || !ev.end) {
    return s.toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (sameMonth) {
    return `${s.getDate()}-${e.getDate()}.${s.getMonth() + 1}.${s.getFullYear()}`;
  }
  return `${s.getDate()}.${s.getMonth() + 1} - ${e.getDate()}.${e.getMonth() + 1}.${e.getFullYear()}`;
}
