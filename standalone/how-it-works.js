'use strict';
(() => {
 const $=id=>document.getElementById(id);
 const groups={goals:'Your direction','action-plan':'Your direction','goal-workspace':'Your direction','daily-habits':'Daily practice',meditation:'Daily practice',visualization:'Daily practice',gratitude:'Daily practice',favorites:'Daily practice',thoughts:'Reflect & collect',journal:'Reflect & collect','task-notes':'Reflect & collect',wins:'Reflect & collect','cosmic-library':'Explore & learn','entrepreneur-library':'Explore & learn','ent-card':'Explore & learn',citadel:'Start here','mind-loop':'Daily practice'};
 let tours=[],current=null,step=0,playing=false,all=false,timer=null,pulse=null,loadVersion=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function stopTimers(){clearTimeout(timer);clearTimeout(pulse);timer=pulse=null;$('cursor').classList.remove('click');}
 function pause(){all=false;playing=false;stopTimers();$('play').textContent='Play tour';$('play').setAttribute('aria-pressed','false');}
 function list(){
  const query=$('feature-search').value.trim().toLowerCase();const filtered=tours.filter(t=>(t.label+' '+t.description).toLowerCase().includes(query));const nav=$('feature-list');nav.replaceChildren();let group='';
  for(const t of filtered){const g=groups[t.id]||'Explore CI';if(group!==g){const h=document.createElement('p');h.className='feature-group';h.textContent=g;nav.append(h);group=g;}const b=document.createElement('button');b.className='feature-button';b.type='button';b.dataset.tour=t.id;b.setAttribute('aria-current',String(t.id===current?.id));const n=document.createElement('span');n.textContent=String(tours.indexOf(t)+1).padStart(2,'0');b.append(n,document.createTextNode(t.label));b.addEventListener('click',()=>choose(t.id));nav.append(b);}
  $('search-empty').hidden=filtered.length>0;
 }
 function position(frame){
  const p=frame.cursor;for(const id of ['cursor','spotlight','hotspot']){$(id).hidden=!p;if(p){$(id).style.left=(p.x*100)+'%';$(id).style.top=(p.y*100)+'%';}}
  $('hotspot').hidden=!p||!['click','type'].includes(frame.kind);
 }
 async function render(){
  if(!current)return;stopTimers();const version=++loadVersion;const f=current.frames[step];$('tour-status').textContent='';$('tour-title').textContent=current.label;$('tour-description').textContent=current.description;$('tour-group').textContent=groups[current.id]||'Explore CI';$('step-number').textContent=String(step+1).padStart(2,'0');$('step-caption').textContent=f.caption;$('action-label').textContent=f.kind==='click'?'CLICK':f.kind==='type'?'TYPE':'LOOK';$('previous').disabled=step===0;$('next').disabled=step===current.frames.length-1;
  $('play').textContent=playing?'Pause tour':step===current.frames.length-1?'Replay tour':'Play tour';$('play').setAttribute('aria-pressed',String(playing));
  const url=new URL(`tour-captures/${current.id}/${f.image}`,location.href).href;
  $('tour-image').style.visibility='hidden';const ready=new Image();const loaded=new Promise((resolve,reject)=>{ready.onload=resolve;ready.onerror=reject});ready.src=url;
  try{await loaded;}catch(e){if(version!==loadVersion)return;pause();$('tour-status').textContent='This step could not load. Select the feature again to retry.';return;}
  if(version!==loadVersion)return;$('tour-image').src=url;$('tour-image').style.visibility='visible';$('screen').style.aspectRatio=current.width+'/'+current.height;position(f);
  const progress=$('step-progress');progress.replaceChildren();current.frames.forEach((v,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Step ${i+1}: ${v.caption}`);if(i===step)b.setAttribute('aria-current','step');if(i<step)b.className='done';b.addEventListener('click',()=>{pause();step=i;render();});progress.append(b);});
  if(playing){if(f.cursor&&f.kind==='click'&&!reduced.matches)pulse=setTimeout(()=>$('cursor').classList.add('click'),900/Number($('speed').value));timer=setTimeout(()=>{if(step<current.frames.length-1){step++;render();}else{const following=all?tours[tours.indexOf(current)+1]:null;pause();if(following){choose(following.id);all=true;playing=true;render();}else{$('play').textContent='Replay tour';$('tour-status').textContent='Tour complete. Replay or choose another feature.';}}},Math.max(3600,f.caption.length*55)/Number($('speed').value));}
  const next=current.frames[step+1];if(next){const image=new Image();image.src=new URL(`tour-captures/${current.id}/${next.image}`,location.href).href;}
 }
 function choose(id,updateHash=true){const t=tours.find(t=>t.id===id);if(!t)return;pause();current=t;step=0;if(updateHash)history.replaceState(null,'','#feature='+encodeURIComponent(id));$('transcript').replaceChildren(...t.frames.map(f=>{const li=document.createElement('li');li.textContent=f.caption;return li;}));list();render();}
 function next(){pause();if(current&&step<current.frames.length-1){step++;render();}}
 $('watch-all').addEventListener('click',()=>{if(!tours.length)return;choose(tours[0].id);all=true;playing=true;render();});
 $('play').addEventListener('click',()=>{if(playing){pause();return;}if(!current)return;if(step===current.frames.length-1)step=0;playing=true;render();});
 $('previous').addEventListener('click',()=>{pause();if(step>0){step--;render();}});$('next').addEventListener('click',next);$('hotspot').addEventListener('click',next);
 $('replay').addEventListener('click',()=>{pause();step=0;playing=true;render();});$('speed').addEventListener('change',()=>{if(playing)render();});$('feature-search').addEventListener('input',list);
 $('zoom').addEventListener('click',()=>{const on=$('screen-viewport').classList.toggle('enlarged');$('zoom').setAttribute('aria-pressed',String(on));$('zoom').textContent=on?'Fit screen':'Enlarge screen';});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});reduced.addEventListener('change',pause);
 $('tour-player').addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON','SUMMARY','A'].includes(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();$('play').click();}if(e.key==='ArrowRight'){e.preventDefault();next();}if(e.key==='ArrowLeft'){e.preventDefault();$('previous').click();}});
 window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#feature='))choose(decodeURIComponent(location.hash.slice(9)),false);});
 fetch('tour-captures/index.json').then(r=>{if(!r.ok)throw Error('catalog unavailable');return r.json();}).then(data=>{if(!Array.isArray(data)||!data.length)throw Error('empty catalog');tours=data;$('feature-count').textContent=tours.length;$('play').disabled=false;const id=location.hash.startsWith('#feature=')?decodeURIComponent(location.hash.slice(9)):null;choose(tours.some(t=>t.id===id)?id:tours[0].id,false);}).catch(()=>{$('tour-title').textContent='Tours unavailable';$('step-caption').textContent='The walkthroughs could not load. Please refresh to try again.';$('tour-status').textContent='Feature catalog could not load.';});
})();
