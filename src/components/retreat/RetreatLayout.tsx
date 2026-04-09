import type { ReactNode } from "react";
import maitreyaLogo from "@/assets/maitreya-logo.png";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import type { RetreatLang, RetreatDir, SEOConfig } from "./types";
import { useRetreatSEO } from "./hooks/useRetreatSEO";

interface RetreatLayoutProps {
  lang: RetreatLang;
  dir: RetreatDir;
  seo: SEOConfig;
  /** CTA label shown in the sticky nav (e.g. "להרשמה"). */
  navCtaLabel: string;
  /** Called when the nav CTA is clicked. */
  onNavCtaClick: () => void;
  /** Footer copyright line (e.g. "© 2026 מאיטרייה סנגהה ישראל. כל הזכויות שמורות."). */
  footerText: string;
  children: ReactNode;
}

/**
 * Outer layout for retreat landing pages. Sets fonts, direction, colors,
 * and renders the sticky nav + footer. All other page sections are passed as children.
 *
 * Language and direction propagate via the `lang` and `dir` props - every
 * child component reads `dir` from the DOM via native CSS (e.g. `text-start`)
 * so components don't need to be language-aware themselves.
 *
 * @example
 * <RetreatLayout lang="he" dir="rtl" seo={seo} navCtaLabel="להרשמה"
 *   onNavCtaClick={open} footerText="© 2026 …">
 *   <RetreatHero … />
 *   …
 * </RetreatLayout>
 */
export const RetreatLayout = ({
  lang,
  dir,
  seo,
  navCtaLabel,
  onNavCtaClick,
  footerText,
  children,
}: RetreatLayoutProps) => {
  useRetreatSEO(seo);

  return (
    <div
      lang={lang}
      dir={dir}
      style={{
        backgroundColor: RETREAT_THEME.CREAM,
        color: RETREAT_THEME.DARK,
        fontFamily: RETREAT_FONTS.sans,
      }}
      className="min-h-screen"
    >
      {/* ── Sticky nav ── */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/90 border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="https://maitreya.org.il/">
            <img src={maitreyaLogo} alt="Maitreya Sangha" className="h-11 object-contain" />
          </a>
          <button
            className="py-2.5 px-6 text-base font-bold text-white rounded-full shadow-md hover:shadow-xl hover:scale-110 hover:brightness-110 transition-all duration-200"
            style={{ backgroundColor: RETREAT_THEME.GOLD_DARK }}
            onClick={onNavCtaClick}
          >
            {navCtaLabel}
          </button>
        </div>
      </nav>

      {children}

      {/* ── Footer ── */}
      <footer
        className="py-8 text-center text-sm border-t border-stone-200"
        style={{ color: RETREAT_THEME.WARM_GRAY }}
      >
        <p>{footerText}</p>
      </footer>
    </div>
  );
};
