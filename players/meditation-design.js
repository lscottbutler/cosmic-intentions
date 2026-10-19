/* Presentation only. Existing Meditation choices and engine remain authoritative. */
(()=>{
 const shell=document.querySelector('.shell'),stage=document.getElementById('stage');
 const frame=document.getElementById('experienceFrame'),menu=document.getElementById('meditationMenu');
 const modes=document.getElementById('meditationModes'),times=document.getElementById('meditationTimes');
 const relaxation=menu.querySelector('.relaxation-toggle-row'),note=document.getElementById('guidedNote');
 const footer=document.createElement('section');footer.id='meditationDesignControls';footer.setAttribute('aria-label','Meditation session choices');
 const play=document.createElement('button');play.id='meditationDesignPlay';play.type='button';play.textContent='PLAY';play.setAttribute('aria-label','Start meditation');play.disabled=true;
 const sessionID=()=>crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16)).join('-');
 let expanded=false,playback='ready',activeSeconds=0,lastTick=0,recorded=false,session=sessionID();
 const groups=[];
 function group(label,content,className){
  const box=document.createElement('div');box.className='meditation-design-group '+className;
  const heading=document.createElement('h2'),toggle=document.createElement('button');toggle.type='button';toggle.className='meditation-design-toggle';toggle.textContent=label;
  const choices=document.createElement('div');choices.id=content.id+'Choices';choices.append(content);
  toggle.setAttribute('aria-controls',choices.id);toggle.onclick=()=>setGroup(entry,toggle.getAttribute('aria-expanded')!=='true');
  const selection=document.createElement('p');selection.className='meditation-design-selection';selection.setAttribute('aria-live','polite');
  const panel=document.createElement('div');panel.className='meditation-design-panel';panel.append(choices);
  const entry={toggle,choices,panel,selection,content};heading.append(toggle);box.append(heading,selection,panel);groups.push(entry);return box;
 }
 const left=group('MEDITATION MODES',modes,'meditation-design-modes');groups[0].choices.append(relaxation);
 const right=group('Meditation Times',times,'meditation-design-times');
 menu.replaceChildren(left,right,note);footer.append(menu);stage.append(footer,play);
 function setGroup(g,value){g.toggle.setAttribute('aria-expanded',String(value));g.panel.classList.toggle('is-open',value);g.choices.inert=!value;g.panel.setAttribute('aria-hidden',String(!value));expanded=groups.some(g=>g.toggle.getAttribute('aria-expanded')==='true');note.hidden=!expanded;document.querySelector('[data-med-command="menu"]')?.setAttribute('aria-expanded',String(expanded));}
 function setExpanded(value){for(const g of groups)setGroup(g,value);}
 function selections(){for(const g of groups){const active=g.content.querySelector('.active');if(!active)continue;const label=active.querySelector('.med-mode-label');g.selection.textContent=label?active.getAttribute('aria-label')||label.innerText.trim():active.dataset.medTime+' minutes';}}
 new MutationObserver(selections).observe(menu,{subtree:true,attributes:true,attributeFilter:['class']});
 selections();
 setExpanded(false);
 const send=()=>frame.contentWindow?.postMessage({type:'ci-meditation-command',command:'toggle'},location.origin);
 play.addEventListener('click',send);
 window.CIMeditationDesign={setMenuOpen(open){
  menu.hidden=false;
  if(open&&playback==='running')send();
  if(open&&playback!=='ready')setExpanded(true);
 },toggleMenu(){
  if(playback==='running'){setExpanded(true);send();}
  else setExpanded(!expanded);
 }};
 // Mode/duration reloads retain selection semantics and reset the visible control.
 frame.addEventListener('load',()=>{play.disabled=true;playback='ready';activeSeconds=0;lastTick=0;recorded=false;session=sessionID();shell.classList.remove('meditation-design-running','meditation-design-quiet');play.textContent='PLAY';frame.contentWindow?.postMessage({type:'ci-meditation-command',command:'status'},location.origin);});
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=='ci-meditation-state'||!shell.classList.contains('meditation-player-mode'))return;
  const data=event.data,now=performance.now();
  if(playback==='running'&&lastTick)activeSeconds+=Math.max(0,(now-lastTick)/1000);
  if((playback==='complete'||playback==='ready')&&data.state==='running'){activeSeconds=0;recorded=false;session=sessionID();}
  lastTick=now;playback=data.state;play.disabled=false;
  if(playback==='complete'&&!recorded&&activeSeconds>=data.minutes*60*.95){recorded=true;import('/standalone/usage-client.js').then(m=>m.recordMeditation(activeSeconds,session)).catch(()=>{const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Your session finished, but activity tracking could not save.';footer.append(status);});}

  const running=playback==='running',quiet=running&&!data.hasGuidance;
  shell.classList.toggle('meditation-design-running',running);shell.classList.toggle('meditation-design-quiet',quiet);menu.hidden=false;menu.inert=running;
  const action=playback==='ready'?'Start':running?'Pause':playback==='paused'?'Resume':'Replay';
  play.setAttribute('aria-label',action+' meditation');
  const seconds=Math.max(0,Math.ceil(data.remaining/1000));
  play.textContent=quiet?(seconds<60?String(seconds):Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')):action==='Start'?'PLAY':action.toUpperCase();
  for(const button of menu.querySelectorAll('[data-med-time],[data-med-mode]'))button.setAttribute('aria-pressed',String(button.classList.contains('active')));
  note.hidden=!expanded;
 });
})();
