(()=>{
 let mounted=false,slider,dot,box,title,quietArt,stage,description,descriptionBox,summaryText='';
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
  // Use the existing seek path, preserving the engine's existing click handler.
  slider=[...svg.children].find(e=>e.tagName==='path'&&!e.classList.contains('meditation-banner')&&!e.classList.contains('meditation-lower-fill'));
  slider.classList.add('meditation-seek');slider.setAttribute('d','M35 816 Q835 750 1634 816');slider.setAttribute('role','slider');slider.setAttribute('tabindex','0');slider.setAttribute('aria-label','Meditation playback position');slider.setAttribute('aria-valuemin','0');slider.setAttribute('aria-valuemax','100');slider.setAttribute('stroke-width','105');
  slider.setAttribute('stroke','#05728b');
  dot=svg.querySelector('circle');dot.setAttribute('fill','#fff59d');dot.setAttribute('stroke','none');dot.setAttribute('r','49.5');dot.style.pointerEvents='none';
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
  const relaxation=phase==='relaxation';document.body.classList.toggle('meditation-stage-relaxation',relaxation&&state!=='ready');title.textContent=relaxation&&state!=='ready'?'RELAXATION':'MEDITATION';title.setAttribute('y',state==='ready'?'365':'388');
  const ready=state==='ready',text=stage.querySelector('p'),guidance=Boolean(text.textContent.trim());
  const quiet=state==='running'&&!guidance;
  document.body.classList.toggle('meditation-stage-ready',ready);document.body.classList.toggle('meditation-stage-quiet',quiet);
  box.setAttribute('d',ready?'M170 217 Q835 169 1499 217 L1499 475 Q835 525 170 475 Z':'M232 169 Q835 79 1437 169 L1437 732 Q835 818 232 732 Z');
  const foreign=text.closest('foreignObject');foreign.setAttribute('x','84');foreign.setAttribute('y','65');foreign.setAttribute('width','1500');foreign.setAttribute('height','635');
  slider.hidden=false;slider.style.visibility='visible';slider.style.pointerEvents=ready?'none':'stroke';slider.setAttribute('tabindex',ready?'-1':'0');slider.setAttribute('aria-disabled',String(ready));dot.style.visibility=ready?'hidden':'visible';
  const progress=Math.max(0,Math.min(1,1-remaining/totalMs));const dotX=88+1493*progress,dotRatio=(dotX-35)/1599;dot.setAttribute('cx',dotX);dot.setAttribute('cy',816-132*dotRatio*(1-dotRatio));
  // Tenfold headline size; fit complete passages instead of clipping their words.
  const target=text.textContent.length>440?300:360;
  let size=target;text.style.fontSize=size+'px';
  while(size>36&&(text.scrollHeight>text.clientHeight+1||text.scrollWidth>text.clientWidth+1)){size-=4;text.style.fontSize=size+'px';}
  slider.setAttribute('aria-valuenow',String(Math.round((1-remaining/totalMs)*100)));slider.setAttribute('aria-valuetext',Math.ceil(remaining/1000)+' seconds remaining');
 }};
})();
