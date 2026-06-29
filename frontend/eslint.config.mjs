// ESLint flat config — Next.js 16 đã bỏ `next lint`.
// Dùng trực tiếp plugin (@next/eslint-plugin-next + typescript-eslint + react-hooks)
// thay vì FlatCompat, vì FlatCompat gặp circular structure với @typescript-eslint v8.
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  // Bỏ qua các thư mục không cần lint
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "prisma/migrations/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "check-ts-eslint.mjs",
    ],
  },
  // TypeScript rules (recommended + stylistic nhẹ)
  ...tseslint.configs.recommended,
  // Next.js plugin (core-web-vitals thay thế = tổ hợp react + jsx-a11y + next)
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  // React Hooks rules
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Project-specific rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
);
