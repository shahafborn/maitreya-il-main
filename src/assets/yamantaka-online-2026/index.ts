/**
 * Asset re-exports for the Yamantaka three-month online retreat (Sept-Nov 2026).
 *
 * Source: the campaign graphic Shahaf produced for the program - Drupon
 * Chongwol-la and Lama Glenn in front of a Yamantaka thangka. The hero is the
 * text-free crop of that same image, so the page and the promotion match.
 */

// Ekavira ("Solitary Hero") Yamantaka thangka - the cover Shahaf supplied on
// 20 Aug 2026. The source is portrait, so the desktop file lays the whole
// painting on a wide canvas and extends its own sky sideways instead of
// cropping the deity; mobile gets the painting near its native ratio.
export { default as yamantakaHero } from "./hero-ekavira.jpg";
export { default as yamantakaHeroMobile } from "./hero-ekavira-mobile.jpg";

// The complete painting, uncropped, shown inline above the "who is Yamantaka"
// heading. Converted from Shahaf's high-res source (ekavirahr.tif, 1937x2414)
// at its full extent - throne, lotus, sky and landscape included. The hero
// files above are crops of this same painting and cut all of that off, so do
// not substitute one for the other here.
export { default as yamantakaThangka } from "./thangka-ekavira-full.jpg";

// Previous hero: the text-free crop of the campaign graphic. Kept for reference.
export { default as yamantakaHeroLegacy } from "./hero-yamantaka.png";

// The full campaign graphic, text and all - used for cross-promotion cards.
export { default as yamantakaPromoCard } from "./promo-card.png";

// Real photo, shared across pages.
export { default as druponPhoto } from "@/assets/retreat/drupon-chongwol.png";
