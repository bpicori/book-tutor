import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Plugin to fix Vite's glob detection issue in foliate-js/pdf.js
// Transforms `vendor/pdfjs/${path}` to `./vendor/pdfjs/${path}` in new URL() calls
function fixPdfjsGlobPattern() {
  return {
    name: "fix-pdfjs-glob-pattern",
    enforce: "pre", // Run before other plugins, especially before import-glob
    transform(code, id) {
      // Only process the specific file that has the issue
      if (id.includes("foliate-js/pdf.js")) {
        // Transform the problematic pattern: `vendor/pdfjs/${path}` -> `./vendor/pdfjs/${path}`
        // This fixes Vite's glob detection which requires paths to start with '/' or './'
        const transformed = code.replace(
          /new URL\(`vendor\/pdfjs\/\$\{path\}`/g,
          "new URL(`./vendor/pdfjs/${path}`"
        );
        return transformed !== code ? { code: transformed, map: null } : null;
      }
      return null;
    },
  };
}

export default defineConfig({
  base: "/book-tutor/",
  plugins: [
    fixPdfjsGlobPattern(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/book.svg",
        "icons/apple-touch-icon-180x180.png",
        "icons/favicon-32x32.png",
        "icons/favicon-16x16.png",
        "icons/logo-192.png",
        "favicon.ico",
      ],
      manifest: {
        name: "Book Tutor",
        short_name: "Book Tutor",
        description:
          "A local-first EPUB reader with a reading guide in the margin: spoiler-free chapter previews, answers about the chapter you're in, read-aloud, and a personal lexicon.",
        theme_color: "#f9f8f5",
        background_color: "#f9f8f5",
        display: "standalone",
        scope: "/book-tutor/",
        start_url: "/book-tutor/",
        icons: [
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // The sample book is fetched on demand, then kept so the demo still
        // opens after the app has been installed and taken offline.
        runtimeCaching: [
          {
            urlPattern: /\/demo\/.*\.epub$/,
            handler: "CacheFirst",
            options: {
              cacheName: "sample-book",
              expiration: { maxEntries: 2 },
            },
          },
        ],
      },
    }),
  ],
});
