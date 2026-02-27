import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import maitreyaLogo from "@/assets/maitreya-logo.png";

const ResetPassword = () => {
  useDocumentTitle("Reset Password | Maitreya Sangha Israel");
  const { resetPassword } = useAuth();

  const [mode, setMode] = useState<"request" | "reset" | "success">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Listen for PASSWORD_RECOVERY event (user clicked the magic link)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setError("");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error.message);
      } else {
        setEmailSent(true);
      }
    } catch {
      setError("שגיאת תקשורת. נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setMode("success");
      }
    } catch {
      setError("שגיאת תקשורת. נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background font-body">
      <header className="py-4 px-6 flex justify-center border-b border-border bg-card">
        <a href="https://maitreya.org.il/">
          <img src={maitreyaLogo} alt="מאיטרייה סנגהה ישראל" className="h-12 md:h-16 object-contain" />
        </a>
      </header>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6 max-w-md">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">

            {mode === "request" && !emailSent && (
              <>
                <h2 className="font-heading text-2xl font-bold text-primary text-center mb-2">
                  איפוס סיסמה
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  הזינו את כתובת האימייל שלכם ונשלח לכם קישור לאיפוס הסיסמה
                </p>

                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">אימייל</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full font-bold py-3 text-base rounded-full shadow-md bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {submitting ? "רגע..." : "שליחת קישור איפוס"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/discover/healing-retreat"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    חזרה לכניסה
                  </Link>
                </div>
              </>
            )}

            {mode === "request" && emailSent && (
              <>
                <h2 className="font-heading text-2xl font-bold text-primary text-center mb-2">
                  בדקו את האימייל שלכם
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  שלחנו קישור לאיפוס הסיסמה אל <span className="font-medium text-foreground" dir="ltr">{email}</span>
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  לא קיבלתם? בדקו בתיקיית הספאם או{" "}
                  <button
                    onClick={() => setEmailSent(false)}
                    className="text-accent hover:underline"
                  >
                    נסו שוב
                  </button>
                </p>
              </>
            )}

            {mode === "reset" && (
              <>
                <h2 className="font-heading text-2xl font-bold text-primary text-center mb-2">
                  בחרו סיסמה חדשה
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  הזינו את הסיסמה החדשה שלכם
                </p>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">סיסמה חדשה</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="לפחות 6 תווים"
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">אימות סיסמה</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="הזינו שוב את הסיסמה"
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full font-bold py-3 text-base rounded-full shadow-md bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {submitting ? "רגע..." : "עדכון סיסמה"}
                  </Button>
                </form>
              </>
            )}

            {mode === "success" && (
              <>
                <h2 className="font-heading text-2xl font-bold text-primary text-center mb-2">
                  הסיסמה עודכנה בהצלחה
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  כעת תוכלו להתחבר עם הסיסמה החדשה
                </p>
                <Link to="/discover/healing-retreat">
                  <Button className="w-full font-bold py-3 text-base rounded-full shadow-md bg-accent hover:bg-accent/90 text-accent-foreground">
                    לכניסה
                  </Button>
                </Link>
              </>
            )}

          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>&copy; {new Date().getFullYear()} מאיטרייה סנגהה ישראל. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
};

export default ResetPassword;
