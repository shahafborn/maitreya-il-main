/**
 * Weekly Practices Schedule (Hebrew / RTL)
 * ========================================
 *
 * Public page presenting Maitreya Sangha Israel's recurring weekly Zoom
 * practice schedule. Adapted from the 1080x1080 "Practice Schedule HE"
 * design canvas into a responsive web page:
 *   - Desktop (lg+): timetable grid (day rows x morning/afternoon/evening).
 *   - Mobile: each day stacks into a card list, one block per session.
 *
 * Brand: Frank Ruhl Libre (headings) + Heebo (body), cream background,
 * category-colored session cards (basic / healing / highest-tantra / tummo).
 */

import { useEffect } from "react";
import { MousePointerClick } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import maitreyaLogo from "@/assets/maitreya-logo.png";

/** Shared Zoom room for all weekly practice sessions. */
const ZOOM_URL = "https://us06web.zoom.us/j/89734429077?pwd=kd2gA4sJBXsnb8voZQmbOieqiExIQ4.1";

/* ── Brand palette (from the approved design canvas) ── */
const COLORS = {
  pageBg: "#EEEAE4",
  cardBg: "#FAF8F5",
  ink: "#1A1A1A",
  muted: "#6B635A",
  border: "#E4DED5",
  time: "#6E665C",
  title: "#26221C",
  subtitle: "#827A71",
  altPrefix: "#968C82",
  periodTime: "#8C8279",
  footerLine: "#D4CFC7",
  splitBg: "#F1F0E9",
  beginnerBg: "#F5EEE0",
  beginnerText: "#A47A22",
} as const;

type CategoryKey = "basic" | "healing" | "tantra" | "tummo";

const CATEGORY: Record<
  CategoryKey,
  { label: string; bar: string; bg: string; legendText: string }
> = {
  basic: { label: "בסיסי", bar: "#C15C86", bg: "#F8EAF1", legendText: "#9A3E68" },
  healing: { label: "ריפוי", bar: "#4D8A6A", bg: "#E8F0EC", legendText: "#36614A" },
  tantra: { label: "יוגה טנטרה עליונה", bar: "#B8860B", bg: "#F7EEDA", legendText: "#8C6410" },
  tummo: { label: "טומו", bar: "#C06A30", bg: "#F6E9DD", legendText: "#964E20" },
};

const HEALING_PILL = { bg: "#E1EEE7", text: "#36614A" };

/* ── Schedule data ── */
interface Session {
  time: string;
  title: string;
  subtitle?: string;
  altPrefix?: string;
  altTitle?: string;
  categories: CategoryKey[];
  beginner?: boolean;
  /** Overrides the shared Zoom room (e.g. a course with its own room/page). */
  url?: string;
}

const PERIODS = [
  { key: "morning", label: "בוקר", range: "07-11" },
  { key: "afternoon", label: "אחר הצהריים", range: "16-18" },
  { key: "evening", label: "ערב", range: "20-21" },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];
type DayRow = { day: string } & Record<PeriodKey, Session[]>;

const SCHEDULE: DayRow[] = [
  {
    day: "ראשון",
    morning: [{ time: "07-08", title: "חמשת הבודהות", categories: ["basic"], beginner: true }],
    afternoon: [{ time: "16-17", title: "טארה הירוקה", categories: ["basic"], beginner: true }],
    evening: [],
  },
  {
    day: "שני",
    morning: [{ time: "07-08", title: "טארה הלבנה", categories: ["healing"], beginner: true }],
    afternoon: [],
    evening: [{ time: "20-21", title: "טארה הלבנה", categories: ["healing"], beginner: true }],
  },
  {
    day: "שלישי",
    morning: [{ time: "07-08", title: "יאמנטקה", categories: ["tantra"] }],
    afternoon: [],
    evening: [{ time: "20-21", title: "טארה הלבנה", categories: ["healing"], beginner: true }],
  },
  {
    day: "רביעי",
    morning: [
      { time: "07-08", title: "אמיתאיוס", subtitle: "כולל טומו לריפוי", categories: ["healing", "tummo"] },
    ],
    afternoon: [],
    evening: [
      {
        // The White Manjushri -> Vajrapani-Hayagriva-Garuda handover was CANCELLED,
        // not rescheduled (Shahaf, 2026-08-12). White Manjushri continues open-ended
        // until the Sangha says otherwise, so this cell carries no end note and no
        // alternate. Do not re-add a handover without a confirmed date.
        time: "20-21",
        title: "מנג׳ושרי הלבן",
        categories: ["basic"],
        beginner: true,
      },
    ],
  },
  {
    day: "חמישי",
    morning: [],
    afternoon: [{ time: "16-17", title: "טומו (נארופה)", categories: ["tummo", "tantra"] }],
    evening: [{ time: "20-21", title: "וג׳ראיוגיני", categories: ["tantra"] }],
  },
  {
    day: "שבת",
    morning: [
      { time: "08-09", title: "יסודות הטומו", categories: ["tummo"], beginner: true },
      { time: "09-11", title: "טומו עם צ׳ונגוואל-לה", categories: ["tummo"], beginner: true },
    ],
    afternoon: [
      {
        time: "16-17:30",
        title: "מהמודרה עם לאמה גלן",
        subtitle: "עד 5.9",
        categories: ["basic"],
        url: "/p/events/uma-zub-tri",
      },
    ],
    evening: [],
  },
];

/* ── Per-week overrides ──────────────────────────────────────────────
 * The page shows the standing SCHEDULE above by default. A WeekOverride
 * temporarily REPLACES specific day/period cells for a date window, then
 * auto-reverts once that window passes (matched against the viewer's local
 * date) — no manual revert or redeploy needed.
 *
 * To change a given week (move/retime/add/remove sessions — e.g. shifting the
 * Saturday Tummo classes or changing Chongwol-la's time):
 *   1. Add an entry to WEEK_OVERRIDES with `from`/`to` (inclusive ISO dates).
 *   2. Under `days`, list each affected day; the periods you provide REPLACE
 *      that day's standing cells for the window (omit a period to keep it as-is,
 *      pass an empty array to clear it).
 *   3. Optional `note` renders a highlighted banner while the override is active.
 * Keep the Google Calendar in sync separately via
 * `sangha-gmail-api/scripts/create_practice_calendar.py` or a per-instance edit.
 * Past entries can be left in place (they simply stop matching) or pruned.
 * ──────────────────────────────────────────────────────────────────── */
interface WeekOverride {
  /** Inclusive ISO date (YYYY-MM-DD) the override starts showing. */
  from: string;
  /** Inclusive ISO date (YYYY-MM-DD) the override stops showing. */
  to: string;
  /** Optional highlighted banner shown while the override is active. */
  note?: string;
  /** Per-day period cells that replace the standing schedule for the window. */
  days: Partial<Record<string, Partial<Record<PeriodKey, Session[]>>>>;
}

const WEEK_OVERRIDES: WeekOverride[] = [
  {
    // This Saturday (2026-06-27) only: both Tummo sessions move to the afternoon.
    from: "2026-06-22",
    to: "2026-06-27",
    note: "שימו לב: השבוע תרגולי הטומו של שבת מתקיימים אחר הצהריים, ולא בבוקר.",
    days: {
      "שבת": {
        morning: [],
        afternoon: [
          { time: "14:30-15:30", title: "יסודות הטומו", categories: ["tummo"], beginner: true },
          { time: "15:30-17:30", title: "טומו עם צ׳ונגוואל-לה", categories: ["tummo"], beginner: true },
        ],
      },
    },
  },
  {
    // This Saturday (2026-08-08) only: Chongwol-la's Tummo moves to 14:00-15:30.
    // יסודות הטומו stays put in the morning; Lama Glenn's course is unchanged
    // (re-listed below because a provided period REPLACES the standing cell).
    from: "2026-08-08",
    to: "2026-08-08",
    note: "שימו לב: היום תרגול הטומו עם צ׳ונגוואל-לה מתקיים ב-14:00, ולא בבוקר.",
    days: {
      "שבת": {
        morning: [
          { time: "08-09", title: "יסודות הטומו", categories: ["tummo"], beginner: true },
        ],
        afternoon: [
          { time: "14-15:30", title: "טומו עם צ׳ונגוואל-לה", categories: ["tummo"], beginner: true },
          {
            time: "16-17:30",
            title: "מהמודרה עם לאמה גלן",
            subtitle: "עד 5.9",
            categories: ["basic"],
            url: "/p/events/uma-zub-tri",
          },
        ],
      },
    },
  },
  {
    // This Thursday (2026-08-13) ONLY: Tummo (Naropa) runs 07-08 in the morning
    // instead of 16-17 (Shahaf, 2026-08-12 - one week, not a standing change).
    // The standing schedule above stays 16-17, and the evening Vajrayogini is
    // untouched because an omitted period keeps its standing cell.
    from: "2026-08-12",
    to: "2026-08-13",
    note: "שימו לב: השבוע תרגול הטומו (נארופה) מתקיים בחמישי ב-07:00 בבוקר, ולא אחר הצהריים.",
    days: {
      "חמישי": {
        morning: [{ time: "07-08", title: "טומו (נארופה)", categories: ["tummo", "tantra"] }],
        afternoon: [],
      },
    },
  },
  {
    // This Saturday (2026-08-15) only, same shape as the 08-08 window above:
    // Chongwol-la is on New York time, so his Tummo runs 14:00-15:30 Israel
    // (= 07:00 NY). Confirmed by him on 2026-08-10.
    // Aug 22 and Aug 29 are NOT confirmed and deliberately get no override -
    // they fall back to the standing 09-11 until Shahaf has checked with him.
    from: "2026-08-14",
    to: "2026-08-15",
    note: "שימו לב: השבוע תרגול הטומו עם צ׳ונגוואל-לה מתקיים בשבת ב-14:00-15:30, ולא בבוקר.",
    days: {
      "שבת": {
        morning: [
          { time: "08-09", title: "יסודות הטומו", categories: ["tummo"], beginner: true },
        ],
        afternoon: [
          { time: "14:00-15:30", title: "טומו עם צ׳ונגוואל-לה", categories: ["tummo"], beginner: true },
          {
            time: "16-17:30",
            title: "מהמודרה עם לאמה גלן",
            subtitle: "עד 5.9",
            categories: ["basic"],
            url: "/p/events/uma-zub-tri",
          },
        ],
      },
    },
  },
  {
    // This weekend (2026-08-22 / 23) only. Chongwol-la's own schedule, sent
    // 2026-08-20 and cross-checked against the real offsets (NY = Israel -7,
    // Seoul = Israel +6) - all three of his zone conversions agree.
    //   Sat: Tummo foundations 09-10 (Shahaf), Chongwol-la's Tummo 10-11:30.
    //   Sun: Mahamudra clarification 15:00-16:30, and Green Tara moves 16:00 -> 20:30 (afternoon -> evening)
    //        for this week only (Shahaf, 2026-08-20).
    // ROOMS DIFFER THIS WEEKEND: Saturday's Tummo stays in the usual Israel
    // room (the page default), but the Sunday clarification is in Chongwol-la's
    // other room, so it carries an explicit `url`.
    // Tsewang - Healing Empowerment (Sat 14:00) is deliberately NOT listed: its
    // duration and room are unknown, and it is the only item in his message
    // without an "Israel" label, so it may not be an Israeli-sangha session.
    // Saturday afternoon is omitted so the standing Lama Glenn cell stays.
    from: "2026-08-22",
    to: "2026-08-23",
    note: "שימו לב: השבוע תרגולי הטומו של שבת מתקיימים שעה מאוחר יותר - יסודות הטומו ב-9:00 והטומו עם צ׳ונגוואל-לה ב-10:00. ביום ראשון מתקיים מפגש הבהרות עם צ׳ונגוואל-לה ב-15:00 בחדר זום אחר, וטארה הירוקה עוברת ל-20:30.",
    days: {
      "שבת": {
        morning: [
          { time: "09-10", title: "יסודות הטומו", categories: ["tummo"], beginner: true },
          { time: "10-11:30", title: "טומו עם צ׳ונגוואל-לה", categories: ["tummo"], beginner: true },
        ],
      },
      "ראשון": {
        afternoon: [
          {
            time: "15-16:30",
            title: "מהמודרה: מפגש הבהרות עם צ׳ונגוואל-לה",
            categories: ["basic"],
            url: "https://us02web.zoom.us/j/86757320677?pwd=aJi9zGfhOSQKmiuga60XFpzQeQ8VN6.1",
          },
        ],
        evening: [
          { time: "20:30-21:30", title: "טארה הירוקה", categories: ["basic"], beginner: true },
        ],
      },
    },
  },
  {
    // This Saturday (2026-08-29) only, per the schedule Shahaf sent the practice
    // group on 2026-08-28: both Tummo sessions run two hours later than standing
    // (10-11 and 11-12:30, the second one with Q&A), and a one-off mantra practice
    // for Nepal runs 13-15. Lama Glenn's course is unchanged at 16-17:30, re-listed
    // because a provided period REPLACES the standing cell.
    from: "2026-08-29",
    to: "2026-08-29",
    note: "שימו לב: היום תרגולי הטומו מתקיימים מאוחר יותר - יסודות הטומו ב-10:00 והטומו עם צ׳ונגוואל-לה ב-11:00. בנוסף, ב-13:00 מתקיים תרגול מנטרות למען נפאל והאנשים שנפגעו מהאסון.",
    days: {
      "שבת": {
        morning: [
          { time: "10-11", title: "יסודות הטומו", categories: ["tummo"], beginner: true },
          {
            time: "11-12:30",
            title: "טומו עם צ׳ונגוואל-לה",
            subtitle: "כולל שאלות ותשובות",
            categories: ["tummo"],
            beginner: true,
          },
        ],
        afternoon: [
          {
            time: "13-15",
            title: "תרגול מנטרות למען נפאל",
            subtitle: "למען הנפגעים מהאסון",
            categories: ["basic"],
          },
          {
            time: "16-17:30",
            title: "מהמודרה עם לאמה גלן",
            subtitle: "עד 5.9",
            categories: ["basic"],
            url: "/p/events/uma-zub-tri",
          },
        ],
      },
    },
  },
  {
    // Yamantaka retreat, 2026-09-01 to 2026-11-20 (Mon-Fri, Korea time). Its
    // third session runs 07:00-09:00 Israel time, which collides head-on with
    // the three 07-08 morning practices on Mon/Tue/Wed, so they are cleared for
    // the duration. Nothing else overlaps: the retreat's other sessions fall at
    // 01:30, 03:30, 09:30 and 13:00, and it does not run Sat/Sun, so the Sunday
    // and Saturday cells and every evening session stay as they are.
    // The window auto-reverts on 2026-11-21 - no manual undo needed.
    from: "2026-09-01",
    to: "2026-11-20",
    note: "בתקופת ריטריט יאמנטקה (1.9 עד 20.11) תרגולי הבוקר בימים שני, שלישי ורביעי אינם מתקיימים - הם חופפים למפגשי הריטריט. שאר התרגולים ממשיכים כרגיל.",
    days: {
      "שני": { morning: [] },
      "שלישי": { morning: [] },
      "רביעי": { morning: [] },
    },
  },
];

/** Local (viewer-timezone) ISO date, used to match override windows. */
function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Apply any active overrides on top of the standing schedule for `today`. */
function effectiveSchedule(today: Date): { schedule: DayRow[]; notes: string[] } {
  const iso = localISODate(today);
  const active = WEEK_OVERRIDES.filter((o) => iso >= o.from && iso <= o.to);
  if (active.length === 0) return { schedule: SCHEDULE, notes: [] };
  const schedule = SCHEDULE.map((row) => {
    let merged = row;
    for (const o of active) {
      const dayOv = o.days[row.day];
      if (dayOv) merged = { ...merged, ...dayOv };
    }
    return merged;
  });
  const notes = active.map((o) => o.note).filter((n): n is string => Boolean(n));
  return { schedule, notes };
}

/* ── Small building blocks ── */
function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold"
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
}

function SessionCard({ s }: { s: Session }) {
  const split = s.categories.length > 1;
  const bg = split ? COLORS.splitBg : CATEGORY[s.categories[0]].bg;
  const showHealingPill = s.categories.includes("healing");

  return (
    <a
      href={s.url ?? ZOOM_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={s.url && !s.url.includes("zoom.us") ? "לפרטי הקורס" : "הצטרפו למפגש בזום"}
      className="relative flex items-stretch overflow-hidden rounded-xl transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ background: bg }}
    >
      {/* Category color bar (split into stacked halves when two categories) */}
      <div className="flex w-1.5 shrink-0 flex-col">
        {s.categories.map((c) => (
          <div key={c} className="flex-1" style={{ background: CATEGORY[c].bar }} />
        ))}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1 px-3.5 py-2.5">
        {(showHealingPill || s.beginner) && (
          <div className="flex flex-wrap gap-1.5">
            {showHealingPill && (
              <Pill bg={HEALING_PILL.bg} color={HEALING_PILL.text}>
                ריפוי
              </Pill>
            )}
            {s.beginner && (
              <Pill bg={COLORS.beginnerBg} color={COLORS.beginnerText}>
                מתחילים
              </Pill>
            )}
          </div>
        )}

        <div className="text-sm font-bold" style={{ color: COLORS.time, direction: "ltr", textAlign: "right" }}>
          {s.time}
        </div>
        <div className="text-lg font-semibold leading-tight" style={{ color: COLORS.title }}>
          {s.title}
        </div>
        {s.subtitle && (
          <div className="text-sm" style={{ color: COLORS.subtitle }}>
            {s.subtitle}
          </div>
        )}
        {s.altPrefix && (
          <div className="text-sm" style={{ color: COLORS.altPrefix }}>
            {s.altPrefix}
          </div>
        )}
        {s.altTitle && (
          <div className="font-semibold leading-tight" style={{ color: COLORS.title }}>
            {s.altTitle}
          </div>
        )}
      </div>
    </a>
  );
}

function PeriodCell({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) return <div />;
  return (
    <div className="flex flex-col gap-2">
      {sessions.map((s, i) => (
        <SessionCard key={i} s={s} />
      ))}
    </div>
  );
}

const GRID_COLS = "110px 1fr 1fr 1fr";

/* ── Page ── */
const WeeklyPractices = () => {
  useDocumentTitle("מאיטרייה סנגהה ישראל | לו״ז תרגולים");

  // Standing schedule with any active per-week override applied (auto-reverts).
  const { schedule, notes } = effectiveSchedule(new Date());

  // Keep this internal schedule out of search results.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return (
    <div dir="rtl" className="min-h-screen font-body" style={{ background: COLORS.pageBg }}>
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="rounded-2xl p-6 shadow-sm md:p-10" style={{ background: COLORS.cardBg }}>
          {/* Header */}
          <header className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <img
                src={maitreyaLogo}
                alt="Maitreya Sangha Israel"
                className="mb-3 h-12 w-auto md:h-14"
              />
              <h1
                className="font-heading text-4xl font-semibold leading-none md:text-5xl"
                style={{ color: COLORS.ink }}
              >
                תרגולים שבועיים
              </h1>
            </div>
            <div
              className="text-sm leading-relaxed md:text-base"
              style={{ color: COLORS.muted, textAlign: "left" }}
            >
              לוח תרגולים קבועים בזום
              <br />
              יוני - ספטמבר 2026
            </div>
          </header>

          {/* How to join — clicking a practice opens its Zoom meeting */}
          <div
            className="mt-6 flex items-center gap-3 rounded-xl px-4 py-4 md:px-5"
            style={{ background: "#FBF3E2", border: "1px solid #E7D6AE" }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: "#EBD8AC" }}
            >
              <MousePointerClick className="h-5 w-5" style={{ color: "#8C6410" }} />
            </span>
            <p className="text-base font-bold leading-snug md:text-lg" style={{ color: "#7A5A12" }}>
              להצטרפות למפגש בזום, לחצו על התרגול הרצוי
            </p>
          </div>

          {/* Active per-week override notice(s), if any (see WEEK_OVERRIDES). */}
          {notes.map((n, i) => (
            <div
              key={i}
              className="mt-4 rounded-xl px-4 py-3 text-sm font-semibold leading-snug md:text-base"
              style={{ background: "#FBF3E2", border: "1px solid #E7D6AE", color: "#7A5A12" }}
            >
              {n}
            </div>
          ))}

          {/* Legend */}
          <div
            className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-white px-4 py-3"
            style={{ borderColor: COLORS.border }}
          >
            {(Object.keys(CATEGORY) as CategoryKey[]).map((c) => (
              <div key={c} className="inline-flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded" style={{ background: CATEGORY[c].bar }} />
                <span className="text-sm font-bold" style={{ color: CATEGORY[c].legendText }}>
                  {CATEGORY[c].label}
                </span>
              </div>
            ))}
            <div className="inline-flex items-center gap-2 lg:mr-auto">
              <Pill bg={COLORS.beginnerBg} color={COLORS.beginnerText}>
                מתחילים
              </Pill>
              <span className="text-sm font-semibold" style={{ color: COLORS.muted }}>
                מומלץ למתחילים
              </span>
            </div>
          </div>

          {/* Timetable — desktop grid */}
          <div className="mt-8 hidden lg:block">
            {/* Column headers */}
            <div className="grid gap-3" style={{ gridTemplateColumns: GRID_COLS }}>
              <div />
              {PERIODS.map((p) => (
                <div key={p.key} className="flex flex-col items-center justify-end pb-1">
                  <span className="font-heading text-xl font-semibold" style={{ color: COLORS.ink }}>
                    {p.label}
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: COLORS.periodTime, direction: "ltr" }}
                  >
                    {p.range}
                  </span>
                </div>
              ))}
            </div>

            {/* Day rows */}
            {schedule.map((row) => (
              <div
                key={row.day}
                className="grid items-stretch gap-3 border-t py-3"
                style={{ gridTemplateColumns: GRID_COLS, borderColor: COLORS.border }}
              >
                <div
                  className="flex items-center font-heading text-2xl font-semibold"
                  style={{ color: COLORS.ink }}
                >
                  {row.day}
                </div>
                {PERIODS.map((p) => (
                  <PeriodCell key={p.key} sessions={row[p.key]} />
                ))}
              </div>
            ))}
          </div>

          {/* Timetable — mobile stacked by day */}
          <div className="mt-8 lg:hidden">
            {schedule.map((row) => (
              <div key={row.day} className="border-t py-4" style={{ borderColor: COLORS.border }}>
                <h2 className="mb-3 font-heading text-2xl font-semibold" style={{ color: COLORS.ink }}>
                  {row.day}
                </h2>
                <div className="flex flex-col gap-3">
                  {PERIODS.flatMap((p) =>
                    row[p.key].map((s, i) => (
                      <div key={`${p.key}-${i}`}>
                        <div className="mb-1 text-xs font-bold" style={{ color: COLORS.periodTime }}>
                          {p.label}
                        </div>
                        <SessionCard s={s} />
                      </div>
                    )),
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <footer
            className="mt-10 flex items-center justify-center gap-3 text-sm"
            style={{ color: COLORS.periodTime }}
          >
            <span className="h-px w-6" style={{ background: COLORS.footerLine }} />
            מאיטרייה סנגהה ישראל · maitreya.org.il
            <span className="h-px w-6" style={{ background: COLORS.footerLine }} />
          </footer>
        </div>
      </div>
    </div>
  );
};

export default WeeklyPractices;
