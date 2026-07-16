// Vision-board image: extract a concrete keyword from an "I AM" statement via
// OpenAI, then fetch a matching stock photo from Pexels.
// Env: OPEN_AI_KEY (keyword extraction), PEXELS_API_KEY (image search).
const { guard } = require('./_guard');

exports.handler = async (event) => {
  const g = await guard(event, { requireAuth: false });
  if (!g.ok) return g.response;
  const headers = g.headers;
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { statement } = JSON.parse(event.body || '{}');
    if (!statement) return { statusCode: 400, body: 'Missing statement' };

    // 1) Extract a single concrete, physical search keyword via OpenAI.
    //    Deterministic fallback: drop the "I am" lead-in, then peel off any run
    //    of leading filler words, so Pexels gets the goal's core subject even if
    //    the AI call is unavailable (e.g. quota). The old regex required the
    //    filler group to match, so goals like "I AM PERFECT EYE HEALTH" fell
    //    through unchanged and Pexels full-text-matched a random photo.
    const STOP = /^(?:the|a|an|my|your|our|his|her|their|proud|owner|of|becoming|going|to|be|now|truly|really|so|very|finally|already)\b[\s,]*/i;
    let keyword = statement.replace(/^\s*i\s*am\s+/i, '');
    while (STOP.test(keyword)) keyword = keyword.replace(STOP, '');
    keyword = keyword.trim() || statement;
    try {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 20,
          temperature: 0.3,
          messages: [{
            role: 'user',
            content: `You pick a stock-photo search query for a vision board. From the goal below, return the single most concrete, photographable SUBJECT of the goal (1-3 words) — the tangible thing or scene that represents it being achieved. Prefer specific objects/places/people over abstract words. Examples: "I am the proud owner of a Xiaomi SU7" -> luxury electric car; "I am perfect eye health" -> hiker mountain vista; "I am debt free" -> person celebrating freedom. Return ONLY the query — no quotes, no punctuation, no preamble.

Goal: "${statement}"`
          }]
        })
      });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const k = aiData.choices?.[0]?.message?.content?.trim();
        if (k) keyword = k.replace(/^["']+|["']+$/g, '');
      }
    } catch (e) { /* keep the deterministic fallback keyword */ }

    // 2) Search Pexels for a landscape image.
    const pexKey = process.env.PEXELS_API_KEY;
    if (!pexKey) return { statusCode: 500, body: 'PEXELS_API_KEY not set' };

    const pexRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: pexKey } }
    );
    if (!pexRes.ok) {
      const err = await pexRes.text();
      return { statusCode: pexRes.status, body: err };
    }
    const pexData = await pexRes.json();
    const photo = pexData.photos?.[0];
    const url = photo?.src?.large2x || photo?.src?.large || photo?.src?.original;
    if (!url) {
      return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'No image found', keyword }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, keyword, photographer: photo.photographer || null })
    };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
