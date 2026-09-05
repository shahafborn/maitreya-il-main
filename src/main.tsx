import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { capturePrerendered } from "./prerendered";

// Public pages arrive as pre-rendered HTML (scripts/prerender.mjs). Keep that
// markup on screen while the route's code loads - see src/prerendered.ts.
const container = document.getElementById("root")!;
capturePrerendered(container);
createRoot(container).render(<App />);
