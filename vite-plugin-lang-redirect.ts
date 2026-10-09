import fs from "fs";
import path from "path";
import type { Plugin } from "vite";
// @ts-ignore - plain .mjs module shared with the build scripts (no type declarations)
import { getRoutes } from "./scripts/site-routes.mjs";

/**
 * Hebrew <-> English twin pages, both directions, from the one page inventory
 * (scripts/site-routes.mjs `alternates`) - the same data behind hreflang and
 * the sitemap, so a new bilingual page is picked up with no extra list to keep.
 */
export function langTwins(): Record<string, string> {
  const twins: Record<string, string> = {};
  for (const r of getRoutes() as { path: string; lang: string; alternates?: { he?: string; en?: string } }[]) {
    const he = r.alternates?.he;
    const en = r.alternates?.en;
    if (he && en) {
      twins[he] = en;
      twins[en] = he;
    }
  }
  return twins;
}

/** Only Hebrew page -> English twin: the redirect's map (English pages never redirect). */
export function hebrewToEnglish(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const r of getRoutes() as { path: string; lang: string; alternates?: { he?: string; en?: string } }[]) {
    if (r.lang === "he" && r.alternates?.en) map[r.path] = r.alternates.en;
  }
  return map;
}

/**
 * Inlines scripts/lang-redirect.mjs at the end of <head> on every page:
 * publishes the twin map as window.__LANG_TWINS__ (the language switch reads it)
 * and sends visitors from abroad to the English twin before the Hebrew page paints.
 */
export function langRedirect(): Plugin {
  return {
    name: "maitreya-lang-redirect",
    transformIndexHtml() {
      const logic = fs
        .readFileSync(path.resolve(__dirname, "scripts/lang-redirect.mjs"), "utf8")
        .replace(/^export /gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "")
        .replace(/\n\s*\n+/g, "\n");
      const twins = JSON.stringify(langTwins());
      const he2en = JSON.stringify(hebrewToEnglish());
      const code = `(function(){${logic}
window.__LANG_TWINS__=${twins};
try{var p=null;try{p=localStorage.getItem(LANG_PREF_KEY)}catch(e){}
var t=englishTarget({path:location.pathname,search:location.search,hash:location.hash,twins:${he2en},
languages:navigator.languages||[navigator.language],timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,
userAgent:navigator.userAgent,webdriver:navigator.webdriver,pref:p});
if(t&&t!==location.pathname+location.search+location.hash){window.__LANG_REDIRECT__=t;location.replace(t);}}catch(e){}})();`;
      // window.__LANG_REDIRECT__ tells the page_view script at the top of <body>
      // (index.html) not to count the Hebrew page the visitor is leaving.
      // End of <head>: still runs before the body paints, and keeps <meta charset>
      // within the first 1024 bytes where browsers look for it.
      return [{ tag: "script", children: code, injectTo: "head" }];
    },
  };
}
