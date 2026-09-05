/**
 * Single article page. Route: /<lang>/articles/:slug -> content/<lang>/articles/<slug>.md
 * Unknown slug renders the index's empty state with a back link (no crash).
 */
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getArticle, sitePath, SITE_ORIGIN, type SiteLang } from "../content";
import { SiteLayout } from "../SiteLayout";
import { Markdown } from "../Markdown";

export const SiteArticle = ({ lang }: { lang: SiteLang }) => {
  const { slug = "" } = useParams();
  const article = getArticle(lang, slug);
  const he = lang === "he";
  const Arrow = he ? ArrowRight : ArrowLeft;

  if (!article) {
    return (
      <SiteLayout lang={lang} title={he ? "מאמר לא נמצא" : "Article not found"} path={sitePath(lang, "/articles")}>
        <div className="container max-w-3xl py-16 text-center">
          <p className="font-body text-lg mb-6">{he ? "המאמר לא נמצא." : "Article not found."}</p>
          <Link to={sitePath(lang, "/articles")} className="text-accent hover:text-secondary inline-flex items-center gap-1">
            <Arrow className="h-4 w-4" />
            {he ? "לכל המאמרים" : "All articles"}
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const path = sitePath(lang, `/articles/${slug}`);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    inLanguage: lang,
    mainEntityOfPage: `${SITE_ORIGIN}${path}`,
    author: { "@type": "Organization", name: "Maitreya Sangha Israel" },
    publisher: { "@type": "Organization", name: "Maitreya Sangha Israel", url: `${SITE_ORIGIN}/` },
  };
  return (
    <SiteLayout lang={lang} title={article.title} description={article.description} path={path} jsonLd={[articleJsonLd]}>
      <article className="container max-w-3xl py-16">
        <Link
          to={sitePath(lang, "/articles")}
          className="font-body text-sm text-accent hover:text-secondary inline-flex items-center gap-1 mb-8"
        >
          <Arrow className="h-4 w-4" />
          {he ? "לכל המאמרים" : "All articles"}
        </Link>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-8 leading-tight">
          {article.title}
        </h1>
        <Markdown>{article.body}</Markdown>
      </article>
    </SiteLayout>
  );
};

export default SiteArticle;
