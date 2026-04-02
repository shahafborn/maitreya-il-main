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
  const { resetPassword, isRecovery, clearRecovery } = useAuth();

  const [mode, setMode] = useState<"request" | "reset" | "success">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Use the context flag set by AuthProvider (catches early PASSWORD_RECOVERY events)
  useEffect(() => {
    if (isRecovery) {
      setMode("reset");
      setError("");
    }
  }, [isRecovery]);

  // Backup: listen for PASSWORD_RECOVERY in case it fires after mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setError("");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fallback: check URL hash for type=recovery
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("reset");
      setError("");
    }
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
      setError("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        clearRecovery();
        setMode("success");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <header className="py-4 px-6 flex justify-center border-b border-border bg-card">
        <a href="https://maitreya.org.il/">
          <img src={maitreyaLogo} alt="Maitreya Sangha Israel" className="h-12 md:h-16 object-contain" />
        </a>
      </header>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6 max-w-md">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">

            {mode === "request" && !emailSent && (
              <>
                <h2 className="font-heading text-2xl font-bold text-primary text-center mb-2">
                  Reset Password
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Enter your email address and we'll send you a reset link
                </p>

                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
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
                    {submitting ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to login
                  </Link>
                </div>
              </>
            )}

            {mode === "request" && emailSent && (
              <>
                <h2 className="font-heading text-2xl font-bold text-primary text-center mb-2">
                  Check Your Email
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  We sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Didn't receive it? Check your spam folder or{" "}
                  <button
                    onClick={() => setEmailSent(false)}
                    className="text-accent hover:underline"
                  >
                    try again
                  </button>
                </p>
              </>
            )}

            {mode === "reset" && (
              <>
                <h2 className="font-heading text-2xl font-bold text-primary text-center mb-2">
                  Choose a New Password
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Enter your new password below
                </p>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Re-enter your password"
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
                    {submitting ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </>
            )}

            {mode === "success" && (
              <>
                <h2 className="font-heading text-2xl font-bold text-primary text-center mb-2">
                  Password Updated Successfully
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  You can now sign in with your new password
                </p>
                <Link to="/">
                  <Button className="w-full font-bold py-3 text-base rounded-full shadow-md bg-accent hover:bg-accent/90 text-accent-foreground">
                    Back to Login
                  </Button>
                </Link>
              </>
            )}

          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>&copy; {new Date().getFullYear()} Maitreya Sangha Israel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ResetPassword;
