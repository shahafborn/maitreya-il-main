/**
 * Corner card shown when someone opens the registration form and closes it
 * without sending anything: "a question before you go?" with a button to the
 * call-back form and a WhatsApp link (Shahaf, 19.10.2026).
 *
 * Not a pop-up: it sits in the bottom corner, blocks nothing, and shows at
 * most once per visit (sessionStorage) - the page decides when via `show`.
 */
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { WhatsAppIcon, whatsappHref, trackWhatsAppClick, type InquiryConfig } from "./InquiryForm";

const SEEN_KEY = "inquiry-nudge-seen";

/** True when the card was already shown in this visit. Storage can throw (private mode). */
export const nudgeAlreadySeen = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

interface InquiryNudgeProps {
  show: boolean;
  config: InquiryConfig;
  onAsk: () => void;
  onClose: () => void;
}

export const InquiryNudge = ({ show, config, onAsk, onClose }: InquiryNudgeProps) => {
  // Mounted hidden first, then slid in, so the entrance animates.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!show) return setVisible(false);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode - the card may show again next time, that is fine */
    }
    window.gtag?.("event", "inquiry_nudge_shown", { page: config.pageId });
    const t = window.setTimeout(() => setVisible(true), 700);
    return () => window.clearTimeout(t);
  }, [show, config.pageId]);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="שאלה לפני שנרשמים"
      dir="rtl"
      className={`fixed z-40 bottom-3 left-3 right-3 sm:right-auto sm:bottom-5 sm:left-5 sm:w-[340px] rounded-2xl bg-white px-5 pt-4 pb-4 transition-transform duration-500 ${visible ? "translate-y-0" : "translate-y-[140%]"}`}
      style={{ boxShadow: `0 0 0 1.5px ${RETREAT_THEME.GOLD}, 0 18px 50px rgba(0,0,0,.25)`, transitionTimingFunction: "cubic-bezier(.2,.9,.3,1.2)" }}
    >
      <button type="button" onClick={onClose} aria-label="סגירה" className="absolute top-2.5 left-3 p-1 text-stone-500 hover:text-stone-800">
        <X className="h-4 w-4" />
      </button>
      <p className="text-[13px] font-bold" style={{ color: "#A88A45" }}>רגע לפני שהולכים</p>
      <h4 className="mt-1 text-xl font-bold" style={{ fontFamily: RETREAT_FONTS.serif }}>יש לכם שאלה על הריטריט?</h4>
      <p className="mt-1.5 mb-3.5 text-[15px] leading-relaxed" style={{ color: RETREAT_THEME.WARM_GRAY }}>
        נשמח לחזור אליכם לשיחה קצרה ולענות על הכל.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            window.gtag?.("event", "inquiry_open", { from: "corner-card" });
            onAsk();
          }}
          className="flex-1 rounded-full py-2.5 text-[15px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, #C9A24A, #A8781E)" }}
        >
          השאירו פרטים
        </button>
        <a
          href={whatsappHref(config)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsAppClick(config, "corner-card")}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border-[1.5px] bg-white px-4 text-[15px]"
          style={{ borderColor: RETREAT_THEME.GOLD, color: RETREAT_THEME.DARK }}
        >
          <WhatsAppIcon className="h-[18px] w-[18px]" />
          וואטסאפ
        </a>
      </div>
    </div>
  );
};
