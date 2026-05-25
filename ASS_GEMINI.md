# AUDIO SLIDE SHOW PLAYER (ASS) — Gemini Context File
Formerly called "3-Min Manifest". Lives inside index.html as an inline modal — NOT a separate file.
Output only modified code. Do not return unchanged code. Do not rebuild the whole file.

---

## WHAT IT IS
A full-screen modal player that auto-advances through 15 slides with text-to-speech, breathing animations, and bell sounds. Triggered from an intention card. Calls Claude API to generate a custom I AM statement and gratitude line per session.

## HOW IT'S TRIGGERED
```js
launch3Min(idx)  // called from card play button and action buttons
```

---

## 1. CSS (index.html — inside <style> block)

```css
/* ── AUDIO SLIDE SHOW PLAYER (ASS) ───────────────────── */
.manifest-player {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.manifest-left {
  width: 46%;
  background: #0D0D0D;
  border-right: 1px solid #000000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  gap: 20px;
  flex-shrink: 0;
}
.manifest-left-star {
  font-size: 30px;
  color: var(--accent);
  line-height: 1;
}
.manifest-left-title {
  font-size: 13px;
  color: rgba(255,255,255,0.65);
  text-align: center;
  line-height: 1.5;
  font-weight: 600;
  word-break: break-word;
}
.manifest-left-counter {
  font-size: 11px;
  color: rgba(255,255,255,0.45);
  letter-spacing: 0.5px;
}
.manifest-right {
  flex: 1;
  background: #EBF5FC;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.manifest-slide-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 24px 16px;
  overflow-y: auto;
}
.manifest-slide {
  max-width: 340px;
  width: 100%;
  animation: mSlideIn 0.45s ease;
}
@keyframes mSlideIn {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.manifest-heading {
  font-size: 24px;
  font-weight: 800;
  color: #0A0A0A;
  letter-spacing: -0.4px;
  line-height: 1.25;
  margin-bottom: 14px;
}
.manifest-body {
  font-size: 15px;
  color: #5A5550;
  line-height: 1.7;
}
.manifest-heading.iam-style {
  font-family: 'Dancing Script', cursive;
  font-size: 30px;
  color: var(--accent);
  font-weight: 700;
}
.manifest-heading.gratitude-style {
  font-size: 20px;
  font-style: italic;
  color: var(--teal);
  font-weight: 600;
}
.manifest-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(61,127,212,0.12);
  border: 2px solid var(--accent);
  margin: 0 auto 16px;
}
.manifest-circle.breathe-in  { animation: bIn 4.5s ease-in-out infinite alternate; }
.manifest-circle.breathe-out { animation: bOut 4.5s ease-in-out infinite alternate; }
@keyframes bIn  { from{transform:scale(.65);opacity:.4} to{transform:scale(1.2);opacity:1} }
@keyframes bOut { from{transform:scale(1.2);opacity:1} to{transform:scale(.65);opacity:.4} }
.manifest-close-btn {
  margin-top: 20px;
  padding: 13px 28px;
  background: #000000;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
}
.manifest-close-btn:hover { opacity: 0.82; }
.manifest-progress-track {
  height: 4px;
  background: rgba(61,127,212,0.12);
  flex-shrink: 0;
}
.manifest-progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.5s ease;
  width: 0%;
}
@media (max-width: 500px) {
  .manifest-left {
    width: 52px;
    padding: 16px 6px;
    gap: 14px;
  }
  .manifest-left-title { display: none; }
  .manifest-left-star  { font-size: 22px; }
  .manifest-left-counter { writing-mode: vertical-rl; font-size: 10px; }
}
```

---

## 2. HTML (index.html — inside <body>)

```html
<!-- ── AUDIO SLIDE SHOW PLAYER (ASS) ───────────────────── -->
<div class="player-modal" id="manifestModal">
  <div class="manifest-player">
    <!-- Left: dark panel -->
    <div class="manifest-left">
      <div class="manifest-left-star">✦</div>
      <div class="manifest-left-title" id="manifestTitle">I AM</div>
      <div class="manifest-left-counter"><span id="manifestSlideNum">1</span>/15</div>
    </div>
    <!-- Right: light blue panel -->
    <div class="manifest-right">
      <div class="manifest-slide-wrap">
        <div class="manifest-slide" id="manifestSlide">
          <div class="manifest-heading" id="manifestHeading">Preparing…</div>
          <div class="manifest-body"   id="manifestBody"></div>
        </div>
      </div>
      <div class="manifest-progress-track">
        <div class="manifest-progress-fill" id="manifestProgress"></div>
      </div>
    </div>
  </div>
  <!-- Controls -->
  <div class="player-controls">
    <button class="player-ctrl-btn" onclick="manifestPrev()">‹ Back</button>
    <button class="player-ctrl-btn player-ctrl-close" onclick="closeManifest()">✕ End Session</button>
    <button class="player-ctrl-btn" onclick="manifestNext()">Next ›</button>
  </div>
</div>
```

---

## 3. JAVASCRIPT (index.html — inside <script> block)

```js
/* ── AUDIO SLIDE SHOW PLAYER (ASS) ─────────────────────────
   Slide data: 15 slides, d = milliseconds before auto-advance
   Types: intro / breathe / text / iam / gratitude / affirm / close
─────────────────────────────────────────────────────────── */
const MANIFEST_SLIDES = [
  { type:'intro',     h:null,                          b:null,                                                            d:5000 },
  { type:'breathe',   h:'Breathe In.',                 b:null,                                                            d:5000 },
  { type:'breathe',   h:'Breathe Out.',                b:null,                                                            d:5000 },
  { type:'text',      h:'You are here.',               b:'This moment belongs entirely to you.',                          d:9000 },
  { type:'text',      h:'You are becoming.',           b:'Not who you were. The person you have decided to be.',          d:10000},
  { type:'iam',       h:null,                          b:null,                                                            d:14000},
  { type:'text',      h:'See it.',                     b:'Close your eyes. Picture yourself already there.',             d:12000},
  { type:'text',      h:'Feel it.',                    b:'The freedom. The certainty. The quiet pride.',                  d:10000},
  { type:'text',      h:'You are grateful.',           b:'For who you are. For what is coming.',                         d:9000 },
  { type:'gratitude', h:null,                          b:null,                                                            d:12000},
  { type:'text',      h:'You show up.',                b:'Every day. Without exception. Not because you have to — because you choose to.', d:11000},
  { type:'affirm',    h:null,                          b:null,                                                            d:10000},
  { type:'text',      h:'Breathe it in.',              b:'This is your identity now. Own it completely.',                 d:9000 },
  { type:'text',      h:'It is already done.',         b:'What you seek is already seeking you.',                         d:9000 },
  { type:'close',     h:'Now go live it.',             b:null,                                                            d:0    },
];

const mSt = { idx:null, slide:0, timer:null, aiIam:'', aiGratitude:'', affirm:'', running:false };

async function launch3Min(idx) {
  if (!intentions.length) { toast('Add an intention first.', 'error'); return; }
  mSt.idx     = idx;
  mSt.slide   = 0;
  mSt.running = true;
  mSt.aiIam   = '';
  mSt.aiGratitude = '';
  const intn   = intentions[idx] || intentions[0];
  const pills  = intn?.mindset?.affirmations || [];
  mSt.affirm   = pills[0] || 'I AM unstoppable and fully committed.';
  document.getElementById('manifestTitle').textContent =
    (intn?.title || 'My Intention').replace(/^(i am)\s+/i, 'I AM ');
  const title = (intn?.title || 'My Intention').replace(/^(i am)\s+/i, 'I AM ');
  document.getElementById('manifestModal').classList.add('open');
  playBell();
  setTimeout(() => speakText(title), 1200);
  fetchManifestAI(idx);
  showManifestSlide(0);
}

async function fetchManifestAI(idx) {
  const intn    = intentions[idx] || intentions[0];
  const title   = intn?.title || 'my intention';
  const pb      = getPB();
  const context = buildContext(pb);
  if (DEV_MODE) {
    await new Promise(r => setTimeout(r, 900));
    mSt.aiIam       = 'I AM exactly where I need to be, and exactly who I was meant to become.';
    mSt.aiGratitude = 'I am grateful for the courage it took to start, and the discipline it takes to continue.';
    return;
  }
  try {
    const system = `You are a personal development AI. User profile:\n${context}\n\nRespond ONLY with valid JSON — no other text:\n{"iam":"...","gratitude":"..."}`;
    const user   = `For the intention "${title}", write:\n1. One powerful personal I AM statement (max 20 words)\n2. One genuine gratitude phrase starting with "I am grateful" (max 20 words)`;
    const raw    = await callClaude(system, user, 300);
    const r      = JSON.parse(raw.replace(/```json|```/g,'').trim());
    mSt.aiIam       = r.iam       || title;
    mSt.aiGratitude = r.gratitude || 'I am grateful for this moment and this journey.';
  } catch {
    mSt.aiIam       = title;
    mSt.aiGratitude = 'I am grateful for this moment and this journey.';
  }
}

function showManifestSlide(n) {
  if (!mSt.running) return;
  if (n >= MANIFEST_SLIDES.length) { closeManifest(); return; }
  clearTimeout(mSt.timer);
  mSt.slide = n;
  const s   = MANIFEST_SLIDES[n];
  const pct = ((n + 1) / MANIFEST_SLIDES.length * 100).toFixed(1);
  document.getElementById('manifestProgress').style.width  = pct + '%';
  document.getElementById('manifestSlideNum').textContent  = n + 1;
  let h = s.h, b = s.b, type = s.type;
  const intn = intentions[mSt.idx] || intentions[0];
  if (type === 'intro')     { h = intn?.title || 'My Intention'; b = 'Audio Slide Show Session'; type = 'intro'; }
  if (type === 'iam')       { h = mSt.aiIam       || 'I AM…'; b = ''; }
  if (type === 'gratitude') { h = mSt.aiGratitude || 'I am grateful…'; b = ''; }
  if (type === 'affirm')    { h = mSt.affirm;      b = ''; }
  const slideEl   = document.getElementById('manifestSlide');
  const headingEl = document.getElementById('manifestHeading');
  const bodyEl    = document.getElementById('manifestBody');
  slideEl.style.animation = 'none';
  slideEl.offsetHeight;
  slideEl.style.animation = '';
  headingEl.className = 'manifest-heading';
  if (type === 'iam')       headingEl.className = 'manifest-heading iam-style';
  if (type === 'gratitude') headingEl.className = 'manifest-heading gratitude-style';
  headingEl.textContent = h || '';
  if (type === 'breathe' && n === 1) {
    bodyEl.innerHTML = '<div class="manifest-circle breathe-in"></div>';
  } else if (type === 'breathe' && n === 2) {
    bodyEl.innerHTML = '<div class="manifest-circle breathe-out"></div>';
  } else if (type === 'close') {
    bodyEl.innerHTML = '<button class="manifest-close-btn" onclick="closeManifest()">Complete Session ✦</button>';
  } else {
    bodyEl.textContent = b || '';
  }
  if (type !== 'close' && type !== 'intro') {
    speakText((h||'') + (b ? '. ' + b : ''));
  }
  if ([5, 9, 14].includes(n)) playBell();
  if (s.d > 0) mSt.timer = setTimeout(() => showManifestSlide(n + 1), s.d);
}

function manifestNext() {
  clearTimeout(mSt.timer); stopSpeech();
  showManifestSlide(Math.min(mSt.slide + 1, MANIFEST_SLIDES.length - 1));
}
function manifestPrev() {
  clearTimeout(mSt.timer); stopSpeech();
  showManifestSlide(Math.max(mSt.slide - 1, 0));
}
function closeManifest() {
  mSt.running = false;
  clearTimeout(mSt.timer);
  stopSpeech();
  document.getElementById('manifestModal').classList.remove('open');
  playBell(396);
}
```

---

## SHARED UTILITIES (already exist — do not redefine)
- `speakText(text)` — text-to-speech
- `playBell(freq)` — plays a bell tone
- `stopSpeech()` — cancels TTS
- `intentions[]` — array of user intention objects
- `callClaude(system, user, maxTokens)` — calls Claude API
- `DEV_MODE` — boolean, true in local dev
- `toast(msg, type)` — shows a toast notification
