import { RETREAT_FONTS } from "./theme";
import { CTAButton } from "./CTAButton";

interface FinalCTAProps {
  bgImage: string;
  title: string;
  body: string;
  ctaLabel: string;
  onCtaClick: () => void;
  footnote?: string;
}

/**
 * Closing section: dark photo background, large heading, CTA button.
 */
export const FinalCTA = ({ bgImage, title, body, ctaLabel, onCtaClick, footnote }: FinalCTAProps) => (
  <section className="relative py-20 md:py-28 text-center">
    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
    <div className="absolute inset-0 bg-black/70" />
    <div className="relative z-10 max-w-2xl mx-auto px-6">
      <h2
        className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-lg"
        style={{ fontFamily: RETREAT_FONTS.serif }}
      >
        {title}
      </h2>
      <p className="text-xl text-white/70 mb-10 leading-relaxed drop-shadow-md">{body}</p>
      <CTAButton className="drop-shadow-lg" onClick={onCtaClick}>
        {ctaLabel}
      </CTAButton>
      {footnote && <p className="text-sm text-white/40 mt-8 drop-shadow-sm">{footnote}</p>}
    </div>
  </section>
);
