import {
  enforceRateLimit,
  isAllowedPublicRequest,
  json,
  publicHeaders,
} from './_shared/public-guard.mjs';

export default async (request, context) => {
  const headers = publicHeaders(request);
  if (request.method === 'OPTIONS') return new Response('', { status: 204, headers });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);
  if (!isAllowedPublicRequest(request)) return json({ error: 'Forbidden origin' }, 403, headers);

  const rate = await enforceRateLimit(context, 'iam-generator', 10, 60 * 60 * 1000);
  if (!rate.allowed) {
    return json(
      { error: 'You have reached the hourly limit. Please try again later.' },
      429,
      { ...headers, 'Retry-After': String(rate.retryAfter) },
    );
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, headers); }

  const apiKey = Netlify.env.get('OPEN_AI_KEY');
  if (!apiKey) return json({ error: 'Service is temporarily unavailable' }, 503, headers);

  const goal = String(body.goal || '').trim().slice(0, 300);
  if (!goal) return json({ error: 'goal is required' }, 400, headers);

  const systemPrompt = `You are an affirmation writing assistant. Turn a person's goal into three concise first-person statements. Use present tense, positive language, an emotionally grounded tone, and specific but credible wording. Do not claim medical, psychological, financial, or guaranteed outcomes. Return JSON only.`;
  const userPrompt = `Goal: "${goal}"\nReturn exactly: { "statements": ["I am …", "I am …", "I am …"] }`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) return json({ error: 'Generation is temporarily unavailable' }, 502, headers);
    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    const statements = (Array.isArray(parsed.statements) ? parsed.statements : [])
      .map((statement) => String(statement || '').trim())
      .filter(Boolean)
      .slice(0, 3);
    if (statements.length !== 3) return json({ error: 'No statements generated — retry' }, 502, headers);
    return json({ statements }, 200, headers);
  } catch {
    return json({ error: 'Generation is temporarily unavailable' }, 500, headers);
  }
};

export const config = { path: '/api/iam-generator' };
