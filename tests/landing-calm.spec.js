import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const baseline=JSON.parse(fs.readFileSync('tests/fixtures/landing-original-content.json','utf8'));
for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:740}]){
 for(const file of ['landing-draft.html']){
  test(`Calm landing ${file} ${viewport.width}: exact content, links and responsive rendering`,async({page},info)=>{
   await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto('/standalone/'+file);await page.evaluate(()=>document.fonts.ready);
   const actual=await page.evaluate(()=>{const body=document.body.cloneNode(true);body.querySelectorAll('script,style').forEach(n=>n.remove());return {text:body.textContent.replace(/\s+/g,' ').trim(),links:Array.from(document.querySelectorAll('a')).map(a=>({text:a.textContent.replace(/\s+/g,' ').trim(),href:a.getAttribute('href')})),overflow:document.documentElement.scrollWidth>innerWidth+1,landscape:getComputedStyle(document.querySelector('.landscape')).backgroundImage,heading:getComputedStyle(document.querySelector('h1')).color}});
   expect(actual.text).toBe(baseline[file].text);expect(actual.links).toEqual(baseline[file].links);expect(actual.overflow).toBe(false);expect(actual.landscape).toContain('landing-calm-landscape.jpg');expect(actual.heading).toBe('rgb(33, 60, 90)');
   const image=await page.request.get('/standalone/landing-calm-landscape.jpg');expect(image.ok()).toBe(true);expect((await image.body()).length).toBeGreaterThan(10000);
   for(const anchor of await page.locator('a[href^="#"]').all()){const href=await anchor.getAttribute('href');if(href.length>1){await anchor.click();await expect(page.locator(href)).toBeVisible();}}
   await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:info.outputPath('hero.png')});await page.screenshot({path:info.outputPath('full-page.png'),fullPage:true});
   if(file==='landing-draft.html'){await page.locator('#features').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('features.png')});await page.locator('#pricing').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('pricing.png')});await expect(page.locator('.pillar-txt li b').first()).toHaveCSS('color','rgb(33, 60, 90)');}
   expect(errors).toEqual([]);
  });
 }
}
test('Calm landing comparison selects each preserved page',async({page})=>{await page.goto('/standalone/landing-design-review.html');for(const [label,file] of [['Version 2','landing-v2.html'],['Version 3','landing-v3.html'],['Original','landing-draft.html']]){await page.getByRole('button',{name:label,exact:true}).click();await expect(page.locator('iframe')).toHaveAttribute('src',file);await expect(page.getByRole('button',{name:label,exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.frameLocator('iframe').locator('h1')).toBeVisible();}});
