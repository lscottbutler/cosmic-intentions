import { intentions, esc, toast } from '../app.js';
/* ── SLEEP LOOP ──────────────────────────────────────────
   Plays the user's FAVORITED goals on a gentle rotation as
   they fall asleep. Uses ElevenLabs premium audio (via the
   tts-elevenlabs function), cached per-device in IndexedDB so
   each clip generates ONCE then plays free; falls back to the
   browser's built-in speech if the function/audio is unavailable.

   Loop technique (decided): audible, first-person present
   (goals are already "I AM…"), ROTATE don't hammer (~30s
   cadence), bounded pre-sleep session.

   Depends on globals (from app.js): intentions, esc, toast.
───────────────────────────────────────────────────────── */

const GAP_MS     = 30000;        // ~30s between goals (spacing, not hammering)
const SESSION_MS = 20 * 60000;   // bounded 20-min wind-down
const BRAND = '#F5A623';
const DONE  = '#4ADE80';

const TTS_VER = 'v3';            // bump to invalidate cached audio (e.g. voice/model change / format)
let _playing = false, _timer = null, _idx = 0, _endAt = 0, _list = [], _audio = null;
let _lastVoAt = 0, _uiTimer = null, _lastLine = '';   // timer + current-line state
let _mode = (() => { try { return localStorage.getItem('ci_loop_mode') || 'sleep'; } catch (e) { return 'sleep'; } })();
// Sleep-session length in minutes; 0 = continuous (all day/night, no auto-stop).
let _sessionMin = (() => { try { const v = parseInt(localStorage.getItem('ci_loop_minutes'), 10); return isNaN(v) ? 20 : v; } catch (e) { return 20; } })();
let _startedAt = 0;
const SLOT_MS  = 30 * 60000;   // daytime: a play at :00 and :30
const SLOT_GAP = 14000;        // gap between the goal and the mindset line within a slot
const DURATIONS = [20, 60, 240, 480, 0];   // minutes; 0 = ∞
function _durLabel(m) { return m === 0 ? '∞' : m < 60 ? `${m}m` : `${m / 60}h`; }

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
  return `<svg width="116" height="116" viewBox="0 0 120 120" style="display:block;margin:0 auto;">
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="#262626" stroke-width="6"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="${(C * showSess).toFixed(1)} ${C.toFixed(1)}"
      transform="rotate(-90 60 60) scale(-1,1) translate(-120,0)"/>
    <g>${ticks}</g>
    <text x="60" y="57" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="26" font-weight="800" fill="#fff">${voSec}</text>
    <text x="60" y="73" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="8" letter-spacing="0.5" fill="#888">${sessTxt}</text>
  </svg>`;
}

function _renderTimer() {
  const el = document.getElementById('sleepTimer');
  if (!el) return;
  let sessionFrac = 1, voRem = 1, voSec = Math.round(GAP_MS / 1000), sessTxt = '';
  if (_mode === 'daytime') {
    if (_playing) {
      const toSlot = _msToNextSlot();
      sessionFrac = Math.max(0, Math.min(1, toSlot / SLOT_MS));
      voRem = sessionFrac;
      const mm = Math.floor(toSlot / 60000), ss = Math.floor((toSlot % 60000) / 1000);
      voSec = mm; sessTxt = `${mm}:${ss.toString().padStart(2, '0')} TO NEXT`;
    } else {
      voSec = '☀'; sessTxt = 'EVERY :00 & :30';
    }
  } else if (_playing) {
    const now  = Date.now();
    const into = now - _lastVoAt;
    voRem = 1 - (into / GAP_MS);
    voSec = Math.max(0, Math.ceil((GAP_MS - into) / 1000));
    if (_sessionMin > 0) {
      const remMs = Math.max(0, _endAt - now);
      sessionFrac = remMs / (_sessionMin * 60000);
      const mm = Math.floor(remMs / 60000), ss = Math.floor((remMs % 60000) / 1000);
      sessTxt = `${mm}:${ss.toString().padStart(2, '0')} LEFT`;
    } else {
      sessionFrac = 1;   // continuous — ring stays full
      const e = now - _startedAt, h = Math.floor(e / 3600000), m = Math.floor((e % 3600000) / 60000);
      sessTxt = h > 0 ? `∞  ${h}h ${m}m` : `∞  ${m}m`;
    }
  } else {
    sessTxt = _sessionMin > 0 ? `${_sessionMin} MIN` : 'ALL NIGHT';
  }
  el.innerHTML = _timerSVG(sessionFrac, voRem, voSec, sessTxt);
}

export function sleepLoopSetMode(mode) {
  if (mode !== 'sleep' && mode !== 'daytime') return;
  if (_playing) sleepLoopStop();
  _mode = mode;
  try { localStorage.setItem('ci_loop_mode', mode); } catch (e) {}
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

/* The loop set = favorited goals ("I AM…" statements). */
function _favGoalTexts() {
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem('ci_favorites') || '[]'); } catch (e) {}
  return favs
    .filter(f => f && f.player === 'mindset' && f.goal != null)
    .map(f => intentions[f.goal] && intentions[f.goal].title)
    .filter(Boolean);
}

function _speak(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85; u.pitch = 1; u.volume = 1;   // calm, slow
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
    await _audio.play();
    return true;
  } catch (e) { return false; }
}

/* Speak one line (goal or mindset) — premium voice if available, else browser. */
async function _playGoal(text) {
  _lastLine = text;
  _bumpImpressions();   // every spoken line is one impression
  const ok = await _playPremium(text);
  if (!ok && _playing) _speak(text);
}

/* ── DAYTIME MODE ───────────────────────────────────────
   At :00 and :30 of each hour, play 1 favorited goal + 1 random
   mindset line (affirmation/belief/stoic/quote). Runs while the
   tab is open. */
function _randomMindset() {
  const pool = [];
  (intentions || []).forEach(it => {
    const m = it && it.mindset;
    if (!m) return;
    (m.affirmations || []).forEach(x => pool.push(x));
    (m.beliefs      || []).forEach(x => pool.push(x));
    (m.stoic        || []).forEach(x => pool.push(x));
    (m.quotes       || []).forEach(x => pool.push(x));
    (m.attitudes    || []).forEach(a => pool.push(a && (a.body || a.title)));
  });
  const clean = pool.map(s => String(s || '').trim()).filter(Boolean);
  return clean.length ? clean[Math.floor(Math.random() * clean.length)] : '';
}

function _msToNextSlot() {
  const now = new Date();
  const minsToNext = now.getMinutes() < 30 ? 30 - now.getMinutes() : 60 - now.getMinutes();
  return Math.max(1000, (minsToNext * 60 - now.getSeconds()) * 1000 - now.getMilliseconds());
}

async function _playDaytimeSlot() {
  if (!_playing || !_list.length) return;
  _lastVoAt = Date.now();
  await _playGoal(_list[_idx % _list.length]); _idx++;
  renderSleepLoop();
  const mind = _randomMindset();   // +1 mindset line, after a short gap
  if (mind) setTimeout(() => { if (_playing) { _lastVoAt = Date.now(); _playGoal(mind); renderSleepLoop(); } }, SLOT_GAP);
}

function _scheduleDaytime() {
  if (!_playing || _mode !== 'daytime') return;
  _timer = setTimeout(() => {
    if (!_playing || _mode !== 'daytime') return;
    _playDaytimeSlot();
    _scheduleDaytime();
  }, _msToNextSlot());
}

function _tick() {
  if (!_playing || _mode !== 'sleep') return;   // sleep-only; never run in daytime
  if (Date.now() >= _endAt) { sleepLoopStop(); return; }
  if (_list.length) { _lastVoAt = Date.now(); _playGoal(_list[_idx % _list.length]); _idx++; renderSleepLoop(); }
  _timer = setTimeout(_tick, GAP_MS);
}

export function sleepLoopToggle() {
  if (_playing) { sleepLoopStop(); return; }
  _list = _favGoalTexts();
  if (!_list.length) {
    if (typeof toast === 'function') toast('Favorite some goals first — they become your loop.', 'error');
    return;
  }
  _purgeOldCache();   // free the old localStorage audio blobs
  if (_timer) { clearTimeout(_timer); _timer = null; }   // kill any stale scheduler before starting
  _playing = true; _idx = 0; _lastVoAt = Date.now(); _startedAt = Date.now();
  if (_uiTimer) clearInterval(_uiTimer);
  _uiTimer = setInterval(_renderTimer, 500);   // animate the rings
  if (_mode === 'daytime') {
    _playDaytimeSlot();      // play one now, then align to :00 / :30
    _scheduleDaytime();
  } else {
    _endAt = _sessionMin > 0 ? _startedAt + _sessionMin * 60000 : Infinity;   // 0 = run until stopped
    _tick();                 // sleep: continuous rotation
  }
  renderSleepLoop();
}

export function sleepLoopSetDuration(min) {
  _sessionMin = min;
  try { localStorage.setItem('ci_loop_minutes', String(min)); } catch (e) {}
  if (_playing && _mode === 'sleep') _endAt = min > 0 ? _startedAt + min * 60000 : Infinity;
  renderSleepLoop();
}

export function sleepLoopStop() {
  _playing = false;
  if (_timer) { clearTimeout(_timer); _timer = null; }
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
  const day   = _mode === 'daytime';

  let status;
  if (_playing) {
    let sub;
    if (day) {
      const nextStr = new Date(Date.now() + _msToNextSlot()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      sub = `next play at ${nextStr}`;
    } else {
      sub = `rotating every 30s · ~${Math.max(0, Math.ceil((_endAt - Date.now()) / 60000))} min left`;
    }
    status = `<div style="margin-top:10px;font-size:12px;color:${DONE};line-height:1.5;">▸ “${esc(_lastLine)}”</div>
       <div style="font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:0.5px;margin-top:3px;">${sub}</div>`;
  } else if (count) {
    status = `<div style="font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:0.5px;margin-top:8px;">${day ? 'Plays on the hour &amp; half-hour · keep this tab open' : 'ElevenLabs voice · falls back to your device'}</div>`;
  } else {
    status = `<div style="font-size:12px;color:#505058;font-style:italic;margin-top:8px;">Favorite goals (♥) to build your loop.</div>`;
  }

  const modeBtn = (m, label) => `<button onclick="sleepLoopSetMode('${m}')"
    style="flex:1;background:${_mode === m ? BRAND : 'transparent'};border:1px solid ${_mode === m ? BRAND : '#333'};border-radius:6px;padding:7px;font-family:var(--vault-mono);font-size:9px;font-weight:800;letter-spacing:0.5px;color:${_mode === m ? '#0a0a0a' : '#888'};cursor:pointer;">${label}</button>`;

  el.innerHTML = `
    <div style="background:#141414;border:1px solid ${_playing ? DONE : '#2a2a2a'};border-radius:12px;padding:14px;margin-bottom:8px;transition:border-color .3s;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:${BRAND};font-weight:800;letter-spacing:1px;">◈ AFFIRMATION LOOP</div>
        <div style="font-family:var(--vault-mono);font-size:10px;color:${count ? BRAND : '#505058'};">${count} goal${count === 1 ? '' : 's'}</div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:12px;">${modeBtn('sleep', '🌙 SLEEP')}${modeBtn('daytime', '☀ DAYTIME')}</div>
      <p style="font-size:12px;line-height:1.5;color:#999;margin:0 0 12px;">${day ? 'One goal + one mindset line at the top &amp; half of every hour. Keep this tab open.' : 'Your favorited goals, spoken on a gentle rotation. Press play as you drift off.'}</p>
      ${(!day && !_playing && count) ? `<div style="display:flex;gap:4px;margin-bottom:12px;">
        ${DURATIONS.map(m => `<button onclick="sleepLoopSetDuration(${m})"
          style="flex:1;background:${_sessionMin === m ? '#262626' : 'transparent'};border:1px solid ${_sessionMin === m ? BRAND : '#333'};border-radius:5px;padding:5px;font-family:var(--vault-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:${_sessionMin === m ? '#fff' : '#777'};cursor:pointer;" title="${m === 0 ? 'Run until you stop it' : 'Run for ' + _durLabel(m)}">${_durLabel(m)}</button>`).join('')}
      </div>` : ''}
      ${count ? `<div id="sleepTimer" style="margin:2px 0 14px;"></div>` : ''}
      <button onclick="sleepLoopToggle()"
        style="width:100%;background:${_playing ? '#2A1515' : BRAND};border:1px solid ${_playing ? '#5a2a2a' : BRAND};border-radius:8px;padding:11px;font-family:var(--vault-mono);font-size:11px;font-weight:800;letter-spacing:1px;color:${_playing ? '#FF6B6B' : '#0a0a0a'};cursor:pointer;">
        ${_playing ? '■ STOP' : '▶ START'}</button>
      ${status}
      <div style="text-align:center;font-family:var(--vault-mono);font-size:8px;color:#555;letter-spacing:1.5px;margin-top:12px;border-top:1px solid #222;padding-top:10px;">◎ ${_impressions().toLocaleString()} TOTAL IMPRESSIONS</div>
    </div>`;
  if (count) _renderTimer();
}
