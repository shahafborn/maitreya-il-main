/**
 * Markdown renderer for site content (articles, page bodies).
 * Thin wrapper over react-markdown with the site's typography classes.
 * Direction/alignment comes from the surrounding SiteLayout (dir attribute).
 */
import ReactMarkdown from "react-markdown";

export const Markdown = ({ children }: { children: string }) => (
  <div className="prose prose-lg max-w-none font-body prose-headings:font-heading prose-headings:text-primary prose-a:text-accent hover:prose-a:text-secondary prose-img:rounded-lg prose-img:shadow-md">
    <ReactMarkdown>{children}</ReactMarkdown>
  </div>
);
