exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { goal } = body;
  const apiKey = process.env.OPEN_AI_KEY;

  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPEN_AI_KEY not configured' }) };
  if (!goal)   return { statusCode: 400, headers, body: JSON.stringify({ error: 'goal is required' }) };

  const prompt = `You are a world-class goal achievement architect. A user has set this goal: "${goal}"

Your job is to build their complete MAP — the full terrain of what it takes to achieve this goal, broken into three time horizons. This is NOT generic advice. Every item must be brutally specific to THIS exact goal.

STRICT RULES:
- NEVER suggest going outside, visiting physical locations, stores, events, or shows
- NEVER suggest creating anything on Pinterest, Canva, or external tools
- NEVER tell them to "visualize" or "journal about their vision" — Cosmic Intentions IS their visualization tool, they already have a Digital Vision Board built inside the app
- ALWAYS recommend online research, apps, and at-home actions
- Every action must be doable from a desk or at home
- Be specific to THIS goal — no generic self-help platitudes

JOURNAL ITEMS (isJournal: true):
Some items require deep personal reflection that only the user can fill in — their specific "why", their personal triggers, their unique plan details. Mark these as journal items. The user will write them in their physical journal under the J# code you assign. These should be the items where personal detail matters most — not generic tasks.
Good journal items: "Your real emotional WHY", "Your personal trigger foods and situations", "Your identity statement as the person who has achieved this"
Bad journal items: "Research meal plans online" — that's a task, not a journal entry

J# NUMBERING: Number all items sequentially from J1 through the end across all three sections.

THREE SECTIONS:

1. THIS WEEK — Daily actions (7-10 items)
Specific things to do every day or multiple times this week. Concrete, immediate, measurable. These reset weekly — the user does them again next week.
Example for weight loss: "Track every calorie in MyFitnessPal — hit your deficit target daily"

2. THIS MONTH — Monthly milestones (7-10 items)
Bigger setup tasks and weekly check-ins. Things to build, calculate, decide, or review once this month.
Example: "Calculate your TDEE using an online calculator and set your exact daily calorie target"

3. THE TERRAIN — Master these forever (8-12 items)
The domains, capabilities, and identity shifts required to permanently achieve and keep this goal. These are checked off once when truly mastered — not tasks but territories. Mix of journal items and knowledge/skill areas.
Example: "Understand caloric deficit and how your metabolism adapts" or "J# — Write your identity statement as someone who permanently lives at this goal"

Return ONLY this exact JSON structure, no markdown:
{
  "thisWeek": [
    { "j": 1, "text": "...", "isJournal": false },
    { "j": 2, "text": "J2 — ...", "isJournal": true }
  ],
  "thisMonth": [
    { "j": 8, "text": "...", "isJournal": false }
  ],
  "terrain": [
    { "j": 16, "text": "...", "isJournal": false },
    { "j": 17, "text": "J17 — ...", "isJournal": true }
  ]
}

For journal items, start the text with "J[number] — " so the user knows what to write on the page of their physical journal.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a goal achievement architect. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 502, headers, body: JSON.stringify({ error: err }) };
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    const clean = text.replace(/^```json\s*/,'').replace(/```$/,'').trim();
    const parsed = JSON.parse(clean);
    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
