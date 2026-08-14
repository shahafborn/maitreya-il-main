/**
 * Gallery page (Hebrew only for now).
 * Photos: the real WordPress gallery photos (downloaded full-size from the
 * live site 2026-08-14 into src/assets/site-gallery/) plus the retreat gallery
 * photos that are NOT duplicates - 8 of the 15 retreat shots are pixel-identical
 * to WP gallery photos (perceptual-hash check, 2026-08-14), so they're excluded
 * by filename below.
 * Layout: CSS-columns masonry with natural aspect ratios - photos are NEVER
 * cropped (Shahaf's explicit feedback; the earlier fixed-aspect grid cut them
 * off). Click opens the shared Lightbox (swipe + arrows), also his ask.
 * Content source for title/intro: content/he/pages/gallery.md
 */
import { useState } from "react";
import { Lightbox } from "@/components/retreat/Lightbox";
import { getPage, type SiteLang } from "../content";
import { SiteLayout } from "../SiteLayout";

const wpGallery = import.meta.glob("@/assets/site-gallery/*.{jpg,jpeg,png,webp}", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;
const retreatGallery = import.meta.glob("@/assets/retreat/gallery-*.jpg", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

// Retreat shots that duplicate WP gallery photos (same image, different file)
const RETREAT_DUPES = /gallery-(1|2|3|4|5|6|12|13)\.jpg$/;

const images = [
  ...Object.values(wpGallery),
  ...Object.entries(retreatGallery)
    .filter(([path]) => !RETREAT_DUPES.test(path))
    .map(([, url]) => url),
];

export const SiteGallery = ({ lang }: { lang: SiteLang }) => {
  const { meta, body } = getPage(lang, "gallery");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const he = lang === "he";
  const alt = he ? "מפעילויות הסנגהה" : "Sangha activities";
  return (
    <SiteLayout lang={lang} title={meta.title ?? ""} description={meta.description} path={`/${lang}/gallery`}>
      <div className="container py-16">
        <h1 className="font-heading text-4xl font-bold text-primary mb-4">
          {he ? "גלריה" : "Gallery"}
        </h1>
        {body && <p className="font-body text-lg text-muted-foreground mb-10 max-w-2xl">{body}</p>}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="block w-full mb-4 break-inside-avoid rounded-lg overflow-hidden shadow-sm focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={he ? "הגדלת תמונה" : "Enlarge photo"}
            >
              <img src={src} alt={alt} loading="lazy" className="w-full h-auto" />
            </button>
          ))}
        </div>
      </div>
      <Lightbox
        images={images}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
        alt={alt}
      />
    </SiteLayout>
  );
};

export default SiteGallery;
