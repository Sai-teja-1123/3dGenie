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
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'ui-vendor': ['lucide-react', 'react-icons', 'tailwind-merge', 'clsx'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'utils-vendor': ['date-fns', 'recharts'],
        },
      },
    },
    // Enable compression and optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Disable source maps in production for smaller builds
    sourcemap: false,
  },
  // Optimize dependencies pre-bundling
  // Include Three.js libs so they use same React version (fixes ConcurrentRoot error)
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
    ],
  },
});
