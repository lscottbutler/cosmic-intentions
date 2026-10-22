import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

function sdkFixture() {
  const query = new Proxy({}, { get: (_, name) => name === 'then'
    ? resolve => Promise.resolve({ data: [], error: null }).then(resolve)
    : name === 'maybeSingle' ? async () => ({ data: { body: '<p>Fixture administrator text.</p>' }, error: null })
    : name === 'upsert' ? () => { window.__fixtureWrites = (window.__fixtureWrites || 0) + 1; return query; } : () => query });
  window.supabase = { createClient: () => ({ from: () => query,
    auth: { getUser: async () => ({ data: { user: window.__fixtureOwnerEmail ? { id: 'fixture-owner', email: window.__fixtureOwnerEmail } : null } }), getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    channel: () => query, removeChannel() {}, storage: { from: () => query } }) };
}
async function offline(page) {
  // Exercise the real asynchronous SDK loader without an external account.
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname.endsWith('/supabase.min.js')) return route.fulfill({ contentType: 'application/javascript', body: `(${sdkFixture.toString()})();` });
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    if (request.method() !== 'GET') return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"offline test"}' });
    return route.continue();
  });
}
for (const width of [1440, 390]) test(`Deferred startup keeps member navigation and player controls — ${width}`, async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width, height: 1000 }); await offline(page);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/standalone/member-design-test.html?feature=goal-workspace', { waitUntil: 'domcontentloaded' });
  const master = page.frameLocator('#ci-review-frame'), app = master.frameLocator('#experienceFrame');
  await expect(app.locator('#masterPriorityTasks')).toBeVisible();
  await expect(app.locator('#ciMasterPlayerFrame')).not.toHaveAttribute('src', /.+/);
  await expect(app.locator('#ciMeditationMasterPlayerFrame')).not.toHaveAttribute('src', /.+/);
  const header = page.frameLocator('#header-admin-note-frame');
  await expect(header.locator('[data-page-box="3"]')).toContainText('Fixture administrator text.');
  await expect(master.frameLocator('#citadelNoteFrame').locator('body')).toBeEmpty();
  await expect(master.frameLocator('#citadelBottomNoteFrame').locator('body')).toBeEmpty();
  async function open(label) {
    await page.locator('#review-menu-trigger').click();
    await page.locator('#review-menu').getByRole('button', { name: label, exact: true }).click();
  }
  await open('Goals'); await expect(app.locator('#page-setup')).toBeVisible();
  await open('Habits'); await expect(app.locator('#page-habits')).toBeVisible();
  await open('Meditation');
  const play = app.locator('.meditation-start-control');
  await expect(play).toBeEnabled(); await play.click();
  await expect(app.locator('#player')).toHaveAttribute('data-state', 'running');
  await play.click(); await expect(app.locator('#player')).toHaveAttribute('data-state', 'paused');
  await open('Super Viz'); await expect(master.locator('#stage')).toBeVisible();
  await open('NEW GRATITUDE'); await expect(master.locator('#gratitude-master-play')).toBeVisible();
  await open('MY TO DO LIST'); await expect(app.locator('#masterPriorityTasks')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('Normal standalone preview loads its visible master on demand', async ({ page }) => {
  await offline(page);
  await page.goto('/?preview=1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#page-dashboard')).toBeVisible();
  await expect(page.locator('#ciMasterPlayerFrame')).toHaveAttribute('src', /master-player/);
  await expect(page.locator('#ciMeditationMasterPlayerFrame')).not.toHaveAttribute('src', /.+/);
  await page.evaluate(() => window.showPage('meditation'));
  await expect(page.locator('#ciMeditationMasterPlayerFrame')).toHaveAttribute('src', /start=meditation/);
  await expect(page.frameLocator('#ciMeditationMasterPlayerFrame').frameLocator('#experienceFrame').locator('.meditation-start-control')).toBeEnabled();
});

test('Relocated header keeps owner editing and mock save', async ({ page }) => {
  const sdkRequests = [];
  page.on('request', request => { if (request.url().endsWith('/supabase.min.js')) sdkRequests.push(request.url()); });
  const owner = readFileSync('app.js', 'utf8').match(/window\.ciOwnerAccess = currentUser\?\.email === '([^']+)'/)[1];
  await page.addInitScript(email => { window.__fixtureOwnerEmail = email; }, owner);
  await offline(page);
  await page.goto('/standalone/member-design-test.html?feature=goal-workspace', { waitUntil: 'domcontentloaded' });
  const header = page.frameLocator('#header-admin-note-frame');
  const box = header.locator('[data-page-box="3"]');
  await expect(box).toContainText('Fixture administrator text.');
  await box.getByRole('button', { name: /Edit .* Box 3/ }).click();
  await box.getByRole('textbox', { name: 'Edit administrator text' }).fill('Updated fixture text.');
  await box.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(box.locator('.ci-admin-page-box-content')).toHaveText('Updated fixture text.');
  expect(await box.evaluate(() => window.__fixtureWrites)).toBe(1);
  await page.goto('/?masterInline=citadel-note&notePage=goalworkspace&preview=1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-page-box="3"]')).toContainText('Fixture administrator text.');
  const count = sdkRequests.length;
  await page.goto('/?masterInline=citadel-note&notePage=goalworkspace&box=2&preview=1', { waitUntil: 'load' });
  await expect(page.locator('body')).toBeEmpty();
  expect(sdkRequests.length).toBe(count);
});

test('Connection failure gives a visible recovery message', async ({ page }) => {
  await page.route('**/supabase.min.js', route => route.abort());
  await page.goto('/?preview=1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#loadingScreen')).toContainText('could not connect');
});

test('Styles arrive before a slow SDK connection', async ({ page }) => {
  await offline(page);
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/supabase.min.js', async route => { await pending; return route.fallback(); });
  try {
    await page.goto('/?preview=1', { waitUntil: 'commit' });
    await expect(page.locator('#loadingScreen')).toHaveCSS('position', 'fixed');
    await expect(page.locator('#page-dashboard')).toBeHidden();
  } finally { release(); }
  await expect(page.locator('#page-dashboard')).toBeVisible();
});
