/**
 * The private operations-team ticket on the Hebrew Six Yogas page.
 *
 * It is handed out by link to the visit's operations team only, so two things
 * must hold: the tier is hidden (never on the pricing cards or in the modal's
 * select), and it is a fixed 3,000 NIS - not an open amount like the test ticket.
 */
import { describe, it, expect, vi } from "vitest";
import { registrationConfig } from "@/pages/SixYogasNigumaRetreat";

// The page module pulls in lib/supabase, which throws at import time when the
// Supabase env vars are absent (they are absent in CI), so stub it.
vi.mock("@/lib/supabase", () => ({
  supabase: { from: () => ({ insert: async () => ({ error: null }) }) },
}));

const TEAM_TIER_ID = "EGN_2026_Team";

describe("Hebrew hidden operations-team tier", () => {
  const tier = registrationConfig.tiers.find((t) => t.id === TEAM_TIER_ID);

  it("exists, is hidden, and is a fixed 3,000 NIS", () => {
    expect(tier).toBeTruthy();
    expect(tier!.hidden).toBe(true);
    expect(tier!.priceValue).toBe(3000);
    expect(tier!.priceDisplay).toBe("3,000");
    expect(tier!.currencySymbol).toBe("₪");
    expect(tier!.openAmount).toBeFalsy();
  });

  it("is not one of the tiers the public page offers", () => {
    const publicIds = registrationConfig.tiers.filter((t) => !t.hidden).map((t) => t.id);
    expect(publicIds).toEqual(["EGN_2026_Quad", "EGN_2026_NoLodging"]);
  });
});
