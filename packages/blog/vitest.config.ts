import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.d.ts", "src/__tests__/**"],
    },
  },
  resolve: {
    alias: {
      "@sbozh/blog": path.resolve(__dirname, "./src"),
    },
  },
});
