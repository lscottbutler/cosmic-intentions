/* ci-vo.js — Rachel recordings for every fixed, Council-approved line (CI-VO-Scripts-Approved, 2 Nov 2026).
   Files live in the public Supabase bucket `vo-audio` at rachel/<ID>-<hash>.mp3. The hash is of the text, so
   editing a line here makes it "missing" until it is re-recorded in /standalone/vo-studio.html .
   Loaded as a plain script: sets window.CIVO and routes speechSynthesis.speak() for any recorded line to the
   Rachel file (browser voice stays as the fallback when a file is missing or can't play). */
(()=>{
 if (window.CIVO) return;
 const BASE = 'https://wbqzwbubbeorcknevips.supabase.co/storage/v1/object/public/vo-audio/rachel/';
 const LINES = {
  // Visualize
  'VIS-01':'This is your time to rehearse. For the next few minutes, you’ll see yourself thinking and acting as the person you intend to be.',
  'VIS-02':'Find a comfortable position. Close your eyes if that feels right, or rest your gaze softly.',
  'VIS-03':'Take a slow breath in… and let it go. Once more… and let it go. Now let your breath find its own pace.',
  'VIS-04':'Bring your intention to mind, in your own words. Say it quietly to yourself.',
  'VIS-05':'Picture an ordinary moment in the day ahead. You’re there as the person you intend to be. Where are you? What are you doing? Notice how you stand. How you speak. The choice you make next. Watch yourself follow through.',
  'VIS-05a':'Now picture the start of your day. You wake up as the person you intend to be. What’s the first thing you do? Notice how you move. Notice what you choose.',
  'VIS-05b':'Now picture the middle of your day, wherever your effort goes. Something needs your attention. See how this person handles it. Watch yourself follow through.',
  'VIS-05c':'Now picture the end of the day. Look back on what you did. Find one moment where you acted as the person you intend to be. Stay with it.',
  'VIS-06':'Now something gets in the way. A delay. A doubt. A distraction. See yourself notice it, stay calm, and take the next step anyway.',
  'VIS-07':'Let the picture fade. Choose one small action you’ll take today as this person. Say it to yourself once. When you’re ready, open your eyes. Then go and do it.',
  'CUE-BEGIN':'Close your eyes if that feels right, and begin.',
  'RLX-30':'Take a moment to get comfortable. Move if you need to. Let your hands find somewhere to rest. Let your body settle at its own pace.',
  'RLX-LONG':'Take a moment to get comfortable. Move if you need to. Let your hands find somewhere to rest. There’s no need to match a particular breathing rhythm or reach a certain feeling. Let your body settle at its own pace. Your mind can take its time, too.',
  // Gratitude
  'GRA-01':'Welcome to Gratitude. For the next few minutes, notice what’s already good in your life.',
  'GRA-02':'Gratitude is a practice. A few minutes of noticing is enough to begin.',
  'GRA-03':'Here are a few simple things to be grateful for.',
  'GRA-04':'I am grateful for a comfy chair.',
  'GRA-05':'I am grateful for electricity.',
  'GRA-06':'I am grateful for exotic travel.',
  'GRA-07':'I am grateful for a good book.',
  'GRA-08':'I am grateful for my friends.',
  'GRA-09':'Now close your eyes if that feels right. Think of a few things in your own life you’re grateful for. When you hear the bell, open your eyes.',
  'GRA-10':'Pick one of them to carry with you today. If it involves someone, you might tell them.',
  // 3-Minute Manifest (fixed lines; the ones with the member's name or goal are voiced live)
  'MAN-03':'In a moment, you’ll picture yourself living your intention. First, bring to mind a memory that makes you smile. A moment of real joy, or deep gratitude. Let it come back to you now.',
  'MAN-05':'Go back to your memory. See it. Hear it. Notice the warmth of it.',
  'MAN-06':'Let that good feeling grow a little. Stay with it for a few breaths.',
  'MAN-07':'Now close your eyes if that feels right. Keep that feeling close.',
  'MAN-08':'With that feeling still here, picture a day as the person you intend to be. Where are you? What are you doing? Who’s there with you? Notice how you think. Notice what you choose to do next.',
  // Mind Loop & Recite
  'ML-IN-DAY':'This is your Mind Loop. Your intentions, in your own words, will play from time to time. There’s no need to stop what you’re doing. Just let them land.',
  'ML-IN-SLEEP':'This is your evening Mind Loop. Get comfortable. Your intentions will play quietly, in your own words. There’s nothing to do but listen.',
  'ML-OUT-DAY':'That’s the end of today’s Mind Loop. Choose one thing you’ll do today as the person you intend to be.',
  'RC-IN':'Time to recite. As each line plays, say it out loud or quietly to yourself. Let each one land before the next.',
  'RC-OUT':'That’s your recitation. Pick one line to carry into your day. Then take one step that matches it.',
  // Meditation (players/meditation-sessions.js — every distinct cue across all lengths and modes)
  'MED-01':"Let your breath move naturally. Feel one breath, and return gently when your attention wanders.",
  'MED-02':"Settle comfortably. Let your breath move naturally. Rest your attention on breathing, or the feeling of your hands.",
  'MED-03':"Notice the room around you. Feel your hands and feet. Move gently, and open your eyes when you’re ready. Bring your intention with you.",
  'MED-04':"If your attention has wandered, gently return to your breath.",
  'MED-05':"For the next 2 minutes, give yourself permission to be here. Find a comfortable, supported position. Close your eyes if that feels comfortable, or rest your gaze softly. Let breathing happen naturally. You can arrive exactly as you are.",
  'MED-06':"Feel where your body meets the chair or floor. Notice the support beneath you.",
  'MED-07':"Let your breath move naturally. Notice how it feels. When your attention wanders, gently come back.",
  'MED-08':"For the next 3 minutes, give yourself permission to be here. Find a comfortable, supported position. Close your eyes if that feels comfortable, or rest your gaze softly. Let breathing happen naturally. You can arrive exactly as you are.",
  'MED-09':"Bring your attention to breathing. Let it move at its own pace.",
  'MED-10':"Begin again with the feeling of breathing.",
  'MED-11':"For the next 5 minutes, give yourself permission to be here. Find a comfortable, supported position. Close your eyes if that feels comfortable, or rest your gaze softly. Let breathing happen naturally. You can arrive exactly as you are.",
  'MED-12':"Feel where your body meets the chair or floor. Notice the support beneath you. Let your hands rest. You don’t need to hold yourself rigidly. Find a position that feels comfortable enough for this moment.",
  'MED-13':"Bring your attention to breathing. Let it move at its own pace. Notice the movement of your chest or belly, or the air at your nose. If the breath feels uncomfortable to focus on, choose your hands or feet instead.",
  'MED-14':"Notice your forehead and jaw. If there’s tension, see whether there’s room to soften a little. There’s no need to force relaxation. Let your shoulders settle, and feel your arms resting.",
  'MED-15':"Your attention may wander into planning or remembering. That’s part of practice. When you notice, gently return to a sensation here and now. Each return is a fresh beginning, without a score to keep.",
  'MED-16':"Begin to notice the room more fully. Feel your hands and feet. When you’re ready, gently move your fingers or toes. If your eyes are closed, open them when you feel ready. Thank you for taking this time. As you return to your day, bring your intention with you.",
  'MED-17':"For the next 10 minutes, give yourself permission to be here. Find a comfortable, supported position. Close your eyes if that feels comfortable, or rest your gaze softly. Let breathing happen naturally. You can arrive exactly as you are.",
  'MED-18':"Notice what is present without needing to change it. There may be ease, restlessness or very little to notice. Let this moment be as it is. Return to the steady support beneath you.",
  'MED-19':"If self-judgment appears, see whether you can meet it with patience. You might quietly say: it’s okay to begin again. Let the next breath be an opportunity to return gently.",
  'MED-20':"Feel your hands. Notice warmth, coolness, pressure or movement. You don’t need to find a special sensation. Rest with what you can feel, then let your attention return to breathing.",
  'MED-21':"Allow sounds to be part of your practice. You don’t need perfect quiet. Notice a sound arriving and fading, then return to the contact of your body with the surface beneath you.",
  'MED-22':"Notice the support beneath you. Let your body rest.",
  'MED-23':"For the next 15 minutes, give yourself permission to be here. Find a comfortable, supported position. Close your eyes if that feels comfortable, or rest your gaze softly. Let breathing happen naturally. You can arrive exactly as you are.",
  'MED-24':"Notice whether you are trying to make this session go a certain way. If so, soften that effort a little. Feel one breath, or one point of contact. That’s enough for this moment.",
  'MED-25':"Take a moment to check your comfort. If you need to adjust your position, do so gently. Notice the movement, then settle again. Caring for your body belongs in the practice.",
  'MED-26':"Let thoughts come and go. Return to one natural breath.",
  'MED-27':"For the next 30 minutes, give yourself permission to be here. Find a comfortable, supported position. Close your eyes if that feels comfortable, or rest your gaze softly. Let breathing happen naturally. You can arrive exactly as you are.",
  'MED-28':"Let your awareness include your whole body. Feel the contact beneath you and the air against your skin. There’s no need to hold every sensation in mind. Let attention move gently, then choose a place to rest.",
  'MED-29':"A thought can be present without needing an immediate answer. Notice it, and return to a simple sensation. You can leave planning for later and spend this moment with your body.",
  'MED-30':"Rest with the beginning and ending of a natural breath. You don’t need to lengthen it. If you lose track, return wherever you are. There’s no need to restart the whole practice.",
  'MED-31':"Notice the space around you. Even with eyes closed, you may hear sounds nearby or farther away. Let the world be here as you rest with your chosen point of attention.",
  'MED-32':"There is nothing to get right. Begin again gently.",
  'MED-33':"If you need to change position, move slowly and settle again.",
  'MED-34':"For the next 45 minutes, give yourself permission to be here. Find a comfortable, supported position. Close your eyes if that feels comfortable, or rest your gaze softly. Let breathing happen naturally. You can arrive exactly as you are.",
  'MED-35':"If you feel restless, notice where you feel that in the body. You may stay with it gently, change position, or open your eyes. Choose what supports you, then return to the present.",
  'MED-36':"Let the next quiet stretch be simple. Feel a breath. Notice when attention wanders. Return with patience. You already know these steps; there’s nothing extra to achieve.",
  'MED-37':"Notice whether your jaw, shoulders or hands have tightened again. Invite a little ease where it feels possible. If nothing changes, that’s okay. Continue with a natural breath.",
  'MED-38':"Bring a little kindness to the way you speak to yourself. A busy mind does not mean you have failed. Noticing that you have wandered is already a moment of awareness.",
  'MED-39':"Notice your hands or feet. Let attention rest there for a moment.",
  'MED-40':"For the next 60 minutes, give yourself permission to be here. Find a comfortable, supported position. Close your eyes if that feels comfortable, or rest your gaze softly. Let breathing happen naturally. You can arrive exactly as you are.",
  'MED-41':"Feel your feet and the support beneath them. Let this concrete sensation bring you back. Stay for a few breaths, or move attention to your hands if that feels more comfortable.",
  'MED-42':"Allow attention to widen, then narrow gently to your chosen anchor. You can explore both without forcing concentration. Come back to what feels clear and manageable.",
  'MED-43':"As this practice moves toward its close, notice what would support you next. Perhaps patience, a pause, or one small action. You don’t need to make a plan now.",
  'MED-44':"For this final quiet stretch, let go of evaluating the session. Notice the support beneath you. Whatever these minutes have been like, you can meet this moment with care."
 };
 const norm = s => String(s||'').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/\s+/g,' ').trim().toLowerCase();
 const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
 const byText = {};
 for (const [id, t] of Object.entries(LINES)) byText[norm(t)] = id;
 const idFor = text => byText[norm(text)] || null;
 const file = id => id + '-' + hash(norm(LINES[id])) + '.mp3';
 const url = idOrText => { const id = LINES[idOrText] ? idOrText : idFor(idOrText); return id ? BASE + file(id) : null; };

 /* Live Rachel for lines that include the member's own words (name, goal). Needs a signed-in session. */
 const pick = v => { try { v = typeof v === 'string' ? JSON.parse(v) : v; return v?.access_token || v?.currentSession?.access_token || null; } catch (e) { return null; } };
 function idbGet(key) {
  return new Promise(res => {
   try {
    const req = indexedDB.open('ci-auth-db', 1);
    req.onupgradeneeded = () => { try { req.result.createObjectStore('kv'); } catch (e) {} };
    req.onsuccess = () => { try { const g = req.result.transaction('kv', 'readonly').objectStore('kv').get(key); g.onsuccess = () => res(g.result); g.onerror = () => res(null); } catch (e) { res(null); } };
    req.onerror = () => res(null);
   } catch (e) { res(null); }
   setTimeout(() => res(null), 2500);
  });
 }
 /* The app keeps its session in IndexedDB (ci-auth-db/kv/ci-auth), with localStorage as the fallback. */
 async function token() {
  try { const t = pick(localStorage.getItem('ci-auth')); if (t) return t; } catch (e) {}
  return pick(await idbGet('ci-auth'));
 }
 async function live(text) {
  const t = await token(); if (!t) return null;
  try {
   const r = await fetch('/.netlify/functions/tts-elevenlabs', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + t }, body: JSON.stringify({ text }) });
   if (!r.ok) return null; const { audio } = await r.json(); return audio || null;   // base64 mp3
  } catch (e) { return null; }
 }

 /* Route speechSynthesis.speak() for recorded lines to the Rachel file. */
 const ss = window.speechSynthesis;
 let cur = null;   // { audio, utterance }
 if (ss) {
  const speak = ss.speak.bind(ss), cancel = ss.cancel.bind(ss), pause = ss.pause.bind(ss), resume = ss.resume.bind(ss);
  const desc = n => Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ss), n);
  const dSpeaking = desc('speaking'), dPaused = desc('paused');
  const stop = () => { if (cur) { const c = cur; cur = null; try { c.audio.pause(); c.audio.src = ''; } catch (e) {} } };
  ss.speak = u => {
   const src = url(u && u.text);
   if (!src) return speak(u);
   stop(); cancel();
   const a = new Audio(src), c = { audio: a, utterance: u, fellBack: false };
   a.volume = typeof u.volume === 'number' ? Math.max(0, Math.min(1, u.volume)) : 1;
   cur = c;
   a.onended = () => { if (cur === c) cur = null; try { u.onend && u.onend({ type:'end', utterance:u }); } catch (e) {} };
   const fallback = () => { if (cur !== c || c.fellBack) return; c.fellBack = true; cur = null; speak(u); };
   a.onerror = fallback;
   a.play().then(() => { try { u.onstart && u.onstart({ type:'start', utterance:u }); } catch (e) {} }).catch(fallback);
  };
  ss.cancel = () => { stop(); cancel(); };
  ss.pause = () => { if (cur) try { cur.audio.pause(); } catch (e) {} pause(); };
  ss.resume = () => { if (cur && cur.audio.paused) cur.audio.play().catch(() => {}); resume(); };
  try {
   Object.defineProperty(ss, 'speaking', { configurable:true, get: () => !!cur || dSpeaking.get.call(ss) });
   Object.defineProperty(ss, 'paused',   { configurable:true, get: () => (cur ? cur.audio.paused : dPaused.get.call(ss)) });
  } catch (e) {}
 }

 window.CIVO = { LINES, BASE, url, idFor, file, live, norm, token };
})();
