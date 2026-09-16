import { useEffect } from "react";

const ATTR = "data-event-jsonld";
const ORGANIZER_NAME = "מאיטרייה סנגהה ישראל";
const ORGANIZER_URL = "https://maitreya.org.il";

/** One price tier as the page presents it. */
export type EventOffer = {
  /** The tier's name on the page, e.g. "לינה בחדר ל-4 (מחיר מוקדם)". */
  name?: string;
  /** Amount in ILS. */
  price: number;
  /** ISO date the tier opened for registration - the day the page went live. */
  validFrom?: string;
  /** ISO date the price stops being valid, e.g. "2026-10-05" for an early bird. */
  validThrough?: string;
};

export type EventPlace =
  | {
      kind: "venue";
      /** The venue's name, e.g. "בית ספר שדה עין גדי". */
      name: string;
      /** Street and number, when the page states one. */
      street?: string;
      locality: string;
      region?: string;
    }
  | { kind: "online"; url: string };

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
export function useEventJsonLd(event: EventJsonLdConfig) {
  // Serialised so the effect re-runs on a real change, not on every render.
  const key = JSON.stringify(event);

  useEffect(() => {
    const cfg = JSON.parse(key) as EventJsonLdConfig;

    const location =
      cfg.place.kind === "online"
        ? { "@type": "VirtualLocation", url: cfg.place.url }
        : {
            "@type": "Place",
            name: cfg.place.name,
            address: {
              "@type": "PostalAddress",
              ...(cfg.place.street ? { streetAddress: cfg.place.street } : {}),
              addressLocality: cfg.place.locality,
              ...(cfg.place.region ? { addressRegion: cfg.place.region } : {}),
              addressCountry: "IL",
            },
          };

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
      eventAttendanceMode:
        cfg.place.kind === "online"
          ? "https://schema.org/OnlineEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
      location,
      organizer: { "@type": "Organization", name: ORGANIZER_NAME, url: ORGANIZER_URL },
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
              priceCurrency: "ILS",
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
