import { LS, esc, dayKey, goalBadge, intentions, GREY_SHADES, GOAL_COLORS, goalLetter, selectedVaultIdx } from '../app.js';
import { getHabitList, habitToggle } from './habits.js';
import { wrapToggleAction } from './wrapup.js';
import { toggleRoadmapTaskDone, toggleRoadmapUserTaskDone } from './card-builder.js';
/* ── QUICK WIN dropdown (dashboard home hub) ─────────────
   One place to log a real win by ticking the actual item:
     • Habits  — today's habit checklist (shares ci_habits_<date>)
     • Actions — your free-standing "My Actions" (ci_wrapup_actions)
     • Roadmap — every goal's roadmap steps (AI + your own)
   Each tick calls the SAME toggle the rest of the app uses, so
   streaks, momentum, the Wins Wall and cloud sync all update — this
   panel is just a fast, unified surface onto that existing state.
───────────────────────────────────────────────────────── */

const TABS = [
  { key: 'habit', label: 'Habits' },
  { key: 'todo',  label: 'Actions & Roadmap' },
];
let _tab = 'habit';   // survives re-renders while the panel is open
const _openGoals = new Set();   // which goals are expanded in the Roadmap tab

export function qwTab(t) { _tab = t; renderQuickWin(); }

/* Expand / collapse a goal's task group in the Roadmap tab. */
export function qwGoalToggle(idx) {
  if (_openGoals.has(idx)) _openGoals.delete(idx); else _openGoals.add(idx);
  renderQuickWin();
}

/* One dispatcher for every row — calls the real toggle, then repaints. */
export function qwToggle(kind, a, b) {
  if (kind === 'habit')       habitToggle(a);              // a = habit id (string)
  else if (kind === 'action') wrapToggleAction(a);         // a = action id (number)
  else if (kind === 'rtask')  toggleRoadmapTaskDone(a, b); // a = goal idx, b = task idx
  else if (kind === 'rutask') toggleRoadmapUserTaskDone(a, b); // a = goal idx, b = task id
  renderQuickWin();
}

/* ── data readers (same stores the source modules use) ── */
function _habDone() { return LS.get('ci_habits_' + dayKey()) || {}; }
function _acts()    { return LS.get('ci_wrapup_actions') || []; }
function _roadmapItems() {
  const out = [];
  (intentions || []).forEach((it, idx) => {
    const r = it && it.roadmapAI;
    if (!r) return;
    (r.tasks || []).forEach((text, i) => {
      if (text) out.push({ kind: 'rtask', idx, i, text, done: !!(r.done && r.done[i]), goal: it.title || '' });
    });
    (r.userTasks || []).forEach(u => {
      if (u && u.text) out.push({ kind: 'rutask', idx, id: u.id, text: u.text, done: !!u.done, goal: it.title || '' });
    });
  });
  return out;
}

/* ── rendering ── */
function _empty(msg) {
  return `<div style="font-size:12px;color:var(--muted);font-style:italic;padding:12px 2px;">${msg}</div>`;
}
function _row(onclick, text, done, trailing) {
  return `<div style="display:flex;gap:9px;align-items:center;padding:7px 2px;border-bottom:1px solid var(--widget-border);">
    <button onclick="${onclick}" title="${done ? 'Done — tap to undo' : 'Mark done'}"
      style="flex-shrink:0;width:22px;height:22px;border-radius:50%;border:1.5px solid ${done ? '#2FA94B' : 'var(--muted)'};background:${done ? '#2FA94B' : 'transparent'};color:#fff;font-size:12px;font-weight:800;cursor:pointer;line-height:1;display:inline-flex;align-items:center;justify-content:center;padding:0;">${done ? '✓' : ''}</button>
    <div style="flex:1;min-width:0;font-size:13px;line-height:1.4;color:var(--widget-text);${done ? 'text-decoration:line-through;font-weight:600;' : ''}">${esc(text)}</div>
    ${trailing || ''}
  </div>`;
}

/* The goal's own colour + letter marker (same palette as its Citadel card),
   clickable to open that goal. Replaces the old blue goal-title subtitle. */
function _goalBadge(idx) {
  const gc     = GOAL_COLORS[idx % GOAL_COLORS.length] || { bg: '#000', text: '#fff' };
  const letter = goalLetter(intentions[idx], idx);
  return `<button onclick="event.stopPropagation();qwOpenGoal(${idx})" title="Open goal ${letter}"
    style="flex-shrink:0;border:none;cursor:pointer;background:none;padding:0;line-height:0;">${goalBadge(letter, gc.bg, gc.text, 24)}</button>`;
}

/* Open a goal's workspace and actually bring it into view. selectVaultIntention
   TOGGLES selection (so a second call would close it) and its target lives lower
   in Column B — from the Quick Win dropdown that reads as "nothing happened".
   So: only select when it isn't already open, then scroll the workspace up. */
export function qwOpenGoal(idx) {
  if (selectedVaultIdx !== idx && typeof window.selectVaultIntention === 'function') {
    window.selectVaultIntention(idx);
  }
  const el = document.getElementById('vaultWorkspaceHeader') || document.getElementById('colb-active-state');
  if (el && el.scrollIntoView) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}
const _undoneFirst = (a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0);

function _habitList() {
  const d = _habDone();
  const list = getHabitList().map(h => ({ ...h, done: !!d[h.id] }));
  if (!list.length) return _empty('No habits yet — add them on your Pegboard.');
  return [...list].sort(_undoneFirst)
    .map(h => _row(`qwToggle('habit','${h.id}')`, h.name, h.done)).join('');
}
/* One collapsible group. `key` is a goal idx (number) or the string 'actions';
   open/closed state lives in _openGoals. */
function _group(key, badge, title, done, total, rows) {
  const open = _openGoals.has(key);
  const arg  = typeof key === 'number' ? key : `'${key}'`;
  return `<div style="border-bottom:1px solid var(--widget-border);">
    <div onclick="qwGoalToggle(${arg})" style="display:flex;align-items:flex-start;gap:9px;padding:9px 2px;cursor:pointer;">
      ${badge}
      <span style="flex:1;min-width:0;font-size:11px;font-weight:700;line-height:1.35;color:var(--widget-text);">${esc(title)}</span>
      <span style="flex-shrink:0;font-size:11px;color:var(--muted);">${done}/${total}</span>
      <span style="flex-shrink:0;color:var(--muted);font-size:12px;width:12px;text-align:center;">${open ? '▾' : '▸'}</span>
    </div>
    ${open ? `<div style="padding:0 0 6px 8px;">${rows}</div>` : ''}
  </div>`;
}
const _ACT_BADGE = `<span style="flex-shrink:0;width:24px;height:24px;border-radius:50%;background:var(--ink);color:#fff;font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;">◆</span>`;

/* Combined Actions + Roadmap: "My Actions" group first, then one group per goal. */
function _todoList() {
  let html = '';
  // Quick Win = what's still left to do. Only show undone actions here;
  // completed ones stay visible in the full Roadmap view.
  const acts = _acts().filter(a => !a.done);
  if (acts.length) {
    const rows = [...acts].map(a => _row(`qwToggle('action',${a.id})`, a.text, false)).join('');
    html += _group('actions', _ACT_BADGE, 'My Actions', 0, acts.length, rows);
  }
  const byGoal = new Map();
  _roadmapItems().forEach(it => { if (!byGoal.has(it.idx)) byGoal.set(it.idx, []); byGoal.get(it.idx).push(it); });
  byGoal.forEach((list, idx) => {
    const done  = list.filter(t => t.done).length;
    const title = ((intentions[idx] && intentions[idx].title) || '').replace(/^i am\s+/i, '');
    const rows  = [...list].sort(_undoneFirst).map(it => {
      const oc = it.kind === 'rtask' ? `qwToggle('rtask',${it.idx},${it.i})` : `qwToggle('rutask',${it.idx},${it.id})`;
      return _row(oc, it.text, it.done);
    }).join('');
    html += _group(idx, _goalBadge(idx), title, done, list.length, rows);
  });
  return html || _empty('No actions or roadmap steps yet.');
}

export function renderQuickWin() {
  const el = document.getElementById('quickWinBody');
  if (!el) return;
  // Inline Wins Wall logger — same input as the Wins Wall widget, surfaced
  // here so a mini-win can be logged without scrolling. Uses qwWinInput /
  // qwWinAdd so it doesn't collide with the Wins Wall's own winInput/winAdd.
  const winBar = `<div style="display:flex;gap:6px;margin-bottom:10px;">
      <input id="qwWinInput" type="text" maxlength="120" placeholder="Log a mini-win or conviction…"
        onkeydown="if(event.key==='Enter')qwWinAdd()"
        style="flex:1;min-width:0;background:#0d0d0d;border:1px solid #333;border-radius:6px;padding:9px 11px;font-size:12px;color:#eee;font-family:inherit;">
      <button onclick="qwWinAdd()"
        style="flex-shrink:0;background:#F5A623;border:none;border-radius:6px;padding:9px 14px;font-family:var(--vault-mono);font-size:10px;font-weight:800;letter-spacing:0.5px;color:#0a0a0a;cursor:pointer;">+ ADD</button>
    </div>`;
  const tabBar = `<div style="display:flex;gap:6px;margin-bottom:10px;">` + TABS.map(t =>
    `<button onclick="qwTab('${t.key}')" style="flex:1;background:${_tab === t.key ? 'var(--ink)' : 'var(--widget-band)'};color:${_tab === t.key ? '#fff' : 'var(--widget-text)'};border:none;border-radius:8px;padding:8px 4px;font-size:12px;font-weight:700;cursor:pointer;">${t.label}</button>`
  ).join('') + `</div>`;
  const body = _tab === 'todo' ? _todoList() : _habitList();
  el.innerHTML = winBar + tabBar + `<div style="max-height:240px;overflow-y:auto;">${body}</div>`;
}

if (typeof window !== 'undefined') window.renderQuickWin = renderQuickWin;
