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
import { sb, LS, intentions, dayKey, esc, currentUser } from '../app.js';

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

/* Goal to-do progress across every intention's map. */
function _todoTotals() {
  let total = 0, done = 0;
  (intentions || []).forEach(i => (i.theMap?.components || []).forEach(c =>
    (c.todos || []).forEach(t => { total++; if (t.done) done++; })));
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
