/* ── roadmap-drilldown.js — "BREAK IT DOWN" (recursive depth engine) ───────
   Expands ONE action into 4–6 concrete sub-steps. Tight scope + the breadcrumb
   path (Goal → parent → this action) = the deeper you go, the sharper it gets.

   Admin-tunable: request override > Supabase (prompt_roadmap_drilldown) > default.
   Tokens: {{goal}} {{action}} {{breadcrumb}} {{userNotes}}
   POST { mode:'defaults' } → { prompt }.
   POST { goal, action, breadcrumb?, userNotes?, promptOverride? } → { steps:[…] }.
─────────────────────────────────────────────────────────────────────────── */

const SUPA_URL = 'https://wbqzwbubbeorcknevips.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicXp3YnViYmVvcmNrbmV2aXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTM3NzMsImV4cCI6MjA5MTAyOTc3M30.mF_YGj1E2ib0mEx07lkZyjgBzdGDT7saK8wofEjcqNc';

const DEFAULT_PROMPT = `OVERALL GOAL: "{{goal}}"
PATH SO FAR: {{breadcrumb}}
THE ACTION TO BREAK DOWN: "{{action}}"
{{userNotes}}
Break THE ACTION above into 4–6 concrete, granular sub-steps the person can execute now. Rules:

1. Each sub-step names a SPECIFIC thing — the exact tool, number, source, decision, or asset. BANNED vague verbs: "research", "explore", "identify", "leverage", "develop a strategy", "use social media".

2. If the action is a question (e.g. "how do founder subs work?"), turn it into concrete steps that ANSWER it.

3. Stay tightly scoped to THIS action only — do NOT restate the whole goal or drift up a level.

4. Sequence them in the order to do them. One sharp, self-contained sentence each.

Return only valid JSON, no markdown:
{ "steps": ["...", "...", "...", "..."] }`;

const s = (x) => (typeof x === 'string' ? x.trim() : '');

async function fetchPrompt(slug) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/content_blocks?slug=eq.${slug}&select=body`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
    });
    if (!r.ok) return '';
    const rows = await r.json();
    return s(rows && rows[0] && rows[0].body);
  } catch { return ''; }
}

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

  if (body.mode === 'defaults') {
    return { statusCode: 200, headers, body: JSON.stringify({ prompt: DEFAULT_PROMPT }) };
  }

  const apiKey = process.env.OPEN_AI_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };

  const goal   = s(body.goal);
  const action = s(body.action);
  if (!action) return { statusCode: 400, headers, body: JSON.stringify({ error: 'action is required' }) };

  const crumbs = Array.isArray(body.breadcrumb) ? body.breadcrumb.map(s).filter(Boolean) : [];
  const notes  = Array.isArray(body.userNotes)  ? body.userNotes.map(s).filter(Boolean).slice(0, 20) : [];
  const breadcrumb = crumbs.length ? crumbs.join(' → ') : '(top level)';
  const userNotes  = notes.length ? `The user's other notes for this goal: ${notes.join('; ')}\n` : '';

  const tpl = s(body.promptOverride) || (await fetchPrompt('prompt_roadmap_drilldown')) || DEFAULT_PROMPT;
  const userPrompt = tpl
    .replace(/\{\{\s*goal\s*\}\}/g, goal)
    .replace(/\{\{\s*action\s*\}\}/g, action)
    .replace(/\{\{\s*breadcrumb\s*\}\}/g, breadcrumb)
    .replace(/\{\{\s*userNotes\s*\}\}/g, userNotes);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.7, max_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a surgical execution coach. You break ONE action into concrete, specific sub-steps. Output JSON only — no preamble.' },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    const raw = await res.text();
    if (!res.ok) return { statusCode: 502, headers, body: JSON.stringify({ error: raw }) };
    const parsed = JSON.parse(JSON.parse(raw).choices?.[0]?.message?.content || '{}');
    const steps = (Array.isArray(parsed.steps) ? parsed.steps : []).map(s).filter(Boolean).slice(0, 6);
    return { statusCode: 200, headers, body: JSON.stringify({ steps }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
