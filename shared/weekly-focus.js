/* ── WEEKLY FOCUS MODULE ─────────────────────────────────
   10 rotating checkboxes per week pulled from The Map todos.
   Rotates every Monday. 4-week cycle, then repeats with variation.
   Completions stored in localStorage, keyed by week.
   Depends on globals: intentions, esc, MAP_EMOJIS
───────────────────────────────────────────────────────── */

/* ── Week helpers ────────────────────────────────────── */
function _wfGetISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function _wfWeekKey() {
  const d = new Date();
  return `${d.getFullYear()}-W${String(_wfGetISOWeek(d)).padStart(2,'0')}`;
}

function _wfCycleNum() {
  return ((_wfGetISOWeek(new Date()) - 1) % 4) + 1; // 1–4
}

function _wfDaysUntilMonday() {
  const day = new Date().getDay(); // 0=Sun
  return day === 1 ? 7 : (8 - day) % 7 || 7;
}

/* Component focus per cycle week */
const WF_CYCLE_COMPS = {
  1: [1, 2, 3],                  // Foundation: Clarity · Why · Belief
  2: [4, 5, 6],                  // Execution: Plan · Feedback · Environment
  3: [7, 8, 9],                  // Sustaining: Accountability · Resilience · Identity
  4: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Integration: all
};

const WF_CYCLE_LABELS = {
  1: { label: 'Foundation',    color: '#F5A623' },
  2: { label: 'Execution',     color: '#60A0FF' },
  3: { label: 'Sustaining',    color: '#4ADE80' },
  4: { label: 'Integration',   color: '#BF5AF2' },
};

const WF_COMP_NAMES = {
  1:'Clarity', 2:'Compelling Why', 3:'Belief',
  4:'Plan', 5:'Feedback Loops', 6:'Environment',
  7:'Accountability', 8:'Resilience', 9:'Identity',
};

/* ── Build the pool of todos ─────────────────────────── */
function _wfBuildPool(cycleComps) {
  const pool = [];
  (intentions || []).forEach((intent, intentIdx) => {
    const comps = intent?.theMap?.components || [];
    comps.forEach(c => {
      if (!cycleComps.includes(c.number)) return;
      const todos = Array.isArray(c.todos) ? c.todos : (c.action ? [c.action] : []);
      todos.forEach((todo, todoIdx) => {
        const text     = typeof todo === 'string' ? todo : (todo?.text || '');
        const citation = typeof todo === 'string' ? '' : (todo?.citation || '');
        if (!text) return;
        pool.push({
          key:       `${intentIdx}-${c.number}-${todoIdx}`,
          text,
          citation,
          compNum:   c.number,
          compName:  WF_COMP_NAMES[c.number] || c.name,
          intention: intent.title,
          intentIdx,
          anchor:    intent.theMap?.celebrity_anchor?.name || '',
        });
      });
    });
  });
  return pool;
}

/* Seeded pseudo-random shuffle (deterministic per week) */
function _wfSeededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Pick 10 items with component variety (max 2 from any one component) */
function _wfPickTen(pool, seed) {
  const shuffled  = _wfSeededShuffle(pool, seed);
  const picked    = [];
  const compCount = {};
  const limit     = 2; // max per component per week
  for (const item of shuffled) {
    if (picked.length >= 10) break;
    const c = item.compNum;
    if ((compCount[c] || 0) < limit) {
      picked.push(item);
      compCount[c] = (compCount[c] || 0) + 1;
    }
  }
  // If pool was small, fill without the limit
  if (picked.length < 10) {
    for (const item of shuffled) {
      if (picked.length >= 10) break;
      if (!picked.find(p => p.key === item.key)) picked.push(item);
    }
  }
  return picked;
}

/* ── Completion storage ──────────────────────────────── */
function _wfLoadChecks() {
  try { return JSON.parse(localStorage.getItem(`ci_wf_${_wfWeekKey()}`) || '{}'); }
  catch { return {}; }
}

function _wfSaveChecks(checks) {
  localStorage.setItem(`ci_wf_${_wfWeekKey()}`, JSON.stringify(checks));
  // Prune keys older than 8 weeks
  const cutoff = _wfGetISOWeek(new Date()) - 8;
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('ci_wf_')) {
      const w = parseInt(k.split('-W')[1] || '0');
      if (w < cutoff) localStorage.removeItem(k);
    }
  });
}

/* ── Toggle a checkbox ───────────────────────────────── */
function wfToggle(key) {
  const checks   = _wfLoadChecks();
  checks[key]    = !checks[key];
  _wfSaveChecks(checks);

  const box   = document.getElementById(`wf-check-${key.replace(/[^a-z0-9]/gi,'-')}`);
  const label = document.getElementById(`wf-label-${key.replace(/[^a-z0-9]/gi,'-')}`);
  if (box)   box.classList.toggle('done', checks[key]);
  if (label) label.style.textDecoration = checks[key] ? 'line-through' : '';
  if (label) label.style.color = checks[key] ? '#404048' : '';

  // Update progress
  _wfUpdateProgress();
  logActivity('map_todo', { todo: key }, 5);
}

function _wfUpdateProgress() {
  const checks    = _wfLoadChecks();
  const done      = Object.values(checks).filter(Boolean).length;
  const bar       = document.getElementById('wfProgressBar');
  const label     = document.getElementById('wfProgressLabel');
  if (bar)   bar.style.width = `${Math.min(100, (done / 10) * 100)}%`;
  if (label) label.textContent = `${done} / 10 complete`;
}

/* ── Main render ─────────────────────────────────────── */
function renderWeeklyFocus() {
  const el = document.getElementById('weeklyFocusPanel');
  if (!el) return;

  const cycle      = _wfCycleNum();
  const cycleInfo  = WF_CYCLE_LABELS[cycle];
  const comps      = WF_CYCLE_COMPS[cycle];
  const pool       = _wfBuildPool(comps);
  const weekKey    = _wfWeekKey();
  const seed       = parseInt(weekKey.replace(/\D/g,''));
  const checks     = _wfLoadChecks();
  const daysLeft   = _wfDaysUntilMonday();

  // No map data yet
  if (pool.length === 0) {
    el.innerHTML = `
      <div style="border:1px solid #222;border-radius:10px;padding:16px 18px;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:${cycleInfo.color};font-weight:800;letter-spacing:1px;margin-bottom:8px;">
          ◈ WEEKLY FOCUS — ${weekKey}
        </div>
        <div style="font-size:13px;color:#505058;line-height:1.6;">
          Generate <strong style="color:#fff">The Map</strong> for at least one intention to unlock your weekly focus list.
        </div>
      </div>`;
    return;
  }

  const items  = _wfPickTen(pool, seed);
  const done   = items.filter(i => checks[i.key]).length;
  const pct    = Math.min(100, (done / items.length) * 100);

  const rows = items.map(item => {
    const safeKey = item.key.replace(/[^a-z0-9]/gi,'-');
    const checked = !!checks[item.key];
    const emoji   = (typeof MAP_EMOJIS !== 'undefined' ? MAP_EMOJIS[item.compNum] : '') || '◈';
    return `
      <div style="padding:10px 0;border-bottom:1px solid #1A1A1A;cursor:pointer;"
        onclick="wfToggle('${item.key}')">
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <div id="wf-check-${safeKey}"
            style="width:16px;height:16px;border-radius:3px;border:2px solid ${checked?cycleInfo.color:'#383840'};
            background:${checked?cycleInfo.color:'transparent'};flex-shrink:0;margin-top:2px;
            display:flex;align-items:center;justify-content:center;font-size:9px;color:#000;transition:all 0.15s;">
            ${checked ? '✓' : ''}
          </div>
          <div style="flex:1;min-width:0;">
            <div id="wf-label-${safeKey}"
              style="font-size:13px;color:${checked?'#404048':'#C0C0C8'};line-height:1.5;
              text-decoration:${checked?'line-through':''};transition:all 0.2s;">
              ${esc(item.text)}
            </div>
            <div style="font-size:10px;color:#404048;margin-top:2px;font-family:var(--vault-mono);">
              ${emoji} ${item.compName}${item.anchor ? ` · ⚡ ${esc(item.anchor)}` : ''}
            </div>
          </div>
        </div>
        ${item.citation ? `
        <div style="margin-top:5px;margin-left:26px;font-size:11px;color:#505850;font-style:italic;
          line-height:1.5;padding-left:8px;border-left:2px solid #2A2A1A;">
          ${esc(item.citation)}
        </div>` : ''}
      </div>`;
  }).join('');

  el.innerHTML = `
    <div style="border:1px solid #222;border-radius:10px;overflow:hidden;margin-bottom:16px;">

      <!-- Header -->
      <div style="padding:12px 16px 10px;border-bottom:1px solid #222;
        display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-family:var(--vault-mono);font-size:10px;color:${cycleInfo.color};
            font-weight:800;letter-spacing:1px;">◈ WEEKLY FOCUS</div>
          <div style="font-family:var(--vault-mono);font-size:9px;color:#505058;margin-top:1px;letter-spacing:0.5px;">
            WEEK ${_wfGetISOWeek(new Date())} · CYCLE ${cycle}/4 · ${cycleInfo.label.toUpperCase()}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--vault-mono);font-size:9px;color:#383840;">
            resets in ${daysLeft}d
          </div>
          <div id="wfProgressLabel"
            style="font-family:var(--vault-mono);font-size:11px;color:${cycleInfo.color};font-weight:700;margin-top:2px;">
            ${done} / ${items.length} complete
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div style="height:3px;background:#1A1A1A;">
        <div id="wfProgressBar"
          style="height:3px;background:${cycleInfo.color};width:${pct}%;transition:width 0.4s;"></div>
      </div>

      <!-- Component tags -->
      <div style="padding:8px 16px 6px;display:flex;gap:6px;flex-wrap:wrap;">
        ${comps.map(c => `
          <span style="font-family:var(--vault-mono);font-size:9px;color:#505058;
            background:#1A1A1A;border-radius:4px;padding:2px 6px;letter-spacing:0.5px;">
            ${(typeof MAP_EMOJIS !== 'undefined' ? MAP_EMOJIS[c] : '') || '◈'} ${WF_COMP_NAMES[c]}
          </span>`).join('')}
      </div>

      <!-- Checklist -->
      <div style="padding:0 16px 8px;">
        ${rows}
      </div>

      ${done === items.length ? `
      <div style="padding:10px 16px;background:#0D1F0D;border-top:1px solid #1A3A1A;
        text-align:center;font-size:12px;color:#4ADE80;font-family:var(--vault-mono);letter-spacing:0.5px;">
        ✓ WEEK COMPLETE — come back ${daysLeft === 7 ? 'next Monday' : `in ${daysLeft} days`} for your next 10
      </div>` : ''}

      <!-- Pool size note -->
      ${pool.length < 10 ? `
      <div style="padding:8px 16px 10px;border-top:1px solid #1A1A1A;">
        <div style="font-size:11px;color:#383840;font-style:italic;line-height:1.5;">
          ${pool.length} Map todos available this cycle — generate The Map on more intentions to unlock a full 10.
        </div>
      </div>` : ''}

    </div>`;
}
