/* ── roadmap-videos.js — "LEARN FROM THE GREATS" ──────────────────────────
   For a goal, finds REAL YouTube videos of famous / successful people who have
   actually achieved something like it.

   Two steps (avoids LLM link hallucination):
     1. gpt-4o names 5 people + a precise search query for each (it's great at
        this). Prompt is admin-tunable: request override > Supabase
        (prompt_roadmap_videos) > built-in default. Tokens: {{intention}} {{userActions}}
     2. YouTube Data API v3 search.list turns each query into a REAL top video.

   Env: OPEN_AI_KEY, YOUTUBE_API_KEY.
   POST { mode:'defaults' } → { prompt }.
   POST { intention, userActions?, promptOverride? } → { videos:[…] }.
─────────────────────────────────────────────────────────────────────────── */

const SUPA_URL = 'https://wbqzwbubbeorcknevips.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicXp3YnViYmVvcmNrbmV2aXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTM3NzMsImV4cCI6MjA5MTAyOTc3M30.mF_YGj1E2ib0mEx07lkZyjgBzdGDT7saK8wofEjcqNc';

const DEFAULT_PROMPT = `GOAL: "{{intention}}"
{{userActions}}
Name 5 famous, genuinely accomplished, REAL people who have actually achieved a goal like this (recognizable names — founders, athletes, experts, public figures). For each, write ONE precise YouTube search query (their name + the specific topic) that would surface a strong talk, interview, or breakdown where THEY explain how they did it. Prefer specific, well-known talks over generic ones.

Return only valid JSON, no markdown:
{ "items": [ { "person": "Full Name", "query": "search query" } ] }`;

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

  const openKey = process.env.OPEN_AI_KEY;
  const ytKey   = process.env.YOUTUBE_API_KEY;
  if (!openKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };
  if (!ytKey)   return { statusCode: 500, headers, body: JSON.stringify({ error: 'YOUTUBE_API_KEY not configured' }) };

  const intention = s(body.intention);
  if (!intention) return { statusCode: 400, headers, body: JSON.stringify({ error: 'intention is required' }) };
  const userActions = Array.isArray(body.userActions) ? body.userActions.map(a => s(a)).filter(Boolean).slice(0, 25) : [];

  // ── Step 1: gpt-4o → people + search queries (prompt is admin-tunable) ──
  const tpl = s(body.promptOverride) || (await fetchPrompt('prompt_roadmap_videos')) || DEFAULT_PROMPT;
  const uaBlock = userActions.length ? `THE USER'S OWN NOTES: ${userActions.join('; ')}\n` : '';
  const prompt = tpl
    .replace(/\{\{\s*intention\s*\}\}/g, intention)
    .replace(/\{\{\s*userActions\s*\}\}/g, uaBlock);

  let items = [];
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.6, max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You suggest real, famous people and precise YouTube search queries. Output JSON only.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const raw = await r.text();
    if (!r.ok) return { statusCode: 502, headers, body: JSON.stringify({ error: raw }) };
    const parsed = JSON.parse(JSON.parse(raw).choices?.[0]?.message?.content || '{}');
    items = (Array.isArray(parsed.items) ? parsed.items : [])
      .map(i => ({ person: s(i && i.person), query: s(i && i.query) }))
      .filter(i => i.query).slice(0, 5);
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'query step failed: ' + (e.message || e) }) };
  }

  // ── Step 2: each query → a REAL top video via YouTube Data API ──────────
  const videos = [];
  const seen = new Set();
  for (const it of items) {
    try {
      const u = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&safeSearch=moderate&q=${encodeURIComponent(it.query)}&key=${ytKey}`;
      const yr = await fetch(u);
      if (!yr.ok) continue;
      const yd = await yr.json();
      const item = yd.items && yd.items[0];
      const vid = item && item.id && item.id.videoId;
      if (!vid || seen.has(vid)) continue;
      seen.add(vid);
      const sn = item.snippet || {};
      videos.push({
        person: it.person,
        title: s(sn.title),
        channel: s(sn.channelTitle),
        videoId: vid,
        url: `https://www.youtube.com/watch?v=${vid}`,
        thumbnail: (sn.thumbnails && (sn.thumbnails.medium || sn.thumbnails.default) || {}).url || '',
      });
    } catch (e) { /* skip a failed query */ }
  }

  return { statusCode: 200, headers, body: JSON.stringify({ videos }) };
};
