import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

// Rules follow the module manual (LU5): strict equality and braces on every block.
export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      eqeqeq: 'error',
      curly: 'error',
    },
  },
  {
    // shadcn components export style helpers next to the component, so allow that here only.
    files: ['src/components/ui/**/*.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
])

/* ref
https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file
https://eslint.org/docs/latest/rules/eqeqeq
https://eslint.org/docs/latest/rules/curly
https://github.com/ArnaudBarre/eslint-plugin-react-refresh
*/
