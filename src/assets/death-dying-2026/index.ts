/**
 * Asset re-exports for the "Death, Dying and Enlightenment" online course page
 * (Lama Glenn Mullin + Drupon Chongwol-la, six Sundays, 13 Sep - 18 Oct 2026).
 *
 * Hero: Wheel of Life thangka (Himalayan Art Resources item 59637), top band,
 * outpainted sideways with Gemini. Closing call to action: generated image of
 * butter lamps - the lamps lit for the dead (Gemini, 2026-09-06).
 * Do NOT change the exported identifiers; the page file only imports from here.
 */

// Hero: the top of a Wheel of Life thangka - the five Buddhas on clouds, Yama
// biting the wheel's crown - extended sideways into a wide banner for desktop
// (Shahaf's pick, 2026-09-06). The mobile file is a portrait cut of the same band.
export { default as ddeHero } from "./hero-wheel.jpg";
export { default as ddeHeroMobile } from "./hero-wheel-mobile.jpg";

// FinalCTA background: butter lamps burning in a dim monastery hall.
export { default as ddeLampsBg } from "./cta-lamps.jpg";

// Real photos of the two teachers, shared with the other course pages.
export { default as lamaGlennPhoto } from "@/assets/retreat/lama-glenn-big.jpg";
export { default as druponPhoto } from "@/assets/retreat/drupon-chongwol.png";

// Gallery reuses a subset of the shared retreat gallery photos.
import g1 from "@/assets/retreat/gallery-1.jpg";
import g2 from "@/assets/retreat/gallery-2.jpg";
import g3 from "@/assets/retreat/gallery-3.jpg";
import g4 from "@/assets/retreat/gallery-4.jpg";
import g5 from "@/assets/retreat/gallery-5.jpg";
import g6 from "@/assets/retreat/gallery-6.jpg";

export const ddeGalleryImages = [g1, g2, g3, g4, g5, g6];
