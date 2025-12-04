import baseConfig from '@sbozh/eslint-config/base';

const eslintConfig = [
  ...baseConfig,
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
];

export default eslintConfig;
