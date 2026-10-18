/**
 * Registration source capture ("where did this registrant come from?").
 *
 * On every page load, `captureAttribution()` (called from src/main.tsx) reads
 * the landing URL's utm_source / utm_medium / utm_campaign / utm_content and
 * whether it carries an fbclid (only "yes"/"no" is kept, never the click id).
 * A landing that has any of these is a "touch":
 *
 * - first touch: kept in localStorage for 90 days, never overwritten while valid;
 * - last touch:  overwritten by each new touch, kept for 30 days.
 *
 * `attributionPayload()` turns both into flat fields that the retreat
 * registration form (RegistrationModal) adds to its n8n webhook body; the
 * `*_Register` / `*_Register_Paid` n8n flows write them to sheet columns of the
 * same names, and the registrations board (vault reg_data.py) reads them.
 * A visitor with no tagged visit sends empty strings.
 *
 * No personal data: campaign tags and a date only. Falls back to
 * sessionStorage, and to nothing, where localStorage is blocked.
 */

export interface Touch {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  fbclid: "yes" | "no";
  /** ISO date-time of the landing */
  at: string;
}

const FIRST_KEY = "maitreya_attr_first";
const LAST_KEY = "maitreya_attr_last";
const DAY = 24 * 60 * 60 * 1000;
export const FIRST_TOUCH_DAYS = 90;
export const LAST_TOUCH_DAYS = 30;

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

function store(): Storage | null {
  try {
    localStorage.setItem("__attr_probe", "1");
    localStorage.removeItem("__attr_probe");
    return localStorage;
  } catch {
    try {
      return sessionStorage;
    } catch {
      return null;
    }
  }
}

function read(s: Storage, key: string, maxDays: number, now: number): Touch | null {
  try {
    const raw = s.getItem(key);
    if (!raw) return null;
    const t = JSON.parse(raw) as Touch;
    if (!t.at || now - Date.parse(t.at) > maxDays * DAY) {
      s.removeItem(key);
      return null;
    }
    return t;
  } catch {
    return null;
  }
}

/** The touch in a URL query string, or null when it carries no tags. */
export function touchFromSearch(search: string, now = Date.now()): Touch | null {
  const q = new URLSearchParams(search);
  const fb = q.has("fbclid");
  const vals = UTM_KEYS.map((k) => (q.get(k) || "").trim().slice(0, 150));
  if (!fb && vals.every((v) => !v)) return null;
  const [utm_source, utm_medium, utm_campaign, utm_content] = vals;
  return { utm_source, utm_medium, utm_campaign, utm_content, fbclid: fb ? "yes" : "no", at: new Date(now).toISOString() };
}

/** Record this landing's touch, if any. Safe to call on every page load. */
export function captureAttribution(search = window.location.search, now = Date.now()): void {
  if (typeof window === "undefined") return;
  // Not inside the Cardcom payment iframe, not on the admin (same as page_view in index.html)
  if (window.top !== window.self || window.location.pathname.startsWith("/admin")) return;
  const touch = touchFromSearch(search, now);
  if (!touch) return;
  const s = store();
  if (!s) return;
  try {
    if (!read(s, FIRST_KEY, FIRST_TOUCH_DAYS, now)) s.setItem(FIRST_KEY, JSON.stringify(touch));
    s.setItem(LAST_KEY, JSON.stringify(touch));
  } catch {
    /* storage full or blocked */
  }
}

/**
 * Flat fields for the registration webhook: last touch as `utm_*` / `fbclid`,
 * first touch as `first_utm_*` / `first_fbclid` / `first_touch_at`.
 *
 * @example fetch(url, { body: JSON.stringify({ ...form, ...attributionPayload() }) })
 */
export function attributionPayload(now = Date.now()): Record<string, string> {
  const s = typeof window === "undefined" ? null : store();
  const first = s ? read(s, FIRST_KEY, FIRST_TOUCH_DAYS, now) : null;
  const last = s ? read(s, LAST_KEY, LAST_TOUCH_DAYS, now) : null;
  return {
    utm_source: last?.utm_source ?? "",
    utm_medium: last?.utm_medium ?? "",
    utm_campaign: last?.utm_campaign ?? "",
    utm_content: last?.utm_content ?? "",
    fbclid: last?.fbclid ?? "",
    first_utm_source: first?.utm_source ?? "",
    first_utm_medium: first?.utm_medium ?? "",
    first_utm_campaign: first?.utm_campaign ?? "",
    first_utm_content: first?.utm_content ?? "",
    first_fbclid: first?.fbclid ?? "",
    first_touch_at: first?.at ?? "",
  };
}
