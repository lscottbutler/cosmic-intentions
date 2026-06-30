import { LS, intentions, esc, toast } from '../app.js';
/* ── SLEEP LOOP ──────────────────────────────────────────
   Plays the user's FAVORITED goals on a gentle rotation as
   they fall asleep. v1 uses the browser's built-in speech
   (free, works today); ElevenLabs premium audio is a later
   upgrade — see project_wrapup_tracking_vision.

   Loop technique (decided): audible, first-person present
   (goals are already "I AM…"), ROTATE don't hammer (~30s
   cadence), bounded pre-sleep session.

   Depends on globals (from app.js): LS, intentions, esc, toast.
───────────────────────────────────────────────────────── */

const GAP_MS     = 30000;        // ~30s between goals (spacing, not hammering)
const SESSION_MS = 20 * 60000;   // bounded 20-min wind-down
const BRAND = '#F5A623';
const DONE  = '#4ADE80';

const TTS_VER = 'v1';            // bump to invalidate cached audio (e.g. voice change)
let _playing = false, _timer = null, _idx = 0, _endAt = 0, _list = [], _audio = null;

/* Stable short key for a line of text. */
function _hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }

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
  const key = `ci_tts_${TTS_VER}_${_hash(text)}`;
  let b64 = LS.get(key);
  if (!b64) {
    try {
      const data = await window.ciApiJson('tts-elevenlabs', { text });
      if (data && data.audio) { b64 = data.audio; try { LS.set(key, b64); } catch (e) {} }
    } catch (e) { return false; }   // no key / dev / error → caller falls back
  }
  if (!b64 || !_playing) return false;
  try {
    if (_audio) { try { _audio.pause(); } catch (e) {} }
    _audio = new Audio('data:audio/mpeg;base64,' + b64);
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
  if (_list.length) { _playGoal(_list[_idx % _list.length]); _idx++; renderSleepLoop(); }
  _timer = setTimeout(_tick, GAP_MS);
}

export function sleepLoopToggle() {
  if (_playing) { sleepLoopStop(); return; }
  _list = _favGoalTexts();
  if (!_list.length) {
    if (typeof toast === 'function') toast('Favorite some goals first — they become your loop.', 'error');
    return;
  }
  _playing = true; _idx = 0; _endAt = Date.now() + SESSION_MS;
  _tick();   // speak first immediately, then rotate
}

export function sleepLoopStop() {
  _playing = false;
  if (_timer) { clearTimeout(_timer); _timer = null; }
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
      <button onclick="sleepLoopToggle()"
        style="width:100%;background:${_playing ? '#2A1515' : BRAND};border:1px solid ${_playing ? '#5a2a2a' : BRAND};border-radius:8px;padding:11px;font-family:var(--vault-mono);font-size:11px;font-weight:800;letter-spacing:1px;color:${_playing ? '#FF6B6B' : '#0a0a0a'};cursor:pointer;">
        ${_playing ? '■ STOP' : '▶ START'}</button>
      ${status}
    </div>`;
}
