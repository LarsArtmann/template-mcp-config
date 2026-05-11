import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["scripts/**/*.js", "validation/**/*.js", "*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaVersion: "latest",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "off",
      "no-underscore-dangle": "off",
      "no-undef": "off",
    },
  },
  {
    files: ["schemas/**/*.ts"],
    ignores: ["**/node_modules/**"],
  },
  prettier,
];
