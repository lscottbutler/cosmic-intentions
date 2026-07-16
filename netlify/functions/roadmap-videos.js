/* ── roadmap-videos.js — "LEARN FROM THE GREATS" (mixed primary sources) ───
   For a goal, returns a curated shelf of REAL learning resources:
     🎬 videos   — YouTube Data API (real videos of famous domain experts)
     🌐 sources  — official homepages (gpt-4o knows real root domains)
     📄 articles — precise Google-search links to authoritative reads
     🎧 podcasts — precise search links

   No hallucinated URLs: videos come from the YouTube API; article/podcast
   links are searches; official sources are validated root domains.

   Prompt is admin-tunable: request override > Supabase (prompt_roadmap_videos)
   > built-in default. Tokens: {{intention}} {{userActions}}.
   Env: OPEN_AI_KEY, YOUTUBE_API_KEY.
   POST { mode:'defaults' } → { prompt }.
─────────────────────────────────────────────────────────────────────────── */

const SUPA_URL = 'https://wbqzwbubbeorcknevips.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicXp3YnViYmVvcmNrbmV2aXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTM3NzMsImV4cCI6MjA5MTAyOTc3M30.mF_YGj1E2ib0mEx07lkZyjgBzdGDT7saK8wofEjcqNc';

const DEFAULT_PROMPT = `GOAL: "{{intention}}"
{{userActions}}
STEP 1 (think silently): Infer the REAL skill/domain behind this goal — ignore the "I AM" phrasing and identify what the person is actually trying to DO or BECOME.

STEP 2: Return a curated set of the BEST primary-source learning resources for THAT domain — real, on-topic, high-signal only:
- "videos": 3 famous, genuinely accomplished domain experts. Each = {"person","query"} where query is a precise YouTube search for a strong talk/interview where THEY explain how to do this.
- "sources": up to 2 official primary sources. Each = {"name","url"} = the real, well-known official HOMEPAGE (root domain, e.g. https://xiaomi.com) of the key company/person/org for this domain. Only include a URL you are confident is the real official site; if unsure, omit it.
- "articles": 2 authoritative deep reads. Each = {"label","query"} where query is a precise search phrase to find a great article/breakdown.
- "podcasts": 1 relevant podcast or episode = {"label","query"} — a precise search phrase to find it.

Return only valid JSON, no markdown:
{ "videos":[{"person":"","query":""}], "sources":[{"name":"","url":""}], "articles":[{"label":"","query":""}], "podcasts":[{"label":"","query":""}] }`;

const s = (x) => (typeof x === 'string' ? x.trim() : '');
const decode = (t) => s(t)
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const gsearch = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
const cleanUrl = (u) => {
  u = s(u);
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
  return /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(u) ? u : '';
};

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

const { guard } = require('./_guard');

exports.handler = async (event) => {
  const g = await guard(event, { requireAuth: true });
  if (!g.ok) return g.response;
  const headers = g.headers;
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

  const intention = s(body.intention);
  if (!intention) return { statusCode: 400, headers, body: JSON.stringify({ error: 'intention is required' }) };
  const userActions = Array.isArray(body.userActions) ? body.userActions.map(a => s(a)).filter(Boolean).slice(0, 25) : [];

  // ── Step 1: gpt-4o → a curated resource plan (prompt is admin-tunable) ──
  const tpl = s(body.promptOverride) || (await fetchPrompt('prompt_roadmap_videos')) || DEFAULT_PROMPT;
  const uaBlock = userActions.length ? `THE USER'S OWN NOTES: ${userActions.join('; ')}\n` : '';
  const prompt = tpl
    .replace(/\{\{\s*intention\s*\}\}/g, intention)
    .replace(/\{\{\s*userActions\s*\}\}/g, uaBlock);

  let plan = {};
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.6, max_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You curate real, famous experts and precise search terms, and real official homepages. Output JSON only.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const raw = await r.text();
    if (!r.ok) return { statusCode: 502, headers, body: JSON.stringify({ error: raw }) };
    plan = JSON.parse(JSON.parse(raw).choices?.[0]?.message?.content || '{}');
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'plan step failed: ' + (e.message || e) }) };
  }

  const resources = [];

  // 🎬 Videos — real, via YouTube Data API (skip gracefully if no key)
  const vitems = (Array.isArray(plan.videos) ? plan.videos : [])
    .map(i => ({ person: s(i && i.person), query: s(i && i.query) })).filter(i => i.query).slice(0, 3);
  if (ytKey) {
    const seen = new Set();
    for (const it of vitems) {
      try {
        const u = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&safeSearch=moderate&q=${encodeURIComponent(it.query)}&key=${ytKey}`;
        const yr = await fetch(u);
        if (!yr.ok) continue;
        const item = (await yr.json()).items?.[0];
        const vid = item && item.id && item.id.videoId;
        if (!vid || seen.has(vid)) continue;
        seen.add(vid);
        const sn = item.snippet || {};
        resources.push({
          type: 'video', title: decode(sn.title), subtitle: it.person || decode(sn.channelTitle),
          url: `https://www.youtube.com/watch?v=${vid}`,
          thumbnail: (sn.thumbnails && (sn.thumbnails.medium || sn.thumbnails.default) || {}).url || '',
        });
      } catch (e) { /* skip */ }
    }
  }

  // 🌐 Official sources — validated root domains straight from gpt-4o
  (Array.isArray(plan.sources) ? plan.sources : []).slice(0, 2).forEach(x => {
    const url = cleanUrl(x && x.url);
    if (url) resources.push({ type: 'source', title: s(x.name) || url.replace(/^https?:\/\//, ''), subtitle: 'Official source', url });
  });

  // 📄 Articles — precise Google-search links (always real results)
  (Array.isArray(plan.articles) ? plan.articles : []).slice(0, 2).forEach(x => {
    const q = s(x && x.query);
    if (q) resources.push({ type: 'article', title: s(x.label) || q, subtitle: 'Article', url: gsearch(q) });
  });

  // 🎧 Podcasts — precise search link
  (Array.isArray(plan.podcasts) ? plan.podcasts : []).slice(0, 1).forEach(x => {
    const q = s(x && x.query);
    if (q) resources.push({ type: 'podcast', title: s(x.label) || q, subtitle: 'Podcast', url: gsearch(q + ' podcast') });
  });

  return { statusCode: 200, headers, body: JSON.stringify({ resources }) };
};
