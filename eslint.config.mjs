import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { react },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      eqeqeq: ["error", "always", { null: "ignore" }],
      // The codebase uses "let" to highlight that an object will be
      // mutated, even if the binding itself is unchanged.
      "prefer-const": 0,
      // Allow suitably-named args to be unused.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
  },
];
