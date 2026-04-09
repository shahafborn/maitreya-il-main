import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { SectionFrame, SectionEyebrow } from "./SectionFrame";
import type { ScheduleDay } from "./types";

interface ScheduleBlockProps {
  eyebrow: string;
  /** Optional intro paragraph above the day list. */
  intro?: string;
  days: ScheduleDay[];
  /** Optional footer notes shown below the days. */
  notes?: string[];
}

/**
 * Flexible day/session list for retreat schedules. Each day renders as a
 * gold-bordered block. Urban retreats typically pass 3 days; residential
 * retreats can pass more.
 */
export const ScheduleBlock = ({ eyebrow, intro, days, notes }: ScheduleBlockProps) => (
  <SectionFrame tone="cream" maxWidth="md">
    <SectionEyebrow className="text-center block mb-10">{eyebrow}</SectionEyebrow>
    {intro && (
      <p
        className="text-center text-lg mb-10 leading-[1.8]"
        style={{ color: RETREAT_THEME.BODY }}
      >
        {intro}
      </p>
    )}
    <div className="space-y-6 max-w-2xl mx-auto">
      {days.map((d, i) => (
        <div key={i} className="border-r-2 pr-4" style={{ borderColor: RETREAT_THEME.GOLD }}>
          <p className="font-bold text-lg mb-0.5" style={{ fontFamily: RETREAT_FONTS.serif }}>
            {d.label}
          </p>
          <p className="font-bold text-base" style={{ color: RETREAT_THEME.GOLD }}>
            {d.time}
          </p>
          {d.description && (
            <p className="text-base mt-1" style={{ color: RETREAT_THEME.WARM_GRAY }}>
              {d.description}
            </p>
          )}
        </div>
      ))}
    </div>
    {notes && notes.length > 0 && (
      <div className="mt-8 space-y-2 max-w-2xl mx-auto">
        {notes.map((n, i) => (
          <p key={i} className="text-center text-base" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            {n}
          </p>
        ))}
      </div>
    )}
  </SectionFrame>
);
