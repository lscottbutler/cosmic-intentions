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

  // ── PASS A — the 6 founder-focused identity strategy paragraphs ──────────
  const promptA = `${persona}

${cardBlock}

${identityBlock}

${dzBlock}

${absoluteRules}

CONTINUITY — Write all 6 strategy beats as ONE seamless coaching conversation that flows from one into the next. No numbers, no headers, no block titles, no labels in the prose. The reader should feel one continuous talk, not six sections.

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

Return this exact JSON structure and nothing else:
{
  "identity_phrase": "${identityPhrase || 'YOU ARE ...'}",
  "eternal_problems": [
    { "insight": "...", "action": "..." },
    { "insight": "...", "action": "..." },
    { "insight": "...", "action": "..." },
    { "insight": "...", "action": "..." },
    { "insight": "...", "action": "..." },
    { "insight": "...", "action": "..." }
  ]
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
      _format:          2, // continuous-narrative engine marker — used to flag legacy cached data for refresh
      identity_phrase:  typeof a.parsed.identity_phrase === 'string' && a.parsed.identity_phrase.trim() ? a.parsed.identity_phrase.trim() : identityPhrase,
      eternal_problems: Array.isArray(a.parsed.eternal_problems) ? a.parsed.eternal_problems : [],
      components:       Array.isArray(b.parsed.components)       ? b.parsed.components       : [],
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
