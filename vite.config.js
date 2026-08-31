import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // jsdom, not node: these are component tests that touch document,
    // localStorage and URL.createObjectURL.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Only the modules under test are measured. Including the whole tree
      // would report a coverage number dominated by untested vendor UI
      // components, which tells nobody anything about the code that matters.
      include: [
        'src/lib/**',
        'src/api/**',
        'src/features/**',
      ],
      exclude: ['**/*.test.{js,jsx}', 'src/test/**'],
    },
  },
})
