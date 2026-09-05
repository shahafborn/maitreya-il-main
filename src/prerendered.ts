/**
 * Keeps the pre-rendered page on screen while the app boots.
 *
 * Every public page ships as real HTML (scripts/prerender.mjs). When the
 * JavaScript bundle then mounts React, the page component for the current
 * route may still be loading (routes are code-split with React.lazy), and
 * the Suspense fallback would replace the pre-rendered markup with
 * "Loading..." for a moment. To avoid that flash, main.tsx captures the
 * markup before mounting and the first Suspense fallback shows it verbatim
 * until the real component takes over - visually identical, no blink.
 *
 * The two DOM swaps (markup -> fallback, fallback -> real page) each empty the
 * root for an instant, which would collapse the document height and reset
 * the scroll position (and lose a #anchor the browser had scrolled to). The
 * body therefore keeps its pre-rendered height until the real page is up.
 */
let markup: string | null = null;
let released = false;

/** Called once by main.tsx before React mounts. */
export function capturePrerendered(root: HTMLElement) {
  if (root.childElementCount === 0) return;
  markup = root.innerHTML;
  document.body.style.minHeight = `${document.documentElement.scrollHeight}px`;
  // Safety valve: never pin the height for long if no fallback ever released it
  window.setTimeout(releasePrerendered, 8000);
}

/** Hands the captured markup to the FIRST caller only, then forgets it. */
export function takePrerendered(): string | null {
  const m = markup;
  markup = null;
  return m;
}

/** Called when the real page component has replaced the fallback. */
export function releasePrerendered() {
  if (released) return;
  released = true;
  document.body.style.minHeight = "";
}
