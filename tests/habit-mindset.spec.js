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
    // Simulate a stale account response restoring an empty daily record during
    // the return navigation. The same-day return snapshot must retain our tick.
    if (new URL(location.href).searchParams.get('entry') === 'habits-return'
      && sessionStorage.getItem('ci_habit_support_v1:preview')) {
      const d = new Date();
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      localStorage.setItem(`ci_habits_${day}`, '{}');
    }
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
    // Wait for the embedded route's responsive layout to settle after it appears.
    await expect.poll(() => frame.locator('.habit-daily-grid').first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), { timeout: 10000 })
      .toBe(viewport.name === 'mobile' ? 1 : 2);
    const overflow = await card.evaluate(el => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const periodMenu = frame.getByRole('navigation', { name: 'Habit time of day' });
    await expect(periodMenu.locator('.habit-period-label')).toHaveText(['MORNING', 'DAY', 'EVENING', 'BEFORE SLEEP']);
    expect(await periodMenu.evaluate(el => ({
      previous: el.previousElementSibling.classList.contains('setup-page-header'),
      next: el.nextElementSibling.classList.contains('ci-habit-mindset'),
      columns: getComputedStyle(el).gridTemplateColumns.split(' ').length,
      overflow: el.scrollWidth - el.clientWidth,
    }))).toEqual({ previous: true, next: true, columns: 4, overflow: 0 });
    await expect(periodMenu.getByRole('button', { name: 'MORNING', exact: true }).locator('.habit-period-circle')).toHaveCSS('border-top-color', 'rgb(255, 255, 255)');
    for (const [label, cat] of [['DAY', 'DAY'], ['EVENING', 'EVENING'], ['BEFORE SLEEP', 'BEDTIME'], ['MORNING', 'MORNING']]) {
      const section = frame.locator(`#habit-period-${cat}`);
      await section.evaluate(el => { el.open = false; });
      await periodMenu.getByRole('button', { name: label, exact: true }).click();
      await expect(section).toHaveAttribute('open');
      await expect(section.locator('summary')).toBeFocused();
      await expect(periodMenu.locator('[aria-current="location"] .habit-period-label')).toHaveText(label);
    }
    await expect(frame.locator('#habit-period-EVENING')).toContainText('No habits in this section yet');
    await expect(frame.locator('#habit-period-BEDTIME')).toContainText('No habits in this section yet');
    expect(await periodMenu.evaluate(() => JSON.parse(localStorage.getItem('ci_habit_list')).length)).toBe(2);
    await periodMenu.scrollIntoViewIfNeeded();
    await periodMenu.screenshot({ path: testInfo.outputPath(`habit-period-menu-${viewport.name}.png`) });
    await page.screenshot({ path: testInfo.outputPath(`habit-period-placement-${viewport.name}.png`), fullPage: false });
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`habits-mindset-${viewport.name}.png`), fullPage: true });

    for (const [label, key] of links) {
      const link = card.getByRole('link', { name: new RegExp(label) });
      const box = await link.boundingBox();
      expect(box.width).toBeGreaterThan(100);
      expect(box.height).toBeGreaterThanOrEqual(44);
      await link.click();
      await expect(page).toHaveURL(new RegExp('start=ent-card'));
      await expect(frame.locator('#ent-tab-mindset')).toHaveAttribute('aria-selected', 'true', { timeout: 15000 });
      await expect(frame.locator('[data-panel="mindset"]')).toBeVisible();
      expect(new URL(page.url()).searchParams.get('ent')).toBe(key);
      await expect(frame.locator('.ent-habit-context')).toHaveCount(0);
      await frame.getByRole('link', { name: 'Return to Habits' }).click();
      await expect(card).toBeVisible({ timeout: 15000 });
    }

    // Checklist rows stay compact; support is available through the mindset card.
    const checklist = frame.locator('#habitsWidget');
    await expect(checklist.getByRole('link')).toHaveCount(0);
    await expect(checklist).not.toContainText('Help me follow through');
    await expect(checklist).toContainText('Write for 20 minutes');
    await expect(checklist).toContainText('Read a chapter');
    await expect(checklist.locator('span[title]')).toHaveCount(0);
    expect(await checklist.evaluate(() => JSON.parse(localStorage.getItem('ci_habit_list')).map(h => h.domain))).toEqual(['Writing', 'Reading']);
    await checklist.scrollIntoViewIfNeeded();
    await checklist.screenshot({ path: testInfo.outputPath(`habits-clean-checklist-${viewport.name}.png`) });
    await page.screenshot({ path: testInfo.outputPath(`habits-clean-placement-${viewport.name}.png`), fullPage: false });
    // Returning from the retained mindset card still preserves ticks and sections.
    await frame.locator('[data-habit-section="DAY"] summary').click();
    await checklist.locator('button[title="Mark done"]').first().click();
    await expect(checklist.locator('button[title="Done — tap to undo"]')).toHaveCount(1);
    await card.getByRole('link', { name: /Build a habit that sticks/ }).click();
    await expect(frame.locator('[data-panel="mindset"]')).toBeVisible({ timeout: 15000 });
    await frame.getByRole('link', { name: 'Return to Habits' }).click();
    await expect(checklist.locator('button[title="Done — tap to undo"]')).toHaveCount(1, { timeout: 15000 });
    await expect(frame.locator('[data-habit-section="DAY"]')).not.toHaveAttribute('open');
    await expect(card.getByRole('link', { name: /Build a habit that sticks/ })).toBeFocused({ timeout: 7000 });
    await expect(checklist.getByRole('link')).toHaveCount(0);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(frame.locator('#habitsWidget button[title="Done — tap to undo"]')).toHaveCount(1, { timeout: 15000 });
    await frame.getByRole('button', { name: 'Edit habits', exact: true }).click();
    await expect(frame.locator('#habitsEditorView')).toBeVisible();
    await frame.getByRole('button', { name: 'Back to daily checklist', exact: true }).click();
    await expect(frame.locator('#habitsDailyView')).toBeVisible();
    await frame.getByRole('button', { name: 'Edit habits', exact: true }).click();
    await periodMenu.getByRole('button', { name: 'BEFORE SLEEP', exact: true }).click();
    await expect(frame.locator('#habitsEditorView')).toBeHidden();
    await expect(frame.locator('#habit-period-BEDTIME')).toHaveAttribute('open');
    await expect(frame.locator('#habitsWidget button[title="Done — tap to undo"]')).toHaveCount(1);
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
