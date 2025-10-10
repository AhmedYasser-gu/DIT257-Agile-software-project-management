import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const r = (p: string) => resolve(__dirname, p);

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"], 
    css: true,
    restoreMocks: true,
    mockReset: true,
    typecheck: { tsconfig: "./tsconfig.test.json" },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/convexApi.ts", "src/**/_generated/**", "src/app/**", "**/*.d.ts"],
    },
  },
});
