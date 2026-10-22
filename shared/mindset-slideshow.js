import './mindset-slideshow.css';

const DESIGNS = [['trough','Troughs'],['third','One-third Left'],['half','50/50'],['full','Full Frame']];
const ART = ['570','2490','1210','2170','970','2040','1170','2300'];
const TROUGHS = ['robots','city-skyline','tree-birds','luers','purple-mountains'];
let activePlayer;
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Same favorite stores and statement indices as the original text lists.
function favoriteStore(mode) { return mode==='belief'?'ci_ent_belief_favs':'ci_ent_aff_favs'; }
function readFavorites(mode) { try { const data=JSON.parse(localStorage.getItem(favoriteStore(mode))||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{}; } catch { return null; } }

export function mountMindsetSlides(host, sections, cardKey) {
 const players=[];
 for(const [sectionIndex,section] of sections.entries()) {
  const items=section.items.filter(text=>typeof text==='string'&&text.trim());
  if(!items.length)continue;
  let index=0,playing=false,muted=false,disposed=false,token=0,timer,audio,utterance;
  const supportsFavorites=['aff','belief'].includes(section.mode);
  const el=document.createElement('section');el.className='mindset-slideshow';el.setAttribute('aria-label',section.title+' audio slideshow');
  el.innerHTML=`<header><h3>${esc(section.title)}</h3><label>Design <select aria-label="${esc(section.title)} player design">${DESIGNS.map(([id,label],i)=>`<option value="${id}"${i===sectionIndex%4?' selected':''}>${label}</option>`).join('')}</select></label><button type="button" class="mindset-fullscreen" data-control="fullscreen" aria-label="Full screen"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg></button></header>
   <div class="mindset-stage" data-design="${DESIGNS[sectionIndex%4][0]}"><img class="mindset-art" alt="" loading="lazy"><div class="mindset-caption"><p></p></div></div>
   <div class="mindset-controls"><button type="button" data-control="previous" aria-label="Previous statement">◀</button><button type="button" data-control="play" aria-label="Play ${esc(section.title)}">▶</button><button type="button" data-control="next" aria-label="Next statement">▶</button><span class="mindset-count" aria-live="polite"></span><button type="button" data-control="mute" aria-label="Mute narration" aria-pressed="false">Sound on</button>${supportsFavorites?'<button type="button" data-control="favorite" aria-label="Favorite this statement" aria-pressed="false">♡</button>':''}</div>
   <label class="mindset-scrubber"><span class="sr-only">Choose statement</span><input type="range" min="1" max="${items.length}" value="1" aria-label="${esc(section.title)} statement"></label><p class="mindset-status" role="status"></p>`;
  host.append(el);
  const stage=el.querySelector('.mindset-stage'),image=el.querySelector('img'),caption=el.querySelector('.mindset-caption p'),count=el.querySelector('.mindset-count'),slider=el.querySelector('input'),status=el.querySelector('.mindset-status'),playButton=el.querySelector('[data-control="play"]'),muteButton=el.querySelector('[data-control="mute"]'),favorite=el.querySelector('[data-control="favorite"]');
  const setStatus=text=>{status.textContent=text;};
  function stopVoice(){token++;clearTimeout(timer);if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null;}if(utterance){speechSynthesis.cancel();utterance=null;}}
  function paintFavorite(){if(!favorite)return;const data=readFavorites(section.mode),on=Array.isArray(data?.[cardKey])&&data[cardKey].includes(index);favorite.textContent=on?'♥':'♡';favorite.setAttribute('aria-pressed',String(on));}
  function paint(){
   caption.textContent=items[index];count.textContent=(index+1)+' / '+items.length;slider.value=String(index+1);
   image.src=stage.dataset.design==='trough'?'/images/troughs-web/'+TROUGHS[(sectionIndex+index)%TROUGHS.length]+'-1280.webp':'/images/50-50/'+encodeURIComponent('[000] '+ART[(sectionIndex+index)%ART.length]+'.jpg');
   stage.classList.remove('mindset-enter');void stage.offsetWidth;stage.classList.add('mindset-enter');paintFavorite();
  }
  function paintPlay(){playButton.textContent=playing?'Ⅱ':'▶';playButton.setAttribute('aria-label',(playing?'Pause ':'Play ')+section.title);}
  function pause(){playing=false;stopVoice();paintPlay();if(activePlayer===controller)activePlayer=null;}
  function finished(myToken){if(disposed||!playing||myToken!==token)return;timer=setTimeout(()=>{if(!playing||myToken!==token)return;if(index===items.length-1){pause();setStatus('Session complete. Press Play to replay.');}else{index++;paint();speak();}},1800);}
  function browserVoice(myToken){
   if(disposed||!playing||myToken!==token)return;
   if(!('speechSynthesis' in window)){setStatus('Narration is unavailable in this browser. Sound is off.');muted=true;paintMute();silentAdvance(myToken);return;}
   utterance=new SpeechSynthesisUtterance(items[index]);utterance.rate=.9;
   utterance.onend=()=>finished(myToken);
   utterance.onerror=event=>{if(myToken!==token||event.error==='canceled'||event.error==='interrupted')return;pause();setStatus('Narration could not play. Try again or turn sound off.');};
   speechSynthesis.speak(utterance);
  }
  function silentAdvance(myToken){timer=setTimeout(()=>finished(myToken),Math.max(4000,items[index].split(/\s+/).length*450));}
  async function speak(){
   stopVoice();const myToken=token;setStatus('');if(!playing||disposed)return;
   if(muted){silentAdvance(myToken);return;}
   // Existing cached ElevenLabs connection; browser voice if unavailable.
   if(typeof window.ciApiJson==='function'){
    setStatus('Loading narration…');
    try{
     const result=await window.ciApiJson('tts-elevenlabs',{text:items[index]});
     if(disposed||!playing||myToken!==token)return;
     setStatus('');if(result?.url){audio=new Audio(result.url);audio.onended=()=>finished(myToken);audio.onerror=()=>browserVoice(myToken);await audio.play();return;}
    }catch{if(disposed||!playing||myToken!==token)return;}
   }
   setStatus('');browserVoice(myToken);
  }
  function start(){if(activePlayer&&activePlayer!==controller)activePlayer.pause();activePlayer=controller;playing=true;paintPlay();speak();}
  function move(next){stopVoice();index=Math.max(0,Math.min(items.length-1,next));paint();setStatus('');if(playing)speak();}
  function paintMute(){muteButton.textContent=muted?'Sound off':'Sound on';muteButton.setAttribute('aria-pressed',String(muted));muteButton.setAttribute('aria-label',muted?'Enable narration':'Mute narration');}
  const controller={pause,dispose(){pause();disposed=true;}};players.push(controller);
  el.querySelector('select').addEventListener('change',event=>{stage.dataset.design=event.target.value;paint();});
  slider.addEventListener('input',()=>move(Number(slider.value)-1));
  el.addEventListener('click',event=>{
   const action=event.target.closest('[data-control]')?.dataset.control;if(!action)return;
   if(action==='play'){if(playing)pause();else{if(index===items.length-1&&status.textContent.startsWith('Session complete')){index=0;paint();}start();}}
   if(action==='previous')move(index-1);
   if(action==='next')move(index+1);
   if(action==='mute'){muted=!muted;paintMute();if(playing)speak();}
   if(action==='fullscreen'){if(document.fullscreenElement===el)document.exitFullscreen?.();else el.requestFullscreen?.().catch(()=>setStatus('Full screen is unavailable.'));}
   if(action==='favorite'){
    const data=readFavorites(section.mode);if(!data){setStatus('Existing favorites could not be read. They were left unchanged.');return;}
    const saved=Array.isArray(data[cardKey])?data[cardKey]:[],at=saved.indexOf(index);if(at>=0)saved.splice(at,1);else saved.push(index);if(saved.length)data[cardKey]=saved;else delete data[cardKey];
    try{localStorage.setItem(favoriteStore(section.mode),JSON.stringify(data));paintFavorite();}catch{setStatus('Could not save this favorite on this device.');}
   }
  });paint();
 }
 const pauseAll=()=>players.forEach(player=>player.pause());
 const visibility=()=>{if(document.hidden)pauseAll();};document.addEventListener('visibilitychange',visibility);
 return {pause:pauseAll,dispose(){players.forEach(player=>player.dispose());document.removeEventListener('visibilitychange',visibility);host.replaceChildren();}};
}
