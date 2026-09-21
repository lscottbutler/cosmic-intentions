/* ── tts-elevenlabs.js — TEXT → SPEECH (ElevenLabs) ────────────────────────
   Voices a short line (a goal / affirmation). Caches the mp3 in Supabase
   Storage so it's generated ONCE EVER (any user, any device) — on a cache
   hit we return the stored URL without calling ElevenLabs at all.

   Env:
     ELEVENLABS_API_KEY          (required)
     ELEVENLABS_VOICE_ID         (optional — defaults to a calm preset voice)
     ELEVENLABS_MODEL            (optional — quality vs cost. Defaults to
                                  eleven_multilingual_v2 (1 credit/char, richest).
                                  Set to eleven_turbo_v2_5 to HALVE cost
                                  (0.5 credit/char, faster, near-identical).)
   Per-member cache: private Supabase Storage bucket `goal-audio`. Audio is
   returned inline, so no personal goal recording is exposed through a public URL.
─────────────────────────────────────────────────────────────────────────── */
const crypto   = require('crypto');
const { guard } = require('./_guard');
const SUPA_URL = 'https://wbqzwbubbeorcknevips.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicXp3YnViYmVvcmNrbmV2aXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTM3NzMsImV4cCI6MjA5MTAyOTc3M30.mF_YGj1E2ib0mEx07lkZyjgBzdGDT7saK8wofEjcqNc';
const BUCKET   = 'goal-audio';
const ALLOWED_MODELS = ['eleven_multilingual_v2', 'eleven_turbo_v2_5', 'eleven_flash_v2_5'];

exports.handler = async (event) => {
  const g = await guard(event, { requireAuth: true, dailyLimit: 60, action: 'tts_elevenlabs' });
  if (!g.ok) return g.response;
  const headers = g.headers;
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }) };

  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // "Rachel" — calm default
  // Model: request override (whitelisted) → env → safe default. Drives the cost.
  const reqModel = String(body.model || '').trim();
  const model = ALLOWED_MODELS.includes(reqModel) ? reqModel
              : (ALLOWED_MODELS.includes(process.env.ELEVENLABS_MODEL) ? process.env.ELEVENLABS_MODEL : 'eleven_multilingual_v2');
  const text = String(body.text || '').trim().slice(0, 400);   // short lines only — keeps cost down
  if (!text) return { statusCode: 400, headers, body: JSON.stringify({ error: 'text is required' }) };

  // Cache key includes the model + voice so each model caches separately (clean A/B).
  const hash       = crypto.createHash('sha1').update(voiceId + '|' + model + '|' + text).digest('hex');
  const objectPath = `${g.user.id}/${voiceId}/${model}/${hash}.mp3`;
  const storageHeaders = {
    apikey: SUPA_ANON,
    Authorization: `Bearer ${g.accessToken}`,
  };

  try {
    // 1. PRIVATE CACHE HIT — return bytes only to the authenticated owner.
    try {
      const cached = await fetch(`${SUPA_URL}/storage/v1/object/authenticated/${BUCKET}/${objectPath}`, {
        headers: storageHeaders,
      });
      if (cached.ok) {
        const cachedBuf = Buffer.from(await cached.arrayBuffer());
        return { statusCode: 200, headers, body: JSON.stringify({ audio: cachedBuf.toString('base64'), mime: 'audio/mpeg', cached: true }) };
      }
    } catch (e) { /* fall through to generate */ }

    // 2. GENERATE via ElevenLabs (the only path that bills).
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!res.ok) {
      const errTxt = await res.text();
      return { statusCode: 502, headers, body: JSON.stringify({ error: errTxt }) };
    }
    const buf = Buffer.from(await res.arrayBuffer());

    // 3. Store inside the member's private folder (best effort).
    try {
      const up = await fetch(`${SUPA_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
        method: 'POST',
        headers: { ...storageHeaders, 'Content-Type': 'audio/mpeg' },
        body: buf,
      });
      if (!up.ok) console.warn('[tts-elevenlabs] private cache upload failed:', up.status);
    } catch (e) { /* fall through to inline */ }

    return { statusCode: 200, headers, body: JSON.stringify({ audio: buf.toString('base64'), mime: 'audio/mpeg', cached: false }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
