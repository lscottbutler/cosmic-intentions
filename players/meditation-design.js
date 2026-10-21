/* Presentation only. Existing Meditation choices and engine remain authoritative. */
(()=>{
 const shell=document.querySelector('.shell'),stage=document.getElementById('stage');
 const frame=document.getElementById('experienceFrame'),menu=document.getElementById('meditationMenu');
 const modes=document.getElementById('meditationModes'),times=document.getElementById('meditationTimes');
 const relaxation=menu.querySelector('.relaxation-toggle-row'),note=document.getElementById('guidedNote');
 const footer=document.createElement('section');footer.id='meditationDesignControls';footer.setAttribute('aria-label','Meditation session choices');
 const play=document.createElement('button');play.id='meditationDesignPlay';play.type='button';renderControl('ready');play.setAttribute('aria-label','Start meditation');play.disabled=true;
 function renderControl(state){play.textContent='';play.setAttribute('aria-hidden','true');}
 addEventListener('message',event=>{if(event.origin===location.origin&&event.source===frame.contentWindow&&event.data?.type==='ci-meditation-home'&&playback==='complete')document.querySelector('[data-home]')?.click();});
 const sessionID=()=>crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16)).join('-');
 let expanded=false,playback='ready',activeSeconds=0,lastTick=0,recorded=false,session=sessionID();
 const summary=document.createElement('p');summary.className='meditation-design-summary';summary.setAttribute('aria-live','polite');
 const groups=[];
 function group(label,content,className){
  const box=document.createElement('div');box.className='meditation-design-group '+className;
  const heading=document.createElement('h2'),toggle=document.createElement('button');toggle.type='button';toggle.className='meditation-design-toggle';
  const indicator=document.createElement('span');indicator.className='meditation-design-status';indicator.setAttribute('aria-hidden','true');
  const caption=document.createElement('span');caption.className='meditation-design-caption';caption.textContent=label;const detail=document.createElement('span');detail.className='meditation-design-header-detail';caption.append(detail);toggle.append(indicator,caption);
  const choices=document.createElement('div');choices.id=content.id+'Choices';choices.append(content);
  toggle.setAttribute('aria-controls',choices.id);toggle.onclick=()=>{const open=toggle.getAttribute('aria-expanded')!=='true';for(const g of groups)setGroup(g,g.toggle===toggle&&open);};
  const panel=document.createElement('div');panel.className='meditation-design-panel';panel.append(choices);
  const entry={toggle,choices,panel,content,indicator,detail,label};heading.append(toggle);box.append(heading,panel);groups.push(entry);return box;
 }
 const relaxationDurations=[0,30,60,180,300,420,600,900,1800];
 let relaxationSeconds=0;
 try{const saved=Number(sessionStorage.getItem('ci-relaxation-seconds'));if(relaxationDurations.includes(saved))relaxationSeconds=saved;}catch{}
 const relaxationChoices=document.createElement('div');relaxationChoices.id='meditationRelaxation';
 const durationLabel=s=>s===0?'Off':s===30?'30 seconds':(s/60)+(s===60?' minute':' minutes');
 for(const seconds of relaxationDurations){
  const button=document.createElement('button');button.type='button';button.className='med-relaxation-option';button.dataset.relaxationSeconds=seconds;button.textContent=durationLabel(seconds);button.setAttribute('aria-pressed',String(seconds===relaxationSeconds));
  button.onclick=()=>{relaxationSeconds=seconds;try{sessionStorage.setItem('ci-relaxation-seconds',String(seconds));}catch{}for(const b of relaxationChoices.children)b.setAttribute('aria-pressed',String(Number(b.dataset.relaxationSeconds)===seconds));selections();const url=new URL(frame.src,location.origin);frame.src=url.href;};
  relaxationChoices.append(button);
 }
 relaxation.remove();
 const first=group('Relaxation',relaxationChoices,'meditation-design-relaxation');
 const left=group('Meditation Guidance',modes,'meditation-design-modes');
 const right=group('Meditation Time',times,'meditation-design-times');
 const customize=document.createElement('button');customize.type='button';customize.className='meditation-customize-toggle';customize.textContent='CUSTOMIZE MY MEDITATION SESSION';
 const customPanel=document.createElement('div');customPanel.id='meditationCustomization';customPanel.append(first,left,right,note);customize.setAttribute('aria-controls',customPanel.id);customize.onclick=()=>setCustomizeOpen(!expanded);
 menu.replaceChildren(summary,customize,customPanel);footer.append(menu);stage.append(footer,play);
 function setCustomizeOpen(value){expanded=value;customize.setAttribute('aria-expanded',String(value));customPanel.hidden=!value;customPanel.inert=!value;document.querySelector('[data-med-command="menu"]')?.setAttribute('aria-expanded',String(value));}
 function setGroup(g,value){g.toggle.setAttribute('aria-expanded',String(value));g.panel.classList.toggle('is-open',value);g.choices.inert=!value;g.panel.setAttribute('aria-hidden',String(!value));note.hidden=!groups.some(g=>g.toggle.getAttribute('aria-expanded')==='true');}
 function setExpanded(value){setCustomizeOpen(value);for(const [i,g] of groups.entries())setGroup(g,value&&i===0);}
 function sendSummary(){frame.contentWindow?.postMessage({type:'ci-meditation-summary',text:summary.textContent},location.origin);}
 function selections(){
  const mode=modes.querySelector('.active'),time=times.querySelector('.active');
  if(!mode||!time)return;
  const label=mode.getAttribute('aria-label')||mode.querySelector('.med-mode-label').innerText.trim();
  const minutes=time.dataset.medTime;
  const symbols=[relaxationSeconds?(relaxationSeconds===30?'30s':String(relaxationSeconds/60)):'X',mode.dataset.medMode==='unguided'?'X':mode.dataset.medMode==='lightly-guided'?'S':'I',minutes];
  const states=[relaxationSeconds?'Relaxation on':'Relaxation off',mode.dataset.medMode==='unguided'?'No guidance, bells only':mode.dataset.medMode==='lightly-guided'?'Slightly guided':'Instructions',minutes+' minutes'];
  const guidance=mode.dataset.medMode==='unguided'?'UNGUIDED':mode.dataset.medMode==='lightly-guided'?'SLIGHTLY GUIDED':'GUIDED';
  const details=[' Is '+(relaxationSeconds?durationLabel(relaxationSeconds).replace('seconds','Seconds').replace('minute','Minute'):'OFF'),' Is '+guidance,' Is '+minutes+(minutes==='1'?' Minute':' Minutes')];
  groups.forEach((g,i)=>{if(g.detail.textContent!==details[i])g.detail.textContent=details[i];if(g.indicator.textContent!==symbols[i])g.indicator.textContent=symbols[i];g.toggle.setAttribute('aria-label',g.label+': '+states[i]);});
  summary.textContent=label+' / '+minutes+(minutes==='1'?' Minute':' Minutes')+(relaxationSeconds?' with Relaxation Intro':'');
  sendSummary();
 }
 new MutationObserver(selections).observe(menu,{subtree:true,attributes:true,attributeFilter:['class']});
 selections();
 setExpanded(false);
 new ResizeObserver(()=>footer.style.setProperty('--meditation-menu-height',menu.offsetHeight+'px')).observe(menu);
 const send=()=>frame.contentWindow?.postMessage({type:'ci-meditation-command',command:'toggle'},location.origin);
 play.setAttribute('role','timer');play.setAttribute('tabindex','-1');
 window.CIMeditationDesign={setMenuOpen(open){
  menu.hidden=false;
  if(open&&playback==='running')send();
  if(open&&playback!=='ready')setExpanded(true);
 },toggleMenu(){
  if(playback==='running'){setExpanded(true);send();}
  else setExpanded(!expanded);
 }};
 // Mode/duration reloads retain selection semantics and reset the visible control.
 frame.addEventListener('load',()=>{sendSummary();play.disabled=true;playback='ready';activeSeconds=0;lastTick=0;recorded=false;session=sessionID();shell.classList.remove('meditation-design-running','meditation-design-quiet');renderControl('ready');frame.contentWindow?.postMessage({type:'ci-meditation-command',command:'configure-relaxation',seconds:relaxationSeconds},location.origin);frame.contentWindow?.postMessage({type:'ci-meditation-command',command:'status'},location.origin);});
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=='ci-meditation-state'||!shell.classList.contains('meditation-player-mode'))return;
  const data=event.data,now=performance.now();
  if(playback==='running'&&lastTick)activeSeconds+=Math.max(0,(now-lastTick)/1000);
  if((playback==='complete'||playback==='ready')&&data.state==='running'){activeSeconds=0;recorded=false;session=sessionID();}
  lastTick=now;playback=data.state;play.disabled=false;
  if(playback==='complete'&&!recorded&&activeSeconds>=(data.totalSeconds||data.minutes*60)*.95){recorded=true;import('/standalone/usage-client.js').then(m=>m.recordMeditation(activeSeconds,session)).catch(()=>{const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Your session finished, but activity tracking could not save.';footer.append(status);});}

  const running=playback==='running',quiet=running&&!data.hasGuidance;
  shell.classList.toggle('meditation-design-running',running);shell.classList.toggle('meditation-design-quiet',quiet);menu.hidden=false;menu.inert=running;
  const action=playback==='ready'?'Start':running?'Pause':playback==='paused'?'Resume':'Replay';
  play.setAttribute('aria-label',action+' '+(data.phase==='relaxation'?'relaxation':'meditation'));
  renderControl(playback,data.phaseRemaining??data.remaining);
  for(const button of menu.querySelectorAll('[data-med-time],[data-med-mode]'))button.setAttribute('aria-pressed',String(button.classList.contains('active')));
  note.hidden=!expanded;
 });
})();
