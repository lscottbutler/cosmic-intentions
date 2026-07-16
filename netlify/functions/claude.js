// Endpoint name kept as "claude" to avoid frontend churn.
// Under the hood this calls OpenAI gpt-4o-mini for structured JSON generation.

const { guard } = require('./_guard');

exports.handler = async (event) => {
  const g = await guard(event, { requireAuth: false });
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

  const { system, user, maxTokens = 1800 } = body;
  if (!user) return { statusCode: 400, headers, body: JSON.stringify({ error: 'user is required' }) };

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
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: user }
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
