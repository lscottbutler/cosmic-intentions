/* ── wrapup-ai.js — MULTI-PASS PERSONALIZED EVENING RECAP ──────────────────
   Turns the day's tracking data + the user's pegboard into a short, warm,
   STORY paragraph ("here's what you did today / how it's progressing").

   THREE PASSES (the filter that turns generic into personal):
     1. DRAFT    — write a first recap from the data + who they are.
     2. CRITIQUE — find what's generic / could apply to anyone; what to sharpen.
     3. REFINE   — rewrite applying the critique. Output only the paragraph.

   Uses OPEN_AI_KEY (no Anthropic key exists in this project).
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

  const apiKey = process.env.OPEN_AI_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };

  const name    = String(body.name || 'there').trim();
  const summary = String(body.summary || '').trim();
  const context = String(body.context || '').trim();
  const wins    = Array.isArray(body.recentWins) ? body.recentWins.map(w => String(w || '').trim()).filter(Boolean).slice(0, 5) : [];

  if (!summary) return { statusCode: 400, headers, body: JSON.stringify({ error: 'summary is required' }) };

  const call = async (messages, temperature, max_tokens) => {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', temperature, max_tokens, messages }),
    });
    const raw = await res.text();
    if (!res.ok) throw new Error(raw);
    return (JSON.parse(raw).choices?.[0]?.message?.content || '').trim();
  };

  const who = context ? `WHO THEY ARE (use to personalize, do not quote verbatim):\n${context}\n\n` : '';
  const winsBlock = wins.length ? `RECENT WINS THEY LOGGED:\n- ${wins.join('\n- ')}\n\n` : '';

  try {
    // ── Pass 1: draft ──────────────────────────────────────────────────────
    const draft = await call([
      { role: 'system', content: 'You are a warm, perceptive personal coach writing a short end-of-day recap. Second person ("you"). 2–3 sentences. Specific and progress-framed. No clichés, no preamble, no emojis, no bullet points.' },
      { role: 'user', content: `${who}${winsBlock}WHAT THEY DID TODAY (the data):\n${summary}\n\nWrite their end-of-day recap.` },
    ], 0.7, 220);

    // ── Pass 2: critique ───────────────────────────────────────────────────
    const critique = await call([
      { role: 'system', content: 'You are a ruthless editor. Critique the recap ONLY for genericness and missed personalization. List, tersely, what to cut (anything that could apply to anyone) and what to make more specific to THIS person and THIS data. No rewrite — just the critique.' },
      { role: 'user', content: `${who}DATA:\n${summary}\n\nRECAP TO CRITIQUE:\n"${draft}"` },
    ], 0.4, 220);

    // ── Pass 3: refine ─────────────────────────────────────────────────────
    const finalPara = await call([
      { role: 'system', content: 'You are a warm, perceptive personal coach. Rewrite the recap applying the critique. Second person, 2–3 sentences, specific, warm, progress-framed. No clichés, no preamble, no emojis, no quotes. Output ONLY the final paragraph.' },
      { role: 'user', content: `${who}DATA:\n${summary}\n\nDRAFT:\n"${draft}"\n\nCRITIQUE TO APPLY:\n${critique}\n\nFinal recap for ${name}:` },
    ], 0.6, 220);

    const paragraph = finalPara.replace(/^["']|["']$/g, '').trim();
    if (!paragraph) return { statusCode: 502, headers, body: JSON.stringify({ error: 'empty result' }) };

    return { statusCode: 200, headers, body: JSON.stringify({ paragraph }) };
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
