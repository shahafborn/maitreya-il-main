import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { siteContentDevApi } from "./vite-plugin-site-content";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/p/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), siteContentDevApi()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
