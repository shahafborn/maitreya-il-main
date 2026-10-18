/**
 * Registration source capture (src/lib/attribution.ts): first touch sticks,
 * last touch moves, both expire, and the click id itself is never stored.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { attributionPayload, captureAttribution, touchFromSearch } from "@/lib/attribution";

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse("2026-10-18T20:00:00Z");

describe("attribution", () => {
  beforeEach(() => localStorage.clear());

  it("ignores a landing without tags", () => {
    expect(touchFromSearch("?ticket=abc")).toBeNull();
    captureAttribution("", T0);
    expect(attributionPayload(T0).utm_source).toBe("");
    expect(attributionPayload(T0).fbclid).toBe("");
  });

  it("keeps fbclid as yes/no only", () => {
    captureAttribution("?fbclid=SECRETCLICKID", T0);
    expect(attributionPayload(T0).fbclid).toBe("yes");
    expect(JSON.stringify(localStorage)).not.toContain("SECRETCLICKID");
  });

  it("keeps the first touch and moves the last touch", () => {
    captureAttribution("?utm_source=facebook&utm_medium=paid&utm_campaign=A&utm_content=ad1&fbclid=x", T0);
    captureAttribution("?utm_source=newsletter&utm_medium=email&utm_campaign=B", T0 + DAY);
    const p = attributionPayload(T0 + DAY);
    expect(p.first_utm_source).toBe("facebook");
    expect(p.first_utm_content).toBe("ad1");
    expect(p.first_fbclid).toBe("yes");
    expect(p.first_touch_at).toBe(new Date(T0).toISOString());
    expect(p.utm_source).toBe("newsletter");
    expect(p.utm_campaign).toBe("B");
    expect(p.utm_content).toBe("");
    expect(p.fbclid).toBe("no");
  });

  it("expires the last touch after 30 days and the first after 90", () => {
    captureAttribution("?utm_source=facebook", T0);
    expect(attributionPayload(T0 + 31 * DAY).utm_source).toBe("");
    expect(attributionPayload(T0 + 31 * DAY).first_utm_source).toBe("facebook");
    expect(attributionPayload(T0 + 91 * DAY).first_utm_source).toBe("");
    // An expired first touch is replaced by the next one
    captureAttribution("?utm_source=google", T0 + 92 * DAY);
    expect(attributionPayload(T0 + 92 * DAY).first_utm_source).toBe("google");
  });
});
