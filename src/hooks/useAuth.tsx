import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session, AuthResponse } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

        // Sync Google OAuth signups to MailChimp (first login only)
        if (event === "SIGNED_IN" && session?.user?.app_metadata?.provider === "google") {
          const created = new Date(session.user.created_at).getTime();
          const now = Date.now();
          // If account was created in the last 60 seconds, treat as new signup
          if (now - created < 60_000 && session.user.email) {
            syncToMailChimp(session.user.email);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
    // Store the intended destination so /auth/callback can navigate there
    if (redirectTo) {
      localStorage.setItem("oauth_redirect", redirectTo);
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/p/auth/callback" },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut }}>
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
