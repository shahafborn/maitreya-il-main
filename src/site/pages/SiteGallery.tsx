/**
 * Gallery page (Hebrew only for now). Interim version: shows the retreat
 * gallery photos already in src/assets/retreat/ as a responsive grid.
 * Phase 3 of the migration plan replaces these with curated full-size photos
 * (the old WordPress gallery only held thumbnails).
 * Content source for title/intro: content/he/pages/gallery.md
 */
import { getPage, type SiteLang } from "../content";
import { SiteLayout } from "../SiteLayout";

const images = Object.values(
  import.meta.glob("@/assets/retreat/gallery-*.jpg", { query: "?url", import: "default", eager: true }),
) as string[];

export const SiteGallery = ({ lang }: { lang: SiteLang }) => {
  const { meta, body } = getPage(lang, "gallery");
  const he = lang === "he";
  return (
    <SiteLayout lang={lang} title={meta.title ?? ""} description={meta.description} path={`/${lang}/gallery`}>
      <div className="container py-16">
        <h1 className="font-heading text-4xl font-bold text-primary mb-4">
          {he ? "גלריה" : "Gallery"}
        </h1>
        {body && <p className="font-body text-lg text-muted-foreground mb-10 max-w-2xl">{body}</p>}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map((src) => (
            <img
              key={src}
              src={src}
              alt={he ? "מפעילויות הסנגהה" : "Sangha activities"}
              loading="lazy"
              className="rounded-lg shadow-sm w-full aspect-[4/3] object-cover"
            />
          ))}
        </div>
      </div>
    </SiteLayout>
  );
};

export default SiteGallery;
