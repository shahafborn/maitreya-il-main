/**
 * Scrolls to the element named by the URL's #fragment once the page component
 * has mounted. Needed because the app boots over pre-rendered HTML: the
 * browser's own anchor scroll happens on the static markup, and the React
 * mount that follows can move things. Also serves in-app navigation to
 * anchors (e.g. the old mailing-list URLs redirect to /#newsletter).
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useScrollToHash() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ block: "start" });
  }, [hash]);
}
