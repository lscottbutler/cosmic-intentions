import { test, expect } from '@playwright/test';
import { COSMIC_CONCEPT_THEMES } from '../shared/cosmic-concepts-content.js';
import { LESSON_RESEARCH, RESEARCH_SOURCES, RESEARCH_GUIDE } from '../shared/cosmic-concepts-research-content.js';

test('Cosmic concept catalog preserves all 500 numbered entries in 20 themes', () => {
  const items = COSMIC_CONCEPT_THEMES.flatMap(theme => theme.items);
  expect(COSMIC_CONCEPT_THEMES).toHaveLength(20);
  expect(COSMIC_CONCEPT_THEMES.every(theme => theme.items.length === 25)).toBe(true);
  expect(items.map(item => item.number)).toEqual(Array.from({ length: 500 }, (_, i) => i + 1));
  expect(new Set(items.map(item => item.title)).size).toBe(500);
  expect(items.every(item => item.title.trim() && item.description.trim())).toBe(true);
  expect(JSON.stringify(items)).not.toContain('chatgpt-content-reference');
  expect(items[462].description).toBe('Spreading investments to reduce concentration risk; losses remain possible.');
  // Category color is reinforced by labels and numbering; badge text must be readable.
  for (const theme of COSMIC_CONCEPT_THEMES) {
    const channels = theme.color.slice(1).match(/../g).map(c => parseInt(c, 16) / 255);
    const luminance = channels.map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
      .reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
    expect(1.05 / (luminance + .05)).toBeGreaterThanOrEqual(4.5);
  }
});

for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`Cosmic concept library searches, filters and keeps original numbering — ${viewport.name}`, async ({ page }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize(viewport);
    await page.route('**/*.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/players/master-player.html?start=cosmic-library&preview=1', { waitUntil: 'domcontentloaded' });
    const frame = page.frameLocator('#experienceFrame');
    const root = frame.locator('#cosmicConceptLibrary');
    await expect(root).toBeVisible({ timeout: 15000 });
    await expect(root.locator('.cl-concept-theme')).toHaveCount(20);
    await expect(root.locator('.cl-concept-item')).toHaveCount(500);
    await expect(root.locator('.cl-concepts-count')).toHaveText('500 concepts · 20 themes');
    await root.screenshot({ path: testInfo.outputPath(`concepts-${viewport.name}-themes.png`) });

    const first = root.locator('.cl-concept-theme').first();
    await first.locator(':scope > summary').focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('open', '');
    await expect(root.locator('#cosmic-concept-1 h3')).toHaveText('Self-awareness');
    await expect(root.locator('#cosmic-concept-1 p')).toHaveText('Recognizing your thoughts, feelings, motives, and behavior.');
    const columns = await first.locator('.cl-concept-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(viewport.name === 'desktop' ? 2 : 1);
    await first.locator(':scope > summary').click();

    const search = root.getByLabel('Find a concept', { exact: true });
    const theme = root.getByLabel('Theme', { exact: true });
    await theme.selectOption('theme-04');
    await expect(root.locator('.cl-concepts-count')).toHaveText('25 concepts · 1 theme');
    expect(await root.locator('.cl-concept-item:visible').evaluateAll(items => items.map(el => Number(el.dataset.conceptNumber))))
      .toEqual(Array.from({ length: 25 }, (_, i) => i + 76));
    await search.fill('returning to a routine');
    await expect(root.locator('.cl-concept-item:visible')).toHaveCount(1);
    await expect(root.locator('#cosmic-concept-94 h3')).toHaveText('Habit recovery');
    await expect(root.locator('#cosmic-concept-94 .cl-concept-number')).toHaveText('094');
    await expect(root.locator('#cosmic-concept-94 .cl-concept-number')).toHaveCSS('background-color', 'rgb(53, 102, 71)');

    await root.getByRole('button', { name: 'Clear search and filters' }).click();
    await expect(search).toBeFocused();
    await search.fill('visualization');
    await expect(root.locator('.cl-concepts-count')).toHaveText('3 concepts · 1 theme');
    await expect(root.locator('.cl-concept-item:visible h3')).toHaveText(['Process visualization', 'Outcome visualization', 'Coping visualization']);
    const overflow = await root.evaluate(el => [...el.querySelectorAll('*')].filter(n => n.getClientRects().length && (n.getBoundingClientRect().right > el.getBoundingClientRect().right + 1 || n.getBoundingClientRect().left < el.getBoundingClientRect().left - 1)).map(n => n.className));
    expect(overflow).toEqual([]);
    await root.screenshot({ path: testInfo.outputPath(`concepts-${viewport.name}-entries.png`) });
    await expect.poll(() => page.locator('#experienceFrame').evaluate(el => Math.abs(el.offsetHeight - el.contentDocument.querySelector('.page.active').scrollHeight)), { timeout: 10000 }).toBeLessThanOrEqual(3);

    await search.fill('#500');
    await expect(root.locator('.cl-concept-item:visible')).toHaveCount(1);
    await expect(root.locator('#cosmic-concept-500 h3')).toHaveText('Living the practice');
    await expect(root.locator('#cosmic-concept-500 p')).toHaveText('Expressing what you learn through the way you live.');
    await search.fill('no-such-concept-xyz');
    await expect(root.locator('.cl-concepts-empty')).toBeVisible();
    await expect(root.locator('.cl-concepts-count')).toHaveText('0 concepts · 0 themes');
    await root.getByRole('button', { name: 'Clear search and filters' }).click();
    await expect(root.locator('.cl-concepts-count')).toHaveText('500 concepts · 20 themes');

    // Adding the catalog must keep the existing library-to-player route usable.
    const entrepreneurGroup = frame.locator('#cosmicLibraryGrid .ent-force-sec').first();
    await entrepreneurGroup.locator('summary').click();
    await entrepreneurGroup.locator('.cl-card').first().click();
    await expect(frame.locator('#entExperience')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Open site menu', exact: true }).click();
    await page.getByRole('button', { name: 'Cosmic Library', exact: true }).click();
    await expect(root).toHaveCount(1);
    await expect(root.locator('.cl-concept-item')).toHaveCount(500, { timeout: 15000 });
    expect(errors).toEqual([]);
  });
}

test('Cosmic concept research maps every workbook row and source to its original lesson', () => {
  const original = COSMIC_CONCEPT_THEMES.flatMap(theme => theme.items);
  const normalize = value => value.replace(/[“”]/g, '"').replace(/’/g, "'");
  expect(Object.keys(LESSON_RESEARCH)).toHaveLength(500);
  expect(Object.keys(RESEARCH_SOURCES)).toHaveLength(97);
  expect(Object.values(LESSON_RESEARCH).map(r => r.studyOrder).sort((a, b) => a - b))
    .toEqual(Array.from({ length: 500 }, (_, i) => i + 1));
  for (const lesson of original) {
    const research = LESSON_RESEARCH[lesson.number];
    expect(normalize(research.title)).toBe(normalize(lesson.title));
    for (const field of ['interpretation', 'action', 'priority', 'evidence', 'directness', 'latestYear']) expect(research[field].trim()).not.toBe('');
    expect(research.sourceKeys.map(k => RESEARCH_SOURCES[k]?.url)).toContain(research.primaryUrl);
  }
  for (const item of [...Object.values(LESSON_RESEARCH), ...RESEARCH_GUIDE.highlights, ...RESEARCH_GUIDE.reading]) {
    expect(item.sourceKeys.length).toBeGreaterThan(0);
    for (const key of item.sourceKeys) {
      expect(RESEARCH_SOURCES[key]).toBeDefined();
      expect(new URL(RESEARCH_SOURCES[key].url).protocol).toBe('https:');
    }
  }
  for (const source of Object.values(RESEARCH_SOURCES)) {
    for (const field of ['title', 'year', 'design', 'finding', 'limit', 'access']) expect(source[field].trim()).not.toBe('');
  }
  expect(RESEARCH_GUIDE.start).toHaveLength(20);
  expect(RESEARCH_GUIDE.weeks).toHaveLength(4);
  expect(RESEARCH_GUIDE.highlights).toHaveLength(20);
  expect(RESEARCH_GUIDE.methods).toHaveLength(30);
  expect(RESEARCH_GUIDE.methods.find(m => m.title === 'What the rank means').text).toContain('editorial judgment');
});

for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`Cosmic concept research opens lessons, first steps, limits and learning guides — ${viewport.name}`, async ({ page }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize(viewport);
    await page.route('**/*.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/players/master-player.html?start=cosmic-library&preview=1', { waitUntil: 'domcontentloaded' });
    const root = page.frameLocator('#experienceFrame').locator('#cosmicConceptLibrary');
    await expect(root).toHaveAttribute('data-research-ready', 'true', { timeout: 15000 });
    await expect(root.getByRole('heading', { name: '500 Lessons for Life', exact: true })).toBeVisible();
    await expect(root.locator('.cl-lesson-research')).toHaveCount(500);
    // Source details are deferred until opened, keeping the initial catalog light.
    await expect(root.locator('.cl-research-source')).toHaveCount(0);
    const start = root.locator('[data-research-guide="start"]');
    await start.locator('summary').click();
    await expect(start.locator('[data-open-lesson]')).toHaveCount(20);
    await expect(start).toContainText('Your first four weeks');
    await expect(start).toContainText('Make one concept part of a real story');
    await start.getByRole('button', { name: /Values clarification/ }).click();
    const lesson = root.locator('#cosmic-concept-3');
    await expect(lesson).toBeVisible();
    await expect(lesson.locator('.cl-concept-number')).toHaveText('003');
    await expect(lesson.locator('.cl-lesson-research')).toHaveAttribute('open', '');
    await expect(lesson.locator('.cl-lesson-research>summary')).toBeFocused();
    await expect(lesson.locator('.cl-research-action')).toContainText(LESSON_RESEARCH[3].action);
    await expect(lesson.locator('.cl-research-facts')).toContainText('4 of 500');
    await expect(lesson).toContainText(LESSON_RESEARCH[3].interpretation);
    for (const key of LESSON_RESEARCH[3].sourceKeys) {
      const source = lesson.locator(`[data-research-source="${key}"]`);
      await expect(source).toContainText(RESEARCH_SOURCES[key].limit);
      await expect(source.locator('a')).toHaveAttribute('href', RESEARCH_SOURCES[key].url);
      await expect(source.locator('a')).toHaveAttribute('rel', 'noopener noreferrer');
    }
    const overflow = await lesson.evaluate(el => [...el.querySelectorAll('*')].filter(n => n.getClientRects().length && (n.getBoundingClientRect().right > el.getBoundingClientRect().right + 1 || n.getBoundingClientRect().left < el.getBoundingClientRect().left - 1)).map(n => n.className));
    expect(overflow).toEqual([]);
    await lesson.screenshot({ path: testInfo.outputPath(`lesson-research-${viewport.name}.png`) });
    await start.locator('summary').click();
    const highlights = root.locator('[data-research-guide="highlights"]');
    await highlights.locator('summary').click();
    await expect(highlights.locator('.cl-research-guide-card')).toHaveCount(20);
    await expect(highlights).toContainText('What it does not establish:');
    await highlights.locator('summary').click();
    const sources = root.locator('[data-research-guide="sources"]');
    await sources.locator('summary').click();
    await expect(sources.locator('.cl-research-source')).toHaveCount(97);
    await sources.locator('summary').click();
    const method = root.locator('[data-research-guide="method"]');
    await method.locator('summary').click();
    await expect(method.locator('dt')).toHaveCount(30);
    await expect(method).toContainText('not a calculated scientific league table');
    await method.locator('summary').click();
    await root.getByRole('button', { name: 'Clear search and filters' }).click();
    await root.getByLabel('Find a concept', { exact: true }).fill('#500');
    const last = root.locator('#cosmic-concept-500');
    await last.locator('.cl-lesson-research>summary').click();
    await expect(last.locator('.cl-research-action')).toContainText(LESSON_RESEARCH[500].action);
    await expect.poll(() => page.locator('#experienceFrame').evaluate(el => Math.abs(el.offsetHeight - el.contentDocument.querySelector('.page.active').scrollHeight)), { timeout: 10000 }).toBeLessThanOrEqual(3);
    expect(errors).toEqual([]);
  });
}
