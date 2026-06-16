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

  if (!intention) return { statusCode: 400, headers, body: JSON.stringify({ error: 'intention is required' }) };

  const systemPrompt = `You are a behavioral execution architect. You convert a goal into a flat, ruthless list of the 10 things the user can do right now to move closer to it. You output tasks only — no motivation, no preamble, no commentary, no conversational filler.`;

  // Danger zone is optional — when present, the tasks are engineered to neutralize it.
  const dzLine = dangerZone
    ? `\nDANGER ZONE (the localized obstacle / execution pitfall to engineer around): "${dangerZone}"\n`
    : '';
  const dzClause = dangerZone ? ' while specifically neutralizing the danger zone above' : '';

  const userPrompt = `INTENTION (active goal): "${intention}"
${dzLine}
TASK: Return the TOP 10 actionable things the user can do right now to move closer to accomplishing the intention${dzClause}. Each task must be:
- A direct, concrete action the user can actually execute (start with a verb).
- Sequenced roughly in the order they should be tackled.
- Self-contained — no sub-bullets, no preamble, no motivational text, no fluff.
- One short sentence each.

Return only valid JSON, no markdown:
{ "tasks": ["task 1", "task 2", "task 3", "task 4", "task 5", "task 6", "task 7", "task 8", "task 9", "task 10"] }`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1200,
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
