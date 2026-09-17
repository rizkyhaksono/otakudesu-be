import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Vendored, pre-built third-party bundle — not source we own or wrote.
      "public/vendor/**",
    ],
  },
  ...coreWebVitals,
  ...nextTypescript,
  // eslint-config-next sets react.version to "detect", which calls the removed
  // context.getFilename() under ESLint 10.
  {
    settings: {
      react: { version: "19.2" },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      "object-shorthand": "warn",
    },
  },
];

export default config;
