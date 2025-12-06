import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

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
          "new URL(`./vendor/pdfjs/${path}`",
        )
        return transformed !== code ? { code: transformed, map: null } : null
      }
      return null
    },
  }
}

export default defineConfig({
  plugins: [fixPdfjsGlobPattern(), react()],
})
