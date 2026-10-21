// Temporary visualization guidance; final scripts remain pending.
(()=>{
 const durations=[1,2,3,5,10,15,30,45,60];
 function session(minutes,mode){
  if(mode==='unguided')return [{start:0,end:5,text:'OK, close your eyes and begin'}];
  const total=minutes*60;
  const cues=[{start:15,end:Math.min(35,total-10),text:'Bring to mind a goal you want to work toward. Picture one practical step you could take. Notice what you would see and do.'}];
  if(minutes>=3)cues.push({start:Math.round(total*.5),end:Math.round(total*.5)+18,text:'Imagine taking that next step. Include the setting, your actions, and how you would respond to a small obstacle.'});
  cues.push({start:total-9,end:total-2,text:'Choose one practical action to carry into your day.'});return cues;
 }
 const relaxationScript=seconds=>seconds===30
  ? 'Take a moment to get comfortable. Move if you need to. Let your hands find somewhere to rest. Let your body settle at its own pace.'
  : 'Take a moment to get comfortable. Move if you need to. Let your hands find somewhere to rest. There’s no need to match a particular breathing rhythm or reach a certain feeling. Let your body settle at its own pace. Your mind can take its time, too.';
 window.CISuperVizSessions={durations,session,relaxationScript};
})();
