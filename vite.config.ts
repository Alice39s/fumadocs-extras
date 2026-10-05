import tailwindcss from '@tailwindcss/vite'
import { StaleGuardRecorder } from 'tsdown-stale-guard'
import { defineConfig } from 'vite-plus'
import { playwright } from 'vite-plus/test/browser-playwright'

import { PresetCss } from './scripts/preset-css'

export default defineConfig({
  pack: {
    entry: ['src/page-actions/index.ts', 'src/page-actions/base-ui.ts'],
    root: 'src',
    platform: 'browser',
    target: 'es2023',
    // keeps the `'use client'` directive of every module
    unbundle: true,
    fixedExtension: false,
    dts: true,
    exports: {
      customExports: { './css/*': './css/*' },
    },
    publint: true,
    attw: { profile: 'esm-only', level: 'error' },
    plugins: [StaleGuardRecorder(), PresetCss()],
  },

  fmt: {
    semi: false,
    singleQuote: true,
    jsxSingleQuote: false,
    quoteProps: 'consistent',
    arrowParens: 'avoid',
    sortImports: true,
    sortTailwindcss: { stylesheet: './test/tailwind.css' },
    sortPackageJson: true,
    ignorePatterns: ['test/__snapshots__/**', '.e2e/**'],
  },

  lint: {
    plugins: ['oxc', 'typescript', 'unicorn', 'import', 'react', 'jsx-a11y', 'vitest'],
    categories: {
      correctness: 'error',
      suspicious: 'error',
      perf: 'warn',
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    env: { browser: true, node: true, es2026: true },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'typescript/no-floating-promises': 'error',
      'typescript/no-unnecessary-type-assertion': 'error',
      'typescript/consistent-type-imports': 'error',
      'import/no-cycle': 'error',
      'import/no-unassigned-import': ['error', { allow: ['**/*.css'] }],
    },
    overrides: [
      {
        // apps build and checks run one after another on purpose
        files: ['e2e/**'],
        rules: { 'no-await-in-loop': 'off' },
      },
    ],
    // each fixture app is type checked by its own `next build`
    ignorePatterns: ['dist/**', 'test/__snapshots__/**', '.e2e/**', 'e2e/fixture/**'],
  },

  staged: {
    '*': 'vp check --fix',
  },

  plugins: [tailwindcss()],

  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['test/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['test/**/*.browser.test.tsx'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [
              { browser: 'chromium', name: 'light', viewport: { width: 1100, height: 900 } },
              { browser: 'chromium', name: 'mobile', viewport: { width: 390, height: 844 } },
            ],
          },
        },
      },
    ],
  },
})
