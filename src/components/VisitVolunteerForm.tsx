/**
 * "I want to help" form for the December 2026 visit support page
 * (/support-visit-dec-2026).
 *
 * The visit is run entirely by volunteers, so this is the front door for
 * people offering their hands: when they can help (before the visit, during
 * the events, or both) and which areas they can take on.
 *
 * Submission: POST JSON to the n8n webhook `Visit_Volunteer`, which appends
 * the offer to the "Visit volunteers" Google Sheet and emails the sangha
 * inbox with the details, so nothing is lost if the sheet is not watched.
 * Same architecture as JoinPracticeForm - see the retreat-registration-flow
 * skill for the shape of these flows.
 *
 * No Mailchimp here on purpose: offering to help is not a request to be added
 * to a mailing list, and most volunteers are already on it.
 */
import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";

const WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/Visit_Volunteer";

/** The areas help is needed in, as Shahaf set them. */
export const HELP_AREAS = [
  { id: "logistics", label: "לוגיסטיקה והפקה", note: "הקמה וסידור של החלל, ציוד, הגברה, שילוט" },
  { id: "publicity", label: "פרסום והפצה", note: "שיתוף ברשתות, הפצה בקבוצות, עיצוב, צילום" },
  { id: "reception", label: "קבלת אורחים ורישום", note: "קבלת פנים באירועים, רישום בכניסה, מענה למשתתפים" },
  { id: "hosting", label: "אירוח וכיבוד", note: "כיבוד, פינת קפה, קניות" },
] as const;

const WHEN_OPTIONS = [
  { id: "before", label: "לפני הביקור - בהכנות" },
  { id: "during", label: "במהלך האירועים" },
] as const;

type Status = "idle" | "loading" | "success" | "error";

const field =
  "w-full rounded-lg border border-border bg-white px-4 py-3 font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

export const VisitVolunteerForm = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [when, setWhen] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [nudge, setNudge] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // One of each is the minimum that makes an offer usable by the team.
    if (when.length === 0 || areas.length === 0) {
      setNudge(true);
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
      const labelsFor = (ids: string[], src: readonly { id: string; label: string }[]) =>
        ids.map((id) => src.find((o) => o.id === id)?.label ?? id);
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: String(data.get("full_name") ?? "").trim(),
          phone: String(data.get("phone") ?? "").trim(),
          email: String(data.get("email") ?? "").trim(),
          when: when.join(","),
          when_labels: labelsFor(when, WHEN_OPTIONS).join(" | "),
          areas: areas.join(","),
          area_labels: labelsFor(areas, HELP_AREAS).join(" | "),
          message: String(data.get("message") ?? "").trim(),
          source: "support-visit-dec-2026",
          page: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
      form.reset();
      setWhen([]);
      setAreas([]);
      setNudge(false);
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl p-6 md:p-10 text-center" style={{ background: "#FBF3E2" }}>
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10" style={{ color: "#2f7d32" }} aria-hidden />
        <h3 className="font-heading text-2xl mb-2">תודה רבה!</h3>
        <p className="font-body text-base leading-relaxed">
          קיבלנו את הפרטים שלך ונחזור אליך לקראת הביקור עם מה שצריך.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-6 md:p-10" style={{ background: "#FBF3E2" }}>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block font-body text-sm">שם מלא</span>
          <input name="full_name" required className={field} autoComplete="name" />
        </label>
        <label className="block">
          <span className="mb-1 block font-body text-sm">טלפון</span>
          <input name="phone" required className={field} inputMode="tel" autoComplete="tel" placeholder="050-1234567" />
        </label>
        <label className="block">
          <span className="mb-1 block font-body text-sm">אימייל</span>
          <input name="email" type="email" required className={field} autoComplete="email" />
        </label>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-2 font-body text-sm">מתי אוכל לעזור</legend>
        <div className="flex flex-wrap gap-3">
          {WHEN_OPTIONS.map((o) => (
            <label
              key={o.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-4 py-3 font-body text-base"
            >
              <input
                type="checkbox"
                checked={when.includes(o.id)}
                onChange={() => toggle(when, setWhen, o.id)}
                className="h-4 w-4"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-2 font-body text-sm">במה אוכל לעזור</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {HELP_AREAS.map((a) => (
            <label
              key={a.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-white px-4 py-3"
            >
              <input
                type="checkbox"
                checked={areas.includes(a.id)}
                onChange={() => toggle(areas, setAreas, a.id)}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="block font-body text-base">{a.label}</span>
                <span className="block font-body text-sm opacity-70">{a.note}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-6 block">
        <span className="mb-1 block font-body text-sm">משהו שתרצו לספר לנו (לא חובה)</span>
        <textarea name="message" rows={3} className={field} />
      </label>

      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {nudge && (
        <p className="mt-4 font-body text-sm" style={{ color: "#b51a00" }}>
          בחרו מתי תוכלו לעזור ובאיזה תחום, כדי שנדע איך לחזור אליכם.
        </p>
      )}

      {status === "error" && (
        <p className="mt-4 flex items-center gap-2 font-body text-sm" style={{ color: "#b51a00" }}>
          <XCircle className="h-4 w-4" aria-hidden />
          משהו השתבש בשליחה. אפשר לנסות שוב, או לכתוב לנו ל-maitreyasanghaisrael@gmail.com
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-6 inline-flex items-center gap-2 rounded-lg px-7 py-3 font-body text-base text-white disabled:opacity-70"
        style={{ background: "#b51a00" }}
      >
        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        שליחה
      </button>
    </form>
  );
};
