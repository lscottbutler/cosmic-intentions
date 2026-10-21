(()=>{
 let mounted=false,slider,dot,box,title,quietArt,stage,description,descriptionBox,summaryText='',transport,relaxationEnd,clock,clockIcon;
 const ns='http://www.w3.org/2000/svg';
 function updateSummary(){
  if(!description)return;
  description.textContent=summaryText;
  let size=46;description.setAttribute('font-size',size);
  while(size>28&&description.getComputedTextLength()>1160){size-=2;description.setAttribute('font-size',size);}
  const width=description.getComputedTextLength()+48;descriptionBox.setAttribute('x',835-width/2);descriptionBox.setAttribute('width',width);
 }
 addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='ci-meditation-summary'||typeof event.data.text!=='string')return;summaryText=event.data.text.slice(0,180);updateSummary();});
 function mount(){
  stage=document.querySelector('.session-card');if(!stage)return false;
  const svg=stage.querySelector('svg');stage.querySelector('rect').remove();
  box=document.createElementNS(ns,'path');box.classList.add('meditation-banner');box.setAttribute('fill','#fff');box.setAttribute('stroke','#05728b');box.setAttribute('stroke-width','35');svg.prepend(box);
  const outer=document.createElementNS(ns,'polyline');for(const [k,v] of Object.entries({points:'17.5,939 17.5,17.5 1651.5,17.5 1651.5,939',fill:'none',stroke:'#05728b','stroke-width':35}))outer.setAttribute(k,v);svg.prepend(outer);
  title=document.createElementNS(ns,'text');title.classList.add('meditation-title');title.setAttribute('x','835');title.setAttribute('y','388');title.setAttribute('textLength','960');title.setAttribute('lengthAdjust','spacingAndGlyphs');title.textContent='SUPER VIZ';svg.append(title);
  const summary=document.createElementNS(ns,'g');summary.classList.add('meditation-title-summary');
  descriptionBox=document.createElementNS(ns,'rect');for(const [k,v] of Object.entries({x:250,y:402,width:1170,height:68,fill:'#000'}))descriptionBox.setAttribute(k,v);
  description=document.createElementNS(ns,'text');for(const [k,v] of Object.entries({x:835,y:451,fill:'#fff','font-family':'Arial,Helvetica,sans-serif','font-weight':400,'text-anchor':'middle'}))description.setAttribute(k,v);
  summary.append(descriptionBox,description);svg.append(summary);updateSummary();
  quietArt=document.createElementNS(ns,'g');quietArt.classList.add('meditation-quiet-art');quietArt.innerHTML='<rect width="1669" height="939" fill="#05728b"/><defs><clipPath id="meditation-dim-window"><path d="M35 35 H1634 V816 Q835 750 35 816 Z"/></clipPath></defs><image href="/images/meditation/meditation-1.jpg" width="1669" height="939" preserveAspectRatio="xMidYMid slice" clip-path="url(#meditation-dim-window)"/><path d="M35 35 H1634 V816 Q835 750 35 816 Z" fill="#000" fill-opacity=".75"/><path d="M35 816 Q835 750 1634 816 V939 H35 Z" fill="#7ea573"/>';svg.prepend(quietArt);
  // Keep the green lower trough visible during guidance and paused states too.
  const lowerFill=document.createElementNS(ns,'path');lowerFill.classList.add('meditation-lower-fill');lowerFill.setAttribute('d','M35 816 Q835 750 1634 816 V939 H35 Z');lowerFill.setAttribute('fill','#7ea573');lowerFill.style.pointerEvents='none';svg.prepend(lowerFill);
  slider=[...svg.children].find(e=>e.tagName==='path'&&!e.classList.contains('meditation-banner')&&!e.classList.contains('meditation-lower-fill'));
  slider.classList.add('meditation-seek');slider.setAttribute('d','M35 816 Q835 750 1634 816');slider.setAttribute('role','button');slider.setAttribute('tabindex','0');slider.setAttribute('stroke-width','35');slider.setAttribute('stroke','#05728b');
  dot=svg.querySelector('circle');dot.setAttribute('fill','#fff59d');dot.setAttribute('stroke','none');dot.setAttribute('r','16.5');dot.style.pointerEvents='none';
  clock=document.createElementNS(ns,'g');clock.classList.add('meditation-start-control');clock.style.outline='none';
  const face=document.createElementNS(ns,'path');for(const [k,v] of Object.entries({d:'M744 783 a90.5 90.5 0 1 0 181 0 a90.5 90.5 0 1 0 -181 0',fill:'#303030',stroke:'#05728b','stroke-width':25}))face.setAttribute(k,v);
  clockIcon=document.createElementNS(ns,'path');clockIcon.setAttribute('fill','#fff');clockIcon.setAttribute('transform','translate(834.5 783)');clock.append(face,clockIcon);svg.append(clock);
  relaxationEnd=document.createElementNS(ns,'line');relaxationEnd.classList.add('meditation-relaxation-end');for(const [k,v] of Object.entries({stroke:'#fff59d','stroke-width':12,'stroke-linecap':'round'}))relaxationEnd.setAttribute(k,v);relaxationEnd.style.pointerEvents='none';const boundaryTitle=document.createElementNS(ns,'title');boundaryTitle.textContent='Relaxation ends — visualization begins';relaxationEnd.append(boundaryTitle);svg.append(relaxationEnd);
  transport=document.createElementNS(ns,'g');transport.classList.add('meditation-progress-marker');transport.style.pointerEvents='none';svg.insertBefore(transport,clock);transport.append(dot);
  const toggle=()=>window.postMessage({type:'ci-meditation-command',command:'toggle'},location.origin);
  clock.addEventListener('focus',()=>face.setAttribute('stroke','#fff'));clock.addEventListener('blur',()=>face.setAttribute('stroke','#05728b'));
  const activate=()=>{if(clock.dataset.control==='home')parent.postMessage({type:'ci-meditation-home'},location.origin);else toggle();};
  clock.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();activate();});
  clock.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();activate();}});
  const seek=ratio=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio},location.origin);
  let drag=null;
  const pointerRatio=event=>{const r=svg.getBoundingClientRect();return ((event.clientX-r.left)/r.width*1669-88)/1493;};
  for(const control of [slider]){
   control.addEventListener('pointerdown',event=>{event.stopImmediatePropagation();control.setPointerCapture(event.pointerId);drag={x:event.clientX,y:event.clientY,moved:false};});
   control.addEventListener('pointermove',event=>{if(!drag||!control.hasPointerCapture(event.pointerId))return;event.stopImmediatePropagation();if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>5)drag.moved=true;if(drag.moved)seek(pointerRatio(event));});
   control.addEventListener('pointerup',event=>{event.stopImmediatePropagation();if(control.hasPointerCapture(event.pointerId))control.releasePointerCapture(event.pointerId);if(drag&&!drag.moved)toggle();drag=null;});
   control.addEventListener('pointercancel',()=>{drag=null});
   control.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();if(event.detail===0)toggle();},true);
   control.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();toggle();return;}let v=Number(slider.dataset.progress)||0;const delta=event.key==='ArrowRight'?.01:event.key==='ArrowLeft'?-.01:0;if(event.key==='Home')v=0;else if(event.key==='End')v=1;else if(delta)v+=delta;else return;event.preventDefault();seek(v);});
  }
  mounted=true;return true;
 }
 window.CIMeditationPresentation={render({state,remaining,totalMs,phase,openingPhase}){
  if(!mounted&&!mount())return;
  const fading=openingPhase==='title';document.body.classList.toggle('meditation-title-fading',fading);
  const relaxation=phase==='relaxation';document.body.classList.toggle('meditation-stage-relaxation',relaxation&&state!=='ready');title.textContent=relaxation&&state!=='ready'&&!fading?'RELAXATION':'SUPER VIZ';title.setAttribute('y',state==='ready'||relaxation||fading?'365':'388');
  const opening=['title','wait','dim','dot','open','closed'].includes(openingPhase);document.body.classList.toggle('meditation-stage-opening',opening);document.body.classList.toggle('meditation-stage-preface',['title','wait','dim','dot','open'].includes(openingPhase));
  const ready=state==='ready',text=stage.querySelector('p'),guidance=Boolean(text.textContent.trim());
  const quiet=state==='running'&&!guidance&&!opening;
  document.body.classList.toggle('meditation-stage-active',state==='running'&&!['title','wait'].includes(openingPhase));document.body.classList.toggle('meditation-stage-ready',ready);document.body.classList.toggle('meditation-stage-quiet',quiet);
  box.setAttribute('d',ready||relaxation||fading?'M170 217 Q835 169 1499 217 L1499 475 Q835 525 170 475 Z':'M232 169 Q835 79 1437 169 L1437 732 Q835 818 232 732 Z');
  const foreign=text.closest('foreignObject');foreign.setAttribute('x','84');foreign.setAttribute('y','65');foreign.setAttribute('width','1500');foreign.setAttribute('height','635');
  const complete=state==='complete',running=state==='running';
  clock.dataset.opening=openingPhase;clock.dataset.ready=String(ready);clock.dataset.control=complete?'home':running?'pause':'play';clock.setAttribute('role','button');clock.setAttribute('tabindex','0');clock.setAttribute('aria-label',complete?'Home — return to the Citadel':running?'Pause visualization':state==='paused'?'Resume visualization':'Start visualization');clock.style.pointerEvents='all';clock.style.cursor='pointer';
  const eye=state==='running'&&(openingPhase==='open'||openingPhase==='closed')?openingPhase:null;
  const icon=eye?'eyes-'+eye:complete?'home':running?'pause':'play';
  if(clockIcon.dataset.icon!==icon){clockIcon.dataset.icon=icon;clockIcon.classList.toggle('meditation-eye-closed',eye==='closed');}
  clock.dataset.icon=icon;clockIcon.setAttribute('stroke',eye?'#fff':'none');clockIcon.setAttribute('stroke-width',eye?'6':'0');clockIcon.setAttribute('fill',eye?'none':'#fff');clockIcon.setAttribute('stroke-linecap','round');
  if(eye)clockIcon.setAttribute('d',eye==='open'?'M-54 0 Q0 -52 54 0 Q0 52 -54 0 Z M-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0':'M-50 -10 Q0 35 50 -10 M-35 3 L-46 19 M-16 14 L-20 33 M16 14 L20 33 M35 3 L46 19');
  else clockIcon.setAttribute('d',complete?'M-43 -2 L0 -39 L43 -2 L34 8 L29 4 V40 H9 V13 H-9 V40 H-29 V4 L-34 8 Z':running?'M-30 -33 H-9 V33 H-30 Z M9 -33 H30 V33 H9 Z':'M-22 -42 L43 0 L-22 42 Z');
  slider.hidden=false;slider.style.visibility='visible';slider.style.pointerEvents='stroke';const showDot=!ready&&!['title','wait','dim'].includes(openingPhase);dot.style.visibility=showDot?'visible':'hidden';transport.style.opacity=showDot?'1':'0';
  const visualizationMs=(Number(new URLSearchParams(location.search).get('t'))||15)*60000;
  const relaxationMs=Math.max(0,totalMs-visualizationMs),boundary=relaxationMs/totalMs,boundaryX=88+1493*boundary,boundaryRatio=(boundaryX-35)/1599,boundaryRailY=816-132*boundaryRatio*(1-boundaryRatio),boundaryY=boundaryRailY;
  relaxationEnd.style.display=relaxationMs?'':'none';relaxationEnd.dataset.progress=boundary;for(const [k,v] of Object.entries({x1:boundaryX,x2:boundaryX,y1:boundaryY-28,y2:boundaryY+28}))relaxationEnd.setAttribute(k,v);
  slider.setAttribute('aria-label',(running?'Pause':'Play')+' visualization; drag to seek');
  const progress=Math.max(0,Math.min(1,1-remaining/totalMs));const dotX=88+1493*progress,dotRatio=(dotX-35)/1599,dotY=816-132*dotRatio*(1-dotRatio);dot.setAttribute('cx',dotX);dot.setAttribute('cy',dotY);slider.dataset.progress=progress;
  // Tenfold headline size; fit complete passages instead of clipping their words.
  const target=text.textContent.length>440?300:360;
  let size=target;text.style.fontSize=size+'px';
  while(size>36&&(text.scrollHeight>text.clientHeight+1||text.scrollWidth>text.clientWidth+1)){size-=4;text.style.fontSize=size+'px';}

 }};
})();
