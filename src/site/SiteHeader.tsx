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
import logo from "@/assets/maitreya-logo.png";

interface NavItem {
  label: string;
  to: string;
}

// Paths are built with sitePath so the URL scheme lives in one place (content.ts)
const NAV: Record<SiteLang, NavItem[]> = {
  he: [
    { label: "בית", to: sitePath("he") },
    { label: "אירועים", to: sitePath("he", "/events") },
    { label: "תרגול שבועי", to: "/practices" },
    { label: "מאמרים", to: sitePath("he", "/articles") },
    { label: "גלריה", to: sitePath("he", "/gallery") },
    { label: "אודות", to: sitePath("he", "/about") },
    { label: "דאנה", to: sitePath("he", "/dana") },
    { label: "צור קשר", to: sitePath("he", "/contact") },
  ],
  en: [
    { label: "Home", to: sitePath("en") },
    { label: "Events", to: sitePath("en", "/events") },
    { label: "Weekly Practice", to: "/practices" },
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
  const otherLang: { label: string; to: string } =
    lang === "he" ? { label: "English", to: sitePath("en") } : { label: "עברית", to: sitePath("he") };

  const linkClass = (to: string) =>
    `font-body text-sm transition-colors hover:text-accent ${
      pathname === to ? "text-accent font-semibold" : "text-primary"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container flex items-center justify-between py-3">
        {/* The logo image already carries the bilingual name - no text beside it */}
        <Link to={sitePath(lang)} className="flex items-center">
          <img src={logo} alt="מאיטרייה סנגהה ישראל" className="h-14 w-auto" />
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
            className="font-body text-sm border border-border rounded-full px-3 py-1 text-muted-foreground hover:text-accent hover:border-accent transition-colors"
          >
            {otherLang.label}
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="lg:hidden p-2 text-primary"
          onClick={() => setOpen(!open)}
          aria-label={lang === "he" ? "תפריט" : "Menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
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
            <Link
              to={otherLang.to}
              className="font-body text-sm text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              {otherLang.label}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};
