import { test, expect } from '@playwright/test';

async function openCard(page) {
  await page.goto('/players/master-player.html?start=ent-card&ent=SELF%20CONFIDENT', { waitUntil: 'domcontentloaded' });
  await page.locator('#experienceFrame').evaluate(el => { el.src = '/?masterInline=ent-card&ent=SELF%20CONFIDENT&lfm=fullheight-1&preview=1'; });
  const frame = page.frameLocator('#experienceFrame');
  await expect(frame.locator('#entExperience')).toBeVisible();
  return frame;
}

async function mockVideo(page) {
  await page.addInitScript(() => {
    window.__entVideo = { time: 0, seeks: [], playing: false, destroyed: false };
    window.YT = { Player: class {
      constructor(el, options) { this.options = options; el.innerHTML = '<div style="color:white;padding:32px">Video API test fixture</div>'; setTimeout(() => options.events.onReady({ target: this }), 0); }
      seekTo(time) { window.__entVideo.time = time; window.__entVideo.seeks.push(time); }
      playVideo() { window.__entVideo.playing = true; }
      pauseVideo() { window.__entVideo.playing = false; }
      getCurrentTime() { return window.__entVideo.time; }
      getPlayerState() { return window.__entVideo.playing ? 1 : 2; }
      destroy() { window.__entVideo.destroyed = true; }
    } };
  });
}

test('Entrepreneur chapters seek, follow playback, save exact moments, persist and replay', async ({ page }) => {
  await mockVideo(page);
  let frame = await openCard(page);
  await frame.locator('[data-moment="2"]').click();
  await expect.poll(() => frame.locator('#entExperience').evaluate(() => window.__entVideo.seeks.at(-1))).toBe(1350);
  await frame.locator('#entExperience').evaluate(() => { window.__entVideo.time = 1775; });
  await expect(frame.locator('[data-moment="3"]')).toHaveAttribute('aria-current', 'true');
  await frame.locator('#ent-moment-note').fill('Draft the question before the call.');
  await frame.getByRole('button', { name: 'Save this moment' }).click();
  await expect(frame.locator('[data-status="moment"]')).toContainText('29:35');
  await frame.getByRole('tab', { name: 'MY NOTES' }).click();
  await expect(frame.locator('.ent-saved-list')).toContainText('Draft the question');
  await expect.poll(() => frame.locator('#entExperience').evaluate(() => window.__entVideo.playing)).toBe(false);
  // Reopen the actual destination with the same browser storage.
  frame = await openCard(page);
  await frame.getByRole('tab', { name: 'MY NOTES' }).click();
  await frame.locator('[data-replay]').click();
  await expect.poll(() => frame.locator('#entExperience').evaluate(() => window.__entVideo.seeks.at(-1))).toBe(1775);
  await frame.getByRole('tab', { name: 'MY NOTES' }).click();
  await frame.getByRole('button', { name: 'Remove saved moment' }).click();
  await expect(frame.locator('[data-replay]')).toHaveCount(0);
});

test('Entrepreneur action, resources and keyboard navigation remain usable without video', async ({ page }) => {
  const frame = await openCard(page);
  await expect(frame.locator('.ent-video iframe')).toHaveCount(0);
  await frame.getByRole('button', { name: 'Podcasts', exact: true }).click();
  await expect(frame.getByRole('link', { name: 'Open this episode' })).toHaveAttribute('href', 'https://www.melrobbins.com/episode/episode-46/');
  await frame.getByRole('button', { name: 'Articles', exact: true }).click();
  await expect(frame.getByRole('link', { name: 'Open this article' })).toHaveAttribute('href', 'https://jamesclear.com/self-confidence');
  await frame.getByRole('tab', { name: 'ACTION', exact: true }).click();
  await frame.getByRole('button', { name: 'Save my next step' }).click();
  await expect(frame.locator('[data-status="action"]')).toContainText('Write the step');
  await frame.locator('#ent-action-note').fill('Send one question tomorrow at 9.');
  await frame.getByRole('button', { name: 'Save my next step' }).click();
  await frame.getByRole('tab', { name: 'ACTION', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(frame.getByRole('tab', { name: 'MINDSET', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(frame.locator('[data-panel="mindset"]')).toContainText('WINNING ATTITUDES');
  await frame.getByRole('tab', { name: 'MY NOTES' }).click();
  await expect(frame.locator('.ent-saved-list')).toContainText('Send one question tomorrow at 9.');
});

test('Entrepreneur storage failure preserves the draft and does not claim success', async ({ page }) => {
  const frame = await openCard(page);
  await frame.locator('#entExperience').evaluate(() => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) { if (key.startsWith('ci_ent_player_v1:')) throw new Error('Storage blocked'); return write.call(this, key, value); };
  });
  await frame.locator('#ent-moment-note').fill('Keep this draft safe.');
  await frame.getByRole('button', { name: 'Save this moment' }).click();
  await expect(frame.locator('[data-status="moment"]')).toContainText('Could not save');
  await expect(frame.locator('#ent-moment-note')).toHaveValue('Keep this draft safe.');
});

test('Entrepreneur unavailable video has a timestamped escape route', async ({ page }) => {
  await page.route('https://www.youtube.com/iframe_api', route => route.abort());
  const frame = await openCard(page);
  await frame.locator('[data-moment="1"]').click();
  await expect(frame.locator('[data-status="moment"]')).toContainText('could not load');
  await expect(frame.locator('[data-watch]')).toHaveAttribute('href', /t=1229s$/);
});

for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`Entrepreneur review renders inside the approved frame — ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const frame = await openCard(page);
    await expect.poll(() => frame.locator('#entLibHost img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    const root = frame.locator('#entExperience');
    const fits = await root.evaluate(el => el.scrollWidth <= el.clientWidth + 1);
    expect(fits).toBe(true);
    await root.screenshot({ path: testInfo.outputPath(`entrepreneur-${viewport.name}-deeper.png`) });
    await frame.getByRole('tab', { name: 'ACTION', exact: true }).click();
    await root.screenshot({ path: testInfo.outputPath(`entrepreneur-${viewport.name}-action.png`) });
    await frame.getByRole('tab', { name: 'MINDSET', exact: true }).click();
    await root.screenshot({ path: testInfo.outputPath(`entrepreneur-${viewport.name}-mindset.png`) });
  });
}
