/**
 * Visitors from abroad land on the English twin of a Hebrew page.
 *
 * This file is plain browser JavaScript with no imports: vite-plugin-lang-redirect
 * inlines it into the <head> of every page (so the decision happens before the
 * Hebrew page paints), and src/test/lang-redirect.test.ts imports it directly.
 *
 * The rule (Shahaf, 2026-09-29): someone arriving from outside Israel goes to the
 * English site. "Outside Israel" = the device's time zone is not Israel's AND its
 * browser language is not Hebrew, so Israelis abroad keep the Hebrew site.
 * Safeguards, because Google advises against automatic language redirects:
 * - never for crawlers, link previews or the pre-render browser (Google crawls
 *   from the US - redirecting it would drop the Hebrew pages from Hebrew search);
 * - only to a page that really has an English twin; Hebrew-only pages stay;
 * - never once the visitor has picked Hebrew with the language button;
 * - never on a URL carrying anything but ad/newsletter tracking parameters
 *   (payment returns, ?test= links), and tracking parameters travel along.
 */

/** localStorage key holding the language the visitor picked with the switch ("he" | "en"). */
export const LANG_PREF_KEY = "maitreya-lang";

export const ISRAEL_TIME_ZONES = ["Asia/Jerusalem", "Asia/Tel_Aviv"];

const NON_HUMAN_UA =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|inspectiontool|facebookexternalhit|facebookcatalog|whatsapp|telegram|twitter|linkedin|slack|discord|embedly|preview/i;

const TRACKING_PARAM = /^(utm_[a-z_]+|fbclid|gclid|gbraid|wbraid|msclkid|mc_cid|mc_eid|_gl|ref)$/i;

/**
 * Where to send this visitor, or null to stay on the page.
 * @param {{ path: string, search?: string, hash?: string, twins: Record<string, string>,
 *   languages?: string[], timeZone?: string, userAgent?: string, webdriver?: boolean,
 *   pref?: string | null }} env
 * @returns {string | null}
 */
export function englishTarget(env) {
  const search = env.search || "";
  if (env.pref === "he") return null;
  if (env.webdriver || NON_HUMAN_UA.test(env.userAgent || "")) return null;
  if (!env.timeZone || ISRAEL_TIME_ZONES.indexOf(env.timeZone) !== -1) return null;
  const langs = env.languages || [];
  for (let i = 0; i < langs.length; i++) {
    if (/^(he|iw)(-|$)/i.test(langs[i] || "")) return null;
  }
  const path = env.path.length > 1 ? env.path.replace(/\/+$/, "") : env.path;
  const target = env.twins[path];
  if (!target) return null;
  const keys = Array.from(new URLSearchParams(search).keys());
  for (let i = 0; i < keys.length; i++) {
    if (!TRACKING_PARAM.test(keys[i])) return null;
  }
  return target + search + (env.hash || "");
}
