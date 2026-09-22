/**
 * The private scholarship link on the English December pages (Shahaf, 2026-09-22).
 *
 * The link offers three Zoom options by dana - $108, $54, any amount - as a
 * choice among themselves. What must hold: none of them ever reaches the public
 * pricing grid or the public select; with the group on offer the select holds
 * exactly those three (and nothing public); and the open one sends the typed
 * amount, in whole dollars from $1. n8n charges and routes by the tier id.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import { registrationConfig as sixYogasConfig } from "@/pages/SixYogasNigumaRetreatEN";
import { registrationConfig as kundaliniConfig } from "@/pages/HealingKundaliniRetreatEN";

// Importing the page modules pulls in lib/supabase, which throws at import time
// without the Supabase env vars (absent in CI).
vi.mock("@/lib/supabase", () => ({
  supabase: { from: () => ({ insert: async () => ({ error: null }) }) },
}));

const copy = {
  tierSelectPlaceholder: "Choose", firstNameLabel: "First name", lastNameLabel: "Last name",
  emailLabel: "Email", phoneLabel: "Phone", phonePlaceholder: "15551234567",
  genderLabel: "Gender", foodLabel: "Food", prevExpLabel: "Experience",
  messageLabel: "Message", amountLabel: "Amount", amountNote: "",
  submitLabel: "Register", submittingLabel: "...", submitFootnote: "",
  errTier: "Choose an option", errFname: "First name is required",
  errLname: "Last name is required", errEmail: "Email is required",
  errEmailInvalid: "Please enter a valid email address",
  errPhone: "Phone is required", errPhoneInvalid: "Please enter a valid phone number",
  errGender: "Required", errFood: "Required", errPrevExp: "Required",
  errCountry: "Required", errConfirmed: "Required",
  errAmount: "Enter an amount", errAmountRange: "Out of range",
} as any;

const pages = [
  { name: "Six Yogas (Ein Gedi)", config: sixYogasConfig, prefix: "EGN_EN_2026" },
  { name: "Healing Kundalini (Tel Aviv)", config: kundaliniConfig, prefix: "HKR_EN_2026" },
];

const tierSelect = () =>
  document.body.querySelector('[data-field="tierId"] select') as HTMLSelectElement;

describe.each(pages)("English scholarship link - $name", ({ config, prefix }) => {
  const ids = [`${prefix}_Dana108`, `${prefix}_Dana54`, `${prefix}_DanaOpen`];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true, json: async () => ({ cardcom_url: "https://example.test/pay" }),
    })) as any);
    vi.stubGlobal("crypto", { ...globalThis.crypto, randomUUID: () => "tok-1" } as any);
    (Element.prototype as any).scrollTo = vi.fn();
  });

  it("has the three options, hidden, in the scholarship group, at $108 / $54 / open", () => {
    const tiers = ids.map((id) => config.tiers.find((t) => t.id === id)!);
    tiers.forEach((t) => {
      expect(t).toBeTruthy();
      expect(t.hidden).toBe(true);
      expect(t.group).toBe("scholarship");
      expect(t.currencySymbol).toBe("$");
    });
    expect(tiers[0].priceValue).toBe(108);
    expect(tiers[1].priceValue).toBe(54);
    expect(tiers[2].openAmount).toBe(true);
    expect(tiers[2].openAmountMin).toBe(1); // whole dollars
    expect(config.tierGroups?.scholarship?.heading).toMatch(/Scholarship/);
  });

  it("never shows them in the public select", () => {
    render(<RegistrationModal open onOpenChange={() => {}} config={config} copy={copy} />);
    const values = Array.from(tierSelect().options).map((o) => o.value).filter(Boolean);
    ids.forEach((id) => expect(values).not.toContain(id));
    expect(values.length).toBeGreaterThan(0);
  });

  it("offers exactly the three when the link opens the group", () => {
    render(
      <RegistrationModal open onOpenChange={() => {}} tierGroup="scholarship" config={config} copy={copy} />,
    );
    const values = Array.from(tierSelect().options).map((o) => o.value).filter(Boolean);
    expect(values).toEqual(ids);
    expect(document.body.textContent).toContain("Scholarship place - live on Zoom");
  });

  it("sends the typed amount for the open option", async () => {
    render(
      <RegistrationModal open onOpenChange={() => {}} tierGroup="scholarship" config={config} copy={copy} />,
    );
    fireEvent.change(tierSelect(), { target: { value: ids[2] } });

    const field = (name: string) =>
      document.body.querySelector(`[data-field="${name}"] input`) as HTMLInputElement | null;
    fireEvent.change(field("amount")!, { target: { value: "20" } });
    fireEvent.change(field("fname")!, { target: { value: "Test" } });
    fireEvent.change(field("lname")!, { target: { value: "Scholar" } });
    fireEvent.change(field("email")!, { target: { value: "t@example.com" } });
    const phone = field("phone");
    if (phone) fireEvent.change(phone, { target: { value: "14155551234" } });
    const country = field("country");
    if (country) fireEvent.change(country, { target: { value: "Brazil" } });
    document.body.querySelectorAll("[data-field] select").forEach((sel) => {
      const s = sel as HTMLSelectElement;
      if (s === tierSelect()) return;
      const opt = Array.from(s.options).find((o) => o.value);
      if (opt) fireEvent.change(s, { target: { value: opt.value } });
    });
    const confirmed = document.body.querySelector('[data-field="confirmed"] input') as HTMLInputElement | null;
    if (confirmed) fireEvent.click(confirmed);

    fireEvent.click(document.body.querySelector('button[type="submit"]')!);

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
    expect(body.field_event).toBe(ids[2]);
    expect(body.amount).toBe(20);
    // A Zoom place: no room or meal questions.
    expect(body.gender).toBeUndefined();
    expect(body.food_pref).toBeUndefined();
  });
});
