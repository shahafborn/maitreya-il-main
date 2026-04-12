import type { ReactNode } from "react";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { SectionEyebrow } from "./SectionFrame";

interface AboutSectionProps {
  /**
   * Optional background photo. When provided, the section renders a frosted
   * glass panel over a full-bleed photo. When omitted, it renders a clean
   * cream section with centered typography - better for pages where the
   * hero already carries the visual weight.
   */
  bgImage?: string;
  /**
   * Optional background image displayed behind the cream section (no frosted
   * box, no dark overlay). The image should already carry its own gradient
   * fade to cream at the top - e.g. a clouds photo that fades to cream.
   */
  softBgImage?: string;
  /** Eyebrow label above the paragraphs (e.g. "אודות הריטריט"). */
  eyebrow: string;
  /** One or more paragraphs. Pass strings or JSX (for <strong>). */
  paragraphs: ReactNode[];
  /** Optional outlined CTA button rendered at the bottom of the text block. */
  ctaLabel?: string;
  onCtaClick?: () => void;
}

/**
 * "About the retreat" section with 3-5 paragraphs of body copy.
 * With `bgImage` → frosted glass panel over a photo background.
 * Without → plain cream section with the paragraphs centered.
 */
export const AboutSection = ({
  bgImage,
  softBgImage,
  eyebrow,
  paragraphs,
  ctaLabel,
  onCtaClick,
}: AboutSectionProps) => {
  if (!bgImage) {
    return (
      <section
        className="relative pt-12 pb-20 md:pt-16 md:pb-32"
        style={{ backgroundColor: RETREAT_THEME.CREAM }}
      >
        {softBgImage && (
          <>
            {/* Clean clouds photo, full-bleed at the bottom. */}
            <div
              className="absolute inset-0 bg-cover bg-bottom opacity-50"
              style={{ backgroundImage: `url(${softBgImage})` }}
            />
            {/* CSS gradient fades the cream section color in from the top,
                so the clouds image stays raw and the fade can be tuned here
                without regenerating the asset. */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(to bottom, ${RETREAT_THEME.CREAM} 0%, ${RETREAT_THEME.CREAM} 25%, rgba(250,248,245,0.6) 50%, rgba(250,248,245,0) 80%)`,
              }}
            />
          </>
        )}
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div
            className={
              softBgImage
                ? "bg-white/85 backdrop-blur-md rounded-lg p-10 md:p-16 shadow-xl max-w-3xl mx-auto"
                : "max-w-3xl mx-auto"
            }
          >
            <h2
              className="text-2xl md:text-4xl font-bold text-center mb-10"
              style={{ fontFamily: RETREAT_FONTS.serif, color: RETREAT_THEME.GOLD_DARK }}
            >
              {eyebrow}
            </h2>
            <div
              className="space-y-6 text-lg leading-[1.8]"
              style={{ color: RETREAT_THEME.BODY }}
            >
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {ctaLabel && onCtaClick && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={onCtaClick}
                  className="px-10 py-4 text-lg font-semibold rounded-full border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.03] cursor-pointer"
                  style={{
                    borderColor: RETREAT_THEME.GOLD_DARK,
                    color: RETREAT_THEME.GOLD_DARK,
                    backgroundColor: "transparent",
                    fontFamily: RETREAT_FONTS.sans,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = RETREAT_THEME.GOLD_DARK;
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = RETREAT_THEME.GOLD_DARK;
                  }}
                >
                  {ctaLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-20 md:py-32">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <div className="bg-white/85 backdrop-blur-md rounded-lg p-10 md:p-16 shadow-xl max-w-3xl mx-auto">
          <SectionEyebrow className="mb-8">{eyebrow}</SectionEyebrow>
          <div
            className="space-y-6 text-lg leading-[1.8]"
            style={{ color: RETREAT_THEME.BODY }}
          >
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
