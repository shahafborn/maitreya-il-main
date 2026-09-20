/**
 * The private no-lodging offer on the English Six Yogas page.
 *
 * It is sold one-to-one by link, so two things must hold: the tier is hidden
 * (never on the pricing grid or in the modal's first select), and it is priced
 * as a fixed $750 - not an open amount like the test tickets it sits next to.
 */
import { describe, it, expect, vi } from "vitest";
import { registrationConfig } from "@/pages/SixYogasNigumaRetreatEN";

// Importing the page module pulls in MailingListSignup -> lib/supabase, which
// throws at import time when the Supabase env vars are absent. They are absent
// in CI (this suite failed the 2026-09-20 deploy for exactly that), so stub it.
vi.mock("@/lib/supabase", () => ({
  supabase: { from: () => ({ insert: async () => ({ error: null }) }) },
}));

const NO_LODGING_TIER_ID = "EGN_EN_2026_NoLodging";

describe("English hidden no-lodging tier", () => {
  const tier = registrationConfig.tiers.find((t) => t.id === NO_LODGING_TIER_ID);

  it("exists, is hidden, and is a fixed $750", () => {
    expect(tier).toBeTruthy();
    expect(tier!.hidden).toBe(true);
    expect(tier!.priceValue).toBe(750);
    expect(tier!.priceDisplay).toBe("750");
    expect(tier!.currencySymbol).toBe("$");
    expect(tier!.openAmount).toBeFalsy();
  });

  it("asks the meal question (lunch is included) via residentialTierIds", () => {
    expect(registrationConfig.residentialTierIds).toContain(NO_LODGING_TIER_ID);
  });

  it("is not one of the tiers the public pricing grid shows", () => {
    const publicIds = registrationConfig.tiers.filter((t) => !t.hidden).map((t) => t.id);
    expect(publicIds).toEqual(["EGN_EN_2026_Zoom", "EGN_EN_2026_Room"]);
  });
});
