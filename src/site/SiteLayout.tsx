/**
 * Outer wrapper for every SITE page (home, about, articles, events, ...).
 * Sets document dir/lang, the page's SEO (title, description, Open Graph,
 * canonical URL, hreflang alternates, JSON-LD) and renders the shared
 * header + footer around the page content.
 *
 * Everything written into <head> here is captured by the pre-renderer
 * (scripts/prerender.mjs), so crawlers get it as static HTML.
 * Not used by retreat landing pages - those keep RetreatLayout.
 */
import { useEffect, type ReactNode } from "react";
import { useRetreatSEO } from "@/components/retreat/hooks/useRetreatSEO";
import { SITE_ORIGIN, sitePath, twinPath, type SiteLang } from "./content";
import { useSiteHead, ORGANIZATION_JSON_LD, breadcrumbJsonLd } from "./seo";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

interface SiteLayoutProps {
  lang: SiteLang;
  /** SEO title - required, becomes the browser/OG title. */
  title: string;
  description?: string;
  /** Public path of the page (e.g. "/about", "/en/about"); drives canonical, og:url and hreflang. */
  path?: string;
  /** Absolute og:image URL; defaults to the site-wide card. */
  ogImage?: string;
  /** Extra JSON-LD objects for this page (e.g. Article, Event list). */
  jsonLd?: Array<Record<string, unknown>>;
  /** Error pages: no canonical/alternates, robots noindex. */
  noindex?: boolean;
  children: ReactNode;
}

const absolute = (path: string) => `${SITE_ORIGIN}${path === "/" ? "/" : path}`;

export const SiteLayout = ({
  lang,
  title,
  description = "",
  path = "/",
  ogImage,
  jsonLd = [],
  noindex = false,
  children,
}: SiteLayoutProps) => {
  const dir = lang === "he" ? "rtl" : "ltr";
  const he = lang === "he";

  useEffect(() => {
    const html = document.documentElement;
    const prev = { dir: html.getAttribute("dir"), lang: html.getAttribute("lang") };
    html.setAttribute("dir", dir);
    html.setAttribute("lang", lang);
    return () => {
      if (prev.dir) html.setAttribute("dir", prev.dir);
      else html.removeAttribute("dir");
      if (prev.lang) html.setAttribute("lang", prev.lang);
    };
  }, [dir, lang]);

  const canonical = absolute(path);
  useRetreatSEO({
    title,
    description,
    keywords: he
      ? "בודהיזם טיבטי, טנטרה בודהיסטית, לאמה גלן מולין, מאיטרייה סנגהה, ריטריט, מדיטציה"
      : "Tibetan Buddhism, Buddhist tantra, Lama Glenn Mullin, Maitreya Sangha, retreat, meditation",
    url: canonical,
    ogImage: ogImage ?? `${SITE_ORIGIN}/og-default.png`,
    locale: he ? "he_IL" : "en_US",
    canonical: false, // useSiteHead below owns the canonical link
  });

  // Language-neutral sub-path ("" for home, "/about", ...) -> the twin page in the other language
  const sub = path.startsWith("/en") ? path.slice(3) : path === "/" ? "" : path;
  const twin = twinPath(lang, sub);
  const alternates: Record<string, string> = { [lang]: canonical };
  if (twin) alternates[he ? "en" : "he"] = absolute(twin);
  alternates["x-default"] = he ? canonical : absolute(twin ?? path);

  const isHome = sub === "";
  const structured: Array<Record<string, unknown>> = isHome
    ? [
        ORGANIZATION_JSON_LD,
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: he ? "מאיטרייה סנגהה ישראל" : "Maitreya Sangha Israel",
          url: canonical,
          inLanguage: he ? "he" : "en",
        },
      ]
    : [
        breadcrumbJsonLd([
          { name: he ? "בית" : "Home", url: absolute(sitePath(lang)) },
          { name: title.split(" - ")[0].split(" | ")[0], url: canonical },
        ]),
      ];

  useSiteHead(
    noindex
      ? { noindex: true }
      : { canonical, alternates, jsonLd: [...structured, ...jsonLd] },
  );

  return (
    <div dir={dir} lang={lang} className="min-h-screen flex flex-col bg-background text-foreground font-body">
      <SiteHeader lang={lang} />
      <main className="flex-1">{children}</main>
      <SiteFooter lang={lang} />
    </div>
  );
};
