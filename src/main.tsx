import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Tokens were extracted and hash cleared by inline script in index.html
// BEFORE the Supabase client initialized. Now pick them up from sessionStorage.
const raw = sessionStorage.getItem("__oauth_tokens");
if (raw) {
  sessionStorage.removeItem("__oauth_tokens");
  const tokens = JSON.parse(raw);

  // Dynamically import supabase client to call setSession after client is ready
  import("@/integrations/supabase/client").then(({ supabase }) => {
    console.log("[AUTH] Setting session from stored tokens...");
    // Small delay to let the client finish its own initialization
    setTimeout(() => {
      supabase.auth
        .setSession(tokens)
        .then((result) => {
          console.log("[AUTH] setSession result:", result.error ? result.error.message : "success");
          createRoot(document.getElementById("root")!).render(<App />);
        })
        .catch((err) => {
          console.error("[AUTH] setSession failed:", err);
          createRoot(document.getElementById("root")!).render(<App />);
        });
    }, 100);
  });
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
