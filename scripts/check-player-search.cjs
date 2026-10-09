const { chromium, expect } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    for (const width of [1040, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*.supabase.co/**', route => route.fulfill({contentType:'application/json',body:'[]'}));
      await page.goto('http://127.0.0.1:8084/standalone/member-design-test.html?feature=meditation');
      await expect(page.locator('#feature-title')).toHaveText('Meditation');
      const input = page.locator('#player-search-input');
      async function search(query) { await input.fill(query); await input.press('Enter'); }
      async function choose(title) { await page.locator('#player-search-list button').filter({has:page.locator('strong',{hasText:title})}).click(); await expect(page.locator('#player-search-results')).toBeHidden({timeout:15000}); }
      await search('self awareness'); await choose(/^Self-awareness$/);
      const library = page.frameLocator('#ci-review-frame').frameLocator('#experienceFrame');
      await expect(library.locator('#cosmic-concept-1')).toBeVisible();
      await page.waitForTimeout(800);
      await expect(library.locator('#cosmic-concept-1')).toBeVisible();
      await search('Financial Freedom'); await choose(/^Financial Freedom$/);
      await expect(library.locator('.cl-card--cap[title="Financial Freedom"]')).toBeVisible();
      await search('disciplined'); await choose(/^I AM DISCIPLINED$/);
      await expect.poll(()=>page.frames().some(frame=>frame.url().includes('ent=DISCIPLINED'))).toBe(true);
      await search('zzzznotfound'); await expect(page.locator('#player-search-status')).toContainText('No results');
      await page.keyboard.press('Escape'); await expect(input).toBeFocused();
      const menu=page.locator('#review-menu-items button');
      const labels=await menu.allTextContents();
      for(const label of labels.filter(label=>label!=='Admin')) {
        await page.locator('#review-menu-trigger').click(); await menu.filter({hasText:new RegExp('^'+label+'$')}).click();
        await expect(input).toBeVisible();
        const box=await page.locator('#player-search').boundingBox(),hamburger=await page.locator('#review-menu-trigger').boundingBox();
        expect(box.x).toBeGreaterThan(hamburger.x+hamburger.width);
        expect(box.x+box.width).toBeLessThanOrEqual(width);
        expect(Math.abs(box.y-hamburger.y)).toBeLessThan(1);
      }
      await page.locator('.orientation').screenshot({path:'C:/WORK/ROOT/node_modules/.cache/search-header-'+width+'.png'});
      expect(errors).toEqual([]);
      console.log('PASS',width,'search and navigation for lessons, wants, skills; empty results; keyboard; consistent placement across',labels.length-1,'pages');
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
