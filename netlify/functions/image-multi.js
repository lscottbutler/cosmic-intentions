// Vision-board images (multiple): extract a concrete keyword from an "I AM"
// statement via OpenAI, then fetch N matching high-quality photos from Unsplash
// for a slow-dissolve slideshow.
// Env: OPEN_AI_KEY (keyword extraction), UNSPLASH_ACCESS_KEY (image search).
const { guard } = require('./_guard');

exports.handler = async (event) => {
  const g = await guard(event, { requireAuth: true });
  if (!g.ok) return g.response;
  const headers = g.headers;
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { statement, count } = JSON.parse(event.body || '{}');
    if (!statement) return { statusCode: 400, body: 'Missing statement' };
    const n = Math.min(Math.max(parseInt(count, 10) || 5, 1), 10);

    // 1) Extract a concrete, photographable keyword (same logic as image-search).
    const STOP = /^(?:the|a|an|my|your|our|his|her|their|proud|owner|of|becoming|going|to|be|now|truly|really|so|very|finally|already)\b[\s,]*/i;
    let keyword = statement.replace(/^\s*i\s*am\s+/i, '');
    while (STOP.test(keyword)) keyword = keyword.replace(STOP, '');
    keyword = keyword.trim() || statement;
    try {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini', max_tokens: 20, temperature: 0.3,
          messages: [{ role: 'user', content: `You pick a stock-photo search query for a vision board. From the goal below, return the single most concrete, photographable SUBJECT (1-3 words) — the tangible thing or scene that represents it being achieved. Prefer specific objects/places/people over abstract words. Return ONLY the query — no quotes, no punctuation, no preamble.\n\nGoal: "${statement}"` }]
        })
      });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const k = aiData.choices?.[0]?.message?.content?.trim();
        if (k) keyword = k.replace(/^["']+|["']+$/g, '');
      }
    } catch (e) { /* keep deterministic fallback keyword */ }

    // 2) Fetch N landscape images from Unsplash.
    const key = process.env.UNSPLASH_ACCESS_KEY;
    if (!key) return { statusCode: 500, body: 'UNSPLASH_ACCESS_KEY not set' };

    const uRes = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=${n}&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!uRes.ok) {
      const err = await uRes.text();
      return { statusCode: uRes.status, body: err };
    }
    const data = await uRes.json();
    const urls = (data.results || [])
      .map(p => (p.urls && (p.urls.regular || p.urls.full || p.urls.small)) || null)
      .filter(Boolean)
      .slice(0, n);
    if (!urls.length) {
      return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'No images found', keyword }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls, keyword })
    };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
