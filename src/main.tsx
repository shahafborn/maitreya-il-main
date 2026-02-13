import { createRoot } from "react-dom/client";
import { supabase } from "@/integrations/supabase/client";
import App from "./App.tsx";
import "./index.css";

// Handle OAuth tokens in URL hash fragment BEFORE React mounts.
// After Google OAuth on the published URL, Supabase redirects back with
// #access_token=...&refresh_token=... in the URL. We parse and apply them
// here so the session is established before any component renders.
const hash = window.location.hash;
console.log("[AUTH DEBUG] Hash fragment:", hash ? hash.substring(0, 50) + "..." : "(empty)");
console.log("[AUTH DEBUG] Full URL:", window.location.href.substring(0, 100) + "...");

if (hash && hash.includes("access_token=")) {
  console.log("[AUTH DEBUG] Found access_token in hash, parsing...");
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  console.log("[AUTH DEBUG] Access token found:", !!accessToken);
  console.log("[AUTH DEBUG] Refresh token found:", !!refreshToken);

  if (accessToken && refreshToken) {
    window.history.replaceState(null, "", window.location.pathname);
    console.log("[AUTH DEBUG] Calling setSession...");

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then((result) => {
        console.log("[AUTH DEBUG] setSession SUCCESS:", result.data?.session ? "session established" : "no session returned");
        console.log("[AUTH DEBUG] setSession error:", result.error);
        createRoot(document.getElementById("root")!).render(<App />);
      })
      .catch((err) => {
        console.error("[AUTH DEBUG] setSession EXCEPTION:", err);
        createRoot(document.getElementById("root")!).render(<App />);
      });
  } else {
    console.log("[AUTH DEBUG] Missing tokens, rendering without session");
    createRoot(document.getElementById("root")!).render(<App />);
  }
} else {
  console.log("[AUTH DEBUG] No hash tokens found, normal render");
  createRoot(document.getElementById("root")!).render(<App />);
}
