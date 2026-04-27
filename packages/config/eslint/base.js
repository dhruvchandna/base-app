import js from '@eslint/js'
import turbo from 'eslint-config-turbo/flat'
import tseslint from 'typescript-eslint'

/** @type {import('typescript-eslint').Config} */
export default tseslint.config(
  js.configs.recommended,
  ...turbo,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['dist/**', '.next/**', 'node_modules/**', '*.config.*'],
  },
)
