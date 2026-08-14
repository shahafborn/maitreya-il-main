/**
 * Outer wrapper for every SITE page (home, about, articles, events, ...).
 * Sets document dir/lang, page SEO (title/description/OG), and renders the
 * shared header + footer around the page content.
 *
 * Not used by retreat landing pages - those keep RetreatLayout.
 */
import { useEffect, type ReactNode } from "react";
import { useRetreatSEO } from "@/components/retreat/hooks/useRetreatSEO";
import type { SiteLang } from "./content";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

interface SiteLayoutProps {
  lang: SiteLang;
  /** SEO title - required, becomes the browser/OG title. */
  title: string;
  description?: string;
  /** Canonical path (e.g. "/he/about") used for og:url. */
  path?: string;
  children: ReactNode;
}

export const SiteLayout = ({ lang, title, description = "", path = "", children }: SiteLayoutProps) => {
  const dir = lang === "he" ? "rtl" : "ltr";

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

  useRetreatSEO({
    title,
    description,
    keywords:
      lang === "he"
        ? "בודהיזם טיבטי, טנטרה בודהיסטית, לאמה גלן מולין, מאיטרייה סנגהה, ריטריט, מדיטציה"
        : "Tibetan Buddhism, Buddhist tantra, Lama Glenn Mullin, Maitreya Sangha, retreat, meditation",
    url: `https://maitreya.org.il${path}`,
    ogImage: "https://maitreya.org.il/p/og-default.png",
    locale: lang === "he" ? "he_IL" : "en_US",
  });

  return (
    <div dir={dir} lang={lang} className="min-h-screen flex flex-col bg-background text-foreground font-body">
      <SiteHeader lang={lang} />
      <main className="flex-1">{children}</main>
      <SiteFooter lang={lang} />
    </div>
  );
};
