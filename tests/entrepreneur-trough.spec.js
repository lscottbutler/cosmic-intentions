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
    await frame.getByRole('tab', { name: 'ACTION', exact: true }).click();
    // Visual preflight only: render Scott's requested variant before changing the locked baseline.
    await page.addStyleTag({ content: '.deck.ent-card-trough::before{background:#fff}.deck.ent-card-trough #lfmToolControls{visibility:hidden}' });
    await page.locator('.deck').evaluate(el => el.classList.add('ent-card-trough'));
    const deck = page.locator('.deck');
    await expect.poll(() => deck.evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe('rgb(255, 255, 255)');
    await expect(page.locator('#lfmToolControls')).toBeHidden();
    await expect(deck.getByRole('button')).toHaveCount(0);
    const geometry = await deck.evaluate(el => ({ height: el.getBoundingClientRect().height, curve: getComputedStyle(el, '::before').borderBottomLeftRadius, frame: getComputedStyle(el).backgroundColor }));
    expect(geometry.height).toBeGreaterThan(200);
    expect(geometry.curve).not.toBe('0px');
    expect(geometry.frame).toBe('rgb(30, 144, 255)');
    await expect.poll(() => page.locator('#capTitle').evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe('rgb(116, 116, 116)');
    await deck.screenshot({ path: testInfo.outputPath(`ent-white-trough-${viewport.name}.png`) });
    await page.screenshot({ path: testInfo.outputPath(`ent-white-player-${viewport.name}.png`), fullPage: true });
    // The live routing checks are added after this preflight is visually approved.
    expect(errors).toEqual([]);
  });
}
