import { RM_CIRCLE } from './card-builder.js';
import { LS, esc, syncHabitsToSupabase, syncHabitDoneToSupabase, dayKey, currentUser } from '../app.js';
import { restoreHabitSupport } from './habit-mindset.js';
import { setTaskWin, getWins } from './wins.js';
import { renderRings } from './rings.js';
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
export const HABIT_CATS = ['MORNING', 'DAY', 'EVENING', 'NIGHT', 'BEDTIME'];   // HEALTH removed 2026-10-28 (Scott); old HEALTH habits show as Unsorted

// Second tag: life-DOMAIN (what a habit is ABOUT) — independent of the
// time-of-day banner above. Grouped so the editor dropdown renders as scannable
// <optgroup>s. Each habit stores its choice in `domain` ('' = none).
export const HABIT_DOMAINS = [
  { group: 'Health & Body',       items: ['Fitness', 'Nutrition', 'Hydration', 'Sleep', 'Fasting', 'Supplements', 'Biometrics', 'Mobility', 'Recovery', 'Grooming'] },
  { group: 'Mind & Emotion',      items: ['Meditation', 'Gratitude', 'Journaling', 'Visualization', 'Affirmations', 'Breathwork', 'Mood', 'Stress', 'Digital Detox', 'Stoicism'] },
  { group: 'Growth & Learning',   items: ['Reading', 'Language', 'Skill', 'Study', 'Writing', 'Creativity', 'Music', 'Notes'] },
  { group: 'Work & Productivity', items: ['Deep Work', 'Planning', 'Review', 'Goals', 'Email', 'Admin', 'Networking'] },
  { group: 'Wealth & Finance',    items: ['Budgeting', 'Investing', 'Expenses', 'Business', 'Bookkeeping'] },
  { group: 'Relationships',       items: ['Family', 'Partner', 'Friends', 'Kindness', 'Communication'] },
  { group: 'Spirit & Purpose',    items: ['Prayer', 'Spiritual Reading', 'Nature', 'Service', 'Purpose'] },
];
const HABIT_DOMAIN_SET = new Set(HABIT_DOMAINS.flatMap(g => g.items));
function _domain(h) { return HABIT_DOMAIN_SET.has(h && h.domain) ? h.domain : ''; }
const CAT_COLORS = {
  MORNING: '#E8A828', DAY: '#4A9EAD', EVENING: '#7C5CC4',
  NIGHT: '#3d2f6b', BEDTIME: '#3B4A6B', HEALTH: '#48B860', '': '#5E5E5E',
};
const CAT_LABEL = (c) => c || 'UNSORTED';

let _open = true;   // dashboard dropdown expanded? (survives re-renders)
export function habitsToggleSection(open) { _open = !!open; }

// Time-of-day sections shown as their own collapsible dropdowns (display label + order).
const SECTION_ORDER = ['MORNING', 'DAY', 'EVENING', 'NIGHT', 'BEDTIME', ''];
const SECTION_LABEL = { MORNING: 'Morning', DAY: 'Afternoon', EVENING: 'Evening', NIGHT: 'Night', BEDTIME: 'Before Sleep', HEALTH: 'After Waking', '': 'Unsorted' };
const HABIT_PERIODS = [['MORNING', 'MORNING'], ['DAY', 'DAY'], ['EVENING', 'EVENING'], ['NIGHT', 'NIGHT'], ['BEDTIME', 'BEFORE SLEEP']];
const HABIT_PERIOD_ICONS = {
  MORNING:'<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs><filter id="ciBrushM" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter></defs><g filter="url(#ciBrushM)"><path d="M17 41A15 15 0 0 1 47 41Z" fill="#f8cf45"/><path d="M20.5 41A11.5 11.5 0 0 1 43.5 41M25 41A7 7 0 0 1 39 41M29 41A3 3 0 0 1 35 41" stroke="#f1ad1e" stroke-width="2.2"/><path d="M51.1 36.9L57.4 35.6" stroke="#f39a1e" stroke-width="4"/><path d="M45.0 26.5L49.4 21.7" stroke="#f39a1e" stroke-width="4"/><path d="M32.0 21.5L32.0 15.0" stroke="#f39a1e" stroke-width="4"/><path d="M19.0 26.5L14.6 21.7" stroke="#f39a1e" stroke-width="4"/><path d="M12.9 36.9L6.6 35.6" stroke="#f39a1e" stroke-width="4"/><path d="M6 45H58" stroke="#3a86b4" stroke-width="4"/><path d="M14 52H50" stroke="#6fb0d6" stroke-width="3"/></g></svg>',
  DAY:'<img class="habit-period-img" src="/images/icons/habit-day-sun.png" alt="" width="64" height="64" draggable="false">',
  EVENING:'<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs><filter id="ciBrushE" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter></defs><g filter="url(#ciBrushE)"><path d="M17 39A15 15 0 0 1 47 39Z" fill="#ef7a32"/><path d="M20.5 39A11.5 11.5 0 0 1 43.5 39M25 39A7 7 0 0 1 39 39M29 39A3 3 0 0 1 35 39" stroke="#c9431f" stroke-width="2.2"/><path d="M51.1 34.9L57.4 33.6" stroke="#e3632a" stroke-width="4"/><path d="M45.0 24.5L49.4 19.7" stroke="#e3632a" stroke-width="4"/><path d="M32.0 19.5L32.0 13.0" stroke="#e3632a" stroke-width="4"/><path d="M19.0 24.5L14.6 19.7" stroke="#e3632a" stroke-width="4"/><path d="M12.9 34.9L6.6 33.6" stroke="#e3632a" stroke-width="4"/><path d="M6 43H58" stroke="#b6511b" stroke-width="4"/><path d="M13 50H51" stroke="#c9431f" stroke-width="3"/><path d="M21 56.5H43" stroke="#e08a4a" stroke-width="2.4"/></g></svg>',
  NIGHT:'<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs><filter id="ciBrushN" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter></defs><g filter="url(#ciBrushN)"><path d="M43 14.6A20 20 0 1 0 43 49.4A15 15 0 0 1 43 14.6Z" fill="#f6c94a"/><path d="M30 45A13 13 0 0 1 26 20" stroke="#e9a923" stroke-width="2.2"/><path d="M50 10v9M45.5 14.5h9" stroke="#6a58b8" stroke-width="3"/><path d="M55 30v6M52 33h6" stroke="#8e7fd0" stroke-width="2.4"/><path d="M49 44v5M46.5 46.5h5" stroke="#6a58b8" stroke-width="2.2"/></g></svg>',
  BEDTIME:'<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs><filter id="ciBrushB" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter></defs><g filter="url(#ciBrushB)"><path d="M43 14.6A20 20 0 1 0 43 49.4A15 15 0 0 1 43 14.6Z" fill="#26386e"/><path d="M30 45A13 13 0 0 1 26 20" stroke="#4a5f9e" stroke-width="2.2"/><path d="M44 9h9l-9 10h9" stroke="#3d4f8f" stroke-width="3.2"/><path d="M51 26h7l-7 8h7" stroke="#5b6cab" stroke-width="2.8"/></g></svg>'
};
let _selectedPeriod = 'MORNING';
// Sections open FULLY EXPANDED by default; we only remember which ones the user collapses.
const _closedCats = new Set();
export function habitsSectionToggle(cat, open) { if (open) _closedCats.delete(cat); else _closedCats.add(cat); }

/* Meditation-style circle controls for the four daily periods.
   These are checklist shortcuts: existing habits and completion state stay put. */
export function createHabitPeriodMenu() {
  const nav = document.createElement('nav');
  nav.className = 'habit-period-menu';
  nav.setAttribute('aria-label', 'Habit time of day');
  nav.innerHTML = HABIT_PERIODS.map(([cat, label], index) =>
    `<button type="button" aria-label="${label}" data-habit-period="${cat}" aria-controls="habit-period-${cat}" aria-current="${cat === _selectedPeriod ? 'location' : 'false'}"><span class="habit-period-circle"><span class="habit-period-icon" aria-hidden="true">${HABIT_PERIOD_ICONS[cat]}</span><span class="habit-period-label">${label}</span></span></button>`).join('');
  nav.addEventListener('click', event => {
    const button = event.target.closest('[data-habit-period]');
    if (!button) return;
    const cat = button.dataset.habitPeriod;
    _selectedPeriod = cat;
    _closedCats.delete(cat);
    showHabitView('daily');
    const section = document.getElementById('habit-period-' + cat);
    if (!section) return;
    section.open = true;
    section.querySelector('summary').focus({ preventScroll: true });
    section.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  return nav;
}

function _todayKey() { return dayKey(); }
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
  if (nowOn) { LS.set('ci_habit_last_done', Date.now()); LS.set('ci_habit_last_id_' + _todayKey(), id); }   // Habits header message: "last habit checked"   // Habits header stats: "hours since last check-off"
  if (typeof syncHabitDoneToSupabase === 'function') syncHabitDoneToSupabase();  // fire-and-forget cloud sync (cross-device)
  // Completing a MORNING RUN THROUGH task lands it on the Wall of Wins
  // (add on check, remove on uncheck — idempotent via the habit's src key).
  const h = getHabitList().find(x => x.id === id);
  if (h && _cat(h) === 'MORNING') {
    // Date-scoped src key so each day's completion is its own win (and untick removes just today's).
    setTaskWin('habit_' + id + '_' + _todayKey(), h.name, nowOn, { category: 'growth' });
  }
  renderHabits();
  renderRunThroughs();
  if (typeof renderRings === 'function') renderRings();   // habit = +1 pt → refresh The Big 3 live
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
/* Scott 14 Nov 2026: "+ ADD ROUTINE" on every time-of-day bar adds a habit straight into that section. */
function ciHabitShowAdd(cat) {
  _closedCats.delete(cat);
  const sec = document.getElementById('habit-period-' + cat); if (sec) sec.open = true;
  const f = document.querySelector(`[data-add-form="${cat}"]`); if (!f) return;
  f.style.display = 'flex'; f.querySelector('input')?.focus();
}
function ciHabitAddRoutine(cat, name) {
  name = String(name || '').trim(); if (!name) return;
  const list = getHabitList();
  list.push({ id: _newId(), name: name.slice(0, 160), cat });
  _saveList(list);
  _closedCats.delete(cat);
  _refresh();
}
if (typeof window !== 'undefined') { window.ciHabitShowAdd = ciHabitShowAdd; window.ciHabitAddRoutine = ciHabitAddRoutine; }
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
/* Set a habit's life-domain tag (the second axis, independent of cat/time). */
export function pbSetHabitDomain(id, domain) {
  const list = getHabitList();
  const h = list.find(x => x.id === id);
  if (!h) return;
  h.domain = HABIT_DOMAIN_SET.has(domain) ? domain : '';
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
function _habitRow(h, on, showDomain = true) {
  const dom = showDomain ? _domain(h) : '';
  return `<div class="habit-row" style="display:flex;gap:8px;align-items:center;padding:4px 2px;">
    <button class="habit-check" aria-pressed="${on}" onclick="habitToggle('${h.id}')" title="${on ? 'Done — tap to undo' : 'Mark done'}" style="${RM_CIRCLE}font-size:14px;">${on ? '✓' : '○'}</button>
    <div style="flex:1;min-width:0;"><span style="font-size:12px;line-height:1.45;color:${on ? '#8a8a8a' : 'var(--widget-text)'};${on ? 'text-decoration:line-through;' : ''}">${esc(h.name)}</span></div>
    ${dom ? `<span title="${esc(dom)}" style="flex-shrink:0;font-size:8px;font-weight:800;letter-spacing:.3px;color:var(--muted);border:1px solid var(--widget-border);border-radius:5px;padding:1px 4px;white-space:nowrap;">${esc(dom)}</span>` : ''}
  </div>`;
}

/* ── "RUN THROUGH" cards — one per time-of-day category ──
   Each renders its own category's habits into its container. */
const RUN_CATS = ['MORNING', 'DAY', 'EVENING'];   // these get their own banner cards

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
  if (!list.length) { el.innerHTML = `<div style="color:var(--muted);font-size:12px;font-style:italic;padding:4px 2px;">No ${cat.toLowerCase()} habits yet — set a habit's category to ${cat} on your Pegboard.</div>` + results; return; }
  // All run-throughs keep completed habits visible with a strikethrough (so the
  // card never goes blank when everything's done). Morning also mirrors each
  // completion to the Wall of Wins — that happens in habitToggle, independent
  // of this view.
  el.innerHTML = list.map(h => _habitRow(h, !!d[h.id])).join('')
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

/* ── Daily Tracker widget — a master list of EVERY habit, grouped by category
   (Morning/Day/Evening/Bedtime/Health/Unsorted). Ticks share the same per-day
   done state as the run-through cards, so checking here or there stays in sync. ── */
export function showHabitView(view = 'daily') {
  const editing = view === 'editor';
  const daily = document.getElementById('habitsDailyView');
  const editor = document.getElementById('habitsEditorView');
  if (daily) daily.hidden = editing;
  if (editor) editor.hidden = !editing;
  if (editing) renderPBHabitList();
  else renderHabits();
}

export function renderHabits() {
  const el = document.getElementById('habitsWidget');
  if (!el) return;
  restoreHabitSupport(currentUser?.id || '', _closedCats);

  const d = _done();
  const groups = _grouped(getHabitList());

  // Each time-of-day section is its own collapsible dropdown (EXPANDED by default).
  let html = '';
  SECTION_ORDER.forEach(cat => {
    const items = [...groups[cat]].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    if (!items.length && cat !== 'NIGHT' && !HABIT_PERIODS.some(([period]) => period === cat)) return;
    const doneN = items.filter(h => !!d[h.id]).length;
    const open = !_closedCats.has(cat);
    html += `<details class="habit-drop" id="habit-period-${cat}" data-habit-section="${cat}" ${open ? 'open' : ''} ontoggle="habitsSectionToggle('${cat}',this.open)" style="margin-bottom:8px;">
      <summary style="display:flex;justify-content:space-between;align-items:center;gap:10px;background:${CAT_COLORS[cat]};color:#fff;font-family:var(--vault-mono);font-size:12px;font-weight:800;letter-spacing:1.5px;padding:11px 14px;border-radius:8px;cursor:pointer;">
        <span>${SECTION_LABEL[cat]}</span>
        <span style="display:flex;align-items:center;gap:9px;"><button type="button" class="habit-add-routine-btn" onclick="event.preventDefault();event.stopPropagation();ciHabitShowAdd('${cat}')" style="background:#000;color:#fff;border:0;border-radius:6px;padding:7px 12px;font:700 11px/1 Arial,sans-serif;letter-spacing:.08em;cursor:pointer;white-space:nowrap">+ ADD ROUTINE</button><span class="habit-completion-count">${doneN}/${items.length}</span><span class="habit-caret">&#9656;</span></span>
      </summary>
      <div class="habit-period-body" style="background:#fff;border-radius:8px;padding:8px 12px 10px;margin-top:6px;">
        <form class="habit-add-routine-form" data-add-form="${cat}" onsubmit="event.preventDefault();ciHabitAddRoutine('${cat}',this.querySelector('input').value)" style="display:none;gap:8px;margin:4px 0 10px">
          <input type="text" maxlength="160" placeholder="New ${SECTION_LABEL[cat].toLowerCase()} routine…" style="flex:1;min-width:0;border:1px solid #bccbdc;border-radius:6px;padding:9px 10px;font:400 14px Arial,sans-serif">
          <button type="submit" style="background:#000;color:#fff;border:0;border-radius:6px;padding:9px 14px;font:700 12px Arial,sans-serif;letter-spacing:.06em;cursor:pointer">ADD</button>
        </form>
        <div class="habit-daily-grid">${items.map(h => _habitRow(h, !!d[h.id], false)).join('')}</div>
        ${items.length ? '' : '<p class="habit-period-empty">No habits in this section yet. Use Edit habits to add one.</p>'}
      </div>
    </details>`;
  });
  el.innerHTML = (html || '<p>No habits yet. Choose Edit habits to add your first one.</p>') +
    `<div class="habit-health-note" style="font-size:10px;color:#888;line-height:1.4;padding:10px 4px 2px;">⚕ Not medical advice. Cosmic Intentions is not a medical device and does not diagnose or treat. For any health metric, consult a qualified healthcare professional.</div>`;
  // Each period, including Health when present, owns its own tinted card.
  let lastCard;
  el.querySelectorAll('details[data-habit-section]').forEach(section => {
    const card = document.createElement('section');
    card.className = 'habit-checklist-card';
    card.dataset.habitCard = section.dataset.habitSection;
    section.before(card); card.append(section);
    lastCard = card;
  });
  if (lastCard) lastCard.append(el.querySelector('.habit-health-note'));
  document.querySelectorAll('.habit-period-menu [data-habit-period]').forEach(button => {
    button.setAttribute('aria-current', button.dataset.habitPeriod === _selectedPeriod ? 'location' : 'false');
  });
}

/* ── Pegboard editor (banner-grouped, rename / recategorize / reorder / delete) ── */
export function lfmMiniNav(command) {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'ci-lfm-mini-nav', command }, location.origin);
  }
}

export function renderPBHabitList() {
  const el = document.getElementById('pbHabitList');
  if (!el) return;
  // Keep sections the user opened while editing; a fresh page starts closed.
  const openCats = new Set(Array.from(el.querySelectorAll('details[data-habit-category][open]'), section => section.dataset.habitCategory));
  const list = getHabitList();
  const groups = _grouped(list);
  const arrow = 'width:30px;height:34px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#454545;border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:10px;line-height:1;';
  const catOpts = (cur) => ['<option value=""' + (cur === '' ? ' selected' : '') + '>— Unsorted —</option>']
    .concat(HABIT_CATS.map(c => `<option value="${c}"${cur === c ? ' selected' : ''}>${c}</option>`)).join('');
  const domainOpts = (cur) => '<option value=""' + (cur === '' ? ' selected' : '') + '>— No category —</option>'
    + HABIT_DOMAINS.map(g => `<optgroup label="${g.group}">`
        + g.items.map(d => `<option value="${d}"${cur === d ? ' selected' : ''}>${d}</option>`).join('')
        + '</optgroup>').join('');

  let html = '';
  [...HABIT_CATS, ''].forEach(cat => {
    const items = groups[cat];
    if (cat === '' && !items.length) return;   // hide empty Unsorted; always show the 5 named banners
    html += `<details class="pb-habit-section" id="pbcat-${CAT_LABEL(cat)}" data-habit-category="${cat}"${openCats.has(cat) ? ' open' : ''}>
      <summary style="background:${CAT_COLORS[cat]};color:#fff;font-weight:800;font-size:12px;letter-spacing:1.5px;padding:8px 12px;border-radius:8px;">
        <span>${CAT_LABEL(cat)}</span><svg class="pb-habit-chevron" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </summary>`;
    if (!items.length) {
      html += `<div style="color:var(--muted);font-size:11px;font-style:italic;padding:10px 2px 6px;">No habits here yet — set a habit's category to "${cat}".</div></details>`;
      return;
    }
    html += `<div class="pb-habit-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:start;">`;
    items.forEach((h, gi) => {
      html += `
      <div class="pb-habit-card" style="background:#fff;padding:11px 12px;border:2px solid ${CAT_COLORS[cat]};border-radius:10px;">
        <textarea maxlength="160" rows="1" onchange="pbSaveHabitName('${h.id}',this.value)" oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"
          style="width:100%;box-sizing:border-box;padding:13px 14px;border:none;border-radius:7px;background:#fff;color:#1a1a1a;font-size:10pt;line-height:1.5;font-family:inherit;resize:none;field-sizing:content;min-height:62px;overflow:hidden;margin-bottom:8px;">${esc(h.name)}</textarea>
        <div style="display:flex;gap:8px;align-items:center;">
          <button onclick="pbMoveHabit('${h.id}',-1)" title="Move up"   style="${arrow}${gi === 0 ? 'opacity:.3;pointer-events:none;' : ''}">▲</button>
          <button onclick="pbMoveHabit('${h.id}',1)"  title="Move down" style="${arrow}${gi === items.length - 1 ? 'opacity:.3;pointer-events:none;' : ''}">▼</button>
          <select onchange="pbSetHabitCat('${h.id}',this.value)"
            style="flex:1;min-width:0;box-sizing:border-box;padding:9px 8px;border:none;border-radius:7px;background:#fff;color:#1a1a1a;font-size:12px;">${catOpts(_cat(h))}</select>
          <button onclick="pbDeleteHabit('${h.id}')" title="Delete habit"
            style="flex-shrink:0;width:34px;height:34px;background:#3a1010;border:1px solid #5a1a1a;color:#ff8a8a;border-radius:8px;cursor:pointer;font-size:15px;">✕</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
          <span style="flex-shrink:0;font-size:9px;font-weight:800;letter-spacing:1px;color:#9a9a9a;">CATEGORY</span>
          <select onchange="pbSetHabitDomain('${h.id}',this.value)" title="What this habit is about"
            style="flex:1;min-width:0;box-sizing:border-box;padding:9px 8px;border:none;border-radius:7px;background:#fff;color:#1a1a1a;font-size:12px;">${domainOpts(_domain(h))}</select>
        </div>
      </div>`;
    });
    html += `</div></details>`;
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
    if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }, 170);
}

if (typeof window !== 'undefined') {
  window.renderHabits = renderHabits;
  window.showHabitView = showHabitView;
  window.openHabitsAt = openHabitsAt;
  window.renderMorningRun = renderMorningRun;
  window.renderRunThroughs = renderRunThroughs;
  window.renderPBHabitList = renderPBHabitList;
}
