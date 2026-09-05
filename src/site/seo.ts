/**
 * Head management for site pages: canonical URL, hreflang alternates and
 * JSON-LD structured data. The tags are written into <head> at runtime and
 * captured by the pre-renderer (scripts/prerender.mjs), so crawlers see them
 * in the static HTML. Elements are tagged with data-site-head so a route
 * change replaces the previous page's set cleanly.
 */
import { useEffect } from "react";
import { SITE_ORIGIN } from "./content";

const ATTR = "data-site-head";

export interface SiteHeadConfig {
  /** Absolute canonical URL of this page (omit on error pages). */
  canonical?: string;
  /** Error pages: robots noindex, no canonical. */
  noindex?: boolean;
  /** hreflang -> absolute URL (he, en, x-default). */
  alternates?: Record<string, string>;
  /** Structured-data objects, each becomes one JSON-LD script. */
  jsonLd?: Array<Record<string, unknown>>;
}

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61571229722947";
const YOUTUBE_URL = "https://www.youtube.com/channel/UCc6s-_U3kMCCZOV-3KR1ZMQ";

/** The sangha as a schema.org Organization (used on the home pages). */
export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Maitreya Sangha Israel",
  alternateName: "מאיטרייה סנגהה ישראל",
  url: `${SITE_ORIGIN}/`,
  logo: `${SITE_ORIGIN}/favicon-192.png`,
  email: "maitreyasanghaisrael@gmail.com",
  sameAs: [FACEBOOK_URL, YOUTUBE_URL],
};

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function useSiteHead(config: SiteHeadConfig) {
  // Serialize so the effect re-runs only when the actual values change
  const key = JSON.stringify(config);
  useEffect(() => {
    const cfg = JSON.parse(key) as SiteHeadConfig;
    const clear = () => document.head.querySelectorAll(`[${ATTR}]`).forEach((el) => el.remove());
    clear();
    const add = (el: HTMLElement) => {
      el.setAttribute(ATTR, "");
      document.head.appendChild(el);
    };
    if (cfg.noindex) {
      const robots = document.createElement("meta");
      robots.name = "robots";
      robots.content = "noindex, nofollow";
      add(robots);
    }
    if (cfg.canonical) {
      const canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = cfg.canonical;
      add(canonical);
    }
    for (const [hreflang, href] of Object.entries(cfg.alternates ?? {})) {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = hreflang;
      link.href = href;
      add(link);
    }
    for (const obj of cfg.jsonLd ?? []) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(obj);
      add(script);
    }
    return clear;
  }, [key]);
}
