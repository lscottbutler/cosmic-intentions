/* ── PROGRESS MEGA DASHBOARD ─────────────────────────────
   20 metrics across 3 tiers. CI Score = weighted composite.
   Depends on globals: currentUser, sb, LS, intentions, esc
───────────────────────────────────────────────────────── */

async function renderProgressDashboard() {
  const el = document.getElementById('page-progress');
  if (!el) return;

  el.innerHTML = `<div style="padding:32px 24px;max-width:960px;margin:0 auto;">
    <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:2px;margin-bottom:4px;">◈ PROGRESS</div>
    <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:24px;">Your CI Dashboard</div>
    <div id="pd-loading" style="text-align:center;padding:60px;color:#505058;font-family:var(--vault-mono);font-size:11px;letter-spacing:1px;">
      LOADING YOUR METRICS…
    </div>
  </div>`;

  // Gather all data in parallel
  const today     = new Date().toISOString().slice(0,10);
  const weekStart = _pdWeekStart();
  const monthStart= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // Supabase activity log
  let activityRows = [];
  try {
    const { data } = await sb.from('activity_log')
      .select('event_type, points, created_at')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(500);
    activityRows = data || [];
  } catch(e) {}

  let totalScore = 0;
  try {
    const { data } = await sb.from('user_scores').select('total_score').eq('user_id', currentUser.id).single();
    totalScore = data?.total_score || 0;
  } catch(e) {}

  // ── Compute metrics ───────────────────────────────────

  // MOMENTUM
  const streak      = LS.get('ci_streak') || 0;
  const bestStreak  = Math.max(streak, LS.get('ci_best_streak') || 0,
    ...(intentions||[]).flatMap(i => (i.achievers?.commitments||[]).map(c => c.streak||0)));
  const daysAsMember= currentUser?.created_at
    ? Math.floor((Date.now() - new Date(currentUser.created_at)) / 86400000)
    : 0;
  const sessionsThisWeek = activityRows.filter(r =>
    ['viz','meditation','countdown','gratitude'].includes(r.event_type) && r.created_at >= weekStart).length;
  const sessionsThisMonth= activityRows.filter(r =>
    ['viz','meditation','countdown','gratitude'].includes(r.event_type) && r.created_at >= monthStart).length;
  const totalSessionsAll = activityRows.filter(r =>
    ['viz','meditation','countdown','gratitude'].includes(r.event_type)).length;

  // PRACTICE
  const vizPlays      = LS.get('ci_viz_plays')       || 0;
  const medSessions   = LS.get('ci_med_plays')        || 0;
  const gratSessions  = LS.get('ci_gratitude_plays')  || 0;
  const cdownSessions = activityRows.filter(r => r.event_type === 'countdown').length;
  const commitsToday  = _pdCommitsToday();
  const commitsTotal  = (intentions||[]).reduce((n,i) => n + (i.achievers?.commitments||[]).length, 0);
  const wfDone        = _pdWeeklyFocusDone();
  const mapTodos      = activityRows.filter(r => r.event_type === 'map_todo').length;

  // SYSTEM
  const goalsSet      = (intentions||[]).length;
  const commitsLocked = commitsTotal;
  const roadmapsGen   = (intentions||[]).filter(i => i.bbfw).length;
  const mapFilled     = (intentions||[]).filter(i => (i.theMap?.components||[]).length > 0).length;
  const missionItems  = (intentions||[]).reduce((n,i) =>
    n + (i.achievers?.mission_control?.items||[]).length, 0);

  // ── CI Score (0–100) ──────────────────────────────────
  const streakScore   = Math.min(streak / 30, 1) * 35;
  const practiceScore = Math.min(totalSessionsAll / 50, 1) * 40;
  const systemFrac    = Math.min(
    (goalsSet/5 * 0.3) + (commitsLocked/10 * 0.3) + (roadmapsGen/3 * 0.2) + (mapFilled/3 * 0.2), 1);
  const systemScore   = systemFrac * 25;
  const ciScore       = Math.round(streakScore + practiceScore + systemScore);

  const scoreColor = ciScore >= 75 ? '#4ADE80' : ciScore >= 40 ? '#F5A623' : '#60A0FF';
  const scoreLabel = ciScore >= 75 ? 'ELITE' : ciScore >= 40 ? 'BUILDING' : 'STARTING';

  // ── Render ────────────────────────────────────────────
  const html = `
  <div style="padding:32px 24px;max-width:960px;margin:0 auto;">

    <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:2px;margin-bottom:4px;">◈ PROGRESS</div>
    <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:24px;">Your CI Dashboard</div>

    <!-- CI SCORE HERO -->
    <div style="background:#1A1A1A;border:1px solid #2a2a2a;border-radius:16px;padding:32px;margin-bottom:32px;
      display:flex;align-items:center;gap:40px;flex-wrap:wrap;">
      <div style="text-align:center;flex-shrink:0;">
        <div style="font-size:72px;font-weight:900;color:${scoreColor};line-height:1;font-family:var(--vault-mono);">${ciScore}</div>
        <div style="font-family:var(--vault-mono);font-size:10px;color:${scoreColor};letter-spacing:2px;margin-top:4px;">${scoreLabel}</div>
        <div style="font-family:var(--vault-mono);font-size:9px;color:#505058;letter-spacing:1px;margin-top:2px;">CI SCORE / 100</div>
      </div>
      <div style="flex:1;min-width:200px;">
        ${_pdScoreBar('Consistency', streakScore, 35, '#F5A623')}
        ${_pdScoreBar('Practice', practiceScore, 40, '#60A0FF')}
        ${_pdScoreBar('System', systemScore, 25, '#4ADE80')}
        <div style="font-size:11px;color:#505058;margin-top:12px;line-height:1.6;">
          Score based on your streak, sessions completed, and how built-out your system is.
          Hit 75+ to reach Elite.
        </div>
      </div>
      <div style="text-align:center;flex-shrink:0;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:#505058;letter-spacing:1px;margin-bottom:8px;">TOTAL POINTS</div>
        <div style="font-size:40px;font-weight:900;color:#F5A623;font-family:var(--vault-mono);">${totalScore.toLocaleString()}</div>
      </div>
    </div>

    <!-- TIER 1: MOMENTUM -->
    <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:2px;margin-bottom:12px;">
      ◈ MOMENTUM — Are you showing up?
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:32px;">
      ${_pdCard('🔥', streak, 'Day Streak', '#F5A623', streak >= 7 ? 'on fire' : streak > 0 ? 'keep going' : 'start today')}
      ${_pdCard('🏆', bestStreak, 'Best Ever Streak', '#F5A623', 'personal record')}
      ${_pdCard('📅', daysAsMember, 'Days as Member', '#F5A623', 'time invested')}
      ${_pdCard('⚡', sessionsThisWeek, 'Sessions This Week', '#F5A623', 'this week')}
      ${_pdCard('📊', sessionsThisMonth, 'Sessions This Month', '#F5A623', 'this month')}
      ${_pdCard('∞', totalSessionsAll, 'Total Sessions', '#F5A623', 'all time')}
    </div>

    <!-- TIER 2: PRACTICE -->
    <div style="font-family:var(--vault-mono);font-size:10px;color:#60A0FF;font-weight:800;letter-spacing:2px;margin-bottom:12px;">
      ◈ PRACTICE — What are you doing?
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:32px;">
      ${_pdCard('👁', vizPlays, 'Viz Sessions', '#60A0FF', 'visualizations')}
      ${_pdCard('🧘', medSessions, 'Meditation Sessions', '#60A0FF', 'meditations')}
      ${_pdCard('🙏', gratSessions, 'Gratitude Sessions', '#60A0FF', 'gratitude')}
      ${_pdCard('⏱', cdownSessions, 'Countdown Sessions', '#60A0FF', 'countdowns')}
      ${_pdCard('✅', commitsToday, 'Commitments Today', '#60A0FF', `of ${commitsTotal} total`)}
      ${_pdCard('🎯', wfDone, 'Weekly Focus Done', '#60A0FF', 'this week')}
      ${_pdCard('◈', mapTodos, 'Map Todos Completed', '#60A0FF', 'all time')}
    </div>

    <!-- TIER 3: SYSTEM -->
    <div style="font-family:var(--vault-mono);font-size:10px;color:#4ADE80;font-weight:800;letter-spacing:2px;margin-bottom:12px;">
      ◈ SYSTEM — How built-out are you?
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:32px;">
      ${_pdCard('🎯', goalsSet, 'Goals Set', '#4ADE80', 'intentions')}
      ${_pdCard('🔒', commitsLocked, 'Commitments Locked', '#4ADE80', 'daily actions')}
      ${_pdCard('◈', roadmapsGen, 'Roadmaps Generated', '#4ADE80', 'BBFW roadmaps')}
      ${_pdCard('🗺', mapFilled, 'Maps Built', '#4ADE80', 'The Map data')}
      ${_pdCard('⚡', missionItems, 'Mission Items', '#4ADE80', 'generated')}
      ${_pdCard('💯', ciScore, 'CI Score', '#4ADE80', scoreLabel.toLowerCase())}
      ${_pdCard('✦', totalScore, 'Total Points', '#4ADE80', 'earned')}
    </div>

  </div>`;

  el.innerHTML = html;
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
  const checks = _wfLoadChecks();
  return Object.values(checks).filter(Boolean).length;
}

function _pdCard(icon, value, label, color, sub) {
  const v = typeof value === 'number' ? value.toLocaleString() : value;
  return `
    <div style="background:#1A1A1A;border:1px solid #222;border-radius:12px;padding:16px 12px;text-align:center;">
      <div style="font-size:24px;margin-bottom:6px;">${icon}</div>
      <div style="font-size:28px;font-weight:900;color:${color};font-family:var(--vault-mono);line-height:1;">${v}</div>
      <div style="font-size:10px;color:#ccc;font-family:var(--vault-mono);margin-top:4px;letter-spacing:0.5px;font-weight:700;">${label}</div>
      <div style="font-size:9px;color:#505058;font-family:var(--vault-mono);margin-top:2px;">${sub}</div>
    </div>`;
}

function _pdScoreBar(label, val, max, color) {
  const pct = Math.round((val / max) * 100);
  return `
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <span style="font-family:var(--vault-mono);font-size:9px;color:#888;letter-spacing:0.5px;">${label.toUpperCase()}</span>
        <span style="font-family:var(--vault-mono);font-size:9px;color:${color};">${Math.round(val)}/${max} pts</span>
      </div>
      <div style="height:6px;background:#2a2a2a;border-radius:3px;">
        <div style="height:6px;background:${color};border-radius:3px;width:${pct}%;transition:width 0.6s;"></div>
      </div>
    </div>`;
}
