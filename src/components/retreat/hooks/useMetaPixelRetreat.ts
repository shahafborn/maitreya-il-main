import { useEffect, useRef } from "react";
import { trackMeta } from "@/lib/metaPixel";

/**
 * Centralizes Meta pixel events for retreat landing pages:
 *
 * - `InitiateCheckout` is fired by the registration modal right before it
 *   posts to n8n, with a deterministic `ic-<regToken>` event id.
 * - `Purchase` is fired on return from Cardcom (when `?payment=success`)
 *   with event id `purchase-<regToken>` matched from sessionStorage. This
 *   shared event id lets n8n fire a server-side CAPI event with the same id
 *   and the two are deduped by Meta.
 *
 * The hook handles the Purchase side. The registration modal handles the
 * InitiateCheckout side directly (see `fireInitiateCheckout` below).
 */

interface PendingPurchase {
  value: number;
  tierId: string;
  event_id: string;
  ts: number;
}

/**
 * The Meta pixel is installed by GTM, which loads after the app mounts, so a
 * Purchase fired straight away on the Cardcom return was silently dropped by
 * trackMeta. Wait (up to `timeoutMs`) until the pixel is there.
 */
export function whenMetaPixelReady(run: () => void, timeoutMs = 10000): () => void {
  const start = Date.now();
  let timer: number | undefined;
  const tick = () => {
    if (typeof window.fbq === "function") return run();
    if (Date.now() - start >= timeoutMs) return;
    timer = window.setTimeout(tick, 250);
  };
  tick();
  return () => {
    if (timer) window.clearTimeout(timer);
  };
}

/**
 * `paymentStatus` must come from usePaymentReturn (state read once per page
 * load), not straight from the URL - that is what keeps this to one
 * payment_success / Purchase per real return.
 */
export function useRetreatPurchaseTracking(params: {
  paymentStatus: "success" | "failed" | null;
  contentName: string;
  storagePrefix: string;
}) {
  const purchaseFiredRef = useRef(false);

  useEffect(() => {
    const { paymentStatus, contentName, storagePrefix } = params;
    if (paymentStatus === "success") {
      if (purchaseFiredRef.current) return;
      purchaseFiredRef.current = true;
      window.gtag?.("event", "payment_success");
      // Not cancelled on unmount/re-run on purpose: the ref above already
      // claimed this return, so a cancelled wait would lose the Purchase.
      whenMetaPixelReady(() => firePurchase(contentName, storagePrefix));
    } else if (paymentStatus === "failed") {
      window.gtag?.("event", "payment_failed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.paymentStatus]);
}

function firePurchase(contentName: string, storagePrefix: string) {
  try {
    const raw = sessionStorage.getItem(`${storagePrefix}_pending_purchase`);
    if (raw) {
      const pending = JSON.parse(raw) as PendingPurchase;
      const firedKey = `${storagePrefix}_purchase_fired:${pending.event_id}`;
      if (sessionStorage.getItem(firedKey) === "1") return;
      trackMeta(
        "Purchase",
        {
          value: pending.value,
          currency: "ILS",
          content_name: contentName,
          content_ids: pending.tierId ? [pending.tierId] : [],
          num_items: 1,
        },
        pending.event_id,
      );
      sessionStorage.setItem(firedKey, "1");
      sessionStorage.removeItem(`${storagePrefix}_pending_purchase`);
    } else {
      trackMeta("Purchase", { currency: "ILS", content_name: contentName });
    }
  } catch {
    /* sessionStorage unavailable */
  }
}

/**
 * Fired from the registration modal on submit. Writes a pending-purchase
 * record to sessionStorage keyed under `storagePrefix` and fires the
 * InitiateCheckout pixel event with a deterministic id.
 */
export function fireInitiateCheckout(opts: {
  regToken: string;
  value: number;
  tierId: string;
  contentName: string;
  storagePrefix: string;
}): { icEventId: string; purchaseEventId: string } {
  const icEventId = `ic-${opts.regToken}`;
  const purchaseEventId = `purchase-${opts.regToken}`;
  trackMeta(
    "InitiateCheckout",
    {
      value: opts.value,
      currency: "ILS",
      content_name: opts.contentName,
      content_ids: opts.tierId ? [opts.tierId] : [],
      num_items: 1,
    },
    icEventId,
  );
  try {
    sessionStorage.setItem(
      `${opts.storagePrefix}_pending_purchase`,
      JSON.stringify({
        value: opts.value,
        tierId: opts.tierId,
        event_id: purchaseEventId,
        ts: Date.now(),
      }),
    );
  } catch {
    /* sessionStorage may be unavailable */
  }
  return { icEventId, purchaseEventId };
}
