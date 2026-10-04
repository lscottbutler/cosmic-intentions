/* Review-only overlay. Canonical app/player files are never rewritten.
   No service calls, account writes, analytics or invented save/progress states.
   Session storage contains only the last public feature identifier. */
(() => {
 const frame=document.getElementById('ci-review-frame');
 const status=document.getElementById('review-status');
 const title=document.getElementById('feature-title');
 const purpose=document.getElementById('feature-purpose');
 const next=document.getElementById('feature-next');
 const addNote=document.getElementById('add-note');
 let pendingDashboard=false;
 const menu=document.getElementById('review-menu');
 const features={
  home:['Citadel','Your next actions, notes and journal — connected to your goals.','Review your list in one click, or capture something while it is fresh.'],
  goals:['Goals','Keep your direction visible, in your own words.','Select a goal to choose Visualization or Roadmap. ADD A GOAL opens the entry field.'],
  'daily-habits':['Habits','Work through your existing daily routine.','Choose MORNING, DAY, EVENING or BEFORE SLEEP. Select a habit circle to check it off.'],
  'action-plan':['My Roadmap','Bring your next actions and Roadmap together.','Switch My Actions / Roadmap, or use the plus tab for both. The pencil opens an action note.'],
  visualization:['Visualization','Choose the goal you want to rehearse.','Open a goal for its existing visualization choices. Playback uses your Master Player.'],
  meditation:['Meditation','Make space for your chosen meditation practice.','Press Play to begin. Your existing Meditation Menu then offers session choices.'],
  favorites:['My Favorites Autoplay','Keep your saved practices together.','Review the saved sequence before starting Autoplay.'],
  thoughts:['My Thoughts','Keep the words and ideas that matter to you.','ADD A THOUGHT opens your existing entry categories.'],
  journal:['My Journal','Reflect in your own words.','Link an entry to a goal with the existing goal selector.'],
  gratitude:['Gratitude','Choose from your existing gratitude practices.','Use the current page choices to select a practice.'],
  wins:['My Wins','Record the progress you notice.','Add a win using the existing form; your entries remain yours.'],
  'task-notes':['Notes','Find your goal and action notes in one place.','Open Goal Workspace to see the connected notes and journal entries.'],
  'goal-workspace':['Goal Workspace','Keep a goal’s notes, actions and journal entries together.','Choose a goal with linked notes or journal entries. Use the existing Save controls to keep edits.'],
  'cosmic-library':['Cosmic Library','Explore your existing collection of ideas and lessons.','Search by topic, or clear your filters to return to the full collection.'],
  'entrepreneur-library':['Entrepreneur Library','Explore your existing entrepreneur skills.','Choose a skill card to open its individual experience.'],
  'ent-card':['Entrepreneur Skill Cards','Work with the selected skill.','Use the existing tabs for Mindset, Go Deeper and My Notes.'],
  admin:['Admin','Your existing administrator workspace.','Owner access is required. Member presentation changes do not apply here.']
 };
 const inlinePages={setup:'goals',habits:'daily-habits',myroadmap:'action-plan',vizlibrary:'visualization',dailyfocus:'favorites',notes:'thoughts',mynotes:'journal',gratitude:'gratitude',wins:'wins',tasknotes:'task-notes',goalworkspace:'goal-workspace',cosmiclibrary:'cosmic-library',entrepreneurlibrary:'entrepreneur-library',entcard:'ent-card',admin:'admin'};
 let enabled=true,current='home',last=null,scheduled=false;
 const docs=new WeakSet(),frames=new WeakSet();
 try{const saved=sessionStorage.getItem('ci-review-last-feature');if(features[saved]&&saved!=='home'&&saved!=='admin')last=saved;}catch(_){/* Comparison remains usable without storage. */}
 function renderFeature(action){
  if(!features[action])return;
  if(dashboard.open)return;
  current=action;const copy=features[action];
  if(title.textContent!==copy[0])title.textContent=copy[0];
  if(purpose.textContent!==copy[1])purpose.textContent=copy[1];
  if(next.textContent!==copy[2])next.textContent=copy[2];
  if(action!=='home'&&action!=='admin'){last=action;try{sessionStorage.setItem('ci-review-last-feature',action);}catch(_){}}

 }
 function openFeature(action){frame.contentWindow?.postMessage({type:'ci-lfm-select',action},location.origin);renderFeature(action);}
 const menuLabels={home:'Citadel',goals:'Goals','daily-habits':'Habits',favorites:'My Favorites Autoplay',thoughts:'My Thoughts',journal:'My Journal','action-plan':'Roadmap',visualization:'Visualization Library',meditation:'Meditation',gratitude:'Gratitude','cosmic-library':'Cosmic Library','entrepreneur-library':'Entrepreneur Library','ent-card':'Entrepreneur Skill Cards',wins:'My Wins','task-notes':'Notes','goal-workspace':'Goal Workspace',admin:'Admin'};
 for(const [action,label] of Object.entries(menuLabels)){const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>{menu.close();openFeature(action);});document.getElementById('review-menu-items').append(button);}
 document.getElementById('close-menu').addEventListener('click',()=>menu.close());
 menu.addEventListener('close',()=>{frame.contentDocument?.getElementById('siteMenuButton')?.focus();});
 const overlayCss=`
 html.ci-review-test .page:not(#page-admin) .ci-review-guidance{font:13px/1.55 Arial,sans-serif;padding:12px 16px;margin:12px 0 18px;background:#f2ede7;color:#292929;border-left:3px solid #747474;text-transform:none;letter-spacing:0;overflow-wrap:anywhere}
 html:not(.ci-review-test) .ci-review-guidance{display:none!important}
 html.ci-review-test .page:not(#page-admin) button:focus-visible,html.ci-review-test .page:not(#page-admin) a:focus-visible,html.ci-review-test .page:not(#page-admin) input:focus-visible,html.ci-review-test .page:not(#page-admin) textarea:focus-visible,html.ci-review-test .page:not(#page-admin) select:focus-visible{outline:3px solid #292929!important;outline-offset:3px!important}
 html.ci-review-test .page:not(#page-admin) input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]),html.ci-review-test .page:not(#page-admin) textarea,html.ci-review-test .page:not(#page-admin) select{font-size:max(16px,1em);max-width:100%;box-sizing:border-box}
 html.ci-review-test .page:not(#page-admin) .goal-workspace-add-task,html.ci-review-test .page:not(#page-admin) .task-note-actions{gap:10px;flex-wrap:wrap}
 html.ci-review-test .page:not(#page-admin) .ci-review-key-action{box-shadow:0 0 0 2px #292929;outline-offset:3px}
 @media(pointer:coarse){html.ci-review-test .page:not(#page-admin) .ci-review-key-action{min-height:44px}}
 @media(prefers-reduced-motion:reduce){html.ci-review-test .page:not(#page-admin) .ci-review-guidance{animation:none}}
 `;
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;inspect();});}
 function watchDocument(doc){
  if(!doc?.documentElement)return;
  if(doc.documentElement.classList.contains('ci-review-test')!==enabled)doc.documentElement.classList.toggle('ci-review-test',enabled);
  if(!docs.has(doc)){
   docs.add(doc);
   if(doc.querySelector('.page')){const style=doc.createElement('style');style.id='ci-review-test-style';style.textContent=overlayCss;doc.head.append(style);}
   const observer=new MutationObserver(schedule);observer.observe(doc.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
   doc.addEventListener('click',event=>{const control=event.target.closest('button[data-action],button[data-site-action]');const action=control?.dataset.action||control?.dataset.siteAction;if(features[action])renderFeature(action);schedule();});
  }
  const page=doc.querySelector('.page.active');
  if(page&&page.id!=='page-admin'&&page.id!=='page-admin-access'){
   const action=inlinePages[page.id.replace('page-','')];
   if(features[action]){
    renderFeature(action);
    if(pendingDashboard&&doc.defaultView.ciCitadelDashboardReview){pendingDashboard=false;dashboardApi=doc.defaultView.ciCitadelDashboardReview;loadDashboard();}
    if(!page.querySelector(':scope > .ci-review-guidance')){const guide=doc.createElement('p');guide.className='ci-review-guidance';guide.textContent=features[action][2];page.prepend(guide);}
    page.querySelectorAll('.ci-goals-add-toggle,.pb-goal-add-save,button[onclick="notesToggleQuickAdd()"],.goal-workspace-entry-save,[data-save-note]').forEach(button=>{if(!button.classList.contains('ci-review-key-action'))button.classList.add('ci-review-key-action');});
   }
  }
  doc.querySelectorAll('iframe').forEach(child=>{
   if(!frames.has(child)){frames.add(child);child.addEventListener('load',schedule);}
   try{if(child.contentDocument?.readyState!=='loading')watchDocument(child.contentDocument);}catch(_){/* A third-party media frame is never inspected. */}
  });
 }
 function inspect(){
  try{
   const doc=frame.contentDocument;if(!doc?.querySelector('.shell'))return;
   watchDocument(doc);
   if(!doc.querySelector('#homeView')?.hidden)renderFeature('home');
   const shell=doc.querySelector('.shell');
   const height=Math.ceil(shell.getBoundingClientRect().height)+2;
   if(height>100&&frame.style.height!==height+'px')frame.style.height=height+'px';
   const message=enabled?'Test improvements on · upper trough removed · hamburger and existing controls retained.':'Original appearance · improvements hidden.';
   if(status.textContent!==message)status.textContent=message;
  }catch(_){status.textContent='The review frame could not be inspected. Reload this private preview.';}
 }
 const dashboard=document.getElementById('citadel-dashboard');
 let dashboardApi=null,dashboardData=null,dashboardView='tasks',dashboardReturn='home',dashboardTrigger=null;
 const entryDrafts={notes:'',journal:''};
 function rememberDraft(){if(dashboardView!=='tasks')entryDrafts[dashboardView]=byId('dashboard-entry-text').value;}
 const byId=id=>document.getElementById(id);
 function say(text){byId('dashboard-state').textContent=text;}
 function option(value,label){const el=document.createElement('option');el.value=value;el.textContent=label;return el;}
 function populateGoals(select){const value=select.value;select.replaceChildren(option('','No goal linked'),...dashboardData.goals.map(goal=>option(goal.id,goal.title)));select.value=dashboardData.goals.some(goal=>goal.id===value)?value:'';}
 function actionChoices(){const select=byId('dashboard-entry-task'),goal=byId('dashboard-entry-goal').value;select.replaceChildren(option('','Whole goal / no specific action'),...dashboardData.tasks.filter(task=>task.goalId===goal&&goal).map(task=>option(task.key,task.text)));select.disabled=!goal;}
 function safeNode(tag,text,className){const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;}
 function showComposer(kind,task){
  setDashboardView(kind==='journal'?'journal':'notes');
  byId('dashboard-entry-goal').value=task?.goalId||'';actionChoices();byId('dashboard-entry-task').value=task?.key||'';
  byId('dashboard-entry-text').focus();
 }
 function taskRows(){
  const host=byId('dashboard-task-list');host.replaceChildren();const open=dashboardData.tasks.filter(task=>!task.done);
  byId('dashboard-task-count').textContent=`${open.length} open`;
  const tasks=dashboardData.tasks.filter(task=>!task.done||byId('dashboard-completed').checked).sort((a,b)=>Number(a.done)-Number(b.done));
  if(!tasks.length)host.append(safeNode('p',dashboardData.tasks.length?'All caught up. Show completed to review earlier actions.':'No to-dos yet. Add your first action below.','dashboard-empty'));
  tasks.forEach(task=>{
   const row=document.createElement('article');row.className='dashboard-task'+(task.done?' is-complete':'');row.dataset.taskKey=task.key;
   const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=task.done;check.setAttribute('aria-label',`Complete: ${task.text}`);
   check.addEventListener('change',()=>{try{const result=dashboardApi.toggle(task.key);if(result.error){check.checked=task.done;say(result.error);return;}dashboardData=result;taskRows();say('Task updated.');}catch(_){check.checked=task.done;say('Could not update this task. Reopen the list and try again.');}});
   label.append(check,safeNode('span',task.text,'dashboard-task-text'));row.append(label,safeNode('p',task.goalTitle||'Personal to-do · no goal linked','dashboard-goal'));
   if(task.goalId){const actions=document.createElement('div');actions.className='dashboard-row-actions';for(const [kind,text] of [['notes','Add note'],['journal','Journal']]){const button=safeNode('button',text);button.type='button';button.addEventListener('click',()=>showComposer(kind,task));actions.append(button);}row.append(actions);}
   const linked=dashboardData.entries.filter(entry=>entry.taskKey===task.key);linked.forEach(entry=>row.append(safeNode('p',`${entry.cat==='note'?'Journal':'Note'} · ${entry.text}`,'dashboard-linked-entry')));
   host.append(row);
  });
 }
 function entryRows(){const host=byId('dashboard-entry-list');host.replaceChildren();const entries=dashboardData.entries.filter(entry=>dashboardView==='journal'?entry.cat==='note':entry.cat!=='note').sort((a,b)=>(b.updatedAt||b.ts||0)-(a.updatedAt||a.ts||0));if(!entries.length)host.append(safeNode('p',dashboardView==='journal'?'No journal entries yet. Write your first reflection below.':'No notes yet. Capture your first idea below.','dashboard-empty'));entries.forEach(entry=>{const row=document.createElement('article');row.className='dashboard-entry';row.append(safeNode('p',entry.text),safeNode('p',dashboardData.goals.find(goal=>goal.id===String(entry.goal))?.title||'No goal linked','dashboard-goal'));const task=dashboardData.tasks.find(task=>task.key===entry.taskKey);if(task)row.append(safeNode('p',`Related action · ${task.text}`,'dashboard-goal'));host.append(row);});}
 function setDashboardView(view){rememberDraft();dashboardView=view;if(view!=='tasks')byId('dashboard-entry-text').value=entryDrafts[view];byId('dashboard-title').textContent=view==='tasks'?'Your to-do list':view==='notes'?'Your notes':'Your journal';document.querySelectorAll('[data-dashboard-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.dashboardView===view)));byId('dashboard-tasks').hidden=view!=='tasks';byId('dashboard-entries').hidden=view==='tasks';byId('dashboard-add-entry').hidden=view==='tasks';byId('dashboard-entry-heading').textContent=view==='journal'?'Write a journal entry':'Add a note';byId('dashboard-save-entry').textContent=view==='journal'?'Save journal entry':'Save note';if(dashboardData){taskRows();entryRows();}}
 function loadDashboard(){try{dashboardData=dashboardApi.snapshot();populateGoals(byId('dashboard-task-goal'));populateGoals(byId('dashboard-entry-goal'));actionChoices();byId('dashboard-ready').hidden=false;setDashboardView(dashboardView);say('Your existing actions and entries. Unfinished tasks are highlighted.');if(dashboardView!=='tasks')byId('dashboard-entry-text').focus();}catch(_){say('Your list could not be loaded. Close this dashboard and try again.');}}
 function openDashboard(view){dashboardReturn=current;dashboardTrigger=view==='tasks'?byId('to-do'):view==='journal'?byId('write-journal'):addNote;dashboardData=null;byId('dashboard-ready').hidden=true;byId('dashboard-task-text').value='';setDashboardView(view);say('Loading your existing list…');dashboard.showModal();pendingDashboard=true;openFeature('action-plan');schedule();}
 byId('close-dashboard').addEventListener('click',()=>dashboard.close());
 dashboard.addEventListener('close',()=>{rememberDraft();pendingDashboard=false;openFeature(dashboardReturn);dashboardTrigger?.focus();});
 document.querySelectorAll('[data-dashboard-view]').forEach(button=>button.addEventListener('click',()=>setDashboardView(button.dataset.dashboardView)));
 byId('dashboard-completed').addEventListener('change',taskRows);
 byId('dashboard-entry-goal').addEventListener('change',actionChoices);
 byId('dashboard-add-task').addEventListener('submit',event=>{event.preventDefault();try{const result=dashboardApi.addTask(byId('dashboard-task-text').value,byId('dashboard-task-goal').value);if(result.error){say(result.error);return;}dashboardData=result;byId('dashboard-task-text').value='';taskRows();say('To-do added to your existing list.');}catch(_){say('Could not add this to-do. Your text is still here.');}});
 byId('dashboard-add-entry').addEventListener('submit',event=>{event.preventDefault();try{const result=dashboardApi.addEntry({text:byId('dashboard-entry-text').value,kind:dashboardView,goalId:byId('dashboard-entry-goal').value,taskKey:byId('dashboard-entry-task').value});if(result.error){say(result.error);return;}dashboardData=result;entryDrafts[dashboardView]='';byId('dashboard-entry-text').value='';taskRows();entryRows();say('Entry saved on this device using your existing notes store.');}catch(_){say('Could not save this entry. Your text is still here.');}});
 frame.addEventListener('load',()=>{const doc=frame.contentDocument;const shell=doc?.querySelector('.shell');if(shell){new ResizeObserver(schedule).observe(shell);watchDocument(doc);inspect();}});
 document.querySelectorAll('[name=appearance]').forEach(input=>input.addEventListener('change',()=>{enabled=input.value==='test';document.body.classList.toggle('original',!enabled);inspect();}));
 document.getElementById('begin').addEventListener('click',()=>openFeature('goals'));
 addNote.addEventListener('click',()=>openDashboard('notes'));
 document.getElementById('write-journal').addEventListener('click',()=>openDashboard('journal'));
 document.getElementById('to-do').addEventListener('click',()=>openDashboard('tasks'));
 window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame.contentWindow)return;if(event.data?.type==='ci-site-menu-toggle'){if(menu.open)menu.close();else menu.showModal();}schedule();});
 window.addEventListener('resize',schedule);
 renderFeature('home');
})();

