/**
 * The Cardcom return (`?payment=success`) must be recorded exactly once.
 *
 * Before 23.9.2026 the marker stayed in the address until the popup was
 * closed, so every reload - a phone restoring the tab hours later - logged
 * another payment_success in GA and another Purchase in Meta, and every real
 * payment logged twice (once inside the payment iframe, once on the page).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { usePaymentReturn } from "@/components/retreat/hooks/usePaymentReturn";
import { useRetreatPurchaseTracking } from "@/components/retreat/hooks/useMetaPixelRetreat";

const PREFIX = "test_retreat";

let seen: { status: string | null; search: string; close: () => void };

function Page() {
  const { paymentStatus, closePaymentStatus } = usePaymentReturn();
  useRetreatPurchaseTracking({ paymentStatus, contentName: "Test Retreat", storagePrefix: PREFIX });
  const location = useLocation();
  seen = { status: paymentStatus, search: location.search, close: closePaymentStatus };
  return null;
}

function open(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Page />
    </MemoryRouter>,
  );
}

const gtagCalls = () => (window.gtag as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[1]);

describe("payment return", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    window.gtag = vi.fn();
    window.fbq = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
    delete window.gtag;
    delete window.fbq;
  });

  it("records the success once, with the value, and keeps the popup open", () => {
    sessionStorage.setItem(
      `${PREFIX}_pending_purchase`,
      JSON.stringify({ value: 3700, tierId: "EGN_2026_Quad", event_id: "purchase-abc", ts: 1 }),
    );
    open("/events/x?payment=success");

    expect(seen.status).toBe("success");
    expect(gtagCalls()).toEqual(["payment_success"]);
    expect(window.fbq).toHaveBeenCalledTimes(1);
    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "Purchase",
      expect.objectContaining({ value: 3700, currency: "ILS" }),
      { eventID: "purchase-abc" },
    );
  });

  it("takes the marker out of the address a few seconds after load, popup still showing", () => {
    open("/events/x?payment=success&ticket=abc");
    expect(seen.search).toContain("payment=success");

    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(seen.search).toBe("?ticket=abc");
    expect(seen.status).toBe("success");
    expect(gtagCalls()).toEqual(["payment_success"]);
  });

  it("a reload after that records nothing", () => {
    open("/events/x");
    expect(seen.status).toBeNull();
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it("waits for the Meta pixel (installed late by GTM) instead of dropping the Purchase", () => {
    delete window.fbq;
    open("/events/x?payment=success");
    expect(gtagCalls()).toEqual(["payment_success"]);

    const fbq = vi.fn();
    window.fbq = fbq;
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq.mock.calls[0][1]).toBe("Purchase");
  });

  it("closing the popup clears the address and the popup", () => {
    open("/events/x?payment=success");
    act(() => seen.close());
    expect(seen.status).toBeNull();
    expect(seen.search).toBe("");
  });

  it("inside the payment iframe: records nothing and climbs out to the page", () => {
    const top = { location: { href: "" } };
    const spy = vi.spyOn(window, "top", "get").mockReturnValue(top as unknown as Window);
    try {
      open("/events/x?payment=success");
      expect(seen.status).toBeNull();
      expect(window.gtag).not.toHaveBeenCalled();
      expect(window.fbq).not.toHaveBeenCalled();
      expect(top.location.href).toBe(window.location.href);
    } finally {
      spy.mockRestore();
    }
  });
});
