import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * OAuth callback handler. After Google OAuth completes, Supabase
 * redirects here. We read the stored course slug from localStorage
 * and navigate the user to the correct course page.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const redirect = localStorage.getItem("oauth_redirect");
    localStorage.removeItem("oauth_redirect");

    if (redirect) {
      navigate(redirect, { replace: true });
    } else if (user) {
      // Fallback: if no stored redirect, go to the healing course (legacy default)
      navigate("/heb/healing-online-course", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground font-body">
        Redirecting...
      </div>
    </div>
  );
};

export default AuthCallback;
