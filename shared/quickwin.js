import { LS, esc, dayKey, intentions } from '../app.js';
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
  { key: 'habit',   label: 'Habits'  },
  { key: 'action',  label: 'Actions' },
  { key: 'roadmap', label: 'Roadmap' },
];
let _tab = 'habit';   // survives re-renders while the panel is open

export function qwTab(t) { _tab = t; renderQuickWin(); }

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
function _row(onclick, text, done, sub) {
  return `<div style="display:flex;gap:9px;align-items:flex-start;padding:7px 2px;border-bottom:1px solid var(--widget-border);">
    <button onclick="${onclick}" title="${done ? 'Done — tap to undo' : 'Mark done'}"
      style="flex-shrink:0;width:22px;height:22px;border-radius:50%;border:1.5px solid ${done ? '#2FA94B' : 'var(--muted)'};background:${done ? '#2FA94B' : 'transparent'};color:#fff;font-size:12px;font-weight:800;cursor:pointer;line-height:1;display:inline-flex;align-items:center;justify-content:center;padding:0;">${done ? '✓' : ''}</button>
    <div style="flex:1;min-width:0;">
      <div style="font-size:13px;line-height:1.4;color:var(--widget-text);${done ? 'text-decoration:line-through;font-weight:600;' : ''}">${esc(text)}</div>
      ${sub ? `<div style="font-size:10px;color:var(--muted);margin-top:1px;">${esc(sub)}</div>` : ''}
    </div>
  </div>`;
}
const _undoneFirst = (a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0);

function _habitList() {
  const d = _habDone();
  const list = getHabitList().map(h => ({ ...h, done: !!d[h.id] }));
  if (!list.length) return _empty('No habits yet — add them on your Pegboard.');
  return [...list].sort(_undoneFirst)
    .map(h => _row(`qwToggle('habit','${h.id}')`, h.name, h.done)).join('');
}
function _actionList() {
  const a = _acts();
  if (!a.length) return _empty('No actions yet — add them under “Today I Will”.');
  return [...a].sort(_undoneFirst)
    .map(x => _row(`qwToggle('action',${x.id})`, x.text, !!x.done)).join('');
}
function _roadmapList() {
  const items = _roadmapItems();
  if (!items.length) return _empty('No roadmap steps yet — generate a roadmap on a goal.');
  return [...items].sort(_undoneFirst).map(it => {
    const oc = it.kind === 'rtask'
      ? `qwToggle('rtask',${it.idx},${it.i})`
      : `qwToggle('rutask',${it.idx},${it.id})`;
    return _row(oc, it.text, it.done, it.goal);
  }).join('');
}

export function renderQuickWin() {
  const el = document.getElementById('quickWinBody');
  if (!el) return;
  const tabBar = `<div style="display:flex;gap:6px;margin-bottom:10px;">` + TABS.map(t =>
    `<button onclick="qwTab('${t.key}')" style="flex:1;background:${_tab === t.key ? 'var(--ink)' : 'var(--widget-band)'};color:${_tab === t.key ? '#fff' : 'var(--widget-text)'};border:none;border-radius:8px;padding:8px 4px;font-size:12px;font-weight:700;cursor:pointer;">${t.label}</button>`
  ).join('') + `</div>`;
  const body = _tab === 'action' ? _actionList()
             : _tab === 'roadmap' ? _roadmapList()
             : _habitList();
  el.innerHTML = tabBar + `<div style="max-height:240px;overflow-y:auto;">${body}</div>`;
}

if (typeof window !== 'undefined') window.renderQuickWin = renderQuickWin;
