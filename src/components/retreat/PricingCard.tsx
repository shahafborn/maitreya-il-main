import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { CTAButton } from "./CTAButton";
import type { PricingTier } from "./types";

interface PricingCardProps {
  tier: PricingTier;
  ctaLabel: string;
  onSelect: (tierId: string) => void;
}

/**
 * Single pricing card: title, note, big price, optional badge + footnote, CTA.
 * Used by PricingGrid; don't usually render alone.
 */
export const PricingCard = ({ tier, ctaLabel, onSelect }: PricingCardProps) => (
  <div
    className={`bg-white rounded-lg p-8 text-center transition-shadow flex flex-col ${
      tier.featured ? "shadow-lg ring-2" : "shadow-sm hover:shadow-md"
    }`}
    style={tier.featured ? { borderColor: RETREAT_THEME.GOLD } : undefined}
  >
    {/* Badge area - fixed height so content below aligns across cards */}
    <div className="h-8 mb-2 flex items-center justify-center">
      {tier.badge && (
        <span
          className="inline-block px-3 py-1 text-xs font-bold text-white rounded-full"
          style={{ backgroundColor: RETREAT_THEME.GOLD }}
        >
          {tier.badge}
        </span>
      )}
    </div>
    <h3 className="text-xl font-bold mb-2" style={{ fontFamily: RETREAT_FONTS.serif }}>
      {tier.title}
    </h3>
    {tier.note && (
      <p className="text-base mb-6" style={{ color: RETREAT_THEME.WARM_GRAY }}>
        {tier.note}
      </p>
    )}
    <p className="text-4xl font-bold mb-1">
      {tier.priceDisplay}
      {tier.currencySymbol && <span className="text-lg font-normal mr-1">{tier.currencySymbol}</span>}
    </p>
    <p className="text-sm mb-2" style={{ color: RETREAT_THEME.WARM_GRAY }}>
      {tier.perPersonLabel}
    </p>
    {tier.footnote ? (
      <p className="text-sm font-medium mb-4" style={{ color: RETREAT_THEME.GOLD }}>
        {tier.footnote}
      </p>
    ) : (
      <div className="mb-6" />
    )}
    <div className="mt-auto">
      <CTAButton className="!text-base !px-8 !py-3 w-full" onClick={() => onSelect(tier.id)}>
        {ctaLabel}
      </CTAButton>
    </div>
  </div>
);
