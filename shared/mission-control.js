import { esc, intentions, selectedVaultIdx, syncIntentionsToSupabase, toast, dayKey } from '../app.js';
/* ── MISSION CONTROL MODULE ─────────────────────────────
   Depends on globals: intentions, esc, syncIntentionsToSupabase,
   selectedVaultIdx, toast
───────────────────────────────────────────────────────── */

function buildMissionControlPanel(intent, idx) {
  const mc = intent.achievers?.missionControl;
  if (!mc || !Array.isArray(mc.items) || mc.items.length === 0) {
    return `
      <div class="mc-intro">
        Generate 100 research-backed actions, mindset shifts, and strategies
        specific to your goal — then flag what resonates. Hit <strong>✓ YES</strong>
        to add it to your plan, or <strong>⬇ DEEPER</strong> to get a full
        deep-dive on that item.
      </div>
      <button class="bs-gen-btn" id="mcGenBtn-${idx}" onclick="generateMissionControl(${idx})">
        ⚡ Generate My Mission Control
      </button>`;
  }
  return renderMissionControlItems(mc.items, idx);
}

const MC_FUCKUP_CARD = `
  <div class="mc-card" id="mc-fuckup-card" style="border-color:#f59e0b;">
    <div class="mc-card-top">
      <div class="mc-card-num">★</div>
      <div class="mc-card-body">
        <div class="mc-card-cat" style="color:#f59e0b;">FOUNDATION</div>
        <div class="mc-card-action">The 5 Things I Ask Myself When I F*ck Up.</div>
        <div class="mc-card-why">
          <div class="mc-why-bullet">• Nelson Mandela: "I never lose. I either win or I learn."</div>
          <div class="mc-why-bullet">• Ray Dalio borrowed $4,000 from his dad after losing everything in 1982 — wrote down every mistake and the rule to prevent it. That system became Bridgewater, the world's largest hedge fund. His formula: "Pain + Reflection = Progress. Every mistake you don't examine is a tax you pay twice."</div>
        </div>
      </div>
    </div>
    <div class="mc-deepdive visible" style="border-color:#f59e0b;">
      <strong style="color:#f59e0b;display:block;margin-bottom:10px;">THE 5 QUESTIONS — run these every time you fail:</strong>
      <div style="margin-bottom:8px;"><strong style="color:#fff;">1. What exactly went wrong?</strong><br>Be surgical, not emotional. Strip out the story and name the specific decision or action that failed.</div>
      <div style="margin-bottom:8px;"><strong style="color:#fff;">2. Did I see the warning signs and ignore them?</strong><br>Dalio calls this "knowing but not doing." Most failures have fingerprints you walked past.</div>
      <div style="margin-bottom:8px;"><strong style="color:#fff;">3. What does this reveal about a blind spot in me?</strong><br>The mistake is a mirror. What belief, habit, or assumption made this possible?</div>
      <div style="margin-bottom:8px;"><strong style="color:#fff;">4. What is the rule I'm creating so this never happens again?</strong><br>Dalio wrote his rules down. Write yours. A mistake with no rule attached is wasted pain.</div>
      <div><strong style="color:#fff;">5. Who do I need to become so this mistake is impossible?</strong><br>James Clear: behavior change is identity change. Don't fix the action — fix the identity that caused it.</div>
    </div>
  </div>`;

function renderMissionControlItems(items, idx) {
  const yesCount    = items.filter(i => i.flag === 'yes').length;
  const deeperCount = items.filter(i => i.flag === 'deeper').length;
  const cards = items.map((item, i) => {
    const flagYes    = item.flag === 'yes';
    const flagDeeper = item.flag === 'deeper';
    const cardClass  = flagYes ? 'mc-card flagged-yes' : flagDeeper ? 'mc-card flagged-deeper' : 'mc-card';
    const deepHtml   = item.deepDive
      ? `<div class="mc-deepdive visible">${item.deepDive.replace(/\n/g,'<br>')}</div>`
      : `<div class="mc-deepdive" id="mcDD-${idx}-${i}"></div>`;
    return `
      <div class="${cardClass}" id="mcCard-${idx}-${i}">
        <div class="mc-card-top">
          <div class="mc-card-num">${i + 1}</div>
          <div class="mc-card-body">
            <div class="mc-card-cat">${esc(item.category || '')}</div>
            <div class="mc-card-action">${esc(item.action)}</div>
            <div class="mc-card-why">${item.why.split('|').map(b => `<div class="mc-why-bullet">${esc(b.trim())}</div>`).join('')}</div>
          </div>
        </div>
        <div class="mc-card-flags">
          <button class="mc-flag-btn${flagYes ? ' yes' : ''}"
            onclick="flagMCItem(${idx},${i},'yes')">✓ YES</button>
          <button class="mc-flag-btn${flagDeeper ? ' deeper' : ''}"
            onclick="flagMCItem(${idx},${i},'deeper')">⬇ DEEPER</button>
        </div>
        ${deepHtml}
      </div>`;
  }).join('');

  const commitsHTML = renderCommitmentsPanel(idx);
  return `
    <div class="mc-stats">${yesCount} YES · ${deeperCount} DEEPER selected</div>
    ${MC_FUCKUP_CARD}
    ${cards}
    <div class="mc-build-plan-wrap">
      <button class="mc-build-plan-btn" onclick="buildMCPlan(${idx})">
        ✦ Lock In My YES Items as Daily Commitments
      </button>
    </div>
    ${commitsHTML}
    <div style="padding:0 12px 8px;text-align:center;">
      <button class="bs-gen-btn regen" onclick="generateMissionControl(${idx})">⚡ Generate 15 More</button>
    </div>`;
}

export async function generateMissionControl(idx) {
  const intent = intentions[idx];
  if (!intent) return;
  const btn = document.getElementById(`mcGenBtn-${idx}`);
  if (btn) { btn.disabled = true; btn.textContent = '⚡ Generating 15 items… (5–8 sec)'; }

  const existing  = intent.achievers?.missionControl?.items || [];
  const startNum  = existing.length + 1;

  const systemPrompt = `You are a world-class success researcher and strategist. You apply the greatest proven frameworks from the world's top thinkers to any human goal. Be specific, punchy, and cite real people, studies, or principles. Return only valid JSON.`;

  const userPrompt = `Goal: "${intent.title}"

CRITICAL RULES — violating these makes the output useless:
1. The user has ALREADY SET THIS GOAL. NEVER tell them to set a goal, write it down, define their vision, get clear on what they want, or create a goal statement. That is done.
2. NEVER suggest creating a vision board, vision board exercises, or visualization boards. This app already does that — suggesting it is redundant and useless.
3. NEVER suggest meditation, gratitude practice, or journaling as a primary action — this app already has those built in.
4. NEVER give generic advice that applies to any goal (e.g. "stay motivated", "believe in yourself", "be consistent"). Every item must be brutally SPECIFIC to this exact goal.
5. NEVER repeat variations of the same idea. Each of the 15 items must be completely distinct.
6. Assume the user is past the planning phase. They want EXECUTION — what to do, how to think, what obstacles to destroy.
7. No filler. No obvious advice. No advice a 10-year-old could have given.

Generate 15 research-backed items (numbered ${startNum}–${startNum + 14}) to help execute and achieve this goal.

Draw from these proven frameworks — apply the most relevant to this specific goal:
- James Clear (Atomic Habits): identity-based habits, habit stacking, 1% improvement, the two-minute rule
- Simon Sinek (Start With Why): purpose drives behavior, find the why before the what
- Stephen Covey (7 Habits): begin with end in mind, sharpen the saw, proactive vs reactive
- Napoleon Hill (Think and Grow Rich): definite chief aim, mastermind groups, burning desire
- Tony Robbins: state management, the power of decision, RPM planning
- Carol Dweck (Growth Mindset): fixed vs growth identity, the power of "not yet"
- Cal Newport (Deep Work): eliminate shallow work, deep focus blocks, attention residue
- Rory Sutherland (Alchemy/Sutherland Lens): reframe the problem — the psychologically effective answer is rarely the logical one; design for perception not just reality; what signals are you sending yourself?
- BJ Fogg (Tiny Habits): make it tiny, anchor new habits to existing ones, celebrate small wins immediately
- Viktor Frankl: find the meaning in the struggle, purpose creates endurance
- Robert Cialdini (Influence): social proof, commitment and consistency, identity-based compliance
- Naval Ravikant: specific knowledge, long-term thinking, play games where you have unique advantage
- Alex Hormozi: speed of implementation, make the obvious move obvious, grand slam focus

Mix these angles across the 15 items:
- Identity/mindset shifts required
- Daily non-negotiable habits
- Environment and context design
- Accountability and social structures
- What the most successful people in this exact space did (name them)
- The most common reasons people FAIL at this goal
- Quick wins for week 1
- Milestones for month 3–6
- Long-term strategy year 1–3
- The Sutherland Lens: 3–5 items that challenge the obvious approach and reframe the goal psychologically

Each item: action (1 punchy sentence), why (MUST cite 2 famous people with their SPECIFIC story or little-known quote — not the headline everyone knows. Format as 2 bullet points separated by the pipe character |. Example: "• Jim Carrey drove to Mulholland Drive every night with nothing in his pocket, feeling the success as real — 'visualization works if you work hard. That's the thing.'|• Kobe arrived at 4am, took 800 shots before anyone else showed up — the edge is always in the hours nobody sees." Use people everyone knows: Ali, Kobe, Jordan, Carrey, Robbins, Oprah, Jobs, Bezos, Musk, Goggins, Buffett, Hill, Mandela, Carnegie, Lincoln, Tyson, Schwarzenegger, Federer, Dalio. NEVER cite academic papers or unknown researchers.), category (Mindset/Habit/Environment/Social/Strategy/Action/Warning/Milestone).

Return JSON: { "items": [ { "action": "...", "why": "...", "category": "..." } ] }
Exactly 15 items. No filler. No repeated ideas. No goal-setting advice.`;

  try {
    const res = await ciApi('claude', { system: systemPrompt, user: userPrompt, maxTokens: 1800 });
    const data   = await res.json();
    const parsed = JSON.parse(data.text);
    const items  = (parsed.items || []).slice(0, 15).map(item => ({
      action: item.action || '', why: item.why || '',
      category: item.category || 'Strategy', flag: null, deepDive: null
    }));
    if (!intent.achievers) intent.achievers = {};
    const allItems = [...existing, ...items];
    intent.achievers.missionControl = { items: allItems, generatedAt: new Date().toISOString() };
    await syncIntentionsToSupabase();
    const panel = document.getElementById(`bsPanel-mission-${idx}`);
    if (panel) panel.innerHTML = renderMissionControlItems(allItems, idx);
    toast(`${allItems.length} items loaded ⚡`, 'success');
  } catch (err) {
    toast('Generation failed — try again', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '⚡ Generate My 50-Item Mission Control'; }
  }
}

export function flagMCItem(idx, itemIdx, flag) {
  const intent = intentions[idx];
  const mc     = intent?.achievers?.missionControl;
  if (!mc || !mc.items[itemIdx]) return;
  const item = mc.items[itemIdx];
  item.flag  = item.flag === flag ? null : flag;
  const card = document.getElementById(`mcCard-${idx}-${itemIdx}`);
  if (card) {
    card.className = item.flag === 'yes' ? 'mc-card flagged-yes'
                   : item.flag === 'deeper' ? 'mc-card flagged-deeper' : 'mc-card';
    const [yesBtn, deeperBtn] = card.querySelectorAll('.mc-flag-btn');
    if (yesBtn)    yesBtn.className    = 'mc-flag-btn' + (item.flag === 'yes'    ? ' yes'    : '');
    if (deeperBtn) deeperBtn.className = 'mc-flag-btn' + (item.flag === 'deeper' ? ' deeper' : '');
  }
  const statsEl = document.querySelector(`#bsPanel-mission-${idx} .mc-stats`);
  if (statsEl) {
    const yesCount    = mc.items.filter(i => i.flag === 'yes').length;
    const deeperCount = mc.items.filter(i => i.flag === 'deeper').length;
    statsEl.textContent = `${yesCount} YES · ${deeperCount} DEEPER selected`;
  }
  if (item.flag === 'deeper') mcDeepDive(idx, itemIdx);
  syncIntentionsToSupabase();
}

async function mcDeepDive(idx, itemIdx) {
  const intent = intentions[idx];
  const item   = intent?.achievers?.missionControl?.items[itemIdx];
  if (!item) return;
  const ddEl = document.getElementById(`mcDD-${idx}-${itemIdx}`);
  if (!ddEl) return;
  if (item.deepDive) {
    ddEl.innerHTML = item.deepDive.replace(/\n/g, '<br>');
    ddEl.classList.add('visible');
    return;
  }
  ddEl.innerHTML = '<span class="mc-deepdive-loading">⚡ Generating deep dive…</span>';
  ddEl.classList.add('visible');
  const systemPrompt = `You are a world-class success coach and researcher. Provide a detailed, practical, research-backed deep dive on a specific success strategy.`;
  const userPrompt   = `Goal: "${intent.title}"\nStrategy to deep-dive: "${item.action}"\n\nProvide a comprehensive deep dive covering:\n1. The full research and science behind why this works\n2. Real examples of people who used this exact approach (name them, be specific)\n3. The exact step-by-step process to implement this (numbered, actionable)\n4. Common mistakes people make with this strategy\n5. A 30-day micro-plan to put this into action immediately\n6. One counterintuitive insight most people miss about this\n\nBe specific, direct, and research-backed. No fluff.`;
  try {
    const res  = await ciApi('claude', { system: systemPrompt, user: userPrompt, maxTokens: 1200 });
    const data = await res.json();
    let text   = data.text || '';
    try { const p = JSON.parse(text); text = p.content || p.text || text; } catch {}
    item.deepDive  = text;
    ddEl.innerHTML = text.replace(/\n/g, '<br>');
    syncIntentionsToSupabase();
  } catch {
    ddEl.classList.remove('visible');
    ddEl.innerHTML = '';
    toast('Deep dive failed — tap DEEPER again', 'error');
  }
}

export function buildMCPlan(idx) {
  const intent = intentions[idx];
  const mc     = intent?.achievers?.missionControl;
  if (!mc || !mc.items) return;
  const flagged = mc.items.filter(i => i.flag === 'yes' || i.flag === 'deeper');
  if (flagged.length === 0) { toast('Flag some items with YES or DEEPER first', 'info'); return; }
  if (!intent.achievers.commitments) intent.achievers.commitments = [];
  const existing = intent.achievers.commitments.map(c => c.text);
  const toAdd    = flagged.filter(f => !existing.includes(f.action));
  toAdd.forEach(f => {
    intent.achievers.commitments.push({ text: f.action, addedAt: new Date().toISOString(), checks: {}, streak: 0 });
  });
  syncIntentionsToSupabase();
  const panel = document.getElementById(`bsPanel-mission-${idx}`);
  if (panel) panel.innerHTML = renderMissionControlItems(mc.items, idx);
  toast(`${toAdd.length} commitment${toAdd.length !== 1 ? 's' : ''} added ✓`, 'success');
}

export function loadDailyCommitsPanel() {
  const inner = document.getElementById('dailyCommitsInner');
  if (!inner) return;
  const idx = selectedVaultIdx;
  if (idx === null || idx === undefined) {
    inner.innerHTML = '<div class="acc-desc">Select an intention first.</div>'; return;
  }
  const commits = intentions[idx]?.achievers?.commitments;
  if (!commits || commits.length === 0) {
    inner.innerHTML = '<div class="acc-desc">No commitments yet. Go to ⚡ Mission, flag YES items, then hit "Lock In."</div>'; return;
  }
  const today = dayKey();
  inner.innerHTML = commits.map((c, i) => {
    const done      = !!c.checks?.[today];
    const streak    = c.streak || 0;
    const streakTxt = streak === 0 ? 'Not started' : streak >= 7 ? `🔥🔥 ${streak} days` : `🔥 ${streak} days`;
    return `
      <div class="mc-commit-item">
        <div class="mc-commit-check${done ? ' done' : ''}"
          onclick="toggleCommitmentCheck(${idx},${i});loadDailyCommitsPanel()"
          id="sidebarCheck-${idx}-${i}"></div>
        <div class="mc-commit-body">
          <div class="mc-commit-text">${esc(c.text)}</div>
          <div class="mc-commit-streak${streak >= 7 ? ' hot' : ''}">${streakTxt}</div>
        </div>
      </div>`;
  }).join('');
}

function renderCommitmentsPanel(idx) {
  const intent  = intentions[idx];
  const commits = intent?.achievers?.commitments;
  if (!commits || commits.length === 0) return '';
  const today = dayKey();
  const rows  = commits.map((c, i) => {
    const done        = !!c.checks?.[today];
    const streak      = c.streak || 0;
    const streakLabel = streak === 0 ? 'Not started'
      : streak === 1 ? '🔥 1 day streak'
      : streak >= 7  ? `🔥🔥 ${streak} day streak`
      : `🔥 ${streak} day streak`;
    return `
      <div class="mc-commit-item">
        <div class="mc-commit-check${done ? ' done' : ''}"
          onclick="toggleCommitmentCheck(${idx},${i})" id="mcCheck-${idx}-${i}"></div>
        <div class="mc-commit-body">
          <div class="mc-commit-text">${esc(c.text)}</div>
          <div class="mc-commit-streak${streak >= 7 ? ' hot' : ''}">${streakLabel}</div>
        </div>
      </div>`;
  }).join('');
  return `
    <div class="mc-commit-panel">
      <div class="mc-commit-hd">✦ My Daily Commitments (${commits.length})</div>
      ${rows}
    </div>`;
}

export function toggleCommitmentCheck(idx, commitIdx) {
  const intent = intentions[idx];
  const commit = intent?.achievers?.commitments?.[commitIdx];
  if (!commit) return;
  const today   = dayKey();
  if (!commit.checks) commit.checks = {};
  const wasDone       = !!commit.checks[today];
  commit.checks[today] = !wasDone;
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = dayKey(d);
    if (commit.checks[key]) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  commit.streak = streak;
  const checkEl = document.getElementById(`mcCheck-${idx}-${commitIdx}`);
  if (checkEl) checkEl.classList.toggle('done', !wasDone);
  const panel       = document.getElementById(`bsPanel-mission-${idx}`);
  const commitPanel = panel?.querySelector('.mc-commit-panel');
  if (commitPanel) commitPanel.outerHTML = renderCommitmentsPanel(idx).trim()
    ? renderCommitmentsPanel(idx) : commitPanel.outerHTML;
  syncIntentionsToSupabase();
}
