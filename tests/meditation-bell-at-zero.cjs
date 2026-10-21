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
  const command=async(command,extra={})=>page.evaluate(({command,extra})=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{removeEventListener('message',listener);reject(new Error('No engine status'))},5000);function listener(e){if(e.data?.type==='ci-meditation-state'){clearTimeout(timer);removeEventListener('message',listener);resolve(e.data);}}addEventListener('message',listener);postMessage({type:'ci-meditation-command',command,...extra},location.origin)}),{command,extra});
  for(const minutes of [1,10])for(const mode of ['unguided','lightly-guided','guided']){
   await page.goto('http://ci.local/players/meditation.html?external=1&t='+minutes+'&mode='+mode);
   await expect(page.locator('.meditation-start-control')).toBeVisible();
   await page.evaluate(()=>{const bell=window.__medAudio.at(-1);window.__closingPlays=[];bell.addEventListener('play',()=>window.__closingPlays.push(document.querySelector('#player').dataset.state));});
   await page.locator('.meditation-start-control').click();await command('seek',{ratio:(minutes*60-5)/(minutes*60)});
   assert(await page.evaluate(()=>window.__medAudio.at(-1).paused));assert.equal(await page.evaluate(()=>window.__closingPlays.length),0);
   await command('seek',{ratio:(minutes*60-.2)/(minutes*60)});await expect(page.locator('#player')).toHaveAttribute('data-state','complete');
   await expect.poll(()=>page.evaluate(()=>window.__closingPlays.length)).toBe(1);assert.deepEqual(await page.evaluate(()=>window.__closingPlays),['complete']);
   await expect(page.locator('.meditation-center-countdown')).toHaveCount(0);await expect(page.locator('.meditation-start-control')).toHaveAttribute('aria-label','Home — return to the Citadel');
   await command('seek',{ratio:1});assert.equal(await page.evaluate(()=>window.__closingPlays.length),1);
   await page.locator('.session-card').screenshot({path:path.join(out,'bell-zero-'+mode+'-'+minutes+'.png')});
  }
  assert.deepEqual(errors,[]);assert.deepEqual([...new Set(missing)],[]);console.log('PASS 6 sessions: no bell at5seconds,naturalzero ringsonce,completeicon,duplicate guard');
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
