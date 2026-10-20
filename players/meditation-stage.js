(()=>{
 let mounted=false,slider,dot,box,title,quietArt,stage,description,descriptionBox,summaryText='',transport,transportIcon,clockText;
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
  title=document.createElementNS(ns,'text');title.classList.add('meditation-title');title.setAttribute('x','835');title.setAttribute('y','388');title.setAttribute('textLength','960');title.setAttribute('lengthAdjust','spacingAndGlyphs');title.textContent='MEDITATION';svg.append(title);
  const summary=document.createElementNS(ns,'g');summary.classList.add('meditation-title-summary');
  descriptionBox=document.createElementNS(ns,'rect');for(const [k,v] of Object.entries({x:250,y:402,width:1170,height:68,fill:'#000'}))descriptionBox.setAttribute(k,v);
  description=document.createElementNS(ns,'text');for(const [k,v] of Object.entries({x:835,y:451,fill:'#fff','font-family':'Arial,Helvetica,sans-serif','font-weight':400,'text-anchor':'middle'}))description.setAttribute(k,v);
  summary.append(descriptionBox,description);svg.append(summary);updateSummary();
  quietArt=document.createElementNS(ns,'g');quietArt.classList.add('meditation-quiet-art');quietArt.innerHTML='<rect width="1669" height="939" fill="#05728b"/><defs><clipPath id="meditation-dim-window"><path d="M35 35 H1634 V790 Q835 724 35 790 Z"/></clipPath></defs><image href="/images/meditation/meditation-1.jpg" width="1669" height="939" preserveAspectRatio="xMidYMid slice" clip-path="url(#meditation-dim-window)"/><path d="M35 35 H1634 V790 Q835 724 35 790 Z" fill="#000" fill-opacity=".75"/><path d="M35 816 Q835 750 1634 816 V939 H35 Z" fill="#7ea573"/>';svg.prepend(quietArt);
  // Keep the green lower trough visible during guidance and paused states too.
  const lowerFill=document.createElementNS(ns,'path');lowerFill.classList.add('meditation-lower-fill');lowerFill.setAttribute('d','M35 816 Q835 750 1634 816 V939 H35 Z');lowerFill.setAttribute('fill','#7ea573');lowerFill.style.pointerEvents='none';svg.prepend(lowerFill);
  slider=[...svg.children].find(e=>e.tagName==='path'&&!e.classList.contains('meditation-banner')&&!e.classList.contains('meditation-lower-fill'));
  slider.classList.add('meditation-seek');slider.setAttribute('d','M35 816 Q835 750 1634 816');slider.setAttribute('role','button');slider.setAttribute('tabindex','0');slider.setAttribute('stroke-width','35');slider.setAttribute('stroke','#05728b');
  dot=svg.querySelector('circle');dot.setAttribute('fill','#fff59d');dot.setAttribute('stroke','none');dot.setAttribute('r','49.5');dot.style.pointerEvents='all';
  const clock=document.createElementNS(ns,'g');clock.setAttribute('aria-hidden','true');clock.style.pointerEvents='none';
  const face=document.createElementNS(ns,'path');for(const [k,v] of Object.entries({d:'M744 783 a90.5 90.5 0 1 0 181 0 a90.5 90.5 0 1 0 -181 0',fill:'#303030',stroke:'#05728b','stroke-width':25}))face.setAttribute(k,v);
  clockText=document.createElementNS(ns,'text');for(const [k,v] of Object.entries({x:834.5,y:783,fill:'#fff','font-family':'Arial,sans-serif','font-size':60,'text-anchor':'middle','dominant-baseline':'central'}))clockText.setAttribute(k,v);clockText.classList.add('meditation-center-countdown');clock.append(face,clockText);svg.append(clock);
  transport=document.createElementNS(ns,'g');transport.classList.add('meditation-dot-control');transport.setAttribute('role','button');transport.setAttribute('tabindex','0');svg.append(transport);transport.append(dot);
  transportIcon=document.createElementNS(ns,'path');transportIcon.setAttribute('fill','#303030');transportIcon.style.pointerEvents='none';transport.append(transportIcon);
  const toggle=()=>window.postMessage({type:'ci-meditation-command',command:'toggle'},location.origin);
  const seek=ratio=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio},location.origin);
  let drag=null;
  const pointerRatio=event=>{const r=svg.getBoundingClientRect();return ((event.clientX-r.left)/r.width*1669-88)/1493;};
  for(const control of [slider,transport]){
   control.addEventListener('pointerdown',event=>{event.stopImmediatePropagation();control.setPointerCapture(event.pointerId);drag={x:event.clientX,y:event.clientY,moved:false};});
   control.addEventListener('pointermove',event=>{if(!drag||!control.hasPointerCapture(event.pointerId))return;event.stopImmediatePropagation();if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>5)drag.moved=true;if(drag.moved)seek(pointerRatio(event));});
   control.addEventListener('pointerup',event=>{event.stopImmediatePropagation();if(control.hasPointerCapture(event.pointerId))control.releasePointerCapture(event.pointerId);if(drag&&!drag.moved)toggle();drag=null;});
   control.addEventListener('pointercancel',()=>{drag=null});
   control.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();if(event.detail===0)toggle();},true);
   control.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();toggle();return;}let v=Number(slider.dataset.progress)||0;const delta=event.key==='ArrowRight'?.01:event.key==='ArrowLeft'?-.01:0;if(event.key==='Home')v=0;else if(event.key==='End')v=1;else if(delta)v+=delta;else return;event.preventDefault();seek(v);});
  }
  mounted=true;return true;
 }
 window.CIMeditationPresentation={render({state,remaining,totalMs,phase}){
  if(!mounted&&!mount())return;
  const relaxation=phase==='relaxation';document.body.classList.toggle('meditation-stage-relaxation',relaxation&&state!=='ready');title.textContent=relaxation&&state!=='ready'?'RELAXATION':'MEDITATION';title.setAttribute('y',state==='ready'||relaxation?'365':'388');
  const ready=state==='ready',text=stage.querySelector('p'),guidance=Boolean(text.textContent.trim());
  const quiet=state==='running'&&!guidance;
  document.body.classList.toggle('meditation-stage-ready',ready);document.body.classList.toggle('meditation-stage-quiet',quiet);
  box.setAttribute('d',ready||relaxation?'M170 217 Q835 169 1499 217 L1499 475 Q835 525 170 475 Z':'M232 169 Q835 79 1437 169 L1437 732 Q835 818 232 732 Z');
  const foreign=text.closest('foreignObject');foreign.setAttribute('x','84');foreign.setAttribute('y','65');foreign.setAttribute('width','1500');foreign.setAttribute('height','635');
  slider.hidden=false;slider.style.visibility='visible';slider.style.pointerEvents='stroke';dot.style.visibility='visible';
  const meditationMs=(Number(new URLSearchParams(location.search).get('t'))||15)*60000;
  const seconds=Math.max(0,Math.ceil((relaxation?remaining-meditationMs:remaining)/1000));clockText.textContent=seconds<60?String(seconds):Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  const action=state==='running'?'Pause':state==='complete'?'Replay':state==='paused'?'Resume':'Play';
  slider.setAttribute('aria-label',action+' meditation; drag to seek');transport.setAttribute('aria-label',action+' meditation');transport.dataset.control=state==='running'?'pause':state==='complete'?'replay':'play';
  transportIcon.setAttribute('d',state==='running'?'M-20 -25 H-5 V25 H-20 Z M5 -25 H20 V25 H5 Z':state==='complete'?'M-15 -12 V-30 L-35 -10 L-15 8 V-5 A23 23 0 1 1 -20 16 L-30 22 A34 34 0 1 0 -15 -16 Z':'M-13 -27 L29 0 L-13 27 Z');
  const progress=Math.max(0,Math.min(1,1-remaining/totalMs));const dotX=88+1493*progress,dotRatio=(dotX-35)/1599,railY=816-132*dotRatio*(1-dotRatio),clockOffset=dotX-834.5,dotY=Math.abs(clockOffset)<165?Math.min(railY,783-Math.sqrt(165*165-clockOffset*clockOffset)):railY;dot.setAttribute('cx',dotX);dot.setAttribute('cy',dotY);transportIcon.setAttribute('transform','translate('+dotX+' '+dotY+')');slider.dataset.progress=progress;
  // Tenfold headline size; fit complete passages instead of clipping their words.
  const target=text.textContent.length>440?300:360;
  let size=target;text.style.fontSize=size+'px';
  while(size>36&&(text.scrollHeight>text.clientHeight+1||text.scrollWidth>text.clientWidth+1)){size-=4;text.style.fontSize=size+'px';}

 }};
})();
