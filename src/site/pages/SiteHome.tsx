/**
 * Homepage (Hebrew + English via the lang prop).
 * Content source: content/<lang>/pages/home.md frontmatter (see content/README.md).
 * Section arc follows the design-reference research (vault:
 * W-work/ventures/maitreya-sangha/projects/website-migration/research/):
 * hero + one-line invitation -> upcoming events -> weekly practice ->
 * teachers with faces -> articles -> community -> newsletter.
 * Interim design language borrowed from the retreat pages until the Phase 0
 * redesign concept is approved; hero photo is a placeholder from assets.
 */
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { MailingListSignup } from "@/components/retreat/MailingListSignup";
import { getPage, getEvents, getArticles, formatEventDates, type SiteLang, type EventItem } from "../content";
import { SiteLayout } from "../SiteLayout";
import heroImage from "@/assets/site/hero-lama-glenn.jpg";
import lamaGlenn from "@/assets/retreat/lama-glenn-big.jpg";
import druponChongwol from "@/assets/retreat/drupon-chongwol.png";
// Public asset - resolved against the app base (/p/ today, / after cutover)
const community = `${import.meta.env.BASE_URL}media/site/community-1.jpg`;

const EventCard = ({ ev, lang }: { ev: EventItem; lang: SiteLang }) => {
  const card = (
    <div className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow p-6 h-full flex flex-col">
      <h3 className="font-heading text-xl font-bold text-primary mb-2">{ev.title}</h3>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <CalendarDays className="h-4 w-4 text-accent shrink-0" />
        {formatEventDates(ev, lang)}
      </div>
      {ev.location && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 text-accent shrink-0" />
          {ev.location}
        </div>
      )}
      {ev.summary && <p className="text-sm leading-relaxed flex-1">{ev.summary}</p>}
      {ev.teacher && <p className="text-sm text-muted-foreground mt-3">{ev.teacher}</p>}
    </div>
  );
  return ev.url ? (
    <Link to={ev.url} className="block h-full">
      {card}
    </Link>
  ) : (
    card
  );
};

export const SiteHome = ({ lang }: { lang: SiteLang }) => {
  const { meta } = getPage(lang, "home");
  const { upcoming } = getEvents(lang);
  const articles = getArticles(lang).slice(0, 3);
  const he = lang === "he";
  const Arrow = he ? ArrowLeft : ArrowRight;

  return (
    <SiteLayout lang={lang} title={meta.title ?? ""} description={meta.description} path={he ? "/he" : "/en"}>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-deep-blue/60" />
        <div className="relative container text-center py-24">
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-primary-foreground mb-6 animate-fade-in-up">
            {meta.hero_title}
          </h1>
          <p className="font-body text-lg md:text-2xl text-primary-foreground/90 max-w-3xl mx-auto mb-10">
            {meta.hero_subtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={meta.hero_cta_href || (he ? "/he/events" : "/en/events")}
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-body font-semibold rounded-full px-8 py-3 hover:bg-secondary transition-colors"
            >
              {meta.hero_cta_label}
              <Arrow className="h-4 w-4" />
            </Link>
            <Link
              to={meta.hero_cta2_href || "/practices"}
              className="inline-flex items-center gap-2 border border-primary-foreground/60 text-primary-foreground font-body font-semibold rounded-full px-8 py-3 hover:bg-primary-foreground/10 transition-colors"
            >
              {meta.hero_cta2_label}
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="py-16">
        <div className="container">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary text-center mb-10">
            {meta.events_title}
          </h2>
          {upcoming.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {upcoming.map((ev) => (
                <EventCard key={ev.slug} ev={ev} lang={lang} />
              ))}
            </div>
          ) : (
            <p className="font-body text-lg text-muted-foreground text-center max-w-2xl mx-auto">
              {meta.events_empty}
            </p>
          )}
          <div className="text-center mt-8">
            <Link
              to={he ? "/he/events" : "/en/events"}
              className="font-body text-accent hover:text-secondary transition-colors inline-flex items-center gap-1"
            >
              {meta.events_archive_label}
              <Arrow className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Weekly practice */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold text-primary mb-4">{meta.practices_title}</h2>
          <p className="font-body text-lg leading-relaxed mb-6">{meta.practices_text}</p>
          <Link
            to="/practices"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-body font-semibold rounded-full px-8 py-3 hover:bg-deep-blue-light transition-colors"
          >
            {meta.practices_cta_label}
            <Arrow className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Teachers */}
      <section className="py-16">
        <div className="container">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary text-center mb-12">
            {meta.teachers_title}
          </h2>
          <div className="grid gap-10 md:grid-cols-2 max-w-4xl mx-auto">
            {[
              {
                img: lamaGlenn,
                name: he ? "לאמה גלן מולין" : "Lama Glenn Mullin",
                line: he
                  ? "מורה ותיק ואהוב של טנטרה בודהיסטית, תלמידם הישיר של הדלאי לאמה ה-14 ומוריו, ומתרגם של למעלה משלושים ספרים."
                  : "A veteran and beloved teacher of Buddhist tantra, direct student of the 14th Dalai Lama and his gurus, and translator of over thirty books.",
              },
              {
                img: druponChongwol,
                name: he ? "דרופון צ׳ונגוואל-לה" : "Drupon Chongwol-la",
                line: he
                  ? "מדריך הריטריטים של לאמה גלן ומורה מיומן לווג׳ריאנה וטומו, המלווה את הסנגהה הישראלית לאורך השנה."
                  : "Lama Glenn's retreat master and a skilled teacher of Vajrayana and Tummo, accompanying the Israeli sangha throughout the year.",
              },
            ].map((t) => (
              <div key={t.name} className="text-center">
                <img
                  src={t.img}
                  alt={t.name}
                  className="w-48 h-48 object-cover rounded-full mx-auto mb-5 shadow-md"
                />
                <h3 className="font-heading text-2xl font-bold text-primary mb-2">{t.name}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  {t.line}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to={he ? "/he/about" : "/en/about"}
              className="font-body text-accent hover:text-secondary transition-colors inline-flex items-center gap-1"
            >
              {meta.community_cta_label}
              <Arrow className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Articles */}
      {articles.length > 0 && (
        <section className="py-16 bg-muted/50">
          <div className="container">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary text-center mb-10">
              {meta.articles_title}
            </h2>
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {articles.map((a) => (
                <Link
                  key={a.slug}
                  to={`/${lang}/articles/${a.slug}`}
                  className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col"
                >
                  <h3 className="font-heading text-lg font-bold text-primary mb-3 leading-snug">{a.title}</h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-4 flex-1">
                    {a.description}
                  </p>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                to={he ? "/he/articles" : "/en/articles"}
                className="font-body text-accent hover:text-secondary transition-colors inline-flex items-center gap-1"
              >
                {meta.articles_cta_label}
                <Arrow className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Community */}
      <section className="py-16">
        <div className="container grid gap-10 md:grid-cols-2 items-center max-w-5xl">
          <div>
            <h2 className="font-heading text-3xl font-bold text-primary mb-4">{meta.community_title}</h2>
            <p className="font-body text-lg leading-relaxed">{meta.community_text}</p>
          </div>
          <img src={community} alt="" className="rounded-lg shadow-md w-full object-cover aspect-[4/3]" />
        </div>
      </section>

      {/* Newsletter */}
      <div id="newsletter">
        <MailingListSignup
          heading={meta.newsletter_heading ?? ""}
          subheading={meta.newsletter_subheading ?? ""}
          placeholder={meta.newsletter_placeholder ?? ""}
          ctaLabel={meta.newsletter_cta ?? ""}
          successMessage={meta.newsletter_success ?? ""}
          errorMessage={meta.newsletter_error ?? ""}
          language={lang}
          tag={he ? "Hebrew" : "English"}
        />
      </div>
    </SiteLayout>
  );
};

export default SiteHome;
