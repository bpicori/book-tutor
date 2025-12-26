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
      includeAssets: ["vite.svg"],
      manifest: {
        name: "Book Tutor",
        short_name: "BookTutor",
        description: "Read books with AI assistance",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/book-tutor/",
        start_url: "/book-tutor/",
        icons: [
          {
            src: "icons/icon-192x192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "icons/icon-512x512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
          {
            src: "icons/icon-512x512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
