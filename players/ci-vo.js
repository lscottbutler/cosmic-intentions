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
  'RC-OUT':'That’s your recitation. Pick one line to carry into your day. Then take one step that matches it.'
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
