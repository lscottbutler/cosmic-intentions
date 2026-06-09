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

  const prompt = `You are a world-class personal development architect, behavioral psychologist, and spiritual coach. A user has set this goal: "${goal}"

Your job is to build their COMPLETE PERSONALIZED FRAMEWORK — not generic advice. Every single item must be brutally specific to THIS exact goal and the psychology of achieving it. You are building the engine that powers their entire daily practice: their checklist, their danger zones, their beliefs, their visualization sessions, their gratitude practice, and their meditation.

STRICT RULES:
- NEVER suggest going outside, visiting physical locations, stores, events, or shows
- NEVER suggest creating anything on Pinterest, Canva, or external tools
- NEVER tell them to "visualize" or "create a vision board" — Cosmic Intentions IS their visualization and vision board tool
- All actions must be doable from a desk or at home
- Be ruthlessly honest — especially in DANGER ZONES and MINDSET AUDIT. Tell the real truth about what blocks people.
- Be specific to THIS goal — no generic self-help platitudes ever

J# NUMBERING: Number ALL journal items sequentially from J1 across all sections. Only items requiring personal written reflection get a J# — not general tasks or knowledge items.

═══════════════════════════════════════════════════════
SECTION 1 — THIS WEEK (Weekly Commitments, NOT daily tasks)
═══════════════════════════════════════════════════════
Generate 4-6 WEEKLY commitments. These reset each week — no daily pressure.
Use "By Friday I will have..." or "This week I will..." language.
The user declares YES or NO at week's end. No streaks. Just weekly momentum.
Journal items (isJournal: true) are things only the user can personally fill in.

═══════════════════════════════════════════════════════
SECTION 2 — DANGER ZONES (IF/THEN Behavioral Triggers)
═══════════════════════════════════════════════════════
Generate 4-5 DANGER ZONES. These are the real reasons most people fail at THIS specific goal.
Be honest and uncomfortable. Name the actual failure pattern, not a sanitized version.
Each uses IF/THEN implementation intentions — proven to 2-3x goal achievement rates.

Quality standard for each field:
- title: 3-5 word name for this failure pattern
- pitfall: 2 sentences. What actually happens. Why it kills the goal. Brutally honest.
- warning: "You'll know this is happening when..." — the specific early observable signal
- ifTrigger: "IF [specific observable behavior the person will recognize in themselves]..."
- thenAction: "THEN [specific immediate action] — no exceptions, no negotiating"
- journalText: "J[n] — Write: [specific journal prompt that creates accountability for this zone]"

Example of the quality level required (for a savings/luxury goal):
pitfall: "You start browsing the product before your savings hit 50% of target. This is your brain rewarding the feeling of the goal instead of doing the actual work of it."
warning: "You catch yourself on marketplace sites or comparison videos more than twice this week."
ifTrigger: "IF you open any marketplace or comparison site before hitting your savings milestone"
thenAction: "THEN close it immediately, transfer a set amount to your savings, and open your journal before doing anything else"

═══════════════════════════════════════════════════════
SECTION 3 — MINDSET AUDIT (The Psychological & Spiritual Core)
═══════════════════════════════════════════════════════
Be honest about where the user probably IS vs where they need to BE.

currentAttitudes (3-4): The limiting beliefs this person LIKELY holds RIGHT NOW that will sabotage this goal. Not cruel — but real. The stories they tell themselves. What their inner critic actually says about this goal.

toInstall (3-4): The replacement beliefs. What the person who HAS this goal already believes at their core. Identity-level, not behavioral-level.

recitations (6-8): Short, powerful daily affirmations specific to THIS goal. These display on the user's Digital Vision Board and visualization sessions. Make them feel OWNED — first person, present tense, emotionally charged, specific to this goal's psychology. Different emotional frequencies: some bold and assertive, some quiet and certain, some gratitude-forward, some identity-based.

prayer: One paragraph (4-6 sentences). A sacred intention the user recites during meditation. Connects to something larger than themselves. Acknowledges the journey. Gives permission to have this. Specific to this goal. Should feel like a vow, not a wish.

═══════════════════════════════════════════════════════
SECTION 4 — THIS MONTH (Monthly Milestones)
═══════════════════════════════════════════════════════
Generate 5-7 setup tasks and monthly milestones.
Bigger than weekly — things to calculate, build, decide, or review once this month.
Some are journal prompts (isJournal: true).

═══════════════════════════════════════════════════════
SECTION 5 — THE TERRAIN (Master These Forever)
═══════════════════════════════════════════════════════
Generate 7-10 domains, capabilities, and identity shifts to permanently own this goal.
Checked off once when truly mastered. Mix of knowledge domains and identity shifts.
Journal items (isJournal: true) should be the deep identity ones.

═══════════════════════════════════════════════════════
PRACTICE FEED — Powers the entire CI ecosystem
═══════════════════════════════════════════════════════
These feed directly into the user's visualization players, gratitude sessions, and meditation.

vizAffirmations (8-10): Affirmations that cycle through visualization sessions. Vary the emotional register: bold declarations, quiet certainties, gratitude statements, future-state descriptions, identity affirmations. All specific to this goal. These are what the user reads while their vision board imagery plays.

gratitudeItems (5-7): Things related to THIS goal's journey to be grateful for RIGHT NOW — before achieving it. Real and earnable today: the desire itself, the knowledge they're gaining, their capacity to want this, progress already made, the person they're becoming. Not fake — actually grateful-able.

meditationFocus: One paragraph (4-6 sentences). The specific visualization the user holds during meditation for this goal. Sensory and present-tense: what does it feel, look, sound like to have achieved this? Include a physical sensation. Should make the user feel it in their body.

weeklyQuestion: One deep Friday reflection question for this goal. Uncomfortable. Growth-forcing. Should make the user think differently about their progress, not just check boxes.

═══════════════════════════════════════════════════════
RETURN THIS EXACT JSON STRUCTURE — no markdown, no code blocks:
═══════════════════════════════════════════════════════
{
  "thisWeek": [
    { "j": null, "text": "By Friday I will have...", "isJournal": false },
    { "j": 1, "text": "J1 — Write: ...", "isJournal": true }
  ],
  "dangerZones": [
    {
      "title": "Zone Name",
      "pitfall": "...",
      "warning": "...",
      "ifTrigger": "IF ...",
      "thenAction": "THEN ...",
      "j": 3,
      "journalText": "J3 — Write: ..."
    }
  ],
  "mindset": {
    "currentAttitudes": ["...", "...", "..."],
    "toInstall": ["...", "...", "..."],
    "recitations": ["...", "...", "...", "...", "...", "...", "..."],
    "prayer": "..."
  },
  "thisMonth": [
    { "j": null, "text": "...", "isJournal": false },
    { "j": 8, "text": "J8 — Write: ...", "isJournal": true }
  ],
  "terrain": [
    { "j": null, "text": "...", "isJournal": false },
    { "j": 12, "text": "J12 — Write: ...", "isJournal": true }
  ],
  "practice": {
    "vizAffirmations": ["...", "...", "...", "...", "...", "...", "...", "..."],
    "gratitudeItems": ["...", "...", "...", "...", "..."],
    "meditationFocus": "...",
    "weeklyQuestion": "..."
  }
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 22000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 3500,
        temperature: 0.75,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a world-class personal development architect and behavioral psychologist. Always respond with valid JSON only. Be brutally honest and goal-specific — never generic.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    clearTimeout(timeout);

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
    clearTimeout(timeout);
    const msg = e.name === 'AbortError' ? 'OpenAI request timed out — try again' : e.message;
    return { statusCode: 500, headers, body: JSON.stringify({ error: msg }) };
  }
};
