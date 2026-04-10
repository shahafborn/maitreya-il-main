import type { ReactNode, CSSProperties } from "react";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";

interface SectionFrameProps {
  children: ReactNode;
  /** Background style: cream (default), stone (warmer), or none (for photo-bg sections). */
  tone?: "cream" | "stone" | "none";
  /** Vertical padding size. */
  size?: "md" | "lg";
  /** Max content width. */
  maxWidth?: "sm" | "md" | "lg" | "xl";
  /** Extra classes applied to the outer <section>. */
  className?: string;
  style?: CSSProperties;
}

const toneBg: Record<NonNullable<SectionFrameProps["tone"]>, string | undefined> = {
  cream: RETREAT_THEME.CREAM,
  stone: RETREAT_THEME.STONE,
  none: undefined,
};

const maxWidthClass: Record<NonNullable<SectionFrameProps["maxWidth"]>, string> = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
};

/**
 * Standard section wrapper with consistent padding, background and inner max-width.
 * Use this for every section of a retreat page unless the section needs a
 * full-bleed photo background (use plain <section> then).
 */
export const SectionFrame = ({
  children,
  tone = "cream",
  size = "lg",
  maxWidth = "lg",
  className = "",
  style,
}: SectionFrameProps) => {
  const bg = toneBg[tone];
  const padding = size === "lg" ? "py-16 md:py-24" : "py-12 md:py-16";
  return (
    <section
      className={`${padding} ${className}`}
      style={{ ...(bg ? { backgroundColor: bg } : {}), ...style }}
    >
      <div className={`${maxWidthClass[maxWidth]} mx-auto px-6`}>{children}</div>
    </section>
  );
};

/** Serif heading helper used inside sections. */
export const SectionTitle = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <h2
    className={`text-2xl md:text-3xl font-bold ${className}`}
    style={{ fontFamily: RETREAT_FONTS.serif }}
  >
    {children}
  </h2>
);

/** All-caps tracked label used as section eyebrow (e.g. "אודות הריטריט"). */
export const SectionEyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <h2
    className={`text-base md:text-lg font-bold tracking-[0.2em] uppercase ${className}`}
    style={{ color: RETREAT_THEME.WARM_GRAY, letterSpacing: "0.2em" }}
  >
    {children}
  </h2>
);
