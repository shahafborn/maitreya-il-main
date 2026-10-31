/**
 * The countdown badge on the December 2026 retreat heroes counts whole days in
 * Israel dates to the first day, and is gone from the first day on.
 */
import { describe, it, expect } from "vitest";
import { retreatDaysLeft } from "@/components/retreat/CountdownBadge";

const SIX_YOGAS = "2026-12-06T12:00:00+02:00";

describe("retreatDaysLeft", () => {
  it("counts whole days to the first day", () => {
    expect(retreatDaysLeft(SIX_YOGAS, "2026-10-31")).toBe(36);
    expect(retreatDaysLeft("2026-12-02T09:30:00+02:00", "2026-11-30")).toBe(2);
  });
  it("says 1 on the day before", () => {
    expect(retreatDaysLeft(SIX_YOGAS, "2026-12-05")).toBe(1);
  });
  it("is gone on the first day and after", () => {
    expect(retreatDaysLeft(SIX_YOGAS, "2026-12-06")).toBeNull();
    expect(retreatDaysLeft(SIX_YOGAS, "2026-12-10")).toBeNull();
  });
  it("crosses the month and the clock change without drifting", () => {
    expect(retreatDaysLeft("2026-11-01", "2026-10-24")).toBe(8);
  });
  it("an unreadable date shows nothing", () => {
    expect(retreatDaysLeft("", "2026-10-31")).toBeNull();
    expect(retreatDaysLeft("soon", "2026-10-31")).toBeNull();
  });
});
