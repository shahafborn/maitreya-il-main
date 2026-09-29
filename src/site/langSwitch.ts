/**
 * The language switch: where it leads and what it remembers.
 *
 * The twin map (Hebrew page <-> English page) is published on window by the
 * inline head script from vite-plugin-lang-redirect, built from the page
 * inventory in scripts/site-routes.mjs. The picked language is remembered so
 * a visitor from abroad who chooses Hebrew is never sent to English again.
 */
import { sitePath, type SiteLang } from "./content";
// @ts-ignore - plain .mjs shared with the inline head script (no type declarations)
import { LANG_PREF_KEY } from "../../scripts/lang-redirect.mjs";

declare global {
  interface Window {
    __LANG_TWINS__?: Record<string, string>;
  }
}

/** The same page in the other language when it has one, else the other language's home page. */
export function otherLangPath(lang: SiteLang, pathname: string): string {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const twin = typeof window !== "undefined" ? window.__LANG_TWINS__?.[clean] : undefined;
  return twin || sitePath(lang === "he" ? "en" : "he");
}

/** Remember the language the visitor picked (read by the redirect in the page head). */
export function rememberLang(lang: SiteLang): void {
  try {
    localStorage.setItem(LANG_PREF_KEY as string, lang);
  } catch {
    // private mode / blocked storage: the switch still works, it just isn't remembered
  }
}
