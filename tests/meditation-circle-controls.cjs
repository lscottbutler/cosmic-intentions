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
  const master=page.frameLocator('#ci-review-frame'),engine=master.frameLocator('#experienceFrame'),play=engine.locator('.meditation-start-control');
  const seek=ratio=>engine.locator('body').evaluate((_,ratio)=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio},location.origin),ratio);
  const state=value=>expect(engine.locator('#player')).toHaveAttribute('data-state',value);
  await expect(play).toBeEnabled();await expect(master.locator('.meditation-design-summary')).toContainText(' / ');await expect(engine.locator('.meditation-title')).toHaveText('MEDITATION');
  await expect(master.locator('#meditationModesChoices')).toBeHidden();
  const col=await page.locator('#ci-review-frame').evaluate(e=>e.clientWidth/e.parentElement.clientWidth);assert(Math.abs(col-(width>650?.75:1))<.01);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await master.locator('#stage').screenshot({path:path.join(out,'ready-'+width+'.png')});

  const center=play,dot=engine.locator('.meditation-progress-marker circle');
  await expect(center).toHaveAttribute('role','button');await expect(engine.locator('.meditation-center-countdown')).toHaveCount(0);
  await expect(engine.locator('.meditation-dot-control')).toHaveCount(0);await expect(dot).toHaveAttribute('r','16.5');await expect(dot).toBeHidden();await master.locator('#stage').screenshot({path:path.join(out,'dot-hidden-ready-'+width+'.png')});
  await center.focus();await page.keyboard.press('Enter');await state('running');await expect(dot).toBeVisible();await expect(center).toHaveAttribute('data-control','pause');
  await center.click();await state('paused');await expect(center).toHaveAttribute('data-control','play');
  await center.focus();await page.keyboard.press('Space');await state('running');
  await seek(.3);await state('running');
  const position=await dot.evaluate(e=>({x:+e.getAttribute('cx'),y:+e.getAttribute('cy')}));const q=(position.x-35)/1599;assert(Math.abs(position.y-(816-132*q*(1-q)))<.1);
  await center.evaluate(e=>e.blur());await page.waitForTimeout(2500);await master.locator('#stage').screenshot({path:path.join(out,'circle-pause-'+width+'.png')});
  await seek(1);await state('complete');await expect(center).toHaveAttribute('data-control','home');await expect(center).toHaveAttribute('aria-label','Home — return to the Citadel');
  await master.locator('#stage').screenshot({path:path.join(out,'circle-home-'+width+'.png')});
  await center.click();await expect(master.locator('.shell')).toHaveClass(/home-mode/);await expect(page.locator('#feature-title')).toHaveText('Citadel');await expect(master.locator('#experienceFrame')).toHaveAttribute('src','about:blank');
  assert.deepEqual(errors,[]);console.log('PASS central play/pause keyboard, passive in-rail marker, completion Home → Citadel',width);
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
