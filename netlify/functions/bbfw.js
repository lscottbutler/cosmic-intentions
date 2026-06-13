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

  const dzList = Array.isArray(dangerZones) && dangerZones.length > 0 ? dangerZones : [];
  const dzNames = dzList.map(z => z.title).filter(Boolean);

  // Distribute zones across the 3 armored blocks
  const vividDz      = dzList.filter((_, i) => i % 3 === 0).map(z => z.title).filter(Boolean);
  const compellingDz = dzList.filter((_, i) => i % 3 === 1).map(z => z.title).filter(Boolean);
  const planDz       = dzList.filter((_, i) => i % 3 === 2).map(z => z.title).filter(Boolean);

  const dzBlock = dzNames.length > 0
    ? `The user has logged these personal danger zones: ${dzNames.join(', ')}. These are real, documented self-sabotage patterns — not hypothetical risks. You must call them out by name inside the relevant blocks below.`
    : `No specific danger zones logged. Write general friction armor.`;

  const prompt = `You are sitting across a table from a person whose goal is: "${goal}". You know them deeply. You are not a corporate coach — you are a direct, warm, honest mentor who tells the truth and believes in them completely.

${dzBlock}

ABSOLUTE RULES — never break these:
- Never reference external tools, apps, vision boards outside this app, going to places, or physical activities
- Never say "write it down", "journal", "create a vision board" — Cosmic Intentions IS their vision board; direct them to open and run a session inside it
- Never use bullet points or numbered lists inside any insight field
- Never open with the block name or a generic preamble like "This block is about..."
- Every insight is one continuous, fused paragraph — no sub-sections, no splits

NARRATIVE ARCHITECTURE FOR EVERY INSIGHT BLOCK:
Each insight must follow this exact 3-part fused structure — all in one unbroken paragraph:

  PART 1 — THE GROUNDING: Open by painting what life genuinely feels like living this goal as reality. Sensory, specific, personal to THIS goal. 2–3 sentences.

  PART 2 — THE HONEST PIVOT (DANGER ZONE ARMOR): Immediately pivot — no new paragraph — with language like "But let's be honest with each other:" or "Here is where we need to have a real conversation:" then call out their specific logged danger zones by name as the exact moments this vision acts as a shield. Make the user feel seen and understood, not judged. This must be raw and real.

  PART 3 — THE UNIFIED CHALLENGE: In the same breath, close with a direct, confident challenge sentence that leads straight into the action item below. No softness. Short. Forward.

EXAMPLE of the target output for VIVID VISION (replicate this structure and emotional register for all 6 blocks):
"Waking up every day knowing you are deeply abundant, surrounded by freedom, isn't just a fantasy — it is your native state. The weight of old worries is gone, replaced by pure empowerment. But let's have an honest conversation: this mindset isn't built for the easy hours when everything is going perfectly. It is a shield forged specifically for when your guard drops — like during those quiet evenings on the couch when the temptation for mindless Evening Snacking creeps in, or when an open, unstructured weekend threatens to become a Weekend Binge that pulls you completely off course. You must sit with this vision so deeply that it overpowers those temporary traps. I challenge you to step into this power right now."

VIVID VISION ACTION (use this exact text, no variation):
"Your Digital Vision Board for this goal is already built inside THE INNER CITADEL. Open it now and run a visualization session — that IS your vivid vision practice. Do it daily."

THE 6 BLOCKS — write each insight using the 3-part fused architecture above:

1. VIVID VISION — paint the achieved end state; armor against: ${vividDz.length ? vividDz.join(' and ') : 'habitual/evening triggers'}; close with challenge
2. COMPELLING WHY — emotional fuel that survives adversity; armor against: ${compellingDz.length ? compellingDz.join(' and ') : 'stress and pressure triggers'}; close with challenge
3. CREDIBLE PLAN — map and navigation habit; armor against: ${planDz.length ? planDz.join(' and ') : 'social and peer triggers'}; close with challenge
4. FEEDBACK LOOPS — signal: am I on track? Armor against drift and complacency. Close with challenge.
5. ENVIRONMENT DESIGN — context shapes behavior more than willpower. Armor against environmental triggers. Close with challenge.
6. IDENTITY ALIGNMENT — becoming the person who achieves this. Armor against identity drift. Close with challenge.

THE 9 COMPONENTS — one direct executable action sentence per component, plus one quote from: Ali, Kobe, Napoleon Hill, Jocko, Hormozi, Naval, Edison, Churchill, Clear, Frankl, Eisenhower, or Drucker.
Components: Clarity, Compelling Why, Belief, Plan, Feedback Loops, Environment Design, Accountability, Resilience, Identity Alignment

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
