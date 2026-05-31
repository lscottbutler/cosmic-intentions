exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { intention } = JSON.parse(event.body || '{}');
    if (!intention) return { statusCode: 400, body: 'Missing intention' };

    // Turn the "I AM" statement into a vivid image-generation prompt
    let prompt = intention;
    try {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 120,
          temperature: 0.6,
          messages: [{
            role: 'user',
            content: `Turn this "I AM" intention into a single vivid image-generation prompt for a motivational vision board. Cinematic, aspirational, photorealistic, beautiful lighting. Describe the SUBJECT clearly so it's instantly recognizable. Return ONLY the prompt, no quotes, no preamble.

Intention: "${intention}"`
          }]
        })
      });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const p = aiData.choices?.[0]?.message?.content?.trim();
        if (p) prompt = p;
      }
    } catch(e) { /* fall back to raw intention */ }

    const imgRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: '1536x1024',
        quality: 'medium'
      })
    });

    if (!imgRes.ok) {
      const err = await imgRes.text();
      return { statusCode: imgRes.status, body: err };
    }

    const data = await imgRes.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return { statusCode: 502, body: 'No image generated' };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ b64, prompt })
    };
  } catch(e) {
    return { statusCode: 500, body: e.message };
  }
};
