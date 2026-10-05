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
 expect(await session.locator('.image').evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('/images/meditation/meditation-1.jpg');
 await expect.poll(()=>session.locator('.image').evaluate(async el=>{const src=getComputedStyle(el).backgroundImage.match(/url\("?([^"\)]+)/)[1];const img=new Image();img.src=src;await img.decode();return img.naturalWidth;})).toBeGreaterThan(0);
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
 await expect(shell.locator('#meditationMenu')).toBeHidden();
 await session.locator('#timer').click();
 await expect(session.locator('#player')).toHaveAttribute('data-state','paused');
 await session.locator('#timer').click();
 await expect(session.locator('#player')).toHaveAttribute('data-state','running');
 await session.locator('body').evaluate(()=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio:1},location.origin));
 await expect(session.locator('#player')).toHaveAttribute('data-state','complete');
 await session.getByRole('button',{name:'Replay 1 minute gratitude',exact:true}).click();
 await expect(session.locator('#player')).toHaveAttribute('data-state','running');
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
 await expect(session.getByRole('button',{name:'Start 15 minute gratitude',exact:true})).toBeVisible();
 await expect(shell.locator('#experienceFrame')).toHaveAttribute('src',/new-gratitude-session\.html/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});
