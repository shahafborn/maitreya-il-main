/**
 * Asset re-exports for the Uma Zub Tri online course landing page.
 *
 * v1 reuses existing retreat imagery so the page ships behind its route.
 * Swap in dedicated assets later - in particular, the Manjushri thangka from
 * the course promo (vault Inbox) can replace `umaManjushri`. Do NOT change the
 * exported identifiers; the page file only imports from this index.
 */

// Hero: ngakpa (lay tantric yogi) meditating in an alpine meadow facing the
// Himalayas above a sea of clouds - the "sky-like mind" of Mahamudra.
export { default as umaHero } from "@/assets/heart-of-wisdom-retreat/ngakpa-meadow.jpg";

// Manjushri thangka (wisdom deity) - the course's iconic image on the promo.
// v1 uses the White Manjushri asset; swap for the promo's orange Manjushri crop later.
export { default as umaManjushri } from "@/assets/heart-of-wisdom-retreat/manjushri-white.jpg";

// Soft cream-to-clouds gradient background for the About section.
export { default as umaCloudsBg } from "@/assets/heart-of-wisdom-retreat/clouds-bg.jpg";

// Tibetan prayer flags over Himalayan peaks - FinalCTA background.
export { default as umaPrayerFlagsBg } from "@/assets/heart-of-wisdom-retreat/prayer-flags.jpg";

// Reused real photo of Lama Glenn.
export { default as lamaGlennPhoto } from "@/assets/retreat/lama-glenn-big.jpg";

// Gallery reuses a subset of the shared retreat gallery photos.
import g1 from "@/assets/retreat/gallery-1.jpg";
import g2 from "@/assets/retreat/gallery-2.jpg";
import g3 from "@/assets/retreat/gallery-3.jpg";
import g4 from "@/assets/retreat/gallery-4.jpg";
import g5 from "@/assets/retreat/gallery-5.jpg";
import g6 from "@/assets/retreat/gallery-6.jpg";

export const umaGalleryImages = [g1, g2, g3, g4, g5, g6];
