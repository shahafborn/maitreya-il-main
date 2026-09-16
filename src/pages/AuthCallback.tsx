import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DEFAULT_DESTINATION,
  OAUTH_REDIRECT_KEY,
  isSafeInternalPath,
  mostRecentCoursePath,
} from "@/lib/authRedirect";

/**
 * OAuth callback handler. After Google OAuth completes, Supabase redirects
 * here and we send the person on to where they were headed.
 *
 * The destination is looked for in two places: the "next" query parameter,
 * which travels with the person even when the sign-in finishes in a different
 * browser than it started in, and localStorage, which does not. When neither
 * has it, we send them to their own most recent course rather than to a fixed
 * page - until 2026-09 the fallback was the free healing video series, a
 * leftover from when that page was the whole site, and it was stranding real
 * course members on a page they had never asked about.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const fromQuery = searchParams.get("next");
    const fromStorage = localStorage.getItem(OAUTH_REDIRECT_KEY);
    localStorage.removeItem(OAUTH_REDIRECT_KEY);

    const requested = [fromQuery, fromStorage].find(isSafeInternalPath);
    if (requested) {
      navigate(requested, { replace: true });
      return;
    }

    if (!user) {
      navigate(DEFAULT_DESTINATION, { replace: true });
      return;
    }

    let cancelled = false;
    mostRecentCoursePath(user.id).then((coursePath) => {
      if (cancelled) return;
      navigate(coursePath ?? DEFAULT_DESTINATION, { replace: true });
    });

    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground font-body">
        Redirecting...
      </div>
    </div>
  );
};

export default AuthCallback;
