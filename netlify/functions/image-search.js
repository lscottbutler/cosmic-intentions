// Vision-board image: extract a concrete keyword from an "I AM" statement via
// OpenAI, then fetch a matching stock photo from Pexels.
// Env: OPEN_AI_KEY (keyword extraction), PEXELS_API_KEY (image search).
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { statement } = JSON.parse(event.body || '{}');
    if (!statement) return { statusCode: 400, body: 'Missing statement' };

    // 1) Extract a single concrete, physical search keyword via OpenAI.
    let keyword = statement;
    let _dbg = { aiStatus: null, aiErr: null };
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
            content: `Extract a single, concrete, physical search keyword (1-3 words) suitable for a Pexels stock-photo search from this statement. Return ONLY the keyword — no quotes, no punctuation, no preamble.

Statement: "${statement}"`
          }]
        })
      });
      _dbg.aiStatus = aiRes.status;
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const k = aiData.choices?.[0]?.message?.content?.trim();
        if (k) keyword = k.replace(/^["']+|["']+$/g, '');
      } else {
        _dbg.aiErr = (await aiRes.text()).slice(0, 200);
      }
    } catch (e) { _dbg.aiErr = 'throw: ' + e.message; }

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
      body: JSON.stringify({ url, keyword, photographer: photo.photographer || null, _dbg })
    };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
