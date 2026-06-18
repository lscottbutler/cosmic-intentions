import { test, expect } from '@playwright/test';

// Patterns that are NOT real errors (browser noise / no AI backend on the preview).
const IGNORE = [/ResizeObserver/i, /favicon/i, /\/api\//i, /HTTP 404/i, /Failed to load resource/i];
const isReal = (msg) => !IGNORE.some((re) => re.test(msg));

test.describe('Cosmic Intentions — smoke', () => {
  test('home page loads and titles correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Cosmic Intentions/i);
    await expect(page.locator('.home-hero h1')).toContainText(/Live your vision/i);
  });

  test('boots with no real console errors or page crashes', async ({ page }) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error' && isReal(m.text())) errors.push(m.text()); });
    page.on('pageerror', (e) => { if (isReal(e.message)) errors.push('PAGEERROR: ' + e.message); });
    await page.goto('/');
    await page.waitForTimeout(2500); // let modules boot + init() run
    expect(errors, 'unexpected runtime errors on boot').toEqual([]);
  });

  test('EVERY inline handler is wired (tripwire)', async ({ page }) => {
    let tripwire = '';
    page.on('console', (m) => { if (m.text().includes('[handler-tripwire]')) tripwire = m.text(); });
    await page.goto('/');
    await page.waitForTimeout(2500);
    expect(tripwire, 'tripwire should report all handlers wired').toContain('handlers wired');
    expect(tripwire).not.toContain('NOT wired');
  });

  test('hero call-to-action buttons are present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Get Started Free/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Member Log In/i })).toBeVisible();
  });

  test('Member Log In opens the auth modal', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Member Log In/i }).click();
    await expect(page.locator('#authModal')).toBeVisible();
  });

  test('affirmation slideshow renders on the hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.ent-slideshow-hero')).toBeAttached();
  });
});
