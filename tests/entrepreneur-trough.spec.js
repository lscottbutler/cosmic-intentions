import { test, expect } from '@playwright/test';

for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`Entrepreneur trough is white and button-free — ${viewport.name}`, async ({ page }, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize(viewport);
    await page.route('**/*.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/players/master-player.html?start=ent-card&ent=STRONG%20WORK%20ETHIC&preview=1', { waitUntil: 'domcontentloaded' });
    const frame = page.frameLocator('#experienceFrame');
    await expect(frame.locator('#entExperience')).toBeVisible({ timeout: 15000 });
    await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'ACTION', exact: true }).click();
    const deck = page.locator('.deck');
    await expect.poll(() => deck.evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe('rgb(255, 255, 255)');
    await expect(page.locator('#lfmToolControls')).toBeHidden();
    await expect(deck.getByRole('button')).toHaveCount(0);
    const geometry = await deck.evaluate(el => ({ height: el.getBoundingClientRect().height, curve: getComputedStyle(el, '::before').borderBottomLeftRadius, frame: getComputedStyle(el).backgroundColor }));
    expect(geometry.height).toBeGreaterThan(200);
    expect(geometry.curve).not.toBe('0px');
    expect(geometry.frame).toBe('rgb(41, 41, 41)');
    await expect.poll(() => page.locator('#capTitle').evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe('rgb(116, 116, 116)');
    await deck.screenshot({ path: testInfo.outputPath(`ent-white-trough-${viewport.name}.png`) });
    await page.screenshot({ path: testInfo.outputPath(`ent-white-player-${viewport.name}.png`), fullPage: true });
    // The style must clear when leaving this card and reapply on return.
    await page.getByRole('button', { name: 'Open site menu', exact: true }).click();
    await page.getByRole('button', { name: 'Cosmic Library', exact: true }).click();
    await expect(page.locator('#experienceFrame')).toHaveAttribute('src', /masterInline=cosmic-library/, { timeout: 15000 });
    await expect(page.locator('#lfmToolControls')).toBeVisible();
    await expect(deck.getByRole('button')).toHaveCount(3);
    await expect.poll(() => deck.evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe('rgb(116, 116, 116)');
    await page.getByRole('button', { name: 'Open site menu', exact: true }).click();
    await page.getByRole('button', { name: 'Entrepreneur Cards', exact: true }).click();
    await expect(frame.locator('#entExperience')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#lfmToolControls')).toBeHidden();
    await expect.poll(() => deck.evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe('rgb(255, 255, 255)');
    await page.getByRole('button', { name: 'Open site menu', exact: true }).click();
    await page.getByRole('button', { name: 'Meditation', exact: true }).click();
    await expect(deck).toHaveClass(/meditation-mode/, { timeout: 15000 });
    await expect.poll(() => deck.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(116, 116, 116)');
    expect(errors).toEqual([]);
  });
}
