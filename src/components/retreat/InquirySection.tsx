/**
 * "Want to know more?" section for retreat landing pages: the questions people
 * ask most (open/close list) beside a short call-back form in a photo card.
 *
 * For the visitor who is interested but not ready to register - an easy way
 * to ask before deciding (Shahaf, 19.10.2026, Ein Gedi Hebrew page first).
 *
 * Submission: POST JSON to an n8n webhook (Ein Gedi: `EGN_Inquiry`), which
 * appends a row to the inquiries sheet and emails the sangha inbox with a
 * copy to the person who calls back. Name + phone or email are required; a
 * hidden `website` field catches bots (the flow drops those rows).
 * On success: Meta `Lead` + GA4 `generate_lead`.
 *
 * Hebrew-only copy for now; pass `copy` when an English page needs it.
 */
import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Plus } from "lucide-react";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { trackMeta, generateEventId } from "@/lib/metaPixel";
import { attributionPayload } from "@/lib/attribution";

export interface InquiryQuestion {
  q: string;
  a: string;
}

interface InquirySectionProps {
  webhookUrl: string;
  /** Page id sent with the request and used as the pixel content_name. */
  pageId: string;
  questions: InquiryQuestion[];
  photo: string;
  photoAlt: string;
  /** WhatsApp number in international form, digits only (9725...). */
  whatsapp: string;
  /** The same number as people read it (054-...). */
  whatsappDisplay: string;
  /** Text that opens in the visitor's WhatsApp. */
  whatsappText: string;
}

type Status = "idle" | "loading" | "success" | "error";

const { GOLD, WARM_GRAY, BODY, CREAM } = RETREAT_THEME;

const field =
  "w-full rounded-xl border border-[#E2DACB] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#9A9083] focus:outline-none focus:border-[#C9A961] focus:ring-[3px] focus:ring-[#C9A961]/20";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="#25D366" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.2 1.4z" />
  </svg>
);

export const InquirySection = ({
  webhookUrl,
  pageId,
  questions,
  photo,
  photoAlt,
  whatsapp,
  whatsappDisplay,
  whatsappText,
}: InquirySectionProps) => {
  const [status, setStatus] = useState<Status>("idle");
  const [problem, setProblem] = useState("");
  const waHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappText)}`;

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
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name,
          phone,
          email,
          question: get("question"),
          website: get("website"),
          page: window.location.pathname,
          ...attributionPayload(),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
      trackMeta("Lead", { content_name: pageId, content_category: "inquiry" }, `lead-${generateEventId()}`);
      window.gtag?.("event", "generate_lead", { form: "inquiry", page: pageId });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="py-16 md:py-24 px-4" style={{ background: `linear-gradient(180deg, #FFFFFF 0%, ${CREAM} 100%)` }}>
      <div className="max-w-5xl mx-auto grid gap-10 md:gap-14 md:grid-cols-[1.05fr_1fr] items-start">
        {/* Questions */}
        <div>
          <p className="text-sm font-bold" style={{ color: "#A88A45" }}>שאלות לפני שנרשמים</p>
          <h2 className="text-2xl md:text-3xl font-bold mt-2 mb-3" style={{ fontFamily: RETREAT_FONTS.serif }}>
            מה כדאי לדעת
          </h2>
          <p className="text-base md:text-lg leading-[1.7] mb-5" style={{ color: WARM_GRAY }}>
            אלה השאלות שאנשים שואלים אותנו הכי הרבה. לא מצאתם תשובה? אנחנו כאן.
          </p>
          <div>
            {questions.map((item, i) => (
              <details key={item.q} open={i === 0} className="group border-b border-[#ECE4D5] py-4">
                <summary className="flex cursor-pointer list-none items-center gap-3.5 text-lg font-medium [&::-webkit-details-marker]:hidden">
                  <span
                    className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full text-sm font-bold"
                    style={{ border: `1.5px solid ${GOLD}`, color: "#A88A45" }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1">{item.q}</span>
                  <Plus className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-45" style={{ color: GOLD }} />
                </summary>
                <p className="mt-2.5 md:mr-11 text-base leading-[1.7]" style={{ color: WARM_GRAY }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Call-back card */}
        <div
          className="md:sticky md:top-24 overflow-hidden rounded-[22px] bg-white"
          style={{ boxShadow: `0 0 0 2px ${GOLD}, 0 24px 60px rgba(60,45,20,.16)` }}
        >
          <div className="relative h-[200px] md:h-[210px]">
            <img src={photo} alt={photoAlt} loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: "center 45%" }} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-black/55" />
            <span className="absolute bottom-3 right-4 text-[13px] text-white/90">{photoAlt}</span>
          </div>

          <div className="px-5 py-6 md:px-7 md:py-7">
            {status === "success" ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-14 w-14" style={{ color: GOLD }} />
                <h3 className="text-2xl font-bold" style={{ fontFamily: RETREAT_FONTS.serif }}>תודה, קיבלנו!</h3>
                <p className="mt-2 text-base" style={{ color: WARM_GRAY }}>נחזור אליכם בהקדם האפשרי.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <p className="text-sm font-bold" style={{ color: "#A88A45" }}>נשמח לדבר איתכם</p>
                <h3 className="mt-1 text-2xl md:text-[28px] font-bold" style={{ fontFamily: RETREAT_FONTS.serif }}>
                  רוצים לשמוע עוד?
                </h3>
                <p className="mt-1.5 text-base leading-relaxed" style={{ color: WARM_GRAY }}>
                  השאירו פרטים ונחזור אליכם לשיחה קצרה ואישית.
                </p>

                <div className="mt-5 grid gap-2.5">
                  <input name="full_name" className={field} placeholder="שם" autoComplete="name" aria-label="שם" />
                  <p className="mt-1.5 text-sm font-medium" style={{ color: BODY }}>טלפון או אימייל - מה שנוח לכם</p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <input name="phone" type="tel" dir="rtl" className={field} placeholder="טלפון" autoComplete="tel" aria-label="טלפון" />
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
                    משהו השתבש בשליחה. אפשר לנסות שוב, או לכתוב לנו בוואטסאפ: {whatsappDisplay}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-lg font-bold text-white transition-transform duration-200 hover:scale-[1.01] disabled:opacity-70"
                  style={{ background: "linear-gradient(135deg, #D4B76E, #B8964F)", boxShadow: "0 8px 22px rgba(184,150,79,.4)" }}
                >
                  {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
                  חזרו אליי
                </button>

                <a href={waHref} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 font-medium hover:underline underline-offset-4">
                  <WhatsAppIcon />
                  <span>או ישר בוואטסאפ: <span dir="ltr">{whatsappDisplay}</span></span>
                </a>
                <p className="mt-2.5 text-center text-[13px]" style={{ color: WARM_GRAY }}>הפרטים משמשים רק כדי לחזור אליכם.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
