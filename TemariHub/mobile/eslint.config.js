// @ts-check
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

/** Domains must be imported only through their public barrel (`index.ts`). */
const domainDeepImportPattern = {
  group: ['@/domains/*/**', '@/domains/*/*'],
  message:
    'Import domains only through their public API, e.g. `@/domains/identity`. Use relative imports inside the same domain.',
};

module.exports = defineConfig([
  ...expoConfig,
  prettier,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'web-build/**',
      'android/**',
      'ios/**',
      'e2e/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [domainDeepImportPattern],
        },
      ],
    },
  },
  {
    // Domain barrels may re-export internals; screens/routes stay on the public API.
    files: ['src/domains/*/index.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]);
