/**
 * Locale-aware date formatting helper for retreat landing pages.
 * Kept intentionally tiny - we don't need a full i18n framework for
 * a handful of static landing pages.
 */

export type Locale = "he-IL" | "en-US";

/** Returns a long date like "יום חמישי, 28 במאי 2026" or "Thursday, May 28, 2026". */
export function formatLongDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Returns a compact range, e.g. "28-30 במאי 2026". English callers should pass their own range string. */
export function formatMonthRange(
  startDay: number,
  endDay: number,
  monthName: string,
  year: number,
  locale: Locale,
): string {
  if (locale === "he-IL") return `${startDay}-${endDay} ב${monthName} ${year}`;
  return `${monthName} ${startDay}-${endDay}, ${year}`;
}
