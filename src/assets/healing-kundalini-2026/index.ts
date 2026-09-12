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
// Option D (Shahaf, 2026-09-11), in use: Vajrayogini with the chakras and seed syllables -
// the subtle body the kundalini work is done on. Source 3505x2480
// (vault: marketing/vajrayogini-chakras-source.jpg).
export { default as vajrayoginiChakras } from "./vajrayogini-chakras.jpg";
// Option E (Shahaf, 2026-09-11), in use: the Amitayus thangka from the Nov 2025 healing-visit
// poster - Dropbox: _LG&C Visits/LG&C 11-2025 Visit/Amitayus/Amitayus_for_print.png (3765x5728).
export { default as amitayusThangka } from "./amitayus-thangka.jpg";
// Option F (Shahaf, 2026-09-11), in use: the Amitayus from the Nov 2025 healing-yoga flyer -
// Shahaf's own render (Downloads/shahafbor_...5187dde4...png, 1632x2912; the flyer's Source
// folder in Dropbox holds its square siblings), cropped to the figure at about 2:3.
export { default as amitayusPoster } from "./amitayus-poster.jpg";
// Option G (Shahaf, 2026-09-11), IN USE: the 19th-century Amitayus thangka used for the
// Nov 2025 print-size poster - Dropbox: _LG&C Visits/LG&C 11-2025 Visit/Amitayus/
// Amitayus_for_print_1.png (4134x5337).
export { default as amitayusAntique } from "./amitayus-antique.jpg";
// Option H (Shahaf, 2026-09-11), IN USE: "Cosmic Man with Diagrams of Newar Yogic Six Chakra
// Transformation", LACMA M.91.118 - the traditional diagram of the subtle body and its chakras.
// Source 1255x2100 (vault: marketing/cosmic-man-six-chakras-lacma-source.jpg).
export { default as cosmicManChakras } from "./cosmic-man-chakras.jpg";
// Option I (Shahaf, 2026-09-11), IN USE: Vajrayogini with the central channel only, cut from
// the chakras-and-syllables diagram (the side columns dropped), white on both sides.
export { default as vajrayoginiChannel } from "./vajrayogini-channel.jpg";
// Ein Gedi page, six-yogas section (Shahaf, 2026-09-12): two seated yogis by a lotus - Shahaf's own
// crop (Inbox yogis.png, 638x380), Gemini-upscaled with a restoration prompt and trimmed back to his
// exact framing (vault: marketing/two-yogis-mural-shahaf-crop.jpg + -upscaled-gemini.jpg).
export { default as nigumaMural } from "./niguma-mural.jpg";
// Ein Gedi page, empowerment block (Shahaf, 2026-09-12): the Vajrayogini thangka printed for
// the Nov 2025 poster - Dropbox: _LG&C Visits/LG&C 11-2025 Visit/VY/vy/Vajrayogini_for_print_02.png.
export { default as vajrayoginiThangka } from "./vajrayogini-thangka.jpg";
// Ein Gedi page hero (Shahaf, 2026-09-12): the Niguma painting from his Inbox (niguma.jpg, a
// mounted thangka photo), cropped to the painted panel; the hero zooms into it at full width (object-cover).
// Panel: vault marketing/niguma-painting-panel.jpg.
export { default as heroNiguma } from "./hero-niguma.jpg";
export { default as heroNigumaMobile } from "./hero-niguma-mobile.jpg";
// Palden Lhamo block (Shahaf, 2026-09-11): Lhamo Latso, her oracle lake in Tibet - the
// second image Shahaf supplied (vault: marketing/lhamo-latso-shahaf-v2.jpg), replacing the
// Gemini-generated scene (kept in the vault as lhamo-latso-generated.jpg).
export { default as lhamoLatso } from "./lhamo-latso.jpg";
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
