import { RM_CIRCLE } from './card-builder.js';
import { LS, esc } from '../app.js';
/* ── DAILY TRACKER ───────────────────────────────────────
   A customizable daily habit checklist.
   - The LIST (names + order) is editable on the Pegboard and
     stored in ci_habit_list as [{id, name}].
   - The DONE state is per-day in ci_habits_<date> keyed by id,
     so it auto-resets each morning and survives reordering.
───────────────────────────────────────────────────────── */

// Seeded on first use (Scott's paper tracker). After that the list
// lives in localStorage and is fully editable on the Pegboard.
const DEFAULT_HABITS = [
  'MOMO', 'SUNRISE', 'KILOS', 'WATER', 'MEDITATION', 'PRAYER', 'MINDFULNESS',
  'BP', 'KETOSIS', 'GLUCOSE', 'SHROOM', 'JOURNAL', 'STOIC', 'CI VIZ',
  'AFFIRMATIONS', 'BABY STEPS', 'THAI LESSON', 'IF', 'NET DIARY', 'LOW CARB',
  'NO SUGAR', 'A.C.V.', 'PSYLLIUM', 'CHEAT DAY', 'FAST', 'BM', 'MEDS',
  'CARDIO', 'WEIGHTS', 'CORE', 'STRETCH', 'SUN', 'NO PHONE', 'CI VIZ',
  'BOOM', 'BUDGETING',
];

let _open = true;   // dashboard dropdown expanded? (survives re-renders)
export function habitsToggleSection(open) { _open = !!open; }

function _todayKey() { return new Date().toISOString().slice(0, 10); }
function _doneKey()  { return `ci_habits_${_todayKey()}`; }
function _done()     { return LS.get(_doneKey()) || {}; }

let _seed = 0;
function _newId() { _seed++; return 'h' + Date.now() + '_' + _seed; }

/* The editable habit list [{id, name}] — seeded from DEFAULT_HABITS once. */
export function getHabitList() {
  let list = LS.get('ci_habit_list');
  if (!Array.isArray(list) || !list.length) {
    list = DEFAULT_HABITS.map(name => ({ id: _newId(), name }));
    LS.set('ci_habit_list', list);
  }
  return list;
}
function _saveList(list) { LS.set('ci_habit_list', list); }

function _refresh() {
  renderHabits();
  if (typeof window !== 'undefined' && window.renderPBHabitList) window.renderPBHabitList();
}

/* ── Tick a habit for today ───────────────────────────── */
export function habitToggle(id) {
  const d = _done();
  if (d[id]) delete d[id]; else d[id] = true;
  LS.set(_doneKey(), d);
  renderHabits();
}

/* ── Pegboard editing: add / rename / delete / reorder ── */
export function pbAddHabit() {
  const inp = document.getElementById('pbNewHabitInput');
  const name = (inp?.value || '').trim();
  if (!name) return;
  const list = getHabitList();
  list.push({ id: _newId(), name: name.slice(0, 40) });
  _saveList(list);
  if (inp) inp.value = '';
  _refresh();
}
export function pbSaveHabitName(id, val) {
  const list = getHabitList();
  const h = list.find(x => x.id === id);
  if (!h) return;
  h.name = (val || '').trim().slice(0, 40) || h.name;
  _saveList(list);
  renderHabits();
}
export function pbDeleteHabit(id) {
  _saveList(getHabitList().filter(x => x.id !== id));
  _refresh();
}
export function pbMoveHabit(id, dir) {
  const list = getHabitList();
  const i = list.findIndex(x => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  _saveList(list);
  _refresh();
}

/* ── Dashboard widget (collapsible checklist) ─────────── */
export function renderHabits() {
  const el = document.getElementById('habitsWidget');
  if (!el) return;

  const list = getHabitList();
  const d = _done();
  const done = list.filter(h => d[h.id]).length;
  const allDone = list.length && done === list.length;

  const rows = list.map(h => {
    const on = !!d[h.id];
    return `<div style="display:flex;gap:8px;align-items:center;padding:4px 2px;">
      <button onclick="habitToggle('${h.id}')" title="${on ? 'Done — tap to undo' : 'Mark done'}" style="${RM_CIRCLE}font-size:14px;">${on ? '✓' : '○'}</button>
      <span style="flex:1;min-width:0;font-size:12px;line-height:1.45;color:${on ? '#8a8a8a' : '#ddd'};${on ? 'text-decoration:line-through;' : ''}">${esc(h.name)}</span>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div style="background:var(--widget-bg);border:1px solid #2a2a2a;border-radius:12px;padding:14px;margin-bottom:8px;">
      <details class="rm-drop" ${_open ? 'open' : ''} ontoggle="habitsToggleSection(this.open)">
        <summary style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;background:#000;color:#fff;border-radius:10px;cursor:pointer;">
          <span style="font-size:18pt;font-weight:800;line-height:1.15;">◈ DAILY TRACKER</span>
          <span style="flex-shrink:0;display:flex;align-items:center;gap:8px;">
            <span style="font-family:var(--vault-mono);font-size:10px;letter-spacing:1px;color:${allDone ? '#4ADE80' : '#fff'};border:1px solid rgba(255,255,255,0.55);border-radius:999px;padding:3px 10px;white-space:nowrap;">${done}/${list.length} done</span>
            <span class="rm-caret" style="display:inline-block;color:#fff;">▾</span>
          </span>
        </summary>
        <div style="border:1px solid #222;border-radius:8px;padding:2px 10px 6px;margin-top:8px;">${rows}</div>
      </details>
    </div>`;
}

/* ── Pegboard editor list (rename / reorder / delete) ─── */
export function renderPBHabitList() {
  const el = document.getElementById('pbHabitList');
  if (!el) return;
  const list = getHabitList();
  const arrow = 'width:26px;height:20px;display:flex;align-items:center;justify-content:center;background:#454545;border:none;border-radius:5px;color:#fff;cursor:pointer;font-size:9px;line-height:1;';
  el.innerHTML = list.map((h, i) => `
    <div style="display:flex;gap:8px;align-items:center;background:#2E2E2E;padding:10px 12px;border-radius:10px;margin-bottom:8px;">
      <div style="display:flex;flex-direction:column;gap:3px;flex-shrink:0;">
        <button onclick="pbMoveHabit('${h.id}',-1)" title="Move up"   style="${arrow}${i === 0 ? 'opacity:.3;pointer-events:none;' : ''}">▲</button>
        <button onclick="pbMoveHabit('${h.id}',1)"  title="Move down" style="${arrow}${i === list.length - 1 ? 'opacity:.3;pointer-events:none;' : ''}">▼</button>
      </div>
      <input type="text" value="${esc(h.name)}" maxlength="40" onchange="pbSaveHabitName('${h.id}',this.value)"
        style="flex:1;min-width:0;box-sizing:border-box;padding:11px 13px;border:none;border-radius:7px;background:#fff;color:#1a1a1a;font-size:14px;" />
      <button onclick="pbDeleteHabit('${h.id}')" title="Delete habit"
        style="flex-shrink:0;width:36px;height:36px;background:#3a1010;border:1px solid #5a1a1a;color:#ff8a8a;border-radius:8px;cursor:pointer;font-size:15px;">✕</button>
    </div>`).join('') || `<div style="color:var(--muted);font-size:12px;font-style:italic;padding:6px 0;">No habits yet — add one below.</div>`;
}

if (typeof window !== 'undefined') {
  window.renderHabits = renderHabits;
  window.renderPBHabitList = renderPBHabitList;
}
