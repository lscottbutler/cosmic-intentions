// Editable draft scripts; cue times are seconds from session start.
(() => {
 const durations=[1,2,3,5,10,15,30,45,60];
 const reminders=['If your attention has wandered, gently return to your breath.','Begin again with the feeling of breathing.','Notice the support beneath you. Let your body rest.','Let thoughts come and go. Return to one natural breath.','There is nothing to get right. Begin again gently.','If you need to change position, move slowly and settle again.','Notice your hands or feet. Let attention rest there for a moment.'];
 const passages=[
 'Feel where your body meets the chair or floor. Notice the support beneath you. Let your hands rest. You don’t need to hold yourself rigidly. Find a position that feels comfortable enough for this moment.',
 'Bring your attention to breathing. Let it move at its own pace. Notice the movement of your chest or belly, or the air at your nose. If the breath feels uncomfortable to focus on, choose your hands or feet instead.',
 'Notice your forehead and jaw. If there’s tension, see whether there’s room to soften a little. There’s no need to force relaxation. Let your shoulders settle, and feel your arms resting.',
 'Your attention may wander into planning or remembering. That’s part of practice. When you notice, gently return to a sensation here and now. Each return is a fresh beginning, without a score to keep.',
 'Notice what is present without needing to change it. There may be ease, restlessness or very little to notice. Let this moment be as it is. Return to the steady support beneath you.',
 'If self-judgment appears, see whether you can meet it with patience. You might quietly say: it’s okay to begin again. Let the next breath be an opportunity to return gently.',
 'Feel your hands. Notice warmth, coolness, pressure or movement. You don’t need to find a special sensation. Rest with what you can feel, then let your attention return to breathing.',
 'Allow sounds to be part of your practice. You don’t need perfect quiet. Notice a sound arriving and fading, then return to the contact of your body with the surface beneath you.',
 'Notice whether you are trying to make this session go a certain way. If so, soften that effort a little. Feel one breath, or one point of contact. That’s enough for this moment.',
 'Take a moment to check your comfort. If you need to adjust your position, do so gently. Notice the movement, then settle again. Caring for your body belongs in the practice.',
 'Let your awareness include your whole body. Feel the contact beneath you and the air against your skin. There’s no need to hold every sensation in mind. Let attention move gently, then choose a place to rest.',
 'A thought can be present without needing an immediate answer. Notice it, and return to a simple sensation. You can leave planning for later and spend this moment with your body.',
 'Rest with the beginning and ending of a natural breath. You don’t need to lengthen it. If you lose track, return wherever you are. There’s no need to restart the whole practice.',
 'Notice the space around you. Even with eyes closed, you may hear sounds nearby or farther away. Let the world be here as you rest with your chosen point of attention.',
 'If you feel restless, notice where you feel that in the body. You may stay with it gently, change position, or open your eyes. Choose what supports you, then return to the present.',
 'Let the next quiet stretch be simple. Feel a breath. Notice when attention wanders. Return with patience. You already know these steps; there’s nothing extra to achieve.',
 'Notice whether your jaw, shoulders or hands have tightened again. Invite a little ease where it feels possible. If nothing changes, that’s okay. Continue with a natural breath.',
 'Bring a little kindness to the way you speak to yourself. A busy mind does not mean you have failed. Noticing that you have wandered is already a moment of awareness.',
 'Feel your feet and the support beneath them. Let this concrete sensation bring you back. Stay for a few breaths, or move attention to your hands if that feels more comfortable.',
 'Allow attention to widen, then narrow gently to your chosen anchor. You can explore both without forcing concentration. Come back to what feels clear and manageable.',
 'As this practice moves toward its close, notice what would support you next. Perhaps patience, a pause, or one small action. You don’t need to make a plan now.',
 'For this final quiet stretch, let go of evaluating the session. Notice the support beneath you. Whatever these minutes have been like, you can meet this moment with care.'
 ];
 function session(minutes,mode){
  const total=minutes*60;
  if(mode==='unguided')return [{start:0,end:5,text:'Close your eyes if that feels right, and begin.'}];
  if(mode==='lightly-guided'){
   const count=({1:1,2:2,3:2,5:3,10:3,15:4,30:5,45:7,60:8})[minutes];
   const opening=minutes<=2?'Let your breath move naturally. Feel one breath, and return gently when your attention wanders.':'Let your breath move naturally. Notice how it feels. When your attention wanders, gently come back.';
   const cues=[{start:5,end:minutes<=2?19:22,text:opening}];
   for(let i=1;i<count;i++){
    const start=minutes===10?(i===1?180:420):Math.round(total*(0.25+0.55*(i-1)/Math.max(1,count-2)));
    const text=reminders[i-1];cues.push({start,end:start+Math.max(10,Math.ceil(text.split(/\s+/).length/1.7)+2),text});
   }
   return cues;
  }
  const count=({1:2,2:3,3:4,5:6,10:10,15:12,30:16,45:20,60:24})[minutes];
  const opening=minutes===1?'Settle comfortably. Let your breath move naturally. Rest your attention on breathing, or the feeling of your hands.':`For the next ${minutes} minutes, give yourself permission to be here. Find a comfortable, supported position. Close your eyes if that feels comfortable, or rest your gaze softly. Let breathing happen naturally. You can arrive exactly as you are.`;
  const closing=minutes<=3?'Notice the room around you. Feel your hands and feet. Move gently, and open your eyes when you’re ready. Bring your intention with you.':'Begin to notice the room more fully. Feel your hands and feet. When you’re ready, gently move your fingers or toes. If your eyes are closed, open them when you feel ready. Thank you for taking this time. As you return to your day, bring your intention with you.';
  const closingStart=total-(minutes<=3?22:40);
  const cues=[{start:5,end:minutes===1?22:38,text:opening}];
  for(let i=0;i<count-2;i++){
   const start=Math.round(45+(closingStart-80)*i/Math.max(1,count-3));
   const text=minutes<=3?passages[i].split('. ').slice(0,2).join('. ')+'.':passages[i];
   cues.push({start,end:start+Math.ceil(text.split(/\s+/).length/1.7)+3,text});
  }
  cues.push({start:closingStart,end:total-5,text:closing});return cues;
 }
 const relaxationScript=seconds=>seconds===30
  ? 'Take a moment to get comfortable. Move if you need to. Let your hands find somewhere to rest. Let your body settle at its own pace.'
  : 'Take a moment to get comfortable. Move if you need to. Let your hands find somewhere to rest. There’s no need to match a particular breathing rhythm or reach a certain feeling. Let your body settle at its own pace. Your mind can take its time, too.';
 window.CIMeditationSessions={durations,session,relaxationScript};
})();
