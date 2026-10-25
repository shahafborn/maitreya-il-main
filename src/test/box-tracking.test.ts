import { describe, expect, it } from "vitest";
import { withFrom } from "@/lib/boxTracking";

describe("withFrom (article box marker)", () => {
  it("adds the marker to an internal link", () => {
    expect(withFrom("/events/six-yogas-niguma-retreat", "post-top")).toBe("/events/six-yogas-niguma-retreat?from=post-top");
  });
  it("keeps an existing query and a hash", () => {
    expect(withFrom("/events?x=1#december", "post-visit")).toBe("/events?x=1&from=post-visit#december");
  });
  it("leaves the link alone before mount and for external links", () => {
    expect(withFrom("/events", "")).toBe("/events");
    expect(withFrom("https://example.com/a", "post-top")).toBe("https://example.com/a");
  });
  it("encodes a Hebrew page name", () => {
    expect(withFrom("/events", "מאמר-top")).toBe(`/events?from=${encodeURIComponent("מאמר-top")}`);
  });
});
