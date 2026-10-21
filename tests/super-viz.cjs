/* Focused isolated regression; no live accounts or writes. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium,expect}=require('@playwright/test');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results/meditation-design');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CI_CHROMIUM||(fs.existsSync('/tmp/ci-chromium')?'/tmp/ci-chromium':undefined),args:['--no-sandbox']});
 try{for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000}}),missing=[],errors=[];
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.hostname!=='ci.local')return route.fulfill({status:204,body:''});
   // Header/admin content uses an empty fixture; unrelated service data is not loaded.
   if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body style="margin:0"></body></html>'});
   const file=path.join(root,decodeURIComponent(u.pathname));
   if(!fs.existsSync(file)||!fs.statSync(file).isFile()){missing.push(u.pathname);return route.fulfill({status:404,body:''});}
   const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
   return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
  });
  await context.addInitScript(()=>{sessionStorage.setItem('ci-relaxation-seconds','420');localStorage.setItem('ci_dvb_images',JSON.stringify(['/standalone/gratitude-v2/photos/chair.jpg','/standalone/gratitude-v2/photos/book.jpg']));localStorage.setItem('ci_dvb_title','Sample goal');
   const NativeAudio=window.Audio;window.__medAudio=[];
   window.Audio=function(...args){const a=new NativeAudio(...args);window.__medAudio.push(a);return a;};window.Audio.prototype=NativeAudio.prototype;
   // Host speech voices vary. Capture cue dispatch; recorded audio below remains real.
   window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel(){},pause(){this.paused=true},resume(){this.paused=false},speak(u){window.__spoken.push(u.text)},paused:false}});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://ci.local/standalone/super-viz.html');
  const master=page.frameLocator('#ci-review-frame'),engine=master.frameLocator('#experienceFrame'),play=engine.locator('.meditation-start-control');
  const seek=ratio=>engine.locator('body').evaluate((_,ratio)=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio},location.origin),ratio);
  const state=value=>expect(engine.locator('#player')).toHaveAttribute('data-state',value);
  await expect(play).toBeEnabled();await expect(master.locator('.meditation-design-summary')).toContainText(' / ');await expect(engine.locator('.meditation-title')).toHaveText('SUPER VIZ');
  await expect(master.locator('#meditationModesChoices')).toBeHidden();
  const col=await page.locator('#ci-review-frame').evaluate(e=>e.clientWidth/e.parentElement.clientWidth);assert(Math.abs(col-(width>650?.75:1))<.01);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await master.locator('#stage').screenshot({path:path.join(out,'ready-'+width+'.png')});

  const customize=master.locator('.meditation-customize-toggle'),headers=master.locator('.meditation-design-toggle');
  await expect(customize.locator('.meditation-current-heading')).toHaveText('CURRENTLY PLAYING');await expect(customize.locator('.meditation-current-settings')).toHaveText('10 MINUTE / UNGUIDED / NO RELAXATION MODULE');await expect(page.locator('#feature-title')).toHaveText('Super Viz');await expect(engine.locator('.meditation-title-summary')).toBeHidden();assert.equal(await customize.evaluate(e=>getComputedStyle(e,'::after').display),'none');await expect(customize).toHaveAttribute('aria-expanded','false');await expect(headers.first()).toBeHidden();
  await master.locator('#stage').screenshot({path:path.join(out,'super-viz-collapsed-'+width+'.png')});
  await customize.focus();await page.keyboard.press('Enter');await expect(customize).toHaveAttribute('aria-expanded','true');await expect(headers).toHaveCount(4);await expect(master.locator('[data-med-mode]')).toHaveCount(2);await expect(headers.first()).toBeVisible();
  for(const [index,selector] of [[0,'[data-relaxation-seconds="60"]'],[2,'[data-med-mode="guided"]'],[3,'[data-med-time="15"]']]){await headers.nth(index).click();await master.locator(selector).click();await expect(play).toBeVisible();}
  await expect(master.locator('.meditation-design-summary')).toHaveText('Guided / 15 Minutes with Relaxation Intro');
  await expect(customize.locator('.meditation-current-settings')).toHaveText('15 MINUTE / GUIDED / 1 MINUTE RELAXATION MODULE');
  await master.locator('#stage').screenshot({path:path.join(out,'super-viz-expanded-'+width+'.png')});
  await customize.focus();await page.keyboard.press('Space');await expect(headers.first()).toBeHidden();await expect(customize).toHaveAttribute('aria-expanded','false');
  await customize.click();await expect(master.locator('[data-med-time="15"]')).toHaveClass(/active/);await expect(master.locator('[data-relaxation-seconds="60"]')).toHaveAttribute('aria-pressed','true');
  await headers.nth(1).click();await master.locator('[data-vision-board="on"]').click();await expect.poll(()=>engine.locator('body').evaluate(()=>window.CISuperVizBoard?.enabled)).toBe(true);await expect(headers.nth(1)).toContainText('Digital Vision Board');await expect(headers.nth(1)).toContainText('ON');await master.locator('#stage').screenshot({path:path.join(out,'super-viz-board-settings-'+width+'.png')});
  await customize.click();await play.click();await state('running');await seek(76/960);await expect(engine.locator('.session-card p')).toContainText('Bring to mind a goal');await expect(play).toHaveAttribute('data-control','pause');await expect(engine.locator('.super-viz-board-image')).toBeVisible();await expect(engine.locator('.super-viz-board-image')).toHaveAttribute('href','/standalone/gratitude-v2/photos/chair.jpg');await seek(83/960);await expect(engine.locator('.super-viz-board-image')).toHaveAttribute('href','/standalone/gratitude-v2/photos/book.jpg');await engine.locator('body').evaluate(async()=>{const i=new Image();i.src=document.querySelector('.super-viz-board-image').getAttribute('href');await i.decode();});await page.waitForTimeout(3200);await engine.locator('.session-card').screenshot({path:path.join(out,'super-viz-board-playing-'+width+'.png')});await play.click();await state('paused');await play.click();await state('running');await seek(1);await state('complete');await expect(play).toHaveAttribute('data-icon','home');await play.click();await expect(page.locator('#feature-title')).toHaveText('Citadel');
  assert.equal(await master.locator('body').evaluate(()=>sessionStorage.getItem('ci-relaxation-seconds')),'420');assert.equal(await master.locator('body').evaluate(()=>sessionStorage.getItem('ci-super-viz-relaxation-seconds')),'60');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('PASS single Customize entry, keyboard expand/collapse, all settings retained',width);
  await page.goto('http://ci.local/players/super-viz.html?external=1&t=10&mode=guided');await expect(page.locator('.meditation-title')).toHaveText('SUPER VIZ');await page.locator('.meditation-start-control').click();await expect(page.locator('#player')).toHaveAttribute('data-state','running');await page.evaluate(()=>postMessage({type:'ci-meditation-command',command:'seek',ratio:15.2/600},location.origin));await expect(page.locator('.session-card p')).toContainText('Bring to mind a goal');assert.equal(await page.evaluate(()=>window.__medAudio.length),2);await expect.poll(()=>page.evaluate(()=>window.__spoken.some(t=>t.includes('Bring to mind a goal')))).toBe(true);assert.deepEqual(errors,[]);
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
