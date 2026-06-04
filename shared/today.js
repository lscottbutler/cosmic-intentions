/* ── TODAY MODULE ────────────────────────────────────────
   The daily dashboard — sessions, commitments, weekly focus.
   Depends on globals: intentions, esc, LS, logActivity,
   launchPlayer, openMeditationModal, openTimerPicker,
   MAP_EMOJIS (the-map.js), renderWeeklyFocus
───────────────────────────────────────────────────────── */

const TODAY_SESSIONS = [
  { icon: '⚡', label: 'Quick Viz',     sub: '15 / 30 / 60s', action: `launchPlayer('viz-quick')`,   color: '#F5A623' },
  { icon: '🧘', label: 'Meditation',    sub: '5 – 60 min',    action: `openMeditationModal()`,        color: '#BF5AF2' },
  { icon: '🙏', label: 'Gratitude',     sub: '5 min',         action: `launchPlayer('gratitude')`,    color: '#30D158' },
  { icon: '✨', label: '3-Min Viz',     sub: '3 min',         action: `launchPlayer('viz-3min')`,     color: '#0A84FF' },
  { icon: '🌟', label: '10-Min Viz',    sub: '10 min',        action: `launchPlayer('viz-10min')`,    color: '#FF375F' },
  { icon: '⏱️', label: 'Countdown',     sub: '1 – 60 min',    action: `openTimerPicker()`,            color: '#FF9F0A' },
];

/* ── Helpers ─────────────────────────────────────────── */
function _todayKey() {
  return new Date().toISOString().slice(0,10);
}

function _todayDayOfYear() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

function _todayDaysLeft() {
  const d = new Date();
  const isLeap = (y => (y%4===0&&y%100!==0)||y%400===0)(d.getFullYear());
  return (isLeap ? 366 : 365) - _todayDayOfYear();
}

function _todayDateStr() {
  return new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
}

/* ── Pull all daily commitments across intentions ──── */
function _todayGetCommitments() {
  const today  = _todayKey();
  const result = [];
  (intentions || []).forEach((intent, intentIdx) => {
    const commits = intent?.achievers?.commitments || [];
    commits.forEach((c, commitIdx) => {
      result.push({
        text:       c.text,
        done:       !!c.checks?.[today],
        streak:     c.streak || 0,
        intentIdx,
        commitIdx,
        intention:  intent.title,
      });
    });
  });
  return result;
}

/* ── Toggle a daily commitment ───────────────────────── */
function todayToggleCommit(intentIdx, commitIdx) {
  const intent = intentions[intentIdx];
  const commit = intent?.achievers?.commitments?.[commitIdx];
  if (!commit) return;

  const today   = _todayKey();
  if (!commit.checks) commit.checks = {};
  const wasDone       = !!commit.checks[today];
  commit.checks[today] = !wasDone;

  // Recalculate streak
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0,10);
    if (commit.checks[key]) { streak++; d.setDate(d.getDate()-1); }
    else break;
  }
  commit.streak = streak;

  if (!wasDone) logActivity('map_todo', { todo: commit.text.slice(0,60) }, 5);

  if (typeof syncIntentionsToSupabase === 'function') syncIntentionsToSupabase();
  renderTodayView(); // re-render to update state
}

/* ── Session tracking ────────────────────────────────── */
function _todayGetSessionsDone() {
  return LS.get(`ci_today_sessions_${_todayKey()}`) || [];
}

function todayMarkSession(sessionLabel) {
  const key  = `ci_today_sessions_${_todayKey()}`;
  const done = LS.get(key) || [];
  if (!done.includes(sessionLabel)) {
    done.push(sessionLabel);
    LS.set(key, done);
  }
  renderTodayView();
}

/* ── Main render ─────────────────────────────────────── */
function renderTodayView() {
  const el = document.getElementById('todayPanel');
  if (!el) return;

  const dayNum     = _todayDayOfYear();
  const daysLeft   = _todayDaysLeft();
  const dateStr    = _todayDateStr();
  const commits    = _todayGetCommitments();
  const sessionsDone = _todayGetSessionsDone();
  const doneSessions = sessionsDone.length;
  const doneCommits  = commits.filter(c => c.done).length;

  /* ── Header ───────────────────────────────────────── */
  const header = `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:1px;">◈ TODAY</div>
          <div style="font-size:15px;font-weight:700;color:#fff;margin-top:2px;">${dateStr}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--vault-mono);font-size:10px;color:#505058;">Day ${dayNum} of ${dayNum + daysLeft}</div>
          <div style="font-family:var(--vault-mono);font-size:10px;color:#383840;">${daysLeft} days remaining</div>
        </div>
      </div>
      <div style="height:3px;background:#1A1A1A;border-radius:2px;margin-top:10px;">
        <div style="height:3px;background:#F5A623;border-radius:2px;width:${Math.round((dayNum/(dayNum+daysLeft))*100)}%;"></div>
      </div>
    </div>`;

  /* ── Sessions ─────────────────────────────────────── */
  const sessionCards = TODAY_SESSIONS.map(s => {
    const done = sessionsDone.includes(s.label);
    return `
      <div style="background:${done?'#1A2A1A':'#1A1A1A'};border:1px solid ${done?'#2A4A2A':'#2A2A2A'};
        border-radius:10px;padding:12px 8px;text-align:center;cursor:pointer;transition:all 0.15s;"
        onclick="(function(){ ${s.action}; todayMarkSession('${s.label}'); })()">
        <div style="font-size:22px;margin-bottom:4px;">${s.icon}</div>
        <div style="font-size:11px;font-weight:700;color:${done?'#4ADE80':s.color};line-height:1.3;">${s.label}</div>
        <div style="font-size:9px;color:#505058;margin-top:2px;font-family:var(--vault-mono);">${s.sub}</div>
        ${done ? `<div style="font-size:9px;color:#4ADE80;margin-top:4px;font-family:var(--vault-mono);">✓ done</div>` : ''}
      </div>`;
  }).join('');

  const sessionsSection = `
    <div style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:#505058;font-weight:700;letter-spacing:1px;">SESSIONS</div>
        <div style="font-family:var(--vault-mono);font-size:10px;color:${doneSessions>0?'#4ADE80':'#505058'};">${doneSessions} done today</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${sessionCards}
      </div>
    </div>`;

  /* ── Daily Commitments ────────────────────────────── */
  let commitsSection = '';
  if (commits.length > 0) {
    const rows = commits.map(c => {
      const streak     = c.streak || 0;
      const streakTxt  = streak === 0 ? '' : streak >= 7 ? `🔥🔥 ${streak}d` : `🔥 ${streak}d`;
      return `
        <div style="background:#fff;border-radius:8px;padding:11px 14px;margin-bottom:8px;cursor:pointer;
          display:flex;align-items:flex-start;gap:10px;"
          onclick="todayToggleCommit(${c.intentIdx},${c.commitIdx})">
          <div style="width:18px;height:18px;border-radius:4px;flex-shrink:0;margin-top:1px;
            border:2px solid ${c.done?'#30D158':'#ccc'};background:${c.done?'#30D158':'transparent'};
            display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;transition:all 0.15s;">
            ${c.done?'✓':''}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:${c.done?'#aaa':'#111'};line-height:1.4;
              text-decoration:${c.done?'line-through':''};">${esc(c.text)}</div>
            <div style="font-size:10px;color:#999;margin-top:2px;display:flex;justify-content:space-between;">
              <span style="font-family:var(--vault-mono);">${esc(c.intention.replace(/^i am /i,'').slice(0,30))}${c.intention.length>35?'…':''}</span>
              ${streakTxt ? `<span style="color:${streak>=7?'#F5A623':'#888'}">${streakTxt}</span>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');

    commitsSection = `
      <div style="margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="font-family:var(--vault-mono);font-size:10px;color:#505058;font-weight:700;letter-spacing:1px;">MY COMMITMENTS</div>
          <div style="font-family:var(--vault-mono);font-size:10px;color:${doneCommits===commits.length&&commits.length>0?'#4ADE80':'#505058'};">
            ${doneCommits} / ${commits.length} done
          </div>
        </div>
        ${rows}
        ${doneCommits === commits.length && commits.length > 0 ? `
        <div style="text-align:center;padding:8px;font-size:11px;color:#4ADE80;font-family:var(--vault-mono);">
          ✓ All commitments done today — legendary.
        </div>` : ''}
      </div>`;
  } else {
    commitsSection = `
      <div style="margin-bottom:20px;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:#505058;font-weight:700;letter-spacing:1px;margin-bottom:8px;">MY COMMITMENTS</div>
        <div style="font-size:12px;color:#383840;font-style:italic;padding:8px 0;">
          No commitments yet — generate Mission Control on an intention, flag YES items, then lock them in.
        </div>
      </div>`;
  }

  el.innerHTML = header + sessionsSection + commitsSection;

  // Weekly Focus renders into its own slot below
  if (typeof renderWeeklyFocus === 'function') renderWeeklyFocus();
}
