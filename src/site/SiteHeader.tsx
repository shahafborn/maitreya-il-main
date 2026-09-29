/**
 * Site-wide sticky header: logo, main nav, language switch, mobile menu.
 * Used by SiteLayout on every site page (NOT on retreat landing pages,
 * which keep their own focused RetreatLayout nav).
 * Labels are hardcoded per language here (chrome, not content) - the
 * editable page content lives in /content.
 */
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { sitePath, type SiteLang } from "./content";
import { otherLangPath, rememberLang } from "./langSwitch";
import logo from "@/assets/maitreya-logo.png";

interface NavItem {
  label: string;
  to: string;
}

// Paths are built with sitePath so the URL scheme lives in one place (content.ts)
const NAV: Record<SiteLang, NavItem[]> = {
  // The Hebrew nav carries the December visit's support page instead of the
  // standing /dana page (Shahaf, 2026-09-16). /dana still exists and stays
  // indexed - it is simply out of the menu while the visit is on, so this needs
  // putting back after December (task: visit-support-page-retire).
  he: [
    { label: "בית", to: sitePath("he") },
    { label: "אירועים", to: sitePath("he", "/events") },
    { label: "תרגול שבועי", to: "/weekly-practice" },
    { label: "מאמרים", to: sitePath("he", "/articles") },
    { label: "גלריה", to: sitePath("he", "/gallery") },
    { label: "אודות", to: sitePath("he", "/about") },
    { label: "תרומה וסיוע", to: "/support-visit-dec-2026" },
    { label: "צור קשר", to: sitePath("he", "/contact") },
  ],
  en: [
    { label: "Home", to: sitePath("en") },
    { label: "Events", to: sitePath("en", "/events") },
    { label: "Weekly Practice", to: "/weekly-practice" },
    { label: "Articles", to: sitePath("en", "/articles") },
    { label: "About", to: sitePath("en", "/about") },
    { label: "Dana", to: sitePath("en", "/dana") },
    { label: "Contact", to: sitePath("en", "/contact") },
  ],
};

export const SiteHeader = ({ lang }: { lang: SiteLang }) => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const items = NAV[lang];
  // The switch leads to the same page in the other language when it has one
  const otherLang = {
    label: lang === "he" ? "English" : "עברית",
    code: (lang === "he" ? "en" : "he") as SiteLang,
    to: otherLangPath(lang, pathname),
  };

  const linkClass = (to: string) =>
    `font-body text-sm transition-colors hover:text-accent ${
      pathname === to ? "text-accent font-semibold" : "text-primary"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container flex items-center justify-between py-3">
        {/* The logo image already carries the bilingual name - no text beside it */}
        {/* Smaller on phones so the language button beside the menu icon has room (2026-09-29) */}
        <Link to={sitePath(lang)} className="flex items-center">
          <img src={logo} alt="מאיטרייה סנגהה ישראל" className="h-9 min-[350px]:h-10 min-[375px]:h-11 lg:h-14 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {items.map((item) => (
            <Link key={item.to} to={item.to} className={linkClass(item.to)}>
              {item.label}
            </Link>
          ))}
          <Link
            to={otherLang.to}
            onClick={() => rememberLang(otherLang.code)}
            lang={otherLang.code}
            className="font-body text-sm border border-border rounded-full px-3 py-1 text-muted-foreground hover:text-accent hover:border-accent transition-colors"
          >
            {otherLang.label}
          </Link>
        </nav>

        {/* Mobile: the language button sits in the header beside the menu icon, not inside the menu (2026-09-29) */}
        <div className="lg:hidden flex items-center gap-1.5">
          <Link
            to={otherLang.to}
            onClick={() => rememberLang(otherLang.code)}
            lang={otherLang.code}
            className="font-body text-[12.5px] font-medium leading-none rounded-full border border-[hsl(220_15%_85%)] bg-white px-[11px] py-[7px] text-[hsl(220_40%_30%)] hover:text-accent hover:border-accent transition-colors whitespace-nowrap"
          >
            {otherLang.label}
          </Link>
          <button
            className="p-2 text-primary"
            onClick={() => setOpen(!open)}
            aria-label={lang === "he" ? "תפריט" : "Menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="lg:hidden border-t border-border bg-background">
          <div className="container py-4 flex flex-col gap-4">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={linkClass(item.to)}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};
