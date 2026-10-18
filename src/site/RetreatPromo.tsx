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
 *   teacher, teacherNote, teacherImage - the teacher's name, a second line
 *                       under it, and a small round photo
 *   note              - a short line above the button ("places are limited")
 *   countdownDays     - show a "N days to the retreat" badge on the picture
 *                       only in the last N days before `until` (empty = never)
 *   reminderHeading, reminderText - the end-of-article card (RetreatReminder)
 *   image, imageAlt   - a "/media/..." path and its description. Use a real
 *                       photo; AI-generated ones read as fake next to the
 *                       article's own photos (Shahaf, 2026-10-17). The
 *                       retreat poster's painting is the exception - it is
 *                       art, and the most eye-catching (Shahaf, 18.10).
 *   cta, href         - button text and where it goes
 *   until             - YYYY-MM-DD, Israel date
 * The body is one short paragraph of markdown.
 *
 * Layout: picture on the reading-start side (right in Hebrew), half the card,
 * text beside it, gold frame; on phones the picture sits on top as a 16:9 strip.
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

/** Whole days from today to the retreat's first day (Israel dates). */
export const daysUntil = (until: string, today = todayInIsrael()) =>
  Math.round((Date.parse(until + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86_400_000);

const Teacher = ({ name, note, image }: { name: string; note: string; image: string }) =>
  name ? (
    <div className="flex items-center gap-3 mb-3">
      {image && (
        <img
          src={resolveSrc(image)}
          alt=""
          loading="lazy"
          className="h-12 w-12 shrink-0 rounded-full border-2 border-accent object-cover"
        />
      )}
      <div className="leading-tight">
        <p className="font-body text-base font-bold text-primary">{name}</p>
        {note && <p className="font-body text-sm text-foreground/75">{note}</p>}
      </div>
    </div>
  ) : null;

const buttonClass =
  "self-start rounded-lg bg-accent px-6 py-3 font-body text-base md:text-lg font-medium text-accent-foreground no-underline shadow-md transition-colors hover:bg-secondary";

export const RetreatPromo = ({ lang }: { lang: SiteLang }) => {
  const { meta, body } = getPage(lang, "retreat-promo");
  if (!isRetreatPromoLive(lang)) return null;
  const s = (k: string) => String(meta[k] ?? "").trim();
  const href = s("href");
  const cta = s("cta");
  const image = s("image");
  if (!s("heading") || !href) return null;
  // The countdown only appears in the last `countdownDays` days (Shahaf: from
  // 30 days before), so it reads as urgency, not as a distant number.
  const days = daysUntil(s("until"));
  const showCountdown = days >= 1 && days <= Number(s("countdownDays") || 0);
  const he = lang === "he";
  return (
    <aside className="not-prose my-12 grid overflow-hidden rounded-2xl border-2 border-accent bg-[#fffdf8] shadow-[0_10px_30px_hsl(38_60%_40%/0.18)] md:grid-cols-[52%_1fr]">
      {image && (
        <div className="relative">
          <img
            src={resolveSrc(image)}
            alt={s("imageAlt")}
            loading="lazy"
            className="block h-full w-full aspect-[16/9] object-cover object-[28%_center] md:aspect-auto md:min-h-[340px]"
          />
          {showCountdown && (
            <div className="absolute top-4 start-4 rounded-xl bg-accent px-4 py-2 text-center text-accent-foreground shadow-lg">
              <span className="block font-heading text-3xl font-black leading-none">{days}</span>
              <span className="font-body text-sm">{he ? (days === 1 ? "יום לריטריט" : "ימים לריטריט") : days === 1 ? "day to go" : "days to go"}</span>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col justify-center p-6 md:p-7">
        {s("eyebrow") && (
          <p className="font-body text-sm font-bold text-accent mb-1">{keepRangesTogether(s("eyebrow"))}</p>
        )}
        <h3 className="font-heading text-3xl md:text-4xl font-black text-primary mb-4 leading-tight">
          {s("heading")}
        </h3>
        <Teacher name={s("teacher")} note={s("teacherNote")} image={s("teacherImage")} />
        {/* not-prose switches the prose rules off, so the body gets plain utilities. */}
        <div className="font-body text-base md:text-lg leading-relaxed text-foreground/90 mb-3 [&_p]:my-0">
          <ReactMarkdown>{keepRangesTogether(body)}</ReactMarkdown>
        </div>
        {s("note") && <p className="font-body text-sm font-medium text-[hsl(0_60%_42%)] mb-4">{s("note")}</p>}
        <a href={href} className={buttonClass}>
          {cta || href}
        </a>
      </div>
    </aside>
  );
};

/**
 * The smaller sister card for the END of an article - same painting, gold
 * frame and button, so readers recognise it; its own heading (reminderHeading)
 * and one line (reminderText). Articles place it with [[retreat-reminder]],
 * normally after the last paragraph. Same `until` rule: hides itself after.
 */
export const RetreatReminder = ({ lang }: { lang: SiteLang }) => {
  const { meta } = getPage(lang, "retreat-promo");
  if (!isRetreatPromoLive(lang)) return null;
  const s = (k: string) => String(meta[k] ?? "").trim();
  const href = s("href");
  const heading = s("reminderHeading") || s("heading");
  if (!heading || !href) return null;
  const image = s("image");
  return (
    <aside className="not-prose my-12 grid overflow-hidden rounded-2xl border-2 border-accent bg-[#fffdf8] shadow-[0_8px_24px_hsl(38_60%_40%/0.15)] sm:grid-cols-[170px_1fr]">
      {image && (
        <img
          src={resolveSrc(image)}
          alt=""
          loading="lazy"
          className="block h-36 w-full object-cover object-[22%_center] sm:h-full sm:min-h-[170px]"
        />
      )}
      <div className="flex flex-col justify-center gap-1.5 p-5 md:px-6">
        {s("eyebrow") && (
          <p className="font-body text-sm font-bold text-accent">{keepRangesTogether(s("eyebrow"))}</p>
        )}
        <h3 className="font-heading text-2xl md:text-[1.7rem] font-black text-primary leading-snug">{heading}</h3>
        {s("reminderText") && (
          <p className="font-body text-base text-foreground/90 mb-2">{keepRangesTogether(s("reminderText"))}</p>
        )}
        <a href={href} className={buttonClass.replace("px-6 py-3", "px-5 py-2.5").replace(" md:text-lg", "")}>
          {s("cta") || href}
        </a>
      </div>
    </aside>
  );
};

export default RetreatPromo;
