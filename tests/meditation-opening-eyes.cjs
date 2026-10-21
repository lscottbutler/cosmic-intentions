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

  const center=play;
  await expect(engine.locator('.meditation-progress-marker circle')).toBeHidden();
  await center.click();await state('running');await expect(center).toHaveAttribute('data-icon','eyes-open');
  await expect(engine.locator('.session-card p')).toHaveText('OK, close your eyes and begin');
  assert.equal(await engine.locator('.meditation-quiet-art').evaluate(e=>getComputedStyle(e).opacity),'1');
  assert.equal(await engine.locator('.meditation-quiet-art path[fill="#000"]').getAttribute('fill-opacity'),'.75');
  assert.deepEqual(await engine.locator('body').evaluate(()=>window.__spoken),['OK, close your eyes and begin']);
  assert(await engine.locator('body').evaluate(()=>window.__medAudio.every(a=>a.paused)));
  await center.click();await state('paused');assert(await engine.locator('body').evaluate(()=>speechSynthesis.paused));await center.click();await state('running');await expect(center).toHaveAttribute('data-icon','eyes-open');
  await center.evaluate(e=>e.blur());await master.locator('#stage').screenshot({path:path.join(out,'opening-eyes-open-'+width+'.png')});
  await center.evaluate(e=>{window.__eyeTimes={};new MutationObserver(()=>{window.__eyeTimes[e.dataset.icon]??=performance.now()}).observe(e,{attributes:true,attributeFilter:['data-icon']});window.__openingUtterance.onend();});await expect(center).toHaveAttribute('data-icon','eyes-closed');
  await page.waitForTimeout(800);await master.locator('#stage').screenshot({path:path.join(out,'opening-eyes-closed-'+width+'.png')});
  await expect(center).toHaveAttribute('data-icon','pause',{timeout:4000});const eyeTimes=await center.evaluate(()=>window.__eyeTimes);assert(eyeTimes.pause-eyeTimes['eyes-closed']>=2900&&eyeTimes.pause-eyeTimes['eyes-closed']<=3500);
  await center.click();await state('paused');await expect(center).toHaveAttribute('data-icon','play');await center.click();await state('running');await expect(center).toHaveAttribute('data-icon','pause');
  assert.equal(await engine.locator('body').evaluate(()=>window.__spoken.filter(t=>t==='OK, close your eyes and begin').length),1);
  await master.locator('#stage').screenshot({path:path.join(out,'opening-pause-'+width+'.png')});
  await seek(1);await state('complete');await expect(center).toHaveAttribute('data-icon','home');
  assert.deepEqual(errors,[]);console.log('PASS immediate75percent dim, openeyes voice, closedeyes fade/3seconds, Pause, nointrorepeat',width);
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
