import type { ReactNode } from "react";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { CTAButton } from "./CTAButton";

interface DanaSectionProps {
  title: string;
  /** Paragraph(s) explaining the dana tradition. */
  paragraphs: ReactNode[];
  /**
   * Large suggested amount line (e.g. "תרומה מומלצת: 650 ש״ח"). Omit on a
   * finished retreat: the section goes on explaining what dana is, but an
   * amount for something nobody can join any more is a price, not a teaching.
   */
  suggestedLine?: string;
  /** Short footer note (e.g. "כל סכום יתקבל בברכה"). */
  footerNote?: string;
  /** CTA label. Omit, together with onCtaClick, for a section with no call to action. */
  ctaLabel?: string;
  onCtaClick?: () => void;
}

/**
 * Dana-based contribution section for retreats that don't use fixed pricing.
 * Highlighted stone-colored panel with a large suggested-amount line and CTA.
 *
 * With no suggestedLine and no ctaLabel it becomes what a finished retreat
 * keeps: the explanation of dana on its own, with nothing to click.
 */
export const DanaSection = ({
  title,
  paragraphs,
  suggestedLine,
  footerNote,
  ctaLabel,
  onCtaClick,
}: DanaSectionProps) => (
  <section className="py-16 md:py-24" style={{ backgroundColor: RETREAT_THEME.STONE }}>
    <div className="max-w-2xl mx-auto px-6 text-center">
      <h2
        className="text-2xl md:text-3xl font-bold mb-8"
        style={{ fontFamily: RETREAT_FONTS.serif }}
      >
        {title}
      </h2>
      <div
        className="space-y-5 text-lg leading-[1.9] text-start"
        style={{ color: RETREAT_THEME.BODY }}
      >
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {/* The amount box is a button too - people tap the number expecting the form
          (Shahaf's request, 2026-09-06), so it opens the same dialog as the CTA. */}
      {suggestedLine && (
        <button
          type="button"
          onClick={onCtaClick}
          className="block w-full my-10 py-6 px-6 rounded-lg bg-white shadow-sm text-xl md:text-2xl font-bold text-center transition-all duration-200 hover:shadow-md hover:scale-[1.02] focus:outline-none focus-visible:ring-2"
          style={{ color: RETREAT_THEME.GOLD, fontFamily: RETREAT_FONTS.serif }}
        >
          {suggestedLine}
        </button>
      )}
      {footerNote && (
        <p className="text-base mb-8" style={{ color: RETREAT_THEME.WARM_GRAY }}>
          {footerNote}
        </p>
      )}
      {ctaLabel && onCtaClick && <CTAButton onClick={onCtaClick}>{ctaLabel}</CTAButton>}
    </div>
  </section>
);
