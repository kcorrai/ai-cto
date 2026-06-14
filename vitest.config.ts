import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/lib/**"],
      exclude: ["**/*.test.ts", "**/*.test.tsx"],
      thresholds: {
        "src/lib/billing/**": { lines: 70, functions: 70 },
        "src/lib/auth/**": { lines: 70, functions: 70 },
        "src/lib/scoring/**": { lines: 70, functions: 70 },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
