/**
 * QR forward links for the December 2026 retreat signs (Shahaf, 2026-11-27)
 * ========================================================================
 *
 * A printed QR points here instead of at the target itself, so the sign keeps working
 * if the target changes (a WhatsApp invite link reset, a page moved): change it HERE.
 *   /qr/register-ein-gedi    -> the Hebrew Ein Gedi retreat page (registration)
 *   /qr/whatsapp-antakarana  -> the Tel Aviv retreat WhatsApp group (opening email link)
 * The page forwards on load and shows a plain link as a fallback. noindex.
 * Retire after 12.12.2026 (routes here, App.tsx, site-routes.mjs).
 */
import { useEffect } from "react";
import { SiteLayout } from "@/site/SiteLayout";
import logo from "@/assets/maitreya-logo.png";

export const QR_FORWARDS: Record<string, { to: string; label: string }> = {
  "register-ein-gedi": { to: "/events/six-yogas-niguma-retreat", label: "להרשמה לריטריט שש היוגות של ניגומה" },
  "whatsapp-antakarana": {
    to: "https://chat.whatsapp.com/DT5qeSUsB2GDY8T9tw0pB4",
    label: "להצטרפות לקבוצת הוואטסאפ של הריטריט",
  },
};

const QrForward = ({ slug }: { slug: string }) => {
  const f = QR_FORWARDS[slug];
  useEffect(() => {
    // The pre-render (Playwright) must keep this page, not follow the forward.
    if (navigator.webdriver) return;
    window.location.replace(f.to);
  }, [f.to]);
  return (
    <SiteLayout lang="he" title="מאיטרייה סנגהה ישראל" description={f.label} path={`/qr/${slug}`} noindex bare>
      <article className="container max-w-lg py-16 text-center">
        <img src={logo} alt="מאיטרייה סנגהה ישראל" className="mx-auto mb-8 h-8 w-auto" />
        <p className="font-body text-lg mb-4">מעבירים אותך...</p>
        <a href={f.to} className="font-body text-lg underline" data-testid="forward-link">
          {f.label}
        </a>
      </article>
    </SiteLayout>
  );
};

export default QrForward;
