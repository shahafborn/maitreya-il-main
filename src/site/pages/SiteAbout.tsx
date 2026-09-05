/**
 * About page (Hebrew + English). Content source: content/<lang>/pages/about.md
 * (frontmatter = SEO, body = the whole page as markdown).
 */
import { getPage, sitePath, type SiteLang } from "../content";
import { SiteLayout } from "../SiteLayout";
import { Markdown } from "../Markdown";

export const SiteAbout = ({ lang }: { lang: SiteLang }) => {
  const { meta, body } = getPage(lang, "about");
  return (
    <SiteLayout lang={lang} title={meta.title ?? ""} description={meta.description} path={sitePath(lang, "/about")}>
      <article className="container max-w-3xl py-16">
        <h1 className="font-heading text-4xl font-bold text-primary mb-10">
          {lang === "he" ? "אודות" : "About"}
        </h1>
        <Markdown>{body}</Markdown>
      </article>
    </SiteLayout>
  );
};

export default SiteAbout;
