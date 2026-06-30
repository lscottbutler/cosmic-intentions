/* ── tts-elevenlabs.js — TEXT → SPEECH (ElevenLabs) ────────────────────────
   Voices a short line (a goal / affirmation) and returns the MP3 as base64.
   The client caches the result (generate-once) so we don't re-bill on repeat.

   Env:
     ELEVENLABS_API_KEY   (required)
     ELEVENLABS_VOICE_ID  (optional — defaults to a calm preset voice)
─────────────────────────────────────────────────────────────────────────── */
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }) };

  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // "Rachel" — calm default
  const text = String(body.text || '').trim().slice(0, 400);   // short lines only — keeps cost down
  if (!text) return { statusCode: 400, headers, body: JSON.stringify({ error: 'text is required' }) };

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!res.ok) {
      const errTxt = await res.text();
      return { statusCode: 502, headers, body: JSON.stringify({ error: errTxt }) };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ audio: buf.toString('base64'), mime: 'audio/mpeg' }),
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
