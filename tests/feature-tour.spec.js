import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const tours=JSON.parse(readFileSync('standalone/tour-captures/index.json','utf8'));
for(const viewport of [{name:'desktop',width:1440,height:1100},{name:'phone',width:390,height:844}]) {
 test(`all tour screens and captions load — ${viewport.name}`,async({page},info)=>{
  test.setTimeout(120000);await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];const writes=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url())});
  await page.goto('/standalone/how-it-works.html');
  await expect(page.locator('.feature-button')).toHaveCount(tours.length);
  for(const t of tours){await page.locator(`[data-tour="${t.id}"]`).click();await expect(page.locator('#tour-title')).toHaveText(t.label);
   for(let i=0;i<t.frames.length;i++){
    if(i)await page.getByRole('button',{name:'Next step',exact:true}).click();
    await expect(page.locator('#step-caption')).toHaveText(t.frames[i].caption);
    await expect(page.locator('#tour-image')).toHaveAttribute('src',new RegExp(`/${t.id}/${i}\\.jpg$`));
    await expect.poll(()=>page.locator('#tour-image').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
   }
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  await page.locator('[data-tour="goals"]').click();await expect(page.locator('#tour-image')).toHaveAttribute('src',/goals\/0.jpg$/);
  await page.locator('#tour-player').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath(`tour-hub-${viewport.name}.png`),fullPage:true});
  await page.getByRole('button',{name:'Next step',exact:true}).click();await page.screenshot({path:info.outputPath(`tour-click-${viewport.name}.png`),fullPage:false});
 });
}
test('playback pause, advance, replay, switching and transcript',async({page})=>{
 await page.goto('/standalone/how-it-works.html#feature=daily-habits');await expect(page.locator('#tour-title')).toHaveText('Habits');
 await page.getByRole('button',{name:'Play tour',exact:true}).click();await expect(page.getByRole('button',{name:'Pause tour',exact:true})).toBeVisible();
 await expect(page.locator('#step-number')).toHaveText('02',{timeout:8000});await page.getByRole('button',{name:'Pause tour',exact:true}).click();
 const caption=await page.locator('#step-caption').textContent();await page.waitForTimeout(4300);await expect(page.locator('#step-caption')).toHaveText(caption);
 await page.getByRole('button',{name:'Previous step',exact:true}).click();await expect(page.locator('#step-number')).toHaveText('01');
 await page.getByRole('button',{name:'Next step',exact:true}).click();await page.getByRole('button',{name:'Replay tour',exact:true}).click();await expect(page.locator('#step-number')).toHaveText('01');
 await page.locator('[data-tour="journal"]').click();await expect(page.locator('#tour-title')).toHaveText('My Journal');await expect(page.locator('#play')).toHaveText('Play tour');
 await page.locator('#feature-search').fill('meditation');await expect(page.locator('.feature-button')).toHaveCount(1);await page.locator('.feature-button').click();await expect(page.locator('#tour-title')).toHaveText('Meditation');
 await page.getByRole('button',{name:'Enlarge screen',exact:true}).click();await expect(page.locator('#zoom')).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Fit screen',exact:true}).click();
 await page.getByText('Read the steps',{exact:true}).click();await expect(page.locator('#transcript li')).toHaveCount(tours.find(t=>t.id==='meditation').frames.length);
});
test('missing image fails visibly and stops playback',async({page})=>{
 await page.route('**/tour-captures/goals/0.jpg',r=>r.fulfill({status:404,body:''}));await page.goto('/standalone/how-it-works.html#feature=goals');await expect(page.locator('#tour-status')).toContainText('could not load');await expect(page.locator('#play')).toHaveText('Play tour');
});
