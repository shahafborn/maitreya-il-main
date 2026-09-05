/**
 * 404 page, bilingual (Hebrew first, English below). Served by the server for
 * any unknown URL with a real 404 status (dist/404.html, pre-rendered from
 * this component) and rendered client-side for unknown in-app routes.
 */
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SiteLayout } from "@/site/SiteLayout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <SiteLayout
      lang="he"
      title="הדף לא נמצא | Page not found - מאיטרייה סנגהה ישראל"
      description="הדף שחיפשתם לא נמצא. The page you were looking for was not found."
      noindex
    >
      <div className="container max-w-2xl py-20 md:py-28 text-center">
        <p className="font-heading text-7xl font-bold text-accent mb-6">404</p>
        <h1 className="font-heading text-3xl font-bold text-primary mb-3">הדף לא נמצא</h1>
        <p className="font-body text-lg text-muted-foreground mb-8 leading-relaxed">
          ייתכן שהקישור ישן או שהדף הועבר. אפשר להמשיך מדף הבית או לעבור לאירועים הקרובים.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mb-16">
          <Link
            to="/"
            className="inline-flex items-center bg-primary text-primary-foreground font-body font-semibold rounded-full px-8 py-3 hover:bg-deep-blue-light transition-colors"
          >
            לדף הבית
          </Link>
          <Link
            to="/events"
            className="inline-flex items-center border border-border text-primary font-body font-semibold rounded-full px-8 py-3 hover:border-accent hover:text-accent transition-colors"
          >
            לאירועים
          </Link>
        </div>
        <div dir="ltr" lang="en" className="border-t border-border pt-10">
          <h2 className="font-heading text-2xl font-bold text-primary mb-2">Page not found</h2>
          <p className="font-body text-muted-foreground mb-6">
            The link may be old or the page has moved.
          </p>
          <Link to="/en" className="font-body text-accent hover:text-secondary transition-colors">
            English home page
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
};

export default NotFound;
