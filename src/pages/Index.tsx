import { useState, useEffect } from "react";
import { videos, PURCHASE_URL } from "@/data/videos";
import { loadTranscripts, loadTranscriptsHe } from "@/data/loadTranscripts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, LogOut } from "lucide-react";
import VideoSection from "@/components/VideoSection";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/lib/supabase";
import maitreyaLogo from "@/assets/maitreya-logo.png";

const Index = () => {
  useDocumentTitle("ספריית וידאו | מאיטרייה");
  const { signOut, user } = useAuth();
  const [unlockedCount, setUnlockedCount] = useState(1);
  const [transcriptsEn, setTranscriptsEn] = useState<string[]>([]);
  const [transcriptsHe, setTranscriptsHe] = useState<string[]>([]);

  useEffect(() => {
    loadTranscripts().then(setTranscriptsEn);
    loadTranscriptsHe().then(setTranscriptsHe);
  }, []);

  // Track video view in database (fire-and-forget, deduplicated by unique constraint)
  const trackView = (videoId: number) => {
    if (!user) return;
    supabase
      .from("video_views")
      .upsert({ user_id: user.id, video_id: videoId }, { onConflict: "user_id,video_id" })
      .then();
  };

  // Track first video on mount (user always sees video 1)
  useEffect(() => {
    trackView(1);
  }, [user]);

  const handleNext = (currentIndex: number) => {
    if (currentIndex + 1 >= unlockedCount) {
      setUnlockedCount(currentIndex + 2);
    }
    // Track the next video being unlocked
    trackView(currentIndex + 2);
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
      <header className="py-4 px-6 flex items-center justify-between border-b border-border bg-card">
        <div className="w-10" />
        <a href="https://maitreya.org.il/">
          <img src={maitreyaLogo} alt="מאיטרייה סנגהה ישראל" className="h-12 md:h-16 object-contain" />
        </a>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="התנתקות"
        >
          <LogOut className="h-4 w-4" />
        </button>
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
            <span className="text-sm font-bold text-primary font-body">{unlockedCount} מתוך {videos.length}</span>
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
                להרשמה לריטריט
                <ExternalLink className="h-5 w-5 mr-2 -scale-x-100" />
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
