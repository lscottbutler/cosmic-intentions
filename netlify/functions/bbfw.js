exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { goal } = body;
  const apiKey = process.env.OPEN_AI_KEY;

  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };
  if (!goal)   return { statusCode: 400, headers, body: JSON.stringify({ error: 'goal is required' }) };

  const prompt = `You are an elite achievement coach building a personalised roadmap for this goal: "${goal}"

STRICT RULES — violations will be rejected:
- NEVER suggest going outside, visiting physical locations, attending events, shows, or stores
- ALWAYS recommend online research, digital tools, apps, and at-home actions
- Be brutally specific to THIS exact goal — no generic self-help platitudes
- Every action must be something the user can do right now from their desk

The framework has two parts:

PART 1 — THE 6 ETERNAL PROBLEMS
These are the six dimensions every human goal must solve. Write a specific insight about how THIS goal relates to each problem, plus one concrete online/at-home action to solve it.
1. Vivid Vision — a defined, vivid picture of the end state
2. Compelling Why — emotional fuel that survives adversity
3. Credible Plan — a map plus the habit of navigating
4. Feedback Loops — regular signal: am I on track?
5. Environment Design — context shapes behavior more than willpower
6. Identity Alignment — becoming the person who achieves this

PART 2 — THE 9 COMPONENTS OF GOAL SUCCESS
Each component is a failure point. Write one specific action for THIS goal, plus a quote from a famous high-achiever (Ali, Kobe, Napoleon Hill, Jocko, Hormozi, Naval, Edison, Churchill, Clear, Frankl, Eisenhower, Drucker — recognisable names only).
1. Clarity — a defined vivid picture of the end state
2. Compelling Why — emotional fuel that survives adversity
3. Belief — subconscious conviction it is achievable
4. Plan — a map plus the habit of navigating
5. Feedback Loops — regular signal: am I on track?
6. Environment Design — context shapes behavior more than willpower
7. Accountability — external commitment mechanisms
8. Resilience — treating failure as data, not verdict
9. Identity Alignment — becoming the person who achieves this

Return this exact JSON structure:
{
  "eternal_problems": [
    { "insight": "...", "action": "..." },
    { "insight": "...", "action": "..." },
    { "insight": "...", "action": "..." },
    { "insight": "...", "action": "..." },
    { "insight": "...", "action": "..." },
    { "insight": "...", "action": "..." }
  ],
  "components": [
    { "action": "...", "quote": "..." },
    { "action": "...", "quote": "..." },
    { "action": "...", "quote": "..." },
    { "action": "...", "quote": "..." },
    { "action": "...", "quote": "..." },
    { "action": "...", "quote": "..." },
    { "action": "...", "quote": "..." },
    { "action": "...", "quote": "..." },
    { "action": "...", "quote": "..." }
  ]
}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1800,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are an elite achievement coach. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 502, headers, body: JSON.stringify({ error: err }) };
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    const clean = text.replace(/^```json\s*/,'').replace(/```$/,'').trim();
    const parsed = JSON.parse(clean);
    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
