/**
 * Asset re-exports for the Heart of Wisdom retreat landing page.
 *
 * Phase B.1: these re-export Ein Gedi assets as placeholders so the page
 * ships behind the route. Phase B.2 will replace them with real assets
 * (hero, White Manjushri, Antakarana venue, gallery) once Shahaf provides them.
 *
 * When swapping in real assets, drop them into this folder and update the
 * imports below. Do NOT change the exported identifiers - the page file
 * only imports from this index.
 */

// Mount Kailash with Tibetan prayer flags, generated via ai-image-skill (Gemini).
export { default as howHero } from "./hero-kailash.jpg";

// Reused real photos (no swap needed).
export { default as lamaGlennPhoto } from "@/assets/retreat/lama-glenn-big.jpg";
export { default as druponPhoto } from "@/assets/retreat/drupon-chongwol.png";

// White Manjushri thangka (sourced from har-assets, gently enhanced via ai-image-skill).
export { default as manjushriImage } from "./manjushri-white.jpg";

// Soft cream-to-clouds gradient background for the About section.
export { default as cloudsBg } from "./clouds-bg.jpg";

// Tibetan prayer flags over Himalayan peaks - FinalCTA background.
export { default as prayerFlagsBg } from "./prayer-flags.jpg";

// Antakarana Center venue: real photo from a Lama Glenn teaching session.
// Used as the VenueSection background. venuePhoto1 is still an Ein Gedi
// placeholder used for WhatsIncluded / FinalCTA backgrounds.
// TODO(Phase B.2): replace venuePhoto1 with a second real Antakarana photo.
export { default as venuePhoto1 } from "@/assets/retreat/venue-eingedi-1.jpg";
export { default as venuePhoto2 } from "./antakarana-venue.jpg";

// TODO(Phase B.2): gallery can reuse a subset of Ein Gedi gallery images
// or be replaced entirely with Heart of Wisdom / urban retreat photos.
import g1 from "@/assets/retreat/gallery-1.jpg";
import g2 from "@/assets/retreat/gallery-2.jpg";
import g3 from "@/assets/retreat/gallery-3.jpg";
import g4 from "@/assets/retreat/gallery-4.jpg";
import g5 from "@/assets/retreat/gallery-5.jpg";
import g6 from "@/assets/retreat/gallery-6.jpg";
import g7 from "@/assets/retreat/gallery-7.jpg";
import g8 from "@/assets/retreat/gallery-8.jpg";
import g9 from "@/assets/retreat/gallery-9.jpg";
import g10 from "@/assets/retreat/gallery-10.jpg";

export const howGalleryImages = [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10];
