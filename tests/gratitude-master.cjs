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
  await context.addInitScript(()=>{sessionStorage.setItem('ci-relaxation-seconds','420');
   localStorage.setItem('ci-gratitude-master-settings-v1',JSON.stringify({relaxation:600,guided:false}));
   const NativeAudio=window.Audio;window.__medAudio=[];
   window.Audio=function(...args){const a=new NativeAudio(...args);window.__medAudio.push(a);return a;};window.Audio.prototype=NativeAudio.prototype;
   // Host speech voices vary. Capture cue dispatch; recorded audio below remains real.
   window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel(){},pause(){this.paused=true},resume(){this.paused=false},speak(u){window.__spoken.push(u.text)},paused:false}});
  });
  const page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER',e.stack)});
  await page.goto('http://ci.local/standalone/member-design-test.html?feature=gratitude');
  const member=page.frameLocator('#ci-review-frame'),play=member.locator('#gratitude-master-play');
  await expect(play).toBeVisible();await expect(member.locator('.gratitude-current')).toContainText('CURRENTLY PLAYING');
  const summary=member.locator('.gratitude-current');await expect(member.locator('.gratitude-mute')).toHaveAttribute('aria-pressed','false');const sizes=await summary.evaluate(e=>({box:e.getBoundingClientRect().width,row:e.parentElement.getBoundingClientRect().width}));assert(sizes.box<sizes.row*.75);await member.locator('.gratitude-mute').click();await expect(member.locator('.gratitude-mute')).toHaveAttribute('aria-label','Unmute audio');await member.locator('.gratitude-mute').click();await summary.click();
  await expect(member.locator('.gratitude-master-toggle')).toHaveCount(2);
  await expect(member.locator('#gratitude-relaxation,#gratitude-guidance')).toHaveCount(0);
  await member.locator('[aria-controls="gratitude-times"]').click();await member.locator('#gratitude-times [data-value="1"]').click();
  await member.locator('[aria-controls="gratitude-modules"]').click();const random=member.locator('#gratitude-modules [data-value="random"]');await expect(random).toHaveText('Random');await random.click();await expect(random).toHaveAttribute('aria-pressed','true');await expect(summary).toContainText('RANDOM · MODULE 1');await page.screenshot({path:path.join(out,'gratitude-random-'+width+'.png'),fullPage:true});await member.locator('#gratitude-modules [data-value="1"]').click();await expect(random).toHaveAttribute('aria-pressed','false');
  await expect(summary).toContainText('1 MINUTE / MODULE 1');await expect(summary).not.toContainText('RELAXATION');await expect(summary).not.toContainText('GUIDED');
  await page.screenshot({path:path.join(out,'gratitude-simplified-'+width+'.png'),fullPage:true});await summary.click();
  await play.click();await expect.poll(()=>member.locator('body').evaluate(()=>PlayerEditor.state().running),{timeout:15000}).toBe(true);
  await member.locator('body').evaluate(()=>CIGratitudeControls.toggle());
  const opening=member.frameLocator('#player');
  await member.locator('body').evaluate(()=>CIGratitudeControls.seek(0));
  const initial=await opening.locator('#ci-opening-box').getAttribute('d');
  await member.locator('body').evaluate(()=>CIGratitudeControls.seek(1));
  assert.equal(await opening.locator('#ci-opening-box').getAttribute('d'),initial);
  await expect(opening.locator('#ci-opening-box')).toHaveCSS('opacity','0.5');
  await member.locator('body').evaluate(()=>CIGratitudeControls.seek(4));
  assert.equal(await opening.locator('#ci-opening-box').getAttribute('d'),initial);
  await expect(opening.locator('#ci-opening-box')).toHaveCSS('opacity','0');await expect(opening.locator('#ci-gratitude-title')).toHaveCSS('opacity','0');
  await expect(opening.locator('p')).toContainText('Here are a few things');await expect(opening.locator('p')).toHaveCSS('font-weight','400');await expect(opening.locator('p')).toHaveCSS('color','rgb(184, 184, 184)');
  await member.locator('body').evaluate(()=>CIGratitudeControls.seek(5));await expect(opening.locator('#ci-master-intro-dim')).toHaveCSS('opacity','0.75');
  await page.screenshot({path:path.join(out,'gratitude-title-faded-'+width+'.png'),fullPage:true});
  await member.locator('body').evaluate(()=>CIGratitudeControls.toggle());
  assert.equal(await member.locator('body').evaluate(()=>CIGratitudeControls.get().relaxation),0);
  assert.equal(await member.locator('body').evaluate(()=>CIGratitudeControls.get().guided),true);
  await play.click();await expect(play).toHaveAttribute('data-icon','play');await play.click();await expect(play).toHaveAttribute('data-icon','pause');
  await member.locator('body').evaluate(()=>{const m=PlayerEditor.get();const i=m.cards.findIndex(c=>c.image);const t=m.cards.slice(0,i).reduce((n,c)=>n+c.duration,0)+3;CIGratitudeControls.seek(t);});
  await page.waitForTimeout(1900);await page.screenshot({path:path.join(out,'gratitude-master-photo-'+width+'.png'),fullPage:true});
  const count=await member.locator('body').evaluate(()=>PlayerEditor.get().cards.filter(c=>c.image).length);assert.equal(count,5);
  await member.locator('body').evaluate(()=>CIGratitudeControls.seek(PlayerEditor.state().quietStart+2));await expect(play).toHaveAttribute('data-icon','pause');
  await page.waitForTimeout(1900);await page.screenshot({path:path.join(out,'gratitude-master-quiet-'+width+'.png'),fullPage:true});
  await member.locator('body').evaluate(()=>CIGratitudeControls.seek(PlayerEditor.state().total-0.2));
  await expect(play).toHaveAttribute('data-icon','home',{timeout:10000});await play.click();await expect(page.locator('#feature-title')).toHaveText('Citadel');
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  await page.goto('http://ci.local/standalone/gratitude-v2/index.html?module=gratitude-v2');
  await expect(page.locator('.gratitude-current')).toBeVisible();
  await page.locator('#gratitude-master-play').click();await expect.poll(()=>page.evaluate(()=>PlayerEditor.state().running)).toBe(true);
  await page.evaluate(()=>CIGratitudeControls.seek(PlayerEditor.get().cards[0].audioOffset+.2));
  await expect(page.frameLocator('#player').locator('#ci-master-intro-dim')).toHaveCSS('opacity','0.75');
  await expect.poll(()=>page.evaluate(()=>__medAudio.some(a=>a.src.includes('gratitude-intro-rowan.mp3')&&!a.paused))).toBe(true);
  await page.locator('.gratitude-mute').click();await expect(page.locator('.gratitude-mute')).toHaveAttribute('aria-pressed','true');assert(await page.evaluate(()=>__medAudio.filter(a=>!a.paused).every(a=>a.muted)));assert.equal(await page.evaluate(()=>PlayerEditor.state().paused),false);await page.locator('.gratitude-mute').click();assert(await page.evaluate(()=>__medAudio.filter(a=>!a.paused).every(a=>!a.muted)));
  await page.evaluate(()=>CIGratitudeControls.seek(PlayerEditor.state().closingStart-.7));
  assert.equal(await page.evaluate(()=>__medAudio.some(a=>a.src.endsWith('/bell.ogg')&&!a.paused)),false);
  await expect.poll(()=>page.evaluate(()=>__medAudio.some(a=>a.src.endsWith('/bell.ogg')&&!a.paused)),{timeout:5000}).toBe(true);
  assert.deepEqual(errors,[]);console.log('PASS Gratitude Module/Time only; stale relaxation ignored, narration retained, pause/bell/Home',width);await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
