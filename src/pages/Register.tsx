import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import maitreyaLogo from "@/assets/maitreya-logo.png";

const Register = () => {
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentHighlight, setConsentHighlight] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const consentRef = useRef<HTMLLabelElement>(null);

  const nudgeConsent = () => {
    setConsentHighlight(true);
    consentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setConsentHighlight(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isLogin && !consent) {
      nudgeConsent();
      return;
    }

    setSubmitting(true);

    try {
      const { error: authError } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (authError) {
        setError(authError.message);
      }
    } catch {
      setError("שגיאת תקשורת. נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (!consent) {
      nudgeConsent();
      return;
    }
    signInWithGoogle();
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background font-body">
      {/* Header */}
      <header className="py-4 px-6 flex justify-center border-b border-border bg-card">
        <a href="https://maitreya.org.il/">
          <img src={maitreyaLogo} alt="מאיטרייה סנגהה ישראל" className="h-12 md:h-16 object-contain" />
        </a>
      </header>

      {/* Hero Intro */}
      <section className="relative overflow-hidden py-16 md:py-20" style={{ background: 'var(--spiritual-gradient)' }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(38 70% 50% / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(260 30% 50% / 0.2) 0%, transparent 50%)'
        }} />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 leading-tight">
            הדרך לריפוי והילינג בודהיסטי
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed mb-3">
            קורס של שש שעות מוקלטות עם לאמה גלן מולין
            <br />
            שיפתחו לכם את הדלת לעולם הריפוי הטנטרי הבודהיסטי
          </p>
          <div className="w-16 h-1 bg-accent mx-auto mt-6 rounded-full" />
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6 max-w-md">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            <h2 className="font-heading text-2xl font-bold text-primary text-center mb-2">
              {isLogin ? "כניסה לחשבון" : "הרשמה לצפייה בקורס"}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {isLogin ? "ברוכים השבים!" : "הירשמו בחינם וקבלו גישה מיידית"}
            </p>

            <Button
              type="button"
              onClick={isLogin ? () => signInWithGoogle() : handleGoogleSignIn}
              variant="outline"
              className={`w-full py-3 text-base rounded-full font-bold mb-4 transition-all duration-300 ${
                !isLogin && !consent ? "opacity-50" : ""
              }`}
            >
              <svg className="h-5 w-5 ml-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              כניסה עם Google
            </Button>

            <div className="relative mb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">או</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
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

              {!isLogin && (<>
                <label
                  ref={consentRef}
                  className={`flex items-start gap-3 cursor-pointer rounded-lg p-3 -mx-3 transition-all duration-300 ${
                    consentHighlight
                      ? "bg-accent/10 ring-2 ring-accent"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      setConsentHighlight(false);
                    }}
                    className="mt-1 h-4 w-4 rounded border-border accent-accent"
                  />
                  <span className={`text-xs leading-relaxed transition-colors duration-300 ${
                    consentHighlight ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}>
                    אני מאשר/ת את תנאי השימוש באתר ומסכים/ה לקבל תכנים ועדכונים מ-מאיטרייה סנגהה ישראל
                  </span>
                </label>
                {consentHighlight && (
                  <p className="text-xs text-accent font-medium text-center -mt-1">
                    יש לאשר את תנאי השימוש כדי להמשיך
                  </p>
                )}
              </>)}

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className={`w-full font-bold py-3 text-base rounded-full shadow-md transition-all duration-300 ${
                  !isLogin && !consent
                    ? "bg-accent/50 text-accent-foreground/70"
                    : "bg-accent hover:bg-accent/90 text-accent-foreground"
                }`}
              >
                {submitting
                  ? "רגע..."
                  : isLogin
                    ? "כניסה"
                    : "הרשמה חינם"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                {isLogin
                  ? "אין לכם חשבון? הירשמו כאן"
                  : "כבר רשומים? התחברו כאן"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>© {new Date().getFullYear()} מאיטרייה סנגהה ישראל. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
};

export default Register;
