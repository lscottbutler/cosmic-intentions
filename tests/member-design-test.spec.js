import {test,expect} from '@playwright/test';
const features=[['goals','#page-setup'],['daily-habits','#page-habits'],['action-plan','#page-myroadmap'],['visualization','#page-vizlibrary'],['favorites','#page-dailyfocus'],['thoughts','#page-notes'],['journal','#page-mynotes'],['gratitude','#page-gratitude'],['wins','#page-wins'],['task-notes','#page-tasknotes'],['goal-workspace','#page-goalworkspace'],['cosmic-library','#page-cosmiclibrary'],['entrepreneur-library','#page-entrepreneurlibrary'],['ent-card','#page-entcard']];
async function fixture(page){
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(/supabase\.co$|sentry\.io$/.test(u.hostname)||route.request().method()!=='GET')return route.fulfill({status:200,contentType:'application/json',body:'[]'});if(u.pathname.startsWith('/.netlify/'))return route.fulfill({status:200,contentType:'application/json',body:'{}'});if(u.origin==='http://localhost:8090'&&/^\/assets\/.*\.js$/.test(u.pathname)){const response=await route.fetch();let body=await response.text();const replacements={'I AM LAUNCHING COSMIC INTENTIONS GLOBALLY THIS SEPTEMBER':'I AM FINISHING MY FIRST SHORT STORY','I AM PERFECT EYE HEALTH':'I AM BUILDING A CONSISTENT READING HABIT','I AM THE PROUD OWNER OF A XIAOMI SU7':'I AM EXPLORING A NEW WALKING ROUTE'};for(const [a,b] of Object.entries(replacements))body=body.split(a).join(b);return route.fulfill({response,body});}return route.continue();});
 await page.addInitScript(()=>{localStorage.setItem('ci_notes',JSON.stringify([{id:'test-journal',cat:'note',text:'I made progress on the story.',goal:'pv1',ts:1790989200000},{id:'test-goal-note',cat:'goal-note',text:'Focus on the first scene.',goal:'pv1',ts:1790989200000}]));localStorage.setItem('ci_habit_list',JSON.stringify([{id:'test-read',name:'Read a chapter',cat:'MORNING',domain:'Reading'}]));});
 await page.goto('/standalone/member-design-test.html');
 await expect(page.locator('#review-status')).toContainText('Test improvements on',{timeout:25000});
}
for(const [name,width] of [['desktop',1440],['phone',390]]){
 test(`member design comparison and every member destination ${name}`,async({page})=>{
  test.setTimeout(180000);await page.setViewportSize({width,height:1100});const errors=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
  const master=page.frameLocator('#ci-review-frame');
  const geometry=await master.locator('.cap').evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,color:getComputedStyle(e).backgroundColor}));
  await page.getByLabel('Original',{exact:true}).check();await expect(page.locator('.orientation')).toBeHidden();await page.getByLabel('Test improvements',{exact:true}).check();await expect(page.locator('.orientation')).toBeVisible();
  expect(await master.locator('.cap').evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,color:getComputedStyle(e).backgroundColor}))).toEqual(geometry);
  for(const [action,selector] of features){
   await page.locator('#ci-review-frame').evaluate((el,action)=>el.contentWindow.postMessage({type:'ci-lfm-select',action},location.origin),action);
   const app=master.frameLocator('#experienceFrame');await expect(app.locator(selector)).toBeVisible({timeout:20000});
   await expect(app.locator(selector+' > .ci-review-guidance')).toBeVisible();
   const baseline=await app.locator(selector).evaluate(e=>Array.from(e.querySelectorAll('button')).map(b=>b.textContent));
   await page.getByLabel('Original',{exact:true}).check();await expect(app.locator(selector+' > .ci-review-guidance')).toBeHidden();
   expect(await app.locator(selector).evaluate(e=>Array.from(e.querySelectorAll('button')).map(b=>b.textContent))).toEqual(baseline);
   await page.getByLabel('Test improvements',{exact:true}).check();await expect(app.locator(selector+' > .ci-review-guidance')).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   if(['goals','daily-habits','goal-workspace'].includes(action))await page.screenshot({path:`test-results/member-design-${name}-${action}.png`,fullPage:true});
  }
  // Meditation is intentionally excluded from injected styling and guidance.
  await page.locator('#ci-review-frame').evaluate(el=>el.contentWindow.postMessage({type:'ci-lfm-select',action:'meditation'},location.origin));
  const meditation=master.frameLocator('#experienceFrame');await expect(meditation.locator('#timer')).toBeVisible({timeout:20000});expect(await meditation.locator('#ci-review-test-style').count()).toBe(0);
  expect(errors).toEqual([]);
 });
}
test('existing goal entry and local edits remain usable',async({page})=>{
 test.setTimeout(90000);await fixture(page);const master=page.frameLocator('#ci-review-frame');await page.getByRole('button',{name:'Open Goals',exact:true}).click();const app=master.frameLocator('#experienceFrame');await expect(app.locator('#page-setup')).toBeVisible({timeout:20000});
 await app.locator('.ci-goals-add-toggle').click();await app.locator('#pbNewIntentionInput').fill('I AM WRITING MY NEXT CHAPTER');await app.locator('.pb-goal-add-save').click();await expect(app.getByText('I AM WRITING MY NEXT CHAPTER',{exact:true}).first()).toBeVisible();
 await page.getByLabel('Original',{exact:true}).check();await expect(app.getByText('I AM WRITING MY NEXT CHAPTER',{exact:true}).first()).toBeVisible();await page.getByLabel('Test improvements',{exact:true}).check();
 await page.locator('#ci-review-frame').evaluate(el=>el.contentWindow.postMessage({type:'ci-lfm-select',action:'home'},location.origin));await page.getByRole('button',{name:'Open Goals',exact:true}).click();await expect(app.locator('#page-setup')).toBeVisible({timeout:20000});
 await page.screenshot({path:'test-results/member-design-goal-saved.png',fullPage:true});
});

test('existing hamburger opens the review menu and navigates',async({page})=>{
 await fixture(page);const master=page.frameLocator('#ci-review-frame');
 await master.locator('#siteMenuButton').click();await expect(page.locator('#review-menu')).toBeVisible();
 await page.locator('#review-menu').getByRole('button',{name:'Habits',exact:true}).click();await expect(page.locator('#review-menu')).toBeHidden();
 await expect(master.frameLocator('#experienceFrame').locator('#page-habits')).toBeVisible({timeout:20000});
 await expect(page.locator('#feature-title')).toHaveText('Habits');
 await master.locator('#siteMenuButton').click();await page.getByRole('button',{name:'Close',exact:true}).click();await expect(page.locator('#review-menu')).toBeHidden();
});


for(const width of [1440,390])test(`trough removal and note / to-do shortcuts ${width}`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width,height:1000});await fixture(page);
 const master=page.frameLocator('#ci-review-frame');
 expect(await master.locator('#capTitle').evaluate(e=>e.getBoundingClientRect().height)).toBe(0);
 expect(await master.locator('#capTitle').evaluate(e=>getComputedStyle(e,'::before').content)).toBe('none');
 await expect(master.locator('#siteMenuButton')).toBeVisible();
 await page.screenshot({path:`test-results/no-upper-trough-${width}-citadel.png`,fullPage:true});
 await page.getByRole('button',{name:'Add a note',exact:true}).click();
 const app=master.frameLocator('#experienceFrame');
 await expect(app.locator('#page-mynotes')).toBeVisible({timeout:20000});
 await expect(app.locator('#notesadd-note')).toBeVisible();await expect(app.locator('#notesadd-note')).toBeFocused();
 await app.locator('#notesadd-note').fill('A fictional note for the layout review.');await app.locator('#notesadd-note').press('Tab');
 await expect(app.getByText('A fictional note for the layout review.',{exact:true}).first()).toBeVisible();
 await page.getByRole('button',{name:'TO DO',exact:true}).click();
 await expect(app.locator('#page-myroadmap')).toBeVisible({timeout:20000});
 await page.screenshot({path:`test-results/no-upper-trough-${width}-todo.png`,fullPage:true});
 await master.locator('#siteMenuButton').click();await expect(page.locator('#review-menu')).toBeVisible();
 await page.locator('#review-menu').getByRole('button',{name:'Meditation',exact:true}).click();
 await expect(master.frameLocator('#experienceFrame').locator('#timer')).toBeVisible({timeout:20000});
 expect(await master.locator('#capTitle').evaluate(e=>e.getBoundingClientRect().height)).toBe(0);
 await expect(master.locator('#siteMenuButton')).toBeVisible();
 await page.screenshot({path:`test-results/no-upper-trough-${width}-meditation.png`,fullPage:true});
});
