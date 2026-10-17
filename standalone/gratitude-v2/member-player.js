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
const play=document.getElementById('play');play.classList.add('gratitude-central-play');preview.append(play);
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
let sessionCircle=false,canLift=false;
function syncPlay(){
 if(play.textContent==='Play preview')play.textContent='Play';
 const label=play.textContent;play.dataset.state=label==='Pause'?'playing':'ready';play.setAttribute('aria-label',label);
 const active=label==='Pause';preview.classList.toggle('nav-playing',active&&canLift);
 modules.inert=active;timeGroup.inert=active;preview.classList.toggle('nav-session-circle',active&&sessionCircle);
}
window.addEventListener('gratitude-playback-phase',event=>{
 canLift=Boolean(event.detail.canLift);preview.classList.toggle('nav-playing',play.dataset.state==='playing'&&canLift);
 sessionCircle=event.detail.sessionCircle;preview.classList.toggle('nav-session-circle',play.dataset.state==='playing'&&sessionCircle);
 const doc=document.getElementById('player').contentDocument,group=doc?.querySelector('#ci-mini-counter');
 if(group&&!group.querySelector('#ci-navigation-circle-hit')){
  const hit=doc.createElementNS('http://www.w3.org/2000/svg','circle');hit.id='ci-navigation-circle-hit';hit.setAttribute('cx','835');hit.setAttribute('cy','782');hit.setAttribute('r','92');hit.setAttribute('fill','transparent');hit.setAttribute('role','button');hit.setAttribute('tabindex','0');hit.setAttribute('aria-label','Pause and show gratitude controls');hit.style.cursor='pointer';hit.onclick=()=>play.click();hit.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();play.click();}};group.append(hit);
 }
});
new MutationObserver(syncPlay).observe(play,{childList:true});syncPlay();
function reportHeight(){parent.postMessage({type:'ci-gratitude-v2-height',height:Math.ceil(document.querySelector('main').getBoundingClientRect().height)},location.origin);}
new ResizeObserver(reportHeight).observe(document.querySelector('main'));reportHeight();
})();
