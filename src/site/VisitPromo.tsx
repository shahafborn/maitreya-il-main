/**
 * The "current visit" box that sits inside articles.
 *
 * One source of truth: content/<lang>/pages/visit-promo.md. Articles carry the
 * marker [[visit-promo]] on a line of its own (see Markdown.tsx), so when a
 * visit ends there is ONE file to change, not a paragraph copy-pasted into
 * every article - which is exactly how six articles ended up still promoting
 * the November 2025 visit.
 *
 * It removes itself. The file's `until` date is the visit's last day; from the
 * day after, the box renders nothing at all. A stale promo is worse than none,
 * so a missing or unreadable `until` also hides it.
 */
import ReactMarkdown from "react-markdown";
import { getPage, type SiteLang } from "./content";
import { todayInIsrael } from "./today";

export const isVisitPromoLive = (lang: SiteLang, today = todayInIsrael()) => {
  const until = String(getPage(lang, "visit-promo").meta.until ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(until) && today <= until;
};

/**
 * One sentence about the visit that is running, or null when none is.
 *
 * The retreat pages put it above their upcoming-events cards. It lives in the
 * same file as the box, under the same `until` date, so it disappears with the
 * visit instead of becoming a sentence about a visit that already happened.
 *
 * It is a sentence rather than the section's heading on purpose: the cards show
 * everything that is coming up, and not everything coming up belongs to a visit
 * (the Death and Dying course runs online, outside it). A heading naming the
 * visit would be making a claim about the cards underneath it.
 */
export const visitBlurb = (lang: SiteLang): string | null => {
  if (!isVisitPromoLive(lang)) return null;
  const blurb = String(getPage(lang, "visit-promo").meta.blurb ?? "").trim();
  return blurb || null;
};

export const VisitPromo = ({ lang }: { lang: SiteLang }) => {
  const { meta, body } = getPage(lang, "visit-promo");
  if (!isVisitPromoLive(lang) || !body.trim()) return null;
  return (
    <aside className="not-prose my-10 rounded-xl border border-accent/30 bg-accent/[0.06] p-6 md:p-7 shadow-sm">
      {meta.heading && (
        <h3 className="font-heading text-xl md:text-2xl font-bold text-primary mb-3 leading-snug">
          {meta.heading}
        </h3>
      )}
      {/*
        The box is `not-prose`, which switches OFF every prose rule for
        everything inside it - so the content is styled with plain utilities
        here. In particular the links need their own colour and underline:
        with prose disabled they would render as bold body text and not look
        clickable at all.
      */}
      <div className="font-body text-lg leading-relaxed text-foreground/90 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-5 [&_li]:my-1 [&_li]:marker:text-accent [&_a]:text-accent [&_a]:underline [&_a]:decoration-accent/50 [&_a]:underline-offset-4 [&_a:hover]:text-secondary [&_a:hover]:decoration-secondary">
        <ReactMarkdown>{body}</ReactMarkdown>
      </div>
    </aside>
  );
};

export default VisitPromo;
