exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { intention } = JSON.parse(event.body || '{}');
    if (!intention) return { statusCode: 400, body: 'Missing intention' };

    // Use OpenAI to extract the best visual search query from the I AM statement
    let searchQuery = intention;
    try {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 30,
          temperature: 0.2,
          messages: [{
            role: 'user',
            content: `Extract the core visual subject from this "I AM" intention for an image search. Return ONLY 2-4 keywords, nothing else. No quotes, no explanation.

Intention: "${intention}"

Examples:
"I AM the proud owner of a Rolex Submariner" -> Rolex Submariner watch
"I AM living in my dream home in Malibu" -> luxury Malibu beach house
"I AM a fit and healthy athlete" -> fit athletic person running

Keywords:`
          }]
        })
      });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const extracted = aiData.choices?.[0]?.message?.content?.trim();
        if (extracted) searchQuery = extracted;
      }
    } catch(e) {
      // fall back to raw intention if extraction fails
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
