import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useCourse } from "@/hooks/useCourse";
import { useCourseEnrollment, useEnrollInCourse } from "@/hooks/useCourseEnrollment";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import maitreyaLogo from "@/assets/maitreya-logo.png";

const CourseRegister = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, signUp, signIn, signInWithGoogle } = useAuth();
  const { data: course, isLoading: courseLoading } = useCourse(slug);
  useDocumentTitle(
    course?.title ? `${course.title} | Maitreya Sangha Israel` : "Maitreya Sangha Israel"
  );
  const { isEnrolled, isLoading: enrollmentLoading } = useCourseEnrollment(course?.id);
  const enrollMutation = useEnrollInCourse();

  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentHighlight, setConsentHighlight] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const consentRef = useRef<HTMLLabelElement>(null);

  // If user is already enrolled, redirect to the course page
  useEffect(() => {
    if (user && isEnrolled && !enrollmentLoading) {
      navigate(`/courses/${slug}`, { replace: true });
    }
  }, [user, isEnrolled, enrollmentLoading, slug, navigate]);

  const nudgeConsent = () => {
    setConsentHighlight(true);
    consentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setConsentHighlight(false), 2000);
  };

  // Attempt enrollment after auth succeeds
  const attemptEnroll = async (courseId: string) => {
    try {
      await enrollMutation.mutateAsync({ courseId });
      navigate(`/courses/${slug}`, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Enrollment failed");
    }
  };

  // Handle email/password form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isLogin && !consent) {
      nudgeConsent();
      return;
    }

    setSubmitting(true);
    try {
      const { error: authError, data } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (authError) {
        setError(authError.message);
        return;
      }

      // Auto-enroll immediately after auth
      if (data?.user && course) {
        await attemptEnroll(course.id);
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleSignIn = () => {
    if (!consent) {
      nudgeConsent();
      return;
    }
    signInWithGoogle(`/courses/${slug}/register`);
  };

  // After Google OAuth redirect back here, auto-enroll
  useEffect(() => {
    if (!user || !course || isEnrolled || enrollmentLoading) return;
    attemptEnroll(course.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, course, isEnrolled, enrollmentLoading]);

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">Loading...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-body">Course not found.</p>
      </div>
    );
  }

  // Full registration form (not logged in — logged-in users auto-enroll via useEffect above)
  return (
    <div dir={course.default_dir} className="min-h-screen bg-background font-body">
      <Header />
      <HeroSection title={course.title} description={course.description} />

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6 max-w-md">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            <h2 className="font-heading text-2xl font-bold text-primary text-center mb-2">
              {isLogin ? "Sign In" : "Access the Resources for This Course"}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {isLogin
                ? "Welcome back!"
                : "Create a free account to access the course resources"}
            </p>

            {/* Google OAuth */}
            <Button
              type="button"
              onClick={isLogin ? () => signInWithGoogle(`/courses/${slug}/register`) : handleGoogleSignIn}
              variant="outline"
              className={`w-full py-3 text-base rounded-full font-bold mb-4 transition-all duration-300 ${
                !isLogin && !consent
                  ? "opacity-50"
                  : "border-accent bg-accent/10 hover:bg-accent/20"
              }`}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </Button>

            <div className="relative mb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  dir="ltr"
                  className="text-left"
                />
              </div>

              {!isLogin && (
                <>
                  <label
                    ref={consentRef}
                    className={`flex items-start gap-3 cursor-pointer rounded-lg p-3 -mx-3 transition-all duration-300 ${
                      consentHighlight ? "bg-accent/10 ring-2 ring-accent" : ""
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
                    <span
                      className={`text-xs leading-relaxed transition-colors duration-300 ${
                        consentHighlight ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      I agree to the terms of use and consent to receive updates from
                      Maitreya Sangha Israel.
                    </span>
                  </label>
                  {consentHighlight && (
                    <p className="text-xs text-accent font-medium text-center -mt-1">
                      Please accept the terms to continue
                    </p>
                  )}
                </>
              )}

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
                {submitting ? "Please wait..." : isLogin ? "Sign In" : "Register"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {isLogin ? "New here?" : "Already have an account?"}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="w-full py-3 text-base rounded-full font-bold"
              >
                {isLogin ? "Create an Account" : "Sign In to Your Account"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// ---- Sub-components ----

const Header = () => (
  <header className="py-4 px-6 flex justify-center border-b border-border bg-card">
    <a href="https://maitreya.org.il/">
      <img
        src={maitreyaLogo}
        alt="Maitreya Sangha Israel"
        className="h-12 md:h-16 object-contain"
      />
    </a>
  </header>
);

const HeroSection = ({ title, description }: { title: string; description: string }) => (
  <section
    className="relative overflow-hidden py-16 md:py-20"
    style={{ background: "var(--spiritual-gradient)" }}
  >
    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 50%, hsl(38 70% 50% / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(260 30% 50% / 0.2) 0%, transparent 50%)",
      }}
    />
    <div className="container mx-auto px-6 text-center relative z-10">
      <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 leading-tight">
        {title}
      </h1>
      {description && (
        <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed mb-3">
          {description}
        </p>
      )}
      <div className="w-16 h-1 bg-accent mx-auto mt-6 rounded-full" />
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
    <p>&copy; {new Date().getFullYear()} Maitreya Sangha Israel. All rights reserved.</p>
  </footer>
);

export default CourseRegister;
