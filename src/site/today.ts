/**
 * "Today" for content that switches itself on or off by date.
 *
 * Every date in the content files and in the pages' structured data is an
 * Israel local date, so the comparison has to be made in Israel time - not in
 * UTC, which is three hours behind in summer and would flip a retreat over a
 * day late for anyone browsing in the evening.
 */

/** Today in Israel as YYYY-MM-DD. */
export const todayInIsrael = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

/**
 * Has an event with this end date finished?
 *
 * Accepts a plain date ("2026-05-30") or a full timestamp
 * ("2026-05-30T16:00:00+03:00") - the pages carry both forms in their
 * structured data. The day itself still counts as running.
 *
 * An unreadable date reads as NOT ended. This is the deliberate direction to
 * fail in: leaving a finished page open is untidy, but closing a live retreat's
 * registration because of a typo in a date would cost real registrations.
 */
export const hasEnded = (endDate: string, today = todayInIsrael()) => {
  const day = String(endDate ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  return today > day;
};
