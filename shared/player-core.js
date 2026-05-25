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

function getElevenLabsCreds() {
  let key     = null;
  let voiceId = null;

  // 1. Try to yank keys from the parent dashboard window (the bridge)
  try {
    if (window.opener && window.opener.localStorage) {
      key     = window.opener.localStorage.getItem('ci_eleven_key');
      voiceId = window.opener.localStorage.getItem('ci_voice_id');
    }
  } catch(e) { console.warn('Cross-origin restriction blocked parent window access.'); }

  // 2. If parent window access is blocked (iframe), check local storage
  if (!key)     key     = localStorage.getItem('ci_eleven_key');
  if (!voiceId) voiceId = localStorage.getItem('ci_voice_id');

  // 3. Fallback: Parse the pegboard object if the raw keys are missing
  if (!key || !voiceId) {
    try {
      const pbRaw = localStorage.getItem('ci_pegboard');
      if (pbRaw) {
        const pb = JSON.parse(pbRaw);
        if (!key)     key     = pb['pb-eleven'];
        if (!voiceId) voiceId = pb['pb-voiceid'];
      }
    } catch(e) {}
  }

  return {
    apiKey:  key     ? key.trim()     : null,
    voiceId: voiceId ? voiceId.trim() : null
  };
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

async function speakText(text, goalIndex = null) {
  if (!text) return;
  stopSpeech();
  const safeText = text.trim().substring(0, 150);

  let key = null, voiceId = null;
  try {
    // Tier 0: window.parent (iframe sandbox)
    if (window.parent && window.parent.localStorage) {
      key     = window.parent.localStorage.getItem('ci_eleven_key');
      voiceId = window.parent.localStorage.getItem('ci_voice_id');
    }
  } catch(e) { console.log('Cross-origin parent frame reading restricted.'); }

  // Tier 1: own localStorage
  if (!key)     key     = localStorage.getItem('ci_eleven_key');
  if (!voiceId) voiceId = localStorage.getItem('ci_voice_id');

  // Tier 2: ci_pegboard
  if (!key || !voiceId) {
    const pb = getPBLocal();
    if (!key     && pb['pb-eleven'])  key     = pb['pb-eleven'];
    if (!voiceId && pb['pb-voiceid']) voiceId = pb['pb-voiceid'];
  }

  // Tier 3: window.opener (player opened via window.open from dashboard)
  if (!key || !voiceId) {
    try {
      if (window.opener && !window.opener.closed) {
        if (!key)     key     = window.opener.localStorage.getItem('ci_eleven_key');
        if (!voiceId) voiceId = window.opener.localStorage.getItem('ci_voice_id');
      }
    } catch(e) { console.log('Cross-origin opener reading restricted.'); }
  }

  if (!key || !voiceId) {
    console.error('❌ ELEVENLABS ABORTED: Missing API Key or Voice ID. Falling back to Browser TTS.');
    speakBrowser(safeText);
    return;
  }

  // Cache guard — reuse base64 data URI if text unchanged
  if (goalIndex !== null) {
    try {
      const pbRaw = localStorage.getItem('ci_pegboard');
      const stored = pbRaw ? JSON.parse(pbRaw) : {};
      const intentions = stored.intentions || [];
      const cached = intentions[goalIndex];
      if (cached && cached.title && cached.title.trim() === safeText && cached.audioBase64) {
        new Audio(cached.audioBase64).play().catch(e => console.error('Audio cache play error:', e));
        return;
      }
    } catch(err) { console.warn('Cache evaluation failed.'); }
  }

  if (DEV_MODE) {
    console.log('🧪 DEV_MODE Active: Bypassing live API.');
    speakBrowser(safeText);
    return;
  }

  // Live ElevenLabs call
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId.trim()}`, {
      method: 'POST',
      headers: { 'xi-api-key': key.trim(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: safeText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Rejected (${response.status}): ${errorText}`);
    }
    const buffer       = await response.arrayBuffer();
    const base64String = btoa(new Uint8Array(buffer).reduce((d, b) => d + String.fromCharCode(b), ''));
    const dataUri      = `data:audio/mp3;base64,${base64String}`;
    new Audio(dataUri).play().catch(e => console.error('Live audio play error:', e));
    console.log('[EL] ✓ Live audio playing.');
  } catch(err) {
    console.error('🚨 ElevenLabs failed — browser TTS fallback:', err.message);
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
    speakElevenLabs,
    stopSpeech,
    playBase64AudioStream,
    getElevenLabsCreds,
    getPBLocal,
    LS,
    createBreathingCircle,
    formatTime,
    updateProgress,
    toggleFullscreen
  };
}
