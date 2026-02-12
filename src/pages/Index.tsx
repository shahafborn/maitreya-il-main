import { useState, useEffect } from "react";
import { videos, PURCHASE_URL } from "@/data/videos";
import { loadTranscripts, loadTranscriptsHe } from "@/data/loadTranscripts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExternalLink } from "lucide-react";
import VideoSection from "@/components/VideoSection";
import maitreyaLogo from "@/assets/maitreya-logo.png";

const Index = () => {
  const [unlockedCount, setUnlockedCount] = useState(1);
  const [transcriptsEn, setTranscriptsEn] = useState<string[]>([]);
  const [transcriptsHe, setTranscriptsHe] = useState<string[]>([]);

  useEffect(() => {
    // Try DB first, fallback to static files
    const loadFromDb = async () => {
      const { data } = await supabase
        .from("transcripts")
        .select("part_number, content_en, content_he")
        .order("part_number");
      
      if (data && data.some(t => t.content_he || t.content_en)) {
        setTranscriptsEn(data.map(t => t.content_en));
        setTranscriptsHe(data.map(t => t.content_he));
      } else {
        // Fallback to static files
        loadTranscripts().then(setTranscriptsEn);
        loadTranscriptsHe().then(setTranscriptsHe);
      }
    };
    loadFromDb();
  }, []);

  const handleNext = (currentIndex: number) => {
    if (currentIndex + 1 >= unlockedCount) {
      setUnlockedCount(currentIndex + 2);
    }
    setTimeout(() => {
      document.getElementById(`video-${currentIndex + 2}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const progressPercent = (unlockedCount / videos.length) * 100;

  const videosWithTranscripts = videos.map((video, i) => ({
    ...video,
    transcript: transcriptsEn[i] || video.transcript,
    transcriptHe: transcriptsHe[i] || "",
  }));

  return (
    <div dir="rtl" className="min-h-screen bg-background font-body">
      {/* Header with logo */}
      <header className="py-4 px-6 flex justify-center border-b border-border bg-card">
        <img src={maitreyaLogo} alt="מאיטרייה סנגהה ישראל" className="h-12 md:h-16 object-contain" />
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24" style={{ background: 'var(--spiritual-gradient)' }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(38 70% 50% / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(260 30% 50% / 0.2) 0%, transparent 50%)'
        }} />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            הדרך לריפוי והילינג בודהיסטי
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed mb-4">
            לאמה גלן מולין חושף את סודות הריפוי הטנטרי הבודהיסטי
            <br />
            ב-6 סרטונים שיפתחו לכם את הדלת לעולם חדש של ריפוי ושלום פנימי
          </p>
          <div className="w-16 h-1 bg-accent mx-auto mt-8 rounded-full" />
        </div>
      </section>

      {/* Progress Indicator */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border py-3 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-body text-muted-foreground">התקדמות</span>
            <span className="text-sm font-bold text-primary font-body">{unlockedCount} / {videos.length}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Video Sections */}
      <main className="container mx-auto px-6 py-12">
        <div className="space-y-16">
          {videosWithTranscripts.map((video, index) => {
            if (index >= unlockedCount) return null;
            return (
              <section
                key={video.id}
                id={`video-${video.id}`}
                className="scroll-mt-24"
              >
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
                />
              </section>
            );
          })}
        </div>
      </main>

      {/* Final CTA - shown only when all videos unlocked */}
      {unlockedCount >= videos.length && (
        <section className="py-16 md:py-24" style={{ background: 'var(--spiritual-gradient)' }}>
          <div className="container mx-auto px-6 text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              מוכנים לחוויה המלאה?
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-4">
              ריטריט ריפוי בודהיסטי עם לאמה גלן מולין ודרופון צ'ונגול-לה
            </p>
            <p className="text-primary-foreground/70 mb-8">
              26 למאי – 09 ליוני 2026
            </p>
            <a href={PURCHASE_URL} target="_blank" rel="noopener noreferrer">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-12 py-4 text-lg rounded-full shadow-lg transition-transform hover:scale-105">
                <ExternalLink className="h-5 w-5 ml-2" />
                להרשמה לריטריט
              </Button>
            </a>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>© {new Date().getFullYear()} מאיטרייה סנגהה ישראל. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
};

export default Index;
