/* ══════════════════════════════════════════════════════════
   COSMIC INTENTIONS - PLAYER CORE
   Shared functions for all player types
   ══════════════════════════════════════════════════════════ */

const DEV_MODE = false; // true = mock ElevenLabs | false = live API calls

const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel — default baseline

/* ── RETURN TO APP ───────────────────────────────────────── */
function returnToApp() {
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.focus();
      window.close();
    } else {
      window.location.href = '/index.html';
    }
  } catch(e) {
    window.location.href = '/index.html';
  }
}

/* ── DAILY IMAGE ROTATION ────────────────────────────────── */
const PLAYER_IMAGES = Array.from({ length: 25 }, (_, i) =>
  `../images/players/player-${String(i + 1).padStart(2, '0')}.jpg`
);

const PLAYER_OFFSETS = {
  'visual-countdown': 0,
  'viz-quick':        4,
  'viz-10min':        8,
  'countdown':        12,
  'meditation':       16,
  'gratitude':        20
};

function getDailyImage(offset = 0) {
  const dayIndex = (Math.floor(Date.now() / 86400000) + offset) % PLAYER_IMAGES.length;
  return PLAYER_IMAGES[dayIndex];
}

/* ── 528Hz BELL GENERATOR ────────────────────────────────── */
function playBell(freq = 528) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.32, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 3.5);
    osc.onended = () => { try { ctx.close(); } catch(e) {} };
  } catch(e) {}
}

/* ── CREDENTIAL RESOLUTION ───────────────────────────────── */
function getPBLocal() {
  try {
    const raw = localStorage.getItem('ci_pegboard');
    return raw ? JSON.parse(raw) : {};
  } catch(e) { return {}; }
}

function getOpenAIKey() {
  // 1. Own localStorage
  let key = localStorage.getItem('openai_api_key');
  // 2. window.opener (player opened from dashboard)
  if (!key) {
    try {
      if (window.opener && !window.opener.closed)
        key = window.opener.localStorage.getItem('openai_api_key');
    } catch(e) {}
  }
  // 3. ci_pegboard openai_api_key field
  if (!key) {
    try {
      const pb = JSON.parse(localStorage.getItem('ci_pegboard') || '{}');
      key = pb['openai_api_key'] || null;
    } catch(e) {}
  }
  return key ? key.trim() : null;
}

/* ── VOICE ENGINE ────────────────────────────────────────── */
function stopSpeech() {
  try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch(e) {}
}

function playBase64AudioStream(audioBase64) {
  try {
    const binary = atob(audioBase64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob  = new Blob([bytes], { type: 'audio/mpeg' });
    const url   = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
    console.log('[Player] Base64 cache hit — $0.00');
  } catch(audioErr) {
    console.warn('[Player] playBase64AudioStream failed:', audioErr.message);
  }
}

function speakBrowser(text) {
  if (!('speechSynthesis' in window)) return;
  const utt  = new SpeechSynthesisUtterance(text.substring(0, 150));
  utt.rate   = 0.82;
  utt.pitch  = 0.88;
  utt.volume = 0.9;
  window.speechSynthesis.speak(utt);
}

async function speakText(text) {
  if (!text) return;
  stopSpeech();
  const safeText = text.trim().substring(0, 150);
  const apiKey   = getOpenAIKey();

  if (!apiKey) {
    console.warn('⚠️ OpenAI key missing. Falling back to Browser TTS.');
    speakBrowser(safeText);
    return;
  }

  if (DEV_MODE) {
    console.log('🧪 DEV_MODE Active: Bypassing live API.');
    speakBrowser(safeText);
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', input: safeText, voice: 'alloy' })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI Error: ${error.error?.message}`);
    }
    const blob = await response.blob();
    new Audio(URL.createObjectURL(blob)).play();
    console.log('[OpenAI] ✓ Live audio playing.');
  } catch(err) {
    console.error('🚨 OpenAI API Failed. Fallback to Browser TTS:', err);
    speakBrowser(safeText);
  }
}

/* ── LOCALSTORAGE WRAPPER ────────────────────────────────── */
const LS = {
  get: (k) => {
    try { return localStorage.getItem(k); }
    catch { return null; }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, v); }
    catch {}
  },
  remove: (k) => {
    try { localStorage.removeItem(k); }
    catch {}
  }
};

/* ── BREATHING CIRCLE ANIMATION ──────────────────────────── */
function createBreathingCircle(containerId, type = 'in') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const circle = document.createElement('div');
  circle.className = `breathing-circle breathing-${type}`;
  container.innerHTML = '';
  container.appendChild(circle);
  return circle;
}

/* ── COUNTDOWN FORMATTER ─────────────────────────────────── */
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  if (m > 0) return `${m}:${String(s).padStart(2, '0')}`;
  return String(s);
}

/* ── PROGRESS BAR UPDATER ────────────────────────────────── */
function updateProgress(current, total, elementId) {
  const pct = (current / total * 100).toFixed(1);
  const el  = document.getElementById(elementId);
  if (el) el.style.width = pct + '%';
  return parseFloat(pct);
}

/* ── FULLSCREEN TOGGLE ───────────────────────────────────── */
function toggleFullscreen(element) {
  if (!document.fullscreenElement) {
    element.requestFullscreen?.()       ||
    element.webkitRequestFullscreen?.() ||
    element.msRequestFullscreen?.();
  } else {
    document.exitFullscreen?.()       ||
    document.webkitExitFullscreen?.() ||
    document.msExitFullscreen?.();
  }
}

/* ── EXPORT FOR TESTING ──────────────────────────────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    playBell,
    speakText,
    speakBrowser,
    stopSpeech,
    playBase64AudioStream,
    getOpenAIKey,
    getPBLocal,
    LS,
    createBreathingCircle,
    formatTime,
    updateProgress,
    toggleFullscreen
  };
}
