/**
 * Every URL the old site ever published must land on a live page after the
 * cutover, and the app's own URL scheme must be internally consistent.
 * These tests run the redirect map the way the server will (scripts/redirects.mjs).
 */
import { describe, it, expect } from "vitest";
import { resolve, step } from "../../scripts/redirects.mjs";
import { getRoutes, SPA_PREFIXES } from "../../scripts/site-routes.mjs";
import { LEGACY_PATHS, GONE_PATHS } from "../../scripts/legacy-urls.mjs";
import { sitePath, twinPath, BILINGUAL_PAGES } from "../site/content";

const routes = getRoutes();
const pages = new Set(routes.map((r) => r.path));
const ctx = {
  isPage: (p: string) => pages.has(p),
  isFile: (p: string) => /\.(png|jpg|xml|txt|js|css)$/.test(p),
};

describe("legacy WordPress and /p/ URLs", () => {
  for (const legacy of LEGACY_PATHS) {
    it(`${legacy} ends on a live page`, () => {
      const { final, hops } = resolve(legacy, ctx);
      expect(final.status, hops.map((h) => `${h.path} -> ${h.status}`).join(", ")).toBe(200);
      expect(hops.length, "at most one redirect hop").toBeLessThanOrEqual(2);
    });
  }

  for (const gone of GONE_PATHS) {
    it(`${gone} is gone (410)`, () => {
      expect(step(gone, ctx).status).toBe(410);
    });
  }

  it("keeps the query string when dropping the /p/ prefix", () => {
    const r = step("/p/events/ein-gedi-healing-retreat/?payment=success", ctx);
    expect(r).toEqual({ status: 301, location: "/events/ein-gedi-healing-retreat?payment=success" });
  });

  it("sends the old mailing-list pages to the newsletter block", () => {
    expect(step("/he/join-mailing-list-heb/", ctx).location).toBe("/#newsletter");
    expect(step("/mailing-list-eng/", ctx).location).toBe("/en#newsletter");
  });

  it("keeps Hebrew article slugs", () => {
    expect(step("/he/articles/the-subtle-art-of-mindful-death/", ctx).location).toBe("/articles/the-subtle-art-of-mindful-death");
  });

  it("points a legacy event page at its archive anchor", () => {
    expect(step("/he/our_events/lg-tummo-retreat-2025/", ctx).location).toBe("/events#lg-tummo-retreat-2025");
  });

  it("strips trailing slashes from pages", () => {
    expect(step("/about/", ctx)).toEqual({ status: 301, location: "/about" });
  });

  it("serves the app shell for sign-in and course areas, 404 elsewhere", () => {
    expect(step("/courses/2026-intro-to-tantra", ctx).kind).toBe("spa");
    expect(step("/admin/courses", ctx).kind).toBe("spa");
    expect(step("/no-such-page", ctx).status).toBe(404);
  });
});

describe("public routes", () => {
  it("every route is served directly (no redirect)", () => {
    for (const r of routes) expect(step(r.path, ctx), r.path).toEqual({ status: 200, kind: "page" });
  });

  it("no route collides with a client-rendered prefix", () => {
    for (const r of routes) {
      const first = r.path.split("/")[1];
      expect(SPA_PREFIXES.includes(first), r.path).toBe(false);
    }
  });

  it("bilingual pages declare their twin in both directions", () => {
    for (const r of routes) {
      const alt = r.alternates ?? {};
      if (alt.he && alt.en) {
        expect(pages.has(alt.he)).toBe(true);
        expect(pages.has(alt.en)).toBe(true);
      }
    }
  });
});

describe("sitePath / twinPath", () => {
  it("puts Hebrew at the root and English under /en", () => {
    expect(sitePath("he")).toBe("/");
    expect(sitePath("he", "/about")).toBe("/about");
    expect(sitePath("en")).toBe("/en");
    expect(sitePath("en", "/articles/x")).toBe("/en/articles/x");
  });

  it("finds twins only for pages that exist in both languages", () => {
    expect(twinPath("he", "")).toBe("/en");
    expect(twinPath("en", "/about")).toBe("/about");
    expect(twinPath("he", "/gallery")).toBeNull();
    expect(twinPath("he", "/articles/x")).toBeNull();
    for (const sub of BILINGUAL_PAGES) {
      expect(pages.has(sitePath("he", sub))).toBe(true);
      expect(pages.has(sitePath("en", sub))).toBe(true);
    }
  });
});
