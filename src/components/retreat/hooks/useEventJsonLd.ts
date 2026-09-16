import { useEffect } from "react";

const ATTR = "data-event-jsonld";
const ORGANIZER_NAME_HE = "מאיטרייה סנגהה ישראל";
const ORGANIZER_NAME_EN = "Maitreya Sangha Israel";
const ORGANIZER_URL = "https://maitreya.org.il";

/** One price tier as the page presents it. */
export type EventOffer = {
  /** The tier's name on the page, e.g. "לינה בחדר ל-4 (מחיר מוקדם)". */
  name?: string;
  /** Amount, in the event's `currency` (ILS unless stated). */
  price: number;
  /** ISO date the tier opened for registration - the day the page went live. */
  validFrom?: string;
  /** ISO date the price stops being valid, e.g. "2026-10-05" for an early bird. */
  validThrough?: string;
};

export type EventVenue = {
  /** The venue's name, e.g. "בית ספר שדה עין גדי". */
  name: string;
  /** Street and number, when the page states one. */
  street?: string;
  locality: string;
  region?: string;
};

export type EventPlace =
  | ({ kind: "venue" } & EventVenue)
  | { kind: "online"; url: string }
  /** Both at once - the page sells a seat in the room and a Zoom seat. */
  | ({ kind: "mixed"; url: string } & EventVenue);

export type EventJsonLdConfig = {
  /** The retreat's own name - the page's H1, not the SEO title. */
  name: string;
  description: string;
  url: string;
  /** Absolute image URL; the og:image is the right one. */
  image: string;
  /**
   * ISO 8601 with Israel's offset, e.g. "2026-12-02T09:30:00+02:00".
   * A date alone ("2026-12-06") is valid too - use it rather than invent a time.
   */
  startDate: string;
  endDate: string;
  place: EventPlace;
  /** Teacher names, in the order the page presents them. */
  performers?: string[];
  offers?: EventOffer[];
  /** ISO 4217. Defaults to ILS; the English pages sell in USD. */
  currency?: "ILS" | "USD";
  /** BCP-47, defaults to "he". */
  inLanguage?: string;
};

/**
 * Emits a schema.org Event block into <head> for a retreat/course page.
 *
 * This is the machine-readable twin of what the page already says in prose:
 * what it is, when, where, who teaches and what it costs. Google reads it for
 * event rich results (dates and venue shown inside the search listing), and AI
 * crawlers read it instead of guessing those facts out of Hebrew body copy.
 *
 * Type is plain `Event` on purpose - `EducationEvent` is more precise but has
 * thinner rich-result support.
 *
 * Runs in useEffect, and `scripts/prerender.mjs` already copies
 * `script[type="application/ld+json"]` out of the head into the static HTML, so
 * crawlers get this without running any JavaScript. Pair it with
 * `useRetreatSEO`, which handles the title, meta and canonical tags.
 *
 * MANDATORY for every page with a date on it - see "Adding a new retreat page"
 * in `src/components/retreat/README.md`.
 *
 * @example
 * useEventJsonLd({
 *   name: "ששת היוגות של ניגומה",
 *   description: seo.description,
 *   url: seo.url,
 *   image: seo.ogImage,
 *   startDate: "2026-12-06T12:00:00+02:00",
 *   endDate: "2026-12-12T15:00:00+02:00",
 *   place: { kind: "venue", name: "בית ספר שדה עין גדי", locality: "עין גדי", region: "ים המלח" },
 *   performers: ["לאמה גלן מולין", "דרופון צ׳ונגוואל-לה"],
 *   offers: [{ name: "לינה בחדר ל-4 (מחיר מוקדם)", price: 3700, validThrough: "2026-10-05" }],
 * });
 */
export function useEventJsonLd(event: EventJsonLdConfig | undefined) {
  // Serialised so the effect re-runs on a real change, not on every render.
  // `undefined` is allowed so RetreatLayout can call the hook unconditionally
  // for pages that have no date (rules of hooks).
  const key = event ? JSON.stringify(event) : "";

  useEffect(() => {
    if (!key) return;
    const cfg = JSON.parse(key) as EventJsonLdConfig;

    const virtual = (url: string) => ({ "@type": "VirtualLocation", url });
    const physical = (place: EventVenue) => ({
      "@type": "Place",
      name: place.name,
      address: {
        "@type": "PostalAddress",
        ...(place.street ? { streetAddress: place.street } : {}),
        addressLocality: place.locality,
        ...(place.region ? { addressRegion: place.region } : {}),
        addressCountry: "IL",
      },
    });

    const location =
      cfg.place.kind === "online"
        ? virtual(cfg.place.url)
        : cfg.place.kind === "mixed"
          ? [physical(cfg.place), virtual(cfg.place.url)]
          : physical(cfg.place);

    const attendanceMode = {
      online: "https://schema.org/OnlineEventAttendanceMode",
      mixed: "https://schema.org/MixedEventAttendanceMode",
      venue: "https://schema.org/OfflineEventAttendanceMode",
    }[cfg.place.kind];

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: cfg.name,
      description: cfg.description,
      url: cfg.url,
      image: [cfg.image],
      startDate: cfg.startDate,
      endDate: cfg.endDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: attendanceMode,
      location,
      organizer: {
        "@type": "Organization",
        name: (cfg.inLanguage ?? "he").startsWith("en") ? ORGANIZER_NAME_EN : ORGANIZER_NAME_HE,
        url: ORGANIZER_URL,
      },
      inLanguage: cfg.inLanguage ?? "he",
      ...(cfg.performers?.length
        ? { performer: cfg.performers.map((name) => ({ "@type": "Person", name })) }
        : {}),
      ...(cfg.offers?.length
        ? {
            offers: cfg.offers.map((offer) => ({
              "@type": "Offer",
              ...(offer.name ? { name: offer.name } : {}),
              price: offer.price,
              priceCurrency: cfg.currency ?? "ILS",
              availability: "https://schema.org/InStock",
              url: cfg.url,
              ...(offer.validFrom ? { validFrom: offer.validFrom } : {}),
              ...(offer.validThrough ? { validThrough: offer.validThrough } : {}),
            })),
          }
        : {}),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(ATTR, "");
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => script.remove();
  }, [key]);
}
