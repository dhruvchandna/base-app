import reactPlugin from 'eslint-plugin-react'
import hooksPlugin from 'eslint-plugin-react-hooks'
import baseConfig from './base.js'
import tseslint from 'typescript-eslint'

/** @type {import('typescript-eslint').Config} */
export default tseslint.config(...baseConfig, {
  plugins: {
    react: reactPlugin,
    'react-hooks': hooksPlugin,
  },
  rules: {
    ...hooksPlugin.configs.recommended.rules,
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
  },
})
