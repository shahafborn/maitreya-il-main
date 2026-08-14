/**
 * Markdown renderer for site content (articles, page bodies).
 * Thin wrapper over react-markdown with the site's typography classes.
 * Direction/alignment comes from the surrounding SiteLayout (dir attribute).
 */
import ReactMarkdown from "react-markdown";

/**
 * Content files reference images as clean "/media/..." paths (editor-friendly,
 * base-agnostic). Resolve them against the Vite base at render time so they
 * work under /p/ today and under / after the domain cutover.
 */
const resolveSrc = (src?: string) =>
  src?.startsWith("/media/") ? import.meta.env.BASE_URL + src.slice(1) : src;

export const Markdown = ({ children }: { children: string }) => (
  <div className="prose prose-lg max-w-none font-body prose-headings:font-heading prose-headings:text-primary prose-a:text-accent hover:prose-a:text-secondary prose-img:rounded-lg prose-img:shadow-md">
    <ReactMarkdown
      components={{
        img: ({ src, alt }) => <img src={resolveSrc(src)} alt={alt ?? ""} loading="lazy" />,
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
);
