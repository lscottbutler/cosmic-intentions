const { getEntCard } = require('./_entrepreneur-library');

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

  const { goal, dangerZones, entrepreneurCard } = body;
  const apiKey = process.env.OPEN_AI_KEY;

  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };
  if (!goal)   return { statusCode: 400, headers, body: JSON.stringify({ error: 'goal is required' }) };

  const dzList = Array.isArray(dangerZones) && dangerZones.length > 0 ? dangerZones : [];
  const dzNames = dzList.map(z => z.title).filter(Boolean);

  // Distribute zones across the 3 armored blocks
  const vividDz      = dzList.filter((_, i) => i % 3 === 0).map(z => z.title).filter(Boolean);
  const compellingDz = dzList.filter((_, i) => i % 3 === 1).map(z => z.title).filter(Boolean);
  const planDz       = dzList.filter((_, i) => i % 3 === 2).map(z => z.title).filter(Boolean);

  const card = getEntCard(entrepreneurCard);

  const dzBlock = dzNames.length > 0
    ? `The user has logged these personal danger zones: ${dzNames.join(', ')}. These are real, documented self-sabotage patterns — not hypothetical risks. You must call them out by name inside the relevant blocks below.`
    : `No specific danger zones logged. Write general friction armor.`;

  const cardBlock = card
    ? `ENTREPRENEUR IDENTITY CARD ACTIVE: ${card.label}
Embed this card's vocabulary naturally throughout every block: ${card.lexicon.join(', ')}.
Apply these per-block strategic frames through the "${card.label}" lens:
- VIVID VISION: ${card.strategy_rules.vivid_vision}
- COMPELLING WHY: ${card.strategy_rules.compelling_why}
- CREDIBLE PLAN: ${card.strategy_rules.credible_plan}
- FEEDBACK LOOPS: ${card.strategy_rules.feedback_loops}
- ENVIRONMENT DESIGN: ${card.strategy_rules.environment_design}
- IDENTITY ALIGNMENT: ${card.strategy_rules.identity_alignment}`
    : '';

  // Identity anchor — the bold, second-person identity declaration that opens the strategy.
  const identityPhrase = card ? `YOU ARE ${String(card.label).toUpperCase()}` : '';
  const identityBlock = identityPhrase
    ? `IDENTITY ANCHOR — The active entrepreneur identity card is "${card.label}". Open the conversation by speaking this identity directly to them and weave the phrase "${identityPhrase}" in naturally. Return it verbatim in the "identity_phrase" field.`
    : `No identity card is active — choose a fitting 2–3 word founder identity (e.g. "YOU ARE RELENTLESS") and return it in the "identity_phrase" field.`;

  // Shared voice + hard constraints injected into both passes so tone and rules stay identical.
  const persona = `You are sitting across a table from a person whose goal is: "${goal}". You know them deeply. You are not a corporate coach — you are a direct, warm, honest mentor who tells the truth and believes in them completely.`;

  const absoluteRules = `ABSOLUTE RULES — never break these:
- Never reference external tools, apps, vision boards outside this app, going to places, or physical activities
- Never say "write it down", "journal", "create a vision board" — Cosmic Intentions IS their vision board; direct them to open and run a session inside it
- Never use bullet points or numbered lists inside any insight field
- Never open with the block name or a generic preamble like "This block is about..."
- Every insight is one continuous, fused paragraph — no sub-sections, no splits`;

  // ── PASS A — one continuous founder-focused identity strategy paragraph ──
  const promptA = `${persona}

${cardBlock}

${identityBlock}

${dzBlock}

${absoluteRules}

SINGLE CONTINUOUS PARAGRAPH — Write the entire strategy as ONE flowing, highly encouraging and supportive coaching paragraph spoken directly to the founder. One unbroken paragraph — no numbers, no headers, no block titles, no labels, no bullet points, no line breaks. The reader must experience a single heartfelt talk, not stitched-together sections.

OPEN by speaking their identity in the second person, working the phrase "${identityPhrase || 'YOU ARE ...'}" in naturally near the start.

Move through this arc seamlessly, WITHOUT ever announcing the transitions or naming these themes:
- Paint what life genuinely feels like once this goal is reality — sensory, specific, personal to "${goal}".
- Let the prose naturally carry a vivid vision, a compelling why, a credible plan, honest feedback, a supportive environment, and identity alignment — woven in, never listed.
- Make an honest pivot ("But let's be honest with each other:") and name their logged danger zones${dzNames.length ? ` (${dzNames.join(', ')})` : ''} directly, framing each as live-fire resistance training — the exact moments this identity becomes their shield as they scale. Seen and understood, never judged.
- Close with a direct, confident challenge that sends them to open THE INNER CITADEL and run a visualization session right now.

Keep it warm, founder-to-founder, and genuinely supportive throughout.

Return this exact JSON structure and nothing else:
{
  "identity_phrase": "${identityPhrase || 'YOU ARE ...'}",
  "strategy_narrative": "...one continuous coaching paragraph, several sentences, no line breaks..."
}`;

  // ── PASS B — the 9 roadmap components ────────────────────────────────────
  const promptB = `${persona}

${cardBlock}

${absoluteRules}

THE 9 EXECUTIVE MILESTONES — for each component below, write one direct, executive-grade milestone or asset-runway checkpoint the founder can mark complete: a concrete proof-of-momentum toward "${goal}", not a generic tip. Add one quote from: Ali, Kobe, Napoleon Hill, Jocko, Hormozi, Naval, Edison, Churchill, Clear, Frankl, Eisenhower, or Drucker.
Each milestone must obey the ABSOLUTE RULES above, keep the same warm, direct mentor voice, and read like an executive checkpoint. No numbering, no list markers — just the milestone sentence.
Components (in this exact order): Clarity, Compelling Why, Belief, Plan, Feedback Loops, Environment Design, Accountability, Resilience, Identity Alignment

Return this exact JSON structure and nothing else:
{
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
    // Two concurrent gpt-4o-mini hits — each well under the 60s serverless ceiling.
    const [a, b] = await Promise.all([
      callOpenAI(apiKey, promptA, 4096),
      callOpenAI(apiKey, promptB, 2048),
    ]);

    if (!a.ok) return { statusCode: 502, headers, body: JSON.stringify({ error: `Strategy pass failed: ${a.error}` }) };
    if (!b.ok) return { statusCode: 502, headers, body: JSON.stringify({ error: `Components pass failed: ${b.error}` }) };

    const merged = {
      _format:            3, // single-paragraph engine marker — used to flag legacy cached data for refresh
      identity_phrase:    typeof a.parsed.identity_phrase === 'string' && a.parsed.identity_phrase.trim() ? a.parsed.identity_phrase.trim() : identityPhrase,
      strategy_narrative: typeof a.parsed.strategy_narrative === 'string' ? a.parsed.strategy_narrative.trim() : '',
      components:         Array.isArray(b.parsed.components) ? b.parsed.components : [],
    };
    return { statusCode: 200, headers, body: JSON.stringify(merged) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};

/* ── OpenAI call (gpt-4o-mini, JSON mode) ────────────────────────────────
   Returns { ok:true, parsed } on success, or { ok:false, error } so the
   handler can report exactly which pass failed without throwing. ────────── */
async function callOpenAI(apiKey, userPrompt, maxTokens) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are an elite achievement coach. Always respond with valid JSON only.' },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  const rawBody = await res.text();
  if (!res.ok) return { ok: false, error: rawBody };

  let data;
  try { data = JSON.parse(rawBody); }
  catch (e) { return { ok: false, error: 'OpenAI envelope parse failed: ' + e.message }; }

  const choice = data.choices?.[0];
  if (choice?.finish_reason === 'length') {
    return { ok: false, error: 'AI response truncated before completion — please retry' };
  }
  const text = choice?.message?.content?.trim() || '';
  if (!text) return { ok: false, error: 'Empty AI content' };

  const clean = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
  let parsed;
  try { parsed = JSON.parse(clean); }
  catch (e) { return { ok: false, error: 'Malformed AI JSON: ' + e.message }; }

  return { ok: true, parsed };
}
