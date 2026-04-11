/**
 * Asset re-exports for the Ein Gedi Healing Retreat (English / Zoom) landing page.
 *
 * Re-exports existing Ein Gedi retreat assets so the EN page imports from a
 * single barrel file. When swapping assets, update imports here - the page
 * file only imports from this index.
 */

// Hero: Dead Sea landscape
export { default as heroImage } from "@/assets/retreat/hero-dead-sea-gen.jpeg";

// Teacher photos (shared across retreats)
export { default as lamaGlennPhoto } from "@/assets/retreat/lama-glenn-big.jpg";
export { default as druponPhoto } from "@/assets/retreat/drupon-chongwol.png";

// Three healing deities thangka (high-res)
export { default as threeDeities } from "@/assets/retreat/three-deities-hd.jpg";

// Medicine Buddha only (cropped for mobile hero)
export { default as medicineBuddha } from "@/assets/retreat/medicine-buddha.jpg";

// Prayer flags (What's Included background)
export { default as prayerFlagsBg } from "@/assets/heart-of-wisdom-retreat/prayer-flags.jpg";

// Venue photos (used as section backgrounds / gallery)
export { default as venuePhoto1 } from "@/assets/retreat/venue-eingedi-1.jpg";
export { default as venuePhoto2 } from "@/assets/retreat/venue-eingedi-2.jpg";
export { default as venuePhoto3 } from "@/assets/retreat/venue-eingedi-3.jpg";
export { default as venuePhoto4 } from "@/assets/retreat/venue-eingedi.jpg";

// Gallery carousel images
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
import g11 from "@/assets/retreat/gallery-11.jpg";
import g12 from "@/assets/retreat/gallery-12.jpg";
import g13 from "@/assets/retreat/gallery-13.jpg";
import g14 from "@/assets/retreat/gallery-14.jpg";
import g15 from "@/assets/retreat/gallery-15.jpg";

export const einGediGalleryImages = [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10, g11, g12, g13, g14, g15];
