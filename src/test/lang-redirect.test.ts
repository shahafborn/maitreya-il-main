/**
 * Visitors from abroad land on the English twin (scripts/lang-redirect.mjs,
 * inlined into every page head by vite-plugin-lang-redirect).
 */
import { describe, it, expect } from "vitest";
import { englishTarget } from "../../scripts/lang-redirect.mjs";
import { langTwins, hebrewToEnglish } from "../../vite-plugin-lang-redirect";

const twins = langTwins();
const he2en = hebrewToEnglish();
const CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const abroad = { twins: he2en, languages: ["en-GB", "en"], timeZone: "Europe/London", userAgent: CHROME, webdriver: false, pref: null };

describe("twin map from the page inventory", () => {
  it("pairs the site pages and the December retreats both ways", () => {
    expect(twins["/"]).toBe("/en");
    expect(twins["/en"]).toBe("/");
    expect(twins["/events"]).toBe("/en/events");
    expect(twins["/about"]).toBe("/en/about");
    expect(twins["/events/six-yogas-niguma-retreat"]).toBe("/events/en/six-yogas-niguma-retreat");
    expect(twins["/events/en/healing-kundalini-retreat"]).toBe("/events/healing-kundalini-retreat");
    expect(twins["/support-visit-dec-2026"]).toBe("/en/support-visit-dec-2026");
  });
  it("leaves Hebrew-only pages out", () => {
    for (const p of ["/weekly-practice", "/gallery", "/events/heart-sutra", "/practices", "/events/death-dying-enlightenment"]) {
      expect(twins[p], p).toBeUndefined();
    }
  });
});

describe("who is sent to English", () => {
  it("a visitor abroad with an English browser -> the matching English page", () => {
    expect(englishTarget({ ...abroad, path: "/" })).toBe("/en");
    expect(englishTarget({ ...abroad, path: "/events/six-yogas-niguma-retreat" })).toBe("/events/en/six-yogas-niguma-retreat");
    expect(englishTarget({ ...abroad, path: "/about/" })).toBe("/en/about");
  });
  it("keeps ad and newsletter tracking parameters and the #anchor", () => {
    expect(englishTarget({ ...abroad, path: "/events", search: "?utm_source=fb&fbclid=x1", hash: "#dec" })).toBe(
      "/en/events?utm_source=fb&fbclid=x1#dec",
    );
  });
  it("any other time zone counts as abroad", () => {
    expect(englishTarget({ ...abroad, path: "/", timeZone: "America/New_York", languages: ["es-AR"] })).toBe("/en");
  });
});

describe("who stays on Hebrew", () => {
  it("anyone on Israel time", () => {
    expect(englishTarget({ ...abroad, path: "/", timeZone: "Asia/Jerusalem" })).toBeNull();
    expect(englishTarget({ ...abroad, path: "/", timeZone: "Asia/Tel_Aviv" })).toBeNull();
  });
  it("an Israeli abroad with a Hebrew phone", () => {
    expect(englishTarget({ ...abroad, path: "/", timeZone: "Europe/Prague", languages: ["he-IL", "en"] })).toBeNull();
    expect(englishTarget({ ...abroad, path: "/", languages: ["en-US", "he"] })).toBeNull();
    expect(englishTarget({ ...abroad, path: "/", languages: ["iw"] })).toBeNull();
  });
  it("a visitor who picked Hebrew with the switch", () => {
    expect(englishTarget({ ...abroad, path: "/", pref: "he" })).toBeNull();
    expect(englishTarget({ ...abroad, path: "/", pref: "en" })).toBe("/en");
  });
  it("search engines, link previews and the pre-render browser", () => {
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0)",
      "facebookexternalhit/1.1",
      "WhatsApp/2.23.20.0",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0 Safari/537.36",
    ]) {
      expect(englishTarget({ ...abroad, path: "/", userAgent: ua }), ua).toBeNull();
    }
    expect(englishTarget({ ...abroad, path: "/", webdriver: true })).toBeNull();
  });
  it("pages with no English twin", () => {
    expect(englishTarget({ ...abroad, path: "/weekly-practice" })).toBeNull();
    expect(englishTarget({ ...abroad, path: "/events/heart-sutra" })).toBeNull();
    expect(englishTarget({ ...abroad, path: "/courses/abc" })).toBeNull();
  });
  it("English pages (already there - never sent back to Hebrew)", () => {
    expect(englishTarget({ ...abroad, path: "/en/about" })).toBeNull();
    expect(englishTarget({ ...abroad, path: "/events/en/six-yogas-niguma-retreat" })).toBeNull();
    expect(he2en["/en"]).toBeUndefined();
  });
  it("links with a payment return or test parameter", () => {
    expect(englishTarget({ ...abroad, path: "/events/six-yogas-niguma-retreat", search: "?test=h7s2qv" })).toBeNull();
    expect(englishTarget({ ...abroad, path: "/events/six-yogas-niguma-retreat", search: "?payment=success&utm_source=x" })).toBeNull();
  });
  it("an unknown time zone", () => {
    expect(englishTarget({ ...abroad, path: "/", timeZone: "" })).toBeNull();
  });
});
