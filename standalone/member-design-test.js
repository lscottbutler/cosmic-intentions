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
 let pendingDashboard=false,dashboardLoadTimer=0;
 const menu=document.getElementById('review-menu');
 const menuTrigger=document.getElementById('review-menu-trigger');
 menuTrigger.addEventListener('click',()=>menu.showModal());
 const features={
  home:['Citadel','Start with a goal, or choose a practice from your existing menu.','Open a goal to choose Visualization or Roadmap.'],
  goals:['Goals','Keep your direction visible, in your own words.','Select a goal to choose Visualization or Roadmap. ADD A GOAL opens the entry field.'],
  'daily-habits':['Habits','Work through your existing daily routine.','Choose MORNING, DAY, EVENING or BEFORE SLEEP. Select a habit circle to check it off.'],
  'action-plan':['My Roadmap','Bring your next actions and Roadmap together.','Switch My Actions / Roadmap, or use the plus tab for both. The pencil opens an action note.'],
  visualization:['Visualization','Choose the goal you want to rehearse.','Open a goal for its existing visualization choices. Playback uses your Master Player.'],
  meditation:['Meditation','Make space for your chosen meditation practice.','Choose Unguided, Lightly Guided or Guided, then select 1 to 60 minutes. Press Play to begin.'],
  'new-gratitude':['NEW GRATITUDE','Make space for your chosen gratitude practice.','Press Play to begin. Open GRATITUDE MENU to choose your session.'],
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

 const searchForm=document.getElementById('player-search');
 const searchInput=document.getElementById('player-search-input');
 const searchDialog=document.getElementById('player-search-results');
 const searchStatus=document.getElementById('player-search-status');
 const searchList=document.getElementById('player-search-list');
 let catalogPromise,searchVersion=0;
 const normalizeSearch=value=>String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 document.getElementById('player-search-close').addEventListener('click',()=>searchDialog.close());
 searchDialog.addEventListener('close',()=>{searchVersion++;searchInput.focus();});
 function searchDocuments(doc=frame.contentDocument){
  if(!doc)return [];
  const result=[doc];
  for(const child of doc.querySelectorAll('iframe')){try{result.push(...searchDocuments(child.contentDocument));}catch(_){/* Only same-origin content can be searched. */}}
  return result;
 }
 async function openSearchResult(item){
  searchStatus.textContent='Opening '+item.title+'...';
  if(item.key){
   if(newGratitude){newGratitude=false;frame.src='/players/master-player.html?preview=1&start=ent-card&ent='+encodeURIComponent(item.key);}
   else frame.contentWindow.postMessage({type:'ci-lfm-select',action:'ent-card',entKey:item.key},location.origin);
   renderFeature('ent-card');searchDialog.close();return;
  }
  const previousDocs=searchDocuments();
  const changingPage=current!==item.action;
  if(changingPage)openFeature(item.action);
  if(!item.target&&!item.want){searchDialog.close();return;}
  const version=searchVersion;
  for(let attempt=0;attempt<60;attempt++){
   if(version!==searchVersion)return;
   const docs=searchDocuments();
   const target=docs.map(doc=>item.target?doc.getElementById(item.target):[...doc.querySelectorAll('.cl-card--cap')].find(el=>el.getAttribute('title')===item.want)).find(Boolean);
   if(target&&(!changingPage||!previousDocs.includes(target.ownerDocument))){
    const doc=target.ownerDocument;
    const filter=doc.getElementById('cosmicConceptSearch'),theme=doc.getElementById('cosmicConceptTheme');
    if(filter&&item.target){filter.value='';if(theme)theme.value='';filter.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));}
    for(let parent=target.parentElement;parent;parent=parent.parentElement){if(parent.tagName==='DETAILS')parent.open=true;}
    const body=doc.getElementById('cosmicConceptBody');
    if(item.target&&body?.hidden)doc.querySelector('.cl-concepts-toggle')?.click();
    searchDialog.close();
    // Let the existing iframe height observer catch up before revealing the result.
    setTimeout(()=>{target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'center'});},350);
    return;
   }
   await new Promise(resolve=>setTimeout(resolve,150));
  }
  searchStatus.textContent='The page is open, but the item could not be located. Try searching again after it finishes loading.';
 }
 searchForm.addEventListener('submit',async event=>{
  event.preventDefault();const query=searchInput.value.trim();if(!query){searchInput.focus();return;}
  const version=++searchVersion;searchList.replaceChildren();searchStatus.textContent='Searching pages and library...';searchDialog.showModal();
  try{
   if(!catalogPromise)catalogPromise=fetch('/player-search-index.json').then(response=>{if(!response.ok)throw Error('Search unavailable');return response.json();}).catch(error=>{catalogPromise=null;throw error;});
   const catalog=await catalogPromise;if(version!==searchVersion)return;
   const pages=Object.entries(features).filter(([action])=>action!=='admin').map(([action,[title,text]])=>({action,title,text,group:'CI page'}));
   const terms=normalizeSearch(query).split(/\s+/);
   const matches=[...pages,...catalog].filter(item=>terms.every(term=>normalizeSearch(item.title+' '+item.text+' '+item.group).includes(term)));
   searchStatus.textContent=matches.length?matches.length+' result'+(matches.length===1?'':'s')+' for "'+query+'"':'No results. Try another word or a page name.';
   for(const item of matches){const button=document.createElement('button');button.type='button';const title=document.createElement('strong'),detail=document.createElement('span');title.textContent=item.title;detail.textContent=item.group+' - '+item.text;button.append(title,detail);button.addEventListener('click',()=>openSearchResult(item));searchList.append(button);}
  }catch(_){if(version===searchVersion)searchStatus.textContent='Search could not load. Check your connection and try again.';}
 });
 const inlinePages={setup:'goals',habits:'daily-habits',myroadmap:'action-plan',vizlibrary:'visualization',dailyfocus:'favorites',notes:'thoughts',mynotes:'journal',gratitude:'gratitude',wins:'wins',tasknotes:'task-notes',goalworkspace:'goal-workspace',cosmiclibrary:'cosmic-library',entrepreneurlibrary:'entrepreneur-library',entcard:'ent-card',admin:'admin'};
 let enabled=true,current='home',last=null,scheduled=false;
 let newGratitude=false,gratitudeModule=0;
 const docs=new WeakSet(),frames=new WeakSet();
 try{const saved=sessionStorage.getItem('ci-review-last-feature');if(features[saved]&&saved!=='home'&&saved!=='admin')last=saved;}catch(_){/* Comparison remains usable without storage. */}
 function renderFeature(action){
  if(newGratitude&&action==='meditation')action='new-gratitude';
  if(!features[action])return;
  if(dashboard.open)return;
  current=action;const copy=features[action];
  if(title.textContent!==copy[0])title.textContent=copy[0];
  if(purpose.textContent!==copy[1])purpose.textContent=copy[1];
  if(next.textContent!==copy[2])next.textContent=copy[2];
  if(action!=='home'&&action!=='admin'){last=action;try{sessionStorage.setItem('ci-review-last-feature',action);}catch(_){}}

 }
 function openFeature(action){
  if(action==='new-gratitude'){
   newGratitude=true;gratitudeModule=1;frame.src='/players/master-player.html?start=meditation&preview=1&reviewPage=new-gratitude';renderFeature(action);return;
  }
  if(newGratitude){newGratitude=false;frame.src='/players/master-player.html?preview=1&start='+encodeURIComponent(action);renderFeature(action);return;}
  frame.contentWindow?.postMessage({type:'ci-lfm-select',action},location.origin);renderFeature(action);
 }
 const menuLabels={home:'Citadel',goals:'Goals','daily-habits':'Habits',favorites:'My Favorites Autoplay',thoughts:'My Thoughts',journal:'My Journal','action-plan':'Roadmap',visualization:'Visualization Library',meditation:'Meditation','new-gratitude':'NEW GRATITUDE',gratitude:'Gratitude','cosmic-library':'Cosmic Library','entrepreneur-library':'Entrepreneur Library','ent-card':'Entrepreneur Skill Cards',wins:'My Wins','task-notes':'Notes','goal-workspace':'Goal Workspace',admin:'Admin'};
 for(const [action,label] of Object.entries(menuLabels).sort((a,b)=>a[1].localeCompare(b[1],'en',{sensitivity:'base'}))){const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>{menu.close();openFeature(action);});document.getElementById('review-menu-items').append(button);}
 document.getElementById('close-menu').addEventListener('click',()=>menu.close());
 menu.addEventListener('close',()=>{if(enabled)menuTrigger.focus();else frame.contentDocument?.getElementById('siteMenuButton')?.focus();});
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
 const headerNote=document.getElementById('header-admin-note');
 const headerNoteFrame=document.getElementById('header-admin-note-frame');
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==headerNoteFrame.contentWindow||event.data?.type!=='ci-citadel-note-height')return;
  const height=Math.max(0,Math.ceil(Number(event.data.height)||0));
  headerNoteFrame.style.height=height+'px';headerNote.hidden=!height||current==='admin';
 });
 function watchDocument(doc){
  if(!doc?.documentElement)return;
  const opening=doc===frame.contentDocument?doc.getElementById('citadelNoteFrame'):null;
  if(opening){
   if(!doc.getElementById('header-note-relocation')){
    const style=doc.createElement('style');style.id='header-note-relocation';
    style.textContent='#citadelNote{display:none!important}';doc.head.append(style);
   }
   const src=opening.getAttribute('src');
   if(src&&headerNoteFrame.getAttribute('src')!==src){headerNote.hidden=false;headerNoteFrame.src=src;}
   if(current==='admin')headerNote.hidden=true;
   else if(src===headerNoteFrame.getAttribute('src')&&parseFloat(headerNoteFrame.style.height)>0)headerNote.hidden=false;
  }

  if(doc.getElementById('siteMenuButton')&&!doc.getElementById('review-menu-relocation')){
   const style=doc.createElement('style');style.id='review-menu-relocation';style.textContent='html.ci-review-test #siteMenuButton{display:none!important}';doc.head.append(style);
  }
  if(doc.querySelector('.shell')&&!doc.getElementById('citadel-border-test')){
   const style=doc.createElement('style');style.id='citadel-border-test';
   style.textContent=`html.ci-review-test .shell.home-mode{--frame-border:0px;--header:transparent;--deck:transparent;background:transparent}
    html.ci-review-test .shell.home-mode #citadelNote{padding-top:0}
    html.ci-review-test .shell.home-mode .stage{padding:40px;background:#fff}
    html.ci-review-test .shell.home-mode .deck{background:transparent}
    html.ci-review-test .shell.home-mode .deck::before{bottom:0;background:#fff}
    html.ci-review-test .shell.home-mode .nav{color:#171717}
    html.ci-review-test .shell.home-mode .nav :is(svg,.hamb-lines){color:#fff}
    html.ci-review-test .shell.home-mode .nav:focus-visible{outline-color:#171717}
html.ci-review-test .shell.home-mode [data-action="meditation"]{--citadel-button:#080808}
html.ci-review-test .shell.home-mode [data-action="daily-habits"]{--citadel-button:#121212}
html.ci-review-test .shell.home-mode [data-action="goals"]{--citadel-button:#1c1c1c}
html.ci-review-test .shell.home-mode [data-action="visualization"]{--citadel-button:#262626}
html.ci-review-test .shell.home-mode [data-action="action-plan"]{--citadel-button:#303030}
html.ci-review-test .shell.home-mode [data-action="cosmic-library"]{--citadel-button:#3a3a3a}
html.ci-review-test .shell.home-mode [data-action="task-notes"]{--citadel-button:#444444}
html.ci-review-test .shell.home-mode #lfmMenu{--citadel-button:#4e4e4e}
html.ci-review-test .shell.home-mode .nav :is(svg,.hamb-lines){background:var(--citadel-button,#181818)}
html.ci-review-test .shell.home-mode .nav:focus-visible{outline:2px solid #171717;outline-offset:3px;border-radius:8px}`;
   doc.head.append(style);
  }
  if(newGratitude&&doc.getElementById('meditationControls')){
   if(!doc.getElementById('new-gratitude-choices')){
    const style=doc.createElement('style');style.id='new-gratitude-choices';
    style.textContent=`
     #meditationModes,.relaxation-toggle-row,#guidedNote{display:none!important}
     #gratitude-choice-columns{position:relative;display:flex;justify-content:space-between;gap:24px;align-items:flex-start}
     #gratitude-start{position:absolute;top:0;left:50%;transform:translateX(-50%);width:10.4167%;min-width:56px;aspect-ratio:1;border:clamp(4px,1.5625vw,30px) solid #292929;border-radius:50%;background:#747474;display:grid;place-items:center;padding:0;cursor:pointer;transition:opacity 1s ease}
     #gratitude-start span{width:0;height:0;border-top:10px solid transparent;border-bottom:10px solid transparent;border-left:16px solid white;margin-left:7%}
     #gratitude-start[data-started="true"]{opacity:0;pointer-events:none}
     #gratitude-start:focus-visible{outline:2px solid white;outline-offset:3px}
     @media(prefers-reduced-motion:reduce){#gratitude-start{transition:none}}
     #gratitude-module-group,#gratitude-time-group{box-sizing:border-box;width:33.333%;min-width:0}
     #gratitude-module-heading{margin:0 0 14px;text-align:center;font-size:16px;line-height:1.35;font-weight:800;color:#292929}
     #gratitude-module-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 8px}
     .gratitude-module-choice{display:grid;justify-items:center;gap:7px;padding:0;border:0;background:transparent;color:#292929;cursor:pointer;font:inherit}
     .gratitude-module-choice span{display:grid;place-items:center;width:56px;height:56px;border-radius:50%;background:#e5e5e5;color:#292929;font-size:18px;font-weight:900;border:1px solid #777}
     .gratitude-module-choice[aria-pressed="true"] span{border:7px solid #fff}
     .gratitude-module-choice:disabled{opacity:.45;cursor:default}
     .gratitude-module-choice:focus-visible{outline:2px solid #fff;outline-offset:4px;border-radius:8px}
     #gratitude-back[hidden]{display:none!important}
     #gratitude-module-status{margin:14px 0 0;text-align:center;font-size:12px;line-height:1.35;color:#292929}
     #gratitude-time-heading{margin:0 0 14px;text-align:center;font-size:16px;line-height:1.35;font-weight:800;color:#292929}
     #gratitude-time-group .med-time-stack{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 8px}
     #gratitude-time-group .med-time-option:focus-visible{outline:2px solid #fff;outline-offset:4px;border-radius:8px}
     @media(max-width:620px){#gratitude-start{position:relative;left:auto;transform:none;width:56px;margin:0 auto;order:1}#gratitude-module-group{order:0}#gratitude-time-group{order:2}#gratitude-choice-columns{gap:20px;flex-wrap:wrap}#gratitude-module-group,#gratitude-time-group{width:100%;max-width:300px;margin-inline:auto}#gratitude-time-group .med-time-stack{grid-template-columns:repeat(3,minmax(0,1fr))}}
    `;doc.head.append(style);
   }
   if(!doc.getElementById('gratitude-time-group')){
    const times=doc.getElementById('meditationTimes');
    const group=doc.createElement('div');group.id='gratitude-time-group';group.setAttribute('role','group');group.setAttribute('aria-labelledby','gratitude-time-heading');
    const heading=doc.createElement('h2');heading.id='gratitude-time-heading';heading.textContent='Expressing Gratitude Times';
    times.before(group);group.append(heading,times);
   }
   if(!doc.getElementById('gratitude-module-group')){
    const timeGroup=doc.getElementById('gratitude-time-group');
    const columns=doc.createElement('div');columns.id='gratitude-choice-columns';timeGroup.before(columns);
    const group=doc.createElement('div');group.id='gratitude-module-group';group.setAttribute('role','group');group.setAttribute('aria-labelledby','gratitude-module-heading');
    const heading=doc.createElement('h2');heading.id='gratitude-module-heading';heading.textContent='GRATITUDE MODULES';
    const grid=doc.createElement('div');grid.id='gratitude-module-grid';
    for(const number of [1,2,3,4,5]){
     const choice=doc.createElement('button');choice.type='button';choice.className='gratitude-module-choice';choice.dataset.gratitudeModule=number;
     const circle=doc.createElement('span');circle.textContent=number;choice.append(circle);
     choice.disabled=number!==1;choice.setAttribute('aria-label',number===1?'Gratitude module 1 — test slides':`Gratitude module ${number} — not connected`);
     if(number===1){choice.setAttribute('aria-pressed',String(gratitudeModule===1));choice.addEventListener('click',()=>{
      gratitudeModule=1;choice.setAttribute('aria-pressed','true');
      const session=doc.getElementById('experienceFrame');const url=new URL(session.src,location.origin);url.pathname='/players/new-gratitude-session.html';url.searchParams.set('module','1');url.searchParams.set('panelplay','1');url.searchParams.set('dockcounter','1');session.src=url.href;
      doc.getElementById('gratitude-module-status').textContent='Module 1 · five test slides';
     });}
     grid.append(choice);
    }
    const notice=doc.createElement('p');notice.id='gratitude-module-status';notice.setAttribute('role','status');notice.textContent=gratitudeModule===1?'Module 1 · five test slides':'Select 1 for the test slides.';
    group.append(heading,grid,notice);columns.append(group,timeGroup);
   }
   if(!doc.getElementById('gratitude-start')){
    const start=doc.createElement('button');start.id='gratitude-start';start.type='button';start.disabled=true;start.setAttribute('aria-label','Start gratitude slideshow');
    const icon=doc.createElement('span');icon.setAttribute('aria-hidden','true');start.append(icon);
    doc.getElementById('gratitude-choice-columns').append(start);
    start.addEventListener('click',()=>doc.getElementById('experienceFrame').contentWindow.postMessage({type:'ci-meditation-command',command:'toggle'},location.origin));
    doc.defaultView.addEventListener('message',event=>{
     if(event.origin!==location.origin||event.source!==doc.getElementById('experienceFrame').contentWindow||event.data?.type!=='ci-meditation-state')return;
     const ready=event.data.state==='ready';start.disabled=false;start.dataset.started=String(!ready);start.tabIndex=ready?0:-1;start.setAttribute('aria-hidden',String(!ready));
    });
   }
   if(doc.title!=='NEW GRATITUDE | Cosmic Intentions')doc.title='NEW GRATITUDE | Cosmic Intentions';
   const titleText=doc.getElementById('capTitleText');if(titleText&&titleText.textContent!=='NEW GRATITUDE')titleText.textContent='NEW GRATITUDE';
   const controls=doc.getElementById('meditationControls');controls.setAttribute('aria-label','New Gratitude controls');
   if(!doc.getElementById('gratitude-slide-counter')){
    const counter=doc.createElement('button');counter.id='gratitude-slide-counter';counter.type='button';counter.hidden=true;
    counter.setAttribute('aria-label','Pause gratitude slideshow');counter.textContent='1/5';
    controls.append(counter);
    const counterStyle=doc.createElement('style');counterStyle.textContent=`
     #meditationControls.gratitude-photo-controls{grid-template-columns:65.25px 65.25px 65.25px;column-gap:18px;row-gap:12px}
     #meditationControls.gratitude-photo-controls [data-lfm-mini-command="forward"]{grid-column:3}
     #gratitude-slide-counter{grid-column:2;grid-row:1;align-self:center;justify-self:center;width:65.25px;aspect-ratio:1;border:7.875px solid #292929;border-radius:50%;padding:0;background:#747474;color:#fff;display:grid;place-items:center;font:800 22px/1.05 Arial,Helvetica,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:.2px;white-space:pre-line;cursor:pointer}
     #meditationControls [data-med-command="menu"]>span:last-child{display:block!important;font:800 12px/1.2 Arial,Helvetica,sans-serif;letter-spacing:.08em;white-space:nowrap;text-align:center;margin-top:6px;color:#fff}
     #gratitude-slide-counter[hidden]{display:none!important}
     #gratitude-slide-counter:focus-visible{outline:2px solid #fff;outline-offset:3px}
    `;doc.head.append(counterStyle);
    counter.addEventListener('click',()=>doc.getElementById('experienceFrame').contentWindow.postMessage({type:'ci-meditation-command',command:'toggle'},location.origin));
    doc.defaultView.addEventListener('message',event=>{
     if(event.origin!==location.origin||event.source!==doc.getElementById('experienceFrame').contentWindow||event.data?.type!=='ci-meditation-state')return;
     const data=event.data,active=data.state!=='ready',slides=data.phase==='slides';
     controls.classList.toggle('gratitude-photo-controls',active);
     counter.hidden=!active;
     const seconds=Math.max(0,Math.ceil((Number(data.remaining)||0)/1000));
     counter.textContent=slides?(/^[1-5]\/5$/.test(data.slideCounter)?data.slideCounter:'1/5'):`${Math.floor(seconds/60)}\n${String(seconds%60).padStart(2,'0')}`;
     const opacity=Math.max(0,Math.min(1,(slides?Number(data.counterOpacity):1)||0));counter.style.opacity=String(opacity);counter.style.pointerEvents=opacity>0?'auto':'none';counter.tabIndex=active&&opacity>0?0:-1;
     counter.setAttribute('aria-hidden',String(!active||opacity===0));counter.setAttribute('aria-label',data.state==='complete'?'Replay gratitude':(data.state==='paused'?'Resume':'Pause')+(slides?' gratitude slideshow':' gratitude countdown'));
    });
   }

   const button=controls.querySelector('[data-med-command="menu"]');
   button.setAttribute('aria-label','GRATITUDE MENU');if(button.querySelector('span:last-child').textContent!=='GRATITUDE MENU')button.querySelector('span:last-child').textContent='GRATITUDE MENU';
   doc.getElementById('meditationMenu').setAttribute('aria-label','New Gratitude choices');
   const session=doc.getElementById('experienceFrame');session.title='NEW GRATITUDE';
   if(!doc.getElementById('gratitude-back')){
    const panel=doc.getElementById('meditationMenu');
    const back=doc.createElement('button');back.id='gratitude-back';back.type='button';back.className='med-control';back.hidden=true;
    back.setAttribute('aria-label','Back to gratitude setup');
    const arrow=doc.createElement('span');arrow.className='med-circle';arrow.textContent='◀';arrow.setAttribute('aria-hidden','true');
    const label=doc.createElement('span');label.textContent='Back';back.append(arrow,label);panel.append(back);
    back.style.cssText='display:grid;margin:24px auto 0;justify-items:center;width:72px';
    back.addEventListener('click',()=>{back.hidden=true;session.src=session.src;});
    let completed=false;
    doc.defaultView.addEventListener('message',event=>{
     if(!newGratitude||event.origin!==location.origin||event.source!==session.contentWindow||event.data?.type!=='ci-meditation-state')return;
     const finished=event.data.state==='complete'&&event.data.phase==='meditation';
     back.hidden=!finished;
     if(finished&&button.getAttribute('aria-expanded')!=='true')button.click();
     else if(completed&&!finished&&event.data.state==='running'&&button.getAttribute('aria-expanded')==='true')button.click();
     completed=finished;
    });
   }

   if(!frames.has(session))session.addEventListener('load',()=>{
    if(!newGratitude)return;
    const url=new URL(session.src,location.origin);
    if(url.pathname==='/players/meditation.html'){url.pathname='/players/new-gratitude-session.html';if(gratitudeModule===1)url.searchParams.set('module','1');url.searchParams.set('panelplay','1');url.searchParams.set('dockcounter','1');session.src=url.href;}
   });
   const url=new URL(session.src,location.origin);
   if(url.pathname==='/players/meditation.html'){url.pathname='/players/new-gratitude-session.html';if(gratitudeModule===1)url.searchParams.set('module','1');url.searchParams.set('panelplay','1');url.searchParams.set('dockcounter','1');session.src=url.href;}
  }
  if(doc.documentElement.classList.contains('ci-review-test')!==enabled)doc.documentElement.classList.toggle('ci-review-test',enabled);
  if(!docs.has(doc)){
   docs.add(doc);
   if(doc.querySelector('.page')){const style=doc.createElement('style');style.id='ci-review-test-style';style.textContent=overlayCss;doc.head.append(style);}
   // Loads, navigation and actual size changes drive inspection. Do not observe
   // every timer/control mutation: that feeds continuous redraws back into sizing.
   doc.addEventListener('click',event=>{const control=event.target.closest('button[data-action],button[data-site-action]');const action=control?.dataset.action||control?.dataset.siteAction;if(features[action])renderFeature(action);schedule();});
  }
  const page=doc.querySelector('.page.active');
  if(page?.id==='page-admin'||page?.id==='page-admin-access')renderFeature('admin');
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

 // Review-only audio attachment: preserve the locked Master Player and timer engine.
 const meditationAudio=new Audio('/players/audio/coming-back-to-yourself-10m.ogg');
 meditationAudio.preload='none';
 let audioSession=null,audioDoc=null,audioGeneration=0;
 function stopMeditationAudio(){audioGeneration++;meditationAudio.pause();meditationAudio.currentTime=0;}
 function attachMeditationAudio(doc){
  const session=doc.getElementById('experienceFrame');
  if(!session||audioDoc===doc)return;
  audioDoc=doc;audioSession=session;
  if(new URLSearchParams(location.search).get('feature')==='meditation'&&!newGratitude){
   doc.querySelector('[data-med-time="10"]')?.click();
   doc.querySelector('[data-med-mode="guided"]')?.click();
  }

  let playbackState='ready';
  const audioButton=doc.createElement('button');audioButton.id='meditation-audio-play';audioButton.type='button';audioButton.textContent='▶ PLAY';audioButton.setAttribute('aria-label','Play guided meditation');
  audioButton.style.cssText='display:block;margin:18px auto;padding:14px 26px;border:3px solid #fff;border-radius:32px;background:#292929;color:#fff;font:800 18px/1.2 Arial,sans-serif;letter-spacing:.08em;cursor:pointer;min-height:52px';
  doc.getElementById('meditationControls').before(audioButton);
  const connectedSession=()=>{const u=new URL(session.src,location.origin);return !newGratitude&&u.pathname==='/players/meditation.html'&&u.searchParams.get('mode')==='guided'&&Number(u.searchParams.get('t'))===10;};
  const buttonState=()=>{
   audioButton.hidden=!connectedSession();audioButton.style.display=audioButton.hidden?'none':'block';
   const label=playbackState==='running'?'Pause':playbackState==='paused'?'Resume':playbackState==='complete'?'Replay':'Play';
   audioButton.textContent=(playbackState==='running'?'Ⅱ ':'▶ ')+label.toUpperCase();audioButton.setAttribute('aria-label',label+' guided meditation');
  };
  audioButton.addEventListener('click',()=>{
   if(playbackState==='running'){session.contentWindow.postMessage({type:'ci-meditation-command',command:'toggle'},location.origin);return;}
   if(playbackState==='ready'||playbackState==='complete')meditationAudio.currentTime=0;
   audioButton.disabled=true;
   meditationAudio.play().then(()=>{
    audioButton.disabled=false;
    if(!connectedSession()){stopMeditationAudio();return;}
    status.textContent='Guided meditation playing.';
    session.contentWindow.postMessage({type:'ci-meditation-command',command:'toggle'},location.origin);
   }).catch(()=>{audioButton.disabled=false;status.textContent='Audio could not start. Use the PLAY button below the image to retry.';});
  });

  const durations=[23.36,23.44,22.32,23.28,23.20,26.32,19.52,20.48,26.56,30.00];
  const timelineLegend=doc.createElement('p');timelineLegend.id='meditation-audio-legend';
  timelineLegend.style.cssText='margin:0 auto 16px;text-align:center;font:700 13px/1.5 Arial,sans-serif;letter-spacing:.03em;color:#fff';
  const narrationKey=doc.createElement('span');narrationKey.textContent='━ Narration';narrationKey.style.color='#f6d27a';
  const silenceKey=doc.createElement('span');silenceKey.textContent='━ Silence';silenceKey.style.color='#b8bec5';
  timelineLegend.append(narrationKey,doc.createTextNode('   ·   '),silenceKey);
  audioButton.after(timelineLegend);
  function paintNarrationRail(){
   timelineLegend.hidden=!connectedSession();timelineLegend.style.display=timelineLegend.hidden?'none':'block';
   if(!connectedSession())return;
   const child=session.contentDocument,svg=child?.querySelector('.ccb-curve'),timer=child?.getElementById('timer');
   if(!svg||!timer)return;
   let group=child.getElementById('narration-rail');
   if(!group){group=child.createElementNS('http://www.w3.org/2000/svg','g');group.id='narration-rail';group.setAttribute('pointer-events','none');svg.append(group);}
   const box=svg.getBoundingClientRect(),circle=timer.getBoundingClientRect();
   if(!box.width||!box.height)return;
   const sx=1920/box.width,sy=1080/box.height;
   const radius=circle.width/2-parseFloat(child.defaultView.getComputedStyle(timer).borderTopWidth)/2;
   const cx=(circle.left+circle.width/2-box.left)*sx,cy=(circle.top+circle.height/2-box.top)*sy;
   const point=seconds=>{
    const x=35+seconds/600*1850,dx=(x-960)/1379;
    let y=1189-296*Math.sqrt(Math.max(0,1-dx*dx));
    const circleX=(x-cx)/(radius*sx);
    if(Math.abs(circleX)<=1)y=Math.min(y,cy-radius*sy*Math.sqrt(Math.max(0,1-circleX*circleX)));
    return [x,y];
   };
   const entries=[];
   for(let i=0;i<10;i++){entries.push([i*60,i*60+durations[i],'narration']);entries.push([i*60+durations[i],(i+1)*60,'silence']);}
   group.replaceChildren();
   for(const [from,to,kind] of entries){
    const path=child.createElementNS('http://www.w3.org/2000/svg','path');
    const points=[];const steps=Math.max(2,Math.ceil((to-from)*2));
    for(let i=0;i<=steps;i++){const [x,y]=point(from+(to-from)*i/steps);points.push((i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2));}
    path.setAttribute('d',points.join(' '));path.setAttribute('fill','none');path.setAttribute('stroke',kind==='narration'?'#f6d27a':'#b8bec5');path.setAttribute('stroke-width','9');
    path.dataset.kind=kind;path.dataset.start=String(from);path.dataset.end=String(to);
    const title=child.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=kind+' '+Math.floor(from/60)+':'+String(Math.floor(from%60)).padStart(2,'0')+'–'+Math.floor(to/60)+':'+String(Math.floor(to%60)).padStart(2,'0');path.append(title);group.append(path);
   }
  }
  session.addEventListener('load',paintNarrationRail);
  doc.defaultView.addEventListener('resize',paintNarrationRail);
  paintNarrationRail();

  const clear=()=>{stopMeditationAudio();playbackState='ready';buttonState();};
  buttonState();
  session.addEventListener('load',clear);
  doc.defaultView.addEventListener('pagehide',clear);
  doc.defaultView.addEventListener('message',event=>{
   if(event.origin!==location.origin||event.source!==session.contentWindow||event.data?.type!=='ci-meditation-state')return;
   const url=new URL(session.src,location.origin),data=event.data;
   playbackState=data.state;buttonState();
   const connected=!newGratitude&&url.pathname==='/players/meditation.html'&&url.searchParams.get('mode')==='guided'&&Number(data.minutes)===10;
   if(!connected||data.state==='ready'||data.state==='complete'){stopMeditationAudio();return;}
   const position=Math.max(0,Math.min(600,600-(Number(data.remaining)||0)/1000));
   if(Math.abs(meditationAudio.currentTime-position)>.8)meditationAudio.currentTime=position;
   if(data.state==='paused'){audioGeneration++;meditationAudio.pause();return;}
   if(data.state==='running'&&meditationAudio.paused){
    const generation=++audioGeneration;
    meditationAudio.play().catch(()=>{
     if(generation!==audioGeneration)return;
     session.contentWindow.postMessage({type:'ci-meditation-command',command:'toggle'},location.origin);
     status.textContent='Audio could not start. Press Play to try again.';
    });
   }
  });
 }
 frame.addEventListener('load',stopMeditationAudio);
 window.addEventListener('pagehide',stopMeditationAudio);

 function inspect(){
  try{
   const doc=frame.contentDocument;if(!doc?.querySelector('.shell'))return;
   watchDocument(doc);
   // The Meditation engine now owns narration on both live and review routes.
   if(!doc.querySelector('#homeView')?.hidden)renderFeature('home');
   const shell=doc.querySelector('.shell');
   const height=Math.ceil(shell.getBoundingClientRect().height)+2;
   // Ignore subpixel/one-pixel resize noise from nested frame transitions.
   if(height>100&&Math.abs(height-parseFloat(frame.style.height||'0'))>2)frame.style.height=height+'px';
   const message=enabled?'Test improvements on · upper trough removed · hamburger and existing controls retained.':'Original appearance · improvements hidden.';
   if(status.textContent!==message)status.textContent=message;
  }catch(_){status.textContent='The review frame could not be inspected. Reload this private preview.';}
 }
 const dashboard=document.getElementById('citadel-dashboard');
 let dashboardApi=null,dashboardData=null,dashboardView='tasks',dashboardReturn='home',dashboardTrigger=null;
 const entryDrafts={notes:'',journal:''};
 const taskGroupOpen=new Map();
 const groupTodoDrafts=new Map();
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
  byId('dashboard-task-list').querySelectorAll('.dashboard-task-group').forEach(group=>taskGroupOpen.set(group.dataset.goalId,group.open));
  const host=byId('dashboard-task-list');host.replaceChildren();const open=dashboardData.tasks.filter(task=>!task.done);
  byId('dashboard-task-count').textContent=`${open.length} open`;
  const tasks=dashboardData.tasks.filter(task=>!task.done||byId('dashboard-completed').checked).sort((a,b)=>Number(a.done)-Number(b.done));
  if(!tasks.length)host.append(safeNode('p',dashboardData.tasks.length?'All caught up. Show completed to review earlier actions.':'No to-dos yet. Add your first action below.','dashboard-empty'));
  const groups=new Map();
  tasks.forEach(task=>{
   if(groups.has(task.goalId))return;
   const group=document.createElement('details');group.className='dashboard-task-group';group.dataset.goalId=task.goalId;
   group.open=taskGroupOpen.get(task.goalId)!==false;
   const summary=document.createElement('summary');
   summary.append(safeNode('span',task.goalTitle||'Personal to-dos','dashboard-group-title'));
   const body=document.createElement('div');body.className='dashboard-group-body';
   const plus=safeNode('button','+','dashboard-goal-add');plus.type='button';
   plus.setAttribute('aria-label','Add a to-do to '+(task.goalTitle||'Personal to-dos'));
   plus.setAttribute('aria-expanded','false');summary.append(plus);
   const form=document.createElement('form');form.className='dashboard-inline-todo';form.hidden=true;
   const label=safeNode('label','Your next action'),input=document.createElement('input');
   input.type='text';input.maxLength=160;input.required=true;input.placeholder='What will you do next?';
   input.value=groupTodoDrafts.get(task.goalId)||'';
   input.addEventListener('input',()=>groupTodoDrafts.set(task.goalId,input.value));
   label.append(input);
   const controls=document.createElement('div'),save=safeNode('button','Add to-do'),cancel=safeNode('button','Cancel');
   controls.className='dashboard-inline-actions';save.type='submit';cancel.type='button';controls.append(save,cancel);form.append(label,controls);body.append(form);
   plus.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();group.open=true;taskGroupOpen.set(task.goalId,true);form.hidden=!form.hidden;plus.setAttribute('aria-expanded',String(!form.hidden));if(!form.hidden)input.focus();});
   cancel.addEventListener('click',()=>{form.hidden=true;plus.setAttribute('aria-expanded','false');plus.focus();});
   form.addEventListener('submit',event=>{event.preventDefault();try{const result=dashboardApi.addTask(input.value,task.goalId);if(result.error){say(result.error);return;}groupTodoDrafts.delete(task.goalId);dashboardData=result;taskGroupOpen.set(task.goalId,true);taskRows();say('To-do added to '+(task.goalTitle||'your personal list')+'.');}catch(_){say('Could not add this to-do. Your text is still here.');}});
   group.append(summary,body);group.addEventListener('toggle',()=>{if(group.isConnected)taskGroupOpen.set(task.goalId,group.open);});
   groups.set(task.goalId,body);host.append(group);
  });
  tasks.forEach(task=>{
   const row=document.createElement('article');row.className='dashboard-task'+(task.done?' is-complete':'');row.dataset.taskKey=task.key;
   const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=task.done;check.setAttribute('aria-label',`Complete: ${task.text}`);
   check.addEventListener('change',()=>{try{const result=dashboardApi.toggle(task.key);if(result.error){check.checked=task.done;say(result.error);return;}dashboardData=result;taskRows();say('Task updated.');}catch(_){check.checked=task.done;say('Could not update this task. Reopen the list and try again.');}});
   label.append(check,safeNode('span',task.text,'dashboard-task-text'));row.append(label);
   if(task.goalId){const actions=document.createElement('div');actions.className='dashboard-row-actions';for(const [kind,text] of [['notes','Add note'],['journal','Journal']]){const button=safeNode('button',text);button.type='button';button.addEventListener('click',()=>showComposer(kind,task));actions.append(button);}row.append(actions);}
   const linked=dashboardData.entries.filter(entry=>entry.taskKey===task.key);linked.forEach(entry=>row.append(safeNode('p',`${entry.cat==='note'?'Journal':'Note'} · ${entry.text}`,'dashboard-linked-entry')));
   groups.get(task.goalId).append(row);
  });
  host.querySelectorAll('.dashboard-task').forEach((row,index)=>row.prepend(safeNode('div',`TO DO #${index+1}`,'dashboard-item-number')));
 }
 function entryRows(){const host=byId('dashboard-entry-list');host.replaceChildren();const entries=dashboardData.entries.filter(entry=>dashboardView==='journal'?entry.cat==='note':entry.cat!=='note').sort((a,b)=>(b.updatedAt||b.ts||0)-(a.updatedAt||a.ts||0));if(!entries.length)host.append(safeNode('p',dashboardView==='journal'?'No journal entries yet. Write your first reflection below.':'No notes yet. Capture your first idea below.','dashboard-empty'));entries.forEach((entry,index)=>{const row=document.createElement('article');row.className='dashboard-entry';row.append(safeNode('div',`${dashboardView==='journal'?'JOURNAL':'NOTE'} #${index+1}`,'dashboard-item-number'),safeNode('p',entry.text),safeNode('p',dashboardData.goals.find(goal=>goal.id===String(entry.goal))?.title||'No goal linked','dashboard-goal'));const task=dashboardData.tasks.find(task=>task.key===entry.taskKey);if(task)row.append(safeNode('p',`Related action · ${task.text}`,'dashboard-goal'));host.append(row);});}
 function setDashboardView(view){rememberDraft();dashboardView=view;if(view!=='tasks')byId('dashboard-entry-text').value=entryDrafts[view];byId('dashboard-title').textContent=view==='tasks'?'Your to-do list':view==='notes'?'Your notes':'Your journal';document.querySelectorAll('[data-dashboard-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.dashboardView===view)));byId('dashboard-tasks').hidden=view!=='tasks';byId('dashboard-entries').hidden=view==='tasks';byId('dashboard-add-entry').hidden=view==='tasks';byId('dashboard-entry-heading').textContent=view==='journal'?'Write a journal entry':'Add a note';byId('dashboard-save-entry').textContent=view==='journal'?'Save journal entry':'Save note';if(dashboardData){taskRows();entryRows();}}
 function loadDashboard(){clearTimeout(dashboardLoadTimer);dashboardLoadTimer=0;try{dashboardData=dashboardApi.snapshot();populateGoals(byId('dashboard-task-goal'));populateGoals(byId('dashboard-entry-goal'));actionChoices();byId('dashboard-ready').hidden=false;setDashboardView(dashboardView);say('Your existing actions and entries. Unfinished tasks are highlighted.');if(dashboardView!=='tasks')byId('dashboard-entry-text').focus();}catch(_){say('Your list could not be loaded. Close this dashboard and try again.');}}
 function openDashboard(view){dashboardReturn=current;dashboardTrigger=view==='tasks'?byId('to-do'):view==='journal'?byId('write-journal'):addNote;dashboardData=null;byId('dashboard-ready').hidden=true;byId('dashboard-task-text').value='';setDashboardView(view);say('Loading your existing list…');dashboard.showModal();pendingDashboard=true;clearTimeout(dashboardLoadTimer);dashboardLoadTimer=setTimeout(()=>{if(pendingDashboard&&dashboard.open){pendingDashboard=false;say('Your list could not connect. Close this window and try again.');}},20000);openFeature('action-plan');schedule();}
 byId('close-dashboard').addEventListener('click',()=>dashboard.close());
 dashboard.addEventListener('close',()=>{rememberDraft();pendingDashboard=false;clearTimeout(dashboardLoadTimer);dashboardLoadTimer=0;openFeature(dashboardReturn);dashboardTrigger?.focus();});
 document.querySelectorAll('[data-dashboard-view]').forEach(button=>button.addEventListener('click',()=>setDashboardView(button.dataset.dashboardView)));
 byId('dashboard-completed').addEventListener('change',taskRows);
 byId('dashboard-entry-goal').addEventListener('change',actionChoices);
 byId('dashboard-add-task').addEventListener('submit',event=>{event.preventDefault();try{const result=dashboardApi.addTask(byId('dashboard-task-text').value,byId('dashboard-task-goal').value);if(result.error){say(result.error);return;}dashboardData=result;byId('dashboard-task-text').value='';taskRows();say('To-do added to your existing list.');}catch(_){say('Could not add this to-do. Your text is still here.');}});
 byId('dashboard-add-entry').addEventListener('submit',event=>{event.preventDefault();try{const result=dashboardApi.addEntry({text:byId('dashboard-entry-text').value,kind:dashboardView,goalId:byId('dashboard-entry-goal').value,taskKey:byId('dashboard-entry-task').value});if(result.error){say(result.error);return;}dashboardData=result;entryDrafts[dashboardView]='';byId('dashboard-entry-text').value='';taskRows();entryRows();say('Entry saved on this device using your existing notes store.');}catch(_){say('Could not save this entry. Your text is still here.');}});
 frame.addEventListener('load',()=>{const doc=frame.contentDocument;const shell=doc?.querySelector('.shell');if(shell){new ResizeObserver(schedule).observe(shell);watchDocument(doc);inspect();}});
 document.getElementById('begin').addEventListener('click',()=>openFeature('goals'));
 addNote.addEventListener('click',()=>openDashboard('notes'));

 document.getElementById('to-do').addEventListener('click',()=>openDashboard('tasks'));
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  const type=event.data?.type;
  if(type==='ci-site-menu-toggle'){if(menu.open)menu.close();else menu.showModal();return;}
  if(type==='ci-lfm-mode')schedule();
  if(type==='ci-lfm-height'&&Math.abs(Number(event.data.height)+2-parseFloat(frame.style.height||'0'))>2)schedule();
 });
 window.addEventListener('resize',schedule);
 renderFeature('home');
 const initialFeature=new URLSearchParams(location.search).get('feature');
 if(initialFeature&&features[initialFeature]){
  if(initialFeature==='new-gratitude')openFeature(initialFeature);
  else {frame.src='/players/master-player.html?preview=1&start='+encodeURIComponent(initialFeature);renderFeature(initialFeature);}
 }
})();

