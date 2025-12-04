import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}", "**/*.d.ts", "src/__tests__/**"],
    },
  },
  resolve: {
    alias: {
      "@sbozh/pmdxjs": path.resolve(__dirname, "./src"),
    },
  },
});
