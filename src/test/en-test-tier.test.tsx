/**
 * The hidden test ticket on the English retreat pages.
 *
 * Testers abroad prove the real card path on their own cards, so the test tier
 * takes any amount and pre-fills one cent. Two things must hold, and neither is
 * obvious from reading the config: the field has to accept DECIMALS (the modal
 * derives that from openAmountMin >= 1, not from a flag), and the typed sum has
 * to reach the webhook as `amount`. The live n8n flow clamps it again server-side
 * - these tests cover the browser half only.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import { registrationConfig as sixYogasConfig } from "@/pages/SixYogasNigumaRetreatEN";

// Importing the page module pulls in MailingListSignup -> lib/supabase, which
// throws at import time when the Supabase env vars are absent. They are absent
// in CI, so stub the module rather than requiring secrets to run a UI test.
vi.mock("@/lib/supabase", () => ({
  supabase: { from: () => ({ insert: async () => ({ error: null }) }) },
}));

const TEST_TIER_ID = "EGN_EN_2026_Test";

const copy = {
  title: "Registration", subtitle: "", submitLabel: "Register",
  submittingLabel: "...", submitFootnote: "",
  tierLabel: "How will you join?", fnameLabel: "First name", lnameLabel: "Last name",
  emailLabel: "Email", phoneLabel: "Phone", phonePlaceholder: "15551234567",
  genderLabel: "Gender", foodPrefLabel: "Food", prevExpLabel: "Experience",
  messageLabel: "Message", amountLabel: "Amount", amountNote: "",
  errTier: "Choose an option", errFname: "First name is required",
  errLname: "Last name is required", errEmail: "Email is required",
  errEmailInvalid: "Please enter a valid email address",
  errPhone: "Phone is required", errPhoneInvalid: "Please enter a valid phone number",
  errGender: "Required", errFoodPref: "Required", errPrevExp: "Required",
  errAmount: "Enter an amount", errAmountRange: "Out of range",
} as any;

const renderModal = () =>
  render(
    <RegistrationModal
      open
      onOpenChange={() => {}}
      preselectedTierId={TEST_TIER_ID}
      config={sixYogasConfig}
      copy={copy}
    />,
  );

/** The amount box is the only one the test tier adds; find it by its typed value. */
const amountInput = () =>
  screen.getAllByRole("textbox").concat(screen.queryAllByRole("spinbutton") as any[])
    .find((el: any) => el.value === "0.01" || el.getAttribute("inputmode") === "decimal");

describe("English hidden test tier", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true, json: async () => ({ cardcom_url: "https://example.test/pay" }),
    })) as any);
    vi.stubGlobal("crypto", { ...globalThis.crypto, randomUUID: () => "tok-1" } as any);
    // jsdom has no scrollTo; the modal scrolls to the first invalid field.
    (Element.prototype as any).scrollTo = vi.fn();
  });

  it("is configured as an open amount that allows decimals", () => {
    const tier = sixYogasConfig.tiers.find((t: any) => t.id === TEST_TIER_ID) as any;
    expect(tier).toBeTruthy();
    expect(tier.hidden).toBe(true);
    expect(tier.openAmount).toBe(true);
    expect(tier.openAmountDefault).toBe(0.01);
    // The modal computes wholeAmounts as (min >= 1). A min of 1 would silently
    // reject 0.01 as "not an integer", which is exactly the bug this guards.
    expect(tier.openAmountMin).toBeLessThan(1);
    expect(tier.openAmountMin).toBe(0.01);
    expect(tier.openAmountMax).toBe(100);
  });

  it("pre-fills the amount field with one cent", () => {
    renderModal();
    const el = amountInput();
    expect(el).toBeTruthy();
    expect((el as HTMLInputElement).value).toBe("0.01");
  });

  it("sends the typed amount to the webhook", async () => {
    renderModal();
    // The modal's <label>s are not tied to their inputs with htmlFor/id, so
    // getByLabelText cannot reach them. The data-field wrappers are stable.
    // It renders through a portal, so query the document, not the container.
    const field = (name: string) =>
      document.body.querySelector(`[data-field="${name}"] input`) as HTMLInputElement | null;

    fireEvent.change(field("fname")!, { target: { value: "Test" } });
    fireEvent.change(field("lname")!, { target: { value: "Abroad" } });
    fireEvent.change(field("email")!, { target: { value: "t@example.com" } });
    const phone = field("phone");
    if (phone) fireEvent.change(phone, { target: { value: "14155551234" } });
    // country is a required free-text input on the English pages, not a select.
    const country = field("country");
    if (country) fireEvent.change(country, { target: { value: "United States" } });

    // prevExp and country are <select>s, so they need their own pass - and they
    // are required, which is what silently failed validation the first time.
    document.body.querySelectorAll("[data-field] select").forEach((sel) => {
      const s = sel as HTMLSelectElement;
      const opt = Array.from(s.options).find((o) => o.value);
      if (opt) fireEvent.change(s, { target: { value: opt.value } });
    });

    // The terms checkbox gates submission.
    const confirmed = document.body.querySelector(
      '[data-field="confirmed"] input',
    ) as HTMLInputElement | null;
    if (confirmed) fireEvent.click(confirmed);

    fireEvent.click(document.body.querySelector('button[type="submit"]')!);

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
    expect(body.field_event).toBe(TEST_TIER_ID);
    expect(body.amount).toBe(0.01);
  });
});
