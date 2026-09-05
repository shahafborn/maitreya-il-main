/**
 * Generic document page: a markdown file from content/<lang>/pages/<name>.md
 * rendered under the site chrome, at whatever path the route gives it.
 * Frontmatter: title (SEO/browser title), description, heading (the H1;
 * falls back to title). Used for standalone documents such as retreat terms.
 */
import { getPage, type SiteLang } from "../content";
import { SiteLayout } from "../SiteLayout";
import { Markdown } from "../Markdown";

interface SiteDocPageProps {
  lang: SiteLang;
  /** File name under content/<lang>/pages/ without .md */
  name: string;
  /** Public path of this page (for canonical / og:url). */
  path: string;
}

export const SiteDocPage = ({ lang, name, path }: SiteDocPageProps) => {
  const { meta, body } = getPage(lang, name);
  return (
    <SiteLayout lang={lang} title={meta.title ?? ""} description={meta.description} path={path}>
      <article className="container max-w-3xl py-16">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-10 leading-tight">
          {meta.heading || meta.title}
        </h1>
        <Markdown>{body}</Markdown>
      </article>
    </SiteLayout>
  );
};

export default SiteDocPage;
