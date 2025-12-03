import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import { dirname } from "path";
import { fileURLToPath } from "url";

import base from "./base.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  ...base,
  ...compat.extends(
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "next/core-web-vitals"
  ),
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
    },
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname,
    }
  },
];
