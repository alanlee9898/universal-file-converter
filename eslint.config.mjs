import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  { ignores: ["**/.next/**", "out/**", "dist/**", "node_modules/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "jsx-a11y/alt-text": "warn",
      "prefer-const": "warn",
      // Allow CommonJS require in plain JS config/scripts via override below
    },
  },
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
];

export default eslintConfig;
