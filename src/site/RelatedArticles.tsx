/**
 * "מאמרים נוספים" - the box at the very end of an article that suggests two or
 * three other articles (design B of the 31.10.2026 mockups, Shahaf's pick: one
 * white frame with a gold top line, a row per article - small picture, title,
 * two lines of description).
 *
 * Which articles: an article can choose them itself with a frontmatter line
 *   related: six-yogas-naropa-tantric-theater-inner-fire, dream-yoga-solo-retreat-lama-glenn
 * (slugs, comma-separated, in the order to show). Otherwise they are picked
 * automatically by topic (TOPICS below, matched against title + description),
 * newest first among equally close matches, topped up with the newest articles
 * when too few share a topic - so every article shows three. A new article is suggested and
 * gets its own suggestions without anyone touching this file; add a topic
 * here only when a new subject appears.
 *
 * Never suggested: the article itself, a post whose `canonical` points to a
 * fuller version of the same talk (Google indexes the other one), and a post
 * with no picture at all (the row would look broken).
 */
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getArticles, sitePath, type ArticleItem, type SiteLang } from "./content";

const MAX = 3;

/** Topic -> words that mark it (Hebrew, as they appear in titles and descriptions). */
const TOPICS: Record<string, string[]> = {
  sixYogas: ["שש היוגות", "ששת היוגות", "נארופה", "ניגומה", "טומו", "האש הפנימית", "יוגת החלום", "חלום", "הגוף האשלייתי", "האור הצלול", "קארמהמודרה"],
  tantra: ["טנטר"],
  chulen: ["צ׳ולן", "צ'ולן", "צ'ו לן", "תזונה"],
  healing: ["ריפוי", "מילארפה"],
  deadSea: ["ים המלח"],
  dharamsala: ["דהרמסלה", "הדלאי למה"],
  death: ["מוות", "ברדו", "פוואה"],
  bodhisattva: ["בודהיסטווה", "חמלה"],
  retreat: ["ריטריט"],
};

const topicsOf = (a: ArticleItem) => {
  const text = `${a.title} ${a.description}`;
  return new Set(Object.keys(TOPICS).filter((t) => TOPICS[t].some((w) => text.includes(w))));
};

/** The first picture inside the article (free of the share card's title strip), else the share image. */
export const pictureOf = (a: ArticleItem) => a.body.match(/!\[[^\]]*\]\((\/media\/[^\s)]+)/)?.[1] || a.image;

/**
 * Title up to the first " - " ("שש היוגות של נארופה - לאמה גלן..." -> "שש היוגות של נארופה"),
 * or up to a question mark that ends the first part ("איך מחליטים...? לאמה גלן על..." -> "איך מחליטים...?").
 */
export const shortTitle = (title: string) => {
  const head = title.split(" - ")[0].trim();
  const q = head.indexOf("? ");
  return q > 0 ? head.slice(0, q + 1) : head;
};

const resolveSrc = (src: string) => (src.startsWith("/media/") ? import.meta.env.BASE_URL + src.slice(1) : src);

export function getRelated(lang: SiteLang, slug: string, max = MAX): ArticleItem[] {
  const all = getArticles(lang);
  const self = all.find((a) => a.slug === slug);
  if (!self) return [];
  const candidates = all.filter((a) => a.slug !== slug && !a.canonical && pictureOf(a));

  const chosen = String(self.meta.related ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (chosen.length) {
    return chosen.map((s) => candidates.find((a) => a.slug === s)).filter((a): a is ArticleItem => !!a).slice(0, max);
  }

  // Closest topics first; when fewer than `max` share a topic, fill up with the
  // newest articles (getArticles is already newest first, and sort is stable).
  const mine = topicsOf(self);
  return candidates
    .map((a) => ({ a, score: [...topicsOf(a)].filter((t) => mine.has(t)).length }))
    .sort((x, y) => y.score - x.score)
    .slice(0, max)
    .map(({ a }) => a);
}

export const RelatedArticles = ({ lang, slug }: { lang: SiteLang; slug: string }) => {
  const related = getRelated(lang, slug);
  if (related.length === 0) return null;
  const he = lang === "he";
  const Chevron = he ? ChevronLeft : ChevronRight;
  return (
    <section className="mt-12 bg-card border border-border border-t-[3px] border-t-accent rounded-lg px-5 sm:px-6 pt-5 pb-1">
      <h2 className="font-heading text-2xl font-bold text-primary mb-1">{he ? "מאמרים נוספים" : "More articles"}</h2>
      {related.map((a) => (
        <Link
          key={a.slug}
          to={sitePath(lang, `/articles/${a.slug}`)}
          className="group flex items-center gap-4 py-4 border-t border-muted first-of-type:border-t-0"
        >
          <img
            src={resolveSrc(pictureOf(a))}
            alt=""
            loading="lazy"
            className="w-[84px] sm:w-28 aspect-[4/3] object-cover object-top rounded-md shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-base sm:text-lg font-bold text-primary leading-snug mb-1 group-hover:text-accent transition-colors">
              {shortTitle(a.title)}
            </h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-2">{a.description}</p>
          </div>
          <Chevron className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
        </Link>
      ))}
    </section>
  );
};
