// Endpoint name kept as "claude" to avoid frontend churn.
// Under the hood this calls OpenAI gpt-4o-mini for structured JSON generation.

const { guard } = require('./_guard');

exports.handler = async (event) => {
  const g = await guard(event, { requireAuth: true, dailyLimit: 40, action: 'structured_ai' });
  if (!g.ok) return g.response;
  const headers = g.headers;
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.OPEN_AI_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { system, user } = body;
  if (!user) return { statusCode: 400, headers, body: JSON.stringify({ error: 'user is required' }) };
  const safeSystem = String(system || '').slice(0, 8000);
  const safeUser = String(user).slice(0, 12000);
  const requestedMax = Number(body.maxTokens);
  const maxTokens = Number.isFinite(requestedMax)
    ? Math.max(100, Math.min(2000, Math.trunc(requestedMax)))
    : 1200;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: maxTokens,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          ...(safeSystem ? [{ role: 'system', content: safeSystem }] : []),
          { role: 'user', content: safeUser }
        ]
      })
    });

    if (!res.ok) {
      const errTxt = await res.text();
      return { statusCode: res.status, headers, body: JSON.stringify({ error: errTxt }) };
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    if (!text) return { statusCode: 502, headers, body: JSON.stringify({ error: 'Empty response' }) };

    return { statusCode: 200, headers, body: JSON.stringify({ text }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
