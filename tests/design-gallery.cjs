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
   const file=path.join(root,decodeURIComponent(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
   if(!fs.existsSync(file)||!fs.statSync(file).isFile()){missing.push(u.pathname);return route.fulfill({status:404,body:''});}
   const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
   return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://ci.local/standalone/design-gallery/');
  await expect(page.locator('.concept-card')).toHaveCount(20);
  for(const family of ['sanctuary','editorial','citadel','garden','studio']){await page.locator('#family').selectOption(family);await expect(page.locator('.concept-card')).toHaveCount(4);await page.screenshot({path:path.join(out,'gallery-'+family+'-'+width+'.png'),fullPage:true});}
  await page.locator('#family').selectOption('all');
  for(let id=1;id<=20;id++){await page.locator('.thumbnail[data-open="'+id+'"]').click();await expect(page.locator('#detail')).toBeVisible();for(const view of ['citadel','goals','player']){await page.locator('[data-detail="'+view+'"]').click();assert(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth+2));}await page.locator('#close-detail').click();}
  for(const id of [1,8,15])await page.locator('[data-pick="'+id+'"]').click();await page.locator('#compare').click();await expect(page.locator('#comparison-content>section')).toHaveCount(3);await page.screenshot({path:path.join(out,'gallery-compare-'+width+'.png'),fullPage:true});await page.locator('#close-comparison').click();await page.reload();await expect(page.locator('#compare')).toHaveText('Compare shortlist (3/3)');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS 20concepts x3screens, filters, shortlist, comparison, persistence',width);await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
