import { useQuery } from "@tanstack/react-query";
import { getSignedUrl } from "@/lib/storage";
import type { Promotion } from "@/hooks/usePromotions";

interface CoursePromoSectionProps {
  promotions: Promotion[];
}

const i18n = {
  he: { heading: "אירועים קרובים", cta: "לפרטים נוספים" },
  en: { heading: "Upcoming Events", cta: "More Details" },
};

function usePromoImageUrls(promotions: Promotion[]) {
  const withImages = promotions.filter((p) => p.image_storage_path);
  return useQuery({
    queryKey: ["promo-image-urls", withImages.map((p) => p.id).join(",")],
    queryFn: async () => {
      const entries = await Promise.all(
        withImages.map(async (p) => {
          const url = await getSignedUrl(p.image_storage_path!, 600);
          return [p.id, url] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, string>;
    },
    enabled: withImages.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

const HE_MONTHS = [
  "בינואר", "בפברואר", "במרץ", "באפריל", "במאי", "ביוני",
  "ביולי", "באוגוסט", "בספטמבר", "באוקטובר", "בנובמבר", "בדצמבר",
];

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Returns date parts as an array of strings.
 * Rendered via flexbox to avoid bidi reordering issues with mixed
 * Hebrew text and numbers.
 */
function getDateParts(
  startStr: string,
  endStr: string | null,
  lang: "he" | "en",
): string[] {
  const start = new Date(startStr + "T00:00:00");
  const months = lang === "he" ? HE_MONTHS : EN_MONTHS;

  if (!endStr || endStr === startStr) {
    return [String(start.getDate()), months[start.getMonth()], String(start.getFullYear())];
  }

  const end = new Date(endStr + "T00:00:00");
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return [
      `${start.getDate()}-${end.getDate()}`,
      months[start.getMonth()],
      String(end.getFullYear()),
    ];
  }

  return [
    String(start.getDate()),
    months[start.getMonth()],
    "-",
    String(end.getDate()),
    months[end.getMonth()],
    String(end.getFullYear()),
  ];
}

const CoursePromoSection = ({ promotions }: CoursePromoSectionProps) => {
  const { data: imageUrls = {} } = usePromoImageUrls(promotions);

  if (promotions.length === 0) return null;

  const lang = promotions[0].language;
  const texts = i18n[lang];
  const count = promotions.length;

  const gridCols =
    count === 1
      ? ""
      : count === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3";

  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Single shared heading */}
        <div className="text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-3">
            {texts.heading}
          </h2>
          <div className="w-12 h-1 bg-accent mx-auto rounded-full mb-10" />
        </div>

        {/* Responsive grid */}
        <div className={`grid gap-8 ${gridCols} ${count === 1 ? "max-w-lg mx-auto" : ""}`}>
          {promotions.map((promo) => {
            const cardLang = promo.language;
            const cardTexts = i18n[cardLang];
            const hasImage = promo.image_storage_path && imageUrls[promo.id];
            const dir = cardLang === "he" ? "rtl" : "ltr";

            return (
              <div
                key={promo.id}
                dir={dir}
                className="rounded-xl overflow-hidden shadow-lg border border-border bg-card"
              >
                {hasImage && (
                  <a href={promo.link_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={imageUrls[promo.id]}
                      alt={promo.title}
                      className="w-full aspect-[16/9] object-cover"
                    />
                  </a>
                )}

                <div className="px-7 py-6 text-center">
                  {/* Title - also a link */}
                  <a
                    href={promo.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mb-3"
                  >
                    <h3 className="font-heading text-2xl font-bold text-foreground hover:text-accent transition-colors">
                      {promo.title}
                    </h3>
                  </a>

                  {/* Date - prominent, accent colored, flexbox to avoid bidi reordering */}
                  {promo.event_date && (
                    <p
                      className="text-accent text-lg font-semibold mb-4 flex justify-center gap-1.5"
                      dir={dir}
                    >
                      {getDateParts(promo.event_date, promo.event_end_date, cardLang).map(
                        (part, i) => (
                          <span key={i}>{part}</span>
                        ),
                      )}
                    </p>
                  )}

                  {/* Separator */}
                  {promo.description && (
                    <>
                      <div className="w-8 h-px bg-border mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                        {promo.description}
                      </p>
                    </>
                  )}

                  {/* CTA */}
                  <a
                    href={promo.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 px-8 py-3 rounded-full bg-accent text-accent-foreground font-bold hover:bg-accent/90 transition-colors shadow-sm"
                  >
                    {cardTexts.cta}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CoursePromoSection;
