'use strict';
// Existing Working Master wording and proposed cue windows; new VO is pending.
window.CIModulePresets={gratitudeStyle(){
 const card=(label,text,duration,kind='content',image='')=>({label,text,spoken:text,same:true,image,audio:'',audioText:'',mode:'fixed',duration,silence:0,fadeIn:text?1:0,fadeOut:text?1:0,kind,audioOffset:0});
 const captions=['I AM GRATEFUL FOR A COMFY CHAIR','I AM GRATEFUL FOR ELECTRICITY','I AM GRATEFUL FOR EXOTIC TRAVEL','I AM GRATEFUL FOR A GOOD BOOK','I AM GRATEFUL FOR MY FRIENDS'];
 const files=['chair','electricity','travel','book','friends'];
 return {version:1,moduleType:'gratitude',presentation:'gratitude-mini',quietMinutes:1,instructionLayout:3,title:'Gratitude — Five images + quiet reflection',bellAudio:'/players/audio/coming-back-to-yourself-10m.ogg',opening:{text:'GRATITUDE',hold:2,fade:1,expand:1},cards:[
  {...card('Gratitude introduction','Spending as little as five minutes per day expressing our gratitude has shown to have a positive impact on our emotional health.',14),audioOffset:4},
  card('Noticing what we have','It turns out that noticing the things we already have in our lives makes us feel more positive and optimistic about the future. Being grateful',12),
  card('Original video — benefits','not only increases our psychogical well being, it improves our self-esteem, reduces depression and may even lower our blood pressure.',12),
  card('Introducing the images','Here are a few things that some in the Cosmic Community are grateful for.',10),
  ...files.map((file,i)=>card('Image '+(i+1),captions[i],8,'content','/standalone/gratitude-v2/photos/'+file+'.jpg')),
  card('Reflection instruction',"Now take a minute and reflect on some of the things in your life that your grateful for. As always, when you hear the Bell open your eyes and proceed.",14),
  card('Quiet countdown','',60,'silence'),card('Closing bell','',5,'silence')
 ]};
},slightlyGuidedImages(){
 const files=['a-great-burger.avif','a-walk-in-nature.avif','comfort-food.avif','exotic-beach-vacation.avif','for-my-life-partner.avif'];
 const texts=['Let breathing happen naturally.','Notice the sensations of breathing.','Gently return when you realize your attention has wandered.','If your attention has wandered, gently return to your breath.','Begin again with the feeling of breathing.'];
 const card=(label,text,duration,kind)=>({label,text,spoken:text,same:true,image:'',audio:'',audioText:'',mode:'fixed',duration,silence:0,fadeIn:text?1:0,fadeOut:text?1:0,kind,audioOffset:0});
 return {version:1,moduleType:'lightly-guided',presentation:'gratitude-mini',quietMinutes:1,instructionLayout:2,title:'Slightly Guided — Image sequence + quiet practice',bellAudio:'/players/audio/coming-back-to-yourself-10m.ogg',opening:{text:'SLIGHTLY GUIDED',hold:2,fade:1,expand:1},cards:[{...card('Opening guidance','Let breathing happen naturally.',12,'content'),audioOffset:4},card('Notice the breath','Notice the sensations of breathing.',6,'content'),card('Gently return','Gently return when you realize your attention has wandered.',8,'content'),...files.map((file,i)=>({...card('Image '+(i+1),texts[i],8,'content'),image:'/images/gratitude/test-module-1/'+file,audioOffset:0})),card('Quiet countdown','',60,'silence'),card('Closing bell','',5,'silence')]};
},lightlyGuided(){
 const card=(label,text,duration,kind='content',audioOffset=0)=>({label,text,spoken:text,same:true,image:'',audio:'',audioText:'',mode:'fixed',duration,silence:0,fadeIn:text?1:0,fadeOut:text?1:0,kind,audioOffset});
 return {version:1,moduleType:'lightly-guided',title:'Slightly Guided — 10 minutes',bellAudio:'/players/audio/coming-back-to-yourself-10m.ogg',opening:{text:'SLIGHTLY GUIDED',hold:3,fade:1,expand:1},cards:[
  card('Opening guidance','Let breathing happen naturally, notice its sensations, and gently return when you realize your attention has wandered.',30,'content',5),
  card('Quiet practice','',150,'silence'),
  card('Gentle return','If your attention has wandered, gently return to your breath.',15),
  card('Quiet practice','',225,'silence'),
  card('Begin again','Begin again with the feeling of breathing.',15),
  card('Quiet practice','',160,'silence'),
  card('Closing bell','',5,'silence'),
 ]};
}};
