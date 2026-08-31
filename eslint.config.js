import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// Build tooling that Node executes directly (Vite/PostCSS/Tailwind/ESLint
// configs). These are not browser code, so they get Node globals instead:
// `module`, `require` and `__dirname` are legitimately defined there.
const nodeConfigFiles = [
  '*.config.js',
  'vite.config.js',
  'eslint.config.js',
  'postcss.config.js',
  'tailwind.config.js',
]

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Application source: browser environment.
    files: ['**/*.{js,jsx}'],
    ignores: nodeConfigFiles,
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: nodeConfigFiles,
    languageOptions: {
      globals: globals.node,
    },
  },
])
