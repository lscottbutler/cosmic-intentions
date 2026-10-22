import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`Mindset slides keep statements, favorites and one voice — ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() => {
      // Offline SDK fixture: no signed-in account, requests or production writes.
      const query=new Proxy({}, {get:(_,name)=>name==='then'?resolve=>Promise.resolve({data:[],error:null}).then(resolve):()=>query});
      window.supabase={createClient:()=>({from:()=>query,auth:{getUser:async()=>({data:{user:null}}),getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},channel:()=>query,removeChannel(){},storage:{from:()=>query}})};
    });
    await page.route('**/*.supabase.co/**', route => route.fulfill({ contentType: 'application/json', body: '[]' }));
    // Isolate this experience from unrelated eager legacy iframe players.
    await page.route('**/*', route => {
      const request=route.request(),url=new URL(request.url());
      if(request.resourceType()==='document' && ['127.0.0.1','localhost'].includes(url.hostname) && !url.searchParams.has('ent'))return route.fulfill({contentType:'text/html',body:'<!doctype html><body></body>'});
      return route.fallback();
    });
    await page.goto('/players/master-player.html?start=ent-card&ent=ORGANIZATIONAL%20SKILLS&preview=1', {waitUntil:'domcontentloaded'});
    const frame = page.frameLocator('#experienceFrame');
    await expect(frame.locator('#entExperience')).toBeVisible({ timeout: 15000 });
    await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'MINDSET', exact: true }).click();
    const players = frame.locator('.mindset-slideshow');
    await expect(players).toHaveCount(4);
    await expect(players.nth(0).locator('.mindset-caption')).toContainText('I have strong organizational skills.');
    await frame.locator('#entExperience').evaluate(() => {
      window.slideVoices = [];
      window.Audio = class {
        constructor() { window.slideVoices.push(this); }
        play() { this.started = true; return Promise.resolve(); }
        pause() { this.paused = true; }
        removeAttribute() {}
        load() {}
      };
      window.ciApiJson = async () => ({ url: 'mock:voice' });
      localStorage.setItem('ci_ent_aff_favs', JSON.stringify({ OTHER: [2] }));
    });
    const first = players.nth(0), second = players.nth(1);
    await first.getByRole('button', { name: 'Play AFFIRMATIONS', exact: true }).click();
    await expect(first.getByRole('button', { name: 'Pause AFFIRMATIONS', exact: true })).toBeVisible();
    await second.getByRole('button', { name: 'Play BELIEFS', exact: true }).click();
    await expect(first.getByRole('button', { name: 'Play AFFIRMATIONS', exact: true })).toBeVisible();
    await expect.poll(() => frame.locator('#entExperience').evaluate(() => slideVoices.filter(v => v.started && !v.paused).length)).toBe(1);
    await first.getByRole('button', { name: 'Favorite this statement', exact: true }).click();
    expect(await frame.locator('#entExperience').evaluate(() => JSON.parse(localStorage.getItem('ci_ent_aff_favs')))).toEqual({ OTHER: [2], 'ORGANIZATIONAL SKILLS': [0] });
    for (const design of ['trough', 'third', 'half', 'full']) {
      await first.getByRole('combobox').selectOption(design);
      await expect(first.locator('.mindset-stage')).toHaveAttribute('data-design', design);
      await first.locator('.mindset-art').evaluate(image => image.decode());
    }
    await first.getByRole('combobox').selectOption('trough');
    for(const image of await players.locator('.mindset-art').all())await image.evaluate(image=>{image.loading='eager';return image.decode();});
    await frame.locator('#ent-panel-mindset').screenshot({path:'test-results/mindset-integrated-'+width+'.png'});
    await first.getByRole('button', { name: 'Next statement', exact: true }).click();
    await expect(first.locator('.mindset-count')).toHaveText('2 / 5');
    await frame.getByRole('tablist', { name: 'Entrepreneur learning sections', exact: true }).getByRole('tab', { name: 'ACTION', exact: true }).click();
    expect(await frame.locator('#entExperience').evaluate(() => slideVoices.filter(v => v.started && !v.paused).length)).toBe(0);
    expect(await frame.locator('#entExperience').evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
  });
}
