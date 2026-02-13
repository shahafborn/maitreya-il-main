import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogIn, LogOut, Save, Languages, Video, FileText, Layout } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";

interface Transcript {
  id: number;
  part_number: number;
  title: string;
  youtube_id: string;
  content_en: string;
  content_he: string;
}

interface SiteContent {
  key: string;
  value: string;
}

const CONTENT_LABELS: Record<string, string> = {
  hero_title: "כותרת ראשית",
  hero_subtitle: "תת-כותרת ראשית",
  cta_text: "טקסט כפתור CTA (בכל סרטון)",
  final_cta_title: "כותרת CTA סופי",
  final_cta_subtitle: "תת-כותרת CTA סופי",
  final_cta_date: "תאריך האירוע",
  final_cta_button: "טקסט כפתור סופי",
  purchase_url: "קישור הרשמה",
};

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Record<number, "he" | "en">>({});
  const [activeTab, setActiveTab] = useState<"videos" | "content">("videos");
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const checkAdminRole = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (isMounted) setIsAdmin(!!data);
      } catch {
        if (isMounted) setIsAdmin(false);
      }
    };

    // Set up listener FIRST (Supabase recommended order)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          setTimeout(() => checkAdminRole(currentUser.id), 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // Then fetch initial session with error protection
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await checkAdminRole(currentUser.id);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Safety timeout - show login form after 5s no matter what
    const timeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 5000);

    initializeAuth().then(() => clearTimeout(timeout));

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadTranscripts();
      loadSiteContent();
    }
  }, [isAdmin]);

  const loadTranscripts = async () => {
    const { data, error } = await supabase
      .from("transcripts")
      .select("*")
      .order("part_number");
    if (data) {
      setTranscripts(data as Transcript[]);
      const langs: Record<number, "he" | "en"> = {};
      data.forEach((t: any) => (langs[t.part_number] = "he"));
      setActiveLang(langs);
    }
    if (error) toast({ title: "שגיאה בטעינה", variant: "destructive" });
  };

  const loadSiteContent = async () => {
    const { data, error } = await supabase
      .from("site_content")
      .select("key, value")
      .order("id");
    if (data) setSiteContent(data as SiteContent[]);
    if (error) toast({ title: "שגיאה בטעינת תכנים", variant: "destructive" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast({ title: "שגיאת התחברות", description: error.message, variant: "destructive" });
  };

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (error) toast({ title: "שגיאת התחברות עם Google", description: String(error), variant: "destructive" });
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const handleSaveVideo = async (transcript: Transcript) => {
    setSaving(`video-${transcript.part_number}`);
    const lang = activeLang[transcript.part_number] || "he";
    const updateData: any = {
      title: transcript.title,
      youtube_id: transcript.youtube_id,
    };
    if (lang === "he") updateData.content_he = transcript.content_he;
    else updateData.content_en = transcript.content_en;

    const { error } = await supabase.from("transcripts").update(updateData).eq("part_number", transcript.part_number);
    if (error) toast({ title: "שגיאה בשמירה", description: error.message, variant: "destructive" });
    else toast({ title: `חלק ${transcript.part_number} נשמר בהצלחה` });
    setSaving(null);
  };

  const handleSaveContent = async (key: string, value: string) => {
    setSaving(`content-${key}`);
    const { error } = await supabase.from("site_content").update({ value }).eq("key", key);
    if (error) toast({ title: "שגיאה בשמירה", description: error.message, variant: "destructive" });
    else toast({ title: "נשמר בהצלחה" });
    setSaving(null);
  };

  const updateTranscript = (partNumber: number, field: keyof Transcript, value: string) => {
    setTranscripts((prev) =>
      prev.map((t) => (t.part_number === partNumber ? { ...t, [field]: value } : t))
    );
  };

  const updateContent = (key: string, value: string) => {
    setSiteContent((prev) => prev.map((c) => (c.key === key ? { ...c, value } : c)));
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-heading text-2xl font-bold text-primary mb-6 text-center">כניסת מנהל</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="email" placeholder="אימייל" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
            <Input type="password" placeholder="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" />
            <Button type="submit" className="w-full"><LogIn className="h-4 w-4 ml-2" />התחבר</Button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">או</span></div>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn}>
              <svg className="h-4 w-4 ml-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              התחבר עם Google
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div dir="rtl" className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-destructive font-bold">אין לך הרשאות מנהל</p>
        <Button variant="outline" onClick={handleLogout}><LogOut className="h-4 w-4 ml-2" />התנתק</Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background font-body">
      <header className="py-4 px-6 flex items-center justify-between border-b border-border bg-card">
        <h1 className="font-heading text-xl font-bold text-primary">ניהול האתר</h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 ml-2" />התנתק
        </Button>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto max-w-4xl flex gap-1 px-6">
          <button
            onClick={() => setActiveTab("videos")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "videos" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Video className="h-4 w-4" />סרטונים ותמצותים
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "content" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Layout className="h-4 w-4" />תכני עמוד
          </button>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 max-w-4xl space-y-8">
        {activeTab === "videos" && transcripts.map((transcript) => {
          const lang = activeLang[transcript.part_number] || "he";
          const content = lang === "he" ? transcript.content_he : transcript.content_en;

          return (
            <div key={transcript.part_number} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-bold text-foreground">
                  סרטון {transcript.part_number}
                </h2>
                <button
                  onClick={() => setActiveLang((prev) => ({ ...prev, [transcript.part_number]: lang === "he" ? "en" : "he" }))}
                  className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors bg-muted px-3 py-1.5 rounded-full"
                >
                  <Languages className="h-3.5 w-3.5" />
                  {lang === "he" ? "English" : "עברית"}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">כותרת</label>
                  <Input
                    value={transcript.title}
                    onChange={(e) => updateTranscript(transcript.part_number, "title", e.target.value)}
                    placeholder="כותרת הסרטון"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">YouTube ID</label>
                  <Input
                    value={transcript.youtube_id}
                    onChange={(e) => updateTranscript(transcript.part_number, "youtube_id", e.target.value)}
                    placeholder="לדוגמה: _yRuzXTL5p4"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">
                    <FileText className="h-3.5 w-3.5 inline ml-1" />
                    תמצות ({lang === "he" ? "עברית" : "אנגלית"})
                  </label>
                  <Textarea
                    value={content}
                    onChange={(e) => updateTranscript(transcript.part_number, lang === "he" ? "content_he" : "content_en", e.target.value)}
                    className="min-h-[150px] text-sm leading-relaxed font-body"
                    dir={lang === "en" ? "ltr" : "rtl"}
                    placeholder={lang === "he" ? "הזן תמצות בעברית..." : "Enter English transcript..."}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <Button onClick={() => handleSaveVideo(transcript)} disabled={saving === `video-${transcript.part_number}`} size="sm">
                  <Save className="h-4 w-4 ml-2" />
                  {saving === `video-${transcript.part_number}` ? "שומר..." : "שמור"}
                </Button>
              </div>
            </div>
          );
        })}

        {activeTab === "content" && (
          <div className="space-y-6">
            {siteContent.map((item) => {
              const isLong = item.key.includes("subtitle") || item.key.includes("hero_subtitle");
              const isUrl = item.key.includes("url");
              return (
                <div key={item.key} className="bg-card border border-border rounded-lg p-6">
                  <label className="text-sm font-bold text-foreground mb-2 block">
                    {CONTENT_LABELS[item.key] || item.key}
                  </label>
                  {isLong ? (
                    <Textarea
                      value={item.value}
                      onChange={(e) => updateContent(item.key, e.target.value)}
                      className="min-h-[100px] text-sm leading-relaxed font-body"
                    />
                  ) : (
                    <Input
                      value={item.value}
                      onChange={(e) => updateContent(item.key, e.target.value)}
                      dir={isUrl ? "ltr" : "rtl"}
                    />
                  )}
                  <div className="flex justify-end mt-3">
                    <Button onClick={() => handleSaveContent(item.key, item.value)} disabled={saving === `content-${item.key}`} size="sm">
                      <Save className="h-4 w-4 ml-2" />
                      {saving === `content-${item.key}` ? "שומר..." : "שמור"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
