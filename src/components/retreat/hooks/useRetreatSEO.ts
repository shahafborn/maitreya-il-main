import { useEffect } from "react";
import type { SEOConfig } from "../types";

/**
 * Sets document.title and a standard set of meta tags (description, keywords,
 * og:title/description/url/image/type/locale) for a retreat landing page.
 *
 * Mounted once per page. Runs in useEffect so SSR-safe (does nothing until hydration).
 *
 * @example
 * useRetreatSEO({
 *   title: "ריטריט לב החוכמה",
 *   description: "…",
 *   keywords: "…",
 *   url: "https://maitreya.org.il/p/events/heart-of-wisdom-retreat",
 *   ogImage: "https://maitreya.org.il/p/og-heart-of-wisdom-retreat.png",
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
  }, [seo.title, seo.description, seo.keywords, seo.url, seo.ogImage, seo.locale]);
}
