/* ── PER-PAGE "WHERE YOU STAND" RECAP ─────────────────────
   Scott 13 Nov 2026: the admin welcome box (page-welcome-<page>) on each
   player page doubles as a live recap of where THIS member stands on that
   page's domain (TO DO · habits · meditation · visualization · wins).
   Read-only — admin boxes carry no pen on player pages (hard rule 12 Nov 2026).

   Data sources (the same stores the rest of the app reads, so the recap
   cannot drift from the pages it summarizes):
     · Supabase activity_log                    — sessions by type / week / streak
     · intentions[].theMap.components[].todos   — goal to-do progress
     · localStorage ci_habit_list + ci_habits_<date> — habit ticks per day
     · localStorage ci_wins / ci_streak / ci_best_streak / ci_*_plays
────────────────────────────────────────────────────────── */
import { sb, LS, intentions, dayKey, esc, currentUser, saveIntentions, goalBadge, goalLetter, GOAL_COLORS } from '../app.js';

function _habitTickCount(dateKey) {
  return Object.keys(LS.get('ci_habits_' + dateKey) || {}).length;
}

/* Consecutive days (ending today, or yesterday when today is still empty)
   with at least one habit check-off. */
function _habitDayStreak() {
  const d = new Date();
  let streak = 0;
  if (_habitTickCount(dayKey(d)) === 0) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 730; i++) {
    if (_habitTickCount(dayKey(d)) > 0) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

/* Goal action progress — the same actions the TO DO page lists:
   your own actions (incl. sub-steps) plus the goal's roadmap tasks,
   and any legacy map to-dos. */
function _countTree(nodes) {
  let total = 0, done = 0;
  (nodes || []).forEach(n => { total++; if (n.done) done++; const c = _countTree(n.children); total += c.total; done += c.done; });
  return { total, done };
}
function _todoTotals() {
  let total = 0, done = 0;
  (intentions || []).forEach(i => {
    const rai = i.roadmapAI || {};
    const u = _countTree(rai.userTasks); total += u.total; done += u.done;
    if (!rai.intention || String(rai.intention).trim() === String(i.title || '').trim()) {
      (rai.tasks || []).forEach((_, k) => { total++; if ((rai.done || {})[k]) done++; });
    }
    (i.theMap?.components || []).forEach(c => (c.todos || []).forEach(t => { total++; if (t.done) done++; }));
  });
  return { total, done, remaining: Math.max(0, total - done) };
}

/* Recent activity_log rows for the signed-in member (empty in preview). */
async function _activity() {
  const user = currentUser;
  if (!user || !user.id || !sb) return [];
  try {
    const { data } = await sb.from('activity_log')
      .select('event_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500);
    return data || [];
  } catch (e) { return []; }
}

function _weekStartISO() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const _weekAgoKey = () => dayKey(new Date(Date.now() - 7 * 86400000));

/* Consecutive-day streak for one activity type, from activity_log rows. */
function _eventStreak(rows, type) {
  const days = new Set(rows.filter(r => r.event_type === type).map(r => String(r.created_at).slice(0, 10)));
  const d = new Date();
  let streak = 0;
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 730; i++) {
    if (days.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

/* Domain-specific recap per player page. Resolves to {title, rows} or null. */
export async function getPageRecap(pageId) {
  const wins = LS.get('ci_wins') || [];
  const rows = [];

  if (pageId === 'goalworkspace' || pageId === 'habits') {
    const list = LS.get('ci_habit_list') || [];
    const t = _todoTotals();
    rows.push({ label: 'HABITS TODAY',     value: `${_habitTickCount(dayKey())}/${list.length}` });
    rows.push({ label: 'TO-DOS REMAINING', value: String(t.remaining), sub: t.total ? `of ${t.total}` : '' });
    rows.push({ label: 'DAY STREAK',       value: String(_habitDayStreak()), unit: 'days' });
    rows.push({ label: 'WINS LOGGED',      value: String(wins.length) });
    return { title: 'WHERE YOU STAND · TO DO', rows };
  }

  if (pageId === 'meditation') {
    const a = await _activity();
    const total = Math.max(a.filter(r => r.event_type === 'meditation').length, LS.get('ci_med_plays') || 0);
    const week  = a.filter(r => r.event_type === 'meditation' && r.created_at >= _weekStartISO()).length;
    rows.push({ label: 'SESSIONS',    value: String(total) });
    rows.push({ label: 'THIS WEEK',   value: String(week) });
    rows.push({ label: 'DAY STREAK',  value: String(_eventStreak(a, 'meditation')), unit: 'days' });
    rows.push({ label: 'WINS LOGGED', value: String(wins.length) });
    return { title: 'WHERE YOU STAND · MEDITATION', rows };
  }

  if (pageId === 'vizgoal' || pageId === 'super-viz' || pageId === 'vizlibrary') {
    const a = await _activity();
    const total = Math.max(a.filter(r => r.event_type === 'viz').length, LS.get('ci_viz_plays') || 0);
    const week  = a.filter(r => r.event_type === 'viz' && r.created_at >= _weekStartISO()).length;
    rows.push({ label: 'VISUALIZATIONS', value: String(total) });
    rows.push({ label: 'THIS WEEK',      value: String(week) });
    rows.push({ label: 'DAY STREAK',     value: String(_eventStreak(a, 'viz')), unit: 'days' });
    rows.push({ label: 'WINS LOGGED',    value: String(wins.length) });
    return { title: 'WHERE YOU STAND · VISUALIZATION', rows };
  }

  if (pageId === 'wins') {
    const streak = LS.get('ci_streak') || 0;
    const best   = Math.max(streak, LS.get('ci_best_streak') || 0);
    rows.push({ label: 'TOTAL WINS',     value: String(wins.length) });
    rows.push({ label: 'THIS WEEK',      value: String(wins.filter(w => (w.date || '') >= _weekAgoKey()).length) });
    rows.push({ label: 'CURRENT STREAK', value: String(streak), unit: 'days' });
    rows.push({ label: 'BEST STREAK',    value: String(best), unit: 'days' });
    return { title: 'WHERE YOU STAND · WINS', rows };
  }

  // Default recap — overall practice pulse.
  const a = await _activity();
  const any = ['viz', 'meditation', 'countdown', 'gratitude'];
  rows.push({ label: 'SESSIONS THIS WEEK', value: String(a.filter(r => any.includes(r.event_type) && r.created_at >= _weekStartISO()).length) });
  rows.push({ label: 'DAY STREAK',         value: String(LS.get('ci_streak') || 0), unit: 'days' });
  rows.push({ label: 'GOALS SET',          value: String((intentions || []).length) });
  rows.push({ label: 'WINS LOGGED',        value: String(wins.length) });
  return { title: 'WHERE YOU STAND', rows };
}

/* Render the recap inside an admin box element, below the admin copy. */
export function renderPageRecap(boxEl, pageId) {
  if (!boxEl) return;
  const host = document.createElement('div');
  host.className = 'ci-page-recap';
  boxEl.appendChild(host);
  getPageRecap(pageId).then(recap => {
    if (!recap || !recap.rows || !recap.rows.length) { host.remove(); return; }
    host.innerHTML =
      '<div class="ci-page-recap-title">' + esc(recap.title) + '</div>' +
      '<div class="ci-page-recap-grid">' + recap.rows.map(r =>
        '<div class="ci-page-recap-stat">' +
          '<div class="ci-page-recap-num">' + esc(r.value) + (r.unit ? '<span class="ci-page-recap-unit">' + esc(r.unit) + '</span>' : '') + '</div>' +
          '<div class="ci-page-recap-lbl">' + esc(r.label) + '</div>' +
        '</div>').join('') + '</div>';
    host.classList.add('is-live');
    // The recap shows even when the admin copy is blank.
    boxEl.style.display = '';
  }).catch(() => host.remove());
}

/* ── REVIEW paragraph (Scott 13 Nov 2026) ─────────────────────────────
   One stand-alone progress paragraph per trackable page, shown in the top
   card under the page title. Habits builds its own in member-design-test.js. */
const _MISSION = 'Remember, every step moves you one step closer to becoming who you want to be.';
function _who() {
  const n = String((LS.get('ci_pegboard') || {})['pb-name'] || '').trim().split(/\s+/)[0];
  return n ? '<strong>' + esc(n) + '</strong>, y' : 'Y';
}
const _b = v => '<strong>' + esc(String(v)) + '</strong>';
const _s = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
export async function getPageReview(pageId) {
  const who = _who();
  if (pageId === 'goalworkspace') {
    const t = _todoTotals();
    if (!t.total) return `${who}ou haven't added any to-dos yet. Open a goal and add your first next step. ${_MISSION}`;
    return `${who}ou've completed ${_b(t.done + ' of your ' + t.total)} to-dos across your goals, with ${_b(t.remaining)} still to go. Pick the next one and take care of business. ${_MISSION}`;
  }
  if (pageId === 'setup') {
    const g = (intentions || []).length, t = _todoTotals();
    if (!g) return `${who}ou haven't set a goal yet. Write your first one in your own words. ${_MISSION}`;
    return `${who}ou've currently got ${_b(_s(g, 'goal'))} in motion and you've completed ${_b(t.done + ' of ' + t.total)} of the actions behind them. ${_MISSION}`;
  }
  if (pageId === 'meditation') {
    const a = await _activity();
    const total = Math.max(a.filter(r => r.event_type === 'meditation').length, LS.get('ci_med_plays') || 0);
    const week = a.filter(r => r.event_type === 'meditation' && r.created_at >= _weekStartISO()).length;
    const streak = _eventStreak(a, 'meditation');
    if (!total) return `${who}our first meditation is waiting. Choose a length and press Play. ${_MISSION}`;
    const run = streak > 1 ? ` Today marks ${_b(streak + ' days in a row')} that you've shown up.` : streak === 1 ? ' You showed up today.' : ' Meditate today to start a new streak.';
    return `${who}ou've completed ${_b(_s(total, 'meditation session'))} so far, ${_b(week)} of them this week.${run} ${_MISSION}`;
  }
  if (pageId === 'super-viz' || pageId === 'vizlibrary' || pageId === 'vizgoal') {
    const total = LS.get('ci_viz_plays') || 0;
    if (!total) return `${who}our first visualization is waiting. Choose a goal and rehearse the next step. ${_MISSION}`;
    return `${who}ou've completed ${_b(_s(total, 'visualization session'))} so far. Every rehearsal makes the next step feel more familiar. ${_MISSION}`;
  }
  if (pageId === 'gratitude') {
    const total = LS.get('ci_gratitude_plays') || 0;
    if (!total) return `${who}our first gratitude practice is waiting. Press Play to begin. ${_MISSION}`;
    return `${who}ou've completed ${_b(_s(total, 'gratitude session'))} so far. Noticing what's good keeps you moving forward. ${_MISSION}`;
  }
  return '';
}
if (typeof window !== 'undefined') window.ciPageReview = getPageReview;

/* ── MY FOCUS TODAY (Scott 16 Nov 2026) ─────────────────────────────
   One place that shows what the member is working on right now. Phase 1 is
   automatic (no setup): today's habits, next 3 actions from their goals,
   and their practice (meditation / visualization / gratitude). */
function _pj(v) { if (!v) return null; if (typeof v === 'object') return v; try { return JSON.parse(v); } catch (e) { return null; } }
function _openTasks(rai, goal) {
  const out = [];
  const walk = nodes => (nodes || []).forEach(n => { if (!n.done && n.text) out.push({ text: n.text, goal }); walk(n.children); });
  walk(rai.userTasks);
  // Same rule as the TO DO page: roadmap tasks only count when they belong to this goal.
  if (!rai.intention || String(rai.intention).trim() === String(goal || '').trim()) (rai.tasks || []).forEach((t, k) => { const txt = typeof t === 'string' ? t : (t && (t.text || t.title || t.task)); if (txt && !(rai.done || {})[k]) out.push({ text: txt, goal }); });
  return out;
}
export async function getFocusToday() {
  let rows = (intentions || []).map(i => ({ title: i.title, rai: i.roadmapAI || {} }));
  if (!rows.length && currentUser) {
    const { data } = await sb.from('intentions').select('id,title,roadmap_ai,position').eq('user_id', currentUser.id).order('position', { ascending: true });
    rows = (data || []).map(r => ({ title: r.title, rai: _pj(r.roadmap_ai) || {} }));
  }
  const actions = [];
  rows.forEach(r => _openTasks(r.rai, r.title).forEach(t => actions.push(t)));
  const list = LS.get('ci_habit_list') || [];
  const done = LS.get('ci_habits_' + dayKey()) || {};
  const habitsDone = list.filter(h => done[h.id]).length;
  const a = await _activity();
  const lastMed = a.filter(r => r.event_type === 'meditation').map(r => r.created_at).sort().pop() || null;
  const name = String((LS.get('ci_pegboard') || {})['pb-name'] || '').trim().split(/\s+/)[0];
  return {
    name, goals: rows.length,
    habits: { total: list.length, done: habitsDone, left: Math.max(0, list.length - habitsDone) },
    actions: actions.slice(0, 3), actionsOpen: actions.length,
    practice: { lastMeditation: lastMed, meditations: Math.max(a.filter(r => r.event_type === 'meditation').length, LS.get('ci_med_plays') || 0), viz: LS.get('ci_viz_plays') || 0, gratitude: LS.get('ci_gratitude_plays') || 0 },
  };
}
if (typeof window !== 'undefined') window.ciFocusToday = getFocusToday;

/* PIN TO FOCUS (Scott 16 Nov 2026): member's own pinned goals (max 5), skills (max 3)
   and words (max 5). Saved to the member's account: player_personal_notes page 'focus-pins'. */
export async function getFocusPins() {
  const empty = { goals: [], skills: [], words: [] };
  let pins = empty;
  if (currentUser) {
    const { data } = await sb.from('player_personal_notes').select('body').eq('user_id', currentUser.id).eq('page_id', 'focus-pins').maybeSingle();
    pins = { ...empty, ...(_pj(data?.body) || {}) };
  }
  let goals = (intentions || []).map(i => i.title).filter(Boolean);
  let todoRows = (intentions || []).map(i => ({ id: i.id, title: i.title, rai: i.roadmapAI || {} }));
  if (!goals.length && currentUser) {
    const { data } = await sb.from('intentions').select('id,title,roadmap_ai,position').eq('user_id', currentUser.id).order('position', { ascending: true });
    goals = (data || []).map(r => r.title).filter(Boolean);
    todoRows = (data || []).map(r => ({ id: r.id, title: r.title, rai: _pj(r.roadmap_ai) || {} }));
  }
  const { ENT_CARDS } = await import('./ent-library-content.js');
  const goalIds = Object.fromEntries((intentions || []).map(i => [i.title, String(i.id)]));
  const goalTodos = Object.fromEntries(todoRows.map(r => [r.title, _openTasks(r.rai, r.title).map(t => t.text)]));
  // Scott 23 Nov 2026: same letter badge as the Roadmap.
  const goalBadges = Object.fromEntries(todoRows.map((r, i) => { const L = goalLetter({ id: r.id }, i); const ci = /^[A-Z]$/.test(L) ? L.charCodeAt(0) - 65 : i; const gc = GOAL_COLORS[((ci % GOAL_COLORS.length) + GOAL_COLORS.length) % GOAL_COLORS.length] || { bg: '#1D3557', text: '#fff' }; return [r.title, goalBadge(L, gc.bg, gc.text, 51)]; }));
  return { signedIn: !!currentUser, pins, goalIds, goalTodos, goalBadges, options: { goals, skills: ENT_CARDS.map(c => ({ key: c.key, title: c.title })) } };
}
export async function saveFocusPins(p) {
  if (!currentUser) throw new Error('Not signed in');
  const clean = { goals: (p.goals || []).slice(0, 5), skills: (p.skills || []).slice(0, 3), words: (p.words || []).map(w => String(w).trim()).filter(Boolean).slice(0, 5) };
  const { error } = await sb.from('player_personal_notes').upsert({ user_id: currentUser.id, page_id: 'focus-pins', title: 'MY FOCUS PINS', body: JSON.stringify(clean), updated_at: new Date().toISOString() }, { onConflict: 'user_id,page_id' });
  if (error) throw error;
  return clean;
}
if (typeof window !== 'undefined') { window.ciFocusPins = getFocusPins; window.ciSaveFocusPins = saveFocusPins; }


/* ── DAY CARD (Scott 18 Nov 2026) ─────────────────────────────────────────────
   Big Five snapshot stamped on each journal entry when it's saved. Score = X of 5.
   Meditate: ≥1 completed session today · Habits: ≥ half ticked · Goals: Goals page opened today
   Visualize: ≥1 completed session today · Action Plan: ≥1 to-do finished today (vs. today's first count). */
function _todoBaseline() {
  const key = 'ci_todo_base_' + dayKey();
  if (!(intentions || []).length) return null;
  let base = LS.get(key);
  if (base == null) { base = _todoTotals().done; LS.set(key, base); }
  return base;
}
if (typeof window !== 'undefined') { setInterval(_todoBaseline, 60000); setTimeout(_todoBaseline, 8000); }
export async function getDayCard() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const today = (await _activity()).filter(r => new Date(r.created_at) >= start);
  const list = LS.get('ci_habit_list') || [];
  const ticks = LS.get('ci_habits_' + dayKey()) || {};
  const hDone = list.filter(h => ticks[h.id]).length;
  const base = _todoBaseline();
  const todos = base == null ? 0 : Math.max(0, _todoTotals().done - base);
  const card = {
    m: today.some(r => r.event_type === 'meditation'),
    h: [hDone, list.length],
    g: !!LS.get('ci_goal_touch_' + dayKey()),
    v: today.some(r => r.event_type === 'visualize'),
    a: todos,
  };
  card.score = [card.m, list.length && hDone * 2 >= list.length, card.g, card.v, card.a >= 1].filter(Boolean).length;
  return card;
}
if (typeof window !== 'undefined') window.ciDayCard = getDayCard;

/* Scott 23 Nov 2026: tick a to-do off from MY FOCUS TODAY. Marks the first open to-do with that
   text done (same data the TO DO page uses) and saves to the account. */
function _markDone(rai, goal, text) {
  let hit = false;
  const walk = nodes => (nodes || []).some(n => { if (!n.done && n.text === text) { n.done = true; return (hit = true); } return walk(n.children); });
  walk(rai.userTasks);
  if (!hit && (!rai.intention || String(rai.intention).trim() === String(goal || '').trim())) {
    (rai.tasks || []).some((t, k) => { const txt = typeof t === 'string' ? t : (t && (t.text || t.title || t.task)); if (txt === text && !(rai.done || {})[k]) { rai.done = rai.done || {}; rai.done[k] = true; return (hit = true); } return false; });
  }
  return hit;
}
export async function completeFocusTodo(goalTitle, text) {
  if (!currentUser) throw new Error('Not signed in');
  const it = (intentions || []).find(i => i.title === goalTitle);
  if (it) {
    it.roadmapAI = it.roadmapAI || {};
    if (!_markDone(it.roadmapAI, goalTitle, text)) return false;
    await saveIntentions();
    return true;
  }
  const { data } = await sb.from('intentions').select('id,roadmap_ai').eq('user_id', currentUser.id).eq('title', goalTitle).limit(1).maybeSingle();
  if (!data) return false;
  const rai = _pj(data.roadmap_ai) || {};
  if (!_markDone(rai, goalTitle, text)) return false;
  const { error } = await sb.from('intentions').update({ roadmap_ai: rai }).eq('id', data.id);
  if (error) throw error;
  return true;
}
if (typeof window !== 'undefined') window.ciCompleteFocusTodo = completeFocusTodo;

/* MY FOCUS TODAY stats (Scott 24 Nov 2026): day streak, visualizations this week, goal views
   this week, to-dos done — plus one line of encouragement (fixed messages, no AI cost). */
export async function getFocusStats() {
  let rows = (intentions || []).map(i => ({ title: i.title, rai: i.roadmapAI || {} }));
  if (!rows.length && currentUser) {
    const { data } = await sb.from('intentions').select('title,roadmap_ai,position').eq('user_id', currentUser.id);
    rows = (data || []).map(r => ({ title: r.title, rai: _pj(r.roadmap_ai) || {} }));
  }
  let todosDone = 0, todosTotal = 0;
  const walk = ns => (ns || []).forEach(n => { if (!n) return; todosTotal++; if (n.done) todosDone++; walk(n.children); });
  rows.forEach(r => walk(r.rai.userTasks));
  const a = await _activity();
  const DAY = 864e5, now = Date.now(), weekAgo = now - 7 * DAY;
  const vizWeek = a.filter(r => r.event_type === 'visualize' && Date.parse(r.created_at) >= weekAgo).length;
  const key = t => { const d = new Date(t); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); };
  const days = new Set(a.map(r => key(r.created_at)));
  let views = []; try { views = JSON.parse(localStorage.getItem('ci_goal_views') || '[]'); } catch (_) {}
  views.forEach(t => days.add(key(t)));
  const viewsWeek = views.filter(t => t >= weekAgo).length;
  let streak = 0, cur = new Date(); if (!days.has(key(cur))) cur = new Date(now - DAY);
  while (days.has(key(cur))) { streak++; cur = new Date(cur.getTime() - DAY); }
  const name = String((LS.get('ci_pegboard') || {})['pb-name'] || '').trim().split(/\s+/)[0];
  const hi = name ? name + ', ' : '';
  let message;
  if (streak >= 7) message = `${hi}${streak} days in a row. This is who you are now — keep showing up as the person you intend to be.`;
  else if (streak >= 2) message = `${hi}${streak} days running. Momentum is building — one small action today keeps it alive.`;
  else if (vizWeek > 0) message = `${hi}you visualized ${vizWeek} time${vizWeek > 1 ? 's' : ''} this week. Pick one to-do below and act on it.`;
  else if (todosDone > 0) message = `${hi}${todosDone} to-dos done so far. Start today with one visualization, then tick one more off.`;
  else message = `${hi}today is a fresh start. Three minutes of visualization, then one to-do — that's the whole job.`;
  return { streak, vizWeek, viewsWeek, todosDone, todosTotal, message };
}
if (typeof window !== 'undefined') window.ciFocusStats = getFocusStats;
