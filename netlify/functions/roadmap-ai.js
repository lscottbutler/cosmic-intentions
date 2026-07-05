/* ── roadmap-ai.js — AI ROADMAP ENGINE (admin-tunable prompts) ─────────────
   Turns an active goal (+ optional danger zone + the user's own "My Actions")
   into 10 deep, specific tasks.

   PROMPTS ARE LIVE-EDITABLE from the admin "AI Control Room":
     resolution order  =  request override  >  Supabase content_blocks  >  built-in default
       • prompt_roadmap_system   — the system prompt
       • prompt_roadmap_user     — the user prompt (uses {{tokens}} below)
   TOKENS the user prompt may contain (substituted at call time):
       {{intention}}    — the goal text
       {{dangerZone}}   — a formatted danger-zone block (or empty)
       {{userActions}}  — a formatted block of the user's My Actions (or empty)

   POST { mode:'defaults' }  →  returns { system, user } (for the admin UI).
   POST { intention, dangerZone?, userActions?, systemOverride?, userOverride? }
─────────────────────────────────────────────────────────────────────────── */

const SUPA_URL = 'https://wbqzwbubbeorcknevips.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicXp3YnViYmVvcmNrbmV2aXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTM3NzMsImV4cCI6MjA5MTAyOTc3M30.mF_YGj1E2ib0mEx07lkZyjgBzdGDT7saK8wofEjcqNc';

const DEFAULT_SYSTEM = `You are a world-class strategist and operator — part domain expert, part execution coach. You turn a goal into a roadmap of DEEP, SPECIFIC, expert-level actions — the kind a sharp advisor gives, never generic checklist filler. You output tasks only — no motivation, no preamble, no commentary.`;

const DEFAULT_USER = `INTENTION (active goal): "{{intention}}"
{{dangerZone}}{{userActions}}
TASK: Return the TOP 10 actions to move toward this intention.

Make them EXPERT-LEVEL and SPECIFIC — what a sharp strategist would give, not generic filler. Rules:
- UNDERSTANDING FIRST: the opening 2–3 tasks establish what the person must actually KNOW — define the core concept in this goal, explain how it really works, and map the landscape. Name the specific things to learn (e.g. "Define what a founder subscription is and study how comparable offers structure price, perks and scarcity"), never a bare "do research".
- Every task names a concrete thing: the exact concept to define, the specific decision or number to set, the real asset to build, or the actual channel/tactic. BANNED vague verbs: "research", "create a list", "use social media", "network", "develop a strategy", "explore", "identify", "leverage".
- If the user provided their own actions/notes above, build the roadmap AROUND them: incorporate, sequence and sharpen the concrete actions they listed, and answer any question they wrote.
- If a danger zone is provided above, engineer the tasks to specifically neutralize it.
- Favor non-obvious, high-leverage moves over the obvious steps anyone would list.
- Sequence: understand → decide → build → execute.
- One sharp, self-contained sentence each.

Return only valid JSON, no markdown:
{ "tasks": ["...", "...", "...", "...", "...", "...", "...", "...", "...", "..."] }`;

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

  // Admin "AI Control Room" asks for the built-in defaults (to display / reset to).
  if (body.mode === 'defaults') {
    return { statusCode: 200, headers, body: JSON.stringify({ system: DEFAULT_SYSTEM, user: DEFAULT_USER }) };
  }

  const apiKey = process.env.OPEN_AI_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };

  const intention = s(body.intention);
  const dz        = body.dangerZone;
  const dangerZone = s(
    (dz && typeof dz === 'object') ? (dz.pitfall ? `${dz.title || ''} — ${dz.pitfall}` : dz.title || '') : (dz || '')
  );
  const userActions = Array.isArray(body.userActions)
    ? body.userActions.map(a => s(a)).filter(Boolean).slice(0, 25)
    : [];

  if (!intention) return { statusCode: 400, headers, body: JSON.stringify({ error: 'intention is required' }) };

  // ── Resolve prompts: request override (admin Test) > Supabase saved > default ──
  const sysTpl  = s(body.systemOverride) || (await fetchPrompt('prompt_roadmap_system')) || DEFAULT_SYSTEM;
  const userTpl = s(body.userOverride)   || (await fetchPrompt('prompt_roadmap_user'))   || DEFAULT_USER;

  // ── Build the injectable blocks, then substitute the {{tokens}} ──────────
  const dzBlock = dangerZone
    ? `\nDANGER ZONE (the localized obstacle / execution pitfall to engineer around): "${dangerZone}"\n`
    : '';
  const uaBlock = userActions.length
    ? `\nTHE USER'S OWN ACTIONS & NOTES for this goal (their raw thinking — this is your primary source material):\n- ${userActions.join('\n- ')}\n`
    : '';
  const sub = (str) => String(str)
    .replace(/\{\{\s*intention\s*\}\}/g, intention)
    .replace(/\{\{\s*dangerZone\s*\}\}/g, dzBlock)
    .replace(/\{\{\s*userActions\s*\}\}/g, uaBlock);

  const systemPrompt = sub(sysTpl);
  const userPrompt   = sub(userTpl);

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
          { role: 'user',   content: userPrompt   },
        ],
      }),
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

    const tasks = (Array.isArray(parsed.tasks) ? parsed.tasks : [])
      .map(t => s(t)).filter(Boolean).slice(0, 10);

    return { statusCode: 200, headers, body: JSON.stringify({ tasks, intention, danger_zone: dangerZone }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
