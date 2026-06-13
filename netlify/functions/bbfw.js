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

  const { goal, dangerZones } = body;
  const apiKey = process.env.OPEN_AI_KEY;

  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };
  if (!goal)   return { statusCode: 400, headers, body: JSON.stringify({ error: 'goal is required' }) };

  // Build danger zone armor sections if provided
  const dzList = Array.isArray(dangerZones) && dangerZones.length > 0 ? dangerZones : [];

  // Map zones to their armor blocks by index pattern: 0=evening/late, 1=stress, 2=social/peer, rest distributed
  const vividDz      = dzList.filter((_, i) => i % 3 === 0).map(z => z.title).filter(Boolean);
  const compellingDz = dzList.filter((_, i) => i % 3 === 1).map(z => z.title).filter(Boolean);
  const planDz       = dzList.filter((_, i) => i % 3 === 2).map(z => z.title).filter(Boolean);

  const dzArmor = dzList.length > 0 ? `
DANGER ZONE ARMOR SYSTEM (Pass 2 & Pass 3 — critical):
The user has logged these personal friction triggers: ${dzList.map(z => z.title).join(', ')}.
You must embed armor against these specific triggers into the strategy blocks as follows:

- VIVID VISION insight: If any of these triggers apply (${vividDz.length ? vividDz.join(', ') : 'any late-night or habitual triggers'}), weave a single calm, reassuring coaching paragraph into the insight that prepares the user for this specific friction point. Name the trigger by name. End with a direct challenge that leads into the action item.
- COMPELLING WHY insight: If any of these triggers apply (${compellingDz.length ? compellingDz.join(', ') : 'any stress or pressure triggers'}), embed armor into the insight — acknowledge the trigger by name, give the user a reframe, and close with a challenge sentence.
- CREDIBLE PLAN insight: If any of these triggers apply (${planDz.length ? planDz.join(', ') : 'any social or peer triggers'}), embed a pre-commitment strategy into the insight that names the trigger and closes with a direct if/then protocol sentence.

The armor must flow naturally as part of the insight paragraph — not as a bolted-on section. It should feel like the coach already knows them.
` : '';

  const prompt = `You are an elite achievement coach building a personalised roadmap for this goal: "${goal}"

STRICT RULES — violations will be rejected:
- NEVER suggest going outside, visiting physical locations, attending events, shows, or stores
- NEVER suggest creating a vision board on Pinterest, Canva, or any external tool — the user already has a custom Digital Vision Board (DVB) built inside this app
- NEVER tell the user to "write a description", "journal", "visualize on paper", or "create" anything — Cosmic Intentions IS the visualization and vision board tool. Direct them to use it.
- For any component that touches clarity or vision, the action must reference opening Cosmic Intentions and running a session — not an external exercise
- ALWAYS recommend online research, digital tools, apps, and at-home actions
- Be brutally specific to THIS exact goal — no generic self-help platitudes
- Every action must be something the user can do right now from their desk

TONE & VOICE (non-negotiable):
Write every insight as a calm, personal coaching paragraph spoken directly to the user — as if you already know them and have been walking beside them on this journey. No bullet lists inside insight fields. No robotic preamble. No generic self-help. Speak to THIS goal, THIS person. The paragraph should feel warm, grounded, and quietly powerful. End every insight with one direct challenge sentence — short, confident, forward-facing — that flows naturally into the yellow action item below it.

VIVID VISION SPECIAL RULE (critical):
The action for Vivid Vision must ALWAYS be exactly: "Your Digital Vision Board for this goal is already built inside Cosmic Intentions. Open it now and run a visualization session — that IS your vivid vision practice. Do it daily."
The insight must paint what life looks, feels, and means for them once this goal is achieved — specific, sensory, personal. No instructions to write or create anything.
${dzArmor}
The framework has two parts:

PART 1 — THE 6 ETERNAL PROBLEMS
Write each insight as a single conversational coaching paragraph (3–5 sentences). Specific to this goal. Warm but direct. End with a quiet challenge sentence.
- Vivid Vision — paint the achieved end state; embed danger zone armor if provided; close with challenge → action
- Compelling Why — the emotional fuel that survives adversity; embed stress/pressure armor if provided; close with challenge → action
- Credible Plan — the map and navigation habit; embed social/peer trigger armor if provided; close with challenge → action
- Feedback Loops — signal: am I on track? Close with challenge → action
- Environment Design — context over willpower. Close with challenge → action
- Identity Alignment — becoming the person who achieves this. Close with challenge → action

PART 2 — THE 9 COMPONENTS OF GOAL SUCCESS
Write each action as one direct, specific sentence this user can execute today from their desk. Add one quote from a recognisable high-achiever (Ali, Kobe, Napoleon Hill, Jocko, Hormozi, Naval, Edison, Churchill, Clear, Frankl, Eisenhower, Drucker).
- Clarity, Compelling Why, Belief, Plan, Feedback Loops, Environment Design, Accountability, Resilience, Identity Alignment

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
