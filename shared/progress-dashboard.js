/* ── PROGRESS MEGA DASHBOARD (Option B) ──────────────────
   Show only what's moving. CI Score hero. Earned metrics.
   Depends on globals: currentUser, sb, LS, intentions
───────────────────────────────────────────────────────── */

async function renderProgressDashboard() {
  const el = document.getElementById('page-progress');
  if (!el) return;

  el.innerHTML = `<div style="padding:32px 24px;max-width:720px;margin:0 auto;">
    <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:2px;margin-bottom:4px;">◈ PROGRESS</div>
    <div id="pd-loading" style="text-align:center;padding:60px;color:#505058;font-family:var(--vault-mono);font-size:11px;letter-spacing:1px;">LOADING…</div>
  </div>`;

  const weekStart  = _pdWeekStart();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  let activityRows = [], totalScore = 0;
  try {
    const { data } = await sb.from('activity_log')
      .select('event_type, points, created_at')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(500);
    activityRows = data || [];
  } catch(e) {}
  try {
    const { data } = await sb.from('user_scores').select('total_score').eq('user_id', currentUser.id).single();
    totalScore = data?.total_score || 0;
  } catch(e) {}

  // ── Raw counts ────────────────────────────────────────
  const streak      = LS.get('ci_streak') || 0;
  const bestStreak  = Math.max(streak, LS.get('ci_best_streak') || 0,
    ...(intentions||[]).flatMap(i => (i.achievers?.commitments||[]).map(c => c.streak||0)));
  const daysAsMember = currentUser?.created_at
    ? Math.floor((Date.now() - new Date(currentUser.created_at)) / 86400000) : 0;

  const vizPlays    = LS.get('ci_viz_plays')      || 0;
  const medSessions = LS.get('ci_med_plays')       || 0;
  const gratSessions= LS.get('ci_gratitude_plays') || 0;
  const cdownSessions = activityRows.filter(r => r.event_type === 'countdown').length;
  const sessionsAll   = activityRows.filter(r =>
    ['viz','meditation','countdown','gratitude'].includes(r.event_type)).length;
  const sessionsWeek  = activityRows.filter(r =>
    ['viz','meditation','countdown','gratitude'].includes(r.event_type) && r.created_at >= weekStart).length;
  const commitsToday= _pdCommitsToday();
  const wfDone      = _pdWeeklyFocusDone();
  const goalsSet    = (intentions||[]).length;
  const roadmapsGen = (intentions||[]).filter(i => i.bbfw).length;
  const mapFilled   = (intentions||[]).filter(i => (i.theMap?.components||[]).length > 0).length;
  const mapTodos    = activityRows.filter(r => r.event_type === 'map_todo').length;

  // ── Per-goal Map progress ─────────────────────────────
  const mapGoals = (intentions||[]).map(intent => {
    const components = intent.theMap?.components || [];
    const total   = components.reduce((n, comp) => n + (comp.todos?.length || 0), 0);
    const checked = components.reduce((n, comp) =>
      n + (comp.todos||[]).filter(t => t.done).length, 0);
    return { title: intent.title, total, checked };
  }).filter(g => g.total > 0);

  // ── CI Score ──────────────────────────────────────────
  const streakScore   = Math.min(streak / 30, 1) * 35;
  const practiceScore = Math.min(sessionsAll / 50, 1) * 40;
  const systemFrac    = Math.min(
    (goalsSet/5 * 0.3) + ((roadmapsGen||0)/3 * 0.4) + ((mapFilled||0)/3 * 0.3), 1);
  const systemScore   = systemFrac * 25;
  const ciScore       = Math.round(streakScore + practiceScore + systemScore);
  const scoreColor    = ciScore >= 75 ? '#4ADE80' : ciScore >= 40 ? '#F5A623' : '#60A0FF';
  const scoreLabel    = ciScore >= 75 ? 'ELITE' : ciScore >= 40 ? 'BUILDING' : 'STARTING';

  // ── Practices with value > 0 (sorted by count) ───────
  const practices = [
    { label: 'Visualizations',  count: vizPlays,      icon: '👁',  nav: `launchPlayer('viz-quick')` },
    { label: 'Meditations',     count: medSessions,   icon: '🧘',  nav: `openMeditationModal()` },
    { label: 'Gratitude',       count: gratSessions,  icon: '🙏',  nav: `launchPlayer('gratitude')` },
    { label: 'Countdowns',      count: cdownSessions, icon: '⏱',   nav: `openTimerPicker()` },
    { label: 'Sessions this week', count: sessionsWeek, icon: '⚡', nav: null },
    { label: 'Commitments today', count: commitsToday, icon: '✅',  nav: null },
    { label: 'Weekly focus done', count: wfDone,       icon: '🎯',  nav: null },
  ].filter(p => p.count > 0).sort((a,b) => b.count - a.count);

  // ── System metrics with value > 0 ─────────────────────
  const system = [
    { label: 'Goals set',          count: goalsSet,    icon: '🎯' },
    { label: 'Roadmaps generated', count: roadmapsGen, icon: '◈'  },
    { label: 'Maps built',         count: mapFilled,   icon: '🗺'  },
    { label: 'Total points',       count: totalScore,  icon: '✦'  },
    { label: 'Best ever streak',   count: bestStreak,  icon: '🏆'  },
  ].filter(s => s.count > 0);

  // ── What to unlock next ───────────────────────────────
  const unlockQueue = [
    { test: vizPlays === 0,     cta: 'Try your first Visualization',    action: `launchPlayer('viz-quick')`,  icon: '👁'  },
    { test: medSessions === 0,  cta: 'Try your first Meditation',        action: `openMeditationModal()`,      icon: '🧘'  },
    { test: gratSessions === 0, cta: 'Try your first Gratitude session', action: `launchPlayer('gratitude')`,  icon: '🙏'  },
    { test: goalsSet === 0,     cta: 'Set your first Intention',         action: `navTo('setup')`,             icon: '🎯'  },
    { test: roadmapsGen === 0,  cta: 'Generate your first Roadmap',      action: `navTo('dashboard')`,         icon: '◈'  },
    { test: mapFilled === 0,    cta: 'Build out The Map on a goal',      action: `navTo('dashboard')`,         icon: '🗺'  },
    { test: streak === 0,       cta: 'Start a daily streak today',       action: `navTo('dashboard')`,         icon: '🔥'  },
  ];
  const nextUnlock = unlockQueue.find(u => u.test);

  // ── Render ────────────────────────────────────────────
  const isNew = sessionsAll === 0 && goalsSet === 0;

  el.innerHTML = `<div style="padding:32px 24px;max-width:720px;margin:0 auto;">

    <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:2px;margin-bottom:24px;">◈ PROGRESS</div>

    <!-- CI SCORE HERO -->
    <div style="background:#1A1A1A;border:1px solid #2a2a2a;border-radius:20px;padding:36px 32px;margin-bottom:28px;
      display:flex;align-items:center;gap:40px;flex-wrap:wrap;">
      <div style="text-align:center;flex-shrink:0;">
        <div style="font-size:88px;font-weight:900;color:${scoreColor};line-height:1;font-family:var(--vault-mono);">${ciScore}</div>
        <div style="font-family:var(--vault-mono);font-size:11px;color:${scoreColor};letter-spacing:3px;margin-top:6px;font-weight:800;">${scoreLabel}</div>
        <div style="font-family:var(--vault-mono);font-size:9px;color:#383840;letter-spacing:1px;margin-top:3px;">CI SCORE</div>
      </div>
      <div style="flex:1;min-width:180px;">
        ${streak > 0 ? `<div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:4px;">🔥 ${streak}-day streak</div>` : ''}
        ${daysAsMember > 0 ? `<div style="font-family:var(--vault-mono);font-size:10px;color:#505058;margin-bottom:16px;">Member for ${daysAsMember} day${daysAsMember===1?'':'s'}</div>` : ''}
        ${_pdScoreBar('Consistency', streakScore, 35, '#F5A623')}
        ${_pdScoreBar('Practice',    practiceScore, 40, '#60A0FF')}
        ${_pdScoreBar('System',      systemScore, 25, '#4ADE80')}
        <div style="font-size:10px;color:#383840;margin-top:10px;line-height:1.6;">Hit 75 to reach Elite.</div>
      </div>
    </div>

    ${isNew ? `
    <!-- EMPTY STATE -->
    <div style="background:#1A1A1A;border:1px solid #222;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
      <div style="font-size:32px;margin-bottom:12px;">◈</div>
      <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:8px;">Your dashboard activates as you use CI.</div>
      <div style="font-size:12px;color:#505058;line-height:1.7;max-width:320px;margin:0 auto 20px;">
        Every session you run, every commitment you check, every goal you build — it shows up here.
        Nothing to prove yet. Just start.
      </div>
      <button onclick="navTo('dashboard')" style="background:#F5A623;border:none;border-radius:8px;
        padding:10px 20px;font-family:var(--vault-mono);font-size:10px;font-weight:800;color:#000;cursor:pointer;letter-spacing:1px;">
        GO TO DASHBOARD →
      </button>
    </div>` : ''}

    ${practices.length > 0 ? `
    <!-- WHAT'S MOVING -->
    <div style="margin-bottom:28px;">
      <div style="font-family:var(--vault-mono);font-size:9px;color:#505058;font-weight:800;letter-spacing:2px;margin-bottom:12px;">WHAT'S MOVING</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;">
        ${practices.map(p => `
          <div style="background:#1A1A1A;border:1px solid #222;border-radius:12px;padding:16px 12px;text-align:center;
            ${p.nav ? 'cursor:pointer;' : ''}" ${p.nav ? `onclick="${p.nav}"` : ''}>
            <div style="font-size:22px;margin-bottom:6px;">${p.icon}</div>
            <div style="font-size:26px;font-weight:900;color:#fff;font-family:var(--vault-mono);line-height:1;">${p.count.toLocaleString()}</div>
            <div style="font-size:9px;color:#505058;font-family:var(--vault-mono);margin-top:4px;letter-spacing:0.5px;">${p.label.toUpperCase()}</div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    ${system.length > 0 ? `
    <!-- YOUR SYSTEM -->
    <div style="margin-bottom:28px;">
      <div style="font-family:var(--vault-mono);font-size:9px;color:#505058;font-weight:800;letter-spacing:2px;margin-bottom:12px;">YOUR SYSTEM</div>
      <div style="background:#1A1A1A;border:1px solid #222;border-radius:12px;overflow:hidden;">
        ${system.map((s,i) => `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;
            ${i < system.length-1 ? 'border-bottom:1px solid #1f1f1f;' : ''}">
            <span style="font-size:16px;width:24px;text-align:center;">${s.icon}</span>
            <span style="font-size:12px;color:#aaa;flex:1;">${s.label}</span>
            <span style="font-family:var(--vault-mono);font-size:14px;font-weight:800;color:#fff;">${s.count.toLocaleString()}</span>
          </div>`).join('')}
      </div>
    </div>` : ''}

    ${mapGoals.length > 0 ? `
    <!-- THE MAP — TROPHY CABINET -->
    <div style="margin-bottom:28px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-family:var(--vault-mono);font-size:9px;color:#505058;font-weight:800;letter-spacing:2px;">THE MAP</div>
        ${mapTodos > 0 ? `<div style="font-family:var(--vault-mono);font-size:9px;color:#4ADE80;">${mapTodos} milestone${mapTodos===1?'':'s'} completed</div>` : ''}
      </div>
      <div style="background:#1A1A1A;border:1px solid #222;border-radius:12px;overflow:hidden;">
        ${mapGoals.map((g,i) => {
          const pct  = g.total > 0 ? Math.round((g.checked / g.total) * 100) : 0;
          const done = g.checked === g.total && g.total > 0;
          const barColor = done ? '#4ADE80' : pct >= 50 ? '#F5A623' : '#60A0FF';
          const title = g.title.replace(/^i am\s+/i,'').replace(/\b\w/g, c => c.toUpperCase());
          return `
          <div style="padding:14px 16px;${i < mapGoals.length-1 ? 'border-bottom:1px solid #1f1f1f;' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <div style="font-size:12px;color:${done?'#4ADE80':'#ccc'};font-weight:${done?'700':'400'};
                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:75%;">${done?'✓ ':''} ${title}</div>
              <div style="font-family:var(--vault-mono);font-size:10px;color:${barColor};font-weight:800;flex-shrink:0;">${g.checked}/${g.total}</div>
            </div>
            <div style="height:4px;background:#252525;border-radius:2px;">
              <div style="height:4px;background:${barColor};border-radius:2px;width:${pct}%;"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    ${nextUnlock ? `
    <!-- UNLOCK NEXT -->
    <div style="border:1px solid #2a2a2a;border-radius:12px;padding:20px;display:flex;align-items:center;gap:16px;">
      <span style="font-size:24px;">${nextUnlock.icon}</span>
      <div style="flex:1;">
        <div style="font-family:var(--vault-mono);font-size:9px;color:#505058;letter-spacing:1px;margin-bottom:4px;">UNLOCK NEXT</div>
        <div style="font-size:13px;font-weight:700;color:#fff;">${nextUnlock.cta}</div>
      </div>
      <button onclick="${nextUnlock.action}" style="background:none;border:1px solid #383838;border-radius:8px;
        padding:8px 14px;font-family:var(--vault-mono);font-size:9px;color:#888;cursor:pointer;letter-spacing:1px;white-space:nowrap;">
        GO →
      </button>
    </div>` : ''}

  </div>`;
}

/* ── Helpers ─────────────────────────────────────────── */
function _pdWeekStart() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0,0,0,0);
  return d.toISOString();
}

function _pdCommitsToday() {
  const today = new Date().toISOString().slice(0,10);
  return (intentions||[]).reduce((n,i) =>
    n + (i.achievers?.commitments||[]).filter(c => !!c.checks?.[today]).length, 0);
}

function _pdWeeklyFocusDone() {
  if (typeof _wfLoadChecks !== 'function') return 0;
  return Object.values(_wfLoadChecks()).filter(Boolean).length;
}

function _pdScoreBar(label, val, max, color) {
  const pct = Math.round((val / max) * 100);
  return `
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <span style="font-family:var(--vault-mono);font-size:9px;color:#505058;">${label.toUpperCase()}</span>
        <span style="font-family:var(--vault-mono);font-size:9px;color:${color};">${Math.round(val)}/${max}</span>
      </div>
      <div style="height:5px;background:#252525;border-radius:3px;">
        <div style="height:5px;background:${color};border-radius:3px;width:${pct}%;"></div>
      </div>
    </div>`;
}
