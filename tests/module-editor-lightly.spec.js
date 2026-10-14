import {test,expect} from '@playwright/test';
const path='/standalone/module-editor.html?module=lightly-guided&session=10m';

test('slightly guided has three cue slots, long silence and exactly ten minutes',async({page})=>{
 await page.goto(path);await expect(page.locator('#module-version')).toHaveValue('lightly-guided');
 await expect(page.locator('#preview-duration')).toHaveText('10:00.0');await expect(page.locator('#cards .card')).toHaveCount(7);
 const intervals=await page.evaluate(()=>boundaries());expect(intervals.map(x=>x.start)).toEqual([0,30,180,195,420,435,595]);
 expect(await page.evaluate(()=>model.cards.filter(c=>c.spoken.trim()).length)).toBe(3);
 await expect(page.locator('#timeline .voice')).toHaveCount(2);await expect(page.locator('#module-note')).toContainText('not attached yet');
 await page.evaluate(()=>seekPreview(40));expect(await page.evaluate(()=>surface.querySelector('p').textContent)).toBe('');
 await page.evaluate(()=>seekPreview(185));expect(await page.evaluate(()=>surface.querySelector('p').textContent)).toContain('gently return');
 await page.evaluate(()=>seekPreview(425));expect(await page.evaluate(()=>surface.querySelector('p').textContent)).toBe('Begin again with the feeling of breathing.');
});
test('switching versions preserves guided edits and saves slight edits separately',async({page})=>{
 await page.goto('/standalone/module-editor.html');await page.locator('#title').fill('Scott’s guided training');await page.locator('#title').press('Tab');
 await expect(page.locator('#status')).toContainText('Draft saved');const guided=await page.evaluate(()=>localStorage.getItem('ci-module-editor-10m-v1'));
 await page.locator('#module-version').selectOption('lightly-guided');await expect(page).toHaveURL(/module=lightly-guided/);
 await page.locator('#slide-list .slide-list-item').nth(2).click();await page.locator('#cards .card:visible').getByLabel('On-screen instruction',{exact:true}).fill('Return gently to your natural breath.');
 await expect(page.locator('#status')).toContainText('Draft saved');await page.reload();
 expect(await page.evaluate(()=>model.cards[2].text)).toBe('Return gently to your natural breath.');
 expect(await page.evaluate(()=>localStorage.getItem('ci-module-editor-10m-v1'))).toBe(guided);
 await page.locator('#module-version').selectOption('guided');await expect(page.locator('#title')).toHaveValue('Scott’s guided training');
 await expect(page.locator('#cards .card')).toHaveCount(10);
});
test('slightly guided title insertion, reload and backup retain ten minutes',async({page})=>{
 await page.goto(path);await page.locator('#slide-list .slide-list-item').nth(1).click();await page.locator('#cards .card:visible').getByRole('button',{name:'Insert title card after'}).click();
 await page.getByLabel('Title card text',{exact:true}).fill('Begin again gently');await expect(page.locator('#status')).toContainText('Draft saved');
 await page.reload();await expect(page.locator('#preview-duration')).toHaveText('10:00.0');expect(await page.evaluate(()=>model.cards[2].text)).toBe('Begin again gently');
 const downloaded=page.waitForEvent('download');await page.locator('#export').click();expect((await downloaded).suggestedFilename()).toBe('CI-slightly-guided-10m-backup.json');
});
test('real recording is readable and only its closing-bell excerpt plays at the edges',async({page})=>{
 await page.goto(path);expect(await page.evaluate(()=>new Promise((resolve,reject)=>{const a=new Audio(model.bellAudio);a.onloadedmetadata=()=>resolve(a.duration);a.onerror=reject;}))).toBeCloseTo(600,1);
 await page.locator('#play').click();await expect.poll(()=>page.evaluate(()=>audio?.currentTime)).toBeGreaterThan(594);
 await page.evaluate(()=>seekPreview(300));await expect.poll(()=>page.evaluate(()=>audio.paused)).toBe(true);
 await page.evaluate(()=>seekPreview(596));await expect.poll(()=>page.evaluate(()=>audio.currentTime)).toBeGreaterThan(595);
 await page.locator('#stop').click();await expect(page.locator('#progress')).toHaveText('Ready');
});
for(const width of [1440,390])test(`slightly guided editor fits and renders at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(path);
 await expect(page.locator('#module-version')).toBeVisible();await page.locator('#slide-list .slide-list-item').nth(2).click();await expect(page.locator('#cards .card:visible')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 await page.screenshot({path:`test-results/slightly-guided-${width}.png`,fullPage:true});
});
