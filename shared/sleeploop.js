import { intentions, esc, toast } from '../app.js';
import { awardMindLoopPoint } from './rings.js';
import '../players/ci-vo.js';   // window.CIVO — Rachel recordings of the fixed lines
/* ── SLEEP LOOP ──────────────────────────────────────────
   Plays the user's FAVORITED goals on a gentle rotation as
   they fall asleep. Uses ElevenLabs premium audio (via the
   tts-elevenlabs function), cached per-device in IndexedDB so
   each clip generates ONCE then plays free; falls back to the
   browser's built-in speech if the function/audio is unavailable.

   Loop technique (decided): audible, first-person present
   (goals are already "I AM…"), ROTATE through the goals at a
   user-set cadence — N new goals per hour, for X hours.

   Depends on globals (from app.js): intentions, esc, toast.
───────────────────────────────────────────────────────── */

const BRAND = '#F5A623';
const DONE  = '#4ADE80';

const TTS_VER = 'v3';            // bump to invalidate cached audio (e.g. voice/model change / format)
let _playing = false, _timer = null, _idx = 0, _endAt = 0, _list = [], _audio = null;
let _lastVoAt = 0, _uiTimer = null, _lastLine = '';   // timer + current-line state
let _mindPtTimer = null;                              // fires the ONE daily Big-3 point after 10 min
const MIND_PT_MS = 10 * 60000;                        // 10 continuous minutes → +1 (capped once/day)
let _startedAt = 0;

// The whole loop is two numbers the user sets in a plain sentence:
//   "Play a new goal [perHour] time(s) per hour, for [hours] continuous hours."
// Interval between goals = one hour / perHour; the session ends after `hours`.
const _clamp = (v, lo, hi, dflt) => { const n = parseInt(v, 10); return isNaN(n) ? dflt : Math.max(lo, Math.min(hi, n)); };
let _perHour = (() => { try { return _clamp(localStorage.getItem('ci_loop_perhour'), 1, 60, 1); } catch (e) { return 1; } })();
let _hours   = (() => { try { return _clamp(localStorage.getItem('ci_loop_hours'), 1, 24, 8); } catch (e) { return 8; } })();
function _intervalMs() { return Math.round(3600000 / _perHour); }

/* Total impressions — every line the loop speaks (goal or mindset). Accumulates
   forever in ci_impressions. (Supabase sync is a later upgrade.) */
function _impressions() { try { return parseInt(localStorage.getItem('ci_impressions'), 10) || 0; } catch (e) { return 0; } }
function _bumpImpressions() { const n = _impressions() + 1; try { localStorage.setItem('ci_impressions', String(n)); } catch (e) {} return n; }

/* Dual-ring timer SVG. Outer ring = session time remaining (counter-clockwise);
   inner hashed ring = time until the next voice line. Light-on-dark. */
function _timerSVG(sessionFrac, voRem, voSec, sessTxt) {
  const r = 52, C = 2 * Math.PI * r;
  const showSess = Math.max(0, Math.min(1, sessionFrac));
  const N = 48, rIn = 40, tick = 7;
  let ticks = '';
  for (let i = 0; i < N; i++) {
    const ang = (-90 - (i / N) * 360) * Math.PI / 180;   // counter-clockwise from top
    const on  = (i / N) < Math.max(0, Math.min(1, voRem));
    const x1 = 60 + rIn * Math.cos(ang),          y1 = 60 + rIn * Math.sin(ang);
    const x2 = 60 + (rIn - tick) * Math.cos(ang), y2 = 60 + (rIn - tick) * Math.sin(ang);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${on ? '#e8e8e8' : '#333'}" stroke-width="1.5"/>`;
  }
  const col = _playing ? DONE : '#fff';
  return `<svg viewBox="0 0 120 120" style="display:block;width:100%;max-width:116px;height:auto;margin-left:auto;">
    <circle cx="60" cy="60" r="59" fill="#15151c"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="#3a3a44" stroke-width="6"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="${(C * showSess).toFixed(1)} ${C.toFixed(1)}"
      transform="rotate(-90 60 60) scale(-1,1) translate(-120,0)"/>
    <g>${ticks}</g>
    <text x="60" y="57" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="26" font-weight="800" fill="#fff">${voSec}</text>
    <text x="60" y="73" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="8" letter-spacing="0.5" fill="#c8c8d2">${sessTxt}</text>
  </svg>`;
}

function _renderTimer() {
  const el = document.getElementById('sleepTimer');
  if (!el) return;
  let sessionFrac = 1, voRem = 1, voSec = '▶', sessTxt = `${_hours}H · ${_perHour}/HR`;
  if (_playing) {
    const now = Date.now();
    const interval = _intervalMs();
    const into = now - _lastVoAt;
    voRem = 1 - (into / interval);
    const toNext = Math.max(0, interval - into);   // countdown to the next goal
    voSec = toNext >= 60000 ? Math.ceil(toNext / 60000) + 'm' : Math.max(0, Math.ceil(toNext / 1000));
    const remMs = Math.max(0, _endAt - now);
    sessionFrac = remMs / (_hours * 3600000);
    const h = Math.floor(remMs / 3600000), m = Math.floor((remMs % 3600000) / 60000);
    sessTxt = h > 0 ? `${h}h ${m}m LEFT` : `${m}m LEFT`;
  }
  el.innerHTML = _timerSVG(sessionFrac, voRem, voSec, sessTxt);
}

/* The two number inputs in the sentence. Persist + apply live if playing. */
export function sleepLoopSetPerHour(v) {
  _perHour = _clamp(v, 1, 60, 1);
  try { localStorage.setItem('ci_loop_perhour', String(_perHour)); } catch (e) {}
  if (_playing) _reschedule();
  renderSleepLoop();
}
export function sleepLoopSetHours(v) {
  _hours = _clamp(v, 1, 24, 8);
  try { localStorage.setItem('ci_loop_hours', String(_hours)); } catch (e) {}
  if (_playing) { _endAt = _startedAt + _hours * 3600000; if (Date.now() >= _endAt) { sleepLoopStop(); return; } }
  renderSleepLoop();
}

/* Stable short key for a line of text. */
function _hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }

/* ── AUDIO CACHE (IndexedDB) ─────────────────────────────
   localStorage (~5MB) was too small for mp3 blobs — writes
   failed silently and re-billed ElevenLabs on every repeat.
   IndexedDB holds hundreds of MB, so each clip generates ONCE
   per device, then plays free forever. */
const IDB_NAME = 'ci_tts', IDB_STORE = 'audio';
function _idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => { try { req.result.createObjectStore(IDB_STORE); } catch (e) {} };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}
async function _idbGet(key) {
  try {
    const db = await _idbOpen();
    return await new Promise((resolve) => {
      const r = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror   = () => resolve(null);
    });
  } catch (e) { return null; }
}
async function _idbPut(key, val) {
  try {
    const db = await _idbOpen();
    await new Promise((resolve) => {
      const r = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).put(val, key);
      r.onsuccess = () => resolve(); r.onerror = () => resolve();
    });
  } catch (e) {}
}
/* One-time: purge the old localStorage audio blobs that were eating quota. */
let _purged = false;
function _purgeOldCache() {
  if (_purged) return; _purged = true;
  try { Object.keys(localStorage).filter(k => k.startsWith('ci_tts_')).forEach(k => localStorage.removeItem(k)); } catch (e) {}
}

/* Goals the user has switched OFF for the loop, stored by goal id (ci_loop_off).
   Everything NOT in this set plays. */
function _offIds() {
  try { const a = JSON.parse(localStorage.getItem('ci_loop_off') || '[]'); return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}
function _saveOff(a) { try { localStorage.setItem('ci_loop_off', JSON.stringify(a)); } catch (e) {} }
function _isOff(id) { return _offIds().includes(id); }

/* The loop set = the user's goals ("I AM…" statements), minus any switched off
   via the SHOW GOALS list. Decoupled from Favorites / Daily-Focus on purpose:
   the Mind Loop is audio-only and goal-only; Daily Focus owns ci_favorites. */
function _loopGoals() {
  return (intentions || []).filter(it => it && it.title && !_isOff(it.id));
}
function _favGoalTexts() {
  return _loopGoals().map(it => it.title);
}

/* Show/hide the goals checklist inside the panel. */
let _listOpen = false;
export function sleepLoopToggleList() { _listOpen = !_listOpen; renderSleepLoop(); }

/* Toggle one goal in/out of the loop from the checklist. Applies live if the
   loop is already playing. */
export function sleepLoopToggleGoal(id) {
  const off = _offIds();
  const at = off.indexOf(id);
  if (at >= 0) off.splice(at, 1); else off.push(id);
  _saveOff(off);
  if (_playing) _list = _favGoalTexts();
  renderSleepLoop();
}

function _speak(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85; u.pitch = 1; u.volume = _volume();   // calm, slow
  try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {}
}

/* Premium ElevenLabs audio — generate once, cache the mp3 per-device so we
   never re-bill the same line. Returns true if it played, false to fall back. */
async function _playPremium(text) {
  if (typeof window.ciApiJson !== 'function') return false;
  const key = `${TTS_VER}_${_hash(text)}`;
  // L1: this device (IndexedDB) — stores a ready-to-play src (Supabase URL or data URI).
  let src = await _idbGet(key);
  if (!src) {
    try {
      const data = await window.ciApiJson('tts-elevenlabs', { text });
      if (data && data.url)        src = data.url;                              // global cache (Supabase)
      else if (data && data.audio) src = 'data:audio/mpeg;base64,' + data.audio; // inline fallback
      if (src) _idbPut(key, src);   // cache locally → no function round-trip next time
    } catch (e) { return false; }   // no key / dev / error → caller falls back
  }
  if (!src || !_playing) return false;
  try {
    if (_audio) { try { _audio.pause(); } catch (e) {} }
    _audio = new Audio(src);
    _audio.volume = _volume();
    await _audio.play();
    return true;
  } catch (e) { return false; }
}

/* CI Council scripts, 2 Nov 2026 (CI-VO-Scripts-Approved, section 5). */
const ML_IN_DAY = 'This is your Mind Loop. Your intentions, in your own words, will play from time to time. There’s no need to stop what you’re doing. Just let them land.';
const ML_IN_SLEEP = 'This is your evening Mind Loop. Get comfortable. Your intentions will play quietly, in your own words. There’s nothing to do but listen.';
const ML_OUT_DAY = 'That’s the end of today’s Mind Loop. Choose one thing you’ll do today as the person you intend to be.';
let _evening = false;
function _isEvening() { const h = new Date().getHours(); return h >= 18 || h < 5; }
/* Evening loops start quieter; in the last 60 s they fade out so nothing wakes the member. */
function _volume() {
  if (!_evening) return 1;
  const left = _endAt - Date.now();
  return Math.max(0.05, 0.6 * Math.min(1, left / 60000));
}
/* A framing line (intro/outro): premium voice if available, else browser. Not counted as an impression. */
async function _playLine(text) {
  const src = window.CIVO && window.CIVO.url(text);
  if (src) {
    try {
      if (_audio) { try { _audio.pause(); } catch (e) {} }
      _audio = new Audio(src); _audio.volume = _volume();
      await _audio.play();
      return;
    } catch (e) { /* not recorded yet — fall through */ }
  }
  const ok = await _playPremium(text);
  if (!ok && _playing) _speak(text);
}
/* Natural end of the session. Day: one spoken outro with an action. Evening: no voice (ML-OUT-SLEEP). */
function _finish() {
  if (_evening) { sleepLoopStop(); return; }
  if (_timer) { clearTimeout(_timer); _timer = null; }
  _playLine(ML_OUT_DAY);
  setTimeout(() => { if (_playing) sleepLoopStop(); }, 13000);
}

/* Speak one goal line — premium voice if available, else browser. */
async function _playGoal(text) {
  _lastLine = text;
  _bumpImpressions();   // every spoken line is one impression
  const ok = await _playPremium(text);
  if (!ok && _playing) _speak(text);
}

/* One rotation step: play the next goal, then schedule the next at the chosen
   cadence (one hour / perHour). Stops when the session hours are up. */
function _tick() {
  if (!_playing) return;
  if (Date.now() >= _endAt) { _finish(); return; }
  if (_list.length) { _lastVoAt = Date.now(); _playGoal(_list[_idx % _list.length]); _idx++; renderSleepLoop(); }
  _timer = setTimeout(_tick, _intervalMs());
}

/* Restart the interval timer after perHour changes mid-session. */
function _reschedule() {
  if (_timer) { clearTimeout(_timer); _timer = null; }
  if (_playing) _timer = setTimeout(_tick, _intervalMs());
}

export function sleepLoopToggle() {
  if (_playing) { sleepLoopStop(); return; }
  _list = _favGoalTexts();
  if (!_list.length) {
    if (typeof toast === 'function') toast('Add or switch on some goals first — they become your loop.', 'error');
    return;
  }
  _purgeOldCache();   // free the old localStorage audio blobs
  if (_timer) { clearTimeout(_timer); _timer = null; }   // kill any stale scheduler before starting
  _playing = true; _idx = 0; _lastVoAt = Date.now(); _startedAt = Date.now();
  _endAt = _startedAt + _hours * 3600000;
  // Award the single daily Big-3 point after 10 CONTINUOUS minutes of play.
  // Stopping before then clears it (see sleepLoopStop) → no farming by opening.
  if (_mindPtTimer) clearTimeout(_mindPtTimer);
  _mindPtTimer = setTimeout(() => { if (_playing) { try { awardMindLoopPoint(); } catch (e) {} } }, MIND_PT_MS);
  if (_uiTimer) clearInterval(_uiTimer);
  _uiTimer = setInterval(_renderTimer, 500);   // animate the rings
  _evening = _isEvening();
  _playLine(_evening ? ML_IN_SLEEP : ML_IN_DAY);   // ML-IN: once at the start
  _timer = setTimeout(_tick, 17000);               // first goal right after the intro (~16 s with Rachel's pace + pauses)
  renderSleepLoop();
}

export function sleepLoopStop() {
  _playing = false;
  if (_timer) { clearTimeout(_timer); _timer = null; }
  if (_mindPtTimer) { clearTimeout(_mindPtTimer); _mindPtTimer = null; }   // stopped early → no point
  if (_uiTimer) { clearInterval(_uiTimer); _uiTimer = null; }
  if (_audio) { try { _audio.pause(); } catch (e) {} _audio = null; }
  if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  renderSleepLoop();
}

export function renderSleepLoop() {
  const el = document.getElementById('sleepLoopWidget');
  if (!el) return;

  const list  = _playing ? _list : _favGoalTexts();
  const count = list.length;

  // Collapsible checklist of every goal — uncheck to drop one from the loop.
  const allGoals = (intentions || []).filter(g => g && g.title);
  const listRows = allGoals.map(g => {
    const on = !_isOff(g.id);
    return `<label style="display:flex;align-items:center;gap:10px;padding:9px 2px;cursor:pointer;border-bottom:1px solid var(--widget-border);">
      <input type="checkbox" ${on ? 'checked' : ''} onchange="sleepLoopToggleGoal('${g.id}')" style="width:18px;height:18px;flex-shrink:0;accent-color:#E0102B;cursor:pointer;">
      <span style="font-size:13px;line-height:1.4;color:var(--widget-text);${on ? '' : 'opacity:.4;text-decoration:line-through;'}">${esc(g.title)}</span>
    </label>`;
  }).join('');
  const listUI = allGoals.length ? `
    <div style="padding:0 16px 4px;">
      <button onclick="sleepLoopToggleList()" style="width:100%;display:flex;align-items:center;justify-content:space-between;background:transparent;border:1px solid var(--widget-border);border-radius:8px;padding:9px 12px;cursor:pointer;color:var(--widget-text);font-family:var(--vault-mono);font-size:10px;font-weight:800;letter-spacing:.5px;">
        <span>${_listOpen ? 'HIDE' : 'SHOW'} GOALS IN THIS LOOP · ${count} ON</span>
        <span style="display:inline-block;transition:transform .2s;transform:rotate(${_listOpen ? '0' : '-90'}deg);">▾</span>
      </button>
      ${_listOpen ? `<div style="margin-top:8px;background:var(--widget-bg);border:1px solid var(--widget-border);border-radius:8px;padding:2px 12px;max-height:280px;overflow:auto;">${listRows}</div>` : ''}
    </div>` : '';

  let status;
  if (_playing) {
    const remMs = Math.max(0, _endAt - Date.now());
    const h = Math.floor(remMs / 3600000), m = Math.floor((remMs % 3600000) / 60000);
    const left = h > 0 ? `${h}h ${m}m left` : `${m}m left`;
    status = `<div style="margin-top:10px;font-size:12px;color:${DONE};line-height:1.5;">▸ “${esc(_lastLine)}”</div>
       <div style="font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:0.5px;margin-top:3px;">${_perHour}/hr · ${left}</div>`;
  } else if (count) {
    status = `<div style="font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:0.5px;margin-top:8px;">Set how long it plays, then let it run.</div>`;   // ML-SET
  } else {
    status = `<div style="font-size:12px;color:#505058;font-style:italic;margin-top:8px;">Add or switch on some goals to build your loop.</div>`;
  }

  // The whole control: one plain-English sentence with two number inputs.
  const numStyle = 'width:52px;text-align:center;font-size:17px;font-weight:800;background:var(--widget-bg);color:var(--widget-text);border:1px solid var(--widget-border);border-radius:8px;padding:6px;margin:0 2px;';
  const sentence = `<div style="font-size:14px;line-height:2.3;color:var(--widget-text);">Play a new goal <input type="number" min="1" max="60" value="${_perHour}" onchange="sleepLoopSetPerHour(this.value)" style="${numStyle}"> time${_perHour === 1 ? '' : 's'} per hour, for <input type="number" min="1" max="24" value="${_hours}" onchange="sleepLoopSetHours(this.value)" style="${numStyle}"> continuous hour${_hours === 1 ? '' : 's'}.</div>`;

  el.innerHTML = `
    <div style="background:var(--widget-bg);border:1px solid ${_playing ? DONE : 'var(--widget-border)'};border-radius:12px;overflow:hidden;margin-bottom:8px;transition:border-color .3s;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:16px 16px 13px;">
        <div style="min-width:0;">
          <div style="font-size:15px;font-weight:800;color:var(--widget-text);letter-spacing:.5px;text-transform:uppercase;">Mind Loop</div>
          <div style="font-size:12px;color:#9a9a9a;margin-top:3px;line-height:1.4;">Your goals, spoken back to you on a gentle rotation.</div>
        </div>
        <div style="flex-shrink:0;margin-left:12px;font-family:var(--vault-mono);font-size:9px;font-weight:800;letter-spacing:.5px;border-radius:999px;padding:3px 10px;${count ? 'background:#E0102B;color:#fff;' : 'background:transparent;color:#505058;border:1px solid #333;'}">${count} goal${count === 1 ? '' : 's'}</div>
      </div>
      <div style="background:var(--widget-band);padding:16px;border-top:1px solid #3a3a3a;">
        <div style="display:flex;gap:14px;align-items:center;">
          <div style="flex:2 1 0;min-width:0;">${sentence}</div>
          ${count ? `<div style="flex:1 1 0;display:flex;justify-content:flex-end;"><div id="sleepTimer" onclick="sleepLoopToggle()" title="${_playing ? 'Tap to stop' : 'Tap to start'}" style="width:100%;cursor:pointer;"></div></div>` : ''}
        </div>
      </div>
      ${listUI}
      ${!count ? `<div style="padding:14px 16px;"><button onclick="sleepLoopToggle()" style="width:100%;background:${BRAND};border:1px solid ${BRAND};border-radius:8px;padding:11px;font-family:var(--vault-mono);font-size:11px;font-weight:800;letter-spacing:1px;color:#0a0a0a;cursor:pointer;">▶ START</button></div>` : ''}
      <div style="padding:12px 16px 0;">${status}</div>
      <div style="text-align:center;font-family:var(--vault-mono);font-size:8px;color:#555;letter-spacing:1.5px;margin-top:12px;border-top:1px solid #222;padding:10px 16px 14px;">◎ ${_impressions().toLocaleString()} TOTAL IMPRESSIONS</div>
    </div>`;
  if (count) _renderTimer();
}
