/* Presentation only. Existing Meditation choices and engine remain authoritative. */
(()=>{
 const shell=document.querySelector('.shell'),stage=document.getElementById('stage');
 const frame=document.getElementById('experienceFrame'),menu=document.getElementById('meditationMenu');
 const modes=document.getElementById('meditationModes'),times=document.getElementById('meditationTimes');
 const relaxation=menu.querySelector('.relaxation-toggle-row'),note=document.getElementById('guidedNote');
 const footer=document.createElement('section');footer.id='meditationDesignControls';footer.setAttribute('aria-label','Meditation session choices');
 const play=document.createElement('button');play.id='meditationDesignPlay';play.type='button';play.textContent='PLAY';play.setAttribute('aria-label','Start meditation');play.disabled=true;
 let expanded=false,playback='ready';
 const groups=[];
 function group(label,content,className){
  const box=document.createElement('div');box.className='meditation-design-group '+className;
  const heading=document.createElement('h2'),toggle=document.createElement('button');toggle.type='button';toggle.className='meditation-design-toggle';toggle.textContent=label;
  const choices=document.createElement('div');choices.id=content.id+'Choices';choices.append(content);
  toggle.setAttribute('aria-controls',choices.id);toggle.onclick=()=>setExpanded(!expanded);
  heading.append(toggle);box.append(heading,choices);groups.push({toggle,choices});return box;
 }
 const left=group('MEDITATION MODES',modes,'meditation-design-modes');left.lastElementChild.append(relaxation);
 const right=group('Meditation Times',times,'meditation-design-times');
 menu.replaceChildren(left,right,note);footer.append(menu);stage.append(footer,play);
 function setExpanded(value){expanded=value;for(const g of groups){g.toggle.setAttribute('aria-expanded',String(value));g.choices.hidden=!value;}note.hidden=!value;document.querySelector('[data-med-command="menu"]')?.setAttribute('aria-expanded',String(value));}
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
 frame.addEventListener('load',()=>{play.disabled=true;playback='ready';shell.classList.remove('meditation-design-running','meditation-design-quiet');play.textContent='PLAY';frame.contentWindow?.postMessage({type:'ci-meditation-command',command:'status'},location.origin);});
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=='ci-meditation-state'||!shell.classList.contains('meditation-player-mode'))return;
  const data=event.data;playback=data.state;play.disabled=false;
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
