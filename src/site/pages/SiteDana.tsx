/**
 * Dana (donation) page. Added 2026-08-14 on Shahaf's explicit yes (migration
 * plan open item 6, recommended by the design-reference research: dana framed
 * as mission and taught, never transactional).
 * Content source: content/<lang>/pages/dana.md (frontmatter: seo + email + cta_label).
 * v1 gives via email contact - a payment rail (Cardcom link / bank details)
 * can be wired later once Shahaf supplies it.
 */
import { Heart } from "lucide-react";
import { getPage, type SiteLang } from "../content";
import { SiteLayout } from "../SiteLayout";
import { Markdown } from "../Markdown";

export const SiteDana = ({ lang }: { lang: SiteLang }) => {
  const { meta, body } = getPage(lang, "dana");
  const he = lang === "he";
  const email = meta.email ?? "maitreyasanghaisrael@gmail.com";
  return (
    <SiteLayout lang={lang} title={meta.title ?? ""} description={meta.description} path={`/${lang}/dana`}>
      <div className="container max-w-3xl py-16">
        <h1 className="font-heading text-4xl font-bold text-primary mb-8">
          {he ? "דאנה" : "Dana"}
        </h1>
        <Markdown>{body}</Markdown>
        <a
          href={`mailto:${email}`}
          className="mt-10 inline-flex items-center gap-3 bg-accent text-accent-foreground font-body font-semibold rounded-full px-8 py-3 hover:bg-secondary transition-colors"
        >
          <Heart className="h-5 w-5" />
          {meta.cta_label ?? email}
        </a>
      </div>
    </SiteLayout>
  );
};

export default SiteDana;
