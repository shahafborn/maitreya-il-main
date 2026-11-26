/**
 * QR payment pages at the December retreats (src/pages/TablePay.tsx).
 * The page only asks; n8n `Table_Pay` decides the charge. What must hold here:
 * the right item code, copies or amount, and language reach the flow.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TablePay from "@/pages/TablePay";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({ insert: async () => ({ error: null }) }),
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

const page = (slug: string, lang: "he" | "en", url?: string) =>
  render(
    <MemoryRouter initialEntries={[url ?? `${lang === "en" ? "/en" : ""}/qr/${slug}`]}>
      <TablePay slug={slug} lang={lang} />
    </MemoryRouter>,
  );

const fill = (name: string, email: string) => {
  const inputs = document.querySelectorAll("input");
  const by = (n: string) => Array.from(inputs).find((i) => i.name === n) as HTMLInputElement;
  fireEvent.change(by("full_name"), { target: { value: name } });
  fireEvent.change(by("email"), { target: { value: email } });
  fireEvent.change(by("phone"), { target: { value: "0501234567" } });
};

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("TablePay", () => {
  it("book page: copies change the total and are posted with the book's code", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ cardcom_url: "https://secure.cardcom.solutions/x" }), { status: 200 }),
    );
    page("book-tantra-he", "he");
    expect(screen.getByText("מבוא לטנטרה")).toBeTruthy();
    expect(screen.getByTestId("total").textContent).toBe("65 ₪");
    fireEvent.click(screen.getByLabelText("+"));
    fireEvent.click(screen.getByLabelText("+"));
    expect(screen.getByTestId("copies").textContent).toBe("3");
    expect(screen.getByTestId("total").textContent).toBe("195 ₪");
    fill("Test Person", "t@example.com");
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toMatchObject({ field_event: "TABLE_BOOK_TANTRA_HE", quantity: 3, lang: "he", page_path: "/qr/book-tantra-he" });
    expect(body.amount).toBeUndefined();
    await waitFor(() => expect(document.querySelector("iframe")?.getAttribute("src")).toBe("https://secure.cardcom.solutions/x"));
  });

  it("donation page: posts the typed amount for its own retreat, in English", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ cardcom_url: "https://secure.cardcom.solutions/y" }), { status: 200 }),
    );
    page("dana-ein-gedi", "en");
    expect(screen.getByText("The Six Yogas of Niguma")).toBeTruthy();
    fireEvent.change(document.querySelector('input[name="amount"]')!, { target: { value: "180" } });
    fill("Test Person", "t@example.com");
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toMatchObject({ field_event: "TABLE_DANA_EGN", amount: 180, lang: "en" });
    expect(body.quantity).toBeUndefined();
  });

  it("donation page: refuses an empty amount without calling the flow", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    page("dana-antakarana", "he");
    fill("Test Person", "t@example.com");
    fireEvent.submit(document.querySelector("form")!);
    expect(await screen.findByText(/יש למלא סכום/)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("return from Cardcom: book page shows what was paid for the table team", () => {
    sessionStorage.setItem("tablepay-last-order", JSON.stringify({ slug: "book-buddhism", copies: 2, amount: 90, at: "6.12, 10:00" }));
    page("book-buddhism", "en", "/en/qr/book-buddhism?payment=success");
    expect(screen.getByText("Thank you! Payment received")).toBeTruthy();
    expect(screen.getByText("2 × How to Find the Buddha within You")).toBeTruthy();
  });
});
