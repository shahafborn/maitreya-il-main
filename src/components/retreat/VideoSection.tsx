import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { SectionFrame } from "./SectionFrame";

interface VideoSectionProps {
  title: string;
  subtitle?: string;
  /** Full YouTube embed URL (e.g. "https://www.youtube.com/embed/XYZ?start=1"). */
  embedUrl: string;
  /** Accessibility title for the iframe. */
  iframeTitle: string;
}

/**
 * Responsive 16:9 YouTube embed with a serif title and optional subtitle.
 * Note: there is an unrelated `src/components/VideoSection.tsx` in the codebase
 * used by other pages; this one is retreat-specific and lives under `retreat/`.
 */
export const VideoSection = ({ title, subtitle, embedUrl, iframeTitle }: VideoSectionProps) => (
  <SectionFrame tone="cream" maxWidth="md">
    <h2
      className="text-2xl md:text-3xl font-bold text-center mb-3"
      style={{ fontFamily: RETREAT_FONTS.serif }}
    >
      {title}
    </h2>
    {subtitle && (
      <p className="text-lg text-center mb-10" style={{ color: RETREAT_THEME.WARM_GRAY }}>
        {subtitle}
      </p>
    )}
    <div
      className="relative w-full rounded-xl overflow-hidden shadow-lg"
      style={{ paddingBottom: "56.25%" }}
    >
      <iframe
        className="absolute inset-0 w-full h-full"
        src={embedUrl}
        title={iframeTitle}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  </SectionFrame>
);
