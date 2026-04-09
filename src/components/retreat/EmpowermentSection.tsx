import type { ReactNode } from "react";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { SectionFrame } from "./SectionFrame";

interface EmpowermentSectionProps {
  /** Section heading (e.g. "חניכה למנג׳ושרי הלבן"). */
  title: string;
  /** Optional decorative image (e.g. deity thangka). */
  image?: string;
  imageAlt?: string;
  /** One or more paragraphs describing the empowerment. */
  paragraphs: ReactNode[];
}

/**
 * Highlighted short section for an empowerment / initiation blurb.
 * Used by Heart of Wisdom for the White Manjushri empowerment.
 */
export const EmpowermentSection = ({ title, image, imageAlt, paragraphs }: EmpowermentSectionProps) => (
  <SectionFrame tone="stone" maxWidth="md">
    <div className="text-center">
      <h2
        className="text-2xl md:text-3xl font-bold mb-8"
        style={{ fontFamily: RETREAT_FONTS.serif }}
      >
        {title}
      </h2>
      {image && (
        <div className="max-w-sm mx-auto mb-10">
          <img src={image} alt={imageAlt ?? title} className="w-full rounded-lg shadow-md" />
        </div>
      )}
      <div
        className="space-y-5 text-lg leading-[1.9] text-start"
        style={{ color: RETREAT_THEME.BODY }}
      >
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  </SectionFrame>
);
