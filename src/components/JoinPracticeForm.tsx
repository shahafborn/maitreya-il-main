/**
 * "Join our weekly practices" form for the PUBLIC practices page (/weekly-practice).
 *
 * The public schedule shows no Zoom links on purpose: people who are not yet
 * part of the sangha leave their details here, the team gets back to them
 * with the joining information, and the person is added to the mailing list
 * (explicit consent checkbox, required).
 *
 * Submission: POST JSON to the n8n webhook `Practice_Join`, which appends the
 * request to the "Practice join requests" Google Sheet and upserts the
 * person in Mailchimp (tag Weekly-Practice-Interest, merge fields for phone,
 * city and experience, the message as a member note). Same architecture as
 * the retreat registration flows (see the retreat-registration-flow skill).
 */
import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";

const WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/Practice_Join";

type Status = "idle" | "loading" | "success" | "error";

const field =
  "w-full rounded-lg border border-border bg-white px-4 py-3 font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

export const JoinPracticeForm = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [consent, setConsent] = useState(false);
  const [consentNudge, setConsentNudge] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!consent) {
      setConsentNudge(true);
      return;
    }
    const form = e.currentTarget;
    const data = new FormData(form);
    // Honeypot: real people never fill a hidden field
    if (String(data.get("website") ?? "").trim()) {
      setStatus("success");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: String(data.get("full_name") ?? "").trim(),
          city: String(data.get("city") ?? "").trim(),
          phone: String(data.get("phone") ?? "").trim(),
          email: String(data.get("email") ?? "").trim(),
          experience: String(data.get("experience") ?? "").trim(),
          message: String(data.get("message") ?? "").trim(),
          consent: true,
          source: "weekly-practice-page",
          page: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
      form.reset();
      setConsent(false);
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="join" className="mt-10 scroll-mt-24 rounded-2xl p-6 md:p-10" style={{ background: "#FBF3E2" }}>
      <h2 className="font-heading text-3xl font-semibold text-primary mb-2">רוצים להצטרף לתרגולים?</h2>
      <p className="font-body text-lg leading-relaxed mb-6" style={{ color: "#6B635A" }}>
        השאירו פרטים ונחזור אליכם עם כל המידע להצטרפות למפגשים. התרגולים פתוחים, בזום, ומתאימים גם למי
        שרק מתחיל.
      </p>

      {status === "success" ? (
        <div className="flex items-start gap-3 rounded-xl bg-white px-5 py-4 text-green-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="font-body text-lg">תודה! קיבלנו את הפרטים ונחזור אליכם בהקדם.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2" noValidate={false}>
          <label className="block">
            <span className="mb-1 block font-body text-sm font-semibold">שם מלא</span>
            <input name="full_name" required autoComplete="name" className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-sm font-semibold">עיר</span>
            <input name="city" required autoComplete="address-level2" className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-sm font-semibold">טלפון</span>
            <input name="phone" type="tel" required autoComplete="tel" dir="ltr" className={`${field} text-left`} />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-sm font-semibold">אימייל</span>
            <input name="email" type="email" required autoComplete="email" dir="ltr" className={`${field} text-left`} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block font-body text-sm font-semibold">ניסיון בלימוד ותרגול בודהיסטי</span>
            <select name="experience" required className={field} defaultValue="">
              <option value="" disabled>
                בחרו...
              </option>
              <option value="אין ניסיון">אין ניסיון - רק מתחיל/ה</option>
              <option value="קצת ניסיון">קצת ניסיון (מדיטציה, קורסים, ספרים)</option>
              <option value="מתרגל/ת">מתרגל/ת - יש לי תרגול קבוע</option>
              <option value="מתרגל/ת ותיק/ה">מתרגל/ת ותיק/ה בבודהיזם הטיבטי</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block font-body text-sm font-semibold">הודעה (לא חובה)</span>
            <textarea
              name="message"
              rows={4}
              className={field}
              placeholder="ספרו לנו קצת על עצמכם, או שאלו כל מה שתרצו"
            />
          </label>
          {/* Honeypot - hidden from people, filled only by bots */}
          <div className="hidden" aria-hidden="true">
            <input name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <label
            className={`md:col-span-2 flex items-start gap-3 rounded-lg p-3 -mx-3 cursor-pointer ${
              consentNudge && !consent ? "ring-1 ring-red-400" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                setConsentNudge(false);
              }}
              className="mt-1 h-4 w-4 rounded border-stone-300 accent-[#C9A961]"
            />
            <span className="font-body text-sm leading-relaxed" style={{ color: "#6B635A" }}>
              אני מאשר/ת שתצרו איתי קשר ושאצטרף לרשימת התפוצה של מאיטרייה סנגהה ישראל (עדכונים על תרגולים,
              ריטריטים וביקורי מורים). אפשר להסיר את עצמכם בכל רגע.
            </span>
          </label>
          {consentNudge && !consent && (
            <p className="md:col-span-2 -mt-2 font-body text-sm text-red-700">
              כדי שנוכל לחזור אליכם, יש לאשר את ההצטרפות לרשימת התפוצה.
            </p>
          )}

          <div className="md:col-span-2 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 font-body font-semibold text-accent-foreground transition-colors hover:bg-secondary disabled:opacity-60"
            >
              {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              שלחו לנו
            </button>
            {status === "error" && (
              <p className="inline-flex items-center gap-1 font-body text-sm text-red-700">
                <XCircle className="h-4 w-4" />
                משהו השתבש - נסו שוב בעוד רגע, או כתבו לנו במייל maitreyasanghaisrael@gmail.com
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
};

export default JoinPracticeForm;
