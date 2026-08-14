/**
 * Site-wide footer: identity, quick links, social, contact email.
 * Social URLs verified against the live WordPress site 2026-08-14.
 */
import { Link } from "react-router-dom";
import { Facebook, Youtube, Mail } from "lucide-react";
import type { SiteLang } from "./content";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61571229722947";
const YOUTUBE_URL = "https://www.youtube.com/channel/UCc6s-_U3kMCCZOV-3KR1ZMQ";
const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";

export const SiteFooter = ({ lang }: { lang: SiteLang }) => {
  const he = lang === "he";
  const links = he
    ? [
        { label: "אירועים", to: "/he/events" },
        { label: "תרגול שבועי", to: "/practices" },
        { label: "מאמרים", to: "/he/articles" },
        { label: "אודות", to: "/he/about" },
        { label: "צור קשר", to: "/he/contact" },
      ]
    : [
        { label: "Events", to: "/en/events" },
        { label: "Weekly Practice", to: "/practices" },
        { label: "Articles", to: "/en/articles" },
        { label: "About", to: "/en/about" },
        { label: "Contact", to: "/en/contact" },
      ];

  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container py-12 grid gap-10 md:grid-cols-3">
        <div>
          <h3 className="font-heading text-xl font-bold mb-3">
            {he ? "מאיטרייה סנגהה ישראל" : "Maitreya Sangha Israel"}
          </h3>
          <p className="font-body text-sm opacity-80 leading-relaxed">
            {he
              ? "קהילה ללימוד ותרגול בודהיזם טיבטי בהנחיית לאמה גלן מולין ודרופון צ׳ונגוול-לה."
              : "A community for the study and practice of Tibetan Buddhism, guided by Lama Glenn Mullin and Drupon Chongwol-la."}
          </p>
        </div>
        <nav className="font-body text-sm">
          <h4 className="font-heading font-bold mb-3 opacity-90">{he ? "ניווט" : "Navigate"}</h4>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="opacity-80 hover:opacity-100 hover:text-gold-light transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="font-body text-sm">
          <h4 className="font-heading font-bold mb-3 opacity-90">{he ? "נשארים בקשר" : "Stay in Touch"}</h4>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex items-center gap-2 opacity-80 hover:opacity-100 mb-4"
          >
            <Mail className="h-4 w-4" />
            {CONTACT_EMAIL}
          </a>
          <div className="flex items-center gap-4">
            <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" aria-label="Facebook" className="opacity-80 hover:opacity-100">
              <Facebook className="h-5 w-5" />
            </a>
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" aria-label="YouTube" className="opacity-80 hover:opacity-100">
              <Youtube className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/20">
        <div className="container py-4 font-body text-xs opacity-70 text-center">
          {he
            ? `© ${new Date().getFullYear()} מאיטרייה סנגהה ישראל. כל הזכויות שמורות.`
            : `© ${new Date().getFullYear()} Maitreya Sangha Israel. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
};
