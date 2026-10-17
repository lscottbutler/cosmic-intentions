'use strict';
(()=>{
// Same v46 renderer, recordings and sequence as the approved Gratitude V2 editor.
// Only member transport is exposed. No editor cloud calls or draft writes.
document.getElementById('play').textContent='Play';
const controls=document.createElement('div');controls.id='gratitude-member-menu';
const duration=document.getElementById('quiet-duration-label');duration.hidden=false;
controls.append(duration);
const menu=document.createElement('button');menu.id='gratitude-site-menu';menu.type='button';menu.textContent='☰';menu.setAttribute('aria-label','Open site menu');
menu.onclick=()=>parent.postMessage({type:'ci-site-menu-toggle'},location.origin);
controls.append(menu);document.querySelector('.preview').prepend(controls);
const play=document.getElementById('play');
new MutationObserver(()=>{if(play.textContent==='Play preview')play.textContent='Play';}).observe(play,{childList:true});
function reportHeight(){parent.postMessage({type:'ci-gratitude-v2-height',height:Math.ceil(document.querySelector('main').getBoundingClientRect().height)},location.origin);}
new ResizeObserver(reportHeight).observe(document.querySelector('main'));reportHeight();
})();
