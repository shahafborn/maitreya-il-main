/**
 * Events close their own registration when their end date passes.
 *
 * Two things are being protected here, and they fail in opposite directions:
 *
 *  1. A finished event must not take registrations. The May and June retreat
 *     pages sat open all summer with live forms behind them, which is what
 *     started this work.
 *  2. A retreat that has NOT finished must keep every way in. This is the
 *     expensive direction: the December pages are selling, and a date bug that
 *     closed them early would cost real registrations.
 *
 * The pages read their own end dates, so the clock is what is varied here.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { hasEnded } from "@/site/today";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({ insert: async () => ({ error: null }) }),
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

const at = (iso: string) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
};

afterEach(() => {
  vi.useRealTimers();
});

describe("hasEnded", () => {
  it("counts the last day itself as still running", () => {
    expect(hasEnded("2026-06-06", "2026-06-06")).toBe(false);
    expect(hasEnded("2026-06-06", "2026-06-07")).toBe(true);
    expect(hasEnded("2026-06-06", "2026-06-05")).toBe(false);
  });

  it("reads a full timestamp, which is how the pages declare it to Google", () => {
    expect(hasEnded("2026-05-30T16:00:00+03:00", "2026-05-31")).toBe(true);
    expect(hasEnded("2026-05-30T16:00:00+03:00", "2026-05-30")).toBe(false);
  });

  it("treats an unreadable date as NOT ended, so a typo cannot close a live retreat", () => {
    expect(hasEnded("", "2026-09-22")).toBe(false);
    expect(hasEnded("soon", "2026-09-22")).toBe(false);
    expect(hasEnded(undefined as unknown as string, "2026-09-22")).toBe(false);
  });
});

const renderPage = async (path: string) => {
  const mod = await import(/* @vite-ignore */ path);
  const Page = mod.default;
  render(
    <MemoryRouter>
      <Page />
    </MemoryRouter>,
  );
};

describe("a finished retreat page", () => {
  it("Heart of Wisdom (HE) offers no way to register, and says it is over", async () => {
    at("2026-09-22T09:00:00+03:00");
    await renderPage("@/pages/HeartOfWisdomRetreat");

    expect(screen.queryByText("להרשמה")).toBeNull();
    expect(screen.queryByText("להרשמה לריטריט")).toBeNull();
    expect(screen.getByText("הריטריט הסתיים")).toBeTruthy();
    expect(screen.getAllByText("לאירועים").length).toBeGreaterThan(0);
  });

  it("Heart of Wisdom (HE) keeps the dana teaching, without the amount", async () => {
    at("2026-09-22T09:00:00+03:00");
    await renderPage("@/pages/HeartOfWisdomRetreat");

    expect(screen.getByText("השתתפות בדאנא")).toBeTruthy();
    expect(screen.queryByText(/תרומה מומלצת/)).toBeNull();
    expect(screen.queryByText(/מומלץ להירשם בהקדם/)).toBeNull();
  });

  it("Ein Gedi (EN) offers no way to register, and says it is over", async () => {
    at("2026-09-22T09:00:00+03:00");
    await renderPage("@/pages/EinGediHealingRetreatEN");

    expect(screen.queryByText("Register")).toBeNull();
    expect(screen.queryByText("Register Now")).toBeNull();
    expect(screen.getByText("This retreat has ended")).toBeTruthy();
  });

  it("promotes what is still coming, from the event files", async () => {
    at("2026-09-22T09:00:00+03:00");
    await renderPage("@/pages/HeartOfWisdomRetreat");

    expect(screen.getByText("שש היוגות של ניגומה - ריטריט בעין גדי")).toBeTruthy();
    expect(screen.getByText("תרגולי מדיטציה וקונדליני לריפוי")).toBeTruthy();
  });
});

describe("a retreat that has not happened yet", () => {
  it("Six Yogas (HE) still sells on the day the retreat starts", async () => {
    at("2026-12-06T09:00:00+02:00");
    await renderPage("@/pages/SixYogasNigumaRetreat");

    expect(screen.getAllByText("להרשמה").length).toBeGreaterThan(0);
    expect(screen.queryByText("הריטריט הסתיים")).toBeNull();
  });

  it("Six Yogas (HE) still sells on its very last day", async () => {
    at("2026-12-12T09:00:00+02:00");
    await renderPage("@/pages/SixYogasNigumaRetreat");

    expect(screen.getAllByText("להרשמה").length).toBeGreaterThan(0);
    expect(screen.queryByText("הריטריט הסתיים")).toBeNull();
  });

  it("Six Yogas (HE) closes the morning after", async () => {
    at("2026-12-13T09:00:00+02:00");
    await renderPage("@/pages/SixYogasNigumaRetreat");

    expect(screen.queryByText("להרשמה")).toBeNull();
    expect(screen.getByText("הריטריט הסתיים")).toBeTruthy();
  });

  it("Kundalini (EN) still sells before December", async () => {
    at("2026-11-30T09:00:00+02:00");
    await renderPage("@/pages/HealingKundaliniRetreatEN");

    expect(screen.getAllByText("Register").length).toBeGreaterThan(0);
    expect(screen.queryByText("This retreat has ended")).toBeNull();
  });
});
