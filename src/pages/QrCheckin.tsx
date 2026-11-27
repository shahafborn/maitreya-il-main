/**
 * QR check-in at the December 2026 retreats (Shahaf, 2026-11-27)
 * ==============================================================
 *
 * A printed sign "רישום הגעה" (maroon top) at each retreat carries a QR to this page.
 * Everyone who arrives fills in name, phone, email and ticks the retreat terms (the same
 * terms link as the retreat's registration form) - also people who did not register
 * before. One screen, Hebrew, no site header/footer, noindex, linked from nowhere.
 *
 * Submission: POST JSON -> n8n `Visit_Checkin` -> row on the 'רישום הגעה' tab of the
 * retreat's Hebrew registration sheet. The sheet cross-checks the row against the
 * registrations by itself (formulas), and lists who paid and has not arrived yet.
 * The page never looks anything up, so it reveals nothing about who registered.
 *
 * Spec (vault): W-work/ventures/maitreya-sangha/projects/teachers-visit-nov-dec-2026/qr-signs/more-signs-spec.md
 * Retire after 12.12.2026 (routes here, App.tsx, site-routes.mjs; deactivate the flow).
 */
import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { SiteLayout } from "@/site/SiteLayout";
import logo from "@/assets/maitreya-logo.png";

const WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/Visit_Checkin";

export interface CheckinRetreat {
  slug: string;
  code: "HKR" | "EGN";
  name: string;
  place: string;
  termsUrl: string;
}

export const CHECKIN_RETREATS: CheckinRetreat[] = [
  {
    slug: "checkin-antakarana",
    code: "HKR",
    name: "תרגולי מדיטציה וקונדליני לריפוי",
    place: "אנטאקראנה, תל אביב · ⁦2-4.12⁩",
    termsUrl: "/events/online-terms",
  },
  {
    slug: "checkin-ein-gedi",
    code: "EGN",
    name: "שש היוגות של ניגומה",
    place: "בית ספר שדה עין גדי · ⁦6-12.12⁩",
    termsUrl: "/events/six-yogas-niguma-retreat/terms",
  },
];

export const checkinPath = (slug: string) => `/qr/${slug}`;

const MAROON = "#6b1d2a";
const field =
  "w-full rounded-lg border border-border bg-white px-4 py-3 font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

type Status = "idle" | "loading" | "success" | "error";

const CheckinForm = ({ retreat }: { retreat: CheckinRetreat }) => {
  const [status, setStatus] = useState<Status>("idle");
  const [terms, setTerms] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    if (data.website) return; // honeypot
    setStatus("loading");
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retreat: retreat.code,
          full_name: data.full_name,
          phone: data.phone,
          email: data.email,
          terms,
          lang: "he",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || String(res.status));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: "#FBF3E2" }} data-testid="checkin-done">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12" style={{ color: "#2f7d32" }} aria-hidden />
        <h2 className="font-heading text-3xl mb-2">תודה, נרשמת.</h2>
        <p className="font-body text-lg">שמחים שהגעת!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-6 md:p-8" style={{ background: "#FBF3E2" }}>
      <div className="grid gap-4">
        <label className="block">
          <span className="mb-1 block font-body text-sm">שם מלא</span>
          <input name="full_name" required className={field} autoComplete="name" />
        </label>
        <label className="block">
          <span className="mb-1 block font-body text-sm">טלפון</span>
          <input name="phone" required className={field} inputMode="tel" autoComplete="tel" placeholder="050-1234567" dir="ltr" style={{ textAlign: "right" }} />
        </label>
        <label className="block">
          <span className="mb-1 block font-body text-sm">אימייל</span>
          <input name="email" type="email" required className={field} autoComplete="email" dir="ltr" style={{ textAlign: "right" }} />
        </label>
        <label className="flex items-start gap-3 font-body text-sm leading-relaxed">
          <input
            type="checkbox"
            name="terms"
            required
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0"
            style={{ accentColor: MAROON }}
          />
          <span>
            אני מאשר/ת את{" "}
            <a href={retreat.termsUrl} target="_blank" rel="noopener noreferrer" className="underline">
              תנאי הריטריט וההרשמה
            </a>{" "}
            ומסכים/ה לקבל עדכונים ממאיטרייה סנגהה ישראל.
          </span>
        </label>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {status === "error" && (
        <p className="mt-4 flex items-center gap-2 font-body text-sm" style={{ color: "#b51a00" }}>
          <XCircle className="h-4 w-4 shrink-0" aria-hidden />
          משהו השתבש. אפשר לנסות שוב, או לגשת לצוות בשולחן הקבלה.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-7 py-4 font-body text-lg font-bold text-white disabled:opacity-70"
        style={{ background: "#ff385c" }}
      >
        {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
        {status === "loading" ? "שולחים..." : "נרשמתי"}
      </button>
    </form>
  );
};

const QrCheckin = ({ slug }: { slug: string }) => {
  const retreat = CHECKIN_RETREATS.find((r) => r.slug === slug) as CheckinRetreat;
  return (
    <SiteLayout
      lang="he"
      title={`רישום הגעה: ${retreat.name} | מאיטרייה סנגהה ישראל`}
      description={`רישום הגעה לריטריט ${retreat.name}`}
      path={checkinPath(slug)}
      noindex
      bare
    >
      <article className="container max-w-lg pt-5 pb-10 md:py-10">
        <img src={logo} alt="מאיטרייה סנגהה ישראל" className="mx-auto mb-6 h-8 w-auto" />
        <header className="mb-6 rounded-2xl px-6 py-7 text-center text-white" style={{ background: MAROON }}>
          <h1 className="font-heading text-4xl font-bold mb-2">רישום הגעה</h1>
          <p className="font-heading text-2xl" style={{ color: "#e9c779" }}>{retreat.name}</p>
          <p className="mt-2 font-body text-sm opacity-90">{retreat.place}</p>
        </header>
        <CheckinForm retreat={retreat} />
      </article>
    </SiteLayout>
  );
};

export default QrCheckin;
