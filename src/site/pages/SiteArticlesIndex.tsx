/**
 * Articles index (Hebrew + English). Lists content/<lang>/articles/ newest first.
 * English has no articles yet - shows a graceful empty state.
 */
import { Link } from "react-router-dom";
import { getArticles, sitePath, type SiteLang } from "../content";
import { SiteLayout } from "../SiteLayout";

export const SiteArticlesIndex = ({ lang }: { lang: SiteLang }) => {
  const articles = getArticles(lang);
  const he = lang === "he";
  const title = he ? "מאמרים" : "Articles";
  return (
    <SiteLayout
      lang={lang}
      title={he ? "מאמרים - מאיטרייה סנגהה ישראל" : "Articles - Maitreya Sangha Israel"}
      description={
        he
          ? "מאמרים וראיונות על בודהיזם טיבטי, טנטרה בודהיסטית ותרגול - מאת ועם לאמה גלן מולין."
          : "Articles and interviews on Tibetan Buddhism, Buddhist tantra and practice."
      }
      path={sitePath(lang, "/articles")}
    >
      <div className="container max-w-4xl py-16">
        <h1 className="font-heading text-4xl font-bold text-primary mb-10">{title}</h1>
        {articles.length === 0 ? (
          <p className="font-body text-lg text-muted-foreground">
            {he ? "מאמרים יתפרסמו כאן בקרוב." : "Articles will be published here soon."}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {articles.map((a) => (
              <Link
                key={a.slug}
                to={sitePath(lang, `/articles/${a.slug}`)}
                className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col"
              >
                <h2 className="font-heading text-xl font-bold text-primary mb-3 leading-snug">{a.title}</h2>
                <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-4">
                  {a.description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
};

export default SiteArticlesIndex;
