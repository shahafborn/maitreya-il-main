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

/** Today in Israel as YYYY-MM-DD - the dates in the content files are local dates. */
const todayInIsrael = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export const isVisitPromoLive = (lang: SiteLang, today = todayInIsrael()) => {
  const until = String(getPage(lang, "visit-promo").meta.until ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(until) && today <= until;
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
      <div className="prose prose-lg max-w-none font-body prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-a:text-accent hover:prose-a:text-secondary [&_ul]:list-disc [&_ul]:ps-5 [&_li]:marker:text-accent">
        <ReactMarkdown>{body}</ReactMarkdown>
      </div>
    </aside>
  );
};

export default VisitPromo;
