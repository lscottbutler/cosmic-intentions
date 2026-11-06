/* Review-only overlay. Canonical app/player files are never rewritten.
   No service calls, account writes, analytics or invented save/progress states.
   Session storage contains only the last public feature identifier. */
(() => {
 const frame=document.getElementById('ci-review-frame');
 const status=document.getElementById('review-status');
 const title=document.getElementById('feature-title');
 // Phones: title gets its own full-width row above To Do / Goals; reserve its height.
 try{new ResizeObserver(()=>title.closest('.orientation')?.style.setProperty('--title-h',title.offsetHeight+'px')).observe(title);}catch{}
 const purpose=document.getElementById('feature-purpose');
 const next=document.getElementById('feature-next');
 purpose.remove();next.remove();title.parentElement.querySelector('.eyebrow')?.remove();
 const addNote=document.getElementById('add-note');
 let pendingDashboard=false,dashboardLoadTimer=0;
 const menu=document.getElementById('review-menu');
 const menuTrigger=document.getElementById('review-menu-trigger');
 menuTrigger.addEventListener('click',()=>menu.showModal());
 const features={
  aks:['AKS','Temporary holding space for items we move here.',''],
  home:['Citadel','Start with a goal, or choose a practice from your existing menu.','Open a goal to choose Visualization or Roadmap.'],
  goals:['Goals','Keep your direction visible, in your own words.',''],
  'daily-habits':['Habits','Work through your existing daily routine.',''],
  'action-plan':['My Roadmap','Bring your next actions and Roadmap together.','Switch My Actions / Roadmap, or use the plus tab for both. The pencil opens an action note.'],
  visualization:['Visualization','Choose the goal you want to rehearse.','Open a goal for its existing visualization choices. Playback uses your Master Player.'],
  'super-viz':['Visualize','Rehearse the next step toward your goal.','Choose relaxation, Guided or Unguided, and your practice time. Visualization guidance is a temporary draft.'],
  meditation:['Meditation','Make space for your chosen meditation practice.','Choose Unguided, Lightly Guided or Guided, then select 1 to 60 minutes. Press Play to begin.'],
  'new-gratitude':['NEW GRATITUDE','Make space for your chosen gratitude practice.','Press Play to begin. Open GRATITUDE MENU to choose your session.'],
  favorites:['My Favorites Reel','Keep your saved practices together.','Review your reel, then press Play My Reel.'],
  thoughts:['My Thoughts','Keep the words and ideas that matter to you.','ADD A THOUGHT opens your existing entry categories.'],
  journal:['My Journal','Reflect in your own words.',''],
  gratitude:['Gratitude','Choose from your existing gratitude practices.','Use the current page choices to select a practice.'],
  wins:['My Wins','Record the progress you notice.','Add a win using the existing form; your entries remain yours.'],
  'task-notes':['Notes','Find your goal and action notes in one place.','Open TO DO to see the connected notes and journal entries.'],
  'goal-workspace':['TO DO','Keep a goal’s notes, actions and journal entries together.',''],
  'cosmic-library':['Cosmic Library','Explore your existing collection of ideas and lessons.','Search by topic, or clear your filters to return to the full collection.'],
  'entrepreneur-library':['Entrepreneur Library','Explore your existing entrepreneur skills.','Choose a skill card to open its individual experience.'],
  'ent-card':['Entrepreneur Cards','Work with the selected skill.','Use the existing tabs for Mindset, Go Deeper and My Notes.'],
  admin:['Admin','Your existing administrator workspace.','Owner access is required. Member presentation changes do not apply here.']
 };


 const headerSticker=document.createElement('button');headerSticker.id='header-encouragement';headerSticker.type='button';
 headerSticker.setAttribute('aria-label','Tap for encouragement');headerSticker.title='Tap to hear a little encouragement';
 const headerStickerImage=document.createElement('img');headerStickerImage.alt='';headerStickerImage.draggable=false;headerSticker.append(headerStickerImage);
 document.querySelector('.orientation').append(headerSticker);
 const headerStickerFiles=['rocket','baloon','doll','paint-brush','hand-bird','lungs','tiger','flowers','record-player','panda','messenger','dino','respect','dog','bullhorn','ship','travel','hand-puppet','batter'];
 headerSticker.addEventListener('click',()=>{
  const docs=[...searchDocuments(),...searchDocuments(document.getElementById('header-admin-note-frame')?.contentDocument)];
  const voice=docs.map(doc=>doc.defaultView).find(win=>typeof win?.playEncouragement==='function');
  if(voice){voice.playEncouragement();headerSticker.title='Tap to hear a little encouragement';}
  else headerSticker.title='Voice-over is still loading. Please try again.';
 });

const headerCalendar=document.createElement('div');headerCalendar.id='header-calendar';
 const calendarDate=document.createElement('time'),calendarDay=document.createElement('strong');headerCalendar.append(calendarDate,calendarDay);
 document.querySelector('.orientation').append(headerCalendar);
 // Meditation onboarding is separate from the locked Meditation player engine.
 const instructionsTrigger=document.createElement('button');
 instructionsTrigger.id='meditation-instructions-trigger';
 instructionsTrigger.type='button';
 instructionsTrigger.textContent='Instructions';
 instructionsTrigger.hidden=true;
 instructionsTrigger.setAttribute('aria-haspopup','dialog');
 instructionsTrigger.setAttribute('aria-controls','meditation-instructions-tour');
 document.querySelector('.orientation').append(instructionsTrigger);
 // Habits usage stats (text placeholders; styling to be designed later).
 const habitStats=document.createElement('div');habitStats.id='habit-stats';habitStats.hidden=true;
 habitStats.innerHTML='<p class="hs-message" id="hs-message" aria-live="polite"></p><div class="hs-circle" role="img" aria-label="Day streak" title="Day streak: days in a row with at least one habit checked off"><b id="hs-streak">0</b></div>';
 document.querySelector('.orientation').append(habitStats);
 function updateHabitStats(){
  if(habitStats.hidden)return;
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}};
  const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const counts={};
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);const m=/^ci_habits_(\d{4}-\d{2}-\d{2})$/.exec(k||'');if(!m)continue;const v=read(k);const n=v?Object.values(v).filter(Boolean).length:0;if(n)counts[m[1]]=n;}
  const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const list=read('ci_habit_list');const total=Array.isArray(list)?list.length:0;
  const doneToday=Array.isArray(list)?list.filter(h=>(read('ci_habits_'+key(today))||{})[h.id]).length:0;
  let streak=0;const d=new Date(today);if(!counts[key(d)])d.setDate(d.getDate()-1);
  while(counts[key(d)]){streak++;d.setDate(d.getDate()-1);}
  const weekStart=new Date(today);weekStart.setDate(today.getDate()-((today.getDay()+6)%7));
  let week=0,month=0,year=0;
  for(const [k,n] of Object.entries(counts)){const [y,mo,da]=k.split('-').map(Number);const day=new Date(y,mo-1,da);if(day>today)continue;
   if(y===today.getFullYear()){year+=n;if(mo-1===today.getMonth())month+=n;}if(day>=weekStart)week+=n;}
  let last='none yet';const ts=Number(read('ci_habit_last_done'))||0;
  if(ts){const h=Math.floor((Date.now()-ts)/3600000);last=h<1?'under 1 hour ago':h+(h===1?' hour ago':' hours ago');}
  else{const days=Object.keys(counts).sort();const lastDay=days[days.length-1];if(lastDay){const [y,mo,da]=lastDay.split('-').map(Number);const ago=Math.round((today-new Date(y,mo-1,da))/86400000);last=ago<=0?'today':ago===1?'yesterday':ago+' days ago';}}
  // Morning script. {name} = first word of YOUR NAME (My Thoughts page); {lastHabit} = last habit checked off yesterday.
  const HABIT_SCRIPTS={morning:['Great effort today{name}.',"Let's knock out our first habit and get the day started on a positive note.","Let's build on {lastHabit} from yesterday."]};
  const firstName=String((read('ci_pegboard')||{})['pb-name']||'').trim().split(/\s+/)[0];
  const yesterday=new Date(today);yesterday.setDate(today.getDate()-1);
  const yDone=read('ci_habits_'+key(yesterday))||{},habits=Array.isArray(list)?list:[];
  let lastHabit=habits.find(h=>h.id===read('ci_habit_last_id_'+key(yesterday))&&yDone[h.id]);
  if(!lastHabit)lastHabit=habits.filter(h=>yDone[h.id]).pop();
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  document.getElementById('hs-message').innerHTML=HABIT_SCRIPTS.morning
   .filter(line=>!line.includes('{lastHabit}')||lastHabit)
   .map(line=>esc(line).replace('{name}',firstName?', <strong>'+esc(firstName)+'</strong>':'').replace('{lastHabit}','<strong>'+esc(lastHabit?.name||'')+'</strong>'))
   .join(' ');
  document.getElementById('hs-streak').textContent=streak;
 }
 addEventListener('storage',e=>{if(!e.key||/^ci_habit/.test(e.key))updateHabitStats();});
 setInterval(updateHabitStats,60000);addEventListener('focus',updateHabitStats);
 const instructionTour=document.createElement('dialog');
 instructionTour.id='meditation-instructions-tour';
 instructionTour.setAttribute('aria-labelledby','meditation-tour-title');
 instructionTour.innerHTML=`<div class="ci-tour-panel">
   <div class="ci-tour-top"><h2 id="meditation-tour-title">How Meditation Works</h2><button id="ci-tour-close" type="button" aria-label="Close instructions">✕</button></div>
   <div class="ci-tour-stage"><video class="ci-tour-video" src="/standalone/media/meditation-walkthrough.webm?v=20261027" muted playsinline preload="auto" aria-label="Recording of the real Meditation player being used"></video><div class="ci-tour-caption" aria-live="polite"><span class="ci-tour-step-number"></span><h3 class="ci-tour-heading"></h3><p class="ci-tour-description"></p></div></div>
   <div class="ci-tour-progress" aria-hidden="true"><span></span></div>
   <div class="ci-tour-actions"><button id="ci-tour-prev" type="button">Previous</button><button id="ci-tour-play" type="button">Pause demo</button><button id="ci-tour-next" type="button">Next</button></div>
   <button id="ci-tour-try" type="button">Go to the real Meditation player</button>
 </div>`;
 document.body.append(instructionTour);
 // Real screen recordings of the actual pages in use (standalone/media/*-walkthrough.webm).
 // Each step starts at the second where that action happens in its recording.
 const TOURS={
  meditation:{name:'Meditation',heading:'How Meditation Works',video:'/standalone/media/meditation-walkthrough.webm?v=20261027',steps:[
  {at:0,title:'Open your settings',detail:'Click CURRENTLY PLAYING to open the session settings.'},
  {at:5.3,title:'Relaxation',detail:'Open Relaxation and choose how long to settle in before the meditation, or leave it Off.'},
  {at:14.3,title:'Meditation Guidance',detail:'Choose Unguided (bells only), Lightly Guided, or Guided.'},
  {at:23.1,title:'Meditation Time',detail:'Pick your session length, from 1 to 60 minutes. Click CURRENTLY PLAYING again to close the settings.'},
  {at:36.5,title:'Press Play',detail:'Press Play. The opening invites you to close your eyes, then your session begins.'},
  {at:46.9,title:'Pause and resume',detail:'Press the center button to pause. Press it again to resume where you left off.'},
  {at:58.2,title:'Session complete',detail:'The session runs to its end (sped up here). A bell marks the finish and Session complete appears.'}
 ]},
  gratitude:{name:'Gratitude',heading:'How Gratitude Works',video:'/standalone/media/gratitude-walkthrough.webm?v=20261027',steps:[
   {at:0,title:'Open your settings',detail:'Click CURRENTLY PLAYING to open the session settings.'},
   {at:6.5,title:'Gratitude Module',detail:'Choose a module, or Random to let the player pick one for you.'},
   {at:21.1,title:'Gratitude Time',detail:'Choose how long your quiet gratitude time lasts after the images. Click CURRENTLY PLAYING again to close the settings.'},
   {at:38.2,title:'Press Play',detail:'Press Play. The session opens with things others in the Cosmic Community are grateful for.'},
   {at:55.4,title:'Pause and resume',detail:'Press the center button to pause. Press it again to resume where you left off.'},
   {at:67.8,title:'The images',detail:'Each image shows something to be grateful for (sped up here).'},
   {at:86.5,title:'Your quiet time',detail:'Then comes your quiet time to reflect on what you are grateful for (sped up here).'},
   {at:99.5,title:'Session complete',detail:'When your time is up, the player returns to its start, ready for your next session.'}
  ]},
  'daily-habits':{name:'Habits',heading:'How Habits Work',video:'/standalone/media/habits-walkthrough.webm?v=20261027',steps:[
   {at:0,title:'Your day, in four parts',detail:'Your habits are grouped into Morning, Day, Evening and Before Sleep. Your checklist starts fresh each day.'},
   {at:10.4,title:'Tick off a habit',detail:'Click the circle next to a habit when you complete it. The count on each section shows how many are done.'},
   {at:19.9,title:'Choose a time of day',detail:'Click Morning, Day, Evening or Before Sleep to focus on that part of your day.'},
   {at:26.8,title:'Edit habits',detail:'Click EDIT HABITS to add, rename, reorder or remove habits. Type a new habit, choose its time of day, then click + Add.'},
   {at:48.6,title:'Back to your checklist',detail:'Click BACK TO DAILY CHECKLIST. Your new habit is ready to tick off. Changes save automatically.'}
  ]},
  goals:{name:'Goals',heading:'How Goals Work',video:'/standalone/media/goals-walkthrough.webm?v=20261027',steps:[
   {at:0,title:'Your goals',detail:'Each goal is written as an I AM statement and has its own letter: A, B, C.'},
   {at:9.6,title:'Open a goal',detail:'Click a goal to open it. VISUALIZATION rehearses it; ROADMAP turns it into next steps.'},
   {at:18.9,title:'Add a goal',detail:'Click ADD A GOAL and write your goal as an I AM statement.'},
   {at:29.2,title:'Dates and category',detail:'Optionally add a start date, a target date and a category.'},
   {at:36.5,title:'Save',detail:'Click Save. Your new goal joins your list with its own letter.'}
  ]}
 };
 TOURS['new-gratitude']=TOURS.gratitude;// both menu entries open the same Gratitude player
 let tourKey='meditation',tourSteps=TOURS.meditation.steps;
 const tourVideo=instructionTour.querySelector('.ci-tour-video');
 let tourIndex=-1;
 const stepAt=time=>{let i=0;tourSteps.forEach((step,k)=>{if(time>=step.at-0.05)i=k;});return i;};
 const showTourStep=index=>{
  if(index===tourIndex)return;tourIndex=index;const step=tourSteps[index];
  instructionTour.querySelector('.ci-tour-step-number').textContent='STEP '+(index+1)+' OF '+tourSteps.length;
  instructionTour.querySelector('.ci-tour-heading').textContent=step.title;
  instructionTour.querySelector('.ci-tour-description').textContent=step.detail;
  instructionTour.querySelector('#ci-tour-prev').disabled=index===0;
  instructionTour.querySelector('#ci-tour-next').disabled=index===tourSteps.length-1;
 };
 const updateTourButton=()=>{instructionTour.querySelector('#ci-tour-play').textContent=tourVideo.paused?(tourVideo.ended?'Replay':'Play demo'):'Pause demo';};
 const seekTour=index=>{tourVideo.currentTime=tourSteps[index].at+0.01;showTourStep(index);};
 tourVideo.addEventListener('timeupdate',()=>{showTourStep(stepAt(tourVideo.currentTime));if(tourVideo.duration)instructionTour.querySelector('.ci-tour-progress span').style.width=(tourVideo.currentTime/tourVideo.duration*100)+'%';});
 ['play','pause','ended'].forEach(type=>tourVideo.addEventListener(type,updateTourButton));
 const stopTour=()=>tourVideo.pause();
 instructionsTrigger.addEventListener('click',()=>{
  tourKey=TOURS[current]?current:'meditation';const tour=TOURS[tourKey];tourSteps=tour.steps;
  instructionTour.querySelector('#meditation-tour-title').textContent=tour.heading;
  instructionTour.querySelector('#ci-tour-try').textContent='Go to the real '+tour.name+' page';
  tourVideo.setAttribute('aria-label','Recording of the real '+tour.name+' page being used');
  if(tourVideo.getAttribute('src')!==tour.video)tourVideo.setAttribute('src',tour.video);
  tourIndex=-1;instructionTour.showModal();
  const begin=()=>{seekTour(0);tourVideo.play().catch(updateTourButton);};
  if(tourVideo.readyState>=1)begin();else tourVideo.addEventListener('loadedmetadata',begin,{once:true});
 });
 instructionTour.querySelector('#ci-tour-close').addEventListener('click',()=>instructionTour.close());
 instructionTour.addEventListener('close',stopTour);
 instructionTour.addEventListener('click',event=>{if(event.target===instructionTour)instructionTour.close();});
 instructionTour.querySelector('#ci-tour-play').addEventListener('click',()=>{if(tourVideo.ended)seekTour(0);tourVideo.paused?tourVideo.play().catch(updateTourButton):tourVideo.pause();});
 instructionTour.querySelector('#ci-tour-prev').addEventListener('click',()=>seekTour(Math.max(0,stepAt(tourVideo.currentTime)-1)));
 instructionTour.querySelector('#ci-tour-next').addEventListener('click',()=>seekTour(Math.min(tourSteps.length-1,stepAt(tourVideo.currentTime)+1)));
 instructionTour.querySelector('#ci-tour-try').addEventListener('click',()=>{instructionTour.close();openFeature(tourKey);document.querySelector('.member-player-columns')?.scrollIntoView({behavior:'smooth',block:'start'});});

 function updateHeaderCalendar(){
  const now=new Date(),year=now.getFullYear(),month=now.getMonth(),day=now.getDate();
  const ordinal=Math.floor((Date.UTC(year,month,day)-Date.UTC(year,0,0))/86400000);
  const days=(Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/86400000;
  calendarDate.dateTime=year+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
  calendarDate.textContent=new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now);
  calendarDay.textContent='DAY '+ordinal+' OF '+days;
 }
 updateHeaderCalendar();setInterval(updateHeaderCalendar,60000);
 window.addEventListener('focus',updateHeaderCalendar);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateHeaderCalendar();});
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
 let enabled=true,current='home',last=null,scheduled=false,playerAction='home';
 let newGratitude=false,gratitudeModule=0,gratitudeV2=false;
 const docs=new WeakSet(),frames=new WeakSet();
 try{const saved=sessionStorage.getItem('ci-review-last-feature');if(features[saved]&&saved!=='home'&&saved!=='admin')last=saved;}catch(_){/* Comparison remains usable without storage. */}
 function renderFeature(action){
  if(newGratitude&&action==='meditation')action='new-gratitude';
  if(!features[action])return;
  if(dashboard.open)return;
  document.body.classList.toggle('gratitude-two-column',action==='gratitude'||action==='new-gratitude');
  document.body.classList.toggle('meditation-two-column',['meditation','super-viz'].includes(action));
  const sideColumn=document.querySelector('.member-player-side-column');if(sideColumn)sideColumn.hidden=!(action==='gratitude'||action==='new-gratitude'||['meditation','super-viz'].includes(action));
  current=action;document.body.classList.toggle('habits-header',action==='daily-habits');document.body.classList.toggle('todo-page',action==='goal-workspace');try{document.getElementById('header-admin-note-frame').contentDocument.documentElement.classList.toggle('ci-header-note-todo',action==='goal-workspace');}catch(_){}instructionsTrigger.hidden=!TOURS[action];habitStats.hidden=action!=='daily-habits';updateHabitStats();const quickNav=document.getElementById('quick-nav');if(quickNav)quickNav.hidden=action==='home';const copy=features[action];
  if(action==='gratitude'||action==='new-gratitude')
   updateHeaderNote('/?masterInline=citadel-note&notePage=gratitude&preview=1');
  headerSticker.hidden=action==='admin';
  headerStickerImage.src='/images/home-row/home-'+headerStickerFiles[Object.keys(features).indexOf(action)%headerStickerFiles.length]+'.webp';
  document.body.classList.toggle('master-control-panel',action!=='admin');
  const headerSearch=document.getElementById('player-search');
  const searchParent=action!=='admin'?document.querySelector('.shortcuts'):document.querySelector('.orientation');
  if(headerSearch.parentElement!==searchParent)searchParent.append(headerSearch);
  const headerOrientation=document.querySelector('.orientation'),headerCopy=headerOrientation.querySelector('div:first-child'),headerShortcuts=document.querySelector('.shortcuts');
  const adminBox=document.getElementById('header-admin-note'),menuButton=document.getElementById('review-menu-trigger');
  if(action!=='admin'){
   if(adminBox.parentElement!==headerCopy)headerCopy.append(adminBox);
   if(menuButton.parentElement!==headerShortcuts)headerShortcuts.append(menuButton,headerSticker,headerCalendar);
   // Habits: Instructions sits under the date card (right column); streak circle takes its old spot.
   if(action==='daily-habits'){if(instructionsTrigger.parentElement!==headerShortcuts)headerShortcuts.append(instructionsTrigger);}
   else if(instructionsTrigger.parentElement!==headerOrientation)headerOrientation.append(instructionsTrigger);
  }else{
   if(adminBox.parentElement!==headerOrientation)headerOrientation.append(adminBox,menuButton,headerSticker,headerCalendar);
  }
  if(title.dataset.lettermark!==copy[0]){
   title.dataset.lettermark=copy[0];title.setAttribute('aria-label',copy[0]);title.replaceChildren();
   // Approved letterbox palette: named practices use their menu-ring color;
   // all other player titles use the established charcoal/grey pair.
   const titleAccents={
     home:'#1e90ff',citadel:'#1e90ff',
     meditation:'#ec1c23',
     'daily-habits':'#f26420',
     goals:'#f1c40f',   // Scott 5 Nov 2026: Goals title yellow matches the Add-a-Goal + ring
     visualization:'#0076a3','super-viz':'#0076a3',
     'action-plan':'#187a2f',
     'cosmic-library':'#747474','entrepreneur-library':'#747474',
     library:'#747474'
   };
   const accent=titleAccents[action]||'#747474';
   // Page accent for the Instructions button and Habits streak circle (dark text on yellow for legibility).
   document.documentElement.style.setProperty('--page-accent',accent);document.documentElement.style.setProperty('--page-accent-text',(accent==='#fef200'||accent==='#f1c40f')?'#292929':'#fff');
   const neutral=accent==='#747474'?'#303030':'#202020';
   let letterIndex=0;
   // Scott 2026-11-01: never split a word across lines. Each word's tiles sit in a no-wrap group;
   // lines may only break at the spaces between words.
   let word=null;
   for(const char of copy[0]){
     const tile=document.createElement('span');
     tile.textContent=char;tile.setAttribute('aria-hidden','true');
     if(char===' '){
      tile.style.cssText='width:.35em;flex:0 0 .35em';title.append(tile);word=null;continue;
     }
     const color=letterIndex++%2?neutral:accent;
     tile.className='ci-title-tile';
     tile.style.cssText='display:inline-flex;align-items:center;justify-content:center;background:'+color+';color:#fff;border-radius:2px;padding:0 3px;line-height:1.2';
     if(!word){word=document.createElement('span');word.className='ci-title-word';word.setAttribute('aria-hidden','true');word.style.cssText='display:inline-flex;flex-wrap:nowrap;gap:3px';title.append(word);}
     word.append(tile);
   }
   title.style.cssText="display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:3px;font-family:'Arial Narrow',Arial,sans-serif;font-size:clamp(22px,3vw,36px);font-weight:600;text-transform:uppercase;max-width:100%";
   const titleRoom=title.clientWidth||title.parentElement.clientWidth;// the title's own box (on phones it stops short of the ☰ button)
   const fitFor=n=>(titleRoom-(n-1)*3-n*6)/(n*.75);
   const longestWord=Math.max(...copy[0].split(' ').map(w=>w.length));
   const fitAll=fitFor(copy[0].length);
   // One line when it fits at a readable size; otherwise wrap between words, sized so the longest word fits.
   title.style.fontSize=Math.max(12,Math.min(36,fitAll>=16?fitAll:Math.min(24,fitFor(longestWord))))+'px';
   // Safety net: shrink until no word is wider than the title area.
   for(let size=parseFloat(title.style.fontSize),guard=0;guard<30&&size>10&&[...title.querySelectorAll('.ci-title-word')].some(w=>w.getBoundingClientRect().width>titleRoom);guard++){size-=1;title.style.fontSize=size+'px';}
   // Scott 6 Nov 2026: the TO DO title is 40% smaller.
   if(action==='goal-workspace')title.style.fontSize=Math.round(parseFloat(title.style.fontSize)*0.6)+'px';
   if(action==='goals'){
    title.querySelectorAll('.ci-title-tile').forEach(tile=>{
     const glyph=document.createElement('span');glyph.textContent=tile.textContent;
     glyph.style.display='inline-block';tile.replaceChildren(glyph);
     const bounds=glyph.getBoundingClientRect();
     if(bounds.width>2&&bounds.height>0)glyph.style.transform='scale('+((bounds.width-2)/bounds.width)+','+((bounds.height+4)/bounds.height)+')';
    });
   }
  }
  if(action!=='home'&&action!=='admin'){last=action;try{sessionStorage.setItem('ci-review-last-feature',action);}catch(_){}}

 }
 // Only the lower content card changes opacity. The shared header stays mounted.
 const contentCard=document.querySelector('.member-player-columns');
 let navigationVersion=0,contentFade,pageNavigationPending=false;
 async function fadeContent(opacity,duration){
  const from=getComputedStyle(contentCard).opacity;
  contentFade?.cancel();
  contentCard.style.opacity=opacity;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  contentFade=contentCard.animate([{opacity:from},{opacity}],{duration,easing:'ease-in-out'});
  try{await contentFade.finished;}catch(_){/* A newer navigation owns the fade. */}
 }
 document.querySelectorAll('#quick-nav [data-quick-nav]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.quickNav==='menu'){document.getElementById('review-menu-trigger').click();return;}openFeature(button.dataset.quickNav);}));
 // Full screen (Scott 2026-10-29): header button where the browser allows it (not iPhone Safari,
 // not the home-screen app, which is already full frame); a corner ✕ and Esc leave full screen.
 (()=>{const root=document.documentElement,trigger=document.getElementById('review-menu-trigger');
  const can=!!(root.requestFullscreen||root.webkitRequestFullscreen)&&(document.fullscreenEnabled||document.webkitFullscreenEnabled);
  const standalone=matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches||navigator.standalone;
  if(!can||standalone||!trigger)return;
  const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
  const enter=()=>{(root.requestFullscreen||root.webkitRequestFullscreen).call(root).catch?.(()=>{});};
  const leave=()=>{if(fsEl())(document.exitFullscreen||document.webkitExitFullscreen).call(document);};
  const btn=document.createElement('button');btn.type='button';btn.id='fullscreen-trigger';btn.setAttribute('aria-label','Full screen');btn.title='Full screen';
  btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  btn.addEventListener('click',()=>fsEl()?leave():enter());
  const exitBtn=document.createElement('button');exitBtn.type='button';exitBtn.id='fullscreen-exit';exitBtn.setAttribute('aria-label','Exit full screen');exitBtn.title='Exit full screen';exitBtn.hidden=true;
  exitBtn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  exitBtn.addEventListener('click',leave);document.body.append(exitBtn);
  const sync=()=>{const on=!!fsEl();exitBtn.hidden=!on;btn.setAttribute('aria-pressed',String(on));document.body.classList.toggle('ci-fullscreen',on);};
  document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);
  const mount=()=>{const five=document.getElementById('big-five-trigger')||trigger;if(five.parentElement&&btn.nextElementSibling!==five)five.before(btn);};
  mount();new MutationObserver(mount).observe(document.querySelector('.orientation'),{childList:true,subtree:true});
 })();
 // THE BIG FIVE menu (Scott 2026-10-29): "5" button from The_Five PSD beside the ☰ menu; opens Meditate, Habits, Goals, Visualize, Action Plan.
 (()=>{const keys=['action-plan','goals','daily-habits','meditation','super-viz'];const trigger=document.getElementById('review-menu-trigger');if(!trigger)return;
  const btn=document.createElement('button');btn.type='button';btn.id='big-five-trigger';btn.setAttribute('aria-label','The Big Five');btn.title='The Big Five';btn.setAttribute('aria-haspopup','menu');btn.setAttribute('aria-expanded','false');
  // Scott 2026-10-30: a different "5" each page visit (grey 5 -> dice -> orange shield, in turn).
  const fives=['/images/icons/big-five.png','/images/icons/big-five-dice.png','/images/icons/big-five-shield.png'];
  let fiveIdx=0;try{fiveIdx=(Number(localStorage.getItem('ci-big-five-look'))+1||0)%fives.length;localStorage.setItem('ci-big-five-look',String(fiveIdx));}catch(_){fiveIdx=Math.floor(Math.random()*fives.length);}
  btn.innerHTML='<img src="'+fives[fiveIdx]+'" alt="" width="44" height="44" draggable="false" style="object-fit:contain">';
  const pop=document.createElement('div');pop.id='big-five-menu';pop.setAttribute('role','menu');pop.hidden=true;
  pop.innerHTML='<img class="bf-logo" src="/images/logo/ci-logo-astronaut-200.jpg" alt="Cosmic Intentions" width="100" height="100"><h2>THE BIG FIVE</h2><div class="bf-list">'+keys.map(k=>{const q=document.querySelector('#quick-nav [data-quick-nav="'+k+'"]');return q?'<button type="button" role="menuitem" data-big-five="'+k+'" style="'+(q.getAttribute('style')||'')+'">'+q.innerHTML+'</button>':'';}).join('')+'</div>';
  document.body.append(pop);
  const place=()=>{const r=btn.getBoundingClientRect(),w=Math.min(196,innerWidth-24);pop.style.width=w+'px';pop.style.top=(r.bottom+8+scrollY)+'px';pop.style.left=Math.max(12,Math.min(r.right-w,innerWidth-w-12))+scrollX+'px';};
  const close=()=>{pop.hidden=true;btn.setAttribute('aria-expanded','false');};
  btn.addEventListener('click',e=>{e.stopPropagation();if(pop.hidden){place();pop.hidden=false;btn.setAttribute('aria-expanded','true');pop.querySelector('button')?.focus();}else close();});
  pop.addEventListener('click',e=>{const b=e.target.closest('[data-big-five]');if(!b)return;close();openFeature(b.dataset.bigFive);});
  document.addEventListener('click',e=>{if(!pop.hidden&&!pop.contains(e.target)&&e.target!==btn)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pop.hidden){close();btn.focus();}});
  addEventListener('resize',()=>{if(!pop.hidden)place();});
  const mount=()=>{if(trigger.parentElement&&btn.nextElementSibling!==trigger)trigger.before(btn);};mount();new MutationObserver(mount).observe(document.querySelector('.orientation'),{childList:true,subtree:true});
 })();
 // Scott 2026-11-01: picking from the bar, the 5 or the ☰ menu keeps the page in place. The top card
 // and content fade out, the new page fades in, and the "What do you want to do?" bar glides to its
 // new spot. The address tracks the current page so reload and bookmarks land there.
 const orientationCard=document.querySelector('.orientation');
 let headerFade;
 function fadeHeader(opacity,duration){
  if(!orientationCard)return Promise.resolve();
  const from=getComputedStyle(orientationCard).opacity;headerFade?.cancel();orientationCard.style.opacity=opacity;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
  headerFade=orientationCard.animate([{opacity:from},{opacity}],{duration,easing:'ease-in-out'});
  return headerFade.finished.catch(()=>{});
 }
 function barTop(){
  const q=document.getElementById('quick-nav');
  if(q&&!q.hidden&&q.offsetParent)return q.getBoundingClientRect().top;
  try{const deck=frame.contentDocument.querySelector('.shell.home-mode .deck');if(deck&&deck.offsetParent)return frame.getBoundingClientRect().top+deck.getBoundingClientRect().top;}catch(_){}
  return null;
 }
 function glideBar(fromTop){
  const q=document.getElementById('quick-nav');
  if(fromTop==null||!q||q.hidden||!q.offsetParent||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const shift=fromTop-q.getBoundingClientRect().top;
  if(Math.abs(shift)<2)return;
  q.animate([{transform:'translateY('+shift+'px)'},{transform:'none'}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});
 }
 // Scott 2026-11-01: page citations. Content frames send their sources here; they're listed at the
 // very bottom of the page, and cleared whenever the page changes.
 // Quick buttons inside pages (e.g. Roadmap: To Do / Notes / My Journal) open a feature here (Scott, 4 Nov 2026).
 window.addEventListener('message',event=>{if(event.origin===location.origin&&event.data?.type==='ci-open-feature'&&['goal-workspace','task-notes','journal','goals','action-plan'].includes(event.data.action))openFeature(event.data.action);});
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin)return;
  const type=event.data?.type;
  if(type!=='ci-page-citations'&&type!=='ci-page-citations-jump')return;
  let box=document.getElementById('ci-page-citations');
  if(type==='ci-page-citations-jump'){box?.scrollIntoView({behavior:'smooth',block:'end'});return;}
  const html=String(event.data.html||'');
  if(!html){box?.remove();return;}
  if(!box){box=document.createElement('aside');box.id='ci-page-citations';box.setAttribute('aria-label','Sources');
   box.style.cssText='max-width:900px;margin:24px auto 40px;padding:14px 18px;border-top:1px solid #dfe1e6;font:400 13px/1.6 Arial,sans-serif;color:#6b6f78';
   (document.querySelector('main')||document.body).append(box);}
  box.innerHTML=html;box.querySelectorAll('a').forEach(a=>{a.style.color='#6b6f78';a.target='_blank';a.rel='noopener';});
 });
 window.addEventListener('popstate',event=>{const a=event.state?.ciFeature||new URLSearchParams(location.search).get('feature')||'home';if(features[a])openFeature(a,{fromHistory:true});});
 async function openFeature(action,options={}){
  if(!features[action])return;
  const version=++navigationVersion;
  pageNavigationPending=true;
  if(!options.fromHistory){try{const url=new URL(location.href);if(url.searchParams.get('feature')!==action){url.searchParams.set('feature',action);history.replaceState({ciFeature:action},'',url);}}catch(_){}}
  const startBarTop=barTop();
  document.getElementById('ci-page-citations')?.remove();
  if(headerNoteFrame?.contentWindow)headerNoteFrame.contentWindow.ciHoldCarousel=true;
  contentCard.setAttribute('aria-busy','true');contentCard.inert=true;
  await Promise.all([fadeContent(0,180),fadeHeader(0,180)]);
  if(version!==navigationVersion)return;
  navigateFeature(action);
  // Wait for the selected page, including a newly loaded player iframe.
  const ready=()=>{
   try{
    const doc=frame.contentDocument;
    if(!doc||doc.readyState==='loading')return false;
    if(action==='aks')return !!doc.getElementById('aks-holding-area');
    if(['gratitude','new-gratitude'].includes(action))return !!doc.getElementById('gratitude-master-play');
    if(action==='super-viz')return !!doc.getElementById('stage')&&new URL(doc.URL).pathname==='/players/super-viz-player.html';
    if(new URL(doc.URL).pathname!=='/players/master-player.html')return false;
    const inner=doc.getElementById('experienceFrame')?.contentDocument;
    if(action==='home')return doc.querySelector('#homeView')?.hidden===false;
    if(action==='meditation')return !!inner?.querySelector('.meditation-start-control');
    const pageId=Object.keys(inlinePages).find(key=>inlinePages[key]===action);
    return !!inner?.querySelector('#page-'+pageId+'.active');
   }catch(_){return false;}
  };
  const started=performance.now();
  while(version===navigationVersion&&!ready()&&performance.now()-started<15000)await new Promise(resolve=>setTimeout(resolve,50));
  if(version!==navigationVersion)return;
  pageNavigationPending=false;
  if(headerNoteFrame.dataset.noteSource)queueHeaderChange(headerNoteFrame.dataset.noteSource);
  contentCard.inert=false;contentCard.removeAttribute('aria-busy');
  glideBar(startBarTop);
  await Promise.all([fadeContent(1,300),fadeHeader(1,300)]);
 }
 function navigateFeature(action){
  if(action==='aks'){playerAction=action;gratitudeV2=false;newGratitude=false;frame.src='/standalone/aks.html';renderFeature(action);return;}
  if(action==='super-viz'){playerAction=action;frame.src='/players/super-viz-player.html?preview=1&start=super-viz';renderFeature(action);return;}
  if(action==='gratitude'||action==='new-gratitude'){
   playerAction='gratitude';gratitudeV2=true;newGratitude=false;
   frame.src='/standalone/gratitude-v2/index.html?module=gratitude-v2';
   if(headerNote)updateHeaderNote('/?masterInline=citadel-note&notePage=gratitude&preview=1');
   renderFeature('gratitude');return;
  }
  if(gratitudeV2||new URL(frame.src,location.origin).pathname==='/players/super-viz-player.html'){
   gratitudeV2=false;playerAction=action;
   frame.src='/players/master-player.html?preview=1&start='+encodeURIComponent(action);
   renderFeature(action);return;
  }
  playerAction=action;
  if(action==='new-gratitude'){
   newGratitude=true;gratitudeModule=1;frame.src='/players/master-player.html?start=meditation&preview=1&reviewPage=new-gratitude';renderFeature(action);return;
  }
  if(newGratitude){newGratitude=false;frame.src='/players/master-player.html?preview=1&start='+encodeURIComponent(action);renderFeature(action);return;}
  frame.contentWindow?.postMessage({type:'ci-lfm-select',action},location.origin);renderFeature(action);
 }
 const menuLabels={aks:'AKS','welcome-images':'Welcome & Talking Images','site-home':'Home Page',home:'Citadel',goals:'Goals','daily-habits':'Habits',favorites:'My Favorites Reel',thoughts:'My Thoughts',journal:'My Journal','action-plan':'Roadmap',visualization:'Visualization Library',meditation:'Meditation','super-viz':'Visualize','new-gratitude':'NEW GRATITUDE',gratitude:'Gratitude','cosmic-library':'Cosmic Library','entrepreneur-library':'Entrepreneur Library','ent-card':'Entrepreneur Cards',wins:'My Wins','task-notes':'Notes','goal-workspace':'TO DO',admin:'Admin'};
 const usageLink=document.createElement('a');usageLink.href='/usage-board.html';usageLink.textContent='My Usage';usageLink.style.cssText='display:block;padding:16px;color:inherit;font:inherit';const menuItems=document.getElementById('review-menu-items');menuItems.append(usageLink);
 const paletteLink=document.createElement('a');paletteLink.href='/standalone/palettes.html';paletteLink.textContent='Color Palettes';paletteLink.style.cssText=usageLink.style.cssText;menuItems.append(paletteLink);
 delete menuLabels.gratitude;
 // Scott 6 Nov 2026: the Big Five (Action Plan, Goals, Habits, Meditate, Visualize) leave the ☰ menu; they live on the 5 and the bottom bar.
 for(const k of ['action-plan','goals','daily-habits','meditation','super-viz'])delete menuLabels[k];
 features.gratitude=['NEW GRATITUDE','Make space for your chosen gratitude practice.','Press Play to begin. Choose your module and quiet practice time.'];
 for(const [action,label] of Object.entries(menuLabels).sort((a,b)=>a[1].localeCompare(b[1],'en',{sensitivity:'base'}))){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.ciMenuAction=action;button.addEventListener('click',()=>{menu.close();if(action==='welcome-images'){location.assign('/?home=1#homeLoggedIn');return;}if(action==='site-home'){location.assign('/');return;}openFeature(action);});document.getElementById('review-menu-items').append(button);}
 // Site menu stays A–Z, including My Usage and any item added later (Scott, 3 Nov 2026).
 const sortMenu=()=>{const items=[...menuItems.children],sorted=[...items].sort((a,b)=>a.textContent.trim().localeCompare(b.textContent.trim(),'en',{sensitivity:'base'}));if(sorted.some((el,i)=>el!==items[i]))menuItems.append(...sorted);};
 sortMenu();new MutationObserver(sortMenu).observe(menuItems,{childList:true});
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
 let headerChangeTimer=0,headerChangeVersion=0;
 function queueHeaderChange(src){
  const version=++headerChangeVersion;
  clearTimeout(headerChangeTimer);
  const win=headerNoteFrame.contentWindow;
  if(win)win.ciHoldCarousel=true;
  const waitForPage=()=>{
   if(version!==headerChangeVersion)return;
   if(pageNavigationPending){headerChangeTimer=setTimeout(waitForPage,50);return;}
   headerChangeTimer=setTimeout(()=>{
    if(version!==headerChangeVersion)return;
    if(pageNavigationPending){waitForPage();return;}
    if(win)win.ciHoldCarousel=false;
    if(headerNoteFrame.dataset.appliedNoteSource===src)return;
    const pageId=new URL(src,location.origin).searchParams.get('notePage')||'dashboard';
    if(typeof win?.ciSetCitadelNotePage==='function'){
     headerNoteFrame.dataset.appliedNoteSource=src;
     win.ciSetCitadelNotePage(pageId);
    }else headerNoteFrame.src=src;
   },0);
  };
  waitForPage();
 }
 function updateHeaderNote(src){
  // Reveal before measuring; retain the existing card until the next page settles.
  headerNote.hidden=current==='admin';
  if(headerNoteFrame.dataset.noteSource===src)return;
  headerNoteFrame.dataset.noteSource=src;
  if(headerNoteFrame.dataset.appliedNoteSource){queueHeaderChange(src);return;}
  headerNoteFrame.dataset.appliedNoteSource=src;
  headerNoteFrame.src=src;
 }
 headerNoteFrame.addEventListener('load',()=>{try{headerNoteFrame.contentDocument.documentElement.classList.toggle('ci-header-note-todo',document.body.classList.contains('todo-page'));}catch(_){}
  const src=headerNoteFrame.dataset.noteSource;
  if(src&&headerNoteFrame.getAttribute('src')!==src){
   queueHeaderChange(src);
  }
 });
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==headerNoteFrame.contentWindow)return;
  if(event.data?.type==='ci-carousel-border-color'){
   const color=event.data.color;
   if(/^#[0-9a-f]{6}$/i.test(color)){
    headerCalendar.style.transition='border-color '+(event.data.duration===5000?5000:0)+'ms ease-in-out';
    headerCalendar.style.borderColor=color;
   }
   return;
  }
  if(event.data?.type!=='ci-citadel-note-height')return;
  const height=Math.max(0,Math.ceil(Number(event.data.height)||0));
  if(gratitudeV2&&!height)return;
  headerNoteFrame.style.height=Math.max(1,height)+'px';headerNote.hidden=current==='admin';
 });
 function watchDocument(doc){
  const homeDeck=doc.querySelector('.shell.home-mode .deck');
  if(homeDeck&&!homeDeck.dataset.ciInPlace){
   homeDeck.dataset.ciInPlace='1';
   homeDeck.addEventListener('click',event=>{
    const nav=event.target.closest('.nav[data-action]');if(!nav)return;
    const target={gratitude:'new-gratitude',visualization:'super-viz'}[nav.dataset.action]||nav.dataset.action;
    if(!features[target])return;
    event.preventDefault();event.stopImmediatePropagation();openFeature(target);
   },true);
  }
  // The Citadel already shows the full icon grid, so hide the small row whenever that grid is on screen.
  // The Menu heading's chevron was a picture only. Make it a real button that closes the menu
  // and returns to the page the member came from. The locked Master Player file is unchanged.
  const directoryHead=doc===frame.contentDocument?doc.querySelector('#directoryView .view-head'):null;
  if(directoryHead&&!doc.getElementById('ci-menu-close')){
   const style=doc.createElement('style');style.textContent='#directoryView .view-head::after{content:none!important}#ci-menu-close{flex:none;width:44px;height:44px;box-sizing:border-box;border:2px solid #fff;border-radius:50%;padding:0;background:#000 url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'white\' d=\'M5 8h4l3 4 3-4h4l-7 9z\'/%3E%3C/svg%3E") center/82% no-repeat;cursor:pointer}#ci-menu-close:focus-visible{outline:3px solid #0b2a5b;outline-offset:2px}';doc.head.append(style);
   const close=doc.createElement('button');close.id='ci-menu-close';close.type='button';close.setAttribute('aria-label','Close menu');
   close.addEventListener('click',()=>frame.contentWindow.postMessage({type:'ci-lfm-select',action:current&&current!=='admin'?current:'home'},location.origin));
   directoryHead.append(close);
  }
  if(doc===frame.contentDocument){const quickNav=document.getElementById('quick-nav');if(quickNav)quickNav.hidden=!!homeDeck||current==='home';}
  if(homeDeck&&!doc.getElementById('citadel-action-heading')){
   const heading=doc.createElement('h2');heading.id='citadel-action-heading';heading.textContent='WHAT DO YOU WANT TO DO?';
   homeDeck.prepend(heading);
  }
  // Scott 2026-10-29: Notes removed from the Citadel "What do you want to do?" row.
  if(homeDeck&&!doc.getElementById('citadel-hide-notes')){
   const style=doc.createElement('style');style.id='citadel-hide-notes';
   style.textContent='.shell.home-mode .deck .nav[data-action="task-notes"]{display:none!important}.shell:not(.home-mode) .deck .nav[data-action="gratitude"]{display:none!important}#citadel-action-heading{order:-1}.shell.home-mode .deck>.nav[data-action="action-plan"]{order:1}.shell.home-mode .deck>.nav[data-action="goals"]{order:2}.shell.home-mode .deck>.nav[data-action="gratitude"]{order:3}.shell.home-mode .deck>.nav[data-action="daily-habits"]{order:4}.shell.home-mode .deck>.nav[data-action="cosmic-library"]{order:5}.shell.home-mode .deck>.nav[data-action="meditation"]{order:6}.shell.home-mode .deck>.nav[data-action="super-viz"],.shell.home-mode .deck>.nav[data-action="visualization"]{order:7}.shell.home-mode .deck>.nav:not([data-action]){order:9}';doc.head.append(style);
  }
  const visualize=doc.querySelector('.nav[data-action="visualization"]');
  if(visualize){
   const superViz=visualize.cloneNode(true);
   superViz.dataset.action='super-viz';
   superViz.setAttribute('aria-label','Visualize');
   superViz.querySelector('span').textContent='Visualize';
   superViz.style.setProperty('--citadel-button','#0053a4');
   superViz.style.setProperty('--citadel-ring','#0076a3');
   superViz.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openFeature('super-viz');});
   visualize.replaceWith(superViz);
  }
  if(!doc?.documentElement)return;
  const opening=doc===frame.contentDocument?doc.getElementById('citadelNoteFrame'):null;
  if(opening){
   if(!doc.getElementById('header-note-relocation')){
    const style=doc.createElement('style');style.id='header-note-relocation';
    style.textContent='#citadelNote{display:none!important}';doc.head.append(style);
   }
   const src=opening.getAttribute('src');
   // The shared master frame can retain its previous Citadel note while the
   // new standalone Gratitude player mounts. Never let that stale frame
   // overwrite Gratitude's page-specific ATB 1 instruction source.
   if(src && current!=='gratitude' && current!=='new-gratitude') updateHeaderNote(src);
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
    html.ci-review-test .shell.home-mode .deck{background:transparent;padding-bottom:28px!important;min-height:0!important}
    html.ci-review-test .shell.home-mode .deck::before{bottom:0;background:#fff}
    html.ci-review-test .shell.home-mode .nav{color:#171717}
    html.ci-review-test .shell.home-mode .nav :is(svg,.hamb-lines){color:#fff}
    html.ci-review-test .shell.home-mode .nav:focus-visible{outline-color:#171717}
html.ci-review-test .shell.home-mode [data-action="meditation"]{--citadel-button:#4a1a7a;--citadel-ring:#7b2cbf}
html.ci-review-test .shell.home-mode [data-action="gratitude"]{--citadel-button:#4e2c12;--citadel-ring:#7b4a26}
html.ci-review-test .shell.home-mode [data-action="daily-habits"]{--citadel-button:#a0400d;--citadel-ring:#f26420}
html.ci-review-test .shell.home-mode [data-action="goals"]{--citadel-button:#aaa001;--citadel-ring:#fef200}
html.ci-review-test .shell.home-mode [data-action="visualization"]{--citadel-button:#0053a4;--citadel-ring:#0076a3}
html.ci-review-test .shell.home-mode [data-action="action-plan"]{--citadel-button:#005e1f;--citadel-ring:#187a2f}
html.ci-review-test .shell.home-mode [data-action="cosmic-library"]{--citadel-button:#3a3a3a}
html.ci-review-test .shell.home-mode [data-action="task-notes"]{--citadel-button:#444444}
html.ci-review-test .shell.home-mode #lfmMenu{--citadel-button:#4e4e4e}
html.ci-review-test .shell.home-mode .nav :is(svg,.hamb-lines){background:var(--citadel-button,#181818);box-shadow:inset 0 0 0 7px var(--citadel-ring,transparent)}
/* Scott 2026-10-30: Library = black ring, white centre, grey books; Menu = dark grey ring, white centre, grey lines (grey #747474 like the others). */
html.ci-review-test .shell.home-mode .nav[data-action="cosmic-library"] svg{width:56px!important;height:56px!important;padding:14.7px!important;box-sizing:border-box;background:#fff!important;box-shadow:inset 0 0 0 7px #000!important;color:#747474!important}
html.ci-review-test .shell.home-mode #lfmMenu .hamb-lines i{height:3px!important}
html.ci-review-test .shell.home-mode #lfmMenu .hamb-lines{width:56px!important;height:56px!important;padding:0 17px!important;gap:4px!important;box-sizing:border-box;background:#fff!important;box-shadow:inset 0 0 0 7px #4e4e4e!important;color:#747474!important}
html.ci-review-test .shell.home-mode .nav:focus-visible{outline:2px solid #171717;outline-offset:3px;border-radius:8px}
html.ci-review-test .shell.home-mode .nav:is([data-action="meditation"],[data-action="daily-habits"],[data-action="goals"],[data-action="super-viz"],[data-action="action-plan"],[data-action="gratitude"]){grid-template-rows:57px auto}
html.ci-review-test .shell.home-mode .nav:is([data-action="meditation"],[data-action="daily-habits"],[data-action="goals"],[data-action="super-viz"],[data-action="action-plan"],[data-action="gratitude"]) svg{width:56px;height:56px;padding:14.7px;color:#747474!important;stroke:#747474!important;opacity:1!important;filter:none!important;background:#fff;box-shadow:inset 0 0 0 7px var(--citadel-ring,transparent)}
@media(min-width:651px){html.ci-review-test .shell.home-mode .deck{grid-template-columns:repeat(8,minmax(0,1fr))}html.ci-review-test .shell.home-mode #citadel-action-heading{grid-column:1/-1}html.ci-review-test .shell.home-mode .deck .nav span{white-space:nowrap;font-size:clamp(11px,1.25vw,15px)}}
@media(max-width:650px){html.ci-review-test .shell.home-mode .deck{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
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
    if(action==='journal'||action==='goals'||action==='goal-workspace'||action==='daily-habits'||action==='cosmic-library'||action==='action-plan')page.querySelector(':scope > .ci-review-guidance')?.remove();
    if(action!=='cosmic-library'&&action!=='action-plan'&&features[action][2]&&!page.querySelector(':scope > .ci-review-guidance')){const guide=doc.createElement('p');guide.className='ci-review-guidance';guide.textContent=features[action][2];page.prepend(guide);}
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
   if(!doc.querySelector('#homeView')?.hidden)renderFeature('home');else if(features[playerAction])renderFeature(playerAction);
   const shell=doc.querySelector('.shell');
   const height=Math.ceil(shell.getBoundingClientRect().height)+2;
   // Citadel can be empty after removing its cards and lower navigation box.
   // Keep the normal transition guard for tool pages, while collapsing that space.
   if((height>100||shell.classList.contains('home-mode'))&&(!frame.style.height||Math.abs(height-parseFloat(frame.style.height))>2))frame.style.height=height+'px';
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

 document.getElementById('to-do').addEventListener('click',()=>openFeature('goal-workspace'));
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  const type=event.data?.type;
  if(type==='ci-gratitude-home'){openFeature('home');return;}
  if(type==='ci-site-menu-toggle'){if(menu.open)menu.close();else menu.showModal();return;}
  if(type==='ci-gratitude-v2-height'&&gratitudeV2){const height=Number(event.data.height);if(Number.isFinite(height)&&height>100)frame.style.height=Math.ceil(height)+'px';return;}
  if(type==='ci-lfm-mode'&&event.data.action!=='super-viz'&&new URL(frame.src,location.origin).pathname==='/players/super-viz-player.html'){openFeature(event.data.action==='citadel'?'home':event.data.action);return;}
  if(type==='ci-lfm-mode'&&['gratitude','new-gratitude'].includes(event.data.action)&&!gratitudeV2){openFeature('gratitude');return;}
  if(type==='ci-lfm-mode'){if(features[event.data.action])playerAction=event.data.action;else if(event.data.action==='citadel')playerAction='home';renderFeature(playerAction);schedule();}
  if(type==='ci-lfm-height'&&Math.abs(Number(event.data.height)+2-parseFloat(frame.style.height||'0'))>2)schedule();
 });
 window.addEventListener('resize',schedule);
 renderFeature('home');
 const initialFeature=new URLSearchParams(location.search).get('feature')||document.body.dataset.initialFeature;
 if(initialFeature&&features[initialFeature]){
  playerAction=initialFeature;
  if(initialFeature==='aks'||initialFeature==='new-gratitude'||initialFeature==='gratitude'||initialFeature==='super-viz')openFeature(initialFeature);
  else {frame.src='/players/master-player.html?preview=1&start='+encodeURIComponent(initialFeature);renderFeature(initialFeature);}
 }
})();

