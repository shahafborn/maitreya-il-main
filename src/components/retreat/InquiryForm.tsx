/**
 * The short "call me back" form: name, phone or email, an optional question.
 * One form, three doors on the Ein Gedi Hebrew page (Shahaf, 19.10.2026):
 * the questions section under the price, the box at the top of the
 * registration form, and the corner card shown after the registration form
 * is closed without sending.
 *
 * Submission: POST JSON to an n8n webhook (Ein Gedi: `EGN_Inquiry`) - a row
 * in the inquiries sheet and an email to the sangha inbox, cc the person who
 * calls back. `source` rides along in `page` so the sheet shows which door
 * the request came through. A hidden `website` field catches bots (the flow
 * drops those). On success: Meta `Contact` + GA4 `generate_lead`. Not Meta
 * `Lead`: the retreat pages already fire Lead when the registration form opens,
 * so a sent question gets its own event to keep the two apart in the ads.
 *
 * Hebrew-only copy for now.
 */
import { useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { trackMeta, trackMetaCustom, generateEventId } from "@/lib/metaPixel";
import { attributionPayload } from "@/lib/attribution";

export interface InquiryConfig {
  webhookUrl: string;
  /** Page id sent with the request and used as the pixel content_name. */
  pageId: string;
  /** WhatsApp number in international form, digits only (9725...). */
  whatsapp: string;
  /** The same number as people read it (054-...). */
  whatsappDisplay: string;
  /** Text that opens in the visitor's WhatsApp. */
  whatsappText: string;
}

/** Which door the request came through - shown in the sheet. */
export type InquirySource = "section" | "registration-form" | "corner-card";

type Status = "idle" | "loading" | "success" | "error";

const { WARM_GRAY, BODY, GOLD } = RETREAT_THEME;

const field =
  "w-full rounded-xl border border-[#E2DACB] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#9A9083] focus:outline-none focus:border-[#C9A961] focus:ring-[3px] focus:ring-[#C9A961]/20";

export const whatsappHref = (cfg: InquiryConfig) =>
  `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(cfg.whatsappText)}`;

/** A WhatsApp tap is a lead the form never sees - count it (GA4 + a Meta custom event). */
export const trackWhatsAppClick = (cfg: InquiryConfig, from: InquirySource) => {
  window.gtag?.("event", "whatsapp_click", { from, page: cfg.pageId });
  trackMetaCustom("WhatsAppClick", { content_name: cfg.pageId, content_category: from });
};

export const WhatsAppIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="#25D366" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.2 1.4z" />
  </svg>
);

interface InquiryFormProps {
  config: InquiryConfig;
  source: InquirySource;
  /** Heading above the fields; the success message replaces it. */
  intro?: ReactNode;
  /** Called once the request went through (the success message is already showing). */
  onSent?: () => void;
}

export const InquiryForm = ({ config, source, intro, onSent }: InquiryFormProps) => {
  const [status, setStatus] = useState<Status>("idle");
  const [problem, setProblem] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const full_name = get("full_name");
    const phone = get("phone");
    const email = get("email");
    if (!full_name) return setProblem("נא למלא שם");
    if (!phone && !email) return setProblem("נא להשאיר טלפון או אימייל, כדי שנוכל לחזור אליכם");
    setProblem("");
    setStatus("loading");
    try {
      const res = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name,
          phone,
          email,
          question: get("question"),
          website: get("website"),
          page: `${window.location.pathname} (${source})`,
          ...attributionPayload(),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
      trackMeta("Contact", { content_name: config.pageId, content_category: source }, `contact-${generateEventId()}`);
      window.gtag?.("event", "generate_lead", { form: source, page: config.pageId });
      onSent?.();
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="py-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-14 w-14" style={{ color: GOLD }} />
        <h3 className="text-2xl font-bold" style={{ fontFamily: RETREAT_FONTS.serif }}>תודה, קיבלנו!</h3>
        <p className="mt-2 text-base" style={{ color: WARM_GRAY }}>נחזור אליכם בהקדם האפשרי.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {intro}
      <div className="grid gap-2.5">
        <input name="full_name" className={field} placeholder="שם" autoComplete="name" aria-label="שם" />
        <p className="mt-1.5 text-sm font-medium" style={{ color: BODY }}>טלפון או אימייל - מה שנוח לכם</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input name="phone" type="tel" dir="rtl" className={`${field} text-right`} placeholder="טלפון" autoComplete="tel" aria-label="טלפון" />
          <input name="email" type="email" dir="ltr" className={`${field} text-right placeholder:text-right`} placeholder="אימייל" autoComplete="email" aria-label="אימייל" />
        </div>
        <textarea name="question" rows={3} className={field} placeholder="מה תרצו לדעת? (לא חובה)" aria-label="מה תרצו לדעת" />
        {/* Honeypot: hidden from people, bots fill it. */}
        <div className="h-0 overflow-hidden" aria-hidden="true">
          <input name="website" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      {problem && <p className="mt-3 text-sm text-red-700">{problem}</p>}
      {status === "error" && (
        <p className="mt-3 text-sm text-red-700">
          משהו השתבש בשליחה. אפשר לנסות שוב, או לכתוב לנו בוואטסאפ: <span dir="ltr">{config.whatsappDisplay}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-lg font-bold text-white transition-transform duration-200 hover:scale-[1.01] disabled:opacity-70"
        style={{ background: "linear-gradient(135deg, #C9A24A, #A8781E)", boxShadow: "0 10px 24px rgba(168,120,30,.45)" }}
      >
        {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
        חזרו אליי
      </button>

      <a
        href={whatsappHref(config)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick(config, source)}
        className="mt-3 flex items-center justify-center gap-1.5 py-1.5 text-[15px] hover:underline underline-offset-4"
        style={{ color: WARM_GRAY }}
      >
        <WhatsAppIcon className="h-[17px] w-[17px]" />
        או כתבו לנו בוואטסאפ
      </a>
      <p className="mt-1.5 text-center text-[13px]" style={{ color: WARM_GRAY }}>הפרטים משמשים רק כדי לחזור אליכם.</p>
    </form>
  );
};
