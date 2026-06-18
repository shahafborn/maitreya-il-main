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

import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import maitreyaLogo from "@/assets/maitreya-logo.png";

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
    afternoon: [{ time: "17-18", title: "טארה הלבנה", categories: ["healing"], beginner: true }],
    evening: [],
  },
  {
    day: "רביעי",
    morning: [
      { time: "07-08", title: "אמיתאיוס", subtitle: "כולל טומו לריפוי", categories: ["healing", "tummo"] },
    ],
    afternoon: [],
    evening: [
      {
        time: "20-21",
        title: "מנג׳ושרי הלבן",
        altPrefix: "מתחלף מדי שבוע עם",
        altTitle: "ואג׳רפאני-הייגריבה-גארודה",
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
    afternoon: [],
    evening: [],
  },
];

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
    <div className="relative flex items-stretch overflow-hidden rounded-xl" style={{ background: bg }}>
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
    </div>
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
  useDocumentTitle("תרגולים שבועיים | מאיטרייה סנגהה ישראל");

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
              יוני, יולי, ספטמבר 2026
            </div>
          </header>

          {/* Legend */}
          <div
            className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-white px-4 py-3"
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
            {SCHEDULE.map((row) => (
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
            {SCHEDULE.map((row) => (
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
