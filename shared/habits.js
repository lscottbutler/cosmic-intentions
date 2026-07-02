import { RM_CIRCLE } from './card-builder.js';
import { LS, esc } from '../app.js';
/* ── DAILY TRACKER ───────────────────────────────────────
   A simple daily habit checklist (Scott's paper tracker).
   Collapsible dropdown styled like the Evening Wrap-Up bar.
   State is stored per-day in localStorage (ci_habits_<date>)
   so it auto-resets each morning.
───────────────────────────────────────────────────────── */

// The habit list, top-to-bottom. Edit here to add/remove/rename.
const HABITS = [
  'MOMO', 'SUNRISE', 'KILOS', 'WATER', 'MEDITATION', 'PRAYER', 'MINDFULNESS',
  'BP', 'KETOSIS', 'GLUCOSE', 'SHROOM', 'JOURNAL', 'STOIC', 'CI VIZ',
  'AFFIRMATIONS', 'BABY STEPS', 'THAI LESSON', 'IF', 'NET DIARY', 'LOW CARB',
  'NO SUGAR', 'A.C.V.', 'PSYLLIUM', 'CHEAT DAY', 'FAST', 'BM', 'MEDS',
  'CARDIO', 'WEIGHTS', 'CORE', 'STRETCH', 'SUN', 'NO PHONE', 'CI VIZ 2',
  'BOOM', 'BUDGETING',
];

let _open = true;   // dropdown expanded? (survives re-renders)
export function habitsToggleSection(open) { _open = !!open; }

function _todayKey() { return new Date().toISOString().slice(0, 10); }
function _lsKey() { return `ci_habits_${_todayKey()}`; }
function _state() { return LS.get(_lsKey()) || {}; }

export function habitToggle(i) {
  const s = _state();
  if (s[i]) delete s[i]; else s[i] = true;
  LS.set(_lsKey(), s);
  renderHabits();
}

export function renderHabits() {
  const el = document.getElementById('habitsWidget');
  if (!el) return;

  const s = _state();
  const done = HABITS.filter((_, i) => s[i]).length;
  const allDone = done === HABITS.length;

  const rows = HABITS.map((h, i) => {
    const d = !!s[i];
    return `<div style="display:flex;gap:8px;align-items:center;padding:4px 2px;">
      <button onclick="habitToggle(${i})" title="${d ? 'Done — tap to undo' : 'Mark done'}" style="${RM_CIRCLE}font-size:14px;">${d ? '✓' : '○'}</button>
      <span style="flex:1;min-width:0;font-size:12px;line-height:1.45;color:${d ? '#8a8a8a' : '#ddd'};${d ? 'text-decoration:line-through;' : ''}">${esc(h)}</span>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div style="background:var(--widget-bg);border:1px solid #2a2a2a;border-radius:12px;padding:14px;margin-bottom:8px;">
      <details class="rm-drop" ${_open ? 'open' : ''} ontoggle="habitsToggleSection(this.open)">
        <summary style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;background:#000;color:#fff;border-radius:10px;cursor:pointer;">
          <span style="font-size:18pt;font-weight:800;line-height:1.15;">◈ DAILY TRACKER</span>
          <span style="flex-shrink:0;display:flex;align-items:center;gap:8px;">
            <span style="font-family:var(--vault-mono);font-size:10px;letter-spacing:1px;color:${allDone ? '#4ADE80' : '#fff'};border:1px solid rgba(255,255,255,0.55);border-radius:999px;padding:3px 10px;white-space:nowrap;">${done}/${HABITS.length} done</span>
            <span class="rm-caret" style="display:inline-block;color:#fff;">▾</span>
          </span>
        </summary>
        <div style="border:1px solid #222;border-radius:8px;padding:2px 10px 6px;margin-top:8px;">${rows}</div>
      </details>
    </div>`;
}

if (typeof window !== 'undefined') window.renderHabits = renderHabits;
