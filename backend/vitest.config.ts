/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Ignore non-logic files + generated code
      exclude: [
        "convex/_generated/**",
        "convex/schema.ts",
        "convex/crons.ts",
        "convex/auth.config.ts",
        "**/__tests__/**/mocks/**",
        "**/test/**"
      ],
    },
  },
});
