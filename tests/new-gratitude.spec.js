import { test, expect } from '@playwright/test';

for(const width of [1440,390])test(`NEW GRATITUDE duplicates Meditation separately ${width}`,async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width,height:1000});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(/supabase\.co$|sentry\.io$/.test(u.hostname)||route.request().method()!=='GET')return route.fulfill({status:200,contentType:'application/json',body:'[]'});
  if(u.pathname.startsWith('/.netlify/'))return route.fulfill({status:200,contentType:'application/json',body:'{}'});
  return route.continue();
 });
 await page.goto('/standalone/member-design-test.html?feature=new-gratitude');
 const shell=page.frameLocator('#ci-review-frame');
 const session=shell.frameLocator('#experienceFrame');
 await expect(page.locator('#feature-title')).toHaveText('NEW GRATITUDE');
 await expect(shell.locator('#experienceFrame')).toHaveAttribute('src',/new-gratitude-session\.html/);
 await expect(session.locator('#player')).toHaveAttribute('aria-label','NEW GRATITUDE player');
 await expect(shell.locator('#meditationMenu')).toBeVisible();
 await expect(shell.locator('#meditationControls')).toBeHidden();
 await expect(shell.getByRole('button',{name:'Unguided',exact:true})).toHaveCount(0);
 await expect(shell.getByRole('button',{name:'Guided',exact:true})).toHaveCount(0);
 await expect(shell.locator('.relaxation-toggle-row')).toBeHidden();
 const times=shell.getByRole('group',{name:'Expressing Gratitude Times',exact:true});
 await expect(times).toBeVisible();
 await expect(times.locator('[data-med-time]')).toHaveCount(6);
 const layout=await times.evaluate(el=>{const group=el.getBoundingClientRect(),menu=el.closest('#meditationMenu').getBoundingClientRect();return {ratio:group.width/(menu.width-18),right:menu.right-group.right};});
 if(width===1440){expect(layout.ratio).toBeCloseTo(1/3,2);expect(layout.right).toBeCloseTo(9,0);}
 for(const minutes of [1,2,3,5,10,15])await expect(times.locator(`[data-med-time="${minutes}"]`)).toBeVisible();
 await expect(session.locator('#player')).toHaveAttribute('data-phase','slides');
 await expect(session.locator('#ccbScrubber')).toBeHidden();
 await expect(session.locator('#slideCaption')).toHaveText('I AM GRATEFUL FOR A GREAT BURGER');
 await expect(session.locator('.ccb-curve')).toBeVisible();
 await expect(session.locator('#timer')).toHaveCSS('border-radius','50%');
 await expect.poll(()=>session.locator('.test-slide').evaluate(el=>el.naturalWidth)).toBe(1280);
 const stability=await page.evaluate(async()=>{
  const frame=document.getElementById('ci-review-frame');
  frame.scrollIntoView({block:'end'});
  const heights=[],positions=[];let resizeEvents=0;
  frame.contentWindow.addEventListener('resize',()=>resizeEvents++);
  for(let i=0;i<240;i++){await new Promise(requestAnimationFrame);if(i>=120){heights.push(frame.getBoundingClientRect().height);positions.push(scrollY);}}
  return {heightRange:Math.max(...heights)-Math.min(...heights),scrollRange:Math.max(...positions)-Math.min(...positions),resizeEvents,heights:[...new Set(heights)]};
 });
 console.log('GRATITUDE STABILITY',width,JSON.stringify(stability));
 expect(stability.heightRange).toBeLessThanOrEqual(1);
 expect(stability.scrollRange).toBeLessThanOrEqual(1);
 await page.screenshot({path:`test-results/new-gratitude-${width}-ready.png`,fullPage:true});
 await shell.locator('[data-med-time="1"]').click();
 await expect(shell.locator('#experienceFrame')).toHaveAttribute('src',/new-gratitude-session\.html.*t=1(?:&|$)/);
 await expect(session.locator('#player')).toHaveAttribute('data-state','ready');
 // Start without an automation-induced scroll, then measure the whole page.
 const playbackStability=await page.evaluate(async()=>{
  const frame=document.getElementById('ci-review-frame');
  scrollTo(0,Math.min(150,document.documentElement.scrollHeight-innerHeight));
  await new Promise(requestAnimationFrame);const startY=scrollY;
  frame.contentDocument.getElementById('experienceFrame').contentDocument.getElementById('timer').click();
  const positions=[],heights=[];
  for(let i=0;i<240;i++){await new Promise(requestAnimationFrame);positions.push(scrollY);if(i>=120)heights.push(frame.getBoundingClientRect().height);}
  return {startY,scrollRange:Math.max(...positions)-Math.min(...positions),heightRange:Math.max(...heights)-Math.min(...heights)};
 });
 console.log('GRATITUDE PLAYBACK STABILITY',width,JSON.stringify(playbackStability));
 expect(playbackStability.scrollRange).toBeLessThanOrEqual(1);
 expect(playbackStability.heightRange).toBeLessThanOrEqual(2);
 await expect(session.locator('#player')).toHaveAttribute('data-state','running');
 await expect(shell.locator('#meditationControls')).toBeVisible();
 await expect(shell.locator('#meditationMenu')).toBeHidden({timeout:8000});
 await expect(session.locator('#timer')).toHaveCSS('opacity','0');
 await expect(session.locator('#ccbScrubber')).toBeHidden();
 await session.locator('#slideshowToggle').click();
 await expect(session.locator('#player')).toHaveAttribute('data-state','paused');
 await session.locator('#slideshowToggle').click();
 await expect(session.locator('#player')).toHaveAttribute('data-state','running');
 await session.locator('body').evaluate(()=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio:1},location.origin));
 await expect(session.locator('#player')).toHaveAttribute('data-phase','meditation');
 await expect(session.locator('.test-slide')).toBeHidden();
 await expect(session.locator('#slideCaption')).toBeHidden();
 await expect(session.locator('.ccb-curve')).toBeVisible();
 await expect(session.locator('#value')).toHaveText('1\n00');
 await expect(session.locator('#timer')).toHaveCSS('opacity','1');
 await expect(session.locator('#ccbScrubber')).toBeVisible();
 await page.screenshot({path:`test-results/gratitude-meditation-${width}.png`,fullPage:true});
 await session.locator('body').evaluate(()=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio:1},location.origin));
 await expect(session.locator('#player')).toHaveAttribute('data-state','complete');
 await expect(shell.locator('#meditationMenu')).toBeVisible();
 await expect(shell.locator('#gratitude-module-group')).toBeVisible();
 await expect(shell.locator('#gratitude-time-group')).toBeVisible();
 await expect(shell.locator('#gratitude-back')).toBeVisible();
 await expect(shell.locator('[data-med-command="menu"]')).toHaveAttribute('aria-expanded','true');
 await page.screenshot({path:`test-results/gratitude-complete-${width}.png`,fullPage:true});
 await session.getByRole('button',{name:'Replay 1 minute gratitude',exact:true}).click();
 await expect(session.locator('#player')).toHaveAttribute('data-state','running');
 await expect(shell.locator('#meditationMenu')).toBeHidden({timeout:8000});
 await shell.getByRole('button',{name:'New Gratitude Menu',exact:true}).click();
 await expect(shell.locator('#meditationMenu')).toBeVisible();
 await expect(shell.locator('#meditationModes')).toBeHidden();
 await expect(shell.locator('.relaxation-toggle-row')).toBeHidden();
 await shell.locator('[data-med-time="3"]').click();
 await expect(shell.locator('#experienceFrame')).toHaveAttribute('src',/new-gratitude-session\.html.*t=3(?:&|$)/);
 await expect(session.locator('#player')).toHaveAttribute('data-state','ready');
 await page.screenshot({path:`test-results/new-gratitude-${width}-menu.png`,fullPage:true});
 await shell.locator('#siteMenuButton').click();
 await page.locator('#review-menu-items').getByRole('button',{name:'Meditation',exact:true}).click();
 await expect(page.locator('#feature-title')).toHaveText('Meditation');
 await expect(shell.locator('#experienceFrame')).toHaveAttribute('src',/\/players\/meditation\.html/);
 await expect(session.getByRole('button',{name:'Start 15 minute meditation',exact:true})).toBeVisible();
 await expect(shell.locator('[data-med-command="menu"]')).toHaveAttribute('aria-label','Meditation Menu');
 await expect(shell.locator('#gratitude-time-group')).toHaveCount(0);
 await expect(shell.getByRole('button',{name:'Unguided',exact:true})).toBeVisible();
 await expect(shell.getByRole('button',{name:'Guided',exact:true})).toBeVisible();
 await expect(shell.locator('.relaxation-toggle-row')).toBeVisible();
 await shell.locator('#siteMenuButton').click();
 await expect(page.locator('#review-menu-items').getByRole('button',{name:'Gratitude',exact:true})).toBeVisible();
 await page.locator('#review-menu-items').getByRole('button',{name:'NEW GRATITUDE',exact:true}).click();
 await expect(session.getByRole('button',{name:'Start gratitude slideshow',exact:true})).toBeVisible();
 await expect(shell.locator('#experienceFrame')).toHaveAttribute('src',/new-gratitude-session\.html/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});

for(const width of [1440,390])test(`Gratitude module 1 test slides ${width}`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width,height:1000});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/standalone/member-design-test.html?feature=new-gratitude');
 const shell=page.frameLocator('#ci-review-frame'),session=shell.frameLocator('#experienceFrame');
 await shell.locator('[data-gratitude-module="1"]').click();
 await expect(session.locator('#timer')).toBeEnabled();
 await expect(session.locator('#player')).toHaveAttribute('data-slide','1');
 await expect(shell.locator('[data-gratitude-module="1"]')).toHaveAttribute('aria-pressed','true');
 await expect.poll(()=>session.locator('.test-slide').evaluate(el=>el.naturalWidth)).toBe(1280);
 await page.screenshot({path:`test-results/gratitude-module-${width}-ready.png`,fullPage:true});
 await shell.locator('[data-med-time="1"]').click();
 await expect(shell.locator('#experienceFrame')).toHaveAttribute('src',/module=1/);
 await expect(session.locator('#timer')).toBeEnabled();
 await session.locator('#timer').click();await expect(session.locator('#player')).toHaveAttribute('data-state','running');
 await session.locator('#slideshowToggle').click();await expect(session.locator('#player')).toHaveAttribute('data-state','paused');
 for(const [ratio,slide] of [[.25,2],[.45,3],[.65,4],[.85,5]]){
  await session.locator('body').evaluate((el,r)=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio:r},location.origin),ratio);
  await expect(session.locator('#player')).toHaveAttribute('data-slide',String(slide));
  await expect.poll(()=>session.locator('.test-slide').evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
 }
 // Fades use the slideshow clock and freeze while paused.
 for(const [ratio,slide] of [[.01,1],[.19,1],[.21,2]]){
  await session.locator('body').evaluate((el,r)=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio:r},location.origin),ratio);
  await expect(session.locator('#player')).toHaveAttribute('data-slide',String(slide));
  expect(await session.locator('.test-slide').evaluate(el=>Number(el.style.opacity))).toBeCloseTo(.5,1);
 }
 await session.locator('body').evaluate(()=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio:.85},location.origin));
 await page.screenshot({path:`test-results/gratitude-module-${width}-last.png`,fullPage:true});
 await session.locator('body').evaluate(()=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio:1},location.origin));
 await expect(session.locator('#player')).toHaveAttribute('data-phase','meditation');
 await expect(session.locator('.test-slide')).toBeHidden();
 await expect(session.locator('#value')).toHaveText('1\n00');
 await page.screenshot({path:`test-results/gratitude-meditation-${width}.png`,fullPage:true});
 await session.locator('body').evaluate(()=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio:1},location.origin));
 await expect(session.locator('#player')).toHaveAttribute('data-state','complete');
 await expect(shell.locator('#meditationMenu')).toBeVisible();
 await expect(shell.locator('#gratitude-module-group')).toBeVisible();
 await expect(shell.locator('#gratitude-time-group')).toBeVisible();
 await expect(shell.locator('#gratitude-back')).toBeVisible();
 await expect(shell.locator('[data-med-command="menu"]')).toHaveAttribute('aria-expanded','true');
 await page.screenshot({path:`test-results/gratitude-complete-${width}.png`,fullPage:true});
 await session.locator('#timer').click();await expect(session.locator('#player')).toHaveAttribute('data-slide','1');
 await expect(shell.locator('#meditationMenu')).toBeHidden({timeout:8000});
 await shell.getByRole('button',{name:'New Gratitude Menu',exact:true}).click();
 await expect(shell.locator('#gratitude-module-group')).toBeVisible();
 await page.screenshot({path:`test-results/gratitude-module-${width}-menu.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});


test('Gratitude finishes all slides then automatically starts chosen meditation',async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:1440,height:1000});
 await page.goto('/standalone/member-design-test.html?feature=new-gratitude');
 const shell=page.frameLocator('#ci-review-frame'),session=shell.frameLocator('#experienceFrame');
 await shell.locator('[data-med-time="2"]').click();
 await expect(session.locator('#timer')).toBeEnabled();
 await session.locator('#timer').click();
 await expect(session.locator('#player')).toHaveAttribute('data-phase','slides');
 await expect(session.locator('#value')).toBeHidden();
 await expect(session.locator('#player')).toHaveAttribute('data-phase','meditation',{timeout:55000});
 await expect(session.locator('#player')).toHaveAttribute('data-state','running');
 await expect(session.locator('.test-slide')).toBeHidden();
 await expect(session.locator('#timer')).toHaveAttribute('aria-label','Pause 2 minute gratitude');
 const text=await session.locator('#value').textContent();expect(['2\n00','1\n59']).toContain(text);
 await session.locator('#timer').click();await expect(session.locator('#player')).toHaveAttribute('data-state','paused');
 await page.screenshot({path:'test-results/gratitude-natural-handoff.png',fullPage:true});
 // Finish via the real timer tick, then return to setup without autoplay.
 await session.locator('body').evaluate(()=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio:.995},location.origin));
 await session.locator('#timer').click();
 await expect(session.locator('#player')).toHaveAttribute('data-state','complete');
 await expect(shell.locator('#meditationMenu')).toBeVisible();
 await shell.getByRole('button',{name:'Back to gratitude setup',exact:true}).click();
 await expect(session.locator('#player')).toHaveAttribute('data-state','ready');
 await expect(session.locator('#player')).toHaveAttribute('data-phase','slides');
 await expect(session.locator('#player')).toHaveAttribute('data-slide','1');
 await expect(shell.locator('#gratitude-back')).toBeHidden();
 await expect(shell.locator('#meditationMenu')).toBeVisible();
 await expect(shell.locator('#experienceFrame')).toHaveAttribute('src',/t=2&.*module=1/);
 await page.screenshot({path:'test-results/gratitude-back-to-setup.png',fullPage:true});
});
test('Gratitude reduced motion keeps images visible during transitions',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/players/new-gratitude-session.html?module=1&t=1&external=1');
 await expect(page.locator('#timer')).toBeEnabled();
 await page.locator('#timer').click();await page.locator('#slideshowToggle').click();
 await page.locator('body').evaluate(()=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio:.01},location.origin));
 await expect(page.locator('.test-slide')).toHaveCSS('opacity','1');
});

for(const width of [1440,390])test(`Filename captions follow every slide ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 await page.goto('/players/new-gratitude-session.html?module=1&t=1&external=1');
 await expect(page.locator('#timer')).toBeEnabled();
 const statements=['I AM GRATEFUL FOR A GREAT BURGER','I AM GRATEFUL FOR A WALK IN NATURE','I AM GRATEFUL FOR COMFORT FOOD','I AM GRATEFUL FOR EXOTIC BEACH VACATION','I AM GRATEFUL FOR MY LIFE PARTNER'];
 await page.locator('#timer').click();await page.locator('#slideshowToggle').click();
 for(let index=0;index<5;index++){
  await page.evaluate(ratio=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio},location.origin),(index*10+5)/50);
  await expect(page.locator('#slideCaption')).toHaveText(statements[index]);
  await expect(page.locator('.test-slide')).toHaveAttribute('alt',statements[index]);
  await expect(page.locator('#player')).toHaveAttribute('data-voiceover',statements[index]);
  const caption=await page.locator('#slideCaption').evaluate(el=>({fits:el.scrollWidth<=el.clientWidth,text:el.textContent,opacity:el.style.opacity}));expect(caption.fits).toBe(true);expect(caption.opacity).toBe('1');
  const imageFits=await page.locator('.test-slide').evaluate(el=>{const image=el.getBoundingClientRect(),surface=el.parentElement.getBoundingClientRect();return image.width<=surface.width+1&&image.height<=surface.height+1;});expect(imageFits).toBe(true);
  await page.screenshot({path:`test-results/gratitude-caption-${width}-${index+1}.png`});
 }
 await page.evaluate(()=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio:1},location.origin));
 await expect(page.locator('#slideCaption')).toBeHidden();await expect(page.locator('.ccb-curve')).toBeVisible();
});
