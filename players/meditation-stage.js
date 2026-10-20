(()=>{
 let mounted=false,slider,dot,box,title,quietArt,stage;
 const ns='http://www.w3.org/2000/svg';
 function mount(){
  stage=document.querySelector('.session-card');if(!stage)return false;
  const svg=stage.querySelector('svg');stage.querySelector('rect').remove();
  box=document.createElementNS(ns,'path');box.classList.add('meditation-banner');box.setAttribute('fill','#fff');box.setAttribute('stroke','#05728b');box.setAttribute('stroke-width','35');svg.prepend(box);
  const outer=document.createElementNS(ns,'rect');for(const [k,v] of Object.entries({x:17.5,y:17.5,width:1634,height:904,fill:'none',stroke:'#05728b','stroke-width':35}))outer.setAttribute(k,v);svg.prepend(outer);
  title=document.createElementNS(ns,'text');title.classList.add('meditation-title');title.setAttribute('x','835');title.setAttribute('y','388');title.setAttribute('textLength','960');title.setAttribute('lengthAdjust','spacingAndGlyphs');title.textContent='MEDITATION';svg.append(title);
  quietArt=document.createElementNS(ns,'g');quietArt.classList.add('meditation-quiet-art');quietArt.innerHTML='<rect width="1669" height="939" fill="#05728b"/><defs><clipPath id="meditation-dim-window"><path d="M35 35 H1634 V790 Q835 724 35 790 Z"/></clipPath></defs><image href="/images/meditation/meditation-1.jpg" width="1669" height="939" preserveAspectRatio="xMidYMid slice" clip-path="url(#meditation-dim-window)"/><path d="M35 35 H1634 V790 Q835 724 35 790 Z" fill="#000" fill-opacity=".75"/><path d="M35 816 Q835 750 1634 816 V910 H35 Z" fill="#7ea573"/>';svg.prepend(quietArt);
  // Keep the green lower trough visible during guidance and paused states too.
  const lowerFill=document.createElementNS(ns,'path');lowerFill.classList.add('meditation-lower-fill');lowerFill.setAttribute('d','M35 816 Q835 750 1634 816 V910 H35 Z');lowerFill.setAttribute('fill','#7ea573');lowerFill.style.pointerEvents='none';svg.prepend(lowerFill);
  // Use the existing seek path, preserving the engine's existing click handler.
  slider=[...svg.children].find(e=>e.tagName==='path'&&!e.classList.contains('meditation-banner')&&!e.classList.contains('meditation-lower-fill'));
  slider.classList.add('meditation-seek');slider.setAttribute('d','M35 816 Q835 750 1634 816');slider.setAttribute('role','slider');slider.setAttribute('tabindex','0');slider.setAttribute('aria-label','Meditation playback position');slider.setAttribute('aria-valuemin','0');slider.setAttribute('aria-valuemax','100');slider.setAttribute('stroke-width','35');
  slider.setAttribute('stroke','#05728b');
  dot=svg.querySelector('circle');dot.setAttribute('fill','#fff59d');dot.setAttribute('stroke','none');dot.setAttribute('r','16.5');dot.style.pointerEvents='none';
  const seek=ratio=>window.postMessage({type:'ci-meditation-command',command:'seek',ratio},location.origin);
  function pointer(event){const r=svg.getBoundingClientRect(),ratio=((event.clientX-r.left)/r.width*1669-35)/1599;seek(ratio);}
  slider.addEventListener('pointerdown',event=>{slider.setPointerCapture(event.pointerId);pointer(event);});
  slider.addEventListener('pointermove',event=>{if(slider.hasPointerCapture(event.pointerId))pointer(event);});
  slider.addEventListener('pointerup',event=>{if(slider.hasPointerCapture(event.pointerId))slider.releasePointerCapture(event.pointerId);});
  slider.addEventListener('keydown',event=>{let v=Number(slider.getAttribute('aria-valuenow'))/100;const delta=event.key==='ArrowRight'?.01:event.key==='ArrowLeft'?-.01:0;if(event.key==='Home')v=0;else if(event.key==='End')v=1;else if(delta)v+=delta;else return;event.preventDefault();seek(v);});
  mounted=true;return true;
 }
 window.CIMeditationPresentation={render({state,remaining,totalMs,phase}){
  if(!mounted&&!mount())return;
  const relaxation=phase==='relaxation';document.body.classList.toggle('meditation-stage-relaxation',relaxation&&state!=='ready');title.textContent=relaxation&&state!=='ready'?'RELAXATION':'MEDITATION';
  const ready=state==='ready',text=stage.querySelector('p'),guidance=Boolean(text.textContent.trim());
  const quiet=state==='running'&&!guidance;
  document.body.classList.toggle('meditation-stage-ready',ready);document.body.classList.toggle('meditation-stage-quiet',quiet);
  box.setAttribute('d',ready?'M232 217 Q835 169 1437 217 L1437 475 Q835 525 232 475 Z':'M232 169 Q835 79 1437 169 L1437 732 Q835 818 232 732 Z');
  const foreign=text.closest('foreignObject');foreign.setAttribute('x','84');foreign.setAttribute('y','65');foreign.setAttribute('width','1500');foreign.setAttribute('height','635');
  slider.hidden=false;slider.style.visibility='visible';slider.style.pointerEvents=ready?'none':'stroke';slider.setAttribute('tabindex',ready?'-1':'0');slider.setAttribute('aria-disabled',String(ready));dot.style.visibility=ready?'hidden':'visible';
  const progress=Math.max(0,Math.min(1,1-remaining/totalMs));const dotX=55+1559*progress,dotRatio=(dotX-35)/1599;dot.setAttribute('cx',dotX);dot.setAttribute('cy',816-132*dotRatio*(1-dotRatio));
  // Tenfold headline size; fit complete passages instead of clipping their words.
  const target=text.textContent.length>440?300:360;
  let size=target;text.style.fontSize=size+'px';
  while(size>36&&(text.scrollHeight>text.clientHeight+1||text.scrollWidth>text.clientWidth+1)){size-=4;text.style.fontSize=size+'px';}
  slider.setAttribute('aria-valuenow',String(Math.round((1-remaining/totalMs)*100)));slider.setAttribute('aria-valuetext',Math.ceil(remaining/1000)+' seconds remaining');
 }};
})();
