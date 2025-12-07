import baseConfig from "@sbozh/eslint-config/base";

export default [
  ...baseConfig,
  {
    ignores: ["coverage/**"],
  },
];
