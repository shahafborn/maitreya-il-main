import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session, AuthResponse } from "@supabase/supabase-js";
import { getCountryCode } from "@/hooks/useCountryCode";
import { OAUTH_REDIRECT_KEY, buildCallbackUrl } from "@/lib/authRedirect";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isRecovery: boolean;
  clearRecovery: () => void;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const trackedSessionRef = useRef<string | null>(null);
  const clearRecovery = () => setIsRecovery(false);

  useEffect(() => {
    // Read session from localStorage / URL hash before listening for changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === "PASSWORD_RECOVERY") {
          setIsRecovery(true);
        }

        if (event === "SIGNED_IN" && session) {
          // Track sign-in event (once per session to avoid duplicates on token refresh)
          if (trackedSessionRef.current !== session.access_token) {
            trackedSessionRef.current = session.access_token;
            trackSignIn();
          }

          // Sync Google OAuth signups to MailChimp (first login only)
          if (session.user?.app_metadata?.provider === "google") {
            const created = new Date(session.user.created_at).getTime();
            const now = Date.now();
            if (now - created < 60_000 && session.user.email) {
              syncToMailChimp(session.user.email);
            }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const trackSignIn = () => {
    getCountryCode()
      .then((code) => supabase.rpc("track_sign_in", { _country_code: code }))
      .catch((err) => console.warn("Sign-in tracking failed (non-blocking):", err));
  };

  const syncToMailChimp = (email: string) => {
    supabase.functions.invoke("mailchimp-sync", {
      body: { email },
    }).catch((err) => console.warn("MailChimp sync failed (non-blocking):", err));
  };

  const signUp = async (email: string, password: string) => {
    const result = await supabase.auth.signUp({ email, password });
    if (result.data.user) {
      syncToMailChimp(email);
    }
    return result;
  };

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.data.user) {
      supabase.from("profiles")
        .update({ last_sign_in: new Date().toISOString() })
        .eq("id", result.data.user.id)
        .then(({ error }) => {
          if (error) console.warn("Failed to update last_sign_in:", error.message);
        });
    }
    return result;
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    // Store the intended destination so /auth/callback can navigate there.
    // localStorage is lost when the sign-in finishes in a different browser
    // than it started in (phones, where a link opened inside WhatsApp or Gmail
    // hands the OAuth round trip to Safari or Chrome), so the destination also
    // rides along in the callback address itself.
    if (redirectTo) {
      localStorage.setItem(OAUTH_REDIRECT_KEY, redirectTo);
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: buildCallbackUrl(redirectTo) },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + import.meta.env.BASE_URL + "reset-password",
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isRecovery, clearRecovery, signUp, signIn, signInWithGoogle, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
