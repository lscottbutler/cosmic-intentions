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
- NEVER suggest creating a vision board on Pinterest, Canva, or any external tool — the user already has a custom Digital Vision Board (DVB) built inside this app
- NEVER tell the user to "write a description", "journal", "visualize on paper", or "create" anything — Cosmic Intentions IS the visualization and vision board tool. Direct them to use it.
- For any component that touches clarity or vision, the action must reference opening Cosmic Intentions and running a session — not an external exercise
- ALWAYS recommend online research, digital tools, apps, and at-home actions
- Be brutally specific to THIS exact goal — no generic self-help platitudes
- Every action must be something the user can do right now from their desk

VIVID VISION SPECIAL RULE (critical):
The action for Vivid Vision must ALWAYS say exactly this: "Your Digital Vision Board for this goal is already built inside Cosmic Intentions. Open it now and run a visualization session — that IS your vivid vision practice. Do it daily."
The insight should be a powerful, specific statement about what owning/achieving this goal will look, feel, and mean for them personally. Do NOT tell them to write anything down or create anything — the DVB already exists.

The framework has two parts:

PART 1 — THE 6 ETERNAL PROBLEMS
These are the six dimensions every human goal must solve. Write a specific insight about how THIS goal relates to each problem, plus one concrete online/at-home action to solve it.
1. Vivid Vision — a defined, vivid picture of the end state (follow the VIVID VISION SPECIAL RULE above)
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
        max_tokens: 4096,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are an elite achievement coach. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    const rawBody = await res.text();
    if (!res.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: rawBody }) };
    }

    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'OpenAI envelope parse failed: ' + e.message }) };
    }

    const choice = data.choices?.[0];
    const text = choice?.message?.content?.trim() || '';
    if (choice?.finish_reason === 'length') {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'AI response truncated before completion — please retry' }) };
    }
    if (!text) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Empty AI content' }) };
    }

    const clean = text.replace(/^```json\s*/,'').replace(/```$/,'').trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Malformed AI JSON: ' + e.message }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
