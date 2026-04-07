/**
 * Meta Pixel helper - typed wrapper around window.fbq
 * Pixel ID 775211235282836 is loaded via GTM (container GTM-W84DD38X),
 * so this file only fires events; it does NOT install the base pixel.
 */
type MetaEventName = "PageView" | "InitiateCheckout" | "Purchase" | "Lead" | "CompleteRegistration";

interface MetaEventParams {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  num_items?: number;
}

declare global {
  interface Window {
    fbq?: (action: string, name: string, params?: MetaEventParams, opts?: { eventID?: string }) => void;
  }
}

export function trackMeta(event: MetaEventName, params?: MetaEventParams, eventID?: string): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventID) window.fbq("track", event, params, { eventID });
  else window.fbq("track", event, params);
}

export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
