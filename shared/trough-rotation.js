import feed from './carousel-feed.json' with { type: 'json' };
// Static, user-supplied artwork. Only artwork IDs are stored; no member content.
export function createTroughPicker(ids, storage, random = Math.random) {
  const key = 'ci-trough-assignments-v1';
  let assignments = {};
  try { const value = JSON.parse(storage?.getItem(key) || '{}'); if(value && typeof value==='object' && !Array.isArray(value)) assignments=value; } catch {}
  return function pick(pageId) {
    const previous=assignments[pageId];
    const used=new Set(Object.entries(assignments).filter(([page])=>page!==pageId).map(([,id])=>id));
    let choices=ids.filter(id=>id!==previous&&!used.has(id));
    if(!choices.length)choices=ids.filter(id=>id!==previous);
    if(!choices.length)choices=ids;
    const id=choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];
    assignments[pageId]=id;
    try { storage?.setItem(key,JSON.stringify(assignments)); } catch {}
    return id;
  };
}

export const TROUGH_IDS=["2-cats", "address-book", "affirmation-trough-master-copy-1-copy-1", "blue-car", "buildings", "city-scape", "city-skyline", "death-valley", "digital-highway", "diver", "dog-star", "dots", "dragon-fly", "dragon-flys", "elephant", "everest", "fish-microphone", "fish", "fishes", "flowers", "green-fish", "hard-easy", "head-shoulders", "jumpers", "love-posters", "luers", "mountain-climber", "planets", "purple-mountains", "robots", "rocket", "sky-line-sun-rise", "sky-scrappers", "superman", "sushi-roll", "town", "tree-birds", "ufo"];

let storage;try{storage=globalThis.localStorage;}catch{}
export const CAROUSEL_ITEMS=feed.items;
const items=new Map(CAROUSEL_ITEMS.map(item=>[item.id,item]));
const pick=createTroughPicker(CAROUSEL_ITEMS.map(item=>item.id),storage);
const selections=new Map();let lastPage=null;
export function visitTroughPage(pageId, eligible=true){
 if(lastPage===pageId)return;
 lastPage=pageId;
 if(eligible)selections.set(pageId,pick(pageId));
}
export function attachTrough(shell,pageId){
 try{const doc=shell.ownerDocument,shellWin=(()=>{let w=globalThis;try{while(w.parent!==w&&!w.document.getElementById('review-menu'))w=w.parent;}catch{}return w;})(),mq=shellWin.matchMedia('(max-width:650px)');const set=()=>doc.documentElement.classList.toggle('ci-phone',mq.matches);set();if(!doc.ciPhoneWatch){doc.ciPhoneWatch=true;mq.addEventListener('change',set);}}catch{}
 if(shell.dataset.carouselPage!==pageId){
  shell.ciCarouselDispose?.();
  shell.dataset.carouselPage=pageId;
  delete shell.dataset.carouselReady;
 }
 if(!selections.has(pageId))selections.set(pageId,pick(pageId));
 shell.classList.add('ci-carousel');
 shell.setAttribute('aria-label','The Carousel');
 shell.setAttribute('role','region');
 const render=()=>{
  const request=shell.ciCarouselRequest=(shell.ciCarouselRequest||0)+1;
  const item=items.get(selections.get(pageId));
  if(!item)return;
  const card=document.createElement('div');card.className='ci-carousel-card';card.dataset.carouselId=item.id;
  card.dataset.contentType=item.type;
  if(item.image){
   const image=document.createElement('img');image.className='ci-admin-trough-art';
   image.alt=item.alt||'';image.width=1280;image.height=720;image.decoding='async';image.dataset.trough=item.id;
   image.src=item.image;
   if(item.smallImage){image.srcset=`${item.smallImage} 640w, ${item.image} 1280w`;image.sizes='(max-width: 700px) 100vw, 960px';}
   card.appendChild(image);
   // Phones: the caption baked into the art is cropped off and redrawn below it, 3x taller, text 2x (Scott, 3 Nov 2026).
   if(item.caption){card.style.setProperty('--ci-band',String((item.bandPx||88)/720));const cap=document.createElement('div');cap.className='ci-carousel-caption';cap.style.background=item.borderColor||'#0476a2';cap.textContent=item.caption;card.appendChild(cap);}
  }else{
   const text=document.createElement('p');text.className='ci-carousel-text';text.textContent=item.text||'';card.appendChild(text);
  }
  const previous=shell.firstElementChild;
  const reveal=()=>{
   if(request!==shell.ciCarouselRequest||(!shell.isConnected && previous))return;
   if(previous && previous.dataset.carouselId===item.id)return;
   shell.appendChild(card);
   globalThis.parent?.postMessage({type:'ci-carousel-border-color',color:item.borderColor,duration:previous?5000:0},globalThis.location?.origin);
   if(previous){card.animate([{opacity:0},{opacity:1}],{duration:5000,easing:'ease-in-out'});setTimeout(()=>previous.remove(),5000);}
  };
  const image=card.querySelector('img');
  if(image&&!image.complete){image.addEventListener('load',reveal,{once:true});image.addEventListener('error',()=>{}, {once:true});}else reveal();
 };
 if(shell.dataset.carouselReady){if(shell.firstElementChild?.dataset.carouselId!==selections.get(pageId))render();return;}
 shell.dataset.carouselReady='true';render();
 const timer=setInterval(()=>{
  if(!shell.isConnected){clearInterval(timer);return;}
  const page=shell.closest('.page');
  if(globalThis.ciHoldCarousel||document.hidden||(page&&!page.classList.contains('active')))return;
  selections.set(pageId,pick(pageId));render();
 },Math.max(6000,feed.intervalMs||12000));
 shell.ciCarouselDispose=()=>clearInterval(timer);
}
