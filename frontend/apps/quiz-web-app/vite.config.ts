import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

// Strict CSR-only Vite app — client-side rendering only.
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "The Review — Flashcards",
        short_name: "The Review",
        description: "Spaced-repetition flashcard study, offline-ready.",
        theme_color: "#0d0d0d",
        background_color: "#efe9dd",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Precache the app shell plus the study-set index for instant offline.
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}",
          "data/posts.json",
          "data/tags.json",
        ],
        // Exclude the large source logo from precaching.
        globIgnores: ["logo.png"],
        // Per-post / per-tag question files are fetched on demand and cached
        // stale-while-revalidate so visited sets stay available offline.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/data/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "quiz-data",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5180,
  },
  test: {
    // jsdom provides the `window` DOMPurify needs to initialize, plus a DOM for
    // component/markdown rendering tests.
    environment: "jsdom",
  },
});
