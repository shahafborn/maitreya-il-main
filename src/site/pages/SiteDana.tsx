/**
 * Dana (donation) page. Added 2026-08-14 on Shahaf's explicit yes (migration
 * plan open item 6, recommended by the design-reference research: dana framed
 * as mission and taught, never transactional).
 * Content source: content/<lang>/pages/dana.md (frontmatter: seo + email +
 * cta_label + cardcom_url/cardcom_label). Giving goes through Cardcom
 * (Shahaf's decision 2026-08-14): when cardcom_url holds the Easy App payment
 * page link, the primary gold button opens it; until then only the email
 * contact shows. Pasting the link is a one-field edit in the admin back office.
 */
import { Heart, Mail } from "lucide-react";
import { getPage, sitePath, type SiteLang } from "../content";
import { SiteLayout } from "../SiteLayout";
import { Markdown } from "../Markdown";

export const SiteDana = ({ lang }: { lang: SiteLang }) => {
  const { meta, body } = getPage(lang, "dana");
  const he = lang === "he";
  const email = meta.email ?? "maitreyasanghaisrael@gmail.com";
  const cardcomUrl = meta.cardcom_url ?? "";
  return (
    <SiteLayout lang={lang} title={meta.title ?? ""} description={meta.description} path={sitePath(lang, "/dana")}>
      <div className="container max-w-3xl py-16">
        <h1 className="font-heading text-4xl font-bold text-primary mb-8">
          {he ? "דאנה" : "Dana"}
        </h1>
        <Markdown>{body}</Markdown>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          {cardcomUrl && (
            <a
              href={cardcomUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 bg-accent text-accent-foreground font-body font-semibold rounded-full px-8 py-3 hover:bg-secondary transition-colors"
            >
              <Heart className="h-5 w-5" />
              {meta.cardcom_label || (he ? "לתרומה בכרטיס אשראי" : "Give by credit card")}
            </a>
          )}
          <a
            href={`mailto:${email}`}
            className={
              cardcomUrl
                ? "inline-flex items-center gap-2 border border-border text-primary font-body rounded-full px-6 py-3 hover:border-accent hover:text-accent transition-colors"
                : "inline-flex items-center gap-3 bg-accent text-accent-foreground font-body font-semibold rounded-full px-8 py-3 hover:bg-secondary transition-colors"
            }
          >
            <Mail className="h-5 w-5" />
            {meta.cta_label ?? email}
          </a>
        </div>
      </div>
    </SiteLayout>
  );
};

export default SiteDana;
