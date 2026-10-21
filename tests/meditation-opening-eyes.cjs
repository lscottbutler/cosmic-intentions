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
   window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel(){},pause(){this.paused=true},resume(){this.paused=false},speak(u){window.__spoken.push(u.text);window.__openingUtterance=u;},paused:false}});
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

  const center=play,art=engine.locator('.meditation-quiet-art'),marker=engine.locator('.meditation-progress-marker'),dot=marker.locator('circle');
  await expect(dot).toBeHidden();await center.click();await state('running');
  await page.waitForTimeout(500);await expect(art).toHaveCSS('opacity','0');await expect(dot).toBeHidden();assert.deepEqual(await engine.locator('body').evaluate(()=>window.__spoken),[]);
  await page.waitForTimeout(1500);const midway=Number(await art.evaluate(e=>getComputedStyle(e).opacity));assert(midway>0&&midway<1);await expect(dot).toBeHidden();
  await expect(dot).toBeVisible({timeout:3500});const markerFade=Number(await marker.evaluate(e=>getComputedStyle(e).opacity));assert(markerFade<1);
  await expect(art).toHaveCSS('opacity','1',{timeout:1000});await expect(center).toHaveAttribute('data-icon','eyes-open',{timeout:1500});assert.deepEqual(await engine.locator('body').evaluate(()=>window.__spoken),[]);
  await center.evaluate(e=>e.blur());await master.locator('#stage').screenshot({path:path.join(out,'opening-delayed-eyes-'+width+'.png'),animations:'allow'});
  await expect(center).toHaveAttribute('data-icon','eyes-closed',{timeout:1500});
  await expect(engine.locator('.session-card p')).toHaveText('OK, close your eyes and begin');await expect(engine.locator('.session-card p')).toHaveCSS('color','rgb(48, 48, 48)');
  assert.deepEqual(await engine.locator('body').evaluate(()=>window.__spoken),['OK, close your eyes and begin']);assert(await engine.locator('body').evaluate(()=>window.__medAudio.every(a=>a.paused)));
  await page.waitForTimeout(800);await master.locator('#stage').screenshot({path:path.join(out,'opening-delayed-voice-'+width+'.png')});
  await center.click();await state('paused');assert(await engine.locator('body').evaluate(()=>speechSynthesis.paused));await center.click();await state('running');await expect(center).toHaveAttribute('data-icon','eyes-closed');
  const endedAt=Date.now();await engine.locator('body').evaluate(()=>window.__openingUtterance.onend());await page.waitForTimeout(1800);await expect(center).toHaveAttribute('data-icon','eyes-closed');await expect(center).toHaveAttribute('data-icon','pause',{timeout:2500});assert(Date.now()-endedAt>=2900);
  assert.equal(await engine.locator('body').evaluate(()=>window.__spoken.filter(t=>t==='OK, close your eyes and begin').length),1);
  await seek(1);await state('complete');await expect(center).toHaveAttribute('data-icon','home');assert.deepEqual(errors,[]);console.log('PASS1sec wait,3sec dim, dotfade, openeyes, concurrentvoice/closedeyes,3sec hold, pause',width);
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
