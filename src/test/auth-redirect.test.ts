/** Unit tests for the destination helpers used by the sign-in flow. */
import { describe, it, expect, vi } from "vitest";
import { isSafeInternalPath, buildCallbackUrl } from "@/lib/authRedirect";

vi.mock("@/lib/supabase", () => ({ supabase: { from: () => ({}) } }));

describe("isSafeInternalPath", () => {
  it("accepts paths inside the site", () => {
    expect(isSafeInternalPath("/")).toBe(true);
    expect(isSafeInternalPath("/courses/uma-zub-tri")).toBe(true);
    expect(isSafeInternalPath("/discover/healing-retreat")).toBe(true);
  });

  it("rejects anything that could lead off the site", () => {
    expect(isSafeInternalPath("https://evil.example.com")).toBe(false);
    expect(isSafeInternalPath("//evil.example.com")).toBe(false);
    expect(isSafeInternalPath("javascript:alert(1)")).toBe(false);
    expect(isSafeInternalPath("/\\evil.example.com")).toBe(false);
    expect(isSafeInternalPath("courses/uma-zub-tri")).toBe(false);
  });

  it("rejects nothing at all", () => {
    expect(isSafeInternalPath(null)).toBe(false);
    expect(isSafeInternalPath(undefined)).toBe(false);
    expect(isSafeInternalPath("")).toBe(false);
  });
});

describe("buildCallbackUrl", () => {
  it("carries a safe destination in the address", () => {
    expect(buildCallbackUrl("/courses/death-dying-enlightenment")).toContain(
      "auth/callback?next=%2Fcourses%2Fdeath-dying-enlightenment",
    );
  });

  it("omits an unsafe or missing destination", () => {
    expect(buildCallbackUrl("https://evil.example.com")).not.toContain("next=");
    expect(buildCallbackUrl()).not.toContain("next=");
  });
});
