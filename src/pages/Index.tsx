import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExternalLink } from "lucide-react";
import VideoSection from "@/components/VideoSection";
import maitreyaLogo from "@/assets/maitreya-logo.png";
import { loadTranscripts, loadTranscriptsHe } from "@/data/loadTranscripts";

interface VideoItem {
  id: number;
  title: string;
  youtubeId: string;
  transcript: string;
  transcriptHe?: string;
}

const Index = () => {
  const [unlockedCount, setUnlockedCount] = useState(1);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      // Load videos from DB
      const { data: dbVideos } = await supabase
        .from("transcripts")
        .select("part_number, title, youtube_id, content_en, content_he")
        .order("part_number");

      if (dbVideos && dbVideos.length > 0) {
        setVideos(dbVideos.map((v: any) => ({
          id: v.part_number,
          title: v.title,
          youtubeId: v.youtube_id,
          transcript: v.content_en,
          transcriptHe: v.content_he,
        })));
      } else {
        // Fallback to static
        const { videos: staticVideos } = await import("@/data/videos");
        const en = await loadTranscripts();
        const he = await loadTranscriptsHe();
        setVideos(staticVideos.map((v, i) => ({
          ...v,
          youtubeId: v.youtubeId,
          transcript: en[i] || v.transcript,
          transcriptHe: he[i] || "",
        })));
      }

      // Load site content
      const { data: contentData } = await supabase
        .from("site_content")
        .select("key, value");
      if (contentData) {
        const map: Record<string, string> = {};
        contentData.forEach((c: any) => { map[c.key] = c.value; });
        setContent(map);
      }
    };
    load();
  }, []);

  const handleNext = (currentIndex: number) => {
    if (currentIndex + 1 >= unlockedCount) setUnlockedCount(currentIndex + 2);
    setTimeout(() => {
      document.getElementById(`video-${currentIndex + 2}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const purchaseUrl = content.purchase_url || "https://maitreya.org.il/he/our_events/lg26-the-path-of-buddhist-healing-retreat-he-1/#tickets";
  const progressPercent = videos.length > 0 ? (unlockedCount / videos.length) * 100 : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-background font-body">
      <header className="py-4 px-6 flex justify-center border-b border-border bg-card">
        <img src={maitreyaLogo} alt="מאיטרייה סנגהה ישראל" className="h-12 md:h-16 object-contain" />
      </header>

      <section className="relative overflow-hidden py-16 md:py-24" style={{ background: 'var(--spiritual-gradient)' }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(38 70% 50% / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(260 30% 50% / 0.2) 0%, transparent 50%)'
        }} />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            {content.hero_title || "הדרך לריפוי והילינג בודהיסטי"}
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed mb-4 whitespace-pre-line">
            {content.hero_subtitle || ""}
          </p>
          <div className="w-16 h-1 bg-accent mx-auto mt-8 rounded-full" />
        </div>
      </section>

      {videos.length > 0 && (
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border py-3 px-6">
          <div className="container mx-auto max-w-3xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-body text-muted-foreground">התקדמות</span>
              <span className="text-sm font-bold text-primary font-body">{unlockedCount} מתוך {videos.length}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>
      )}

      <main className="container mx-auto px-6 py-12">
        <div className="space-y-16">
          {videos.map((video, index) => {
            if (index >= unlockedCount) return null;
            return (
              <section key={video.id} id={`video-${video.id}`} className="scroll-mt-24">
                <div className="flex items-center justify-center mb-8">
                  <div className="h-px flex-1 bg-border max-w-[100px]" />
                  <span className="mx-4 text-sm font-bold text-accent font-body bg-accent/10 px-4 py-1 rounded-full">
                    סרטון {video.id} מתוך {videos.length}
                  </span>
                  <div className="h-px flex-1 bg-border max-w-[100px]" />
                </div>
                <VideoSection
                  video={video}
                  isLast={index === videos.length - 1}
                  onNext={() => handleNext(index)}
                  purchaseUrl={purchaseUrl}
                  ctaText={content.cta_text}
                />
              </section>
            );
          })}
        </div>
      </main>

      {unlockedCount >= videos.length && videos.length > 0 && (
        <section className="py-16 md:py-24" style={{ background: 'var(--spiritual-gradient)' }}>
          <div className="container mx-auto px-6 text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              {content.final_cta_title || "מוכנים לחוויה המלאה?"}
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-4">
              {content.final_cta_subtitle || ""}
            </p>
            <p className="text-primary-foreground/70 mb-8">
              {content.final_cta_date || ""}
            </p>
            <a href={purchaseUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-12 py-4 text-lg rounded-full shadow-lg transition-transform hover:scale-105">
                <ExternalLink className="h-5 w-5 ml-2" />
                {content.final_cta_button || "להרשמה לריטריט"}
              </Button>
            </a>
          </div>
        </section>
      )}

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>© {new Date().getFullYear()} מאיטרייה סנגהה ישראל. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
};

export default Index;
