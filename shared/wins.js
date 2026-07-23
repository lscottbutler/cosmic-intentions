import { LS, toast, esc, syncWinsToSupabase, intentions, dayKey } from '../app.js';
import { renderRings } from './rings.js';
import { renderWrapup } from './wrapup.js';
/* ── WINS WALL ───────────────────────────────────────────
   Phase 2: log mini-wins / convictions. A running trophy
   wall of everything they've done, and a discretionary
   momentum bonus (the actual +3/win-day lives in rings.js).
   v1 storage = localStorage (ci_wins). Supabase sync later.

   Depends on globals (from app.js): LS, toast, esc.
───────────────────────────────────────────────────────── */

const BRAND = '#F5A623';
const MAX_SHOWN = 30;

function _todayKey() { return dayKey(); }

export function getWins() { return LS.get('ci_wins') || []; }
function _save(w) { LS.set('ci_wins', w); }

/* Format a YYYY-MM-DD key as "Jun 30" (or "Today"). */
function _label(dateKey) {
  if (dateKey === _todayKey()) return 'Today';
  const [y, m, d] = dateKey.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}`;
}

/* Read the input and log a win. */
export function winAdd() {
  const input = document.getElementById('winInput');
  if (!input) return;
  const text = (input.value || '').trim();
  if (!text) return;
  const wins = getWins();
  wins.unshift({ text, date: _todayKey(), ts: Date.now() });
  _save(wins);
  input.value = '';
  toast('✦ Win logged', 'success');
  _refresh();
}

export function winDelete(ts) {
  _save(getWins().filter(w => w.ts !== ts));
  _refresh();
}

/* Auto-win tied to a source (e.g. a checked Today-I-Will task).
   Idempotent: `on` adds it once; `!on` removes it. Lets a task check
   log a win and an uncheck remove it without duplicates. */
export function setTaskWin(srcKey, text, on, meta = {}) {
  const wins   = getWins();
  const exists = wins.some(w => w.src === srcKey);
  if (on && !exists) {
    wins.unshift({ text: String(text || '').trim(), date: _todayKey(), ts: Date.now(), src: srcKey, goal: meta.goal || '', category: meta.category || '' });
    _save(wins); _refresh();
  } else if (!on && exists) {
    _save(wins.filter(w => w.src !== srcKey));
    _refresh();
  }
}

function _refresh() {
  renderWins();
  renderRings();    // momentum may shift
  renderWrapup();
  if (typeof window.renderWinsPage === 'function') window.renderWinsPage();   // full Wins page (if mounted)
  if (typeof syncWinsToSupabase === 'function') syncWinsToSupabase();  // fire-and-forget cloud sync
}

/* ── CATEGORIES + STATS (for the full Wins page) ─────────── */
export const CATEGORY_META = {
  wealth:       { label: 'Wealth',        color: '#cacc90' },
  health:       { label: 'Health',        color: '#a7cecb' },
  relationship: { label: 'Relationship',  color: '#FF8AB8' },
  purpose:      { label: 'Purpose',       color: '#8ba6a9' },
  mindset:      { label: 'Mindset',       color: '#7C5CC4' },
  creative:     { label: 'Create',        color: '#F5A623' },
  growth:       { label: 'Growth',        color: '#4ADE80' },
  '':           { label: 'Uncategorized', color: '#888888' },
};
export function catMeta(c) { return CATEGORY_META[c || ''] || CATEGORY_META['']; }

function _goalCategory(goalTitle) {
  const it = (intentions || []).find(i => i.title === goalTitle);
  return (it && it.category) || '';
}

/* Total, this-week, current day-streak, best day. */
export function winStats() {
  const wins = getWins();
  const byDay = {};
  wins.forEach(w => { byDay[w.date] = (byDay[w.date] || 0) + 1; });
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
  const weekKey = dayKey(weekAgo);
  const week = wins.filter(w => w.date >= weekKey).length;
  let bestDay = '', bestCount = 0;
  Object.entries(byDay).forEach(([d, c]) => { if (c > bestCount) { bestCount = c; bestDay = d; } });
  let streak = 0; const d = new Date();
  for (let i = 0; i < 3660; i++) {
    const key = dayKey(d);
    if (byDay[key]) streak++;
    else if (i > 0) break;   // a past day with no win ends the streak (today-empty is ok)
    d.setDate(d.getDate() - 1);
  }
  return { total: wins.length, week, streak, bestDay, bestCount };
}

/* Wins grouped by goal title (Uncategorized bucket last). */
export function winsByGoal() {
  const groups = {};
  getWins().forEach(w => { const g = w.goal || 'Uncategorized'; (groups[g] = groups[g] || []).push(w); });
  return groups;
}

/* Add a win from the full Wins page (with optional goal picker → category). */
export function winPageAdd() {
  const input = document.getElementById('winPageInput');
  if (!input) return;
  const text = (input.value || '').trim();
  if (!text) return;
  const sel = document.getElementById('winPageGoal');
  const goal = sel ? sel.value : '';
  const wins = getWins();
  wins.unshift({ text: text.slice(0, 160), date: _todayKey(), ts: Date.now(), goal, category: goal ? _goalCategory(goal) : '' });
  _save(wins);
  input.value = '';
  toast('✦ Win logged', 'success');
  _refresh();
}

export function renderWins() {
  const el = document.getElementById('winsWidget');
  if (!el) return;

  const wins  = getWins();
  const today = wins.filter(w => w.date === _todayKey()).length;

  const rows = wins.slice(0, MAX_SHOWN).map(w => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid #E6E6E6;">
      <span style="color:${BRAND};font-size:13px;line-height:1.5;flex-shrink:0;">✦</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;color:#1D3557;line-height:1.5;">${esc(w.text)}</div>
        <div style="font-family:var(--vault-mono);font-size:8px;color:#8A8A8A;letter-spacing:0.5px;margin-top:2px;">${_label(w.date)}</div>
      </div>
      <button onclick="winDelete(${w.ts})" title="Remove" style="flex-shrink:0;background:none;border:none;color:#B0B0B0;font-size:14px;cursor:pointer;line-height:1;padding:0 2px;">×</button>
    </div>`).join('');

  const body = wins.length
    ? rows + (wins.length > MAX_SHOWN
        ? `<div style="font-family:var(--vault-mono);font-size:8px;color:#999;letter-spacing:0.5px;text-align:center;padding-top:8px;">+ ${wins.length - MAX_SHOWN} more logged</div>`
        : '')
    : `<div style="font-size:12px;color:#8A8A8A;font-style:italic;padding:6px 0;">No wins yet — log your first one above.</div>`;

  // Styled to match the MORNING RUN THROUGH card: blue outer card, white title +
  // count, white inner panel for the content, and a dark footer bar.
  el.innerHTML = `
    <div style="background:#4A90D9;border:1px solid #4A90D9;border-radius:12px;padding:14px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 4px 12px;">
        <span style="font-size:14pt;font-weight:800;line-height:1.15;color:#fff;">◈ WINS WALL</span>
        <span style="font-family:var(--vault-mono);font-size:10px;color:#fff;opacity:.9;">${today} today · ${wins.length} all-time</span>
      </div>
      <div style="background:#fff;border-radius:8px;padding:12px;overflow:hidden;">
        <div style="display:flex;gap:6px;margin-bottom:12px;">
          <input id="winInput" type="text" maxlength="120" placeholder="Log a mini-win or conviction…"
            onkeydown="if(event.key==='Enter')winAdd()"
            style="flex:1;min-width:0;background:#0d0d0d;border:1px solid #333;border-radius:6px;padding:9px 11px;font-size:12px;color:#eee;font-family:inherit;">
          <button onclick="winAdd()"
            style="flex-shrink:0;background:${BRAND};border:none;border-radius:6px;padding:9px 14px;font-family:var(--vault-mono);font-size:10px;font-weight:800;letter-spacing:0.5px;color:#0a0a0a;cursor:pointer;">+ ADD</button>
        </div>
        ${body}
      </div>
      <button onclick="navTo('wins')" style="width:100%;margin-top:10px;background:#333;color:#fff;border:none;border-radius:8px;padding:12px;font-family:var(--vault-mono);font-size:11px;font-weight:800;letter-spacing:1px;cursor:pointer;">SEE ALL WINS →</button>
    </div>`;
}
