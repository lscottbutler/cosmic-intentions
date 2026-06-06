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

  const prompt = `You are an elite achievement coach. A user has set this goal: "${goal}"

Analyse this goal through the Backbone Framework — return ONLY valid JSON, no markdown, no commentary.

The framework has two parts:

PART 1 — THE 6 ETERNAL PROBLEMS
Each problem is a dimension the user must solve to achieve this goal. Be specific to their exact goal. No generic advice.

PART 2 — THE 9 COMPONENTS OF GOAL SUCCESS
Each component is a specific action the user must take. One powerful quote from a famous achiever that applies.

Return this exact JSON:
{
  "eternal_problems": [
    { "insight": "specific insight about THIS goal for Vivid Vision", "action": "one concrete action to solve it" },
    { "insight": "specific insight about THIS goal for Compelling Why", "action": "one concrete action to solve it" },
    { "insight": "specific insight about THIS goal for Credible Plan", "action": "one concrete action to solve it" },
    { "insight": "specific insight about THIS goal for Feedback Loops", "action": "one concrete action to solve it" },
    { "insight": "specific insight about THIS goal for Environment Design", "action": "one concrete action to solve it" },
    { "insight": "specific insight about THIS goal for Identity Alignment", "action": "one concrete action to solve it" }
  ],
  "components": [
    { "action": "specific action for Clarity applied to this goal", "quote": "Famous person quote" },
    { "action": "specific action for Compelling Why applied to this goal", "quote": "Famous person quote" },
    { "action": "specific action for Belief applied to this goal", "quote": "Famous person quote" },
    { "action": "specific action for Plan applied to this goal", "quote": "Famous person quote" },
    { "action": "specific action for Feedback Loops applied to this goal", "quote": "Famous person quote" },
    { "action": "specific action for Environment Design applied to this goal", "quote": "Famous person quote" },
    { "action": "specific action for Accountability applied to this goal", "quote": "Famous person quote" },
    { "action": "specific action for Resilience applied to this goal", "quote": "Famous person quote" },
    { "action": "specific action for Identity Alignment applied to this goal", "quote": "Famous person quote" }
  ]
}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
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
