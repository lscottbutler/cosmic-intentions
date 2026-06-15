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

  const { intentionData } = body;
  const apiKey = process.env.OPEN_AI_KEY;

  if (!apiKey)        return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };
  if (!intentionData) return { statusCode: 400, headers, body: JSON.stringify({ error: 'intentionData is required' }) };

  const prompt = `You are an elite execution strategist and high-performance coach. Your task is to design a step-by-step, media-backed tactical roadmap for the user's explicit goal. Do not hallucinate or use generic surface-level business advice.

USER PEGBOARD DATA INPUTS:
- Core Goal Affirmation: "${intentionData.title || ''}"
- Targeted Giant Achiever: "${intentionData.giant_achiever || 'Not specified'}"
- Real Blocker Audit (Internal Fears, Habits, Environmental Constraints): "${intentionData.blockers_and_fears || 'Not specified'}"
- Core Values Verification: "${intentionData.values_jive_check || 'Not specified'}"

STRATEGIC INSTRUCTIONS:
1. TARGET THE GIANT: Extract the exact operating methods, execution tips, and real-world tactical styles used by "${intentionData.giant_achiever || 'the most relevant achiever for this goal'}". Reference the exact types of media footnotes (interviews, talks, or principles) where they demonstrated these tactics.
2. DISMANTLE THE BEHAVIORAL BLOCKER: Directly address the explicit obstacles listed in: "${intentionData.blockers_and_fears || 'general execution friction'}". Build counter-measures, routine adjustments, or system changes designed to defeat this precise friction point.
3. CONSTRAIN BY VALUES: The plan must operate entirely inside the guardrails of the user's values statement: "${intentionData.values_jive_check || 'integrity and authentic growth'}". If it forces paths that contradict this alignment, it is wrong.

OUTPUT FORMAT — return only this exact JSON, no markdown, no commentary:
{
  "credible_plan": "A summary of the strategy written directly to the user.",
  "danger_zones": "Explicit warnings detailing how the user's specific blocker fields will cause them to derail if left unchecked.",
  "daily_practice": ["Action item 1", "Action item 2", "Action item 3", "Action item 4", "Action item 5"],
  "weekly_roadmap": ["Week 1 goal", "Week 2 goal", "Week 3 goal", "Week 4 goal", "Week 5 goal", "Week 6 goal"]
}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 3000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are an elite execution strategist. Return only valid JSON — no markdown, no commentary.' },
          { role: 'user',   content: prompt }
        ]
      })
    });

    const rawBody = await res.text();
    if (!res.ok) return { statusCode: 502, headers, body: JSON.stringify({ error: rawBody }) };

    const data = JSON.parse(rawBody);
    if (data.choices?.[0]?.finish_reason === 'length') {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'AI response truncated — retry' }) };
    }

    const content = data.choices?.[0]?.message?.content?.trim() || '';
    const clean   = content.replace(/^```json\s*/,'').replace(/```$/,'').trim();
    const parsed  = JSON.parse(clean);

    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
