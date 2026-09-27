/**
 * The early-bird badge on the Six Yogas hero switches itself by the early-bird end date
 * (4.10.2026, the offer's validThrough): the last seven days "week", the day itself "day",
 * otherwise nothing.
 */
import { describe, it, expect } from "vitest";
import { earlyBirdPhase } from "@/pages/SixYogasNigumaRetreat";

describe("earlyBirdPhase", () => {
  it("is off more than a week before the end", () => {
    expect(earlyBirdPhase("2026-09-20")).toBeNull();
    expect(earlyBirdPhase("2026-09-26")).toBeNull();
  });
  it("says 'last week' for the seven days before the end", () => {
    expect(earlyBirdPhase("2026-09-27")).toBe("week");
    expect(earlyBirdPhase("2026-10-03")).toBe("week");
  });
  it("says 'last day' on the end date itself", () => {
    expect(earlyBirdPhase("2026-10-04")).toBe("day");
  });
  it("is gone from the day after", () => {
    expect(earlyBirdPhase("2026-10-05")).toBeNull();
    expect(earlyBirdPhase("2026-12-01")).toBeNull();
  });
  it("an unreadable end date shows nothing", () => {
    expect(earlyBirdPhase("2026-09-30", "")).toBeNull();
  });
});
