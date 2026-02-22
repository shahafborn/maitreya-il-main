import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Send a page_view event to Google Analytics on every route change.
 * Skips admin routes.
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    window.gtag?.("event", "page_view", {
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
  }, [location]);
}
