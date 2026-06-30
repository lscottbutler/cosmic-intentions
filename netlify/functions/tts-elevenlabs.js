/* ── tts-elevenlabs.js — TEXT → SPEECH (ElevenLabs) ────────────────────────
   Voices a short line (a goal / affirmation). Caches the mp3 in Supabase
   Storage so it's generated ONCE EVER (any user, any device) — on a cache
   hit we return the stored URL without calling ElevenLabs at all.

   Env:
     ELEVENLABS_API_KEY          (required)
     ELEVENLABS_VOICE_ID         (optional — defaults to a calm preset voice)
     SUPABASE_SERVICE_ROLE_KEY   (optional — enables the global cache; without
                                  it the function still works, returning audio
                                  inline for per-device caching only)
─────────────────────────────────────────────────────────────────────────── */
const crypto   = require('crypto');
const SUPA_URL = 'https://wbqzwbubbeorcknevips.supabase.co';
const BUCKET   = 'goal-audio';

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

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hash       = crypto.createHash('sha1').update(voiceId + '|' + text).digest('hex');
  const objectPath = `${voiceId}/${hash}.mp3`;
  const publicUrl  = `${SUPA_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;

  try {
    // 1. GLOBAL CACHE HIT — already in Supabase Storage → return URL, no ElevenLabs bill.
    if (serviceKey) {
      try {
        const head = await fetch(publicUrl, { method: 'HEAD' });
        if (head.ok) return { statusCode: 200, headers, body: JSON.stringify({ url: publicUrl, cached: true }) };
      } catch (e) { /* fall through to generate */ }
    }

    // 2. GENERATE via ElevenLabs (the only path that bills).
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
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

    // 3. STORE for everyone (best-effort), return the cached URL.
    if (serviceKey) {
      try {
        const up = await fetch(`${SUPA_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey, 'Content-Type': 'audio/mpeg', 'x-upsert': 'true' },
          body: buf,
        });
        if (up.ok) return { statusCode: 200, headers, body: JSON.stringify({ url: publicUrl, cached: false }) };
      } catch (e) { /* fall through to inline */ }
    }

    // 4. FALLBACK — no service key / upload failed: return audio inline (client caches per-device).
    return { statusCode: 200, headers, body: JSON.stringify({ audio: buf.toString('base64'), mime: 'audio/mpeg' }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
