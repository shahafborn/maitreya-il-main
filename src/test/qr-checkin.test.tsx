/**
 * QR check-in page at the December retreats (src/pages/QrCheckin.tsx).
 * What must hold: the retreat code, the four fields and the ticked terms reach
 * n8n `Visit_Checkin`; the thank-you shows only when the flow says ok.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import QrCheckin from "@/pages/QrCheckin";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({ insert: async () => ({ error: null }) }),
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

const page = (slug: string) =>
  render(
    <MemoryRouter initialEntries={[`/qr/${slug}`]}>
      <QrCheckin slug={slug} />
    </MemoryRouter>,
  );

const fillAndSend = () => {
  const by = (n: string) => document.querySelector(`input[name="${n}"]`) as HTMLInputElement;
  fireEvent.change(by("full_name"), { target: { value: "ישראל ישראלי" } });
  fireEvent.change(by("phone"), { target: { value: "050-1234567" } });
  fireEvent.change(by("email"), { target: { value: "a@b.co" } });
  fireEvent.click(by("terms"));
  fireEvent.submit(document.querySelector("form") as HTMLFormElement);
};

afterEach(() => vi.restoreAllMocks());

describe("QrCheckin", () => {
  it("posts the retreat code, the fields and the terms, then thanks", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    page("checkin-ein-gedi");
    expect(screen.getByText("רישום הגעה")).toBeTruthy();
    expect(screen.getByText("שש היוגות של ניגומה")).toBeTruthy();
    fillAndSend();
    await waitFor(() => expect(screen.getByTestId("checkin-done")).toBeTruthy());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/webhook/Visit_Checkin");
    expect(JSON.parse(init.body as string)).toEqual({
      retreat: "EGN", full_name: "ישראל ישראלי", phone: "050-1234567", email: "a@b.co", terms: true, lang: "he",
    });
  });

  it("shows an error, not the thank-you, when the flow refuses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "Invalid phone" }), { status: 200 }));
    page("checkin-antakarana");
    fillAndSend();
    await waitFor(() => expect(screen.getByText(/משהו השתבש/)).toBeTruthy());
    expect(screen.queryByTestId("checkin-done")).toBeNull();
  });
});
