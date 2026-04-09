import type { ReactNode } from "react";
import { RETREAT_THEME } from "./theme";
import { SectionEyebrow } from "./SectionFrame";

interface AboutSectionProps {
  /** Background photo shown behind the frosted panel. */
  bgImage: string;
  /** Eyebrow label above the paragraphs (e.g. "אודות הריטריט"). */
  eyebrow: string;
  /** One or more paragraphs. Pass strings or JSX (for <strong>). */
  paragraphs: ReactNode[];
}

/**
 * Frosted glass panel over a full-bleed photo background. Used for the
 * main "about the retreat" section with 3-5 paragraphs of body copy.
 */
export const AboutSection = ({ bgImage, eyebrow, paragraphs }: AboutSectionProps) => (
  <section className="relative py-20 md:py-32">
    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
    <div className="absolute inset-0 bg-black/30" />
    <div className="relative z-10 max-w-4xl mx-auto px-6">
      <div className="bg-white/85 backdrop-blur-md rounded-lg p-10 md:p-16 shadow-xl max-w-3xl mx-auto">
        <SectionEyebrow className="mb-8">{eyebrow}</SectionEyebrow>
        <div className="space-y-6 text-lg leading-[1.8]" style={{ color: RETREAT_THEME.BODY }}>
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  </section>
);
