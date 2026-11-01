import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'coverage/', 'reports/', '.stryker-tmp/', '_site/'] },
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['*.config.js'],
    languageOptions: { globals: globals.node },
  },
];
