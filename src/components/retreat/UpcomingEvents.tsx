/**
 * The "what is coming up" card section on a retreat page.
 *
 * Where the cards come from: content/<lang>/events/*.md - the same files that
 * build the events list and the home page. Any entry whose end date is still
 * ahead shows up here, minus the page you are standing on. Publish an event and
 * it appears on every retreat page in that language; a retreat ends and it
 * drops off all of them the next morning.
 *
 * This replaces a hand-written array of cards on each page, which is how the
 * two May-June pages ended up promoting each other's finished retreat: both
 * blocks rendered nothing at all, and the English pages had no working
 * cross-promotion for months without it being visible anywhere.
 *
 * On a page whose own event has finished, pass `ended` - the section then
 * carries the "this retreat is over" line and sits directly under the hero,
 * where the registration buttons used to be.
 */
import { OtherEvents, type OtherEvent } from "./OtherEvents";
import { SectionFrame, SectionTitle } from "./SectionFrame";
import { RETREAT_THEME } from "./theme";
import { Link } from "react-router-dom";
import { getEvents, formatEventDates, type SiteLang } from "@/site/content";
import { visitBlurb } from "@/site/VisitPromo";

const COPY = {
  he: {
    fallbackHeading: "האירועים הקרובים",
    cta: "לפרטים נוספים",
    allEvents: "לכל האירועים",
    eventsHref: "/events",
  },
  en: {
    fallbackHeading: "Upcoming Events",
    cta: "Details",
    allEvents: "All events",
    eventsHref: "/en/events",
  },
} as const;

export interface UpcomingEventsProps {
  lang: SiteLang;
  /** This page's own path, so it does not promote itself. */
  currentUrl: string;
  /**
   * Set on a page whose event has finished: the line that says so, shown above
   * the cards. Leave it out on a page that is still selling.
   */
  ended?: { eyebrow: string; line: string };
  tone?: "cream" | "stone";
}

export const UpcomingEvents = ({ lang, currentUrl, ended, tone }: UpcomingEventsProps) => {
  const copy = COPY[lang];

  // A card needs somewhere to go and something to show; an entry missing either
  // is an archive row, not a promotable event.
  const events: OtherEvent[] = getEvents(lang)
    .upcoming.filter((ev) => ev.url && ev.image && ev.url !== currentUrl)
    .map((ev) => ({
      image: ev.image,
      imageAlt: ev.title,
      title: ev.title,
      dateLabel: [formatEventDates(ev, lang), ev.location].filter(Boolean).join(" · "),
      endDate: ev.end,
      description: ev.summary,
      ctaLabel: copy.cta,
      href: ev.url,
    }));

  // Between one visit and the next there is nothing to show. A finished page
  // still has to say it is finished, so it keeps the line and points at the
  // events page; a page that is still selling simply shows nothing.
  if (events.length === 0) {
    if (!ended) return null;
    return (
      <SectionFrame tone={tone ?? "cream"} size="md">
        <p
          className="text-center text-sm font-bold tracking-[0.2em] mb-3"
          style={{ color: RETREAT_THEME.GOLD_DARK }}
        >
          {ended.eyebrow}
        </p>
        <SectionTitle className="text-center mb-6">{ended.line}</SectionTitle>
        <p className="text-center">
          <Link
            to={copy.eventsHref}
            className="text-lg font-semibold underline underline-offset-4 transition-colors hover:opacity-80"
            style={{ color: RETREAT_THEME.GOLD_DARK }}
          >
            {copy.allEvents}
          </Link>
        </p>
      </SectionFrame>
    );
  }

  // The closing line and the current visit's sentence read as one paragraph:
  // "this retreat is over" followed by "and here is who is coming in December".
  const intro = [ended?.line, visitBlurb(lang)].filter(Boolean).join(" ");

  return (
    <OtherEvents
      heading={copy.fallbackHeading}
      events={events}
      eyebrow={ended?.eyebrow}
      intro={intro || undefined}
      tone={tone ?? (ended ? "cream" : "stone")}
      footerLink={{ label: copy.allEvents, href: copy.eventsHref }}
    />
  );
};

export default UpcomingEvents;
