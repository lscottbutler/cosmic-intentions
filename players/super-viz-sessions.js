// Visualize scripts — CI Council approved 2 Nov 2026 (CI-VO-Scripts-Approved, section 1).
// Cue times are seconds from session start. Spoken text is shown and read; quiet fills the gaps.
(()=>{
 const durations=[1,2,3,5,10,15,30,45,60];
 const L={
  '01':['This is your time to rehearse. For the next few minutes, you’ll see yourself thinking and acting as the person you intend to be.',11],
  '02':['Find a comfortable position. Close your eyes if that feels right, or rest your gaze softly.',9],
  '03':['Take a slow breath in… and let it go. Once more… and let it go. Now let your breath find its own pace.',14],
  '04':['Bring your intention to mind, in your own words. Say it quietly to yourself.',8,5],
  '05':['Picture an ordinary moment in the day ahead. You’re there as the person you intend to be. Where are you? What are you doing? Notice how you stand. How you speak. The choice you make next. Watch yourself follow through.',25,20],
  '05a':['Now picture the start of your day. You wake up as the person you intend to be. What’s the first thing you do? Notice how you move. Notice what you choose.',18,20],
  '05b':['Now picture the middle of your day, wherever your effort goes. Something needs your attention. See how this person handles it. Watch yourself follow through.',18,20],
  '05c':['Now picture the end of the day. Look back on what you did. Find one moment where you acted as the person you intend to be. Stay with it.',18,20],
  '06':['Now something gets in the way. A delay. A doubt. A distraction. See yourself notice it, stay calm, and take the next step anyway.',13,15],
  '07':['Let the picture fade. Choose one small action you’ll take today as this person. Say it to yourself once. When you’re ready, open your eyes. Then go and do it.',18]
 };
 function plan(minutes){
  // 1 min cannot hold the full short set (≈74 s of speech), so it keeps intention, picture and action.
  if(minutes===1)return['04','05','07'];
  if(minutes<=3)return['01','03','04','05','07'];
  if(minutes<=15)return['01','02','03','04','05','06','07'];
  return['01','02','03','04','05','05a','05b','05c','06','07'];
 }
 function session(minutes,mode){
  if(mode==='unguided')return [{start:0,end:5,text:'Close your eyes if that feels right, and begin.'}];
  const total=minutes*60,ids=plan(minutes),lead=3,tail=4;
  const speech=ids.reduce((s,id)=>s+L[id][1],0);
  const baseQuiet=ids.reduce((s,id)=>s+(L[id][2]||0),0);
  // Scale the quiet holds so the closing line ends just before the bell.
  const room=Math.max(0,total-lead-tail-speech);
  const k=baseQuiet?room/baseQuiet:0;
  let t=lead;const cues=[];
  for(const id of ids){
   const [text,dur,quiet=0]=L[id];
   cues.push({id:'VIS-'+id,start:Math.round(t),end:Math.round(t+dur),text});
   t+=dur+quiet*k;
  }
  // Short sessions with no quiet to scale: spread any spare time evenly between lines.
  if(!baseQuiet&&cues.length>1){const spare=Math.max(0,total-tail-cues[cues.length-1].end)/(cues.length-1);cues.forEach((c,i)=>{c.start+=Math.round(spare*i);c.end+=Math.round(spare*i);});}
  return cues;
 }
 const relaxationScript=seconds=>seconds===30
  ? 'Take a moment to get comfortable. Move if you need to. Let your hands find somewhere to rest. Let your body settle at its own pace.'
  : 'Take a moment to get comfortable. Move if you need to. Let your hands find somewhere to rest. There’s no need to match a particular breathing rhythm or reach a certain feeling. Let your body settle at its own pace. Your mind can take its time, too.';
 window.CISuperVizSessions={durations,session,relaxationScript};
})();
