import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LogIn, LogOut, Save, Languages } from "lucide-react";
import { Input } from "@/components/ui/input";
import { videos } from "@/data/videos";

interface Transcript {
  id: number;
  part_number: number;
  content_en: string;
  content_he: string;
}

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [saving, setSaving] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<Record<number, "he" | "en">>({});
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .eq("role", "admin")
          .maybeSingle();
        setIsAdmin(!!data);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadTranscripts();
    }
  }, [isAdmin]);

  const loadTranscripts = async () => {
    const { data, error } = await supabase
      .from("transcripts")
      .select("*")
      .order("part_number");
    if (data) {
      setTranscripts(data);
      const langs: Record<number, "he" | "en"> = {};
      data.forEach((t) => (langs[t.part_number] = "he"));
      setActiveLang(langs);
    }
    if (error) {
      toast({ title: "שגיאה בטעינת טרנסקריפטים", variant: "destructive" });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "שגיאת התחברות", description: error.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSave = async (transcript: Transcript) => {
    setSaving(transcript.part_number);
    const lang = activeLang[transcript.part_number] || "he";
    const updateData = lang === "he"
      ? { content_he: transcript.content_he }
      : { content_en: transcript.content_en };

    const { error } = await supabase
      .from("transcripts")
      .update(updateData)
      .eq("part_number", transcript.part_number);

    if (error) {
      toast({ title: "שגיאה בשמירה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `חלק ${transcript.part_number} נשמר בהצלחה` });
    }
    setSaving(null);
  };

  const updateTranscript = (partNumber: number, field: "content_he" | "content_en", value: string) => {
    setTranscripts((prev) =>
      prev.map((t) => (t.part_number === partNumber ? { ...t, [field]: value } : t))
    );
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
            <Input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
            <Input
              type="password"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
            />
            <Button type="submit" className="w-full">
              <LogIn className="h-4 w-4 ml-2" />
              התחבר
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
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 ml-2" />
          התנתק
        </Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background font-body">
      <header className="py-4 px-6 flex items-center justify-between border-b border-border bg-card">
        <h1 className="font-heading text-xl font-bold text-primary">ניהול טרנסקריפטים</h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 ml-2" />
          התנתק
        </Button>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl space-y-8">
        {transcripts.map((transcript) => {
          const video = videos.find((v) => v.id === transcript.part_number);
          const lang = activeLang[transcript.part_number] || "he";
          const content = lang === "he" ? transcript.content_he : transcript.content_en;

          return (
            <div key={transcript.part_number} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-bold text-foreground">
                  חלק {transcript.part_number}: {video?.title || ""}
                </h2>
                <button
                  onClick={() =>
                    setActiveLang((prev) => ({
                      ...prev,
                      [transcript.part_number]: lang === "he" ? "en" : "he",
                    }))
                  }
                  className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors bg-muted px-3 py-1.5 rounded-full"
                >
                  <Languages className="h-3.5 w-3.5" />
                  {lang === "he" ? "English" : "עברית"}
                </button>
              </div>
              <Textarea
                value={content}
                onChange={(e) =>
                  updateTranscript(
                    transcript.part_number,
                    lang === "he" ? "content_he" : "content_en",
                    e.target.value
                  )
                }
                className="min-h-[200px] text-sm leading-relaxed font-body"
                dir={lang === "en" ? "ltr" : "rtl"}
                placeholder={lang === "he" ? "הזן טרנסקריפט בעברית..." : "Enter English transcript..."}
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={() => handleSave(transcript)}
                  disabled={saving === transcript.part_number}
                  size="sm"
                >
                  <Save className="h-4 w-4 ml-2" />
                  {saving === transcript.part_number ? "שומר..." : "שמור"}
                </Button>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default Admin;
