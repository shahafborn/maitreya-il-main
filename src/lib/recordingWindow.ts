/**
 * Availability window for course recordings (course_recordings.available_until).
 *
 * NULL / missing = no limit. The column may not exist yet on a given database,
 * so every helper here treats undefined exactly like null.
 */

const ISRAEL_TZ = "Asia/Jerusalem";

/** Parse available_until into epoch ms, or null when there is no (valid) limit. */
export function availableUntilMs(availableUntil: string | null | undefined): number | null {
  if (!availableUntil) return null;
  const ms = Date.parse(availableUntil);
  // An unparseable value fails open: better to show the player than hide it by mistake.
  return Number.isNaN(ms) ? null : ms;
}

/** True once the window has closed (now >= available_until). */
export function isRecordingClosed(
  availableUntil: string | null | undefined,
  now: number
): boolean {
  const until = availableUntilMs(availableUntil);
  return until !== null && now >= until;
}

function parts(ms: number, locale: string, options: Intl.DateTimeFormatOptions) {
  const out: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat(locale, { timeZone: ISRAEL_TZ, ...options }).formatToParts(ms)) {
    out[p.type] = p.value;
  }
  return out;
}

/**
 * The small "available until" line shown under a recording's title while the
 * window is still open. Israel time, 24h clock.
 *  rtl: "זמינה לצפייה עד שבת 3.10 בשעה 20:00"
 *  ltr: "Available until Sat 3 Oct, 20:00 Israel time"
 */
export function formatAvailableUntil(availableUntil: string, dir: "ltr" | "rtl"): string {
  const ms = availableUntilMs(availableUntil);
  if (ms === null) return "";
  const time = parts(ms, "en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const hhmm = `${time.hour}:${time.minute}`;

  if (dir === "rtl") {
    const he = parts(ms, "he-IL", { weekday: "long", day: "numeric", month: "numeric" });
    // he-IL gives "יום שבת"; the line reads better with just "שבת".
    const weekday = he.weekday.replace(/^יום\s+/, "");
    return `זמינה לצפייה עד ${weekday} ${he.day}.${he.month} בשעה ${hhmm}`;
  }

  // en-US for the short month ("Sep", not en-GB's "Sept").
  const en = parts(ms, "en-US", { weekday: "short", day: "numeric", month: "short" });
  return `Available until ${en.weekday} ${en.day} ${en.month}, ${hhmm} Israel time`;
}
