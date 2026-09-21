import { defineConfig } from '@playwright/test';

// Smoke tests run against the production build through Vite Preview.
export default defineConfig({
  testDir: 'tests',
  timeout: 30000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8090',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:8090',
    timeout: 120000,
    reuseExistingServer: true,
  },
});
