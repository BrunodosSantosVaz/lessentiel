import js from '@eslint/js';

export default [
  { ignores: ['.output/**', '.wxt/**', 'node_modules/**', '**/*.ts'] },
  js.configs.recommended,
  { languageOptions: { globals: { console: 'readonly' } } },
];
