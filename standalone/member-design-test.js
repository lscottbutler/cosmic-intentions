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
 let pendingNote=false;
 const menu=document.getElementById('review-menu');
 const features={
  home:['Citadel','Start with a goal, or choose a practice from your existing menu.','Open a goal to choose Visualization or Roadmap.'],
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
    if(pendingNote&&action==='journal'&&typeof doc.defaultView.notesShowAdd==='function'&&page.querySelector('#notesadd-note')){pendingNote=false;doc.defaultView.notesShowAdd('note');}
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
 frame.addEventListener('load',()=>{const doc=frame.contentDocument;const shell=doc?.querySelector('.shell');if(shell){new ResizeObserver(schedule).observe(shell);watchDocument(doc);inspect();}});
 document.querySelectorAll('[name=appearance]').forEach(input=>input.addEventListener('change',()=>{enabled=input.value==='test';document.body.classList.toggle('original',!enabled);inspect();}));
 document.getElementById('begin').addEventListener('click',()=>openFeature('goals'));
 addNote.addEventListener('click',()=>{pendingNote=true;openFeature('journal');schedule();});
 document.getElementById('to-do').addEventListener('click',()=>openFeature('action-plan'));
 window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame.contentWindow)return;if(event.data?.type==='ci-site-menu-toggle'){if(menu.open)menu.close();else menu.showModal();}schedule();});
 window.addEventListener('resize',schedule);
 renderFeature('home');
})();

