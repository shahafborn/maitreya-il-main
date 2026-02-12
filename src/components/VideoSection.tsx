import { VideoData, PURCHASE_URL } from "@/data/videos";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink, Languages } from "lucide-react";
import { useState } from "react";

interface VideoSectionProps {
  video: VideoData & {transcriptHe?: string;};
  isLast: boolean;
  onNext: () => void;
}

const VideoSection = ({ video, isLast, onNext }: VideoSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const [lang, setLang] = useState<"he" | "en">("he");

  const transcript = lang === "he" && video.transcriptHe ? video.transcriptHe : video.transcript;
  const maxCollapsedHeight = "200px";

  return (
    <div className="animate-fade-in-up">
      <div className="max-w-3xl mx-auto">
        <h3 className="font-heading text-2xl md:text-3xl font-bold text-primary mb-6 text-center">
          {video.title}
        </h3>

        {/* YouTube Embed */}
        <div className="relative w-full rounded-xl overflow-hidden shadow-lg mb-6" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${video.youtubeId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />

        </div>

        {/* Transcript */}
        <div className="bg-card border border-border rounded-lg mb-6">
          {/* Transcript header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold text-foreground font-body">תקציר
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setLang(lang === "he" ? "en" : "he")}
              className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors bg-muted px-3 py-1.5 rounded-full">

                <Languages className="h-3.5 w-3.5" />
                {lang === "he" ? "English" : "עברית"}
              </button>
            </div>
          </div>

          {/* Transcript body */}
          <div className="relative">
            <div
              className={`px-6 py-4 text-sm leading-relaxed text-muted-foreground font-body whitespace-pre-line overflow-hidden transition-all duration-300 ${lang === "en" ? "text-left" : ""}`}
              dir={lang === "en" ? "ltr" : "rtl"}
              style={{ maxHeight: expanded ? "none" : maxCollapsedHeight }}>

              {transcript}
            </div>
            {/* Fade overlay when collapsed */}
            {!expanded &&
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            }
          </div>

          {/* Expand/collapse button */}
          <div className="flex justify-center border-t border-border py-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-body px-4 py-1">

              {expanded ?
              <>
                  <ChevronUp className="h-4 w-4" />
                  הסתר
                </> :

              <>
                  <ChevronDown className="h-4 w-4" />
                  הצג עוד
                </>
              }
            </button>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <a href={PURCHASE_URL} target="_blank" rel="noopener noreferrer">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 py-3 text-base rounded-full shadow-md">
              <ExternalLink className="h-4 w-4 ml-2" />
              הרשמה לריטריט הריפוי
            </Button>
          </a>
        </div>

        {/* Next Video Button */}
        {!isLast &&
        <div className="flex justify-center pt-4">
            <Button
            onClick={onNext}
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold px-10 py-3 text-base rounded-full transition-all">

              לווידאו הבא ←
            </Button>
          </div>
        }
      </div>
    </div>);

};

export default VideoSection;