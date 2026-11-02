'use strict';
globalThis.CIPlayerV2={upgrade(input){if(input?.moduleType==='gratitude-v2'&&input.shortIntroVersion!==1&&Array.isArray(input.cards)){input=structuredClone(input);const remove=new Set(['Gratitude introduction','Noticing what we have','Original video — benefits']);input.cards=input.cards.filter(c=>!remove.has(c.label));const first=input.cards[0];if(first?.label==='Introducing the images'){const opening=input.opening??{};const lead=(opening.hold??2)+(opening.fade??1)+(opening.expand??1);first.duration+=lead;first.audioOffset=(first.audioOffset??0)+lead;}input.shortIntroVersion=1;}if(input?.moduleType==='gratitude-v2'&&input.verticalOpeningVersion!==1){input=structuredClone(input);const o=input.opening??{},oldLead=(o.hold??2)+(o.fade??1)+(o.expand??1);input.opening={...o,text:o.text??'GRATITUDE',hold:2,fade:0,expand:1};const first=input.cards?.[0];if(first?.label==='Introducing the images'&&first.duration>oldLead){first.duration+=3-oldLead;first.audioOffset=Math.max(0,(first.audioOffset??oldLead)+3-oldLead);}input.verticalOpeningVersion=1;}if(input?.moduleType==='gratitude-v2'&&input.introVoiceVersion!==1&&input.cards?.[0]?.label==='Introducing the images'){input=structuredClone(input);const first=input.cards[0],o=input.opening;first.audio='/standalone/gratitude-v2/audio/gratitude-intro-rowan.mp3';first.audioText=first.spoken;first.audioDuration=4.205688;first.audioPlayDuration=4.205688;first.audioOffset=o.hold+o.fade+o.expand+1;first.duration=first.audioOffset+first.audioDuration+2;input.introVoiceVersion=1;}if(input?.moduleType==='gratitude-v2'&&input.introTextCueVersion!==1&&input.cards?.[0]?.label==='Introducing the images'){input=structuredClone(input);input.introTextFade=2;const first=input.cards[0],o=input.opening;first.audioOffset=o.hold+o.fade+Math.max(o.expand,input.introTextFade)+1;first.duration=Math.max(first.duration,first.audioOffset+(first.audioPlayDuration??first.audioDuration??4.205688)+2);input.introTextCueVersion=1;}if(input?.moduleType==='gratitude-v2'&&input.photoVoiceVersion!==1&&Array.isArray(input.cards)){input=structuredClone(input);const clips=[['chair',2.690563],['electricity',2.586063],['travel',2.768938],['book',2.429375],['friends',2.351]];clips.forEach(([name,duration],i)=>{const c=input.cards.find(c=>c.label==='Image '+(i+1));if(!c)return;c.audio='/standalone/gratitude-v2/audio/gratitude-'+name+'-rowan.mp3';c.audioText=c.spoken;c.audioDuration=duration;c.audioPlayDuration=duration;c.audioOffset=2;c.duration=Math.max(c.duration,2+duration+Math.max(1,c.fadeOut??0));});input.photoVoiceVersion=1;}if(input?.moduleType==='gratitude-v2'&&input.bannerGeometryVersion!==1){input=structuredClone(input);input.layout={narrowX:0,narrowY:0};input.bannerGeometryVersion=1;}if(input?.moduleType==='gratitude-v2'&&input.eyeFadeVersion!==1&&input.cards?.some(c=>c.label==='Close your eyes')){input=structuredClone(input);input.cards.find(c=>c.label==='Close your eyes').duration=9;input.eyeFadeVersion=1;}if(input?.moduleType==='gratitude-v2'&&input.postMessageVersion!==1&&input.cards?.some(c=>c.label==='Close your eyes')){input=structuredClone(input);const i=input.cards.findIndex(c=>c.label==='Close your eyes');input.cards.splice(i,0,{label:'Post-slideshow message',text:'hello',spoken:'hello',same:true,image:'',audio:'',audioText:'',kind:'content',mode:'fixed',duration:6,silence:0,fadeIn:2,fadeOut:2,audioOffset:0});input.postMessageVersion=1;}if(input?.moduleType!=='gratitude-v2'||input.eyeSequenceVersion===1||!Array.isArray(input.cards))return input;const m=structuredClone(input);m.cards=m.cards.filter(c=>c.label!=='Reflection instruction'&&c.label!=='Close your eyes');const quiet=m.cards.findIndex(c=>c.label==='Quiet countdown');if(quiet<0)return input;m.cards.splice(quiet,0,{label:'Close your eyes',text:'',spoken:'',same:true,image:'',audio:'',audioText:'',kind:'silence',mode:'fixed',duration:9,silence:0,fadeIn:0,fadeOut:0,audioOffset:0});m.cards.at(-1).duration=6;m.eyeSequenceVersion=1;m.eyeFadeVersion=1;return this.upgrade(m);},introWhite(time,boundary,hold=.25){if(!Number.isFinite(boundary)||time<boundary-2||time>=boundary+hold+1)return 0;const ease=x=>x*x*(3-2*x);if(time<boundary)return ease(Math.max(0,Math.min(1,(time-boundary+2)/2)));return time<boundary+hold?1:ease(Math.max(0,1-(time-boundary-hold)));},phase(time,start,countdownStart,end,finished=false){if(finished||time>=end+1)return {stage:'bell',open:0,closed:0};if(time>=end){const t=Math.max(0,Math.min(1,time-end));return {stage:'bell-fade',open:0,closed:0,bell:t*t*(3-2*t)};}if(time>=countdownStart)return {stage:'countdown',open:0,closed:0};const t=time-start,ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};return {stage:'eyes',circle:ease(t),open:t<4?ease((t-2)/2):1-ease((t-4)/2),closed:ease((t-6)/2)};},icons:'<svg id="ci-v2-open-eye" x="786" y="733" width="98" height="98" viewBox="0 0 2967 1869" preserveAspectRatio="xMidYMid meet"><image href="/standalone/gratitude-v2/icons/eye-open.png" width="2967" height="1869"/></svg><svg id="ci-v2-closed-eye" x="786" y="733" width="98" height="98" viewBox="560 1075 380 160" preserveAspectRatio="xMidYMid meet"><image href="/standalone/gratitude-v2/icons/eye-closed.png" width="1500" height="1600"/></svg><svg id="ci-v2-bell" x="792.3" y="735.1" width="85.4" height="93.8" viewBox="0 0 470 517" preserveAspectRatio="xMidYMid meet"><image href="/standalone/gratitude-v2/icons/bell-clean.png" width="470" height="517"/></svg>'};

// CI Council scripts, 2 Nov 2026 (CI-VO-Scripts-Approved, section 2). Runs after every earlier upgrade.
// Until the Rachel recordings exist, each new card shows its full spoken line so members can read it.
// The photo cards keep their existing recordings (same words). The old intro recording is dropped
// because its wording ("others in the Cosmic Community") is retired.
(()=>{
 const base=globalThis.CIPlayerV2.upgrade;
 const card=(label,text,duration,kind='content')=>({label,text,spoken:text,same:true,image:'',audio:'',audioText:'',mode:'fixed',duration,silence:0,fadeIn:text?1:0,fadeOut:text?1:0,kind,audioOffset:0});
 globalThis.CIPlayerV2.upgrade=function(input){
  const m0=base.call(this,input);
  if(m0?.moduleType!=='gratitude-v2'||!Array.isArray(m0.cards))return m0;
  if(m0.councilScriptVersion===20261102)return rachel(structuredClone(m0));
  const m=structuredClone(m0);
  const intro=m.cards.find(c=>c.label==='Introducing the images');
  if(intro){
   const lead=intro.audioOffset||0;
   Object.assign(intro,{text:'Welcome to Gratitude. For the next few minutes, notice what’s already good in your life.',audio:'',audioText:'',audioDuration:0,audioPlayDuration:0,duration:lead+9});
   intro.spoken=intro.text;
   const at=m.cards.indexOf(intro)+1;
   m.cards.splice(at,0,
    card('GRA-02 Practice','Gratitude is a practice. A few minutes of noticing is enough to begin.',8),
    card('GRA-03 Simple things','Here are a few simple things to be grateful for.',6));
  }
  const post=m.cards.find(c=>c.label==='Post-slideshow message');
  if(post)Object.assign(post,{label:'GRA-09 Your turn',text:'Now close your eyes if that feels right. Think of a few things in your own life you’re grateful for. When you hear the bell, open your eyes.',spoken:'Now close your eyes if that feels right. Think of a few things in your own life you’re grateful for. When you hear the bell, open your eyes.',duration:12,fadeIn:1,fadeOut:1});
  if(!m.cards.some(c=>c.label==='GRA-10 Carry one'))m.cards.push(card('GRA-10 Carry one','Pick one of them to carry with you today. If it involves someone, you might tell them.',9));
  m.councilScriptVersion=20261102;
  return rachel(m);
 };
 // Rachel recordings (players/ci-vo.js): every card whose words match an approved line plays that file.
 function rachel(m){
  if(!globalThis.CIVO)return m;
  for(const c of m.cards){
   const words=(c.spoken||c.text||'').trim();if(!words)continue;
   const id=CIVO.idFor(words)||CIVO.idFor(words.charAt(0)+words.slice(1).toLowerCase()+'.');
   if(!id)continue;
   Object.assign(c,{audio:CIVO.url(id),audioText:c.spoken,audioDuration:Math.max(1,c.duration-(c.audioOffset||0))});
   delete c.audioPlayDuration;
  }
  return m;
 }
})();
