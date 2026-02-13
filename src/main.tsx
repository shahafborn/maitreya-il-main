import { createRoot } from "react-dom/client";
import { supabase } from "@/integrations/supabase/client";
import App from "./App.tsx";
import "./index.css";

// Handle OAuth tokens in URL hash fragment BEFORE React mounts.
// After Google OAuth on the published URL, Supabase redirects back with
// #access_token=...&refresh_token=... in the URL. We parse and apply them
// here so the session is established before any component renders.
const hash = window.location.hash;
if (hash && hash.includes("access_token=")) {
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (accessToken && refreshToken) {
    // Clear hash immediately to prevent re-processing
    window.history.replaceState(null, "", window.location.pathname);

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(() => {
        createRoot(document.getElementById("root")!).render(<App />);
      })
      .catch((err) => {
        console.error("Failed to set session from URL tokens:", err);
        createRoot(document.getElementById("root")!).render(<App />);
      });
  } else {
    createRoot(document.getElementById("root")!).render(<App />);
  }
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
