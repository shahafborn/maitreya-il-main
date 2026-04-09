import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { GoldDot } from "./GoldDot";

interface ContactInfo {
  email: string;
  phone?: string;
  /** Heading (e.g. "צרו קשר"). */
  heading: string;
  /** Inline label preceding the email (e.g. "לשאלות, בירורים והרשמה:"). */
  label: string;
  /** Phone label (e.g. "טלפון:"). */
  phoneLabel?: string;
}

interface CancellationPolicy {
  heading: string;
  /** Bullet items. */
  bullets: string[];
}

interface InfoFooterProps {
  /** Optional cancellation policy block. Omit for dana-based retreats without one. */
  policy?: CancellationPolicy;
  contact: ContactInfo;
}

/**
 * Plain bottom section with an optional cancellation policy and contact info.
 */
export const InfoFooter = ({ policy, contact }: InfoFooterProps) => (
  <section className="py-16 md:py-20">
    <div className="max-w-3xl mx-auto px-6 space-y-10">
      {policy && (
        <div>
          <h3 className="text-lg font-bold mb-3" style={{ fontFamily: RETREAT_FONTS.serif }}>
            {policy.heading}
          </h3>
          <ul className="space-y-2 text-lg" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            {policy.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <GoldDot />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold mb-3" style={{ fontFamily: RETREAT_FONTS.serif }}>
          {contact.heading}
        </h3>
        <p className="text-lg" style={{ color: RETREAT_THEME.WARM_GRAY }}>
          {contact.label}{" "}
          <a
            href={`mailto:${contact.email}`}
            className="underline decoration-1 underline-offset-4 transition-colors hover:text-[#C9A961]"
          >
            {contact.email}
          </a>
        </p>
        {contact.phone && (
          <p className="text-lg mt-2" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            {contact.phoneLabel ?? ""}{" "}
            <a
              href={`tel:${contact.phone}`}
              className="underline decoration-1 underline-offset-4 transition-colors hover:text-[#C9A961]"
            >
              {contact.phone}
            </a>
          </p>
        )}
      </div>
    </div>
  </section>
);
