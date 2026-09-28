/**
 * Asset re-exports for the Heart Sutra online course page (Lama Glenn Mullin,
 * five Sundays, 4 Oct - 1 Nov 2026).
 *
 * Source: the Prajnaparamita thangka on Maitreya Sangha Korea's poster for the
 * course (vault: heart-sutra-2026/poster/src/korea-poster-en.jpeg), cropped
 * inside its frame line. The painting is portrait, so the desktop hero sets it
 * whole in the middle of a wide canvas over a blurred, darkened copy of itself
 * instead of cropping the deity; mobile gets the painting at its own ratio.
 * Do NOT change the exported identifiers; the page file only imports from here.
 */

export { default as heartSutraHero } from "./hero-prajnaparamita.jpg";
export { default as heartSutraHeroMobile } from "./hero-prajnaparamita-mobile.jpg";

// The same painting, shown inline in the "about" section.
export { default as prajnaparamitaThangka } from "./thangka-prajnaparamita.jpg";

// Real photo, shared with the other course pages.
export { default as lamaGlennPhoto } from "@/assets/retreat/lama-glenn-big.jpg";
