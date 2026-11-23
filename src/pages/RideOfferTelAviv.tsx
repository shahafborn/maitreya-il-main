/**
 * Ride offers for the Tel Aviv retreat (Antakarana, 2-4.12.2026) - Hebrew / RTL
 * ==========================================================================
 *
 * A hidden page (Shahaf, 2026-11-23): not linked from the site, robots noindex,
 * out of the sitemap. The link is shared only with the retreat participants
 * (WhatsApp group). Anyone driving to the retreat with a free seat adds
 * themselves to the ride list, which is shared in the group.
 *
 * Fields: exactly the four columns of the ride sheet - name, city, phone,
 * email (Shahaf picked option A of the mockups, 2026-11-23).
 *
 * Submission: POST JSON to the n8n webhook `Visit_Ride_Offer`, which appends a
 * row to the sheet "רשימת טרמפים - ריטריט אנטאקראנה, תל אביב (2-4.12.2026)"
 * (Sangha Drive, LG&C Visit - December 2026) and emails the sangha inbox.
 * Same architecture as VisitVolunteerForm.
 *
 * Retire after the retreat (remove the route here, in App.tsx and in
 * scripts/site-routes.mjs, and deactivate the n8n flow).
 */
import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { SiteLayout } from "@/site/SiteLayout";

export const RIDE_OFFER_PATH = "/tremp-tlv-k7q3";
const WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/Visit_Ride_Offer";

type Status = "idle" | "loading" | "success" | "error";

const field =
  "w-full rounded-lg border border-border bg-white px-4 py-3 font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

/** Keeps a number range like 2-4 reading left to right inside Hebrew text. */
const Ltr = ({ children }: { children: string }) => <span dir="ltr">{children}</span>;

const RideOfferForm = () => {
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setStatus("loading");
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, page: window.location.href }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl p-6 md:p-10 text-center" style={{ background: "#FBF3E2" }}>
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10" style={{ color: "#2f7d32" }} aria-hidden />
        <h2 className="font-heading text-2xl mb-2">תודה רבה!</h2>
        <p className="font-body text-base leading-relaxed">
          הפרטים שלך נוספו לרשימת הטרמפים, שתשותף בקבוצת הוואטסאפ של הריטריט.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-6 md:p-10" style={{ background: "#FBF3E2" }}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block font-body text-sm">שם מלא</span>
          <input name="full_name" required className={field} autoComplete="name" />
        </label>
        <label className="block">
          <span className="mb-1 block font-body text-sm">עיר יציאה</span>
          <input name="city" required className={field} autoComplete="address-level2" />
        </label>
        <label className="block">
          <span className="mb-1 block font-body text-sm">טלפון</span>
          <input name="phone" required className={field} inputMode="tel" autoComplete="tel" placeholder="050-1234567" dir="ltr" style={{ textAlign: "right" }} />
        </label>
        <label className="block">
          <span className="mb-1 block font-body text-sm">אימייל</span>
          <input name="email" type="email" required className={field} autoComplete="email" dir="ltr" style={{ textAlign: "right" }} />
        </label>
      </div>

      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

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
        הוסיפו אותי לרשימה
      </button>
      <p className="mt-3 font-body text-sm opacity-70">
        הפרטים יופיעו ברשימת הטרמפים שתשותף עם משתתפי הריטריט בלבד.
      </p>
    </form>
  );
};

const RideOfferTelAviv = () => (
  <SiteLayout
    lang="he"
    title="מציעים טרמפ לריטריט בתל אביב | מאיטרייה סנגהה ישראל"
    description="רשימת הטרמפים לריטריט תרגולי מדיטציה וקונדליני לריפוי עם לאמה גלן, אנטאקראנה תל אביב, 2-4 בדצמבר 2026."
    path={RIDE_OFFER_PATH}
    noindex
  >
    <article className="container max-w-3xl py-16">
      <h1 className="font-heading text-4xl font-bold text-primary mb-3">מציעים טרמפ לריטריט?</h1>
      <p className="font-body text-lg font-medium mb-6">
        תרגולי מדיטציה וקונדליני לריפוי | אנטאקראנה, תל אביב | <Ltr>2-4</Ltr> בדצמבר 2026
      </p>
      <p className="font-body text-lg leading-relaxed mb-8">
        אם אתם מגיעים ברכב ויש לכם מקום פנוי, השאירו פרטים ונוסיף אתכם לרשימת הטרמפים שנשלחת בקבוצת
        הוואטסאפ של הריטריט. מי שמחפש טרמפ יוכל לפנות אליכם ישירות.
      </p>
      <RideOfferForm />
    </article>
  </SiteLayout>
);

export default RideOfferTelAviv;
