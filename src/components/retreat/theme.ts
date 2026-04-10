/**
 * Shared design tokens for retreat landing pages.
 * Extracted from EinGediRetreatV2 to keep every page visually consistent.
 *
 * Deviate only when a specific page needs a clearly different aesthetic - and
 * if you do, add the variant here rather than hardcoding in the page file.
 */

export const RETREAT_THEME = {
  /** Primary gold accent used for CTAs, bullets, dividers. */
  GOLD: "#C9A961",
  /** Darker gold used for nav/outline CTAs (slightly more saturated). */
  GOLD_DARK: "#B8860B",
  /** Main body text color. */
  DARK: "#1A1A1A",
  /** Page background. Warm off-white. */
  CREAM: "#FAF8F5",
  /** Slightly darker warm stone for alternating sections. */
  STONE: "#F5F0EA",
  /** Secondary/muted text color. */
  WARM_GRAY: "#6B635A",
  /** Paragraph body color (slightly warmer than DARK). */
  BODY: "#3D3830",
  /** Deep maroon accent (used for the "what's included" stripe and section titles). */
  MAROON: "#6B1F24",
} as const;

export const RETREAT_FONTS = {
  serif: "'Playfair Display', 'Frank Ruhl Libre', serif",
  sans: "'Open Sans', 'Heebo', sans-serif",
} as const;
