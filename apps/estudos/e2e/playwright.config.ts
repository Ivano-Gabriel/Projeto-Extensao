import {defineConfig} from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  testIgnore: 'staging.spec.ts',
  timeout: 45000,
  expect: {timeout: 8000},
  reporter: [['list'],['html',{open:'never',outputFolder:'../../test-results/playwright-report'}]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  outputDir: '../../test-results/playwright',
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url:'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout:60000,
  },
  workers:1,
})
