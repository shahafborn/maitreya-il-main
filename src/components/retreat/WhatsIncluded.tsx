import { RETREAT_THEME } from "./theme";

interface WhatsIncludedProps {
  /** Background photo behind the dark overlay. */
  bgImage: string;
  eyebrow: string;
  items: string[];
}

/**
 * Dark photo-background section with a two-column checklist of what the
 * retreat fee covers. Uses gold lotus dingbats instead of bullets.
 */
export const WhatsIncluded = ({ bgImage, eyebrow, items }: WhatsIncludedProps) => (
  <section className="relative py-20 md:py-28">
    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
    <div className="absolute inset-0 bg-black/55" />
    <div className="relative z-10 max-w-4xl mx-auto px-6">
      <h2
        className="text-sm font-bold tracking-[0.2em] uppercase text-center text-white/90 mb-14"
        style={{ letterSpacing: "0.2em" }}
      >
        {eyebrow}
      </h2>
      <div className="grid md:grid-cols-2 gap-x-20 gap-y-5 max-w-3xl mx-auto">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 py-1">
            <span className="text-lg" style={{ color: RETREAT_THEME.GOLD }}>
              &#10047;
            </span>
            <span className="text-lg text-white/90">{item}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);
