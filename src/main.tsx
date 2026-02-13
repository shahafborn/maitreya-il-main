import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Extract OAuth tokens from hash BEFORE mounting, but don't call setSession here.
// Pass them to App so setSession runs after React is fully mounted.
const hash = window.location.hash;
let pendingTokens: { access_token: string; refresh_token: string } | null = null;

if (hash && hash.includes("access_token=")) {
  console.log("[AUTH DEBUG] Found access_token in hash, extracting...");
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (accessToken && refreshToken) {
    pendingTokens = { access_token: accessToken, refresh_token: refreshToken };
    // Clear hash immediately to prevent re-processing
    window.history.replaceState(null, "", window.location.pathname);
    console.log("[AUTH DEBUG] Tokens extracted, hash cleared. Will setSession after mount.");
  }
}

createRoot(document.getElementById("root")!).render(
  <App pendingOAuthTokens={pendingTokens} />
);
