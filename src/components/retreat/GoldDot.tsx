import { RETREAT_THEME } from "./theme";

/**
 * Gold bullet dot used throughout retreat pages.
 *
 * @example
 * <li className="flex items-start gap-3"><GoldDot /><span>…</span></li>
 */
export const GoldDot = () => (
  <span
    className="inline-block w-2 h-2 rounded-full shrink-0 mt-2"
    style={{ backgroundColor: RETREAT_THEME.GOLD }}
  />
);
