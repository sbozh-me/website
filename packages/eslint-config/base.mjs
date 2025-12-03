import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import noCyrillicString from "eslint-plugin-no-cyrillic-string";
import perfectionist from "eslint-plugin-perfectionist";
import prettier from "eslint-plugin-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      import: importPlugin,
      "no-cyrillic-string": noCyrillicString,
      perfectionist: perfectionist,
      prettier: prettier,
    },
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unnecessary-type-constraint": "off",
      "@typescript-eslint/no-unused-vars": ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        vars: 'all',
      }],
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],
      "import/order": [
        "error",
        {
          alphabetize: {
            order: "asc",
          },
          groups: [
            ["builtin", "external"],
            ["internal", "parent", "sibling", "index"],
            "object",
            "type",
          ],
          "newlines-between": "always",
          warnOnUnassignedImports: true,
        },
      ],
      "import/no-unresolved": 0,
      "perfectionist/sort-named-imports": [
        "error",
        {
          type: "alphabetical",
          order: "asc",
          groupKind: "values-first",
        },
      ],
      "perfectionist/sort-exports": [
        "error",
        {
          type: "alphabetical",
          order: "asc",
          groupKind: "types-first",
        },
      ],
      "perfectionist/sort-named-exports": [
        "error",
        {
          type: "alphabetical",
          order: "asc",
          groupKind: "types-first",
        },
      ],
      "no-async-promise-executor": 0,
      "prefer-spread": "off",
    },
  }
);
