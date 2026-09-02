/* ── ENCOURAGEMENTS ───────────────────────────────────────────────────────────
   Press-to-hear encouragement buttons peppered around the site. The button is a
   home-row sticker; pressing it pops a warm, personalized line (rotating) and
   speaks it — ElevenLabs voice via the cached tts-elevenlabs function when it's
   available (logged in + ELEVENLABS_API_KEY set), else the browser's own voice
   so it works right now. On-brand (see marketing/00-brand-foundation): warm,
   calm, second-person, transformational, no hype. {name} = the member's first
   name at play time. */
import { getPB } from '../app.js';

const ENCOURAGEMENTS = [
  "Good job, {name}. You showed up today — and that's how it starts.",
  "That's the person you're becoming, {name}. Keep going.",
  "You kept your word to yourself today, {name}. That's everything.",
  "One small step, {name}. It matters more than you think.",
  "Look at you, {name} — not all talk anymore.",
  "Every repetition rewires you, {name}. That was a good one.",
  "Quietly proud of you, {name}. You did the thing.",
  "This is what showing up looks like, {name}. Well done.",
  "Momentum's on your side now, {name}. Ride it.",
  "Big things, small beginnings, {name}. You just made one.",
];
// The sticker used as the button + on the pop card. Swap freely for another home-row image.
export const ENCOURAGE_STICKER = 'images/home-row/home-rocket.webp';

function _firstName() {
  try {
    const pb = (typeof getPB === 'function') ? (getPB() || {}) : {};
    const raw = pb['pb-name'] || '';
    const f = String(raw).trim().split(/\s+/)[0];
    return f || 'friend';
  } catch (e) { return 'friend'; }
}

let _last = -1;
function _pick() {
  let i = Math.floor(Math.random() * ENCOURAGEMENTS.length);
  if (i === _last) i = (i + 1) % ENCOURAGEMENTS.length;   // no immediate repeat
  _last = i;
  return ENCOURAGEMENTS[i];
}

export function playEncouragement() {
  const line = _pick().replace(/\{name\}/g, _firstName());
  _showCard(line);
  _speak(line);
}

/* Voice: ElevenLabs (cached) first, browser speech as the always-works fallback. */
function _speak(text) {
  if (typeof window.ciApiJson === 'function') {
    window.ciApiJson('tts-elevenlabs', { text })
      .then(d => { if (d && d.url) { const a = new Audio(d.url); a.play().catch(() => _browserSpeak(text)); } else _browserSpeak(text); })
      .catch(() => _browserSpeak(text));
  } else _browserSpeak(text);
}
function _browserSpeak(text) {
  if (!('speechSynthesis' in window)) return;
  try { const u = new SpeechSynthesisUtterance(text); u.rate = 0.96; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {}
}

function _showCard(line) {
  document.querySelectorAll('.encourage-pop').forEach(e => e.remove());
  const el = document.createElement('div');
  el.className = 'encourage-pop';
  el.innerHTML = '<img src="' + ENCOURAGE_STICKER + '" alt=""><p>' + String(line).replace(/</g, '&lt;') + '</p>';
  el.onclick = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); };
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 350); }, 5200);
}

/* Reusable button HTML for peppering it anywhere. */
export function encourageButtonHTML(cls) {
  return '<button class="encourage-btn ' + (cls || '') + '" onclick="playEncouragement()" title="Tap for a boost" aria-label="A little encouragement"><img src="' + ENCOURAGE_STICKER + '" alt="" draggable="false"></button>';
}

if (typeof window !== 'undefined') {
  window.playEncouragement = playEncouragement;
  window.encourageButtonHTML = encourageButtonHTML;
}
