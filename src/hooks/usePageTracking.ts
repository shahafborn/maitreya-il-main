import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** The app's BrowserRouter basename — must match the value in App.tsx. */
const BASE_PATH = "/p";

/** Strip trailing slash to avoid split metrics (e.g. /register vs /register/). */
function normalizePath(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * Send a page_view event to Google Analytics on every route change.
 * - Prepends the /p basename (useLocation strips it)
 * - Normalizes trailing slashes
 * - Defers the call so useDocumentTitle has time to update document.title
 * - Skips admin routes
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;

    const path = normalizePath(BASE_PATH + location.pathname) + location.search;

    // Defer one frame so useDocumentTitle's effect updates document.title first
    const id = requestAnimationFrame(() => {
      window.gtag?.("event", "page_view", {
        page_path: path,
        page_title: document.title,
      });
    });

    return () => cancelAnimationFrame(id);
  }, [location]);
}
