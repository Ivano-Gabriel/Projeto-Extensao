import {defineConfig} from '@playwright/test'
export default defineConfig({
  testDir:'.',testMatch:'staging.spec.ts',timeout:60000,expect:{timeout:15000},reporter:'list',
  use:{baseURL:process.env.QA_BASE_URL||'https://extensao-estudos.vercel.app',
    browserName:'chromium',viewport:{width:1366,height:768},trace:'retain-on-failure',screenshot:'only-on-failure'},
  outputDir:'../../test-results/playwright-staging',workers:1,
})
