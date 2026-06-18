import { defineConfig } from '@playwright/test';

// Smoke tests run against the PRODUCTION build (dist via vite preview), using the
// Edge browser already on this machine (no extra browser download).
export default defineConfig({
  testDir: 'tests',
  timeout: 30000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8090',
    channel: 'msedge',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:8090',
    timeout: 120000,
    reuseExistingServer: true,
  },
});
