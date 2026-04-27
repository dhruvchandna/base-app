import nextConfig from '@base-app/eslint-config/next'

/** @type {import('typescript-eslint').Config} */
export default [
  ...nextConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]
