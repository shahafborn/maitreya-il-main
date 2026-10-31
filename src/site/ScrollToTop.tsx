/**
 * Every in-app move to a new page starts at the top. Without it a client-side
 * route change keeps the old scroll position, so a reader who taps one of the
 * "מאמרים נוספים" articles at the bottom of a page lands at the bottom of the
 * next one (Shahaf, 31.10.2026, on his phone).
 *
 * Left alone: links with a #fragment (useScrollToHash scrolls to the anchor),
 * and back/forward (POP), where the browser puts the reader back where they were.
 */
import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (hash || navType === "POP") return;
    window.scrollTo(0, 0);
  }, [pathname, hash, navType]);
  return null;
}
