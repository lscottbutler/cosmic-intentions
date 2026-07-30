/* ── wrapup-ai.js — MULTI-PASS PERSONALIZED EVENING RECAP ──────────────────
   Turns the day's tracking data + the user's pegboard into a short, warm,
   STORY paragraph ("here's what you did today / how it's progressing").

   THREE PASSES (the filter that turns generic into personal):
     1. DRAFT    — write a first recap from the data + who they are.
     2. CRITIQUE — find what's generic / could apply to anyone; what to sharpen.
     3. REFINE   — rewrite applying the critique. Output only the paragraph.

   Uses OPEN_AI_KEY (no Anthropic key exists in this project).
─────────────────────────────────────────────────────────────────────────── */
const { guard } = require('./_guard');

exports.handler = async (event) => {
  const g = await guard(event, { requireAuth: true });
  if (!g.ok) return g.response;
  const headers = g.headers;
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
      { role: 'system', content: 'You are a warm, perceptive personal coach writing a short end-of-day reflection. Second person ("you"). 2–3 sentences. Capture the SPIRIT of their day — paraphrase how it went; do NOT list or recite the stats. Reference at most one concrete detail if it genuinely adds meaning. Encouraging in tone, and END with a gentle nudge toward the one thing still left or the momentum worth protecting. No clichés, no preamble, no emojis, no bullet points, no numbers-dump.' },
      { role: 'user', content: `${who}${winsBlock}WHAT THEY DID TODAY (the data — translate it into meaning, don't read it back):\n${summary}\n\nWrite their end-of-day reflection.` },
    ], 0.7, 220);

    // ── Pass 2: critical refine (critique criteria folded in — 2 passes total
    //    keeps us safely under Netlify's 10s function limit) ──────────────────
    const finalPara = await call([
      { role: 'system', content: 'You are a warm, perceptive personal coach AND a ruthless editor. Rewrite the draft so it PARAPHRASES how their day and week went in an encouraging voice — do NOT enumerate the data or read the numbers back; translate them into meaning (consistency, momentum, becoming who they intend to be). Name at most one concrete detail. Keep it personal to them, never generic. END on a gentle prod — the next ring to close, the streak to protect, the small push that finishes the day. Second person, 2–3 sentences, warm. No clichés, no preamble, no emojis, no quotes, no lists of stats. Output ONLY the final paragraph.' },
      { role: 'user', content: `${who}${winsBlock}DATA (translate to meaning, don't recite):\n${summary}\n\nDRAFT TO SHARPEN:\n"${draft}"\n\nFinal reflection for ${name}:` },
    ], 0.6, 240);

    const paragraph = finalPara.replace(/^["']|["']$/g, '').trim();
    if (!paragraph) return { statusCode: 502, headers, body: JSON.stringify({ error: 'empty result' }) };

    return { statusCode: 200, headers, body: JSON.stringify({ paragraph }) };
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
