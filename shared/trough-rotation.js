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
const pick=createTroughPicker(TROUGH_IDS,storage);
const selections=new Map();let lastPage=null;
export function visitTroughPage(pageId, eligible=true){
 if(lastPage===pageId)return;
 lastPage=pageId;
 if(eligible)selections.set(pageId,pick(pageId));
}
export function attachTrough(shell,pageId){
 if(!selections.has(pageId))selections.set(pageId,pick(pageId));
 const id=selections.get(pageId);
 let image=shell.querySelector('.ci-admin-trough-art');
 if(!image){image=document.createElement('img');image.className='ci-admin-trough-art';image.alt='';image.width=1280;image.height=720;image.decoding='async';shell.prepend(image);}
 if(image.dataset.trough===id)return;
 image.dataset.trough=id;
 image.srcset=`/images/troughs-web/${id}-640.webp 640w, /images/troughs-web/${id}-1280.webp 1280w`;
 image.sizes='(max-width: 700px) 100vw, 960px';
 image.src=`/images/troughs-web/${id}-1280.webp`;
}
