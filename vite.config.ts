import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: true, // Listen on all interfaces to allow ngrok
    port: 5173,
    allowedHosts: [
      "b253c8042e3f.ngrok-free.app",
      ".ngrok-free.app", // Allow any ngrok subdomain
      ".ngrok.io", // Allow ngrok.io domains too
    ],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
