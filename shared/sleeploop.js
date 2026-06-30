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
let _lastVoAt = 0, _uiTimer = null;   // timer animation state

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
  let sessionFrac = 1, voRem = 1, voSec = Math.round(GAP_MS / 1000), sessTxt = `${Math.round(SESSION_MS / 60000)} MIN`;
  if (_playing) {
    const now   = Date.now();
    const remMs = Math.max(0, _endAt - now);
    sessionFrac = remMs / SESSION_MS;
    const into  = now - _lastVoAt;
    voRem = 1 - (into / GAP_MS);
    voSec = Math.max(0, Math.ceil((GAP_MS - into) / 1000));
    const mm = Math.floor(remMs / 60000), ss = Math.floor((remMs % 60000) / 1000);
    sessTxt = `${mm}:${ss.toString().padStart(2, '0')} LEFT`;
  }
  el.innerHTML = _timerSVG(sessionFrac, voRem, voSec, sessTxt);
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

/* Speak one goal — premium voice if available, else browser speech. */
async function _playGoal(text) {
  const ok = await _playPremium(text);
  if (!ok && _playing) _speak(text);
}

function _tick() {
  if (!_playing) return;
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
  _playing = true; _idx = 0; _endAt = Date.now() + SESSION_MS; _lastVoAt = Date.now();
  if (_uiTimer) clearInterval(_uiTimer);
  _uiTimer = setInterval(_renderTimer, 500);   // animate the rings
  _tick();   // speak first immediately, then rotate
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
  const now   = list.length ? list[(_idx - 1 + list.length) % list.length] : '';
  const minsLeft = _playing ? Math.max(0, Math.ceil((_endAt - Date.now()) / 60000)) : 0;

  const status = _playing
    ? `<div style="margin-top:10px;font-size:12px;color:${DONE};line-height:1.5;">▸ “${esc(now)}”</div>
       <div style="font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:0.5px;margin-top:3px;">rotating every 30s · ~${minsLeft} min left</div>`
    : (count
        ? `<div style="font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:0.5px;margin-top:8px;">ElevenLabs voice · falls back to your device</div>`
        : `<div style="font-size:12px;color:#505058;font-style:italic;margin-top:8px;">Favorite goals (♥) to build your loop.</div>`);

  el.innerHTML = `
    <div style="background:#141414;border:1px solid ${_playing ? DONE : '#2a2a2a'};border-radius:12px;padding:14px;margin-bottom:8px;transition:border-color .3s;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:${BRAND};font-weight:800;letter-spacing:1px;">◈ SLEEP LOOP</div>
        <div style="font-family:var(--vault-mono);font-size:10px;color:${count ? BRAND : '#505058'};">${count} goal${count === 1 ? '' : 's'}</div>
      </div>
      <p style="font-size:12px;line-height:1.5;color:#999;margin:0 0 12px;">Your favorited goals, spoken on a gentle rotation. Press play as you drift off.</p>
      ${count ? `<div id="sleepTimer" style="margin:2px 0 14px;"></div>` : ''}
      <button onclick="sleepLoopToggle()"
        style="width:100%;background:${_playing ? '#2A1515' : BRAND};border:1px solid ${_playing ? '#5a2a2a' : BRAND};border-radius:8px;padding:11px;font-family:var(--vault-mono);font-size:11px;font-weight:800;letter-spacing:1px;color:${_playing ? '#FF6B6B' : '#0a0a0a'};cursor:pointer;">
        ${_playing ? '■ STOP' : '▶ START'}</button>
      ${status}
    </div>`;
  if (count) _renderTimer();
}
