/* ══════════════════════════════════════════════════════════
   COSMIC INTENTIONS - PLAYER CORE
   Shared functions for all 9 player types
   ══════════════════════════════════════════════════════════ */

/* ── DAILY IMAGE ROTATION ────────────────────────────────── */
const PLAYER_IMAGES = Array.from({ length: 25 }, (_, i) =>
  `../images/players/player-${String(i + 1).padStart(2, '0')}.jpg`
);

function getDailyImage() {
  const dayIndex = Math.floor(Date.now() / 86400000) % PLAYER_IMAGES.length;
  return PLAYER_IMAGES[dayIndex];
}

function getDailyImageAbsolute() {
  const dayIndex = Math.floor(Date.now() / 86400000) % PLAYER_IMAGES.length;
  return `images/players/player-${String(dayIndex + 1).padStart(2, '0')}.jpg`;
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

/* ── VOICE ENGINE ─────────────────────────────────────────── */
function stopSpeech() {
  try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch(e) {}
}

function speakText(text, config = {}) {
  if (!text) return;
  stopSpeech();
  
  // Check for ElevenLabs API key & voice ID in config or localStorage
  try {
    const apiKey  = config.elevenLabsKey  || localStorage.getItem('ci_eleven_key') || '';
    const voiceId = config.elevenLabsVoice || localStorage.getItem('ci_voice_id')  || '';
    
    console.log('🎤 ElevenLabs Check:', { apiKey: apiKey ? 'SET' : 'MISSING', voiceId: voiceId || 'MISSING' });
    
    if (apiKey && voiceId) {
      speakElevenLabs(text, apiKey, voiceId);
    } else {
      speakBrowser(text);
    }
  } catch(e) {
    console.error('Voice error:', e);
    speakBrowser(text);
  }
}

function speakBrowser(text) {
  if (!('speechSynthesis' in window)) return;
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate   = 0.82;
  utt.pitch  = 0.88;
  utt.volume = 0.9;
  window.speechSynthesis.speak(utt);
}

async function speakElevenLabs(text, apiKey, voiceId) {
  console.log('🎙️ Calling ElevenLabs API...');
  console.log('Voice ID:', voiceId);
  console.log('Text:', text.substring(0, 50) + '...');
  
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'xi-api-key': apiKey 
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });
    
    console.log('ElevenLabs Response Status:', res.status);
    
    if (!res.ok) { 
      console.error('ElevenLabs API Error:', res.status, res.statusText);
      const errorText = await res.text();
      console.error('Error details:', errorText);
      speakBrowser(text); 
      return; 
    }
    
    console.log('✓ ElevenLabs audio received, playing...');
    const blob  = await res.blob();
    const url   = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  } catch(err) { 
    console.error('ElevenLabs Exception:', err);
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
  const el = document.getElementById(elementId);
  if (el) el.style.width = pct + '%';
  return parseFloat(pct);
}

/* ── FULLSCREEN TOGGLE ───────────────────────────────────── */
function toggleFullscreen(element) {
  if (!document.fullscreenElement) {
    element.requestFullscreen?.() || 
    element.webkitRequestFullscreen?.() ||
    element.msRequestFullscreen?.();
  } else {
    document.exitFullscreen?.() ||
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
    LS,
    createBreathingCircle,
    formatTime,
    updateProgress,
    toggleFullscreen
  };
}
