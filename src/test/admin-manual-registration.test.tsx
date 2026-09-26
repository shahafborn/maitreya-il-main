/**
 * Manual registration page (/admin/registrations): the event list, past events, and payment
 * methods by the event's language (Shahaf, 26.9: Hebrew = credit card first, also Bit, Paybox,
 * bank transfer, cash; English = PayPal first, also credit card, bank transfer, cash).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminManualRegistration from "@/pages/admin/AdminManualRegistration";

vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "tok" } } }) } },
}));

const he = [
  { code: "card", label: "כרטיס אשראי" },
  { code: "bit", label: "Bit" },
  { code: "paybox", label: "Paybox" },
  { code: "transfer", label: "העברה בנקאית" },
  { code: "cash", label: "מזומן" },
];
const en = [
  { code: "paypal", label: "PayPal" },
  { code: "card", label: "כרטיס אשראי" },
  { code: "transfer", label: "העברה בנקאית" },
  { code: "cash", label: "מזומן" },
];
const option = { code: "X", ticket_type: "4 בחדר", price: 3700, open: false };
const EVENTS = [
  { key: "EN", label: "Six Yogas English", dates: "6-12.12.2026", ends: "2026-12-12", ended: false, lang: "en", currency: "USD", methods: en, options: [option] },
  { key: "HE", label: "Six Yogas Hebrew", dates: "6-12.12.2026", ends: "2026-12-12", ended: false, lang: "he", currency: "ILS", methods: he, options: [option] },
  { key: "OLD", label: "Healing retreat (past)", dates: "1-3.6.2026", ends: "2026-06-03", ended: true, lang: "he", currency: "ILS", methods: he, options: [option] },
];

beforeEach(() => {
  global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, events: EVENTS }) })) as never;
});

const pressed = (name: string) => screen.getByRole("button", { name }).className.includes("bg-primary");

describe("AdminManualRegistration", () => {
  it("lists current events as a visible list and hides past ones until asked", async () => {
    render(<AdminManualRegistration />);
    expect(await screen.findByText("Six Yogas Hebrew")).toBeTruthy();
    expect(screen.getByText("Six Yogas English")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.queryByText("Healing retreat (past)")).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: /להציג גם אירועים שהסתיימו/ }));
    expect(await screen.findByText("Healing retreat (past)")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("Hebrew event: credit card is the default, Bit and Paybox are offered, no PayPal", async () => {
    render(<AdminManualRegistration />);
    fireEvent.click(await screen.findByText("Six Yogas Hebrew"));
    await waitFor(() => expect(pressed("כרטיס אשראי")).toBe(true));
    expect(screen.getByRole("button", { name: "Bit" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Paybox" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "PayPal" })).toBeNull();
  });

  it("English event: PayPal is the default; the reference field hides for cash", async () => {
    render(<AdminManualRegistration />);
    fireEvent.click(await screen.findByText("Six Yogas English"));
    await waitFor(() => expect(pressed("PayPal")).toBe(true));
    expect(screen.getByLabelText(/מספר אסמכתא/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "מזומן" }));
    await waitFor(() => expect(screen.queryByLabelText(/מספר אסמכתא/)).toBeNull());
  });
});
