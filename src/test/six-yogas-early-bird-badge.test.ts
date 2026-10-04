/**
 * The early-bird badge on the Six Yogas hero switches itself by the early-bird end date
 * (the offer's validThrough): the last seven days "week", the day itself "day",
 * otherwise nothing. The 2026 early bird ended 4.10, so the page has no validThrough now
 * and shows no badge; the rule is tested against that date passed in.
 */
import { describe, it, expect, vi } from "vitest";
import { earlyBirdPhase } from "@/pages/SixYogasNigumaRetreat";

// The page module pulls in lib/supabase, which throws at import time when the
// Supabase env vars are absent (they are absent in CI), so stub it.
vi.mock("@/lib/supabase", () => ({
  supabase: { from: () => ({ insert: async () => ({ error: null }) }) },
}));

const END = "2026-10-04";

describe("earlyBirdPhase", () => {
  it("is off on the page now that the early bird has ended (no end date)", () => {
    expect(earlyBirdPhase("2026-10-04")).toBeNull();
  });
  it("is off more than a week before the end", () => {
    expect(earlyBirdPhase("2026-09-20", END)).toBeNull();
    expect(earlyBirdPhase("2026-09-26", END)).toBeNull();
  });
  it("says 'last week' for the seven days before the end", () => {
    expect(earlyBirdPhase("2026-09-27", END)).toBe("week");
    expect(earlyBirdPhase("2026-10-03", END)).toBe("week");
  });
  it("says 'last day' on the end date itself", () => {
    expect(earlyBirdPhase("2026-10-04", END)).toBe("day");
  });
  it("is gone from the day after", () => {
    expect(earlyBirdPhase("2026-10-05", END)).toBeNull();
    expect(earlyBirdPhase("2026-12-01", END)).toBeNull();
  });
  it("an unreadable end date shows nothing", () => {
    expect(earlyBirdPhase("2026-09-30", "")).toBeNull();
  });
});
