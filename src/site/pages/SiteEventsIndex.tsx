/**
 * Events page: upcoming events (or an honest empty state) + past-events archive.
 * Content source: content/<lang>/events/*.md (see content/README.md for the
 * add-an-event recipe - one file per event, homepage picks it up automatically).
 */
import { Link } from "react-router-dom";
import { CalendarDays, MapPin } from "lucide-react";
import { getEvents, getPage, formatEventDates, type SiteLang, type EventItem } from "../content";
import { SiteLayout } from "../SiteLayout";

const EventRow = ({ ev, lang, dimmed }: { ev: EventItem; lang: SiteLang; dimmed?: boolean }) => {
  const inner = (
    <div
      className={`bg-card rounded-lg border border-border p-6 transition-shadow ${
        dimmed ? "opacity-80" : "shadow-sm hover:shadow-md"
      }`}
    >
      <h3 className="font-heading text-xl font-bold text-primary mb-2">{ev.title}</h3>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground mb-3">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-accent" />
          {formatEventDates(ev, lang)}
        </span>
        {ev.location && (
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            {ev.location}
          </span>
        )}
      </div>
      {ev.summary && <p className="font-body text-sm leading-relaxed">{ev.summary}</p>}
      {ev.teacher && <p className="font-body text-sm text-muted-foreground mt-2">{ev.teacher}</p>}
    </div>
  );
  return ev.url ? (
    <Link to={ev.url} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
};

export const SiteEventsIndex = ({ lang }: { lang: SiteLang }) => {
  const { upcoming, past } = getEvents(lang);
  const { meta } = getPage(lang, "home");
  const he = lang === "he";
  return (
    <SiteLayout
      lang={lang}
      title={he ? "אירועים - מאיטרייה סנגהה ישראל" : "Events - Maitreya Sangha Israel"}
      description={
        he
          ? "ריטריטים, חניכות, לימודי אונליין וביקורי מורים של מאיטרייה סנגהה ישראל."
          : "Retreats, empowerments, online teachings and teacher visits of Maitreya Sangha Israel."
      }
      path={`/${lang}/events`}
    >
      <div className="container max-w-4xl py-16">
        <h1 className="font-heading text-4xl font-bold text-primary mb-10">
          {he ? "אירועים" : "Events"}
        </h1>

        <h2 className="font-heading text-2xl font-bold text-primary mb-6">
          {he ? "אירועים קרובים" : "Upcoming"}
        </h2>
        {upcoming.length > 0 ? (
          <div className="space-y-4 mb-12">
            {upcoming.map((ev) => (
              <EventRow key={ev.slug} ev={ev} lang={lang} />
            ))}
          </div>
        ) : (
          <p className="font-body text-lg text-muted-foreground mb-12">{meta.events_empty}</p>
        )}

        {past.length > 0 && (
          <>
            <h2 className="font-heading text-2xl font-bold text-primary mb-6">
              {he ? "אירועים שהיו" : "Past Events"}
            </h2>
            <div className="space-y-4">
              {past.map((ev) => (
                <EventRow key={ev.slug} ev={ev} lang={lang} dimmed />
              ))}
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
};

export default SiteEventsIndex;
