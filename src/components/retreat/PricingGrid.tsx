import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { PricingCard } from "./PricingCard";
import type { PricingTier } from "./types";

interface PricingGridProps {
  title: string;
  /** Optional subtitle under the title. */
  subtitle?: string;
  tiers: PricingTier[];
  /** Label on each card's CTA button (e.g. "להרשמה"). */
  ctaLabel: string;
  /** Called when any tier's CTA is clicked. Receives the tier id. */
  onSelect: (tierId: string) => void;
  /** Optional footer notes below the grid. */
  notes?: string[];
}

/**
 * Grid of pricing cards. Lays out 1-3 tiers responsively. When only a single
 * tier is passed, still displays it (centered via the grid).
 */
export const PricingGrid = ({ title, subtitle, tiers, ctaLabel, onSelect, notes }: PricingGridProps) => {
  const gridCols =
    tiers.length >= 3 ? "md:grid-cols-3" : tiers.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1 max-w-sm mx-auto";
  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: RETREAT_THEME.STONE }}>
      <div className="max-w-4xl mx-auto px-6">
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-4"
          style={{ fontFamily: RETREAT_FONTS.serif }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-center text-base mb-12" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            {subtitle}
          </p>
        )}
        <div className={`grid ${gridCols} gap-6`}>
          {tiers.map((t) => (
            <PricingCard key={t.id} tier={t} ctaLabel={ctaLabel} onSelect={onSelect} />
          ))}
        </div>
        {notes && notes.length > 0 && (
          <div className="mt-8 space-y-3">
            {notes.map((n, i) => (
              <p key={i} className="text-base text-center" style={{ color: RETREAT_THEME.WARM_GRAY }}>
                {n}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
