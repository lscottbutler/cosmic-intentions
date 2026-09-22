import { test, expect } from '@playwright/test';

const PLAYER = '/players/master-player.html?start=goals&card=0';

async function waitForCard(page) {
  const card = page.locator('#toolInspirationCard');
  await expect(card).toHaveAttribute('src', /ENT%20STRATEGIC%20THINKER\.PNG/i, { timeout: 5000 });
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
    await page.goto(PLAYER);
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

test('player change fades only the card for 3 seconds out and 3 seconds in', async ({ page }) => {
  await page.goto(PLAYER);
  const card = await waitForCard(page);
  const stage = page.locator('#stage');
  const next = page.getByRole('button', { name: /Next/i });

  const clickPromise = next.click();
  await page.waitForTimeout(1500);

  const fadeOut = await card.evaluate((el) => ({
    opacity: Number(getComputedStyle(el).opacity),
    duration: getComputedStyle(el).transitionDuration,
    alt: el.alt,
  }));
  expect(fadeOut.alt).toMatch(/STRATEGIC THINKER/i);
  expect(fadeOut.opacity).toBeGreaterThan(0.05);
  expect(fadeOut.opacity).toBeLessThan(0.95);
  expect(fadeOut.duration).toBe('3s');
  await expect(stage).toHaveCSS('opacity', '1');

  await page.waitForTimeout(1800);
  await expect(card).toHaveAttribute('alt', /DISCIPLINED/i);

  await page.waitForTimeout(1500);
  const fadeIn = await card.evaluate((el) => ({
    opacity: Number(getComputedStyle(el).opacity),
    duration: getComputedStyle(el).transitionDuration,
  }));
  expect(fadeIn.opacity).toBeGreaterThan(0.05);
  expect(fadeIn.opacity).toBeLessThan(0.95);
  expect(fadeIn.duration).toBe('3s');
  await expect(stage).toHaveCSS('opacity', '1');

  await clickPromise;
  await expect.poll(async () => Number(await card.evaluate((el) => getComputedStyle(el).opacity)), {
    timeout: 4000,
  }).toBeGreaterThan(0.99);
});
