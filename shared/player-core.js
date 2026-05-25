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

function getElevenLabsCreds(config = {}) {
  let key     = null;
  let voiceId = null;

  // Tier 0: window.parent — catches iframe sandbox scope boundaries
  try {
    if (window.parent && window.parent.localStorage) {
      key     = window.parent.localStorage.getItem('ci_eleven_key');
      voiceId = window.parent.localStorage.getItem('ci_voice_id');
    }
  } catch(e) { console.log('Cross-origin parent frame reading restricted.'); }

  // Tier 1: own localStorage raw keys
  if (!key)     key     = localStorage.getItem('ci_eleven_key');
  if (!voiceId) voiceId = localStorage.getItem('ci_voice_id');

  // Tier 2: ci_pegboard nested profile object
  if (!key || !voiceId) {
    const pb = getPBLocal();
    if (!key     && pb['pb-eleven'])  key     = pb['pb-eleven'];
    if (!voiceId && pb['pb-voiceid']) voiceId = pb['pb-voiceid'];
  }

  // Tier 3: window.opener — players opened via window.open() from dashboard
  if (!key || !voiceId) {
    try {
      if (window.opener && !window.opener.closed) {
        if (!key)     key     = window.opener.localStorage.getItem('ci_eleven_key');
        if (!voiceId) voiceId = window.opener.localStorage.getItem('ci_voice_id');
      }
    } catch(e) { console.log('Cross-origin opener reading restricted.'); }
  }

  return {
    apiKey:  key     ? key.trim()     : null,
    voiceId: voiceId ? voiceId.trim() : ELEVENLABS_VOICE_ID
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

function speakText(text, config = {}) {
  if (!text) return;
  stopSpeech();

  // Base64 cache shortcut — text unchanged and valid cache exists, bypass ElevenLabs entirely
  if (config.audioBase64 && config.cachedText === text) {
    playBase64AudioStream(config.audioBase64);
    return;
  }

  try {
    const { apiKey, voiceId } = getElevenLabsCreds(config);
    console.log('🎤 ElevenLabs Check:', {
      apiKey:  apiKey  ? 'SET' : 'MISSING',
      voiceId: voiceId || 'MISSING'
    });
    if (apiKey && voiceId) {
      speakElevenLabs(text, apiKey, voiceId);
    } else {
      console.warn('[Player] No credentials — browser TTS fallback');
      speakBrowser(text);
    }
  } catch(e) {
    console.error('[Player] speakText error:', e);
    speakBrowser(text);
  }
}

function speakBrowser(text) {
  if (!('speechSynthesis' in window)) return;
  const utt  = new SpeechSynthesisUtterance(text);
  utt.rate   = 0.82;
  utt.pitch  = 0.88;
  utt.volume = 0.9;
  window.speechSynthesis.speak(utt);
}

async function speakElevenLabs(text, apiKey, voiceId) {
  if (DEV_MODE) {
    console.log('[EL-DEV] DEV_MODE active — browser TTS mock (no API call)');
    speakBrowser(text);
    return;
  }

  // Isolated fetch — network errors never reach audio playback thread
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key':   apiKey
      },
      body: JSON.stringify({
        text,
        model_id:       'eleven_multilingual_v2',
        voice_settings: { stability: 0.65, similarity_boost: 0.8 }
      })
    });

    if (!res.ok) {
      console.error('[EL] API error:', res.status, res.statusText);
      const detail = await res.text().catch(() => '');
      console.error('[EL] Detail:', detail);
      speakBrowser(text);
      return;
    }

    console.log('[EL] Response received — converting to base64 stream...');

    // Isolated audio setup — keeps fetch errors from silencing playback
    try {
      const buf    = await res.arrayBuffer();
      const bytes  = new Uint8Array(buf);
      let binary   = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const audioBase64 = btoa(binary);
      playBase64AudioStream(audioBase64);
      console.log('[EL] ✓ Live audio fetched, converted, and playing.');
    } catch(audioErr) {
      console.warn('[EL] Audio conversion/playback failed:', audioErr.message);
      speakBrowser(text);
    }

  } catch(fetchErr) {
    console.warn('[EL] Fetch failed:', fetchErr.message);
    speakBrowser(text);
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
