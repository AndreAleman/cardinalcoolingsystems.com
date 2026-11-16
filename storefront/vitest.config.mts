import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// ESM (.mts): the package is CommonJS and vite 7 is ESM-only.
// Unit tests for pure modules (Cardinal Builder helpers, the shared CPQ core). Run: pnpm test
export default defineConfig({
  // The shared drawing (lib/cpq/shared/drawing/*.tsx) may be rendered in tests.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "@modules": fileURLToPath(new URL("./src/modules", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
