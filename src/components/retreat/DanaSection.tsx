import type { ReactNode } from "react";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { CTAButton } from "./CTAButton";

interface DanaSectionProps {
  title: string;
  /** Paragraph(s) explaining the dana tradition. */
  paragraphs: ReactNode[];
  /** Large suggested amount line (e.g. "תרומה מומלצת: 650 ש״ח"). */
  suggestedLine: string;
  /** Short footer note (e.g. "כל סכום יתקבל בברכה"). */
  footerNote?: string;
  /** CTA label. */
  ctaLabel: string;
  onCtaClick: () => void;
}

/**
 * Dana-based contribution section for retreats that don't use fixed pricing.
 * Highlighted stone-colored panel with a large suggested-amount line and CTA.
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
      <div
        className="my-10 py-6 px-6 rounded-lg bg-white shadow-sm text-xl md:text-2xl font-bold"
        style={{ color: RETREAT_THEME.GOLD, fontFamily: RETREAT_FONTS.serif }}
      >
        {suggestedLine}
      </div>
      {footerNote && (
        <p className="text-base mb-8" style={{ color: RETREAT_THEME.WARM_GRAY }}>
          {footerNote}
        </p>
      )}
      <CTAButton onClick={onCtaClick}>{ctaLabel}</CTAButton>
    </div>
  </section>
);
