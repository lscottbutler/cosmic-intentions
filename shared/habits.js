import { RM_CIRCLE } from './card-builder.js';
import { LS, esc, syncHabitsToSupabase } from '../app.js';
import { setTaskWin, getWins } from './wins.js';
/* ── DAILY TRACKER ───────────────────────────────────────
   A customizable daily habit checklist, grouped into time-of-day
   / type banners: MORNING · DAY · EVENING · BEDTIME · HEALTH.
   - The LIST (name, category, order) is editable on the Pegboard
     and stored in ci_habit_list as [{id, name, cat}].
   - The DONE state is per-day in ci_habits_<date> keyed by id,
     so it auto-resets each morning and survives edits/reorders.
───────────────────────────────────────────────────────── */

const DEFAULT_HABITS = [
  'MOMO', 'SUNRISE', 'KILOS', 'WATER', 'MEDITATION', 'PRAYER', 'MINDFULNESS',
  'BP', 'KETOSIS', 'GLUCOSE', 'SHROOM', 'JOURNAL', 'STOIC', 'CI VIZ',
  'AFFIRMATIONS', 'BABY STEPS', 'THAI LESSON', 'IF', 'NET DIARY', 'LOW CARB',
  'NO SUGAR', 'A.C.V.', 'PSYLLIUM', 'CHEAT DAY', 'FAST', 'BM', 'MEDS',
  'CARDIO', 'WEIGHTS', 'CORE', 'STRETCH', 'SUN', 'NO PHONE', 'CI VIZ',
  'BOOM', 'BUDGETING',
];

// Banner categories, in display order. '' = Unsorted (shown last).
export const HABIT_CATS = ['MORNING', 'DAY', 'EVENING', 'BEDTIME', 'HEALTH'];
const CAT_COLORS = {
  MORNING: '#E8A828', DAY: '#4A9EAD', EVENING: '#7C5CC4',
  BEDTIME: '#3B4A6B', HEALTH: '#48B860', '': '#5E5E5E',
};
const CAT_LABEL = (c) => c || 'UNSORTED';

let _open = true;   // dashboard dropdown expanded? (survives re-renders)
export function habitsToggleSection(open) { _open = !!open; }

function _todayKey() { return new Date().toISOString().slice(0, 10); }
function _doneKey()  { return `ci_habits_${_todayKey()}`; }
function _done()     { return LS.get(_doneKey()) || {}; }

let _seed = 0;
function _newId() { _seed++; return 'h' + Date.now() + '_' + _seed; }

export function getHabitList() {
  let list = LS.get('ci_habit_list');
  if (!Array.isArray(list) || !list.length) {
    list = DEFAULT_HABITS.map(name => ({ id: _newId(), name, cat: '' }));
    LS.set('ci_habit_list', list);
  }
  return list;
}
function _saveList(list) {
  LS.set('ci_habit_list', list);
  if (typeof syncHabitsToSupabase === 'function') syncHabitsToSupabase();  // fire-and-forget cloud sync
}
function _cat(h) { return HABIT_CATS.includes(h.cat) ? h.cat : ''; }

/* Group the list by category, preserving array order within each group. */
function _grouped(list) {
  const g = {}; [...HABIT_CATS, ''].forEach(c => g[c] = []);
  list.forEach(h => g[_cat(h)].push(h));
  return g;
}

function _refresh() {
  renderHabits();
  renderRunThroughs();
  if (typeof window !== 'undefined' && window.renderPBHabitList) window.renderPBHabitList();
}

/* ── Tick a habit for today ───────────────────────────── */
export function habitToggle(id) {
  const d = _done();
  const nowOn = !d[id];
  if (d[id]) delete d[id]; else d[id] = true;
  LS.set(_doneKey(), d);
  // Completing a MORNING RUN THROUGH task lands it on the Wall of Wins
  // (add on check, remove on uncheck — idempotent via the habit's src key).
  const h = getHabitList().find(x => x.id === id);
  if (h && _cat(h) === 'MORNING') {
    // Date-scoped src key so each day's completion is its own win (and untick removes just today's).
    setTaskWin('habit_' + id + '_' + _todayKey(), h.name, nowOn, { category: 'growth' });
  }
  renderHabits();
  renderRunThroughs();
}

/* ── Pegboard editing: add / rename / recategorize / delete / reorder ── */
export function pbAddHabit() {
  const inp = document.getElementById('pbNewHabitInput');
  const name = (inp?.value || '').trim();
  if (!name) return;
  const sel = document.getElementById('pbNewHabitCat');
  const list = getHabitList();
  list.push({ id: _newId(), name: name.slice(0, 160), cat: sel ? sel.value : '' });
  _saveList(list);
  if (inp) inp.value = '';
  _refresh();
}
export function pbSaveHabitName(id, val) {
  const list = getHabitList();
  const h = list.find(x => x.id === id);
  if (!h) return;
  h.name = (val || '').trim().slice(0, 160) || h.name;
  _saveList(list);
  renderHabits();
}
export function pbSetHabitCat(id, cat) {
  const list = getHabitList();
  const h = list.find(x => x.id === id);
  if (!h) return;
  h.cat = HABIT_CATS.includes(cat) ? cat : '';
  _saveList(list);
  _refresh();
}
export function pbDeleteHabit(id) {
  _saveList(getHabitList().filter(x => x.id !== id));
  _refresh();
}
/* Reorder within the same category (swap with nearest same-cat neighbor). */
export function pbMoveHabit(id, dir) {
  const list = getHabitList();
  const i = list.findIndex(x => x.id === id);
  if (i < 0) return;
  const cat = _cat(list[i]);
  let j = i + dir;
  while (j >= 0 && j < list.length && _cat(list[j]) !== cat) j += dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  _saveList(list);
  _refresh();
}

/* One tickable habit row. */
function _habitRow(h, on) {
  return `<div style="display:flex;gap:8px;align-items:center;padding:4px 2px;">
    <button onclick="habitToggle('${h.id}')" title="${on ? 'Done — tap to undo' : 'Mark done'}" style="${RM_CIRCLE}font-size:14px;">${on ? '✓' : '○'}</button>
    <span style="flex:1;min-width:0;font-size:12px;line-height:1.45;color:${on ? '#8a8a8a' : 'var(--widget-text)'};${on ? 'text-decoration:line-through;' : ''}">${esc(h.name)}</span>
  </div>`;
}

/* ── "RUN THROUGH" cards — one per time-of-day category ──
   Each renders its own category's habits into its container. */
const RUN_CATS = ['MORNING', 'DAY', 'EVENING'];   // these get their own banner cards

/* Slice 1 of the master list: each time-block card also offers a few sessions to
   run at that time. Sensible defaults for now — Slice 4 makes them user-taggable. */
const RUN_SESSIONS = {
  MORNING: [['◉', 'Visualization', 'players/3min-viz.html'], ['✦', 'Affirmations', 'players/recite.html?type=affirmations']],
  DAY:     [['◉', 'Visualization', 'players/3min-viz.html'], ['❞', 'Recitations', 'players/recite.html']],
  EVENING: [['☾', 'Meditation', 'players/meditation.html'],  ['◉', 'Visualization', 'players/3min-viz.html']],
};
function _runSessions(cat) {
  const items = RUN_SESSIONS[cat] || [];
  if (!items.length) return '';
  const pills = items.map(([ic, lbl, href]) =>
    `<button onclick="location.href='${href}'" style="display:inline-flex;align-items:center;gap:6px;background:var(--ink,#111);color:#fff;border:none;border-radius:999px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;"><span style="font-size:13px;line-height:1;">${ic}</span>${lbl}</button>`
  ).join('');
  return `<div style="margin-top:12px;padding-top:10px;border-top:1px solid #e5e5e5;">
    <div style="font-family:var(--vault-mono);font-size:8px;font-weight:800;letter-spacing:1px;color:#888;margin:0 0 8px;">SESSIONS FOR THIS TIME</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">${pills}</div>
  </div>`;
}

function _renderRun(cat, elId) {
  const el = document.getElementById(elId); if (!el) return;
  const list = getHabitList().filter(h => _cat(h) === cat);
  const d = _done();
  const done = list.filter(h => d[h.id]).length;
  // Done/total count chip in the card header (e.g. "3/8"): morningRunBody -> morningRunCount.
  const countEl = document.getElementById(elId.replace('Body', 'Count'));
  if (countEl) countEl.textContent = `${done}/${list.length}`;
  // EVENING closes the day with a recap of everything completed today.
  const results = cat === 'EVENING' ? _dayResults() : '';
  if (!list.length) { el.innerHTML = `<div style="color:var(--muted);font-size:12px;font-style:italic;padding:4px 2px;">No ${cat.toLowerCase()} habits yet — set a habit's category to ${cat} on your Pegboard.</div>` + _runSessions(cat) + results; return; }
  // MORNING: completed tasks move to the Wall of Wins, so hide them here (they
  // reset and reappear tomorrow via the per-day done state). Other run-throughs
  // keep the classic struck-through view.
  const rows = cat === 'MORNING' ? list.filter(h => !d[h.id]) : list;
  el.innerHTML = rows.map(h => _habitRow(h, !!d[h.id])).join('')
    + _runSessions(cat)
    + results;
}

/* End-of-day recap for the EVENING run-through: everything completed TODAY.
   Reads today's habit done-state directly (same source as the checkmarks, so it
   can never drift), plus any non-habit wins logged today (e.g. Today-I-Will). */
function _dayResults() {
  const d = _done();                       // ci_habits_<today> — what you ticked today
  const doneHabits = getHabitList().filter(h => d[h.id]).map(h => h.name);
  // Other wins logged today that aren't habit-sourced, so they aren't double-counted.
  const otherWins = (getWins() || [])
    .filter(w => w.date === _todayKey() && !String(w.src || '').startsWith('habit_'))
    .map(w => w.text);
  const items = [...doneHabits, ...otherWins].map(t => String(t || '').trim()).filter(Boolean);

  const hd = `<div style="display:flex;align-items:center;gap:8px;margin:14px 2px 8px;">
      <div style="flex:1;height:1px;background:var(--widget-border);"></div>
      <span style="font-family:var(--vault-mono);font-size:9px;font-weight:800;letter-spacing:1.5px;color:#2FA94B;">TODAY'S RESULTS</span>
      <div style="flex:1;height:1px;background:var(--widget-border);"></div>
    </div>`;
  if (!items.length) {
    return hd + `<div style="color:var(--muted);font-size:12px;font-style:italic;padding:2px 2px 4px;">Nothing logged yet today — your completed tasks will show here.</div>`;
  }
  const rows = items.map(t => `<div style="display:flex;gap:8px;align-items:flex-start;padding:3px 2px;">
      <span style="color:#2FA94B;font-weight:800;flex-shrink:0;font-size:13px;line-height:1.5;">✓</span>
      <span style="flex:1;font-size:12px;line-height:1.45;color:var(--widget-text);">${esc(t)}</span>
    </div>`).join('');
  return hd + rows
    + `<div style="background:#EAF7EE;border-radius:8px;text-align:center;padding:8px;margin-top:8px;font-weight:800;font-size:12px;color:#2FA94B;letter-spacing:.4px;">✦ ${items.length} DONE TODAY — WELL DONE, SCOTT</div>`;
}

export function renderMorningRun() { _renderRun('MORNING', 'morningRunBody'); }
export function renderDayRun()     { _renderRun('DAY',     'dayRunBody'); }
export function renderEveningRun() { _renderRun('EVENING', 'eveningRunBody'); }
export function renderRunThroughs() { renderMorningRun(); renderDayRun(); renderEveningRun(); }

/* ── Daily Tracker widget — categories WITHOUT their own run-through card
   (Bedtime, Health, Unsorted). Morning/Day/Evening live in their cards. ── */
export function renderHabits() {
  const el = document.getElementById('habitsWidget');
  if (!el) return;

  const d = _done();
  const groups = _grouped(getHabitList());

  let body = '';
  [...HABIT_CATS.filter(c => !RUN_CATS.includes(c)), ''].forEach(cat => {
    // Alphabetical within each category (case-insensitive) — don't mutate the stored order.
    const items = [...groups[cat]].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    if (!items.length) return;
    body += `<div style="background:${CAT_COLORS[cat]};color:#fff;font-family:var(--vault-mono);font-size:10px;font-weight:800;letter-spacing:1.5px;padding:7px 11px;border-radius:7px;margin:12px 0 6px;">${CAT_LABEL(cat)}</div>`;
    // Two-column grid of habit rows.
    body += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px;">` + items.map(h => _habitRow(h, !!d[h.id])).join('') + `</div>`;
  });

  el.innerHTML = `
    <div style="background:#AEB6C1;border:1px solid #AEB6C1;border-radius:12px;padding:14px;margin-bottom:8px;">
      <details class="rm-drop" ${_open ? 'open' : ''} ontoggle="habitsToggleSection(this.open)">
        <summary style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;background:#AEB6C1;color:#1a1a1a;border-radius:10px;cursor:pointer;">
          <span style="font-size:18pt;font-weight:800;line-height:1.15;">◈ DAILY HABITS</span>
          <span style="flex-shrink:0;display:flex;align-items:center;gap:8px;">
            <button onclick="event.stopPropagation();navTo('habits')" title="Open My Habits page" aria-label="Open My Habits page" style="flex-shrink:0;width:30px;height:30px;border-radius:50%;background:#333;border:none;cursor:pointer;padding:0;display:inline-flex;align-items:center;justify-content:center;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg></button>
            <span class="rm-caret" style="flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:#333;color:#fff;">▾</span>
          </span>
        </summary>
        <div style="background:#fff;border:none;border-radius:8px;padding:8px 10px 10px;margin-top:10px;overflow:hidden;">${body}</div>
        <div style="font-size:10px;color:#333;line-height:1.4;padding:9px 4px 2px;">⚕ Not medical advice. Cosmic Intentions is not a medical device and does not diagnose or treat. For any health metric, consult a qualified healthcare professional.</div>
      </details>
    </div>`;
}

/* ── Pegboard editor (banner-grouped, rename / recategorize / reorder / delete) ── */
export function renderPBHabitList() {
  const el = document.getElementById('pbHabitList');
  if (!el) return;
  const list = getHabitList();
  const groups = _grouped(list);
  const arrow = 'width:30px;height:34px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#454545;border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:10px;line-height:1;';
  const catOpts = (cur) => ['<option value=""' + (cur === '' ? ' selected' : '') + '>— Unsorted —</option>']
    .concat(HABIT_CATS.map(c => `<option value="${c}"${cur === c ? ' selected' : ''}>${c}</option>`)).join('');

  let html = '';
  [...HABIT_CATS, ''].forEach(cat => {
    const items = groups[cat];
    if (cat === '' && !items.length) return;   // hide empty Unsorted; always show the 5 named banners
    html += `<div id="pbcat-${CAT_LABEL(cat)}" style="background:${CAT_COLORS[cat]};color:#fff;font-weight:800;font-size:12px;letter-spacing:1.5px;padding:8px 12px;border-radius:8px;margin:16px 0 8px;scroll-margin-top:76px;">${CAT_LABEL(cat)}</div>`;
    if (!items.length) {
      html += `<div style="color:var(--muted);font-size:11px;font-style:italic;padding:2px 2px 6px;">No habits here yet — set a habit's category to "${cat}".</div>`;
      return;
    }
    items.forEach((h, gi) => {
      html += `
      <div style="background:#2E2E2E;padding:11px 12px;border-radius:10px;margin-bottom:8px;">
        <textarea maxlength="160" rows="2" onchange="pbSaveHabitName('${h.id}',this.value)"
          style="width:100%;box-sizing:border-box;padding:13px 14px;border:none;border-radius:7px;background:#fff;color:#1a1a1a;font-size:10pt;line-height:1.5;font-family:inherit;resize:vertical;min-height:62px;margin-bottom:8px;">${esc(h.name)}</textarea>
        <div style="display:flex;gap:8px;align-items:center;">
          <button onclick="pbMoveHabit('${h.id}',-1)" title="Move up"   style="${arrow}${gi === 0 ? 'opacity:.3;pointer-events:none;' : ''}">▲</button>
          <button onclick="pbMoveHabit('${h.id}',1)"  title="Move down" style="${arrow}${gi === items.length - 1 ? 'opacity:.3;pointer-events:none;' : ''}">▼</button>
          <select onchange="pbSetHabitCat('${h.id}',this.value)"
            style="flex:1;min-width:0;box-sizing:border-box;padding:9px 8px;border:none;border-radius:7px;background:#fff;color:#1a1a1a;font-size:12px;">${catOpts(_cat(h))}</select>
          <button onclick="pbDeleteHabit('${h.id}')" title="Delete habit"
            style="flex-shrink:0;width:34px;height:34px;background:#3a1010;border:1px solid #5a1a1a;color:#ff8a8a;border-radius:8px;cursor:pointer;font-size:15px;">✕</button>
        </div>
      </div>`;
    });
  });
  el.innerHTML = html || `<div style="color:var(--muted);font-size:12px;font-style:italic;padding:6px 0;">No habits yet — add one below.</div>`;
}

/* Open the My Habits editor scrolled to a category's banner. Fired by the
   run-through cards' edit button (Morning/Day/Evening) so the user lands on the
   matching section. showPage() force-scrolls to top across two rAFs, so wait for
   that to settle before scrolling to the anchor. */
export function openHabitsAt(cat) {
  const label = HABIT_CATS.includes(cat) ? cat : 'UNSORTED';
  if (typeof window !== 'undefined' && typeof window.navTo === 'function') window.navTo('habits');
  setTimeout(() => {
    const el = document.getElementById('pbcat-' + label);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 170);
}

if (typeof window !== 'undefined') {
  window.renderHabits = renderHabits;
  window.openHabitsAt = openHabitsAt;
  window.renderMorningRun = renderMorningRun;
  window.renderRunThroughs = renderRunThroughs;
  window.renderPBHabitList = renderPBHabitList;
}
