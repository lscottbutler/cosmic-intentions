import { test, expect } from '@playwright/test';

const links = [
  ['Build a habit that sticks', 'DISCIPLINED'],
  ['Show up even when motivation drops', 'STRONG WORK ETHIC'],
  ['Make time for what matters', 'MANAGING TIME WISELY'],
  ['Get back on track after missing a day', 'DETERMINED TO SUCCEED'],
  ['Make your routine easier to manage', 'ORGANIZATIONAL SKILLS'],
  ['Become the person your habits support', 'LIVING THE BRAND'],
];

async function seedHabits(page) {
  // Synthetic habits only; never exercise a real account or cloud write.
  await page.route('**/*.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.addInitScript(() => {
    if (!localStorage.getItem('ci_habit_list')) localStorage.setItem('ci_habit_list', JSON.stringify([
      { id: 'qa-write', name: 'Write for 20 minutes', cat: 'MORNING', domain: 'Writing' },
      { id: 'qa-read', name: 'Read a chapter', cat: 'DAY', domain: 'Reading' },
    ]));
  });
}

for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`Habits mindset links and personal follow-through round trip — ${viewport.name}`, async ({ page }, testInfo) => {
    test.setTimeout(150000);
    const errors = [];
    const videoRequests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', req => { if (/youtube(-nocookie)?\.com/.test(req.url())) videoRequests.push(req.url()); });
    await seedHabits(page);
    await page.setViewportSize(viewport);
    await page.goto('/players/master-player.html?start=daily-habits&preview=1', { waitUntil: 'domcontentloaded' });
    const frame = page.frameLocator('#experienceFrame');
    const card = frame.locator('.ci-habit-mindset');
    await expect(card).toBeVisible({ timeout: 15000 });
    await expect(card.getByRole('link')).toHaveCount(6);
    await expect(frame.locator('#page-habits .ci-ph-card')).toHaveCount(0);
    await expect(frame.locator('#habitsDailyView')).toBeVisible();
    const overflow = await card.evaluate(el => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`habits-mindset-${viewport.name}.png`), fullPage: true });

    for (const [label, key] of links) {
      const link = card.getByRole('link', { name: new RegExp(label) });
      const box = await link.boundingBox();
      expect(box.width).toBeGreaterThan(100);
      expect(box.height).toBeGreaterThanOrEqual(44);
      await link.click();
      await expect(page).toHaveURL(new RegExp('start=ent-card'));
      await expect(frame.locator('[data-tab="mindset"]')).toHaveAttribute('aria-selected', 'true', { timeout: 15000 });
      await expect(frame.locator('[data-panel="mindset"]')).toBeVisible();
      expect(new URL(page.url()).searchParams.get('ent')).toBe(key);
      await expect(frame.locator('.ent-habit-context')).toHaveCount(0);
      await frame.getByRole('link', { name: 'Return to Habits' }).click();
      await expect(card).toBeVisible({ timeout: 15000 });
    }

    // Mark one habit complete, collapse another section, and enter support from
    // the actual habit row. Returning must preserve completion and section state.
    await frame.locator('[data-habit-section="DAY"] summary').click();
    await frame.locator('#habitsWidget button[title="Mark done"]').first().click();
    await expect(frame.locator('#habitsWidget button[title="Done — tap to undo"]')).toHaveCount(1);
    await frame.getByRole('link', { name: 'Help me follow through: Write for 20 minutes', exact: true }).click();
    await expect(frame.locator('[data-panel="mindset"]')).toBeVisible({ timeout: 15000 });
    await expect(frame.locator('.ent-habit-context strong')).toHaveText('Write for 20 minutes');
    expect(page.url()).not.toContain('qa-write');
    expect(page.url()).not.toContain('Write');
    await frame.getByRole('button', { name: 'Plan my next repetition' }).click();
    await expect(frame.locator('[data-panel="action"]')).toBeVisible();
    await frame.locator('#ent-action-note').fill('After breakfast, open my document and write for two minutes.');
    await frame.getByRole('button', { name: 'Save my next step', exact: true }).click();
    await frame.getByRole('tab', { name: 'MY NOTES', exact: true }).click();
    await expect(frame.locator('.ent-saved-list')).toContainText('Habit: Write for 20 minutes');
    await expect(frame.locator('.ent-saved-list')).toContainText('After breakfast');
    await frame.getByRole('tab', { name: 'MINDSET', exact: true }).click();
    await frame.locator('.ent-habit-context').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`habit-player-context-${viewport.name}.png`), fullPage: true });
    await frame.getByRole('link', { name: 'Return to Habits' }).click();
    await expect(frame.locator('#habitsWidget button[title="Done — tap to undo"]')).toHaveCount(1, { timeout: 15000 });
    await expect(frame.locator('[data-habit-section="DAY"]')).not.toHaveAttribute('open');
    await expect(frame.getByRole('link', { name: 'Help me follow through: Write for 20 minutes', exact: true })).toBeFocused({ timeout: 7000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(frame.locator('#habitsWidget button[title="Done — tap to undo"]')).toHaveCount(1, { timeout: 15000 });
    await frame.getByRole('button', { name: 'Edit habits', exact: true }).click();
    await expect(frame.locator('#habitsEditorView')).toBeVisible();
    await frame.getByRole('button', { name: 'Back to daily checklist', exact: true }).click();
    await expect(frame.locator('#habitsDailyView')).toBeVisible();
    expect(videoRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('Habits links still navigate with session storage unavailable', async ({ page }) => {
  await seedHabits(page);
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key.startsWith('ci_habit_support_v1:')) throw new DOMException('Blocked', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.goto('/players/master-player.html?start=daily-habits&preview=1', { waitUntil: 'domcontentloaded' });
  const frame = page.frameLocator('#experienceFrame');
  await frame.getByRole('link', { name: /Build a habit that sticks/ }).click({ timeout: 15000 });
  await expect(frame.locator('[data-panel="mindset"]')).toBeVisible({ timeout: 15000 });
  await frame.getByRole('link', { name: 'Return to Habits' }).click();
  await expect(frame.locator('#habitsDailyView')).toBeVisible({ timeout: 15000 });
});
