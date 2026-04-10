import type { ReactNode } from "react";
import { RETREAT_THEME } from "./theme";
import { GoldDot } from "./GoldDot";

interface VenueSectionProps {
  /** Background photo. */
  bgImage: string;
  eyebrow: string;
  /** Main body paragraphs (rendered over the photo). */
  paragraphs: ReactNode[];
  /**
   * Optional accessibility/transport list. When provided, rendered below
   * the paragraphs with gold bullets. Used for urban retreats.
   */
  accessItems?: ReactNode[];
  /**
   * Optional photo grid rendered in a separate cream section below the
   * hero-overlay section. Used for residential venues (Ein Gedi style).
   */
  photoGrid?: { src: string; alt: string }[];
}

/**
 * Venue section. Dark photo background with white text, plus optional
 * accessibility list or a follow-up photo grid.
 */
export const VenueSection = ({
  bgImage,
  eyebrow,
  paragraphs,
  accessItems,
  photoGrid,
}: VenueSectionProps) => (
  <>
    <section className="relative py-20 md:py-28">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "50% 60%",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="absolute inset-0 bg-black/55" />
      <div
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
      >
        <h2
          className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-white/90 mb-10"
          style={{ letterSpacing: "0.2em" }}
        >
          {eyebrow}
        </h2>
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-lg md:text-xl text-white/85 leading-[1.8] max-w-2xl mx-auto mb-6 last:mb-0"
          >
            {p}
          </p>
        ))}
        {accessItems && accessItems.length > 0 && (
          <ul className="mt-8 max-w-2xl mx-auto text-start space-y-3 text-lg text-white/90">
            {accessItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <GoldDot />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>

    {photoGrid && photoGrid.length > 0 && (
      <section className="py-16 md:py-20" style={{ backgroundColor: RETREAT_THEME.CREAM }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-3 rounded-lg overflow-hidden">
            {photoGrid.map((p, i) => (
              <img
                key={i}
                src={p.src}
                alt={p.alt}
                className={`${i === 0 ? "col-span-2 h-48 md:h-72" : "h-40 md:h-52"} w-full object-cover rounded-lg`}
              />
            ))}
          </div>
        </div>
      </section>
    )}
  </>
);
