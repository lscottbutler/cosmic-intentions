import { test, expect } from '@playwright/test';

const cardURL = '/players/master-player.html?start=ent-card&ent=STRONG%20WORK%20ETHIC&preview=1';
const key = 'ci_ent_player_v1:preview:STRONG WORK ETHIC';
async function openCard(page) {
  await page.route('**/*.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto(cardURL, { waitUntil: 'domcontentloaded' });
  const frame = page.frameLocator('#experienceFrame');
  await expect(frame.locator('#entExperience')).toBeVisible({ timeout: 15000 });
  return frame;
}
const saved = frame => frame.locator('#entExperience').evaluate(k => JSON.parse(localStorage.getItem(k)), key);
async function noOverflow(root) {
  expect(await root.evaluate(el => [...el.querySelectorAll('*')].filter(n => n.getClientRects().length && n.getBoundingClientRect().right > el.getBoundingClientRect().right + 1).map(n => n.className))).toEqual([]);
}

for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`Entrepreneur notes become persistent goal-linked actions — ${viewport.name}`, async ({ page }, testInfo) => {
    test.setTimeout(90000);
    const errors = [], videoRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/youtube(-nocookie)?\.com/.test(request.url())) videoRequests.push(request.url()); });
    await page.setViewportSize(viewport);
    const frame = await openCard(page);
    const root = frame.locator('#entExperience');
    await frame.getByRole('tab', { name: 'ACTION', exact: true }).click();
    await frame.locator('[data-goal]').selectOption('pv1');
    await frame.locator('#ent-action-note').fill('Prepare tomorrow’s first focused work session.');
    await frame.getByRole('tab', { name: 'MY NOTES', exact: true }).click();
    await expect(frame.locator('#ent-action-note')).toHaveCount(1);
    await expect(frame.locator('#ent-action-note')).toHaveValue('Prepare tomorrow’s first focused work session.');
    await frame.getByRole('button', { name: 'Save note', exact: true }).click();
    const original = (await saved(frame))[0];
    expect(original.kind).toBe('note');
    expect(original.goalId).toBe('pv1');
    await expect(frame.locator('.ent-saved-list [data-record-id]')).toHaveCount(1);
    await frame.getByRole('tab', { name: 'ACTION', exact: true }).click();
    await frame.locator('.ent-action-notes [data-edit-record]').click();
    await frame.locator('#ent-action-note').fill('Before dinner, choose tomorrow’s first task.');
    // Editing/conversion must keep the original goal, even if the selector changes.
    await frame.locator('[data-goal]').selectOption('');
    await frame.getByRole('button', { name: 'Save note changes', exact: true }).click();
    await frame.locator('.ent-action-notes [data-note-to-action]').click();
    expect(await saved(frame)).toEqual([{ ...original, kind: 'action', text: 'Before dinner, choose tomorrow’s first task.' }]);
    await expect(frame.locator('.ent-action-notes [data-record-id]')).toHaveCount(0);
    await frame.locator('.ent-action-list [data-complete-action]').check();
    await expect(frame.locator('.ent-action-list [data-complete-action]')).toBeFocused();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(root).toBeVisible({ timeout: 15000 });
    await frame.getByRole('tab', { name: 'ACTION', exact: true }).click();
    await expect(frame.locator('.ent-action-list [data-complete-action]')).toBeChecked();
    await frame.locator('#ent-action-note').fill('Protect the first 20 minutes on my calendar.');
    await frame.getByRole('button', { name: 'Save my next step', exact: true }).click();
    await frame.locator('#ent-action-note').fill('Starting small makes it easier to show up.');
    await frame.getByRole('button', { name: 'Save note', exact: true }).click();
    await noOverflow(root);
    await root.screenshot({ path: testInfo.outputPath(`notes-actions-${viewport.name}.png`) });
    await frame.locator('.ent-notes-capture').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`notes-player-${viewport.name}.png`), fullPage: true });
    await frame.getByRole('tab', { name: 'MY NOTES', exact: true }).click();
    await expect(frame.locator('.ent-saved-list [data-record-id]')).toHaveCount(3);
    await frame.locator(`.ent-saved-list [data-complete-action="${original.id}"]`).uncheck();
    await expect(frame.locator(`.ent-saved-list [data-complete-action="${original.id}"]`)).not.toBeChecked();
    expect((await saved(frame)).find(r => r.id === original.id).done).toBe(false);
    await noOverflow(root);
    await root.screenshot({ path: testInfo.outputPath(`notes-library-${viewport.name}.png`) });
    await frame.locator('.ent-saved-list [data-remove]').first().click();
    expect(await saved(frame)).toHaveLength(2);
    await frame.getByRole('tab', { name: 'ACTION', exact: true }).click();
    await expect(frame.locator('.ent-action-notes [data-record-id]')).toHaveCount(0);
    await frame.locator('button', { hasText: 'NEXT' }).first().click();
    await frame.getByRole('tab', { name: 'ACTION', exact: true }).click();
    await expect(frame.locator('.ent-action-list [data-record-id]')).toHaveCount(0);
    expect(errors).toEqual([]);
    expect(videoRequests).toEqual([]);
  });
}

test('Entrepreneur notes preserve earlier notes and existing next steps', async ({ page }, testInfo) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(({ key }) => {
    if (localStorage.getItem('qa-notes-seeded')) return;
    localStorage.setItem('qa-notes-seeded', 'yes');
    localStorage.setItem('ci_ent_notes', JSON.stringify({ 'STRONG WORK ETHIC': [{ id: 'earlier-note', text: 'Set up my workspace before bed.' }] }));
    localStorage.setItem(key, JSON.stringify([{ id: 'old-action', kind: 'action', text: 'Keep one useful promise.', goalId: 'pv1', goal: 'Synthetic goal' }]));
    localStorage.setItem(key.replace(':preview:', ':other-account:'), JSON.stringify([{ id: 'private-fixture', kind: 'note', text: 'Other account fixture.' }]));
  }, { key });
  const frame = await openCard(page);
  await frame.getByRole('tab', { name: 'MY NOTES', exact: true }).click();
  const before = await frame.locator('#entExperience').evaluate(() => localStorage.getItem('ci_ent_notes'));
  await expect(frame.locator('[data-ent-note-card]')).toContainText('Set up my workspace');
  await expect(frame.locator('#entExperience')).not.toContainText('Other account fixture.');
  await noOverflow(frame.locator('#entExperience'));
  await frame.locator('#entExperience').screenshot({ path: testInfo.outputPath('notes-earlier-mobile.png') });
  await frame.locator('[data-legacy-note]').click();
  await expect(frame.locator('.ent-action-list [data-record-id]')).toHaveCount(2);
  await frame.getByRole('tab', { name: 'MY NOTES', exact: true }).click();
  await frame.locator('[data-legacy-note]').click();
  await expect(frame.locator('.ent-action-list [data-record-id]')).toHaveCount(2);
  await frame.locator('[data-panel="action"] [data-complete-action="old-action"]').check();
  expect((await saved(frame)).find(r => r.id === 'old-action').done).toBe(true);
  expect(await frame.locator('#entExperience').evaluate(() => localStorage.getItem('ci_ent_notes'))).toBe(before);
  expect(await frame.locator('#entExperience').evaluate(k => JSON.parse(localStorage.getItem(k.replace(':preview:', ':other-account:'))), key)).toEqual([{ id: 'private-fixture', kind: 'note', text: 'Other account fixture.' }]);
});

test('Entrepreneur notes keep drafts and saved items when storage fails', async ({ page }) => {
  test.setTimeout(60000);
  const frame = await openCard(page);
  const root = frame.locator('#entExperience');
  await frame.getByRole('tab', { name: 'ACTION', exact: true }).click();
  await frame.locator('#ent-action-note').fill('An idea to turn into action.');
  await frame.getByRole('button', { name: 'Save note', exact: true }).click();
  await frame.locator('#ent-action-note').fill('A step to complete.');
  await frame.getByRole('button', { name: 'Save my next step', exact: true }).click();
  const before = await saved(frame);
  await root.evaluate(() => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) { if (key.startsWith('ci_ent_player_v1:')) throw new Error('Storage blocked'); return write.call(this, key, value); };
  });
  await frame.locator('#ent-action-note').fill('Keep this unsaved idea.');
  await frame.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(frame.locator('[data-status="action"]')).toContainText('Could not save');
  await expect(frame.locator('#ent-action-note')).toHaveValue('Keep this unsaved idea.');
  await frame.locator('.ent-action-notes [data-note-to-action]').click();
  await expect(frame.locator('.ent-action-notes [data-record-id]')).toHaveCount(1);
  // A failed write must roll the checkbox back instead of showing a false completion.
  await frame.locator('.ent-action-list [data-complete-action]').click();
  await expect(frame.locator('.ent-action-list [data-complete-action]')).not.toBeChecked();
  expect(await saved(frame)).toEqual(before);
  await frame.getByRole('tab', { name: 'MY NOTES', exact: true }).click();
  await expect(frame.locator('#ent-action-note')).toHaveValue('Keep this unsaved idea.');
  await frame.locator('.ent-saved-list [data-edit-record]').first().click();
  await expect(frame.locator('[data-status="action"]')).toContainText('Save or clear your current draft');
  await expect(frame.locator('#ent-action-note')).toHaveValue('Keep this unsaved idea.');
});
