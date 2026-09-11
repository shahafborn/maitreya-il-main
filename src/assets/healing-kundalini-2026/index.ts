/**
 * Asset re-exports for the "Meditation and Kundalini for Healing" retreat page
 * (Lama Glenn Mullin, Antakarana Center Tel Aviv, 2-4 Dec 2026).
 *
 * Hero: the Sangha's own rainbow Amitayus graphic (public/media/articles/
 * Amitayus-Rainbow-FINAL.png, used for the Nov 2025 healing course), cut into a
 * wide banner (sky extended with a blurred copy) and a portrait cut for phones.
 * Everything else is reused from the Heart of Wisdom (May 2026) page, which was
 * also held at Antakarana. Do NOT change the exported identifiers.
 */
// Hero option B (Shahaf, 2026-09-11): a Tibetan mural of yogis - the seated one in the
// meditation belt reads as tummo. Source 956x640 (vault: teachers-visit-nov-dec-2026/marketing/hero-yogi-mural-source.jpg), upscaled to 2528px with Gemini (faithful restoration prompt, checked against the original at pixel level).
export { default as hkrHero } from "./hero-mural.jpg";
export { default as hkrHeroMobile } from "./hero-mural-mobile.jpg";
// Option A kept: the Sangha's rainbow Amitayus graphic.
export { default as hkrHeroAmitayus } from "./hero-amitayus.jpg";
export { default as hkrHeroAmitayusMobile } from "./hero-amitayus-mobile.jpg";

export { default as lamaGlennPhoto } from "@/assets/retreat/lama-glenn-big.jpg";
export { default as druponPhoto } from "@/assets/retreat/drupon-chongwol.png";

// Reused from Heart of Wisdom: soft clouds behind the About text, a yogi in a
// meadow above "on the practice", prayer flags behind the closing call, and the
// real Antakarana room photo behind the venue block.
export { default as cloudsBg } from "@/assets/heart-of-wisdom-retreat/clouds-bg.jpg";
// "On the practice" image (Shahaf, 2026-09-11): the Medicine Buddha mandala - his palace
// ringed by the medicinal herbs, the healing tradition drawn as a map. Source: vault
// teachers-visit-nov-dec-2026/marketing/medicine-buddha-mandala-source.jpg (3516x4231).
export { default as medicineMandala } from "./medicine-buddha-mandala.jpg";
// Option C (Shahaf, 2026-09-11): the medical thangka "Root of Health and Disease" - the
// tree of Tibetan physiology, which is the illness-to-balance chain the prose describes.
// Source 815x1126: vault teachers-visit-nov-dec-2026/marketing/medical-tree-thangka-source.jpg
export { default as medicalTree } from "./medical-tree-thangka.jpg";
export { default as ngakpaMeadow } from "@/assets/heart-of-wisdom-retreat/ngakpa-meadow.jpg";
export { default as prayerFlagsBg } from "@/assets/heart-of-wisdom-retreat/prayer-flags.jpg";
export { default as venuePhoto } from "@/assets/heart-of-wisdom-retreat/antakarana-venue.jpg";

import g1 from "@/assets/retreat/gallery-1.jpg";
import g2 from "@/assets/retreat/gallery-2.jpg";
import g3 from "@/assets/retreat/gallery-3.jpg";
import g4 from "@/assets/retreat/gallery-4.jpg";
import g5 from "@/assets/retreat/gallery-5.jpg";
import g6 from "@/assets/retreat/gallery-6.jpg";
import g7 from "@/assets/retreat/gallery-7.jpg";
import g8 from "@/assets/retreat/gallery-8.jpg";
export const hkrGalleryImages = [g1, g2, g3, g4, g5, g6, g7, g8];
