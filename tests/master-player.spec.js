import { test, expect } from '@playwright/test';

const PLAYER = '/players/master-player.html?start=goals&card=0';

const CORE_DESTINATIONS = [
  { action: 'goals', label: 'Goals', card: /Goals word collage/i },
  { action: 'favorites', label: 'Favorites', card: /Favorites word collage/i },
  { action: 'thoughts', label: 'Thoughts', card: /Thoughts word collage/i },
  { action: 'journal', label: 'Journal', card: /Journal word collage/i },
  { action: 'action-plan', label: 'Action Plan', card: /Roadmap word collage/i },
  { action: 'visualization', label: 'Visualize', card: /Visualize word collage/i },
  { action: 'gratitude', label: 'Gratitude', card: /Gratitude word collage/i },
  { action: 'wins', label: 'Wins', card: /Wins word collage/i },
  { action: 'cosmic-library', label: 'Cosmic Library', card: /Cosmic Library word collage/i },
];

async function waitForCard(page, expectedCard = /Goals word collage/i) {
  const card = page.locator('#toolInspirationCard');
  await expect(card).toHaveAttribute('alt', expectedCard, { timeout: 5000 });
  await expect.poll(async () => card.evaluate((el) => {
    const layer = el.closest('.inspiration-card');
    return el.naturalWidth > 0 && layer && Number(getComputedStyle(layer).opacity) > 0.99;
  }), { timeout: 7000 }).toBe(true);
  return card;
}

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
]) {
  test(`Master Player card fills its 16:9 frame — ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(PLAYER, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForCard(page);

    const geometry = await page.evaluate(() => {
      const frame = document.querySelector('#toolDailyInspiration').getBoundingClientRect();
      const card = document.querySelector('#toolInspirationCard').getBoundingClientRect();
      return {
        ratio: card.width / card.height,
        frameWidth: frame.width,
        centerOffset: Math.abs(frame.left - (document.documentElement.clientWidth - frame.width) / 2),
        gaps: {
          left: card.left - frame.left,
          right: frame.right - card.right,
          top: card.top - frame.top,
          bottom: frame.bottom - card.bottom,
        },
      };
    });

    expect(geometry.ratio).toBeCloseTo(16 / 9, 3);
    expect(geometry.frameWidth).toBeLessThanOrEqual(900);
    expect(geometry.centerOffset).toBeLessThanOrEqual(1);
    for (const gap of Object.values(geometry.gaps)) expect(Math.abs(gap)).toBeLessThanOrEqual(1);
  });
}


test('Citadel 16:9 surfaces contain cards only', async ({ page }) => {
  await page.goto('/players/master-player.html?card=0', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });

  const contents = await page.evaluate(() => ({
    homeChildren: [...document.querySelector('#dailyInspiration').children].map((node) => node.tagName),
    homeImages: document.querySelectorAll('#dailyInspiration .inspiration-card img').length,
    toolChildren: [...document.querySelector('#toolDailyInspiration').children].map((node) => node.tagName),
    generatedText: document.querySelectorAll(
      '#dailyInspiration .inspiration-kind, #dailyInspiration .statement, #dailyInspiration .inspiration-author, ' +
      '#toolDailyInspiration .inspiration-kind, #toolDailyInspiration .statement, #toolDailyInspiration .inspiration-author'
    ).length,
    upperTroughText: document.querySelector('#capTitle').textContent.trim(),
  }));

  expect(contents.homeChildren).toEqual(['DIV']);
  expect(contents.homeImages).toBe(2);
  expect(contents.toolChildren).toEqual(['DIV']);
  expect(contents.generatedText).toBe(0);
  expect(contents.upperTroughText).toBe('');
});


test('MASTER PLAYER TEMPLATE structure is locked', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/players/master-player.html?card=0', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });

  const state = await page.evaluate(() => {
    const shell = document.querySelector('.shell');
    const cap = document.querySelector('#capTitle');
    const card = document.querySelector('#dailyInspiration');
    const deck = document.querySelector('.deck');
    const cardRect = card.getBoundingClientRect();
    const capRect = cap.getBoundingClientRect();
    const stageRect = document.querySelector('#stage').getBoundingClientRect();
    const deckRect = deck.getBoundingClientRect();
    const menuRect = document.querySelector('#siteMenuButton').getBoundingClientRect();
    return {
      name: shell.dataset.templateName,
      status: shell.dataset.templateStatus,
      upperTroughText: document.querySelector('#capTitleText').textContent.trim(),
      upperTroughHeight: cap.getBoundingClientRect().height,
      siteMenuVisible: getComputedStyle(document.querySelector('#siteMenuButton')).display !== 'none',
      hamburgerLeftOffset: menuRect.left + menuRect.width / 2 - capRect.left,
      menuClearsTitle: menuRect.right <= document.querySelector('#capTitleText').getBoundingClientRect().left,
      cardRatio: cardRect.width / cardRect.height,
      deckRegion: deck.dataset.templateRegion,
      actions: [...deck.querySelectorAll(':scope > .normal-control:not([hidden])')].map((button) => button.dataset.action || (button.hasAttribute('data-menu') ? 'menu' : undefined)),
      outerColor: getComputedStyle(cap).backgroundColor,
      innerColor: getComputedStyle(cap, '::before').backgroundColor,
      upperCurve: getComputedStyle(cap, '::before').borderTopLeftRadius,
      lowerCurve: getComputedStyle(deck, '::before').borderBottomLeftRadius,
      regions: {
        upperEndsAtStage: Math.abs(capRect.bottom - stageRect.top) <= 1,
        cardEndsAtLower: Math.abs(stageRect.bottom - deckRect.top) <= 1,
      },
    };
  });

  expect(state.name).toBe('MASTER PLAYER TEMPLATE');
  expect(state.status).toBe('locked');
  expect(state.upperTroughText).toBe('');
  expect(state.upperTroughHeight).toBeCloseTo(108, 1);
  expect(state.siteMenuVisible).toBe(true);
  expect(state.hamburgerLeftOffset).toBeGreaterThan(45);
  expect(state.hamburgerLeftOffset).toBeLessThan(65);
  expect(state.menuClearsTitle).toBe(true);
  expect(state.cardRatio).toBeCloseTo(16 / 9, 3);
  expect(state.deckRegion).toBe('lower-icon-trough');
  expect(state.actions).toEqual([
    'meditation',
    'daily-habits',
    'goals',
    'visualization',
    'action-plan',
    'cosmic-library',
    'task-notes',
    'menu',
  ]);
  expect(state.outerColor).toBe('rgb(30, 144, 255)');
  expect(state.innerColor).toBe('rgb(116, 116, 116)');
  expect(state.upperCurve).not.toBe('0px');
  expect(state.lowerCurve).not.toBe('0px');
  expect(state.regions).toEqual({
    upperEndsAtStage: true,
    cardEndsAtLower: true,
  });
});

for (const destination of CORE_DESTINATIONS) {
  test(`locked Master Player shell is consistent on ${destination.label}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/players/master-player.html?start=${destination.action}&card=0`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    const card = await waitForCard(page, destination.card);

    const state = await page.evaluate(() => {
      const shell = document.querySelector('.shell');
      const capElement = document.querySelector('#capTitle');
      const titleElement = document.querySelector('#capTitleText');
      const menuElement = document.querySelector('#siteMenuButton');
      const frame = document.querySelector('#toolDailyInspiration').getBoundingClientRect();
      const image = document.querySelector('#toolInspirationCard').getBoundingClientRect();
      const cap = capElement.getBoundingClientRect();
      const title = titleElement.getBoundingClientRect();
      const siteMenu = menuElement.getBoundingClientRect();
      const style = getComputedStyle(shell);
      return {
        classes: [...shell.classList],
        frameColor: style.getPropertyValue('--header').trim(),
        troughColor: style.getPropertyValue('--trough-fill').trim(),
        upperTroughText: titleElement.textContent.trim(),
        siteMenuVisible: getComputedStyle(menuElement).display !== 'none',
        upperTrough: {
          height: cap.height,
          centerX: cap.left + (cap.width / 2),
          titleCenterX: title.left + (title.width / 2),
          titleCenterY: title.top + (title.height / 2),
          menuCenterY: siteMenu.top + (siteMenu.height / 2),
          outerColor: getComputedStyle(capElement).backgroundColor,
          innerColor: getComputedStyle(capElement, '::before').backgroundColor,
        },
        ratio: image.width / image.height,
        gaps: [
          image.left - frame.left,
          frame.right - image.right,
          image.top - frame.top,
          frame.bottom - image.bottom,
        ],
      };
    });

    expect(state.classes).toContain('lfm-shared-frame-mode');
    expect(state.frameColor).toBe('#1e90ff');
    expect(state.troughColor).toBe('#747474');
    expect(state.upperTroughText).not.toMatch(/affirmation/i);
    expect(state.siteMenuVisible).toBe(true);
    // Locked master geometry: fixed mobile height, exact horizontal centering,
    // one shared vertical centerline, and the approved two-tone colors.
    expect(state.upperTrough.height).toBeCloseTo(108, 1);
    expect(state.upperTrough.titleCenterX).toBeCloseTo(state.upperTrough.centerX, 1);
    expect(state.upperTrough.titleCenterY).toBeCloseTo(state.upperTrough.menuCenterY, 1);
    expect(state.upperTrough.outerColor).toBe('rgb(30, 144, 255)');
    expect(state.upperTrough.innerColor).toBe('rgb(116, 116, 116)');
    expect(state.ratio).toBeCloseTo(16 / 9, 3);
    for (const gap of state.gaps) expect(Math.abs(gap)).toBeLessThanOrEqual(1);
    await expect(card.locator('..')).toHaveCSS('transition-duration', '0s');
  });
}

test('upper-trough site menu opens the standalone menu', async ({ page }) => {
  await page.goto(PLAYER, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('#siteMenuButton').click();
  await expect(page.locator('#standaloneSiteMenu')).toBeVisible();
  await page.locator('#standaloneSiteMenu').getByRole('button', { name: 'Admin', exact: true }).click();
  await expect(page.locator('#experienceFrame')).toHaveAttribute('src', /masterInline=admin/);
  await expect(page.frameLocator('#experienceFrame').locator('#page-admin')).not.toHaveClass(/active/);
});

test('switching players loads the next card in the shared 16:9 frame', async ({ page }) => {
  await page.goto(PLAYER, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const card = await waitForCard(page);
  const frame = page.locator('#toolDailyInspiration');
  await page.locator('#siteMenuButton').click();
  await page.locator('#standaloneSiteMenu button', { hasText: 'Visualization Library' }).click();
  await waitForCard(page, /Visualize word collage/i);
  await expect(card.locator('..')).toHaveCSS('transition-duration', '0s');
  await expect(frame).toBeVisible();
});

test('Cosmic Library frame height follows its visible workspace', async ({ page }) => {
  await page.goto('/players/master-player.html?start=cosmic-library&card=0', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });
  await waitForCard(page, /Cosmic Library word collage/i);

  const frame = page.locator('#experienceFrame');
  await expect.poll(async () => frame.evaluate((el) => {
    const active = el.contentDocument?.querySelector('.page.active');
    return active ? Math.abs(el.offsetHeight - active.scrollHeight) : 9999;
  }), { timeout: 10000 }).toBeLessThanOrEqual(3);

  const legacyIntroHidden = await frame.evaluate((el) => {
    const doc = el.contentDocument;
    if (!doc) return false;
    return [...doc.querySelectorAll('.page-intro-card')]
      .every((node) => getComputedStyle(node).display === 'none');
  });
  expect(legacyIntroHidden).toBe(true);
});

test('long workspaces keep the navigation trough directly below the 16:9 card', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/players/master-player.html?start=action-plan&card=0', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });
  await waitForCard(page, /Roadmap word collage/i);

  const order = await page.evaluate(() => {
    const rotation = document.querySelector('#lfmToolRotation');
    const deck = document.querySelector('.deck');
    const frame = document.querySelector('#experienceFrame');
    return {
      rotationBeforeDeck: Boolean(rotation && deck && rotation.compareDocumentPosition(deck) & Node.DOCUMENT_POSITION_FOLLOWING),
      workspaceBeforeDeck: Boolean(deck && frame && frame.compareDocumentPosition(deck) & Node.DOCUMENT_POSITION_FOLLOWING),
      lowerTroughHidden: getComputedStyle(deck).display === 'none',
    };
  });

  expect(order.rotationBeforeDeck).toBe(true);
  expect(order.workspaceBeforeDeck).toBe(true);
  expect(order.lowerTroughHidden).toBe(true);
});


test('Habits opens the daily checklist and can return from its editor', async ({ page }) => {
  await page.goto('/players/master-player.html?start=daily-habits', { waitUntil: 'domcontentloaded', timeout: 15000 });
  const tool = page.frameLocator('#experienceFrame');
  await expect(tool.locator('#habitsDailyView')).toBeVisible();
  await expect(tool.locator('#habitsEditorView')).toBeHidden();
  await tool.getByRole('button', { name: 'Edit habits' }).click();
  await expect(tool.locator('#habitsEditorView')).toBeVisible();
  await tool.getByRole('button', { name: 'Back to daily checklist' }).click();
  await expect(tool.locator('#habitsDailyView')).toBeVisible();
});

test('Goals start closed and reopen only on selection', async ({ page }) => {
  await page.goto('/players/master-player.html?start=goals', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('#experienceFrame').evaluate((el) => {
    el.src = '/?masterInline=goals&lfm=fullheight-1&preview=1';
  });
  const goal = page.frameLocator('#experienceFrame').locator('#pbIntentionList details').first();
  await expect(goal).toBeAttached();
  await expect(goal).not.toHaveAttribute('open', '');
  await goal.locator('summary').click();
  await expect(goal).toHaveAttribute('open', '');
});

test('Meditation choices use one full-width column and expose the relaxation toggle', async ({ page }) => {
  await page.goto('/players/master-player.html?start=meditation', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });

  const choices = page.locator('.med-time-choice');
  const toggle = page.locator('[data-relaxation-toggle]');
  await expect(choices).toHaveCount(6);
  await expect(page.locator('[data-med-time="0.25"], [data-med-time="0.5"]')).toHaveCount(0);
  await expect(page.locator('.med-time-circle')).toHaveCount(6);
  await expect(page.locator('.med-mode-circle')).toHaveCount(2);
  await expect(page.locator('[data-med-play]')).toHaveCount(0);
  await expect(page.locator('#meditationMenu h2')).toHaveCount(0);
  await expect(page.locator('#meditationMenu strong')).toHaveCount(0);
  await expect(page.locator('.med-time-slot')).toHaveCount(0);
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  const widths = await choices.evaluateAll((rows) => rows.map((row) => {
    const button = row.querySelector('button');
    return {
      children: row.children.length,
      row: Math.round(row.getBoundingClientRect().width),
      button: Math.round(button.getBoundingClientRect().width),
    };
  }));
  expect(widths.every(({ children, row, button }) => children === 1 && Math.abs(row - button) <= 1)).toBe(true);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveAttribute('aria-label', 'Relaxation Module on');
});

test('Meditation image stays behind the uniform dark 35px frame', async ({ page }) => {
  await page.goto('/players/master-player.html?start=meditation', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });

  const meditation = page.frameLocator('#experienceFrame');
  const frameRect = meditation.locator('.ccb-curve rect');
  const curveDivider = meditation.locator('.ccb-curve ellipse');
  await expect(frameRect).toBeVisible();
  await expect(frameRect).toHaveAttribute('stroke', '#1e90ff');
  await expect(curveDivider).toHaveAttribute('stroke', '#747474');
  await expect(curveDivider).toHaveCSS('stroke', 'rgb(116, 116, 116)');

  const layers = await meditation.locator('.player').evaluate((player) => {
    const image = player.querySelector('.image');
    const frame = player.querySelector('.ccb-curve');
    const rect = player.querySelector('.ccb-curve rect');
    return {
      imageZ: Number(getComputedStyle(image).zIndex) || 0,
      frameZ: Number(getComputedStyle(frame).zIndex) || 0,
      rectDisplay: getComputedStyle(rect).display,
      rectStroke: getComputedStyle(rect).stroke,
    };
  });
  expect(layers.frameZ).toBeGreaterThan(layers.imageZ);
  expect(layers.rectDisplay).not.toBe('none');
  expect(layers.rectStroke).toBe('rgb(30, 144, 255)');
});

test('Meditate opens with its compact options menu visible', async ({ page }) => {
  await page.goto('/players/master-player.html?start=meditation', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });

  const menu = page.locator('#meditationMenu');
  const controls = page.locator('#meditationControls');
  const menuButton = page.locator('[data-med-command="menu"]');
  await expect(menu).toBeVisible();
  await expect(controls).toBeHidden();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');

  const playerControlGap = await page.evaluate(() => {
    const stageRect = document.querySelector('#stage')?.getBoundingClientRect();
    const deckRect = document.querySelector('.deck')?.getBoundingClientRect();
    return stageRect && deckRect ? Math.round(deckRect.top - stageRect.bottom) : -1;
  });
  expect(playerControlGap).toBe(0);

  const containment = await page.evaluate(() => {
    const deckRect = document.querySelector('.deck')?.getBoundingClientRect();
    const menuRect = document.querySelector('#meditationMenu')?.getBoundingClientRect();
    if (!deckRect || !menuRect) return null;
    return {
      left: menuRect.left >= deckRect.left,
      right: menuRect.right <= deckRect.right,
      bottomClearance: deckRect.bottom - menuRect.bottom,
    };
  });
  expect(containment).not.toBeNull();
  expect(containment.left).toBe(true);
  expect(containment.right).toBe(true);
  expect(containment.bottomClearance).toBeGreaterThanOrEqual(28);

  const lowerTrough = await page.evaluate(() => {
    const deck = document.querySelector('.deck');
    return {
      borderDisplay: getComputedStyle(deck, '::before').display,
      frameColor: getComputedStyle(deck).backgroundColor,
      upperTroughColor: getComputedStyle(document.querySelector('#capTitle'), '::before').backgroundColor,
      borderWidth: getComputedStyle(deck).borderLeftWidth,
      rightBorderWidth: getComputedStyle(deck).borderRightWidth,
      topBorderWidth: getComputedStyle(deck).borderTopWidth,
      bottomBorderWidth: getComputedStyle(deck).borderBottomWidth,
      leftMargin: getComputedStyle(deck).marginLeft,
      rightMargin: getComputedStyle(deck).marginRight,
      menuColor: getComputedStyle(document.querySelector('#meditationMenu')).backgroundColor,
    };
  });
  expect(lowerTrough.borderDisplay).toBe('none');
  expect(lowerTrough.frameColor).toMatch(/^rgb\(/);
  expect(parseFloat(lowerTrough.borderWidth)).toBeGreaterThan(0);
  expect(parseFloat(lowerTrough.borderWidth)).toBeLessThanOrEqual(35);
  expect(lowerTrough.rightBorderWidth).toBe(lowerTrough.borderWidth);
  expect(lowerTrough.topBorderWidth).toBe('0px');
  expect(lowerTrough.bottomBorderWidth).toBe('35px');
  expect(lowerTrough.leftMargin).toBe('0px');
  expect(lowerTrough.rightMargin).toBe('0px');
  expect(lowerTrough.menuColor).toBe('rgba(0, 0, 0, 0)');

  const meditation = page.frameLocator('#experienceFrame');
  await meditation.locator('#timer').click();
  await expect(controls).toBeVisible();
  await expect(controls).toHaveCSS('animation-duration', '3s');
  await expect(menu).toBeHidden();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

  await menuButton.click();
  await expect(menu).toBeVisible();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
});

test('standalone Citadel shows saved opening box above its 16:9 stage', async ({ page }) => {
  await page.route('**/*masterInline=citadel-note*', route => route.fulfill({
    contentType: 'text/html',
    body: '<div>Saved Citadel welcome</div><script>parent.postMessage({type:"ci-citadel-note-height",height:80},location.origin)</script>',
  }));
  await page.goto('/players/master-player.html?start=citadel', { waitUntil: 'domcontentloaded' });
  const note = page.locator('#citadelNote');
  await expect(note).toBeVisible();
  await expect(note.locator('iframe')).toHaveAttribute('src', '/?masterInline=citadel-note');
  const bounds = await page.evaluate(() => ({
    note: document.querySelector('#citadelNote').getBoundingClientRect().bottom,
    stage: document.querySelector('#stage').getBoundingClientRect().top,
    ratio: document.querySelector('#homeView').getBoundingClientRect().width /
      document.querySelector('#homeView').getBoundingClientRect().height,
  }));
  expect(bounds.note).toBeLessThanOrEqual(bounds.stage);
  expect(bounds.ratio).toBeCloseTo(16 / 9, 2);
});

for (const choice of [
  { label: 'VISUALIZATION', action: 'visualization' },
  { label: 'ROADMAP', action: 'action-plan' },
]) {
  test(`Goals fork opens the selected goal in ${choice.label}`, async ({ page }) => {
    await page.route('**/*masterInline=goals*', route => route.fulfill({
      contentType: 'text/html',
      body: `<button id="fork" onclick="parent.postMessage({type:'ci-open-goal-branch',action:'${choice.action}',goalIndex:2},location.origin)">${choice.label}</button>`,
    }));
    await page.goto('/players/master-player.html?start=goals', { waitUntil: 'domcontentloaded' });
    await page.frameLocator('#experienceFrame').locator('#fork').click();
    await expect(page.locator('#experienceFrame')).toHaveAttribute(
      'src', new RegExp('masterInline=' + choice.action + '.*goal=2'), { timeout: 12000 }
    );
  });
}

test('Goals mini card uses 75/25 columns and stacked Edit, AI, Delete controls', async ({ page }) => {
  await page.goto('/players/master-player.html?start=goals', { waitUntil: 'domcontentloaded' });
  await page.locator('#experienceFrame').evaluate(el => {
    el.src = '/?masterInline=goals&lfm=fullheight-1&preview=1';
  });
  const goal = page.frameLocator('#experienceFrame').locator('#pbIntentionList details').first();
  await expect(goal).toBeAttached();
  const summary = goal.locator('summary');
  await expect(summary.locator('.ci-mini-card-actions')).toBeVisible();
  await expect(summary.getByRole('button', { name: /Edit Goal/ })).toBeVisible();
  await expect(summary.getByRole('switch', { name: /AI for Goal/ })).toBeVisible();
  await expect(summary.getByRole('button', { name: /Delete Goal/ })).toBeVisible();
  const columns = await summary.evaluate(el => {
    const main = el.querySelector('.ci-mini-card-main').getBoundingClientRect();
    const controls = el.querySelector('.ci-mini-card-actions').getBoundingClientRect();
    return main.width / controls.width;
  });
  expect(columns).toBeCloseTo(3, 0);
  await summary.getByRole('button', { name: /Edit Goal/ }).click();
  await expect(goal).toHaveAttribute('open', '');
  await expect(goal.locator('.pb-goal-edit')).toBeVisible();
  await goal.getByRole('button', { name: 'CANCEL' }).click();
  await expect(goal.locator('.pb-goal-edit')).toBeHidden();
  await expect(goal.getByRole('button', { name: 'VISUALIZATION' })).toBeVisible();
  await expect(goal.getByRole('button', { name: 'ROADMAP' })).toBeVisible();
});

test('Entrepreneur Library lists all 31 skills and opens the selected card', async ({ page }) => {
  await page.goto('/players/master-player.html?start=entrepreneur-library', { waitUntil: 'domcontentloaded' });
  await page.locator('#experienceFrame').evaluate(el => {
    el.src = '/?masterInline=entrepreneur-library&lfm=fullheight-1&preview=1';
  });
  const library = page.frameLocator('#experienceFrame');
  await expect(library.locator('#entrepreneurLibraryGrid .ent-force-card')).toHaveCount(31);
  // Exercise the actual inline destination router after boot, not just preview's seeded render.
  await library.locator('#entrepreneurLibraryGrid').evaluate(el => el.replaceChildren());
  await library.locator('#page-entrepreneurlibrary').evaluate(() => window.openMasterDestination('entrepreneur-library'));
  await expect(library.locator('#entrepreneurLibraryGrid .ent-force-card')).toHaveCount(31);
  await library.locator('#entrepreneurLibraryGrid .ent-force-sec').first().locator('summary').click();
  await library.locator('#entrepreneurLibraryGrid .ent-force-card .cl-card').first().click();
  await expect(page.locator('#experienceFrame')).toHaveAttribute(
    'src', /masterInline=ent-card.*ent=DISCIPLINED/, { timeout: 12000 }
  );
});

test('Entrepreneur skill card shows its authored page and returns to its library', async ({ page }) => {
  await page.goto('/players/master-player.html?start=ent-card&ent=ORGANIZATIONAL%20SKILLS', { waitUntil: 'domcontentloaded' });
  await page.locator('#experienceFrame').evaluate(el => {
    el.src = '/?masterInline=ent-card&ent=ORGANIZATIONAL%20SKILLS&lfm=fullheight-1&preview=1';
  });
  const card = page.frameLocator('#experienceFrame');
  await expect(card.locator('#entLibHost img[alt="I HAVE STRONG ORGANIZATIONAL SKILLS"]')).toBeVisible();
  await expect.poll(() => page.locator('.deck').evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe('rgb(255, 255, 255)');
  await expect(card.locator('#entLibHost')).toContainText('31 / 31');
  await card.locator('#entLibHost').evaluate(el => el.replaceChildren());
  await card.locator('#page-entcard').evaluate(() => window.openMasterDestination('ent-card'));
  await expect(card.locator('#entLibHost img[alt="I HAVE STRONG ORGANIZATIONAL SKILLS"]')).toBeVisible();
  await card.getByRole('button', { name: /ENTREPRENEUR LIBRARY/ }).click();
  await expect(page.locator('#experienceFrame')).toHaveAttribute(
    'src', /masterInline=entrepreneur-library/, { timeout: 12000 }
  );
  await expect.poll(() => page.locator('.deck').evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe('rgb(116, 116, 116)');
});
