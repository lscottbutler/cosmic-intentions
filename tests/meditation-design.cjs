/* Focused isolated regression; no live accounts or writes. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium,expect}=require('@playwright/test');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results/meditation-design');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CI_CHROMIUM||'/tmp/ci-chromium',args:['--no-sandbox']});
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
  await context.addInitScript(()=>{
   const NativeAudio=window.Audio;window.__medAudio=[];
   window.Audio=function(...args){const a=new NativeAudio(...args);window.__medAudio.push(a);return a;};window.Audio.prototype=NativeAudio.prototype;
   // Host speech voices vary. Capture cue dispatch; recorded audio below remains real.
   window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel(){},pause(){this.paused=true},resume(){this.paused=false},speak(u){window.__spoken.push(u.text)},paused:false}});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://ci.local/standalone/member-design-test.html?feature=meditation');
  const master=page.frameLocator('#ci-review-frame'),engine=master.frameLocator('#experienceFrame'),play=master.locator('#meditationDesignPlay');
  const seek=ratio=>engine.locator('body').evaluate((_,ratio)=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio},location.origin),ratio);
  const state=value=>expect(engine.locator('#player')).toHaveAttribute('data-state',value);
  await expect(play).toBeEnabled();await expect(engine.locator('.meditation-title')).toHaveText('MEDITATION');
  await expect(master.locator('#meditationModesChoices')).toBeHidden();
  const col=await page.locator('#ci-review-frame').evaluate(e=>e.clientWidth/e.parentElement.clientWidth);assert(Math.abs(col-(width>650?.75:1))<.01);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await master.locator('#stage').screenshot({path:path.join(out,'ready-'+width+'.png')});
  const toggles=master.locator('.meditation-design-toggle');
  await toggles.nth(0).click();await expect(toggles.nth(1)).toHaveAttribute('aria-expanded','true');
  await expect(master.locator('#meditationTimesChoices')).toBeVisible();
  await master.locator('#stage').screenshot({path:path.join(out,'choices-'+width+'.png')});
  await master.locator('[data-relaxation-toggle]').click();await expect(master.locator('[data-relaxation-toggle]')).toHaveAttribute('aria-pressed','true');
  await master.locator('[data-relaxation-toggle]').click();await expect(master.locator('[data-relaxation-toggle]')).toHaveAttribute('aria-pressed','false');
  await toggles.nth(1).focus();await page.keyboard.press('Enter');await expect(toggles.nth(0)).toHaveAttribute('aria-expanded','false');
  await toggles.nth(0).click();
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const mode of (process.env.CI_LAYOUT_ONLY?[]:['unguided','lightly-guided','guided']))for(const minutes of [1,2,3,5,10,15,30,45,60]){
   await master.locator('[data-med-mode="'+mode+'"]').click();await expect(play).toBeEnabled();
   await master.locator('[data-med-time="'+minutes+'"]').click();await state('ready');await expect(play).toBeEnabled();
   await expect(master.locator('[data-med-time="'+minutes+'"]')).toHaveAttribute('aria-pressed','true');
   await play.click();await state('running');await page.waitForTimeout(70);await state('running');
   await expect(master.locator('#meditationMenu')).toHaveJSProperty('inert',true);
   await seek(.5);await state('running');
   await play.click();await state('paused');await expect(play).toHaveText('RESUME');
   await play.click();await state('running');
   await seek(1);await state('complete');await expect(play).toHaveText('REPLAY');
   await play.click();await state('running');await play.click();
   console.log('PASS lifecycle',width,mode,minutes);
  }
  await master.locator('[data-med-mode="guided"]').click();await master.locator('[data-med-time="10"]').click();await expect(play).toBeEnabled();await play.click();await seek(.05);
  await expect.poll(()=>engine.locator('body').evaluate(()=>window.__medAudio.some(a=>a.duration>500&&!a.paused&&a.readyState>=2))).toBe(true);
  await expect(engine.locator('.session-card p')).toContainText('give yourself permission');
  for(const seconds of [30,65,125,185,245,305,365,425,485,570]){
   await seek(seconds/600);
   await expect.poll(()=>engine.locator('.session-card p').evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);
  }
  await seek(.05);
  await master.locator('#stage').screenshot({path:path.join(out,'guided-'+width+'.png')});
  await master.locator('[data-med-command="menu"]').click();await state('paused');
  await expect(master.locator('#meditationModesChoices')).toBeVisible();
  await master.locator('[data-med-command="menu"]').click();await expect(master.locator('#meditationModesChoices')).toBeHidden();
  await toggles.nth(0).click();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await master.locator('[data-med-mode="unguided"]').click();await master.locator('[data-med-time="1"]').click();await expect(play).toBeEnabled();await play.click();await seek(.5);
  await expect(master.locator('.shell')).toHaveClass(/meditation-design-quiet/);await expect(play).toHaveText(/^[23][0-9]$/);await page.waitForTimeout(1300);
  await master.locator('#stage').screenshot({path:path.join(out,'quiet-'+width+'.png')});
  await engine.locator('.meditation-seek').focus();await page.keyboard.press('End');await expect(play).toHaveText('REPLAY');
  await page.locator('#review-menu-trigger').click();await page.locator('#review-menu').getByRole('button',{name:'NEW GRATITUDE',exact:true}).click();
  await expect(page.frameLocator('#ci-review-frame').locator('.gratitude-controls-panel')).toBeVisible();
  await expect(page.frameLocator('#ci-review-frame').locator('#meditationDesignPlay')).toHaveCount(0);
  await page.locator('#review-menu-trigger').click();await page.locator('#review-menu').getByRole('button',{name:'Meditation',exact:true}).click();await expect(play).toBeEnabled();
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await play.evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  assert.deepEqual(errors,[]);assert.deepEqual([...new Set(missing)],[]);
  console.log('PASS layout, recorded audio, keyboard, navigation, reduced motion',width);
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
