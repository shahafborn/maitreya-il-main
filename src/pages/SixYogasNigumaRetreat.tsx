/**
 * Six Yogas of Niguma - Ein Gedi retreat (Hebrew)
 * ================================================
 * Residential 6-night retreat at Ein Gedi Field School, 6-12 Dec 2026 (Hanukkah).
 * Teachers: Lama Glenn Mullin, Drupon Chongwol-la. Vajrayogini empowerment.
 *
 * A content-swapped clone of EinGediRetreatV2 (the June 2026 healing retreat) -
 * same Esalen-style layout, same modal and gallery code. Content source (vault):
 * teachers-visit-nov-dec-2026/marketing/ein-gedi-landing-page-content.md
 *
 * Registration: the modal posts to n8n EGN_Register, which mints a Cardcom page
 * per person (DDE pattern) and returns cardcom_url; the browser is redirected
 * there. Tier ids are the codes n8n charges by - the page never sends an amount.
 * Hidden test tier (1 NIS) via ?test=<TEST_KEY>.
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

import { useRetreatSEO } from "@/components/retreat/hooks/useRetreatSEO";
import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { X, ChevronRight, ChevronLeft, ChevronDown, Mail, Loader2, CheckCircle2, XCircle, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { trackMeta, generateEventId } from "@/lib/metaPixel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OtherEvents } from "@/components/retreat/OtherEvents";
import maitreyaLogo from "@/assets/maitreya-logo.png";
import heroImage from "@/assets/retreat/hero-dead-sea-gen.jpeg";
import yogiMural from "@/assets/healing-kundalini-2026/hero-mural.jpg";
import vajrayoginiFigure from "@/assets/healing-kundalini-2026/vajrayogini-channel.jpg";
import lamaGlennPhoto from "@/assets/retreat/lama-glenn-big.jpg";
import druponPhoto from "@/assets/retreat/drupon-chongwol.png";
import venuePhoto1 from "@/assets/retreat/venue-eingedi-1.jpg";
import venuePhoto2 from "@/assets/retreat/venue-eingedi-2.jpg";
import venuePhoto3 from "@/assets/retreat/venue-eingedi-3.jpg";
import venuePhoto4 from "@/assets/retreat/venue-eingedi.jpg";
import gallery1 from "@/assets/retreat/gallery-1.jpg";
import gallery2 from "@/assets/retreat/gallery-2.jpg";
import gallery3 from "@/assets/retreat/gallery-3.jpg";
import gallery4 from "@/assets/retreat/gallery-4.jpg";
import gallery5 from "@/assets/retreat/gallery-5.jpg";
import gallery6 from "@/assets/retreat/gallery-6.jpg";
import gallery7 from "@/assets/retreat/gallery-7.jpg";
import gallery8 from "@/assets/retreat/gallery-8.jpg";
import gallery9 from "@/assets/retreat/gallery-9.jpg";
import gallery10 from "@/assets/retreat/gallery-10.jpg";
import gallery11 from "@/assets/retreat/gallery-11.jpg";
import gallery12 from "@/assets/retreat/gallery-12.jpg";
import gallery13 from "@/assets/retreat/gallery-13.jpg";
import gallery14 from "@/assets/retreat/gallery-14.jpg";
import gallery15 from "@/assets/retreat/gallery-15.jpg";

const N8N_WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/EGN_Register";
/** Test payments: `?test=q8w3zr` preselects a hidden 1 NIS option (refund from Cardcom). */
const TEST_KEY = "q8w3zr";
const TEST_TIER: RoomType = "EGN_2026_Test";

type RoomType = "EGN_2026_Quad" | "EGN_2026_NoLodging" | "EGN_2026_Test" | "";

const ROOM_OPTIONS: { value: RoomType; label: string; price: string }[] = [
  { value: "EGN_2026_Quad", label: "4 בחדר", price: "4,100₪ לאדם" },
  { value: "EGN_2026_NoLodging", label: "ללא לינה, כל הריטריט", price: "1,950₪" },
];
// Hidden: reached only through the ?test= link.
const TEST_OPTION = { value: "EGN_2026_Test" as RoomType, label: "בדיקת תשלום", price: "1₪" };

const ROOM_PRICES: Record<Exclude<RoomType, "">, number> = {
  EGN_2026_Quad: 4100,
  EGN_2026_NoLodging: 1950,
  EGN_2026_Test: 1,
};

const galleryImages = [gallery4, gallery1, gallery3, gallery8, gallery2, gallery9, gallery10, gallery7, gallery5, gallery6, gallery11, gallery12, gallery13, gallery14, gallery15];

/* ============================================================
   Esalen-inspired design:
   - Off-white/cream background
   - Gold accent color (#C9A961)
   - Single-column, generous whitespace
   - Full-width hero image (not background)
   - Circular teacher photos
   - Elegant serif-like headings
   - Gold lotus bullet points
   - Multiple CTA touchpoints
   - Calm, premium, unhurried feel
   ============================================================ */

const GOLD = "#C9A961";
const DARK = "#1A1A1A";
const CREAM = "#FAF8F5";
const WARM_GRAY = "#6B635A";

const GoldDot = () => (
  <span className="inline-block w-2 h-2 rounded-full shrink-0 mt-2" style={{ backgroundColor: GOLD }} />
);

const CTAButton = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`px-10 py-4 text-lg font-semibold text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.03] cursor-pointer ${className}`}
    style={{ backgroundColor: GOLD }}
  >
    {children}
  </button>
);

/* ── Registration Modal ── */
const RegistrationModal = ({ open, onOpenChange, preselectedRoom, testMode }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedRoom: RoomType;
  testMode: boolean;
}) => {
  const options = testMode ? [...ROOM_OPTIONS, TEST_OPTION] : ROOM_OPTIONS;
  const [roomType, setRoomType] = useState<RoomType>(preselectedRoom);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [foodPref, setFoodPref] = useState("");
  const [prevExp, setPrevExp] = useState("");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<HTMLSelectElement>(null);
  const confirmRef = useRef<HTMLLabelElement>(null);

  // Sync preselectedRoom when modal opens
  useEffect(() => {
    if (open) setRoomType(preselectedRoom);
  }, [open, preselectedRoom]);

  const scrollToField = (el: HTMLElement | null) => {
    if (!el) return;
    const container = scrollContainerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.top - containerRect.top + container.scrollTop - containerRect.height / 3;
      container.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    }
    setTimeout(() => {
      if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) el.focus();
    }, 350);
  };

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isValidPhone = (v: string) => /^0[2-9]\d{7,8}$/.test(v.replace(/[-\s]/g, ""));

  const validateAndScroll = (): boolean => {
    const errors: Record<string, string> = {};

    if (!roomType) errors.roomType = "יש לבחור אופן השתתפות";
    if (!fname.trim()) errors.fname = "יש למלא שם פרטי";
    if (!lname.trim()) errors.lname = "יש למלא שם משפחה";
    if (!email.trim()) errors.email = "יש למלא אימייל";
    else if (!isValidEmail(email)) errors.email = "כתובת אימייל לא תקינה";
    if (!phone.trim()) errors.phone = "יש למלא טלפון";
    else if (!isValidPhone(phone)) errors.phone = "מספר טלפון לא תקין (למשל 0501234567)";
    if (!gender) errors.gender = "יש לבחור מגדר";
    if (!foodPref) errors.foodPref = "יש לבחור העדפת אוכל";
    if (!prevExp) errors.prevExp = "יש לבחור ניסיון קודם";
    if (!confirmed) errors.confirmed = "יש לאשר את התנאים";

    setFieldErrors(errors);
    setError("");

    if (Object.keys(errors).length > 0) {
      // Scroll to first error field
      const fieldOrder = ["roomType", "fname", "lname", "email", "phone", "gender", "foodPref", "prevExp", "confirmed"];
      const firstErrorKey = fieldOrder.find((k) => errors[k]);
      const selectorMap: Record<string, string> = {
        roomType: "[data-field='roomType']",
        fname: "[data-field='fname']",
        lname: "[data-field='lname']",
        email: "[data-field='email']",
        phone: "[data-field='phone']",
        gender: "[data-field='gender']",
        foodPref: "[data-field='foodPref']",
        prevExp: "[data-field='prevExp']",
        confirmed: "[data-field='confirmed']",
      };
      if (firstErrorKey) {
        const el = formRef.current?.querySelector(selectorMap[firstErrorKey]) as HTMLElement;
        scrollToField(el);
      }
      return false;
    }

    return true;
  };

  const fieldErrorClass = (field: string) =>
    fieldErrors[field] ? "border-red-400 ring-1 ring-red-400" : "";

  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="text-xs text-red-500 mt-1">{fieldErrors[field]}</p> : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validateAndScroll()) return;

    window.gtag?.("event", "registration_submitted", { room_type: roomType });

    const price = roomType ? ROOM_PRICES[roomType] : 0;
    const regToken = crypto.randomUUID();
    // Deterministic event IDs derived from reg_token so client-side pixel
    // and server-side CAPI (fired from n8n) dedupe on the same value.
    const icEventId = `ic-${regToken}`;
    const purchaseEventId = `purchase-${regToken}`;
    trackMeta(
      "InitiateCheckout",
      {
        value: price,
        currency: "ILS",
        content_name: "Six Yogas of Niguma Retreat",
        content_ids: roomType ? [roomType] : [],
        num_items: 1,
      },
      icEventId,
    );
    try {
      sessionStorage.setItem(
        "egn_pending_purchase",
        JSON.stringify({ value: price, roomType, event_id: purchaseEventId, ts: Date.now() }),
      );
    } catch {
      /* sessionStorage may be unavailable */
    }

    setSubmitting(true);

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reg_token: regToken,
          field_event: roomType,
          full_name: `${fname} ${lname}`.trim(),
          email,
          phone,
          gender,
          food_pref: foodPref,
          prev_exp: prevExp,
          message,
        }),
      });

      if (!res.ok) throw new Error("שגיאה בשרת, נסו שוב");

      const data = await res.json();
      if (data.cardcom_url) {
        window.gtag?.("event", "payment_redirect", { room_type: roomType });
        window.location.href = data.cardcom_url;
      } else {
        throw new Error("לא התקבל קישור לתשלום");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בשליחת הטופס");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-stone-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#C9A961] focus:border-transparent transition-shadow";
  const selectClass = `${inputClass} appearance-none pr-10`;
  const labelClass = "block text-sm font-semibold mb-1.5 text-stone-700";

  const SelectWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      {children}
      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: WARM_GRAY }} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-lg md:max-w-2xl max-h-[90vh] p-0 gap-0 rounded-xl border-0 overflow-hidden"
        style={{ fontFamily: "'Open Sans', 'Heebo', sans-serif" }}
      >
        <div ref={scrollContainerRef} className="max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-200 sticky top-0 bg-white z-10 rounded-t-xl">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif", color: DARK }}>
              הרשמה לריטריט
            </DialogTitle>
            <DialogDescription className="text-sm mt-1" style={{ color: WARM_GRAY }}>
              ששת היוגות של ניגומה | 6-12 בדצמבר 2026
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">
          {/* Room Type */}
          <div data-field="roomType">
            <label className={labelClass}>אופן ההשתתפות *</label>
            <SelectWrapper>
              <select
                ref={roomRef}
                value={roomType}
                onChange={(e) => { const val = e.target.value as RoomType; setRoomType(val); if (val) window.gtag?.("event", "room_type_selected", { room_type: val }); setFieldErrors((p) => ({ ...p, roomType: "" })); }}
                className={`${selectClass} ${fieldErrorClass("roomType")}`}
              >
                <option value="">בחרו</option>
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.price}
                  </option>
                ))}
              </select>
            </SelectWrapper>
            <FieldError field="roomType" />
          </div>

          {/* Name fields - two columns */}
          <div className="grid grid-cols-2 gap-3">
            <div data-field="fname">
              <label className={labelClass}>שם פרטי *</label>
              <input type="text" value={fname} onChange={(e) => { setFname(e.target.value); setFieldErrors((p) => ({ ...p, fname: "" })); }} className={`${inputClass} ${fieldErrorClass("fname")}`} placeholder="שם פרטי" />
              <FieldError field="fname" />
            </div>
            <div data-field="lname">
              <label className={labelClass}>שם משפחה *</label>
              <input type="text" value={lname} onChange={(e) => { setLname(e.target.value); setFieldErrors((p) => ({ ...p, lname: "" })); }} className={`${inputClass} ${fieldErrorClass("lname")}`} placeholder="שם משפחה" />
              <FieldError field="lname" />
            </div>
          </div>

          {/* Email */}
          <div data-field="email">
            <label className={labelClass}>אימייל *</label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }} className={`${inputClass} ${fieldErrorClass("email")}`} placeholder="your@email.com" dir="ltr" style={{ textAlign: "left" }} />
            <FieldError field="email" />
          </div>

          {/* Phone */}
          <div data-field="phone">
            <label className={labelClass}>טלפון *</label>
            <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setFieldErrors((p) => ({ ...p, phone: "" })); }} className={`${inputClass} ${fieldErrorClass("phone")}`} placeholder="050-1234567" dir="ltr" style={{ textAlign: "left" }} />
            <FieldError field="phone" />
          </div>

          {/* Gender + Food Pref - two columns */}
          <div className="grid grid-cols-2 gap-3">
            <div data-field="gender">
              <label className={labelClass}>מגדר (לשיבוץ חדרים) *</label>
              <div className={`flex gap-4 mt-2 p-2 rounded-lg ${fieldErrors.gender ? "ring-1 ring-red-400" : ""}`}>
                {[{ value: "male", label: "גבר" }, { value: "female", label: "אישה" }].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={opt.value}
                      checked={gender === opt.value}
                      onChange={(e) => { setGender(e.target.value); setFieldErrors((p) => ({ ...p, gender: "" })); }}
                      className="h-4 w-4 accent-[#C9A961]"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
              <FieldError field="gender" />
            </div>
            <div data-field="foodPref">
              <label className={labelClass}>העדפות בחדר אוכל *</label>
              <SelectWrapper>
                <select value={foodPref} onChange={(e) => { setFoodPref(e.target.value); setFieldErrors((p) => ({ ...p, foodPref: "" })); }} className={`${selectClass} ${fieldErrorClass("foodPref")}`}>
                  <option value="">בחרו</option>
                  <option value="regular">רגיל</option>
                  <option value="vegetarian">צמחוני</option>
                  <option value="vegan">טבעוני</option>
                </select>
              </SelectWrapper>
              <FieldError field="foodPref" />
            </div>
          </div>

          {/* Previous Experience */}
          <div data-field="prevExp">
            <label className={labelClass}>ניסיון קודם בלימודים בודהיסטים *</label>
            <SelectWrapper>
              <select value={prevExp} onChange={(e) => { setPrevExp(e.target.value); setFieldErrors((p) => ({ ...p, prevExp: "" })); }} className={`${selectClass} ${fieldErrorClass("prevExp")}`}>
                <option value="">בחרו</option>
                <option value="extensive">רב</option>
                <option value="intermediate">בינוני</option>
                <option value="limited">מועט</option>
                <option value="none">ללא</option>
              </select>
            </SelectWrapper>
            <FieldError field="prevExp" />
          </div>

          {/* Message to organizers */}
          <div>
            <label className={labelClass}>הודעה למארגנים</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="רוצים לשתף אותנו במשהו?"
            />
          </div>

          {/* Confirmation */}
          <div data-field="confirmed">
            <label ref={confirmRef} className={`flex items-start gap-3 cursor-pointer p-3 -mx-3 rounded-lg hover:bg-stone-50 transition-colors ${fieldErrors.confirmed ? "ring-1 ring-red-400 rounded-lg" : ""}`}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => { setConfirmed(e.target.checked); setFieldErrors((p) => ({ ...p, confirmed: "" })); }}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-[#C9A961]"
              />
              <span className="text-xs leading-relaxed" style={{ color: WARM_GRAY }}>
                אני מאשר/ת את <a href="/events/ein-gedi-healing-retreat/terms" target="_blank" rel="noopener noreferrer" className="underline decoration-1 underline-offset-2 hover:text-[#C9A961]">תנאי הריטריט וההרשמה</a> ומסכים/ה לקבל עדכונים מאיטרייה סנגהה ישראל.
              </span>
            </label>
            <FieldError field="confirmed" />
          </div>

          {/* Network/server error only */}
          {error && !Object.values(fieldErrors).some(Boolean) && (
            <p className="text-sm text-red-600 text-center font-medium">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 text-lg font-bold text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
            style={{ backgroundColor: GOLD }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                שולח...
              </>
            ) : (
              "שליחה ומעבר לתשלום"
            )}
          </button>

          <p className="text-xs text-center" style={{ color: WARM_GRAY }}>
            לאחר מילוי הטופס תועברו לדף תשלום מאובטח
          </p>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Payment Status Modal ── */
const PaymentStatusModal = ({ status, onClose }: { status: "success" | "failed"; onClose: () => void }) => (
  <Dialog open onOpenChange={onClose}>
    <DialogContent
      dir="rtl"
      className="max-w-md rounded-xl border-0 text-center"
      style={{ fontFamily: "'Open Sans', 'Heebo', sans-serif" }}
    >
      <div className="py-6 space-y-4">
        {status === "success" ? (
          <>
            <CheckCircle2 className="h-16 w-16 mx-auto" style={{ color: "#4CAF50" }} />
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif", color: DARK }}>
                ההרשמה בוצעה בהצלחה!
              </DialogTitle>
              <DialogDescription className="text-base mt-3 leading-relaxed" style={{ color: WARM_GRAY }}>
                תודה שנרשמתם לריטריט "ששת היוגות של ניגומה".
                <br />
                אישור הרשמה ופרטים נוספים יישלחו אליכם במייל.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-stone-50 rounded-lg p-4 text-sm space-y-1" style={{ color: WARM_GRAY }}>
              <p className="font-semibold" style={{ color: DARK }}>פרטי הריטריט</p>
              <p>6-12 בדצמבר 2026</p>
              <p>בית ספר שדה עין גדי, ים המלח</p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="h-16 w-16 mx-auto text-red-500" />
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif", color: DARK }}>
                אירעה שגיאה בתשלום
              </DialogTitle>
              <DialogDescription className="text-base mt-3 leading-relaxed" style={{ color: WARM_GRAY }}>
                התשלום לא הושלם. ניתן לנסות שוב או ליצור קשר איתנו.
              </DialogDescription>
            </DialogHeader>
          </>
        )}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 text-base font-bold text-white rounded-full shadow-md transition-all duration-300 hover:shadow-lg"
            style={{ backgroundColor: GOLD }}
          >
            {status === "success" ? "סגור" : "חזרה לדף הריטריט"}
          </button>
          {status === "failed" && (
            <a
              href="mailto:maitreyasanghaisrael@gmail.com"
              className="text-sm underline underline-offset-4 transition-colors hover:text-[#C9A961]"
              style={{ color: WARM_GRAY }}
            >
              צרו קשר: maitreyasanghaisrael@gmail.com
            </a>
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

/* ── Mailing List Signup Component ── */
const MailingListSignup = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const { error } = await supabase.functions.invoke("mailchimp-sync", {
        body: { email, tag: "Hebrew" },
      });
      if (error) throw error;
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="py-16 px-4" style={{ backgroundColor: "#F5F0EB" }} dir="rtl">
      <div className="max-w-xl mx-auto text-center">
        <h2
          className="text-2xl md:text-3xl font-bold mb-3"
          style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}
        >
          הישארו מעודכנים
        </h2>
        <p className="mb-6" style={{ color: WARM_GRAY }}>
          הירשמו לרשימת התפוצה שלנו וקבלו עדכונים על ריטריטים, סדנאות ואירועים נוספים
        </p>

        {status === "success" ? (
          <div className="flex items-center justify-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span>תודה! נרשמת בהצלחה</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <input
              type="email"
              required
              placeholder="כתובת אימייל"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
              className="w-full sm:w-72 px-4 py-3 rounded-lg border border-stone-300 bg-white text-right focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
              dir="ltr"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3 rounded-lg text-white font-medium flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: GOLD }}
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              הרשמה
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-3 text-red-600 text-sm flex items-center justify-center gap-1">
            <XCircle className="h-4 w-4" />
            שגיאה בהרשמה, נסו שוב
          </p>
        )}
      </div>
    </section>
  );
};

const SixYogasNigumaRetreat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const testMode = searchParams.get("test") === TEST_KEY;
  const [modalOpen, setModalOpen] = useState(false);
  const [preselectedRoom, setPreselectedRoom] = useState<RoomType>("");
  const paymentStatus = searchParams.get("payment") as "success" | "failed" | null;

  const purchaseFiredRef = useRef(false);
  useEffect(() => {
    if (paymentStatus === "success") {
      window.gtag?.("event", "payment_success");
      if (purchaseFiredRef.current) return;
      try {
        const raw = sessionStorage.getItem("egn_pending_purchase");
        if (raw) {
          const pending = JSON.parse(raw) as { value: number; roomType: string; event_id: string };
          // Per-event-id guard: only block if this exact event_id already fired.
          // This still prevents accidental double-fires on refresh, but allows
          // repeat testing in the same tab (each test has a fresh reg_token).
          const firedKey = `egn_purchase_fired:${pending.event_id}`;
          if (sessionStorage.getItem(firedKey) === "1") {
            purchaseFiredRef.current = true;
            return;
          }
          trackMeta(
            "Purchase",
            {
              value: pending.value,
              currency: "ILS",
              content_name: "Six Yogas of Niguma Retreat",
              content_ids: pending.roomType ? [pending.roomType] : [],
              num_items: 1,
            },
            pending.event_id,
          );
          sessionStorage.setItem(firedKey, "1");
          sessionStorage.removeItem("egn_pending_purchase");
          purchaseFiredRef.current = true;
        } else {
          // Fallback: fire Purchase without value if sessionStorage was cleared
          // (e.g., user closed and reopened the tab between checkout and payment).
          trackMeta("Purchase", { currency: "ILS", content_name: "Six Yogas of Niguma Retreat" });
          purchaseFiredRef.current = true;
        }
      } catch {
        /* ignore */
      }
    } else if (paymentStatus === "failed") {
      window.gtag?.("event", "payment_failed");
    }
  }, [paymentStatus]);

  const trackEvent = (event: string, params?: Record<string, string>) => {
    window.gtag?.("event", event, params);
  };

  const openRegistration = (room: RoomType = "") => {
    trackEvent("registration_modal_open", room ? { room_type: room } : undefined);
    trackMeta("Lead", room ? { content_name: room } : undefined);
    setPreselectedRoom(room);
    setModalOpen(true);
  };

  const closePaymentStatus = () => {
    setSearchParams({}, { replace: true });
  };

  // The test link opens the form straight away on the hidden 1 NIS option.
  useEffect(() => {
    if (testMode && !paymentStatus) { setPreselectedRoom(TEST_TIER); setModalOpen(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testMode]);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  // Repeat images enough times so the user never reaches an edge
  const REPEATS = 7;
  const MID_START = Math.floor(REPEATS / 2) * galleryImages.length;
  const extendedImages = Array.from({ length: REPEATS }, () => galleryImages).flat();
  const [carouselIndex, setCarouselIndex] = useState(MID_START);

  // Map extended index back to real index for dots/lightbox
  const realIndex = carouselIndex % galleryImages.length;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [isPaused, setIsPaused] = useState(false);
  const [openSchedule, setOpenSchedule] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const carouselRef = useRef<HTMLDivElement>(null);

  // Silently reset to middle when drifting too far from center
  const resetIfNeeded = useCallback((idx: number) => {
    const len = galleryImages.length;
    const lowerBound = len;
    const upperBound = (REPEATS - 1) * len;
    if (idx < lowerBound || idx >= upperBound) {
      const real = ((idx % len) + len) % len;
      const resetIdx = MID_START + real;
      requestAnimationFrame(() => {
        if (carouselRef.current) {
          carouselRef.current.style.transition = "none";
        }
        setCarouselIndex(resetIdx);
        requestAnimationFrame(() => {
          if (carouselRef.current) {
            carouselRef.current.style.transition = "";
          }
        });
      });
    }
  }, [MID_START]);

  const nextSlide = useCallback(() => {
    setCarouselIndex((prev) => {
      const next = prev + 1;
      resetIfNeeded(next);
      return next;
    });
  }, [resetIfNeeded]);

  const prevSlide = useCallback(() => {
    setCarouselIndex((prev) => {
      const next = prev - 1;
      resetIfNeeded(next);
      return next;
    });
  }, [resetIfNeeded]);

  useEffect(() => {
    if (isPaused || lightboxIndex !== null) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isPaused, lightboxIndex, nextSlide]);

  // Page SEO through the shared hook (adds canonical, site name and twitter tags)
  useRetreatSEO({
    title: "ששת היוגות של ניגומה: ריטריט עם לאמה גלן בעין גדי | 6-12 בדצמבר 2026 | מאיטרייה סנגהה ישראל",
    description:
      "שישה ימי לימוד ותרגול של ששת היוגות של ניגומה - הדרך הנשגבת להארה של דאקיני החוכמה - עם לאמה גלן מולין, כולל העצמת ואג׳ראיוגיני. בית ספר שדה עין גדי, ים המלח, בחנוכה, 6-12 בדצמבר 2026.",
    keywords: "ששת היוגות של ניגומה, ניגומה, טומו, ואג׳ראיוגיני, ריטריט, עין גדי, ים המלח, חנוכה, לאמה גלן, בודהיזם טיבטי, טנטרה, מאיטרייה סנגהה",
    url: "https://maitreya.org.il/events/six-yogas-niguma-retreat",
    ogImage: "https://maitreya.org.il/og-six-yogas-niguma.jpg",
    locale: "he_IL",
  });

  return (
    <div dir="rtl" style={{ backgroundColor: CREAM, color: DARK, fontFamily: "'Open Sans', 'Heebo', sans-serif" }} className="min-h-screen">

      {/* ── Nav Bar ── */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/90 border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="https://maitreya.org.il/">
            <img src={maitreyaLogo} alt="מאיטרייה סנגהה ישראל" className="h-11 object-contain" />
          </a>
          <button
            className="py-2.5 px-6 text-base font-bold text-white rounded-full shadow-md hover:shadow-xl hover:scale-110 hover:brightness-110 transition-all duration-200"
            style={{ backgroundColor: "#B8860B" }}
            onClick={() => openRegistration()}
          >
            להרשמה
          </button>
        </div>
      </nav>

      {/* ── Hero Image (full-width, not background) ── */}
      <section className="relative">
        <img
          src={heroImage}
          alt="נוף ים המלח"
          className="w-full h-[50vh] md:h-[65vh] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 md:from-black/70 via-black/35 md:via-black/40 via-[75%] to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-8 md:p-16">
          <div className="max-w-4xl mx-auto text-center md:text-start" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.45)" }}>
            <h1 className="text-[2.6rem] md:text-5xl lg:text-6xl font-bold text-white leading-none md:leading-tight mb-4" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>
              ששת היוגות של ניגומה
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-1 md:max-w-2xl">
              הדרך הנשגבת להארה של דאקיני החוכמה
            </p>
            <p className="text-lg md:text-xl text-white/80 mb-2 md:max-w-2xl">
              כולל העצמת ואג׳ראיוגיני
            </p>
            <p className="text-xl md:text-2xl font-semibold mb-4" style={{ color: GOLD, textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}>
              עם לאמה גלן מולין
            </p>
            <p className="text-lg md:text-xl text-white/70">
              6-12 בדצמבר 2026, בחנוכה | בית ספר שדה עין גדי, ים המלח
            </p>
          </div>
        </div>
      </section>

      {/* ── Key info strip (visual break between two photo stripes) ── */}
      <div className="py-12 md:py-16" style={{ backgroundColor: CREAM }}>
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-lg md:text-xl leading-[1.8] text-center mb-8" style={{ color: "#3D3830" }}>
            הבודהיזם הטנטרי מלמד אותנו טכניקות מדיטציה רבות עוצמה, המביאות להבנה עמוקה של הקיום האנושי, לשחרור מסבל ולפיתוח אהבה וחוכמה. האמצעים המיוחדים של הבודהיזם הטנטרי מאפשרים לנו להשתמש בתהליכי העומק של הגוף והתודעה כדי להגיע למצבי תודעה ייחודיים. מצבים אלו משחררים אותנו מדרכי התפיסה הרגילות המגבילות אותנו, ומאפשרים לנו לפעול מתוך תודעה מיטיבה לנו ולאחרים - ובסופו של דבר - להגיע להארה מלאה בזמן חיים אחד.
          </p>
          <div className="text-center">
            <button
              className="py-3 px-8 text-base font-bold rounded-full border-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
              style={{ borderColor: "#B8860B", color: "#B8860B", backgroundColor: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#B8860B"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#B8860B"; }}
              onClick={() => openRegistration()}
            >
              להרשמה
            </button>
          </div>
        </div>
      </div>

      {/* ── About (photo background + frosted glass panel) ── */}
      <section className="relative py-20 md:py-32">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${venuePhoto1})` }} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="bg-white/85 backdrop-blur-md rounded-lg p-10 md:p-16 shadow-xl max-w-3xl mx-auto">
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase mb-8" style={{ color: WARM_GRAY, letterSpacing: "0.2em" }}>
              אודות הריטריט
            </h2>
            <div className="space-y-6 text-lg leading-[1.8]" style={{ color: "#3D3830" }}>
              <p>
                הטכנולוגיה היוגית של ששת היוגות של ניגומה, שמקורן במיסטיקנית ההודית ניגומה בת המאה ה-10, היא אחת מהשיטות היעילות ורבות העוצמה שבמסורת הטנטרית. דרך ששת תרגולי היוגה השונים (יוגה - תרגול רוחני) אנו לומדים להשתמש בגוף, בנשימה ובתודעה בדרכים יוצאות דופן, שמייצרות מצבים עמוקים של טיהור, הבנה ואושר - ובסופו של דבר מביאות אותנו להארה מלאה.
              </p>
              <p>
                ששת היוגות של ניגומה הן מהתרגולים החשובים ביותר של יוגים ומתרגלים במסורות הבודהיזם הטנטרי של אסיה, והן מתורגלות ברציפות כבר מעל אלף שנה - כולל בשושלת הדלאי לאמות של טיבט. רק בשנים האחרונות החלו ללמד אותן במערב. זוהי הזדמנות מיוחדת ללמוד את המערכת רבת העוצמה הזאת לטרנספורמציה פנימית, ישירות מלב השושלת.
              </p>
              <p>
                בריטריט ילמד לאמה גלן מולין את ששת היוגות שלב אחר שלב - לימוד, הדרכה מעשית ותרגול מודרך - ויעביר את העצמת ואג׳ראיוגיני. דרופון צ׳ונגוואל-לה, מדריך הריטריטים של לאמה גלן, יוביל את התרגול המודרך.
              </p>
              <p>
                אנו שמחים במיוחד לערוך את הריטריט המיוחד הזה באזור ים המלח - אזור רב עוצמה, ששימש אתר תרגול רוחני לקדושים ולמתרגלים משחר ההיסטוריה. והפעם גם בחנוכה, חג האור והאש - זמן שמתאים במיוחד לתרגולי האש הפנימית.
              </p>
              <p>
                הריטריט מתאים למתרגלים מתחילים ומתקדמים, ויתקיים בליווי תרגום לעברית.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Teachers ── */}
      <section className="py-16 md:py-24" style={{ backgroundColor: "#F5F0EA" }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-16" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>
            המורים
          </h2>

          {/* Lama Glenn - photo right, text left (RTL: photo on right visually) */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12 mb-20">
            <div className="flex-shrink-0">
              <img
                src={lamaGlennPhoto}
                alt="לאמה גלן מולין"
                className="w-64 h-72 md:w-80 md:h-96 rounded-lg object-cover shadow-xl"
              />
            </div>
            <div className="text-center md:text-start flex-1">
              <h3 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>
                לאמה גלן מולין
              </h3>
              <div className="w-12 h-[2px] mb-5 mx-auto md:mx-0 md:ms-0" style={{ backgroundColor: GOLD }} />
              <p className="text-lg leading-[1.9]" style={{ color: WARM_GRAY }}>
                לאמה גלן מולין הינו מורה וותיק ואהוב של טנטרה בודהיסטית וטומו.
                הוא תלמידם הישיר של הוד קדושתו הדלאי לאמה ה-14, ומורי השורש שלו
                הם לינג רינפוצ׳ה השישי וטריג׳נג רינפוצ׳ה - מורי השורש האישיים של
                הדלאי לאמה ה-14. לאמה גלן מלמד בודהיזם טיבטי מעל שלושים שנה
                לאלפי תלמידים בכל רחבי העולם. הוא חוקר, סופר, ומתרגם ידוע - שכתב
                מעל 30 ספרים בנושאי בודהיזם טיבטי וטנטרה בודהיסטית שפורסמו בכל
                רחבי העולם.
              </p>
            </div>
          </div>

          {/* Drupon - flipped: photo left, text right (RTL: photo on left visually) */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-shrink-0">
              <img
                src={druponPhoto}
                alt="דרופון צ׳ונגוואל-לה"
                className="w-52 h-60 md:w-64 md:h-80 rounded-lg object-cover shadow-xl"
              />
            </div>
            <div className="text-center md:text-start flex-1">
              <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>
                דרופון צ׳ונגוואל-לה
              </h3>
              <div className="w-12 h-[2px] mb-5 mx-auto md:mx-0 md:ms-0" style={{ backgroundColor: GOLD }} />
              <p className="text-lg leading-[1.9]" style={{ color: WARM_GRAY }}>
                דרופון צ׳ונגוואל-לה הוא מדריך הריטריטים של לאמה גלן ומורה מיומן
                לטנטרה בודהיסטית וטומו. הוא נולד בדרום קוריאה וגדל בארה״ב, ושימש
                כנזיר במסורת הזן במשך 16 שנה. מאז 2007 הוא מתרגל טנטרה מהאיאנה
                בהדרכת מורה השורש שלו, לאמה גלן. דרופון צ׳ונגוואל-לה מלמד
                תלמידים ברחבי העולם - בקוריאה, ארה״ב, רוסיה, ישראל, דרום אמריקה
                ועוד.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Six Yogas ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>
            מהן ששת היוגות של ניגומה?
          </h2>
          <p className="text-lg text-center mb-12" style={{ color: WARM_GRAY }}>
            המיסטיקאית בת המאה ה-10 לימדה את המערכת הטנטרית של ששת היוגות - מפת הדרכים של הטכניקות הפנימיות להגעה מהירה להארה. ששת היוגות הן:
          </p>

          <div className="max-w-2xl mx-auto mb-12">
            <img
              src={yogiMural}
              alt="ציור קיר טיבטי של יוגים במדיטציה"
              className="w-full rounded-lg shadow-md"
            />
          </div>

          <div className="space-y-8 max-w-2xl mx-auto">
            {[
              { title: "יוגת האש הפנימית - טומו", description: "הגעה למצבי תודעה עמוקים ומרפאים דרך שימוש באנרגיית האש של הקונדליני." },
              { title: "יוגת הגוף האשלייתי ויוגת האור הצלול", description: "היכרות עם הטבע העמוק של הגוף והעולם הפיזי, ועם הרמות העמוקות של התודעה." },
              { title: "יוגת החלימה", description: "שימוש בתהליך החלימה המודעת לפיתוח התודעה." },
              { title: "יוגת ההעברה (פוואה) ויוגת מצב הביניים (הבארדו)", description: "היכרות עם תהליך המוות והלידה מחדש כדרך לשחרור ולהארה." },
            ].map((yoga) => (
              <div key={yoga.title} className="flex gap-4">
                <GoldDot />
                <div>
                  <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>
                    {yoga.title}
                  </h3>
                  <p className="text-lg leading-[1.8]" style={{ color: WARM_GRAY }}>{yoga.description}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-lg leading-[1.8] max-w-2xl mx-auto mt-12" style={{ color: "#3D3830" }}>
            ששת היוגות מאפשרות לנו להתמיר את כל מצבי החיים - ערות ושינה, מדיטציה וחיי היום יום, חיי האהבה ואפילו את תהליך המוות - לתוך הדרך להתעוררות רוחנית.
          </p>
        </div>
      </section>

      {/* ── Vajrayogini empowerment (image right, text left) ── */}
      <section className="py-16 md:py-24" style={{ backgroundColor: "#F5F0EA" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-12 items-center">
            <div className="mx-auto md:mx-0 w-[220px] md:w-[260px] shrink-0">
              <img src={vajrayoginiFigure} alt="ואג׳ראיוגיני והערוץ המרכזי" className="w-full rounded-lg shadow-md" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>
                תרגול והעצמת ואג׳ראיוגיני
              </h2>
              <p className="text-base font-medium mb-6" style={{ color: GOLD }}>הבודהה הנשית של התמרת התשוקה לחוכמה</p>
              <div className="space-y-5 text-lg leading-[1.8]" style={{ color: "#3D3830" }}>
                <p>את ששת היוגות של ניגומה נלמד בהקשר של התרגול הטנטרי של ואג׳ראיוגיני - המאפשר לנו להשתמש באש התשוקה וההיקשרות ולהתמיר אותה לחוכמה עילאית. תרגול ואג׳ראיוגיני ידוע כתרגול מהיר ועוצמתי במיוחד, והוא תרגול עיקרי בכל הזרמים של הבודהיזם הטיבטי - כולל בשושלת הדלאי לאמות.</p>
                <p>במהלך הריטריט יעביר לאמה גלן את העצמת ואג׳ראיוגיני למשתתפים, וילמד סדהנה קצרה של אחת-עשרה היוגות של ואג׳ראיוגיני - התרגול היומי שמלווה את המתרגל אחרי הריטריט.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Schedule (alternating image + text, Esalen-style) ── */}
      <section className="py-16 md:py-24" style={{ backgroundColor: CREAM }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-center mb-16" style={{ color: WARM_GRAY, letterSpacing: "0.2em" }}>
            מבנה הריטריט
          </h2>

          {/* Arrival & logistics */}
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center mb-20">
            <div>
              <h3 className="text-sm font-bold tracking-[0.15em] uppercase mb-4" style={{ color: WARM_GRAY, letterSpacing: "0.15em" }}>
                הגעה ולוגיסטיקה
              </h3>
              <div className="space-y-4 text-lg leading-[1.8]" style={{ color: "#3D3830" }}>
                <p>הריטריט מתחיל ביום ראשון, 6 בדצמבר, בשעה 14:00, ומסתיים ביום שבת, 12 בדצמבר 2026, בשעה 15:00.</p>
                <p>יום ראשון הוא יום ההגעה וההתמקמות; ששת ימי הלימוד הם שני עד שבת.</p>
              </div>
              <h3 className="text-sm font-bold tracking-[0.15em] uppercase mt-8 mb-4" style={{ color: WARM_GRAY, letterSpacing: "0.15em" }}>
                ארוחות
              </h3>
              <div className="text-lg leading-[1.8]" style={{ color: "#3D3830" }}>
                <p>ארוחת בוקר: 8:00-9:15</p>
                <p>ארוחת צהריים: 12:30-13:30</p>
                <p>ארוחת ערב: 18:30-19:30</p>
              </div>
            </div>
            <img
              src={venuePhoto4}
              alt="בית ספר שדה עין גדי"
              className="w-full h-64 md:h-80 object-cover rounded-lg shadow-md"
            />
          </div>

          {/* Workshop hours - alternating direction */}
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center mb-20">
            <img
              src={gallery14}
              alt="מתוך ריטריט קודם"
              className="w-full h-64 md:h-80 object-cover rounded-lg shadow-md order-2 md:order-1"
            />
            <div className="order-1 md:order-2">
              <h3 className="text-sm font-bold tracking-[0.15em] uppercase mb-6" style={{ color: WARM_GRAY, letterSpacing: "0.15em" }}>
                שעות התרגול
              </h3>
              <div className="space-y-6">
                {[
                  { days: "יום ראשון, 6 בדצמבר", practice: "הגעה והתמקמות", times: "פתיחה: 17:00" },
                  { days: "שני עד שישי, 7-11 בדצמבר", practice: "ששת היוגות של ניגומה", times: "בוקר: 9:30-12:30 | אחה״צ: 14:30-18:15" },
                  { days: "שבת, 12 בדצמבר", practice: "סיום", times: "בוקר: 9:30-12:30 | סיום: 15:00" },
                ].map((block, i) => (
                  <div key={i} className="border-r-2 pr-4" style={{ borderColor: GOLD }}>
                    <p className="font-bold text-base mb-0.5">{block.days}</p>
                    <p className="font-bold text-lg" style={{ color: GOLD }}>{block.practice}</p>
                    <p className="text-base mt-1" style={{ color: WARM_GRAY }}>{block.times}</p>
                  </div>
                ))}
              </div>
              <p className="text-base mt-6" style={{ color: WARM_GRAY }}>
                כל יום יכלול לימוד, תרגול מודרך, יוגה ומדיטציה. הריטריט כולו בתוך חנוכה - מהנר השלישי ביום ראשון ועד היום השמיני בשבת - והדלקת נרות מדי ערב.
              </p>
              <p className="text-base mt-2" style={{ color: WARM_GRAY }}>
                למעוניינים: מדיטציה בשעות הבוקר המוקדמות ופעילויות ערב.
              </p>
            </div>
          </div>

          <p className="text-center text-base" style={{ color: WARM_GRAY }}>
            הריטריט מתאים למתרגלים מתחילים ומתקדמים וילווה בתרגום לעברית.
          </p>
          <p className="text-center text-sm mt-4" style={{ color: WARM_GRAY }}>
            * לוח הזמנים המוצג הוא משוער. לוח הזמנים הסופי יישלח למשתתפים לפני הריטריט.
          </p>
        </div>
      </section>

      {/* ── What's Included (photo background stripe) ── */}
      <section className="relative py-20 md:py-28">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${venuePhoto3})` }} />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-center text-white/90 mb-14" style={{ letterSpacing: "0.2em" }}>
            מה כולל הריטריט
          </h2>
          <div className="grid md:grid-cols-2 gap-x-20 gap-y-5 max-w-3xl mx-auto">
            {[
              "השתתפות בכל השיעורים והתרגולים",
              "העצמת ואג׳ראיוגיני",
              "לינה ל-6 לילות (ראשון עד שבת)",
              "ארוחות מלאות (בוקר, צהריים, ערב)",
              "תרגום לעברית לאורך כל הריטריט",
              "שיעורי יוגה ומדיטציה",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-1">
                <span className="text-lg" style={{ color: GOLD }}>&#10047;</span>
                <span className="text-lg text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="py-16 md:py-24" style={{ backgroundColor: "#F5F0EA" }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>
            עלות למשתתף
          </h2>
          <p className="text-center text-base mb-12" style={{ color: WARM_GRAY }}>
            המחיר כולל לינה ל-6 לילות, ארוחות מלאות והשתתפות בכל השיעורים והתרגולים
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              { type: "4 בחדר", price: "4,100", note: "חדר משותף לארבעה", sub: "לאדם | הכל כלול", featured: true, roomKey: "EGN_2026_Quad" as RoomType },
              { type: "ללא לינה, כל הריטריט", price: "1,950", note: "כולל ארוחת צהריים וכיבוד", sub: "לאדם | ששת ימי הלימוד", roomKey: "EGN_2026_NoLodging" as RoomType },
            ].map((option) => (
              <div
                key={option.type}
                className={`bg-white rounded-lg p-8 text-center transition-shadow flex flex-col ${
                  option.featured ? "shadow-lg ring-2" : "shadow-sm hover:shadow-md"
                }`}
                style={option.featured ? { borderColor: GOLD, boxShadow: `0 0 0 2px ${GOLD}` } : {}}
              >
                {/* Badge area - fixed height so content below aligns */}
                <div className="h-8 mb-2 flex items-center justify-center">
                  {option.featured && (
                    <span className="inline-block px-3 py-1 text-xs font-bold text-white rounded-full" style={{ backgroundColor: GOLD }}>
                      לינה מלאה
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>
                  {option.type}
                </h3>
                <p className="text-base mb-6" style={{ color: WARM_GRAY }}>{option.note}</p>
                <p className="text-4xl font-bold mb-1">
                  {option.price}
                  <span className="text-lg font-normal mr-1">₪</span>
                </p>
                <p className="text-sm mb-2" style={{ color: WARM_GRAY }}>{option.sub}</p>
                <div className="mb-6" />
                <div className="mt-auto">
                  <CTAButton className="!text-base !px-8 !py-3 w-full" onClick={() => openRegistration(option.roomKey)}>להרשמה</CTAButton>
                </div>
              </div>
            ))}
          </div>
          <p className="text-base md:text-lg mt-8 text-center" style={{ color: WARM_GRAY }}>
            מספר המקומות מוגבל מאוד - מומלץ להירשם בהקדם
          </p>
          <p className="text-base mt-3 text-center" style={{ color: WARM_GRAY }}>
            ניתן לשלם בתשלומים
          </p>
        </div>
      </section>

      {/* ── Venue (photo background + text overlay, Esalen "Campus Features" style) ── */}
      <section className="relative py-20 md:py-28">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${venuePhoto2})` }} />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-white/90 mb-10" style={{ letterSpacing: "0.2em" }}>
            בית ספר שדה עין גדי
          </h2>
          <p className="text-lg md:text-xl text-white/85 leading-[1.8] max-w-2xl mx-auto mb-6">
            מתחם שקט ויפה הפונה לים המלח עם נוף ישיר לים ולהרי מואב.
            חמש דקות נסיעה מקיבוץ עין גדי, קרוב לשמורת הטבע ולמצוקי דרגות.
          </p>
          <p className="text-lg text-white/70 leading-[1.8] max-w-2xl mx-auto">
            החדרים שופצו בשנים האחרונות - פשוטים, יפים ונוחים. כל חדר כולל
            שירותים ומקלחת, מזגן ופינת קפה. המתחם כולל אולמות ממוזגים, חדר
            אוכל עם ארוחות מלאות, ושטחי חוץ ירוקים ונעימים.
          </p>
          <p className="text-lg text-white/70 leading-[1.8] max-w-2xl mx-auto mt-6">
            בדצמבר, ים המלח בשיאו: ימים נעימים, לילות צלולים, והמדבר שקט.
          </p>
        </div>
      </section>

      {/* Venue photo grid */}
      <section className="py-16 md:py-20" style={{ backgroundColor: CREAM }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-3 rounded-lg overflow-hidden">
            <img src={venuePhoto1} alt="נוף עין גדי" className="col-span-2 w-full h-48 md:h-72 object-cover rounded-lg" />
            <img src={venuePhoto4} alt="דקלים ומדשאות" className="w-full h-40 md:h-52 object-cover rounded-lg" />
            <img src={venuePhoto3} alt="שטחי החוץ" className="w-full h-40 md:h-52 object-cover rounded-lg" />
          </div>
        </div>
      </section>

      {/* ── Gallery Carousel ── */}
      <section className="py-16 md:py-24" style={{ backgroundColor: "#F5F0EA" }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>
            מהריטריטים שלנו
          </h2>
          <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="overflow-hidden rounded-lg" style={{ margin: isMobile ? "0 -6px" : "0 -10px" }} dir="ltr" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <div
                ref={carouselRef}
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: isMobile
                    ? `translateX(calc(${carouselIndex * -75}% + 12.5%))`
                    : `translateX(${carouselIndex * (-100 / 3)}%)`,
                }}
              >
                {extendedImages.map((src, i) => (
                  <div key={i} className="shrink-0" style={{ width: isMobile ? "75%" : `${100 / 3}%`, padding: isMobile ? "0 6px" : "0 10px" }}>
                    <div
                      onClick={() => setLightboxIndex(i % galleryImages.length)}
                      className="cursor-pointer rounded-lg overflow-hidden"
                      role="button"
                      tabIndex={0}
                    >
                      <img
                        src={src}
                        alt="מריטריטים קודמים של מאיטרייה סנגהה"
                        className="w-full aspect-[3/4] md:aspect-square object-cover transition-all duration-300 hover:scale-105"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={prevSlide}
              className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur shadow-md hover:bg-white rounded-full p-2 transition-colors"
            >
              <ChevronRight className="h-5 w-5" style={{ color: DARK }} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur shadow-md hover:bg-white rounded-full p-2 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" style={{ color: DARK }} />
            </button>

            <div className="flex justify-center gap-1.5 mt-8">
              {galleryImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIndex(MID_START + i)}
                  className="w-2 h-2 rounded-full transition-colors"
                  style={{ backgroundColor: i === realIndex ? GOLD : "#D4CFC7" }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Video ── */}
      <section className="py-16 md:py-24" style={{ backgroundColor: CREAM }}>
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>
            הכירו את לאמה גלן מולין
          </h2>
          <p className="text-lg text-center mb-10" style={{ color: WARM_GRAY }}>
            לאמה גלן מולין על טנטרה בודהיסטית בחיי היומיום
          </p>
          <div className="relative w-full rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/r6IniYsqRcw?start=1"
              title="לאמה גלן מולין - טנטרה בודהיסטית"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null || touchStartY.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            const dy = e.changedTouches[0].clientY - touchStartY.current;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
              e.stopPropagation();
              if (dx < 0) setLightboxIndex((lightboxIndex + 1) % galleryImages.length);
              else setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length);
            }
            touchStartX.current = null;
            touchStartY.current = null;
          }}
        >
          <button className="absolute top-4 left-4 text-white/80 hover:text-white p-2" onClick={() => setLightboxIndex(null)}>
            <X className="h-8 w-8" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length); }}
          >
            <ChevronRight className="h-10 w-10" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % galleryImages.length); }}
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <img
            src={galleryImages[lightboxIndex]}
            alt="מריטריטים קודמים של מאיטרייה סנגהה"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Final CTA ── */}
      <section className="relative py-20 md:py-28 text-center">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${venuePhoto4})` }} />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-lg" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>
            הצטרפו לריטריט
          </h2>
          <p className="text-xl text-white/70 mb-10 leading-relaxed drop-shadow-md">
            שישה ימים של ששת היוגות של ניגומה, עם העצמת ואג׳ראיוגיני, על שפת ים המלח בחנוכה
          </p>
          <CTAButton className="drop-shadow-lg" onClick={() => openRegistration()}>להרשמה לריטריט</CTAButton>
          <p className="text-sm text-white/40 mt-8 drop-shadow-sm">מספר המקומות מוגבל</p>
        </div>
      </section>

      {/* ── Info Footer (cancellation, scholarships, contact) ── */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6 space-y-10">
          <div>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>מדיניות ביטול</h3>
            <ul className="space-y-2 text-lg" style={{ color: WARM_GRAY }}>
              <li className="flex items-start gap-3"><GoldDot /><span>ביטול עד 30 יום לפני הריטריט - החזר מלא</span></li>
              <li className="flex items-start gap-3"><GoldDot /><span>ביטול 14-30 יום לפני - החזר של 50%</span></li>
              <li className="flex items-start gap-3"><GoldDot /><span>ביטול פחות מ-14 יום לפני - ללא החזר</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "'Playfair Display', 'Frank Ruhl Libre', serif" }}>צרו קשר</h3>
            <p className="text-lg" style={{ color: WARM_GRAY }}>
              לשאלות, בירורים והרשמה:{" "}
              <a href="mailto:maitreyasanghaisrael@gmail.com" className="underline decoration-1 underline-offset-4 transition-colors hover:text-[#C9A961]">
                maitreyasanghaisrael@gmail.com
              </a>
            </p>
            <p className="text-lg mt-2" style={{ color: WARM_GRAY }}>
              טלפון:{" "}
              <a href="tel:054-4905031" className="underline decoration-1 underline-offset-4 transition-colors hover:text-[#C9A961]">
                054-4905031
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── Other Events ── */}
      <OtherEvents
        heading="אירועים קרובים"
        events={[
          {
            image: "/og-healing-kundalini-retreat.jpg",
            imageAlt: "תרגולי מדיטציה וקונדליני לריפוי",
            title: "תרגולי מדיטציה וקונדליני לריפוי",
            dateLabel: "2-4 בדצמבר 2026, אנטאקראנה, תל אביב",
            endDate: "2026-12-04",
            description: "ריטריט עירוני של שלושה ימי לימוד ותרגול של שיטות הריפוי של הבודהיזם הטנטרי, בליווי חניכה לפאלדן להמו",
            ctaLabel: "לפרטים נוספים",
            href: "/events/healing-kundalini-retreat",
          },
        ]}
      />

      {/* ── Mailing List Signup ── */}
      <MailingListSignup />

      {/* ── Footer ── */}
      <footer className="py-8 text-center text-sm border-t border-stone-200" style={{ color: WARM_GRAY }}>
        <p>© {new Date().getFullYear()} מאיטרייה סנגהה ישראל. כל הזכויות שמורות.</p>
      </footer>

      {/* ── Registration Modal ── */}
      <RegistrationModal open={modalOpen} onOpenChange={setModalOpen} preselectedRoom={preselectedRoom} testMode={testMode} />

      {/* ── Payment Status Modal ── */}
      {paymentStatus && <PaymentStatusModal status={paymentStatus} onClose={closePaymentStatus} />}
    </div>
  );
};

export default SixYogasNigumaRetreat;
