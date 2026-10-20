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
  await context.addInitScript(()=>{
   const NativeAudio=window.Audio;window.__medAudio=[];
   window.Audio=function(...args){const a=new NativeAudio(...args);window.__medAudio.push(a);return a;};window.Audio.prototype=NativeAudio.prototype;
   // Host speech voices vary. Capture cue dispatch; recorded audio below remains real.
   window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel(){},pause(){this.paused=true},resume(){this.paused=false},speak(u){window.__spoken.push(u.text)},paused:false}});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://ci.local/standalone/member-design-test.html?feature=meditation');
  const master=page.frameLocator('#ci-review-frame'),engine=master.frameLocator('#experienceFrame'),play=engine.locator('.meditation-dot-control');
  const seek=ratio=>engine.locator('body').evaluate((_,ratio)=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio},location.origin),ratio);
  const state=value=>expect(engine.locator('#player')).toHaveAttribute('data-state',value);
  await expect(play).toBeEnabled();await expect(master.locator('.meditation-design-summary')).toContainText(' / ');await expect(engine.locator('.meditation-title')).toHaveText('MEDITATION');
  await expect(master.locator('#meditationModesChoices')).toBeHidden();
  const col=await page.locator('#ci-review-frame').evaluate(e=>e.clientWidth/e.parentElement.clientWidth);assert(Math.abs(col-(width>650?.75:1))<.01);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await master.locator('#stage').screenshot({path:path.join(out,'ready-'+width+'.png')});

  const toggles=master.locator('.meditation-design-toggle');
  for(let i=0;i<3;i++){
   await toggles.nth(i).click();for(let j=0;j<3;j++)await expect(toggles.nth(j)).toHaveAttribute('aria-expanded',String(i===j));
   await toggles.nth(i).focus();await page.keyboard.press('Enter');for(const t of await toggles.all())await expect(t).toHaveAttribute('aria-expanded','false');
  }
  const choose=async selector=>{const option=master.locator(selector),toggle=option.locator('xpath=ancestor::*[contains(@class,"meditation-design-group")]').locator('.meditation-design-toggle');if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();await option.click();};
  await expect(master.locator('[data-relaxation-seconds]')).toHaveCount(9);
  assert.deepEqual(await master.locator('[data-relaxation-seconds]').evaluateAll(es=>es.map(e=>Number(e.dataset.relaxationSeconds))),[0,30,60,180,300,420,600,900,1800]);
  await choose('[data-med-mode="guided"]');await choose('[data-med-time="10"]');await expect(play).toBeEnabled();
  await choose('[data-relaxation-seconds="30"]');await expect(play).toBeEnabled();
  await expect(master.locator('.meditation-design-summary')).toHaveText('Guided / 10 Minutes with Relaxation Intro');await expect.poll(async()=>Number(await engine.locator('.meditation-relaxation-end').getAttribute('data-progress'))).toBeCloseTo(30/630,8);
  await choose('[data-med-mode=lightly-guided]');await choose('[data-med-time="1"]');await expect(play).toBeEnabled();
  await expect(master.locator('.meditation-design-summary')).toHaveText('Lightly Guided / 1 Minute with Relaxation Intro');
  await expect(engine.locator('.meditation-title-summary text')).toHaveText('Lightly Guided / 1 Minute with Relaxation Intro');await master.locator('#stage').screenshot({path:path.join(out,'summary-wording-'+width+'.png')});
  await choose('[data-med-time="60"]');await expect(play).toBeEnabled();await expect(engine.locator('.meditation-title-summary text')).toHaveText('Lightly Guided / 60 Minutes with Relaxation Intro');
  const fit=await engine.locator('.meditation-title-summary text').evaluate(e=>{const b=e.getBBox();return b.x>=190&&b.x+b.width<=1479});assert(fit);
  await choose('[data-med-mode=guided]');await choose('[data-med-time="10"]');await expect(play).toBeEnabled();
  await master.locator('#stage').screenshot({path:path.join(out,'relaxation-options-'+width+'.png')});
  for(const t of await toggles.all())if(await t.getAttribute('aria-expanded')==='true')await t.click();
  await page.waitForTimeout(2500);await expect(engine.locator('.meditation-title-summary text')).toHaveText('Guided / 10 Minutes with Relaxation Intro');await master.locator('#stage').screenshot({path:path.join(out,'relaxation-ready-'+width+'.png')});
  await page.waitForTimeout(2500);
  const initialHeight=await master.locator('#meditationDesignControls').evaluate(e=>e.getBoundingClientRect().height);
  await play.click();await state('running');await page.waitForTimeout(180);
  const fade=await master.locator('#meditationMenu').evaluate(e=>Number(getComputedStyle(e).opacity));assert(fade>0&&fade<1);
  const h=await master.locator('#meditationDesignControls').evaluate(e=>e.getBoundingClientRect().height);console.log('motion sample',width,fade,initialHeight,h);assert(Math.abs(h-initialHeight)<2);
  await page.waitForTimeout(2400);await expect(master.locator('#meditationMenu')).toHaveCSS('opacity','0');
  await expect(engine.locator('body')).toHaveClass(/meditation-stage-relaxation/);await expect(play).toHaveAttribute('data-control','pause');
  assert(await engine.locator('body').evaluate(()=>window.__medAudio.every(a=>a.paused)));assert.equal(await engine.locator('body').evaluate(()=>window.__spoken.length),0);
  await page.waitForTimeout(2500);await master.locator('#stage').screenshot({path:path.join(out,'relaxation-running-'+width+'.png')});
  await play.click();await state('paused');await expect(play).toHaveAttribute('data-control','play');await play.click();await state('running');
  await engine.locator('body').evaluate(()=>{window.__states=[];parent.addEventListener('message',e=>{if(e.data?.type==='ci-meditation-state')window.__states.push(e.data.state)});});
  await seek(29.8/630);await expect(engine.locator('body')).not.toHaveClass(/meditation-stage-relaxation/);await state('running');
  await expect.poll(()=>engine.locator('body').evaluate(()=>window.__medAudio.some(a=>!a.paused))).toBe(true);
  assert(await engine.locator('body').evaluate(()=>!window.__states.includes('complete')));
  await seek(60/630);await expect(engine.locator('.session-card p')).toContainText('give yourself permission');
  await seek(1);await state('complete');await expect(play).toHaveAttribute('data-control','replay');await play.click();await state('running');await expect(engine.locator('body')).toHaveClass(/meditation-stage-relaxation/);await play.click();
  for(const t of await toggles.all())if(await t.getAttribute('aria-expanded')!=='true')await t.click();
  await choose('[data-relaxation-seconds="1800"]');await expect(play).toBeEnabled();await expect.poll(async()=>Number(await engine.locator('.meditation-relaxation-end').getAttribute('data-progress'))).toBeCloseTo(.75,8);await play.click();await expect(play).toHaveAttribute('data-control','pause');await state('running');
  await seek(1799.8/2400);await expect(engine.locator('body')).not.toHaveClass(/meditation-stage-relaxation/);await state('running');await play.click();
  for(const t of await toggles.all())if(await t.getAttribute('aria-expanded')!=='true')await t.click();
  await choose('[data-relaxation-seconds="0"]');await expect(play).toBeEnabled();await expect(master.locator('.meditation-design-summary')).toHaveText('Guided / 10 Minutes');await expect(engine.locator('.meditation-relaxation-end')).toBeHidden();
  await play.click();await expect(engine.locator('body')).not.toHaveClass(/meditation-stage-relaxation/);await state('running');await play.click();
  assert.deepEqual(errors,[]);assert.deepEqual([...new Set(missing)],[]);
  console.log('PASS exclusive sections,9 choices, quiet prelude, pause, natural transition, replay,30min/off',width);
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
