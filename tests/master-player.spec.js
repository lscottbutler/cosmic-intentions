import { test, expect } from '@playwright/test';

const PLAYER = '/players/master-player.html?start=goals&card=0';

const CORE_DESTINATIONS = [
  { action: 'goals', label: 'Goals', card: /STRATEGIC THINKER/i },
  { action: 'favorites', label: 'Favorites', card: /MANAGING TIME WISELY/i },
  { action: 'thoughts', label: 'Thoughts', card: /SKILLFUL COMMUNICATOR/i },
  { action: 'journal', label: 'Journal', card: /GOOD LISTENER/i },
  { action: 'action-plan', label: 'Action Plan', card: /METICULOUS PLANNER/i },
  { action: 'visualization', label: 'Visualize', card: /OUTSIDE BOX/i },
  { action: 'gratitude', label: 'Gratitude', card: /EMPATHETIC/i },
  { action: 'wins', label: 'Wins', card: /SELF CONFIDENT/i },
  { action: 'cosmic-library', label: 'Cosmic Library', card: /QUALITY PEOPLE/i },
];

async function waitForCard(page, expectedCard = /STRATEGIC THINKER/i) {
  const card = page.locator('#toolInspirationCard');
  await expect(card).toHaveAttribute('alt', expectedCard, { timeout: 5000 });
  await expect.poll(async () => Number(await card.evaluate((el) => getComputedStyle(el).opacity)), {
    timeout: 7000,
  }).toBeGreaterThan(0.99);
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
        gaps: {
          left: card.left - frame.left,
          right: frame.right - card.right,
          top: card.top - frame.top,
          bottom: frame.bottom - card.bottom,
        },
      };
    });

    expect(geometry.ratio).toBeCloseTo(16 / 9, 3);
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
    toolChildren: [...document.querySelector('#toolDailyInspiration').children].map((node) => node.tagName),
    generatedText: document.querySelectorAll(
      '#dailyInspiration .inspiration-kind, #dailyInspiration .statement, #dailyInspiration .inspiration-author, ' +
      '#toolDailyInspiration .inspiration-kind, #toolDailyInspiration .statement, #toolDailyInspiration .inspiration-author'
    ).length,
    upperTroughText: document.querySelector('#capTitle').textContent.trim(),
  }));

  expect(contents.homeChildren).toEqual(['IMG']);
  expect(contents.toolChildren).toEqual(['IMG']);
  expect(contents.generatedText).toBe(0);
  expect(contents.upperTroughText).toBe('');
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
      const frame = document.querySelector('#toolDailyInspiration').getBoundingClientRect();
      const image = document.querySelector('#toolInspirationCard').getBoundingClientRect();
      const style = getComputedStyle(shell);
      return {
        classes: [...shell.classList],
        frameColor: style.getPropertyValue('--header').trim(),
        troughColor: style.getPropertyValue('--trough-fill').trim(),
        upperTroughText: document.querySelector('#capTitle').textContent.trim(),
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
    expect(state.frameColor).toBe('#292929');
    expect(state.troughColor).toBe('#747474');
    expect(state.upperTroughText).not.toMatch(/affirmation/i);
    expect(state.ratio).toBeCloseTo(16 / 9, 3);
    for (const gap of state.gaps) expect(Math.abs(gap)).toBeLessThanOrEqual(1);
    await expect(card).toHaveCSS('transition-duration', '3s');
  });
}

test('player change fades only the card for 3 seconds out and 3 seconds in', async ({ page }) => {
  await page.goto(PLAYER, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const card = await waitForCard(page);
  const stage = page.locator('#stage');
  const next = page.getByRole('button', { name: /Next/i });

  // Await the click so a busy CI runner cannot delay the transition until after
  // the fixed sampling window. Then wait for the fade to begin before measuring.
  await next.click();
  await expect.poll(async () => Number(await card.evaluate((el) => getComputedStyle(el).opacity)), {
    timeout: 1500,
  }).toBeLessThan(0.99);
  await page.waitForTimeout(900);

  const fadeOut = await card.evaluate((el) => ({
    opacity: Number(getComputedStyle(el).opacity),
    duration: getComputedStyle(el).transitionDuration,
    alt: el.alt,
  }));
  expect(fadeOut.alt).toMatch(/STRATEGIC THINKER|DISCIPLINED/i);
  expect(fadeOut.opacity).toBeGreaterThanOrEqual(0);
  expect(fadeOut.opacity).toBeLessThan(1);
  expect(fadeOut.duration).toBe('3s');
  await expect(stage).toHaveCSS('opacity', '1');

  await expect(card).toHaveAttribute('alt', /DISCIPLINED/i, { timeout: 4000 });

  await page.waitForTimeout(500);
  const fadeIn = await card.evaluate((el) => ({
    opacity: Number(getComputedStyle(el).opacity),
    duration: getComputedStyle(el).transitionDuration,
  }));
  expect(fadeIn.opacity).toBeGreaterThan(0);
  expect(fadeIn.opacity).toBeLessThan(0.95);
  expect(fadeIn.duration).toBe('3s');
  await expect(stage).toHaveCSS('opacity', '1');

  await expect.poll(async () => Number(await card.evaluate((el) => getComputedStyle(el).opacity)), {
    timeout: 4000,
  }).toBeGreaterThan(0.99);
});


test('Cosmic Library frame height follows its visible workspace', async ({ page }) => {
  await page.goto('/players/master-player.html?start=cosmic-library&card=0', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });
  await waitForCard(page, /QUALITY PEOPLE/i);

  const frame = page.locator('#experienceFrame');
  await expect.poll(async () => frame.evaluate((el) => {
    const active = el.contentDocument?.querySelector('.page.active');
    return active ? Math.abs(el.offsetHeight - active.scrollHeight) : 9999;
  }), { timeout: 10000 }).toBeLessThanOrEqual(3);

  const duplicateBoxesHidden = await frame.evaluate((el) => {
    const doc = el.contentDocument;
    if (!doc) return false;
    return [...doc.querySelectorAll('.page-intro-card, .ci-admin-page-box-stack')]
      .every((node) => getComputedStyle(node).display === 'none');
  });
  expect(duplicateBoxesHidden).toBe(true);
});

test('long workspaces keep the navigation trough directly below the 16:9 card', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/players/master-player.html?start=action-plan&card=0', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });
  await waitForCard(page, /METICULOUS PLANNER/i);

  const order = await page.evaluate(() => {
    const rotation = document.querySelector('#lfmToolRotation');
    const deck = document.querySelector('.deck');
    const frame = document.querySelector('#experienceFrame');
    return {
      rotationBeforeDeck: Boolean(rotation && deck && rotation.compareDocumentPosition(deck) & Node.DOCUMENT_POSITION_FOLLOWING),
      deckBeforeWorkspace: Boolean(deck && frame && deck.compareDocumentPosition(frame) & Node.DOCUMENT_POSITION_FOLLOWING),
      menuVisible: Boolean(document.querySelector('[data-lfm-mini-command="menu"]')?.getBoundingClientRect().height),
    };
  });

  expect(order.rotationBeforeDeck).toBe(true);
  expect(order.deckBeforeWorkspace).toBe(true);
  expect(order.menuVisible).toBe(true);
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
  await expect(frameRect).toBeVisible();
  await expect(frameRect).toHaveAttribute('stroke', '#292929');

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
  expect(layers.rectStroke).toBe('rgb(41, 41, 41)');
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

  const meditation = page.frameLocator('#experienceFrame');
  await meditation.locator('#timer').click();
  await expect(controls).toBeVisible();
  await expect(menu).toBeHidden();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

  await menuButton.click();
  await expect(menu).toBeVisible();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
});
