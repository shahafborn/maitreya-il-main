import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// The Supabase client automatically detects OAuth tokens in the URL hash
// (via detectSessionInUrl: true default). No manual parsing needed.
createRoot(document.getElementById("root")!).render(<App />);
