import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(new URL("./frontend/package.json", import.meta.url));
const { FlatCompat } = require("@eslint/eslintrc");

const frontendDir = fileURLToPath(new URL("./frontend", import.meta.url));

const compat = new FlatCompat({
  baseDirectory: frontendDir,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "../backend/**",
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  // Relax strict TS rules for test files only
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "src/test/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];

export default eslintConfig;
