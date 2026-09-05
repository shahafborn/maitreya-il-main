import { useEffect } from "react";
import type { SEOConfig } from "../types";

const SITE_NAME = "Maitreya Sangha Israel";

/**
 * Sets document.title and a standard set of meta tags (description, keywords,
 * og:title/description/url/image/type/locale/site_name, twitter card) plus the
 * canonical link for a page. Used by the retreat landing pages (via
 * RetreatLayout) and by the site pages (via SiteLayout, which manages its own
 * canonical/hreflang and passes `canonical: false`).
 *
 * Mounted once per page. Runs in useEffect - the pre-renderer captures the
 * result, so crawlers see these tags in the static HTML.
 *
 * @example
 * useRetreatSEO({
 *   title: "ריטריט לב החוכמה",
 *   description: "…",
 *   keywords: "…",
 *   url: "https://maitreya.org.il/events/heart-of-wisdom-retreat",
 *   ogImage: "https://maitreya.org.il/og-heart-of-wisdom-retreat.png",
 *   locale: "he_IL",
 * });
 */
export function useRetreatSEO(seo: SEOConfig) {
  useEffect(() => {
    document.title = seo.title;

    const setMeta = (name: string, content: string) => {
      let el =
        document.querySelector(`meta[name="${name}"]`) ||
        document.querySelector(`meta[property="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(name.startsWith("og:") ? "property" : "name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", seo.description);
    setMeta("keywords", seo.keywords);
    setMeta("og:title", seo.title);
    setMeta("og:description", seo.description);
    setMeta("og:url", seo.url);
    setMeta("og:image", seo.ogImage);
    setMeta("og:type", "website");
    setMeta("og:locale", seo.locale);
    setMeta("og:site_name", SITE_NAME);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", seo.title);
    setMeta("twitter:description", seo.description);
    setMeta("twitter:image", seo.ogImage);

    if (seo.canonical === false) return;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"][data-seo-canonical]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      link.setAttribute("data-seo-canonical", "");
      document.head.appendChild(link);
    }
    link.href = seo.url;
    return () => {
      link?.remove();
    };
  }, [seo.title, seo.description, seo.keywords, seo.url, seo.ogImage, seo.locale, seo.canonical]);
}
