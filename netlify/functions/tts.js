// Text-to-speech proxy. Tries ElevenLabs first (if ELEVENLABS_API_KEY is set),
// falls back to OpenAI so it never goes silent. Returns { audio: <base64 mp3>, provider }.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { text, voice } = JSON.parse(event.body || '{}');
    if (!text) return { statusCode: 400, body: 'Missing text' };
    const clean = text.trim().substring(0, 400);

    // ── 1) ElevenLabs (preferred) ──────────────────────────────────────────
    const elKey = process.env.ELEVENLABS_API_KEY;
    if (elKey) {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // default: "Rachel"
      const model   = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
      try {
        const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': elKey,            // NOTE: not "Authorization: Bearer"
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          body: JSON.stringify({
            text: clean,
            model_id: model,
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          })
        });
        if (r.ok) {
          const audio = Buffer.from(await r.arrayBuffer()).toString('base64');
          return { statusCode: 200, headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ audio, provider: 'elevenlabs' }) };
        }
        console.log('ElevenLabs failed', r.status, (await r.text()).slice(0, 300)); // fall through
      } catch (e) {
        console.log('ElevenLabs error', e.message);                                 // fall through
      }
    }

    // ── 2) OpenAI fallback ─────────────────────────────────────────────────
    const OA_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const oaVoice = OA_VOICES.includes(voice) ? voice : 'shimmer';
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', input: clean.substring(0, 150), voice: oaVoice })
    });
    if (!res.ok) {
      return { statusCode: res.status, body: await res.text() };
    }
    const audio = Buffer.from(await res.arrayBuffer()).toString('base64');
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ audio, provider: 'openai' }) };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
