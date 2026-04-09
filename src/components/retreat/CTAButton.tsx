import type { ReactNode } from "react";
import { RETREAT_THEME } from "./theme";

interface CTAButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Primary gold call-to-action button used across retreat pages.
 *
 * @example
 * <CTAButton onClick={openRegistration}>להרשמה</CTAButton>
 */
export const CTAButton = ({ children, className = "", onClick }: CTAButtonProps) => (
  <button
    onClick={onClick}
    className={`px-10 py-4 text-lg font-semibold text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.03] cursor-pointer ${className}`}
    style={{ backgroundColor: RETREAT_THEME.GOLD }}
  >
    {children}
  </button>
);
