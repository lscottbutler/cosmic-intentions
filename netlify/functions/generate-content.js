exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { goal, pegboard } = body;
  const apiKey = process.env.OPEN_AI_KEY;

  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };
  }
  if (!goal) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'goal is required' }) };
  }

  const name          = pegboard?.['pb-name']     || 'the user';
  const beliefRaw     = pegboard?.['pb-beliefs']  || '';
  const mission       = pegboard?.['pb-mission']  || '';
  const values        = pegboard?.['pb-values']   || '';
  const beliefSystem  = detectBeliefSystem(beliefRaw);

  try {
    // ── PASS 1: Achiever Wisdom ──────────────────────────────
    const pass1Result = await callOpenAI(apiKey, {
      system: 'You are a world-class research analyst specializing in high-achievement psychology. Return only valid JSON — no markdown, no commentary.',
      user: `Goal: "${goal}"

Identify 3 famous achievers (historical or contemporary) who accomplished something in this exact domain. For each, extract the core identity belief that drove their success, their key system or strategy, and one powerful guiding principle.

Return this exact JSON structure:
{
  "achievers": [
    {
      "name": "Full Name",
      "domain": "their field of achievement",
      "identity_belief": "The core belief they held about themselves",
      "strategy": "Their primary system or method",
      "principle": "One direct principle or quote"
    }
  ]
}`
    });

    let achievers = [];
    try { achievers = JSON.parse(pass1Result).achievers || []; } catch {}

    // ── PASS 2: Sequential Roadmap ───────────────────────────
    const pass2Result = await callOpenAI(apiKey, {
      system: 'You are a precision performance coach who builds measurable, sequential action systems. Return only valid JSON — no markdown, no commentary.',
      user: `Goal: "${goal}"
Name: ${name}
Mission context: "${mission}"
Values: "${values}"

Achiever wisdom foundation:
${JSON.stringify(achievers, null, 2)}

Create a measurable 12-week sequential roadmap. Organize into 3 phases:
- Phase 1 (Weeks 1-4): Foundation & Identity Shift
- Phase 2 (Weeks 5-8): System Build & Momentum
- Phase 3 (Weeks 9-12): Acceleration & Lock-in

Each week needs: a focus theme, one daily action (under 20 words), and one measurable weekly milestone.

Return this exact JSON structure:
{
  "roadmap": {
    "phase1": { "theme": "...", "weeks": [{ "week": 1, "focus": "...", "daily_action": "...", "milestone": "..." }] },
    "phase2": { "theme": "...", "weeks": [...] },
    "phase3": { "theme": "...", "weeks": [...] }
  }
}`
    });

    let roadmap = {};
    try { roadmap = JSON.parse(pass2Result).roadmap || {}; } catch {}

    // ── PASS 3: Belief Rewrite → 13 Affirmations + Script ───
    const pass3Result = await callOpenAI(apiKey, {
      system: `You are a master manifestation architect who speaks directly to the subconscious mind. You write in ${beliefSystem.voice}. Return only valid JSON — no markdown, no commentary.`,
      user: `Goal: "${goal}"
Name: ${name}
Belief system: ${beliefSystem.label} (${beliefSystem.description})
Mission: "${mission}"
Values: "${values}"

Achiever wisdom:
${JSON.stringify(achievers, null, 2)}

12-week roadmap:
${JSON.stringify(roadmap, null, 2)}

Using EVERYTHING above, generate:

1. Exactly 13 "I AM" affirmations — one per visualization scene. Each must:
   - Begin with "I AM"
   - Be written in present tense as if already achieved
   - Be 8-15 words long
   - Escalate in power from scene 1 (grounding) to scene 13 (peak identity)
   - Reflect the ${beliefSystem.label} worldview

2. Exactly 3 mental attitudes — the psychological stances ${name} must adopt. Each must:
   - Have a short label (2-4 words)
   - Have a one-sentence description explaining why this attitude drives the goal
   - Be grounded in the achiever wisdom above

3. Exactly 5 active beliefs — short, declarative present-tense statements (not "I AM") that rewire the self-concept. Each must:
   - Be 8-16 words
   - Feel like an undeniable truth, not a wish
   - Reflect the ${beliefSystem.label} worldview

4. A 10-minute spoken visualization script for ${name} that:
   - Opens with a 60-second breathing/grounding sequence
   - Walks through the achievement as if it's already real
   - Weaves in 2-3 of the achiever principles naturally
   - References the roadmap milestones as already completed memories
   - Closes with an identity lock-in statement
   - Is written in second person ("You are...", "You feel...")
   - Flows at speaking pace for exactly 10 minutes (~1400 words)

Return this exact JSON structure:
{
  "affirmations": [
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ...",
    "I AM ..."
  ],
  "mental_attitudes": [
    { "label": "short label", "description": "one sentence" },
    { "label": "short label", "description": "one sentence" },
    { "label": "short label", "description": "one sentence" }
  ],
  "active_beliefs": [
    "declarative belief statement",
    "declarative belief statement",
    "declarative belief statement",
    "declarative belief statement",
    "declarative belief statement"
  ],
  "script": "Full 10-minute script here..."
}`
    }, 4096);

    let affirmations = [];
    let mental_attitudes = [];
    let active_beliefs = [];
    let script = '';
    try {
      const parsed = JSON.parse(pass3Result);
      affirmations     = parsed.affirmations     || [];
      mental_attitudes = parsed.mental_attitudes || [];
      active_beliefs   = parsed.active_beliefs   || [];
      script           = parsed.script           || '';
    } catch {}

    // Pad or trim affirmations to exactly 13
    while (affirmations.length < 13) affirmations.push(`I AM aligned with my highest purpose.`);
    affirmations = affirmations.slice(0, 13);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        affirmations,
        mental_attitudes,
        active_beliefs,
        script,
        achievers,
        roadmap,
        belief_system: beliefSystem.label,
        goal,
        generated_at: new Date().toISOString()
      })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

/* ── Belief system detector ──────────────────────────────── */
function detectBeliefSystem(beliefsText) {
  const t = (beliefsText || '').toLowerCase();

  if (/universe|law of attraction|manifestation|vibration|energy|quantum/i.test(t)) {
    return {
      label: 'Universe / Law of Attraction',
      description: 'belief that thoughts and energy attract matching reality',
      voice: 'the language of universal law, vibrational alignment, and co-creation'
    };
  }
  if (/god|jesus|christ|faith|prayer|scripture|bible|spiritual|holy/i.test(t)) {
    return {
      label: 'Faith / God',
      description: 'belief that purpose is divinely ordained and prayer activates destiny',
      voice: 'the language of faith, divine purpose, and spiritual authority'
    };
  }
  if (/science|neuro|brain|psychology|habit|system|evidence|research|data/i.test(t)) {
    return {
      label: 'Science / Neuroscience',
      description: 'belief that identity change is neurological and measurable',
      voice: 'the language of neuroscience, habit formation, and cognitive identity'
    };
  }
  if (/stoic|stoicism|discipline|control|virtue|marcus|epictetus/i.test(t)) {
    return {
      label: 'Stoicism / Philosophy',
      description: 'belief that virtue and disciplined action determine outcome',
      voice: 'the language of stoic philosophy, disciplined will, and virtue'
    };
  }

  // Default: universal / non-denominational
  return {
    label: 'Universal Principles',
    description: 'belief in the power of focused intention and consistent action',
    voice: 'direct, conviction-based language that speaks to identity and potential'
  };
}

/* ── OpenAI API caller (gpt-4o-mini, JSON mode) — matches map-ai.js / bbfw.js ── */
async function callOpenAI(apiKey, { system, user }, maxTokens = 2048) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}
