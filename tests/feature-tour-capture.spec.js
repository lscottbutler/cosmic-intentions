import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

// Captures the delivered Master Player with fictional, local-only review data.
// No app/template file changes. No production account, network writes or AI calls.
const tours = [
 ['citadel','Citadel',null,'Find your way around your member home'],
 ['goals','Goals','#page-setup','Set your direction'],
 ['daily-habits','Habits','#habitsDailyView','Build your daily practice'],
 ['action-plan','Roadmap','#page-myroadmap','Turn your goal into next steps'],
 ['visualization','Visualization Library','#page-vizlibrary','Rehearse what you intend to do'],
 ['meditation','Meditation',null,'Choose a meditation session'],
 ['favorites','My Favorites Autoplay','#page-dailyfocus','Keep your saved practice together'],
 ['thoughts','My Thoughts','#page-notes','Collect your words to live by'],
 ['journal','My Journal','#page-mynotes','Reflect and connect an entry to a goal'],
 ['gratitude','Gratitude','#page-gratitude','Make space for gratitude'],
 ['wins','My Wins','#page-wins','Record the progress you make'],
 ['task-notes','Notes','#page-tasknotes','Find your goal and action notes'],
 ['goal-workspace','Goal Workspace','#page-goalworkspace','Bring a goal’s notes and journal together'],
 ['cosmic-library','Cosmic Library','#page-cosmiclibrary','Explore the CI resource collection'],
 ['entrepreneur-library','Entrepreneur Library','#entrepreneurLibraryGrid','Browse the 31 entrepreneur skills'],
 ['ent-card','Entrepreneur Skill Cards','#entExperience','Explore an individual skill'],
];
const root = 'test-results/tour-captures';
for (const [id,label,ready,description] of tours) {
 test(`capture ${id}`, async ({page}) => {
  test.setTimeout(60000);
  const vp={width:1360,height:1000}; await page.setViewportSize(vp);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/*', async route=> {
   const u=new URL(route.request().url());
   if (/supabase\.co$/.test(u.hostname) || route.request().method() !== 'GET' || /sentry\.io$/.test(u.hostname)) return route.fulfill({status:200,contentType:'application/json',body:'[]'});
   if (u.origin!=='http://localhost:8090') return route.continue();
   if (u.pathname==='/' && u.searchParams.has('masterInline') && !u.searchParams.has('preview')) {u.searchParams.set('preview','1');return route.fulfill({status:302,headers:{location:u.href},body:''});}
   if (u.pathname.startsWith('/.netlify/'))return route.fulfill({status:200,contentType:'application/json',body:'{}'});
   // The preview seed is local-only. Replace its authored example values with
   // neutral fictional training content in the test response, not in app code.
   if (/\/assets\/.*\.js$/.test(u.pathname)) {
    const response=await route.fetch(); let body=await response.text();
    const replacements={
     'I AM LAUNCHING COSMIC INTENTIONS GLOBALLY THIS SEPTEMBER':'I AM FINISHING MY FIRST SHORT STORY',
     'I AM PERFECT EYE HEALTH':'I AM BUILDING A CONSISTENT READING HABIT',
     'I AM THE PROUD OWNER OF A XIAOMI SU7':'I AM EXPLORING A NEW WALKING ROUTE',
     'Analyze the profiles of your earliest subscription buyers.':'Outline the beginning, middle and ending.',
     'Ship the public landing page and start collecting emails.':'Write a first draft of the opening scene.',
     'Record a 90-second launch teaser.':'Read the draft aloud and revise.',
     'Draft the launch announcement':'Write for 20 minutes',
     'Do 5 minutes of eye exercises.':'Read one chapter.',
     'Take a screen break every hour.':'Choose the next book.',
     'Set aside the monthly savings target.':'Choose a nearby route.',
     'Book a test drive this month.':'Plan a morning walk.'
    };
    for(const [a,b] of Object.entries(replacements))body=body.split(a).join(b);
    return route.fulfill({response,body});
   }
   return route.continue();
  });
  await page.addInitScript(()=> {
   if(!localStorage.getItem('ci_notes'))localStorage.setItem('ci_notes',JSON.stringify([
    {id:'demo-thought',cat:'belief',text:'I can make progress through small daily steps.',ts:1790989200000},
    {id:'demo-journal',cat:'note',text:'Today I completed the first scene of my short story.',goal:'pv1',ts:1790989200000},
    {id:'demo-goal-note',cat:'goal-note',text:'Focus on the opening scene first.',goal:'pv1',ts:1790989200000}
   ]));
   if(!localStorage.getItem('ci_habit_list'))localStorage.setItem('ci_habit_list',JSON.stringify([{id:'demo-write',name:'Write for 20 minutes',cat:'MORNING',domain:'Writing'},{id:'demo-read',name:'Read a chapter',cat:'DAY',domain:'Reading'}]));
   if(!localStorage.getItem('ci_favorites'))localStorage.setItem('ci_favorites',JSON.stringify([{type:'note',id:'demo-thought'}]));
  });
  const dir=`${root}/${id}`;mkdirSync(dir,{recursive:true});let frames=[];
  async function shot(caption,target=null,kind='look',typingValue=null){
   if(target)await target.scrollIntoViewIfNeeded();
   // Frame auto-height settles separately from page load.
   await page.waitForTimeout(650);
   let box=target && kind!=='look'?await target.boundingBox():null;
   const image=`${frames.length}.jpg`;
   await page.screenshot({path:`${dir}/${image}`,type:'jpeg',quality:82,animations:'disabled'});
   const typing=typingValue!==null?{text:typingValue,box:{x:box.x/vp.width,y:box.y/vp.height,width:box.width/vp.width,height:box.height/vp.height},style:await target.evaluate(e=>{const s=getComputedStyle(e);return Object.fromEntries(['backgroundColor','color','fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','textAlign','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderStyle','borderColor','borderRadius'].map(k=>[k,s[k]]));})}:undefined;
   frames.push({image,caption,kind,cursor:box?{x:(box.x+box.width/2)/vp.width,y:(box.y+box.height/2)/vp.height}:null,...(typing?{typing}:{})});
  }
  await page.goto('/players/master-player.html?card=0&preview=1');
  await expect(page.locator('#dailyInspiration img').first()).toBeVisible();
  await expect.poll(()=>page.locator('#dailyInspiration img').first().evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  const menu=page.locator('#siteMenuButton');
  await shot('Open the site menu in the upper-left corner.',menu,'click');await menu.click();
  const choice=page.locator('#standaloneSiteMenu').getByRole('button',{name:label,exact:true});
  await expect(choice).toBeVisible();await shot(`Choose ${label}.`,choice,'click');await choice.click();
  const frame=page.frameLocator('#experienceFrame');
  if(ready) await expect(frame.locator(ready)).toBeVisible({timeout:20000});
  else if(id==='citadel')await expect(page.locator('#homeView')).toBeVisible();
  else await expect(frame.locator('#timer')).toBeVisible({timeout:15000});
  // Center content viewport before recording its controls.
  const content=ready?frame.locator(ready):page.locator(id==='citadel'?'#homeView':'#experienceFrame');
  await shot(`You’re now in ${label}. ${description}.`,content);
  let actions=[];
  if(id==='goals')actions=[['.ci-goals-add-toggle','Click ADD A GOAL to open the goal field.'],['#pbNewIntentionInput','Write your goal in the field.','fill','I AM COMPLETING MY NEXT CHAPTER'],['.pb-goal-add-save','Click Save to add your goal.']];
  if(id==='daily-habits')actions=[['[data-habit-period="DAY"]','Choose DAY to move to that part of your routine.'],['[data-habit-period="MORNING"]','Return to MORNING.'],['.habit-check','Click the circle to mark the habit done.']];
  if(id==='thoughts')actions=[['button[onclick="notesToggleQuickAdd()"]','Click ADD A THOUGHT to open the categories.'],['#notesQuickAdd input[data-add="belief"]','Write a belief you want to keep.','fill','I make time for the work that matters.'],['#notesQuickAdd input[data-add="belief"] + button','Click Add to save the sample belief.']];
  if(id==='journal')actions=[['#page-mynotes textarea[data-id]:visible','Write your reflection in the journal field.','fill','Today I completed the first scene of my short story.'],['select[title="Associate this note with a goal"]','Choose the goal this journal entry belongs to.','select','pv1']];
  if(id==='wins')actions=[['#winPageInput','Write the progress you want to record.','fill','Completed the opening scene.'],['button[onclick="winPageAdd()"]','Click Add to log your win.']];
  if(id==='goal-workspace')actions=[['#goalWorkspaceSelect','Choose your goal to view its linked entries.','select','pv1']];
  if(id==='task-notes')actions=[['button.goal-workspace-link','Open Goal Workspace to see notes, to-dos and journal entries together.']];
  if(id==='entrepreneur-library')actions=[['#entrepreneurLibraryGrid .cl-card','Choose a skill card to open its individual experience.']];
  if(id==='favorites')actions=[['#fav-play','Click Automatically Play My Daily Runthrough to start your saved sequence.']];
  if(id==='visualization')actions=[['button[onclick="vizLibToggle(0)"]','Click a goal to open its visualization options.']];
  if(id==='action-plan')actions=[['#wtab-roadmap-0','Choose ROADMAP to see the steps for this goal.'],['#wtab-both-0','Click the plus tab to see My Actions and Roadmap together.'],['button[aria-label="Notes for A1"]:visible','Click the pencil to open the note for that action.'],['#page-myroadmap textarea:visible','Write a note for your next action.','fill','Focus on the opening scene first.']];
  if(id==='cosmic-library')actions=[['#cosmicConceptSearch','Search the library for a topic.','fill','habit'],['button[aria-label="Clear search and filters"]','Reset the filters to see the full library.']];
  if(id==='ent-card')actions=[['#ent-tab-mindset','Open Mindset to explore this skill’s mindset content.'],['#ent-tab-deeper','Open Go Deeper to explore the supporting resources.'],['#ent-tab-notes','Open My Notes to record your own reflections.'],['#ent-action-note','Write the next action you will take.','fill','Practice my opening sentence before the meeting.'],['[data-save-note]','Click Save note to keep your words.']];
  if(id==='citadel')actions=[['[data-action="goals"]','Use the Goals icon in the lower trough to open your goals.','outer']];
  if(id==='meditation')actions=[['#timer','Click Play in the center of the meditation screen.'],['[data-med-command="menu"]','Open Meditation Menu to see the session choices.','outer'],['[data-med-mode="guided"]','Choose Guided.','outer'],['[data-med-time="3"]','Choose a three-minute session.','outer']];
  for(const [sel,caption,op,value] of actions){
   const target=(op==='outer'?page:frame).locator(sel).first();await expect(target).toBeVisible({timeout:10000});
   await shot(caption,target,op==='fill'?'type':'click',op==='fill'?value:null);
   if(op==='fill')await target.fill(value);else if(op==='select')await target.selectOption(value);else await target.click({timeout:10000});
   if(sel==='.pb-goal-add-save'){const saved=frame.getByText('I AM COMPLETING MY NEXT CHAPTER',{exact:true}).first();await expect(saved).toBeVisible();await shot('Your new goal now appears in My Goals.',saved);}else await shot(op==='fill'?'Your sample text is in place.':`See the result of that action in ${label}.`,null);
  }
  const controls=await (ready?frame.locator(ready):page.locator('#meditationControls')).locator('button,input,select,textarea,a').evaluateAll(es=>es.map(e=>({tag:e.tagName,text:e.textContent.trim().slice(0,90),id:e.id,aria:e.getAttribute('aria-label'),onclick:e.getAttribute('onclick')})));
  writeFileSync(`${dir}/tour.json`,JSON.stringify({id,label,description,width:vp.width,height:vp.height,source:'2bf60145ef6ef347c24887bb4a68412d94e23321',frames,controls},null,2));
 });
}
