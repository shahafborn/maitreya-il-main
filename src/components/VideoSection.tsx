import { VideoData, PURCHASE_URL } from "@/data/videos";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";

interface VideoSectionProps {
  video: VideoData;
  isLast: boolean;
  onNext: () => void;
}

const VideoSection = ({ video, isLast, onNext }: VideoSectionProps) => {
  const [transcriptOpen, setTranscriptOpen] = useState(false);

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
            allowFullScreen
          />
        </div>

        {/* Transcript */}
        <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mx-auto mb-4 font-body text-sm">
              <ChevronDown className={`h-4 w-4 transition-transform ${transcriptOpen ? 'rotate-180' : ''}`} />
              {transcriptOpen ? 'הסתר טרנסקריפט' : 'הצג טרנסקריפט'}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="bg-card border border-border rounded-lg p-6 mb-6 text-sm leading-relaxed text-muted-foreground font-body whitespace-pre-line">
              {video.transcript}
            </div>
          </CollapsibleContent>
        </Collapsible>

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
        {!isLast && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={onNext}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold px-10 py-3 text-base rounded-full transition-all"
            >
              לווידאו הבא ←
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSection;
