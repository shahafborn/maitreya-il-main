import { describe, it, expect } from "vitest";
import { getArticles } from "@/site/content";
import { getRelated, pictureOf, shortTitle } from "@/site/RelatedArticles";

describe("related articles", () => {
  const all = getArticles("he");

  it("suggests three other articles for every article, never itself, a canonical duplicate or one without a picture", () => {
    for (const a of all) {
      const rel = getRelated("he", a.slug);
      expect(rel.map((r) => r.slug)).not.toContain(a.slug);
      for (const r of rel) {
        expect(r.canonical).toBe("");
        expect(pictureOf(r)).toMatch(/^\/media\//);
      }
      expect(rel.length).toBe(3);
    }
  });

  it("keeps the yoga interviews together", () => {
    const rel = getRelated("he", "illusory-body-yoga-lama-glenn").map((r) => r.slug);
    expect(rel).toContain("dream-yoga-solo-retreat-lama-glenn");
  });

  it("returns nothing for an unknown slug", () => {
    expect(getRelated("he", "no-such-article")).toEqual([]);
  });

  it("shortens titles at the dash or at a question mark", () => {
    expect(shortTitle("שש היוגות של נארופה - לאמה גלן מולין")).toBe("שש היוגות של נארופה");
    expect(shortTitle("איך מחליטים על תרגול? לאמה גלן על תרגול")).toBe("איך מחליטים על תרגול?");
  });
});
