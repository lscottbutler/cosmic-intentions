'use strict';
(()=>{
const minutes=[1,2,3,5,10,15,30,45,60];
const preview=document.querySelector('.preview');
const shell=document.createElement('section');shell.className='gratitude-controls-shell';shell.setAttribute('aria-label','New Gratitude controls');
const panel=document.createElement('div');panel.className='gratitude-controls-panel';shell.append(panel);
const modules=document.createElement('div');modules.className='gratitude-modules';
const heading=document.createElement('h2');heading.textContent='GRATITUDE MODULES';modules.append(heading);
const grid=document.createElement('div');grid.className='gratitude-module-grid';
for(let n=1;n<=5;n++){
 const button=document.createElement('button');button.type='button';button.className='gratitude-choice';button.disabled=n!==1;button.setAttribute('aria-label','Gratitude module '+n+(n===1?'':' — not connected'));button.setAttribute('aria-pressed',String(n===1));
 const circle=document.createElement('span');circle.className='gratitude-choice-circle';circle.textContent=n;button.append(circle);if(n===1)button.onclick=()=>window.PlayerEditor.replace(window.PlayerEditor.get());grid.append(button);
}
modules.append(grid);const note=document.createElement('p');note.className='gratitude-module-status';note.textContent='Module 1 · five slides';modules.append(note);panel.append(modules);
const play=document.getElementById('play');play.classList.add('gratitude-central-play');panel.append(play);
const timeGroup=document.createElement('div');timeGroup.className='gratitude-times';timeGroup.setAttribute('role','group');timeGroup.setAttribute('aria-label','Expressing Gratitude Times');
const timeHeading=document.createElement('h2');timeHeading.textContent='Expressing Gratitude Times';timeGroup.append(timeHeading);
const timeGrid=document.createElement('div');timeGrid.className='gratitude-time-grid';
const select=document.getElementById('quiet-duration');select.replaceChildren();
for(const n of minutes){
 const option=document.createElement('option');option.value=String(n);option.textContent=n+' minute'+(n===1?'':'s');select.append(option);
 const button=document.createElement('button');button.type='button';button.className='gratitude-choice';button.dataset.minutes=n;button.setAttribute('aria-label',n+' minute'+(n===1?'':'s'));button.setAttribute('aria-pressed',String(n===window.PlayerEditor.get().quietMinutes));
 const circle=document.createElement('span');circle.className='gratitude-choice-circle';circle.textContent=n;const caption=document.createElement('span');caption.className='gratitude-minute-label';caption.textContent=n===1?'MINUTE':'MINUTES';button.append(circle,caption);
 button.onclick=()=>{select.value=String(n);select.dispatchEvent(new Event('change'));timeGrid.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.minutes)===n)));};timeGrid.append(button);
}
select.value=String(window.PlayerEditor.get().quietMinutes);timeGroup.append(timeGrid);panel.append(timeGroup);document.querySelector('.preview-viewport').after(shell);
function syncPlay(){
 if(play.textContent==='Play preview')play.textContent='Play';
 const label=play.textContent;play.dataset.state=label==='Pause'?'playing':'ready';play.setAttribute('aria-label',label);
}
new MutationObserver(syncPlay).observe(play,{childList:true});syncPlay();
function reportHeight(){parent.postMessage({type:'ci-gratitude-v2-height',height:Math.ceil(document.querySelector('main').getBoundingClientRect().height)},location.origin);}
new ResizeObserver(reportHeight).observe(document.querySelector('main'));reportHeight();
})();
