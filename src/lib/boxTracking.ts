/**
 * "Which box sent this reader?" - for the promotion boxes inside articles
 * (RetreatPromo, RetreatReminder, VisitPromo).
 *
 * Each box link gets a `from=<page>-<box>` marker, e.g.
 * /events/six-yogas-niguma-retreat?from=bodhisattva-ideal-today-lama-glenn-top,
 * and a click sends the GA4 event `retreat_box_click` (box, article, link_url).
 *
 * Deliberately NOT a utm_* tag: a utm on an internal link starts a new GA
 * session and overwrites the email or ad the reader really came from, and
 * attribution.ts would store it as the registrant's source. `from` leaves both
 * alone; GA keeps it in page_location, so the event page's views, form opens
 * and payments can be filtered by it (Shahaf, 26.10.2026).
 *
 * The marker is added after mount (useBoxFrom), so the prerendered HTML keeps
 * the plain link and only real browsers carry it.
 */
import { useEffect, useState } from "react";

export type Box = "top" | "end" | "visit";

/** The page the reader is on, as its last path segment ("" on the home page). */
const pageSlug = (path: string) => decodeURIComponent(path.replace(/\/+$/, "").split("/").pop() || "home");

/** `href` with `from=<value>` added; external links, anchors and empty values stay as they are. */
export function withFrom(href: string, from: string): string {
  if (!from || !href.startsWith("/")) return href;
  const [base, hash = ""] = href.split("#");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}from=${encodeURIComponent(from)}${hash ? `#${hash}` : ""}`;
}

/** `<page>-<box>` once mounted in a browser, "" before (prerender, first paint). */
export function useBoxFrom(box: Box): string {
  const [from, setFrom] = useState("");
  useEffect(() => {
    setFrom(`${pageSlug(window.location.pathname)}-${box}`);
  }, [box]);
  return from;
}

/** GA4 event for a click on a box link. Safe where gtag is missing. */
export function trackBoxClick(box: Box, href: string): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", "retreat_box_click", {
    box,
    article: pageSlug(window.location.pathname),
    link_url: href,
  });
}
