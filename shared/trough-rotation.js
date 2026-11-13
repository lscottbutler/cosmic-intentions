import feed from './carousel-feed.json' with { type: 'json' };
import { ENT_CARDS, ENT_MINDSET } from './ent-library-content.js';
/* Scott 13 Nov 2026: the quote band rotates — the page quote (Admin → PAGE QUOTE),
   the member's own Affirmations / Beliefs / Attitudes / Quotes (My Thoughts),
   and lines from the Entrepreneur Library cards. */
const MY_LABEL={affirmation:'MY AFFIRMATION',belief:'MY BELIEF',attitude:'MY ATTITUDE',quote:'MY QUOTE'};
let _lib=null;
function libraryLines(){
 if(_lib)return _lib;_lib=[];
 const name=t=>String(t||'').replace(/^I AM (A |AN )?|^I /,'');
 (ENT_CARDS||[]).forEach(c=>{const m=(ENT_MINDSET||{})[c.key]||{};const tag='ENTREPRENEUR LIBRARY · '+name(c.title);
  [...(c.affirmations||[]),...(c.beliefs||[]),...(m.stoic||[]),...(m.attitudes||[])].forEach(t=>t&&_lib.push({text:t,author:tag}));});
 return _lib;
}
function myLines(){
 try{const a=JSON.parse(globalThis.localStorage?.getItem('ci_notes')||'[]');
  return (Array.isArray(a)?a:[]).filter(n=>MY_LABEL[n?.cat]&&String(n.text||'').trim()).map(n=>({text:String(n.text).trim(),author:MY_LABEL[n.cat]}));}catch{return [];}
}
const _rot=new Map();
const any=a=>a[Math.floor(Math.random()*a.length)];
// Scott 13 Nov 2026: each page shows ONE quote from the Admin QUOTE LIBRARY that changes
// every hour, and no two pages show the same quote in the same hour.
const QUOTE_PAGES=['dashboard','setup','habits','myroadmap','vizlibrary','vizgoal','meditation','super-viz','dailyfocus','notes','mynotes','tasknotes','goalworkspace','gratitude','wins','cosmiclibrary','entcard','proof','runthroughs'];
function _pageOffset(pageId){
 const k=QUOTE_PAGES.indexOf(pageId);if(k>=0)return k*5;
 let h=0;for(const ch of String(pageId))h=(h*31+ch.charCodeAt(0))>>>0;return QUOTE_PAGES.length*5+(h%997);
}
let _perm=null,_permN=0;
function _permutation(n){ // fixed shuffle so the order isn't the list order
 if(_perm&&_permN===n)return _perm;
 const a=[...Array(n).keys()];let seed=20261113;
 for(let i=n-1;i>0;i--){seed=(seed*1103515245+12345)>>>0;const j=seed%(i+1);[a[i],a[j]]=[a[j],a[i]];}
 _perm=a;_permN=n;return a;
}
function nextQuote(pageId){
 const admin=(globalThis.ciQuoteLibrary||[]).filter(q=>q&&q.quote);
 if(!admin.length)return '';
 const hour=Math.floor(Date.now()/3600000);
 const a=admin[_permutation(admin.length)[(hour+_pageOffset(pageId))%admin.length]];
 return a.author?a.quote+' — '+a.author:a.quote;
}

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
   if(item.caption){card.style.setProperty('--ci-band',String((item.bandPx||88)/720));const cap=document.createElement('div');cap.className='ci-carousel-caption';cap.style.background=item.borderColor||'#0476a2';const fill=qtext=>{const i=qtext.lastIndexOf(' — '),qt=document.createElement('span'),au=document.createElement('span');qt.className='ci-q-text';au.className='ci-q-author';qt.textContent=i>0?qtext.slice(0,i):qtext;au.textContent=i>0?qtext.slice(i+3):'';cap.replaceChildren(qt);if(au.textContent)cap.append(au);};cap.classList.add('ci-carousel-quote');card.classList.add('ci-has-quote');const qtext=nextQuote(pageId);if(qtext)fill(qtext);else{let n=0;const w=setInterval(()=>{const t=nextQuote(pageId);if(t){fill(t);clearInterval(w);}else if(++n>40)clearInterval(w);},300);}card.appendChild(cap);}
  }else{
   const text=document.createElement('p');text.className='ci-carousel-text';text.textContent=item.text||'';card.appendChild(text);
  }
  const previous=shell.firstElementChild;
  const reveal=()=>{
   if(request!==shell.ciCarouselRequest||(!shell.isConnected && previous))return;
   if(previous && previous.dataset.carouselId===item.id)return;
   shell.appendChild(card);
   globalThis.parent?.postMessage({type:'ci-carousel-border-color',color:item.borderColor,duration:previous?5000:0},globalThis.location?.origin);
   if(previous){
    // Scott 11 Nov 2026: during the 5s cross-fade, pull the previous card OUT of flow so
    // its caption (with the old borderColor) does not stack below the new one as a sliver.
    previous.style.position='absolute';previous.style.inset='0';previous.style.pointerEvents='none';
    card.animate([{opacity:0},{opacity:1}],{duration:5000,easing:'ease-in-out'});
    setTimeout(()=>previous.remove(),5000);
   }
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
