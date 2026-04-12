import { RETREAT_THEME, RETREAT_FONTS } from "./theme";

interface RetreatHeroProps {
  image: string;
  imageAlt: string;
  title: string;
  /** Primary subtitle line (white). */
  subtitle: string;
  /** Optional accent subtitle (gold) - typically the teacher name. */
  accent?: string;
  /** Date/venue line (muted white). */
  dateLine: string;
  /** CSS object-position for the hero image (default: "center"). */
  objectPosition?: string;
  /** Separate image shown on mobile only (hidden md+). Desktop still uses `image`. */
  mobileImage?: string;
}

/**
 * Full-width hero image with gradient overlay and stacked title/subtitle/date.
 * Extracted from EinGediRetreatV2 hero section.
 */
export const RetreatHero = ({ image, imageAlt, title, subtitle, accent, dateLine, objectPosition, mobileImage }: RetreatHeroProps) => (
  <section className="relative overflow-hidden">
    {mobileImage ? (
      <>
        <img src={mobileImage} alt={imageAlt} className="w-full h-[60vh] object-cover md:hidden" />
        <img src={image} alt={imageAlt} className="w-full h-[65vh] object-cover hidden md:block" style={objectPosition ? { objectPosition } : undefined} />
      </>
    ) : (
      <img src={image} alt={imageAlt} className="w-full h-[57vh] md:h-[62vh] object-cover" style={objectPosition ? { objectPosition } : undefined} />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 md:from-black/70 via-black/45 md:via-black/40 via-[75%] to-black/20" />
    <div className="absolute bottom-0 inset-x-0 p-8 md:p-16">
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
