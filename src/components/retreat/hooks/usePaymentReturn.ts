import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

export type PaymentStatus = "success" | "failed" | null;

/** How long after the page has fully loaded the `?payment=` marker stays in the address. */
const STRIP_DELAY_MS = 3000;

function parse(value: string | null): PaymentStatus {
  return value === "success" || value === "failed" ? value : null;
}

function inIframe(): boolean {
  return typeof window !== "undefined" && window.top !== null && window.top !== window.self;
}

/**
 * The page's side of the Cardcom return (`?payment=success|failed`).
 *
 * - Inside the payment iframe: climbs out to the whole page and reports nothing,
 *   so the return is counted once (on the full page), not twice.
 * - On the full page: reads the marker once into state (the popup and the
 *   tracking hooks run off that), then removes `payment` from the address a few
 *   seconds after the page has loaded. GTM / the Meta pixel load late and may
 *   read the URL, so they get to see it first; a later reload, a phone
 *   restoring the tab, or a shared link no longer replays a "payment success".
 */
export function usePaymentReturn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = parse(searchParams.get("payment"));
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(() => (inIframe() ? null : urlStatus));
  const paramsRef = useRef(searchParams);
  paramsRef.current = searchParams;

  useEffect(() => {
    if (!urlStatus) return;
    if (inIframe()) {
      window.top!.location.href = window.location.href;
      return;
    }
    setPaymentStatus(urlStatus);

    let timer: number | undefined;
    const strip = () => {
      // Closing the popup may already have cleared the address.
      if (!paramsRef.current.has("payment")) return;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("payment");
          return next;
        },
        { replace: true },
      );
    };
    const schedule = () => {
      timer = window.setTimeout(strip, STRIP_DELAY_MS);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (timer) window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlStatus]);

  const closePaymentStatus = useCallback(() => {
    setPaymentStatus(null);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { paymentStatus, closePaymentStatus };
}
