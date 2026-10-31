import { todayInIsrael } from "@/site/today";
import { RETREAT_THEME } from "./theme";

/**
 * Whole days from today to the retreat's first day, both as Israel dates.
 *
 * Takes the page's structured-data `startDate` (a plain date or a full
 * timestamp - only the date part is read), so the badge moves with the page's
 * one source of truth for the date. Returns null when the badge should not
 * show: on the first day itself, after it, or when the date is unreadable.
 * Hiding on the first day is deliberate - "0 days" reads as a mistake, and by
 * then the people coming are already on their way.
 *
 * @example
 *   retreatDaysLeft("2026-12-06T12:00:00+02:00", "2026-10-31") // 36
 *   retreatDaysLeft("2026-12-06T12:00:00+02:00", "2026-12-06") // null
 */
export const retreatDaysLeft = (startDate: string, today = todayInIsrael()): number | null => {
  const day = String(startDate ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const days = Math.round((Date.parse(day + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86_400_000);
  return days >= 1 ? days : null;
};

interface CountdownBadgeProps {
  /** The page's eventJsonLd.startDate. */
  startDate: string;
  lang: "he" | "en";
  /** Opens registration. */
  onClick: () => void;
}

/**
 * "עוד N ימים לריטריט" - the round navy-and-gold countdown badge on a December
 * 2026 retreat hero (Shahaf, 31.10.2026, option A of three mockups). Same look
 * as the Six Yogas early-bird badge, same corner of the picture, and a click
 * opens registration. It renders nothing once retreatDaysLeft() says so, so
 * there is nothing to switch off by hand.
 *
 * Pre-render note: the static HTML carries the number of the build day, but the
 * app mounts with createRoot (not hydrate) and recomputes it on load, so a
 * visitor always sees today's count.
 *
 * Place it inside a `relative` hero section (RetreatHero takes it as `badge`).
 *
 * @example
 *   <CountdownBadge startDate={eventJsonLd.startDate} lang="he" onClick={() => open()} />
 */
export const CountdownBadge = ({ startDate, lang, onClick }: CountdownBadgeProps) => {
  const days = retreatDaysLeft(startDate);
  if (days === null) return null;
  const he = lang === "he";
  const top = he ? "עוד" : "Starts in";
  const bottom = he ? (days === 1 ? "יום לריטריט" : "ימים לריטריט") : days === 1 ? "day" : "days";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={he ? `עוד ${days} ${bottom} - להרשמה` : `The retreat starts in ${days} ${bottom} - register`}
      className="absolute top-2 left-3 md:top-8 md:left-8 z-10 flex h-[108px] w-[108px] md:h-[150px] md:w-[150px] flex-col items-center justify-center rounded-full text-center text-white transition-transform duration-200 hover:scale-105"
      style={{
        backgroundColor: "#14234A",
        border: `2px solid ${RETREAT_THEME.GOLD}`,
        boxShadow: `0 6px 18px rgba(0,0,0,0.35), inset 0 0 0 5px #14234A, inset 0 0 0 6px rgba(201,169,97,0.7)`,
        lineHeight: 1.1,
      }}
    >
      <span className="text-[10px] md:text-sm font-bold">{top}</span>
      <span
        className="text-[2.1rem] md:text-5xl font-black tabular-nums"
        style={{ color: RETREAT_THEME.GOLD, fontFamily: "'Frank Ruhl Libre', serif" }}
      >
        {days}
      </span>
      <span
        className="whitespace-nowrap border-t pt-0.5 text-[10px] md:text-sm font-medium"
        style={{ borderColor: "rgba(201,169,97,0.6)" }}
      >
        {bottom}
      </span>
    </button>
  );
};
