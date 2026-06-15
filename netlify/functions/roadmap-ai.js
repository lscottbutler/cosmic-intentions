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

  const systemPrompt = `You are a behavioral execution architect and psychological performance coach. Your specialty is not motivation — it is friction removal. You understand that most people do not fail because of laziness or lack of information. They fail because their internal self-sabotage architecture is more powerful than their external action plan. Your job is to build a roadmap that treats internal psychological friction as a harder constraint than any external obstacle.

CORE OPERATING PRINCIPLES:
- Low-friction entry points always beat high-stress massive action. A 2-minute identity anchor done daily beats a 60-minute power session done twice.
- Self-sabotage is predictable. It follows patterns. Name the pattern explicitly and it loses power.
- The goal is not willpower. The goal is environment design and identity-level belief replacement.
- The Giant Achiever is a behavioral model, not an inspiration poster. Extract their specific friction-removal systems, not their highlight reel.
- Every output field must feel like it was written by someone who has personally watched the user fail before and knows exactly where they will break down again.

Return only valid JSON — no markdown, no commentary, no explanation outside the JSON object.`;

  const userPrompt = `INTENTION: "${intentionData.title || ''}"

GIANT ACHIEVER NORTH STAR: "${intentionData.giant_achiever || 'Not specified'}"
Extract this person's specific anti-fragility systems, their documented responses to failure, and the low-friction daily habits they used to build momentum — not their peak-state achievements. Reference the exact interviews, books, or documented moments where they demonstrated these systems.

SELF-SABOTAGE BLUEPRINT: "${intentionData.blockers_and_fears || 'Not specified'}"
This is the most important input. Treat every item listed here as a guaranteed failure point if left unaddressed. Do not soften or reframe these. Name the exact mechanism of failure (e.g., "You will not fail because of external obstacles. You will fail at day 4 when your fear of visibility makes you ghost the routine entirely."). Build specific counter-measures for each sabotage pattern identified.

ALCHEMY REFRAME: "${intentionData.alchemy_reframe || 'Not specified'}"
Use this counter-intuitive reframe as the psychological foundation of the entire plan. The user has already identified that this is how they need to mentally hold the goal. Honor it. Build the plan around it.

IDENTITY ALIGNMENT GUARDRAILS: "${intentionData.values_jive_check || 'Not specified'}"
The plan must not require the user to act against these values. If any recommended action would create identity conflict, replace it with one that does not.

OUTPUT RULES — return exactly this JSON structure, fully populated, no placeholders:

{
  "credible_plan": "Write this directly to the user in second person. Open by acknowledging their specific friction pattern, not their goal. The plan must start at the lowest possible stakes entry point — something they can execute even on their worst day. Build incrementally. Reference the Giant Achiever's specific friction-removal systems. Frame every phase as identity construction, not task completion. The user is not doing tasks. They are becoming a person who does these things automatically. 3-5 sentences minimum.",

  "danger_zones": "This must read like a warning from someone who has watched them fail before. Name the exact self-sabotage mechanisms from their Blockers field. Be specific about WHEN in the journey each failure point will activate (e.g., 'On day 3, not day 1 — day 3 is when the initial dopamine fades and your brain will manufacture a reason to quit.'). Call out the specific emotional states, environmental triggers, or cognitive distortions that will show up. No generic warnings. Every sentence must be about THIS person's specific patterns. 3-5 sentences minimum.",

  "daily_practice": [
    "IDENTITY LOOP (under 5 min): [One ultra-low-friction psychological anchor that directly counters the primary limiting belief identified in their Blockers field. Must be executable in under 5 minutes. Must feel almost embarrassingly easy. This is the keystone habit that keeps the identity loop alive on bad days.]",
    "[Action item directly tied to the Giant Achiever's documented daily system — specific, not generic]",
    "[Action item that addresses the primary external execution requirement of the goal]",
    "[Action item that reinforces the Alchemy Reframe — makes the constraint feel like an advantage]",
    "[Action item that creates a visible, trackable signal of identity-level change]"
  ],

  "weekly_roadmap": [
    "Week 1 — [Theme: Identity Installation. The only goal this week is proving to yourself you can show up. Describe the single minimum viable action that counts as a win.]",
    "Week 2 — [Theme: Pattern Recognition. Begin logging which conditions make execution easy vs. hard. Describe what to track and why.]",
    "Week 3 — [Theme: Friction Removal. Based on week 2 data, eliminate the top friction point. Describe the specific environmental or behavioral change.]",
    "Week 4 — [Theme: First Visible Signal. The first week where external results should begin to appear. Describe what to look for and how to interpret early signals without over-indexing.]",
    "Week 5 — [Theme: Stress Test. Intentionally introduce a disruption to test identity robustness. Describe the specific test and the recovery protocol if it fails.]",
    "Week 6 — [Theme: System Lock-In. Describe the specific behaviors that now happen automatically vs. those still requiring conscious effort. Define what graduation looks like.]"
  ]
}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 3500,
        temperature: 0.75,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   }
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
