/* ── roadmap-ai.js — SURGICAL AI ROADMAP ENGINE ────────────────────────────
   "Strip to the bone" sprint. This function does ONE thing: turn an active
   goal + its localized friction point into a flat list of the top 10
   actionable tactical tasks. No paragraphs, no preamble, no fluff.

   SURGICAL INTAKE — ingests ONLY these two fields. All other pegboard noise
   (mission, values, beliefs, traits, identity cards) is deliberately ignored.
     • intention  — the Active Goal text
     • dangerZone — the localized obstacle / execution pitfall (string, or
                    {title,pitfall})
─────────────────────────────────────────────────────────────────────────── */
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const apiKey = process.env.OPEN_AI_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };

  // ── Surgical intake — normalize the two inputs only ──────────────────────
  const intention = String(body.intention || '').trim();
  const dz         = body.dangerZone;
  const dangerZone = String(
    (dz && typeof dz === 'object') ? (dz.pitfall ? `${dz.title || ''} — ${dz.pitfall}` : dz.title || '') : (dz || '')
  ).trim();

  // The user's OWN actions/notes for this goal (from "My Actions") — raw source material.
  const userActions = Array.isArray(body.userActions)
    ? body.userActions.map(a => String(a || '').trim()).filter(Boolean).slice(0, 25)
    : [];

  if (!intention) return { statusCode: 400, headers, body: JSON.stringify({ error: 'intention is required' }) };

  const systemPrompt = `You are a world-class strategist and operator — part domain expert, part execution coach. You turn a goal into a roadmap of DEEP, SPECIFIC, expert-level actions — the kind a sharp advisor gives, never generic checklist filler. You output tasks only — no motivation, no preamble, no commentary.`;

  // Danger zone is optional — when present, the tasks are engineered to neutralize it.
  const dzLine = dangerZone
    ? `\nDANGER ZONE (the localized obstacle / execution pitfall to engineer around): "${dangerZone}"\n`
    : '';
  const dzClause = dangerZone ? ' while specifically neutralizing the danger zone above' : '';

  // The user's own actions/notes become the SOURCE MATERIAL the roadmap is built around.
  const uaBlock = userActions.length
    ? `\nTHE USER'S OWN ACTIONS & NOTES for this goal (their raw thinking — this is your primary source material):\n- ${userActions.join('\n- ')}\n`
    : '';
  const uaClause = userActions.length
    ? ' Build the roadmap AROUND the user\'s own actions/notes above: incorporate, sequence and sharpen the concrete actions they listed, and wherever they wrote a question or uncertainty (e.g. "how do founder subs work"), include a task that directly answers or resolves it.'
    : '';

  const userPrompt = `INTENTION (active goal): "${intention}"
${dzLine}${uaBlock}
TASK: Return the TOP 10 actions to move toward this intention${dzClause}.${uaClause}

Make them EXPERT-LEVEL and SPECIFIC — what a sharp strategist would give, not generic filler. Rules:
- UNDERSTANDING FIRST: the opening 2–3 tasks establish what the person must actually KNOW — define the core concept in this goal, explain how it really works, and map the landscape. Name the specific things to learn (e.g. "Define what a founder subscription is and study how [comparable offers] structure price, perks and scarcity"), never a bare "do research".
- Every task names a concrete thing: the exact concept to define, the specific decision or number to set, the real asset to build, or the actual channel/tactic. BANNED vague verbs: "research", "create a list", "use social media", "network", "develop a strategy", "explore", "identify", "leverage".
- Favor non-obvious, high-leverage moves over the obvious steps anyone would list.
- Sequence: understand → decide → build → execute.
- One sharp, self-contained sentence each.

Return only valid JSON, no markdown:
{ "tasks": ["...", "...", "...", "...", "...", "...", "...", "...", "...", "..."] }`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1500,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   }
        ]
      })
    });

    const rawBody = await res.text();
    if (!res.ok) return { statusCode: 502, headers, body: JSON.stringify({ error: rawBody }) };

    const data = JSON.parse(rawBody);
    if (data.choices?.[0]?.finish_reason === 'length') {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'AI response truncated — retry' }) };
    }

    const content = data.choices?.[0]?.message?.content?.trim() || '';
    const clean   = content.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    const parsed  = JSON.parse(clean);

    // Normalize to a clean array of exactly up to 10 non-empty task strings.
    const tasks = (Array.isArray(parsed.tasks) ? parsed.tasks : [])
      .map(t => String(t || '').trim())
      .filter(Boolean)
      .slice(0, 10);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ tasks, intention, danger_zone: dangerZone })
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
