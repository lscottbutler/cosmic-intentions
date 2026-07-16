const { guard } = require('./_guard');

exports.handler = async (event) => {
  const g = await guard(event, { requireAuth: true });
  if (!g.ok) return g.response;
  const headers = g.headers;
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { goal } = body;
  const apiKey = process.env.OPEN_AI_KEY;

  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };
  if (!goal)   return { statusCode: 400, headers, body: JSON.stringify({ error: 'goal is required' }) };

  // Split into two parallel calls so each finishes fast and stays well under token limits
  const prompt1 = buildPrompt1(goal);
  const prompt2 = buildPrompt2(goal);

  try {
    const [part1, part2] = await Promise.all([
      callOpenAI(apiKey, prompt1),
      callOpenAI(apiKey, prompt2)
    ]);

    const p1 = JSON.parse(part1.replace(/^```json\s*/,'').replace(/```$/,'').trim());
    const p2 = JSON.parse(part2.replace(/^```json\s*/,'').replace(/```$/,'').trim());

    const result = { ...p1, ...p2 };
    if (!result.thisWeek && !result.dangerZones) throw new Error('Bad response format');

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};

/* ── PROMPT 1: Action layer (thisWeek + dangerZones) ── */
function buildPrompt1(goal) {
  return `Goal: "${goal}"

Build the ACTION LAYER for this goal. Be brutally specific — no generic advice. All actions doable from desk/home only.

J# NUMBERING: Number journal items sequentially from J1. Only items requiring personal written reflection get a J#.

SECTION 1 — THIS WEEK (4-6 weekly commitments, NOT daily tasks)
Use "By Friday I will have..." or "This week I will..." language. YES/NO at week's end.

SECTION 2 — DANGER ZONES (4-5 IF/THEN behavioral triggers)
Real failure patterns, not sanitized. Each needs: title (3-5 words), pitfall (2 brutal sentences), warning (early signal), ifTrigger (IF...), thenAction (THEN... no exceptions), j (number), journalText (J[n] — Write: ...).

Return ONLY this JSON, no markdown:
{
  "thisWeek": [
    { "j": null, "text": "By Friday I will have...", "isJournal": false },
    { "j": 1, "text": "J1 — Write: ...", "isJournal": true }
  ],
  "dangerZones": [
    { "title": "...", "pitfall": "...", "warning": "...", "ifTrigger": "IF ...", "thenAction": "THEN ...", "j": 2, "journalText": "J2 — Write: ..." }
  ]
}`;
}

/* ── PROMPT 2: Identity + Practice layer ── */
function buildPrompt2(goal) {
  return `Goal: "${goal}"

Build the IDENTITY & PRACTICE LAYER. Be brutally specific and goal-specific. Continue J# numbering from J6 onward.

MINDSET AUDIT: currentAttitudes (3-4 limiting beliefs they likely hold NOW), toInstall (3-4 replacement identity beliefs), recitations (6-8 daily affirmations — bold, quiet, grateful, identity frequencies), prayer (one 4-6 sentence sacred intention paragraph).

THIS MONTH (5-7 monthly milestones — bigger than weekly, some isJournal).

THE TERRAIN (7-10 domains/capabilities to master forever — mix knowledge and identity, deep ones are isJournal).

PRACTICE FEED: vizAffirmations (8-10 visualization affirmations), gratitudeItems (5-7 things grateful for NOW before achieving it), meditationFocus (4-6 sentence sensory present-tense meditation), weeklyQuestion (one uncomfortable Friday reflection question).

Return ONLY this JSON, no markdown:
{
  "mindset": {
    "currentAttitudes": ["...", "..."],
    "toInstall": ["...", "..."],
    "recitations": ["...", "...", "...", "...", "...", "..."],
    "prayer": "..."
  },
  "thisMonth": [
    { "j": null, "text": "...", "isJournal": false },
    { "j": 6, "text": "J6 — Write: ...", "isJournal": true }
  ],
  "terrain": [
    { "j": null, "text": "...", "isJournal": false },
    { "j": 10, "text": "J10 — Write: ...", "isJournal": true }
  ],
  "practice": {
    "vizAffirmations": ["...", "...", "...", "...", "...", "...", "...", "..."],
    "gratitudeItems": ["...", "...", "...", "...", "..."],
    "meditationFocus": "...",
    "weeklyQuestion": "..."
  }
}`;
}

/* ── OpenAI call (gpt-4o-mini, JSON mode) — matches bbfw.js ── */
async function callOpenAI(apiKey, userPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 3000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a world-class personal development architect. Respond with valid JSON only — no markdown, no commentary.' },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  const rawBody = await res.text();
  if (!res.ok) throw new Error(rawBody);
  let data;
  try {
    data = JSON.parse(rawBody);
  } catch (e) {
    throw new Error('OpenAI envelope parse failed: ' + e.message);
  }
  const choice = data.choices?.[0];
  if (choice?.finish_reason === 'length') {
    throw new Error('AI response truncated before completion');
  }
  return choice?.message?.content?.trim() || '';
}
