import { test, expect } from '@playwright/test';
import { ENT_CARDS } from '../shared/ent-library-content.js';
import { RESOURCE_CATALOG, resourceForCard } from '../shared/entrepreneur-player-resources.js';

async function openCard(page, key = 'SELF CONFIDENT') {
  // Exercise the delivered URL and the Master Player's real frame navigation.
  // Do not replace the iframe URL: that previously hid the blank-frame bug.
  await page.goto(`/players/master-player.html?start=ent-card&ent=${encodeURIComponent(key)}&preview=1`, { waitUntil: 'domcontentloaded' });
  const frame = page.frameLocator('#experienceFrame');
  await expect(frame.locator('#entExperience')).toBeVisible({ timeout: 15000 });
  return frame;
}

test('Entrepreneur link without sample preview shows sign-in instead of an empty frame', async ({ page }, testInfo) => {
  await page.goto('/players/master-player.html?start=ent-card&ent=SELF%20CONFIDENT');
  const frame = page.frameLocator('#experienceFrame');
  await expect(frame.locator('#authModal.open')).toBeVisible();
  await expect(frame.locator('#si-email')).toBeVisible();
  await expect(frame.locator('#btn-signin')).toBeVisible();
  await frame.locator('#btn-signin').click({ trial: true });
  await expect.poll(async () => {
    const outer = await page.locator('#experienceFrame').boundingBox();
    const button = await frame.locator('#btn-signin').boundingBox();
    return !!outer && !!button && button.y + button.height <= outer.y + outer.height;
  }).toBe(true);
  await expect(frame.locator('#entExperience')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('entrepreneur-sign-in.png'), fullPage: true });
});

async function mockVideo(page) {
  await page.addInitScript(() => {
    window.__entVideo = { time: 0, seeks: [], playing: false, destroyed: false };
    window.YT = { Player: class {
      constructor(el, options) { this.options = options; window.__entVideo.videoId = options.videoId; el.innerHTML = '<div style="color:white;padding:32px">Video API test fixture</div>'; setTimeout(() => options.events.onReady({ target: this }), 0); }
      seekTo(time) { window.__entVideo.time = time; window.__entVideo.seeks.push(time); }
      playVideo() { window.__entVideo.playing = true; }
      pauseVideo() { window.__entVideo.playing = false; }
      getCurrentTime() { return window.__entVideo.time; }
      getPlayerState() { return window.__entVideo.playing ? 1 : 2; }
      destroy() { window.__entVideo.destroyed = true; }
    } };
  });
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000, columns: 3 },
  { name: 'mobile', width: 390, height: 844, columns: 2 },
]) {
  test(`Entrepreneur Library is readable, shows cards and returns from the player — ${viewport.name}`, async ({ page }, testInfo) => {
    // This checks 31 lazy images and five real iframe navigations.
    test.setTimeout(90000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto('/players/master-player.html?start=entrepreneur-library&preview=1', { waitUntil: 'domcontentloaded' });
    const frame = page.frameLocator('#experienceFrame');
    const groups = frame.locator('#entrepreneurLibraryGrid .ent-force-sec');
    await expect(groups).toHaveCount(4);
    await expect(groups.first()).toHaveAttribute('open', '');
    await expect(frame.locator('#entrepreneurLibraryGrid .cl-card')).toHaveCount(31);
    await expect(groups.first().locator('.cl-card').first()).toBeVisible();
    await expect(groups.first().locator('.ent-force-sec__bar')).toHaveCSS('color', 'rgb(77, 124, 58)');
    await expect(groups.first().locator('.ent-force-why').first()).toHaveCSS('color', 'rgb(85, 85, 85)');
    const columns = await groups.first().locator('.ent-force-sec__grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(viewport.columns);

    // Check the actual expanded catalog: all artwork loads, fits its tile and
    // has a usable hit target. A count of hidden DOM nodes missed this defect.
    for (let i = 0; i < 4; i++) {
      const group = groups.nth(i);
      if (i) await group.locator('summary').click();
      const cards = group.locator('.cl-card');
      for (let j = 0; j < await cards.count(); j++) {
        const card = cards.nth(j);
        await card.scrollIntoViewIfNeeded();
        await expect(card).toBeVisible();
        await expect.poll(() => card.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
        const box = await card.boundingBox();
        expect(box.width).toBeGreaterThan(100);
        expect(box.height).toBeGreaterThan(44);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }
      if (i) await group.locator('summary').click();
    }
    await groups.first().locator('summary').scrollIntoViewIfNeeded();
    await expect.poll(async () => {
      const outer = await page.locator('#experienceFrame').boundingBox();
      const content = await frame.locator('#page-entrepreneurlibrary').boundingBox();
      return outer && content ? outer.height - content.height : 9999;
    }).toBeLessThan(40);
    await page.screenshot({ path: testInfo.outputPath(`entrepreneur-library-${viewport.name}.png`), fullPage: true });

    await groups.first().locator('.cl-card').first().click();
    await expect(frame.locator('#entExperience h2')).toHaveText('DISCIPLINED');
    await frame.getByRole('button', { name: /ENTREPRENEUR LIBRARY/ }).click();
    await expect(groups.first().locator('.cl-card').first()).toBeVisible();
    await groups.nth(2).locator('summary').click();
    await frame.getByRole('button', { name: 'I AM SELF-CONFIDENT', exact: true }).click();
    await expect(frame.locator('#entExperience h2')).toHaveText('SELF-CONFIDENT');

    // The same library must render when reached through the shell's menu.
    await page.getByRole('button', { name: 'Open site menu', exact: true }).click();
    await page.getByRole('button', { name: 'Entrepreneur Library', exact: true }).click();
    await expect(groups.first().locator('.cl-card').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('all 31 authored cards have complete resource sets with valid timing metadata', () => {
  expect(ENT_CARDS).toHaveLength(31);
  expect(Object.keys(RESOURCE_CATALOG).sort()).toEqual(ENT_CARDS.map(c => c.key).sort());
  expect(resourceForCard('toString')).toBeNull();
  for (const card of ENT_CARDS) {
    const r = resourceForCard(card.key);
    expect(r.videoId).toMatch(/^[A-Za-z0-9_-]{11}$/);
    expect(r.moments.length).toBeGreaterThan(0);
    for (const field of ['title', 'creator', 'why', 'time', 'sourceLabel']) expect(r[field].trim().length).toBeGreaterThan(3);
    for (const item of [r.podcast, r.article]) {
      for (const field of ['title', 'creator', 'why', 'time', 'takeaway', 'action']) expect(item[field].trim().length).toBeGreaterThan(3);
      expect(new URL(item.url).protocol).toBe('https:');
    }
    expect(new URL(r.source).protocol).toBe('https:');
    r.moments.forEach((m, i) => {
      expect(Number.isInteger(m.start) && m.start >= 0).toBe(true);
      if (m.end === null) expect(r.chapterMode).toBe('full-lesson');
      else expect(Number.isInteger(m.end) && m.end > m.start).toBe(true);
      if (i) expect(m.start).toBeGreaterThanOrEqual(r.moments[i - 1].end);
      for (const field of ['title', 'takeaway', 'practice']) expect(m[field].trim().length).toBeGreaterThan(3);
    });
  }
});

for (const card of ENT_CARDS) {
  test(`ENT resource route, lesson and formats — ${card.key}`, async ({ page }, testInfo) => {
    await mockVideo(page);
    const r = resourceForCard(card.key);
    await page.goto(`/players/master-player.html?start=ent-card&ent=${encodeURIComponent(card.key)}&preview=1`, { waitUntil: 'domcontentloaded' });
    const frame = page.frameLocator('#experienceFrame');
    const root = frame.locator('#entExperience');
    // CI traces show the lazy card module arriving just after the default 5s
    // assertion budget on a busy runner. Wait for that entry before controls.
    await expect(root).toBeVisible({ timeout: 15000 });
    await expect(root.locator('h2')).toHaveText(card.title.replace(/^I AM /, '').replace(/^I HAVE /, ''));
    await expect(frame.locator('.ent-video-cover')).toContainText(r.creator);
    await expect(frame.locator('[data-moment]')).toHaveCount(r.moments.length);
    await expect.poll(() => frame.locator('#entLibHost img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    if (['PROFITABLE', 'SKILLFUL COMMUNICATOR', 'BALANCE IN LIFE'].includes(card.key)) {
      await root.screenshot({ path: testInfo.outputPath(`ent-${r.id}-deeper.png`) });
    }
    for (const [index, moment] of r.moments.entries()) {
      await frame.locator(`[data-moment="${index}"]`).click();
      await expect.poll(() => root.evaluate(() => window.__entVideo.seeks.at(-1))).toBe(moment.start);
      await expect(frame.locator('[data-takeaway]')).toHaveText(moment.takeaway);
      await expect(frame.locator('[data-practice]')).toHaveText(moment.practice);
      await expect(frame.locator('[data-watch]')).toHaveAttribute('href', `https://www.youtube.com/watch?v=${r.videoId}&t=${moment.start}s`);
    }
    await expect.poll(() => root.evaluate(() => window.__entVideo.videoId)).toBe(r.videoId);
    for (const format of ['podcast', 'article']) {
      await frame.locator(`[data-format="${format}"]`).click();
      const panel = frame.locator(`[data-resource="${format}"]`);
      await expect(panel).toContainText(r[format].creator);
      await expect(panel.locator('a')).toHaveAttribute('href', r[format].url);
      await expect.poll(() => root.evaluate(() => window.__entVideo.playing)).toBe(false);
    }
  });
}

test('a learning practice becomes an editable, goal-linked next step without overwriting a draft', async ({ page }) => {
  const frame = await openCard(page);
  await frame.locator('[data-goal]').selectOption('pv1');
  await expect(frame.locator('[data-goal-context]')).toContainText('For your goal: I AM LAUNCHING');
  await frame.locator('[data-use-practice="moment"]').click();
  await expect(frame.locator('#ent-action-note')).toHaveValue('Choose one small attempt you can make today.');
  await frame.locator('#ent-action-note').fill('My existing launch draft.');
  await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'GO DEEPER' }).click();
  await frame.locator('[data-format="article"]').click();
  await frame.locator('[data-use-practice="article"]').click();
  await expect(frame.locator('#ent-action-note')).toHaveValue(/My existing launch draft\.\n\nWrite the first visible action/);
  await frame.getByRole('button', { name: 'Save my next step' }).click();
  await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'MY NOTES' }).click();
  await expect(frame.locator('.ent-saved-list')).toContainText('I AM LAUNCHING COSMIC INTENTIONS');
  await expect(frame.locator('.ent-saved-list')).toContainText('My existing launch draft.');
  const records = await frame.locator('#entExperience').evaluate(() => JSON.parse(localStorage.getItem('ci_ent_player_v1:preview:SELF CONFIDENT')));
  expect(records[0].goalId).toBe('pv1');
  await frame.locator('button', { hasText: 'NEXT' }).first().click();
  await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'MY NOTES' }).click();
  await expect(frame.locator('.ent-saved-list')).not.toContainText('My existing launch draft.');
});

test('a full lesson saves and replays its exact time without fabricated chapter boundaries', async ({ page }) => {
  await mockVideo(page);
  await page.goto('/players/master-player.html?start=ent-card&ent=PROFITABLE&preview=1');
  const frame = page.frameLocator('#experienceFrame');
  await frame.locator('[data-moment="0"]').click();
  await expect(frame.locator('.ent-moments')).toContainText('Full lesson');
  await frame.locator('#entExperience').evaluate(() => { window.__entVideo.time = 245; });
  await frame.locator('[data-save-moment]').click();
  await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'MY NOTES' }).click();
  await expect(frame.locator('.ent-saved-list')).toContainText('4:05');
  await frame.locator('[data-replay]').click();
  await expect.poll(() => frame.locator('#entExperience').evaluate(() => window.__entVideo.seeks.at(-1))).toBe(245);
});

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
  await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'MY NOTES' }).click();
  await expect(frame.locator('.ent-saved-list')).toContainText('Draft the question');
  await expect.poll(() => frame.locator('#entExperience').evaluate(() => window.__entVideo.playing)).toBe(false);
  // Reopen the actual destination with the same browser storage.
  frame = await openCard(page);
  await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'MY NOTES' }).click();
  await frame.locator('[data-replay]').click();
  await expect.poll(() => frame.locator('#entExperience').evaluate(() => window.__entVideo.seeks.at(-1))).toBe(1775);
  await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'MY NOTES' }).click();
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
  await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'ACTION', exact: true }).click();
  await frame.getByRole('button', { name: 'Save my next step' }).click();
  await expect(frame.locator('[data-status="action"]')).toContainText('Write the step');
  await frame.locator('#ent-action-note').fill('Send one question tomorrow at 9.');
  await frame.getByRole('button', { name: 'Save my next step' }).click();
  await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'ACTION', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'MINDSET', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(frame.locator('[data-panel="mindset"]')).toContainText('WINNING ATTITUDES');
  await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'MY NOTES' }).click();
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
    // Four screenshots, both wrap directions, and a real iframe return to the library.
    test.setTimeout(60000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Sample-card navigation needs no production data or remote service timing.
    await page.route('**/*.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.setViewportSize(viewport);
    const frame = await openCard(page, 'ORGANIZATIONAL SKILLS');
    await expect.poll(() => frame.locator('#entLibHost img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    await expect(frame.locator('#authModal')).not.toBeVisible();
    await expect(page.locator('#experienceFrame')).toHaveAttribute('src', /masterInline=ent-card/);
    await expect(page.locator('#experienceFrame')).not.toHaveAttribute('src', /preview=/);
    const root = frame.locator('#entExperience');
    const navigation = frame.getByRole('navigation', { name: 'Entrepreneur card navigation', exact: true });
    const sections = frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true });
    await expect(navigation.getByRole('button')).toHaveCount(3);
    await expect(frame.locator('#entLibHost [role=tablist]')).toHaveCount(1);
    await expect(frame.getByRole('button', { name: 'ENTREPRENEUR LIBRARY', exact: true })).toHaveCount(1);
    await expect(navigation.locator('.ent-card-count')).toHaveText('31 / 31');
    await expect(sections.getByRole('tab')).toHaveCount(4);
    const placement = await root.evaluate(el => {
      const upper = el.querySelector('.ent-card-nav').getBoundingClientRect();
      const artwork = document.querySelector('#entLibHost img').getBoundingClientRect();
      const intro = el.querySelector('.ent-intro').getBoundingClientRect();
      const ids = [...el.querySelectorAll('[id]')].map(node => node.id);
      return { gap: upper.top - artwork.bottom, beforeIntro: upper.bottom <= intro.top, uniqueIds: ids.length === new Set(ids).size };
    });
    expect(placement.gap).toBeGreaterThanOrEqual(0);
    expect(placement.gap).toBeLessThan(30);
    expect(placement.beforeIntro).toBe(true);
    expect(placement.uniqueIds).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`entrepreneur-${viewport.name}-full-player.png`), fullPage: true });
    await root.screenshot({ path: testInfo.outputPath(`entrepreneur-${viewport.name}-deeper.png`) });
    const overflow = await root.evaluate(el => [...el.querySelectorAll('*')].filter(n => n.getClientRects().length && n.getBoundingClientRect().right > el.getBoundingClientRect().right + 1).map(n => ({ tag: n.tagName, class: n.className, width: n.getBoundingClientRect().width })));
    expect(overflow).toEqual([]);
    await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'ACTION', exact: true }).click();
    await root.screenshot({ path: testInfo.outputPath(`entrepreneur-${viewport.name}-action.png`) });
    await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'MINDSET', exact: true }).click();
    await root.screenshot({ path: testInfo.outputPath(`entrepreneur-${viewport.name}-mindset.png`) });
    await sections.getByRole('tab', { name: 'ACTION', exact: true }).click();
    await frame.locator('#ent-action-note').fill('Keep this draft while navigating cards.');
    await sections.getByRole('tab', { name: 'ACTION', exact: true }).focus();
    await page.keyboard.press('End');
    await expect(sections.getByRole('tab', { name: 'MY NOTES', exact: true })).toBeFocused();
    await expect(frame.locator('#ent-panel-notes')).toBeVisible();
    await expect(frame.locator('#ent-action-note')).toHaveValue('Keep this draft while navigating cards.');
    await page.keyboard.press('Home');
    await expect(sections.getByRole('tab', { name: 'ACTION', exact: true })).toBeFocused();
    await expect(frame.locator('#ent-panel-action')).toBeVisible();
    await navigation.getByRole('button', { name: 'NEXT ›', exact: true }).click();
    await expect(navigation.locator('.ent-card-count')).toHaveText('1 / 31');
    await expect(root.locator('h2')).toHaveText('DISCIPLINED');
    await navigation.getByRole('button', { name: '‹ PREV', exact: true }).click();
    await expect(navigation.locator('.ent-card-count')).toHaveText('31 / 31');
    await expect(root.locator('h2')).toHaveText('STRONG ORGANIZATIONAL SKILLS');
    await expect(frame.locator('#ent-action-note')).toHaveValue('Keep this draft while navigating cards.');
    await navigation.getByRole('button', { name: '‹ PREV', exact: true }).click();
    await expect(navigation.locator('.ent-card-count')).toHaveText('30 / 31');
    await navigation.getByRole('button', { name: 'NEXT ›', exact: true }).click();
    await expect(navigation.locator('.ent-card-count')).toHaveText('31 / 31');
    await navigation.getByRole('button', { name: 'ENTREPRENEUR LIBRARY', exact: true }).click();
    await expect(frame.locator('#entrepreneurLibraryGrid .cl-card')).toHaveCount(31);
    await expect(frame.locator('#entrepreneurLibraryGrid .cl-card').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}
