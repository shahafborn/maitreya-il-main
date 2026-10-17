/**
 * Markdown renderer for site content (articles, page bodies).
 * Thin wrapper over react-markdown with the site's typography classes.
 * Direction/alignment comes from the surrounding SiteLayout (dir attribute).
 */
import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { VisitPromo } from "./VisitPromo";
import { RetreatPromo } from "./RetreatPromo";
import type { SiteLang } from "./content";

/**
 * Content files reference images as clean "/media/..." paths (editor-friendly,
 * base-agnostic). Resolve them against the Vite base at render time so they
 * work under /p/ today and under / after the domain cutover.
 */
const resolveSrc = (src?: string) =>
  src?.startsWith("/media/") ? import.meta.env.BASE_URL + src.slice(1) : src;

/**
 * A paragraph that is nothing but a YouTube link (bare URL or a link whose
 * text is the URL) renders as an embedded player - this is how the WordPress
 * articles' interview videos migrate (content/README.md documents the rule).
 */
/**
 * A paragraph that is nothing but [[visit-promo]] becomes the current visit's
 * box (VisitPromo), which lives in one content file and hides itself once the
 * visit is over. Articles carry the marker, never the promo text.
 */
const VISIT_PROMO_RE = /^\[\[visit-promo\]\]$/;

/** Same idea for [[retreat-promo]]: the photo card for one retreat (RetreatPromo). */
const RETREAT_PROMO_RE = /^\[\[retreat-promo\]\]$/;

const YT_RE =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=([\w-]{6,})(?:[&?]\S*)?|youtu\.be\/([\w-]{6,})(?:\?\S*)?)$/;

/**
 * Same rule for a Bunny Stream video: a paragraph that is nothing but its embed
 * link (https://iframe.mediadelivery.net/embed/<library>/<video>) becomes the
 * Bunny player. Used for our own uploads, e.g. interviews with Hebrew subtitles.
 */
const BUNNY_RE =
  /^https:\/\/iframe\.mediadelivery\.net\/embed\/(\d+)\/([0-9a-f-]{36})(?:\?\S*)?$/;

const BunnyEmbed = ({ url }: { url: string }) => {
  const m = url.match(BUNNY_RE);
  if (!m) return null;
  return (
    <div className="aspect-video my-8 rounded-lg overflow-hidden shadow-md not-prose">
      <iframe
        src={`https://iframe.mediadelivery.net/embed/${m[1]}/${m[2]}?autoplay=false&preload=false&responsive=true`}
        title="Video"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="w-full h-full border-0"
      />
    </div>
  );
};

const flattenText =(children: ReactNode): string =>
  Children.toArray(children)
    .map((c) =>
      typeof c === "string" || typeof c === "number"
        ? String(c)
        : isValidElement<{ children?: ReactNode }>(c)
          ? flattenText(c.props.children)
          : "",
    )
    .join("");

const YouTubeEmbed = ({ url }: { url: string }) => {
  const m = url.match(YT_RE);
  const id = m?.[1] ?? m?.[2];
  if (!id) return null;
  const start = url.match(/[?&](?:t|start)=(\d+)/)?.[1];
  return (
    <div className="aspect-video my-8 rounded-lg overflow-hidden shadow-md not-prose">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="w-full h-full border-0"
      />
    </div>
  );
};

export const Markdown = ({ children, lang = "he" }: { children: string; lang?: SiteLang }) => (
  <div className="prose prose-lg max-w-none font-body prose-headings:font-heading prose-headings:text-primary prose-a:text-accent hover:prose-a:text-secondary prose-img:rounded-lg prose-img:shadow-md">
    <ReactMarkdown
      components={{
        img: ({ src, alt }) => <img src={resolveSrc(src)} alt={alt ?? ""} loading="lazy" />,
        p: ({ children: pChildren }) => {
          const text = flattenText(pChildren).trim();
          if (YT_RE.test(text)) return <YouTubeEmbed url={text} />;
          if (BUNNY_RE.test(text)) return <BunnyEmbed url={text} />;
          if (VISIT_PROMO_RE.test(text)) return <VisitPromo lang={lang} />;
          if (RETREAT_PROMO_RE.test(text)) return <RetreatPromo lang={lang} />;
          return <p>{pChildren}</p>;
        },
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
);
