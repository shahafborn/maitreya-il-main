/**
 * Contact page. Content source: content/<lang>/pages/contact.md
 * (frontmatter: title/description/email; body = intro markdown).
 * v1 is email-first (matches the WordPress behavior - submissions went to the
 * sangha Gmail). A real form can be added in a later phase if wanted.
 */
import { Mail } from "lucide-react";
import { getPage, sitePath, type SiteLang } from "../content";
import { SiteLayout } from "../SiteLayout";
import { Markdown } from "../Markdown";

export const SiteContact = ({ lang }: { lang: SiteLang }) => {
  const { meta, body } = getPage(lang, "contact");
  const he = lang === "he";
  const email = meta.email ?? "maitreyasanghaisrael@gmail.com";
  return (
    <SiteLayout lang={lang} title={meta.title ?? ""} description={meta.description} path={sitePath(lang, "/contact")}>
      <div className="container max-w-2xl py-16">
        <h1 className="font-heading text-4xl font-bold text-primary mb-8">
          {he ? "צור קשר" : "Contact"}
        </h1>
        <Markdown>{body}</Markdown>
        <a
          href={`mailto:${email}`}
          className="mt-8 inline-flex items-center gap-3 bg-primary text-primary-foreground font-body font-semibold rounded-full px-8 py-3 hover:bg-deep-blue-light transition-colors"
        >
          <Mail className="h-5 w-5" />
          {email}
        </a>
      </div>
    </SiteLayout>
  );
};

export default SiteContact;
