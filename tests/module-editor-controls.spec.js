import {test,expect} from '@playwright/test';

test('opening title and duration are editable, previewed and preserved',async({page})=>{
 await page.goto('/standalone/module-editor.html');
 await page.getByLabel('Title text',{exact:true}).fill('RETURN TO YOURSELF');
 await expect.poll(()=>page.evaluate(()=>surface.querySelector('p').textContent)).toBe('RETURN TO YOURSELF');
 await page.getByLabel('Title duration (seconds)',{exact:true}).fill('5');await page.getByLabel('Title duration (seconds)',{exact:true}).press('Tab');
 await expect(page.locator('.opening-list-item')).toContainText('RETURN TO YOURSELF');
 await expect.poll(()=>page.evaluate(()=>openingTiming().duration)).toBe(7);
 await expect(page.locator('#status')).toContainText('Draft saved');await page.reload();
 await expect(page.getByLabel('Title text',{exact:true})).toHaveValue('RETURN TO YOURSELF');
 await expect(page.getByLabel('Title duration (seconds)',{exact:true})).toHaveValue('5');
 await expect(page.locator('#preview-duration')).toHaveText('10:00.0');
 await page.evaluate(()=>seekPreview(4.5));await expect.poll(()=>page.evaluate(()=>surface.querySelector('p').textContent)).toBe('RETURN TO YOURSELF');
 await page.evaluate(()=>seekPreview(7.5));await expect.poll(()=>page.evaluate(()=>surface.querySelector('p').textContent.startsWith('Welcome.'))).toBe(true);
});

test('slide duration can be typed in both the inspector and timeline',async({page})=>{
 await page.goto('/standalone/module-editor.html');await page.locator('#slide-list .slide-list-item').first().click();
 await page.locator('#cards .card:visible').getByLabel('Duration (seconds)',{exact:true}).fill('45');await page.locator('#cards .card:visible').getByLabel('Duration (seconds)',{exact:true}).press('Tab');
 await expect(page.getByLabel('Slide 1 duration',{exact:true})).toHaveValue('45');
 await expect.poll(()=>page.evaluate(()=>boundaries()[1].start)).toBe(45);
 await page.getByLabel('Slide 2 duration',{exact:true}).fill('65');await page.getByLabel('Slide 2 duration',{exact:true}).press('Tab');
 await expect.poll(()=>page.evaluate(()=>model.cards[1].duration)).toBe(65);
 await expect(page.locator('#preview-duration')).toHaveText('10:00.0');
 await expect(page.locator('#status')).toContainText('Draft saved');await page.reload();
 await expect(page.getByLabel('Slide 1 duration',{exact:true})).toHaveValue('45');
 await expect(page.getByLabel('Slide 2 duration',{exact:true})).toHaveValue('65');
});

test('recorded narration duration can be typed in clip and inspector',async({page})=>{
 await page.goto('/standalone/module-editor.html');
 await page.getByLabel('Recorded narration 1 duration',{exact:true}).fill('20');await page.getByLabel('Recorded narration 1 duration',{exact:true}).press('Tab');
 await expect.poll(()=>page.evaluate(()=>voiceDuration(0))).toBe(20);
 await page.locator('#slide-list .slide-list-item').first().click();
 await expect(page.getByLabel('Original narration 1 duration (seconds)',{exact:true})).toHaveValue('20');
 await page.getByLabel('Original narration 1 duration (seconds)',{exact:true}).fill('25');await page.getByLabel('Original narration 1 duration (seconds)',{exact:true}).press('Tab');
 await expect(page.getByLabel('Recorded narration 1 duration',{exact:true})).toHaveValue('25');
 await expect(page.locator('#status')).toContainText('Draft saved');await page.reload();
 await expect(page.getByLabel('Recorded narration 1 duration',{exact:true})).toHaveValue('25');
 await expect(page.locator('#preview-duration')).toHaveText('10:00.0');
});

for(const width of [1440,390])test(`Premiere workspace fits and selected controls are visible at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/standalone/module-editor.html');
 await expect(page.getByLabel('Title text',{exact:true})).toBeVisible();await page.locator('#slide-list .slide-list-item').nth(1).click();
 await expect(page.locator('#cards .card:visible')).toHaveCount(1);await expect(page.locator('#cards .card:visible').getByLabel('Duration (seconds)',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 await page.screenshot({path:`test-results/editor-premiere-${width}.png`,fullPage:true});
});
