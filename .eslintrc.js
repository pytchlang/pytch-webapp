module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
  ],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "react"],
  rules: {
    // The codebase uses "let" to highlight that an object will be
    // mutated, even if the binding itself is unchanged.
    "prefer-const": 0,
    // It is no longer necessary to do _import React from "react"_.
    "react/react-in-jsx-scope": 0,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
