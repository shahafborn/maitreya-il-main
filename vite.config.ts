import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { siteContentDevApi } from "./vite-plugin-site-content";
import { langRedirect } from "./vite-plugin-lang-redirect";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), siteContentDevApi(), langRedirect()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
