/* ── roadmap-ai.js — SURGICAL AI ROADMAP ENGINE ────────────────────────────
   "Strip to the bone" sprint. This function does ONE thing: map an active
   Danger Zone to an assigned Entrepreneurial Trait (the antidote) and return a
   single, high-impact tactical paragraph.

   SURGICAL INTAKE — ingests ONLY these three fields. All pegboard noise
   (mission, values, beliefs, giant achiever, etc.) is deliberately ignored.
     • intention  — the Active Goal
     • dangerZone — the Current Friction Point (string, or {title,pitfall})
     • trait      — the assigned Entrepreneurial Trait, anchored to the
                    Entrepreneurial 30 registry in _entrepreneur-library.js
─────────────────────────────────────────────────────────────────────────── */
const { getEntCard } = require('./_entrepreneur-library');

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

  // ── Surgical intake — normalize the three inputs only ────────────────────
  const intention = String(body.intention || '').trim();
  const dz         = body.dangerZone;
  const dangerZone = String(
    (dz && typeof dz === 'object') ? (dz.pitfall ? `${dz.title || ''} — ${dz.pitfall}` : dz.title || '') : (dz || '')
  ).trim();
  const traitName  = String(body.trait || '').trim();

  if (!intention)  return { statusCode: 400, headers, body: JSON.stringify({ error: 'intention is required' }) };
  if (!dangerZone) return { statusCode: 400, headers, body: JSON.stringify({ error: 'dangerZone is required' }) };
  if (!traitName)  return { statusCode: 400, headers, body: JSON.stringify({ error: 'trait is required' }) };

  // Anchor the trait to the Entrepreneurial 30 registry. If it resolves we feed
  // the card's lexicon + identity framing as the antidote; if not, we still run
  // using the raw label so a UI typo never hard-fails generation.
  const card        = getEntCard(traitName);
  const traitLabel  = card ? card.label : traitName.toUpperCase();
  const traitAnchor = card
    ? `ANTIDOTE VOCABULARY — weave these naturally: ${card.lexicon.join(', ')}.
ANTIDOTE FRAME: ${card.strategy_rules.identity_alignment}`
    : `Treat "${traitLabel}" as the entrepreneurial antidote trait the user must operate from.`;

  const systemPrompt = `You are a behavioral execution architect. Your specialty is not motivation — it is friction removal at the identity level. You write surgically: one dense, high-impact paragraph with zero filler, zero preamble, zero lists. You speak directly to the user in the second person.`;

  const userPrompt = `INTENTION (active goal): "${intention}"

DANGER ZONE (current friction point): "${dangerZone}"

ASSIGNED ENTREPRENEURIAL TRAIT (the antidote): ${traitLabel}
${traitAnchor}

TASK: Write ONE tactical paragraph (4-6 sentences) that maps the assigned trait directly onto the danger zone as its antidote. Open by naming the exact mechanism of the friction — not the goal. Then reframe the user as someone operating from the assigned trait, and give the concrete behavioral move that trait would make at the precise moment the danger zone activates. Close with a short, forward-launching command.

ABSOLUTE RULES:
- ONE continuous prose paragraph. No bullets, no numbered lists, no headings, no line breaks.
- Do not restate the goal as a preamble. Lead with the friction mechanism.
- Never reference external tools or apps. Direct mentor voice — warm but unflinching.

Return only valid JSON, no markdown:
{ "tactical_paragraph": "..." }`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 800,
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        tactical_paragraph: parsed.tactical_paragraph || '',
        intention,
        danger_zone: dangerZone,
        trait: traitLabel
      })
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
