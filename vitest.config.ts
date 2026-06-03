import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Manual `@/` alias (mirrors tsconfig paths) so tests resolve repo imports
// without pulling in vite-tsconfig-paths. Node environment — these are pure
// unit tests, no DOM.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
