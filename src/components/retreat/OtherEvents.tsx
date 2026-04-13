import { Link } from "react-router-dom";
import { SectionFrame, SectionTitle } from "./SectionFrame";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";

export interface OtherEvent {
  image: string;
  imageAlt: string;
  title: string;
  dateLabel: string;
  endDate: string;
  description: string;
  ctaLabel: string;
  href: string;
}

interface OtherEventsProps {
  heading: string;
  events: OtherEvent[];
}

export const OtherEvents = ({ heading, events }: OtherEventsProps) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const activeEvents = events.filter((e) => {
    const end = new Date(e.endDate + "T23:59:59");
    return end >= now;
  });

  if (activeEvents.length === 0) return null;

  const gridCols =
    activeEvents.length === 1
      ? ""
      : activeEvents.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3";

  return (
    <SectionFrame tone="stone" size="md">
      <SectionTitle className="text-center mb-2">{heading}</SectionTitle>
      <div
        className="w-12 h-1 rounded-full mx-auto mb-10"
        style={{ backgroundColor: RETREAT_THEME.GOLD }}
      />

      <div
        className={`grid gap-8 ${gridCols} ${activeEvents.length === 1 ? "max-w-lg mx-auto" : ""}`}
      >
        {activeEvents.map((event) => (
          <div
            key={event.href}
            className="rounded-xl overflow-hidden shadow-lg border border-stone-200 bg-white"
          >
            {/* Image - 16:9 matching course promo cards */}
            <Link to={event.href}>
              <img
                src={event.image}
                alt={event.imageAlt}
                className="w-full aspect-[16/9] object-cover"
              />
            </Link>

            {/* Content - centered, matching course promo card layout */}
            <div className="px-7 py-6 text-center">
              <Link to={event.href} className="block mb-3">
                <h3
                  className="text-2xl font-bold transition-colors hover:text-[#C9A961]"
                  style={{ fontFamily: RETREAT_FONTS.serif }}
                >
                  {event.title}
                </h3>
              </Link>

              <p
                className="text-lg font-semibold mb-4"
                style={{ color: RETREAT_THEME.GOLD_DARK }}
              >
                {event.dateLabel}
              </p>

              <div
                className="w-8 h-px mx-auto mb-4"
                style={{ backgroundColor: RETREAT_THEME.GOLD }}
              />

              <p
                className="text-base leading-relaxed mb-5"
                style={{ color: RETREAT_THEME.WARM_GRAY }}
              >
                {event.description}
              </p>

              <Link
                to={event.href}
                className="inline-block px-8 py-3 rounded-full font-bold text-white transition-colors shadow-sm hover:opacity-90"
                style={{ backgroundColor: RETREAT_THEME.GOLD }}
              >
                {event.ctaLabel}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
};
