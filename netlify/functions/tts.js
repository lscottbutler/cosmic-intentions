exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { text, voice } = JSON.parse(event.body || '{}');
    if (!text) return { statusCode: 400, body: 'Missing text' };

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.trim().substring(0, 150),
        voice: voice || 'alloy'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: res.status, body: err };
    }

    const buffer = await res.arrayBuffer();
    const audio  = Buffer.from(buffer).toString('base64');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio })
    };
  } catch(e) {
    return { statusCode: 500, body: e.message };
  }
};
