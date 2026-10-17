/**
 * The photo card that promotes ONE upcoming retreat inside an article.
 *
 * Sister of VisitPromo (the text box about the whole visit), with the same
 * rules: one source of truth - content/<lang>/pages/retreat-promo.md - and
 * articles carry only the marker [[retreat-promo]] on a line of its own (see
 * Markdown.tsx). To point the card at the next retreat, edit that one file.
 *
 * It removes itself. The file's `until` date is the last day it makes sense to
 * invite people (the retreat's first day); from the day after, the card renders
 * nothing. A missing or unreadable `until` also hides it - a stale invitation is
 * worse than none.
 *
 * Fields (all frontmatter, all plain strings):
 *   eyebrow, heading  - small line above the title, and the title
 *   image, imageAlt   - a "/media/..." path and its description. Use a real
 *                       photo; AI-generated ones read as fake next to the
 *                       article's own photos (Shahaf, 2026-10-17).
 *   cta, href         - button text and where it goes
 *   until             - YYYY-MM-DD, Israel date
 * The body is one short paragraph of markdown.
 *
 * Layout: photo on the reading-start side (right in Hebrew), text beside it;
 * on phones the photo sits on top as a 2:1 strip.
 *
 * @example
 *   // in an article .md, alone on its line:
 *   [[retreat-promo]]
 */
import ReactMarkdown from "react-markdown";
import { getPage, type SiteLang } from "./content";
import { todayInIsrael } from "./today";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Keep a number range like "6-12.12.2026" on one line: a word joiner on each
 * side of the hyphen stops the browser breaking there ("6-" / "12.12.2026"
 * in a narrow column). Word joiners are invisible and bidi-neutral, so the
 * range still reads correctly in Hebrew - and the content file stays plain.
 */
const keepRangesTogether = (text: string) => text.replace(/(\d)-(?=\d)/g, "$1\u2060-\u2060");

const resolveSrc = (src: string) =>
  src.startsWith("/media/") ? import.meta.env.BASE_URL + src.slice(1) : src;

export const isRetreatPromoLive = (lang: SiteLang, today = todayInIsrael()) => {
  const until = String(getPage(lang, "retreat-promo").meta.until ?? "").trim();
  return DATE_RE.test(until) && today <= until;
};

export const RetreatPromo = ({ lang }: { lang: SiteLang }) => {
  const { meta, body } = getPage(lang, "retreat-promo");
  if (!isRetreatPromoLive(lang)) return null;
  const s = (k: string) => String(meta[k] ?? "").trim();
  const href = s("href");
  const cta = s("cta");
  const image = s("image");
  if (!s("heading") || !href) return null;
  return (
    <aside className="not-prose my-10 grid overflow-hidden rounded-xl border border-border bg-card shadow-sm md:grid-cols-[42%_1fr]">
      {image && (
        <img
          src={resolveSrc(image)}
          alt={s("imageAlt")}
          loading="lazy"
          className="block h-full w-full aspect-[2/1] object-cover md:aspect-auto md:min-h-[220px]"
        />
      )}
      <div className="flex flex-col justify-center p-6 md:p-7">
        {s("eyebrow") && (
          <p className="font-body text-sm font-medium text-accent mb-1">{s("eyebrow")}</p>
        )}
        <h3 className="font-heading text-xl md:text-2xl font-bold text-primary mb-2 leading-snug">
          {s("heading")}
        </h3>
        {/* not-prose switches the prose rules off, so the body gets plain utilities. */}
        <div className="font-body text-base md:text-lg leading-relaxed text-foreground/90 mb-4 [&_p]:my-0">
          <ReactMarkdown>{keepRangesTogether(body)}</ReactMarkdown>
        </div>
        <a
          href={href}
          className="self-start rounded-lg bg-accent px-5 py-2.5 font-body font-medium text-accent-foreground no-underline transition-colors hover:bg-secondary"
        >
          {cta || href}
        </a>
      </div>
    </aside>
  );
};

export default RetreatPromo;
