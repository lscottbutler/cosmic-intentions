import { test, expect } from '@playwright/test';
for (const width of [1440, 390]) {
 test(`Roadmap goal expands to TO DO Notes Journal ${width}`, async ({page}) => {
  test.setTimeout(120000);
  await page.setViewportSize({width,height:1000});
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(/supabase\.co$|sentry\.io$/.test(u.hostname)||route.request().method()!=='GET')return route.fulfill({status:200,contentType:'application/json',body:'[]'});
   if(u.pathname.startsWith('/.netlify/'))return route.fulfill({status:200,contentType:'application/json',body:'{}'});
   if(u.origin==='http://localhost:8090'&&/^\/assets\/.*\.js$/.test(u.pathname)){
    const response=await route.fetch();let body=await response.text();
    for(const [a,b] of Object.entries({'I AM LAUNCHING COSMIC INTENTIONS GLOBALLY THIS SEPTEMBER':'I AM FINISHING MY FIRST SHORT STORY','I AM PERFECT EYE HEALTH':'I AM BUILDING A CONSISTENT READING HABIT','I AM THE PROUD OWNER OF A XIAOMI SU7':'I AM EXPLORING A NEW WALKING ROUTE','Draft the launch announcement':'Draft the opening scene'}))body=body.split(a).join(b);
    return route.fulfill({response,body});
   }return route.continue();
  });
  await page.addInitScript(()=>{if(localStorage.getItem('ci_goal_sections_seeded'))return;localStorage.setItem('ci_goal_sections_seeded','1');localStorage.setItem('ci_notes',JSON.stringify([{id:'review-other-goal',cat:'note',text:'Keep a daily reading log.',goal:'pv2',ts:1790989200000}]));});
  await page.goto('/standalone/member-design-test.html');
  await expect(page.locator('#review-status')).toContainText('Test improvements on',{timeout:25000});
  await page.locator('#ci-review-frame').evaluate(el=>el.contentWindow.postMessage({type:'ci-lfm-select',action:'action-plan'},location.origin));
  const app=page.frameLocator('#ci-review-frame').frameLocator('#experienceFrame');
  await expect(app.locator('#page-myroadmap')).toBeVisible({timeout:25000});
  const goal=app.locator('#page-myroadmap .wgoal').first();
  const details=goal.locator(':scope > details');
  const summary=details.locator(':scope > summary');
  await expect(summary).toContainText('I AM finishing my first short story');
  expect(await goal.evaluate(el=>el.firstElementChild.tagName)).toBe('DETAILS');
  expect(await details.locator('.roadmap-goal-section > h3').allTextContents()).toEqual(['TO DO','Notes 0','Journal 0']);
  await expect(goal.locator('#wtab-my-0')).toBeVisible();
  await summary.click();
  await expect(goal.getByRole('heading',{name:'TO DO',exact:true})).toBeHidden();
  await expect(goal.getByRole('button',{name:'Save note',exact:true}).last()).toBeHidden();
  await expect(goal.locator('#wtab-my-0')).toBeHidden();
  await expect.poll(async () => {
    const contentHeight=await app.locator('#page-myroadmap').evaluate(el=>el.getBoundingClientRect().height);
    const frameHeight=await page.frameLocator('#ci-review-frame').locator('#experienceFrame').evaluate(el=>el.getBoundingClientRect().height);
    return frameHeight-contentHeight;
  },{timeout:15000}).toBeLessThan(8);
  await page.screenshot({path:`test-results/roadmap-goal-${width}-collapsed.png`,fullPage:true});
  await summary.click();
  const notes=goal.locator('[data-goal-section="notes"]');
  const journal=goal.locator('[data-goal-section="journal"]');
  const composer=notes.locator(':scope > form');
  await composer.locator('textarea').fill('Keep the opening scene simple.');
  // A task check-off rebuilds this goal: its unsaved composer must survive.
  await goal.locator('#wtab-panel-my-0 button[title="Mark done"]').first().click();
  await expect(composer.locator('textarea')).toHaveValue('Keep the opening scene simple.');
  await composer.locator('select').selectOption({index:1});
  await composer.getByRole('button',{name:'Save note',exact:true}).click();
  await expect(notes.locator('.roadmap-goal-records')).toContainText('Keep the opening scene simple.');
  await journal.locator(':scope > form textarea').fill('I found a clearer beginning today.');
  await journal.locator(':scope > form').getByRole('button',{name:'Save journal entry',exact:true}).click();
  await expect(journal.locator('.roadmap-goal-records')).toContainText('I found a clearer beginning today.');
  await expect(goal).not.toContainText('Keep a daily reading log.');
  await goal.locator('#wtab-roadmap-0').click();
  await expect(goal.locator('#wtab-panel-roadmap-0')).toBeVisible();
  await goal.locator('#wtab-both-0').click();
  await expect(goal.locator('#wtab-panel-both-0')).toBeVisible();
  await goal.locator('#wtab-my-0').click();
  await page.screenshot({path:`test-results/roadmap-goal-${width}-expanded.png`,fullPage:true});
  await summary.click();await summary.click();
  await expect(notes.locator('.roadmap-goal-records')).toContainText('Keep the opening scene simple.');
  await expect(journal.locator('.roadmap-goal-records')).toContainText('I found a clearer beginning today.');
  const other=app.locator('#page-myroadmap .wgoal').nth(1);
  await other.locator(':scope > details > summary').click();
  await expect(other).toContainText('Keep a daily reading log.');
  await expect(other).not.toContainText('Keep the opening scene simple.');
  await expect(other).not.toContainText('I found a clearer beginning today.');
  // Failed writes retain the correct goal's draft and error through rerenders.
  await app.locator('body').evaluate(()=>{const original=Storage.prototype.setItem;window.restoreGoalStorage=()=>{Storage.prototype.setItem=original;};Storage.prototype.setItem=function(key,value){if(key==='ci_notes')throw new Error('Simulated review storage failure');return original.call(this,key,value);};});
  await composer.locator('textarea').fill('Retain this draft.');
  await composer.getByRole('button',{name:'Save note',exact:true}).click();
  await expect(composer.locator('[role="status"]')).toContainText('Could not save');
  await goal.locator('#wtab-panel-my-0 button[title="Completed — tap to undo"]').first().click();
  await expect(composer.locator('textarea')).toHaveValue('Retain this draft.');
  await expect(composer.locator('[role="status"]')).toContainText('Could not save');
  await app.locator('body').evaluate(()=>window.restoreGoalStorage());
  await composer.getByRole('button',{name:'Save note',exact:true}).click();
  await expect(notes.locator('.roadmap-goal-records')).toContainText('Retain this draft.');
  const records=await app.locator('body').evaluate(()=>JSON.parse(localStorage.getItem('ci_notes')));
  expect(records.some(n=>n.cat==='goal-note'&&n.goal==='pv1'&&n.taskKey&&n.text==='Keep the opening scene simple.')).toBe(true);
  expect(records.some(n=>n.cat==='note'&&n.goal==='pv1'&&n.text==='I found a clearer beginning today.')).toBe(true);
  expect(await app.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
