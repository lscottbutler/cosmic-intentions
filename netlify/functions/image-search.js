exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { intention } = JSON.parse(event.body || '{}');
    if (!intention) return { statusCode: 400, body: 'Missing intention' };

    // Use Claude to extract the best visual search query from the I AM statement
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: `Extract the core visual subject from this I AM intention for an image search. Return ONLY 2-4 keywords, nothing else. No quotes, no explanation.

Intention: "${intention}"

Examples:
"I AM the proud owner of a Rolex Submariner" → Rolex Submariner watch
"I AM living in my dream home in Malibu" → luxury Malibu beach house
"I AM a fit and healthy athlete" → fit athletic person running

Keywords:`
        }]
      })
    });

    let searchQuery = intention;
    if (claudeRes.ok) {
      const claudeData = await claudeRes.json();
      searchQuery = claudeData.content?.[0]?.text?.trim() || intention;
    }

    // Search Pexels for the image
    const pexelsRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    );

    if (!pexelsRes.ok) throw new Error(`Pexels error ${pexelsRes.status}`);

    const pexelsData = await pexelsRes.json();
    const photo = pexelsData.photos?.[0];

    if (!photo) return { statusCode: 404, body: 'No image found' };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl:    photo.src.large2x || photo.src.large,
        searchQuery,
        photographer: photo.photographer,
        pexelsUrl:   photo.url
      })
    };
  } catch(e) {
    return { statusCode: 500, body: e.message };
  }
};
