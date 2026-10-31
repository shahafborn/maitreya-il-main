import type { ReactNode } from "react";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";

interface RetreatHeroProps {
  image: string;
  imageAlt: string;
  title: string;
  /** Primary subtitle line (white). A node is allowed so a long line can break where it reads best. */
  subtitle: ReactNode;
  /** Optional accent subtitle (gold) - typically the teacher name. */
  accent?: string;
  /** Date/venue line (muted white). */
  dateLine: string;
  /** CSS object-position for the hero image (default: "center"). */
  objectPosition?: string;
  /** Separate image shown on mobile only (hidden md+). Desktop still uses `image`. */
  mobileImage?: string;
  /** Optional overlay on the picture, e.g. a CountdownBadge. */
  badge?: ReactNode;
}

/**
 * Full-width hero image with gradient overlay and stacked title/subtitle/date.
 * Extracted from EinGediRetreatV2 hero section.
 *
 * The picture is a minimum height, not a fixed one: the text sits at the bottom
 * in normal flow, so a long title (the English Healing Kundalini page on a
 * phone runs to five lines) grows the hero instead of spilling up under the
 * site header. With a `badge`, phones keep the top clear for it (the badge is
 * 108px tall at top-2); from md up the title is narrower than the picture and
 * never reaches the corner.
 */
export const RetreatHero = ({ image, imageAlt, title, subtitle, accent, dateLine, objectPosition, mobileImage, badge }: RetreatHeroProps) => (
  <section
    className={`relative overflow-hidden flex flex-col justify-end ${
      mobileImage ? "min-h-[60vh] md:min-h-[65vh]" : "min-h-[57vh] md:min-h-[62vh]"
    }`}
  >
    {mobileImage ? (
      <>
        <img src={mobileImage} alt={imageAlt} className="absolute inset-0 w-full h-full object-cover md:hidden" />
        <img src={image} alt={imageAlt} className="absolute inset-0 w-full h-full object-cover hidden md:block" style={objectPosition ? { objectPosition } : undefined} />
      </>
    ) : (
      <img src={image} alt={imageAlt} className="absolute inset-0 w-full h-full object-cover" style={objectPosition ? { objectPosition } : undefined} />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 md:from-black/70 via-black/45 md:via-black/40 via-[75%] to-black/20" />
    {badge}
    <div className={`relative p-8 md:p-16 ${badge ? "pt-32 md:pt-16" : ""}`}>
      <div
        className="max-w-4xl mx-auto text-center md:text-start"
        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.45)" }}
      >
        <h1
          className="text-[2.6rem] md:text-5xl lg:text-6xl font-bold text-white leading-none md:leading-tight mb-4"
          style={{ fontFamily: RETREAT_FONTS.serif }}
        >
          {title}
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-2 md:max-w-2xl">{subtitle}</p>
        {accent && (
          <p
            className="text-xl md:text-2xl font-semibold mb-4"
            style={{ color: RETREAT_THEME.GOLD, textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
          >
            {accent}
          </p>
        )}
        <p className="text-lg md:text-xl text-white/70">{dateLine}</p>
      </div>
    </div>
  </section>
);
