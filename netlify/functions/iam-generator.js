/* ── iam-generator.js — FREE "I AM STATEMENT GENERATOR" ────────────────────
   Public lead-magnet tool. Takes a goal/dream and returns 3 polished, present-
   tense, emotionally-embodied "I AM" statements built on the rules that make
   affirmations actually land. No auth. Uses OPEN_AI_KEY + gpt-4o-mini.
   Called from /iam (standalone/iam-generator.html) via /api/iam-generator.
─────────────────────────────────────────────────────────────────────────── */
const { guard } = require('./_guard');

exports.handler = async (event) => {
  const g = await guard(event, { requireAuth: false });
  if (!g.ok) return g.response;
  const headers = g.headers;
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const apiKey = process.env.OPEN_AI_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };

  // Cap input length (cost + abuse guard).
  const goal = String(body.goal || '').trim().slice(0, 300);
  if (!goal) return { statusCode: 400, headers, body: JSON.stringify({ error: 'goal is required' }) };

  const systemPrompt = `You are a master affirmation coach for a manifestation app. You turn a person's goal or dream into powerful "I AM" statements. Every statement MUST follow these rules:
1. PRESENT TENSE, as if already true ("I am", never "I will" or "I want").
2. FIRST PERSON and positive (state what IS, never what isn't — no "not", "don't", "no").
3. EMOTIONALLY EMBODIED — include the feeling or identity, not just the outcome (e.g. "grateful", "unstoppable", "at peace").
4. SPECIFIC and believable enough to feel real, but expansive enough to inspire.
Keep each statement to one vivid sentence. No preamble, no commentary.`;

  const userPrompt = `The person's goal/dream: "${goal}"

Write 3 distinct "I AM" statements for this goal, each taking a slightly different emotional angle (e.g. one on identity, one on gratitude/feeling, one on confident action). Return ONLY valid JSON, no markdown:
{ "statements": ["I am …", "I am …", "I am …"] }`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        temperature: 0.85,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   }
        ]
      })
    });

    const rawBody = await res.text();
    if (!res.ok) return { statusCode: 502, headers, body: JSON.stringify({ error: rawBody }) };

    const data    = JSON.parse(rawBody);
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    const clean   = content.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    const parsed  = JSON.parse(clean);

    const statements = (Array.isArray(parsed.statements) ? parsed.statements : [])
      .map(s => String(s || '').trim())
      .filter(Boolean)
      .slice(0, 3);

    if (!statements.length) return { statusCode: 502, headers, body: JSON.stringify({ error: 'No statements generated — retry' }) };

    return { statusCode: 200, headers, body: JSON.stringify({ statements }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
