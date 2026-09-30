import { useEffect, useState } from "react";

/**
 * The current time (epoch ms), refreshed every `intervalMs` while `enabled`.
 *
 * Also refreshes the moment the tab becomes visible again, because phones
 * pause timers in background tabs. When `enabled` is false no timer or
 * listener is set up at all, and the value is simply the time of first render.
 */
export function useNow(enabled: boolean, intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, intervalMs]);

  return now;
}
