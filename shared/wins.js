import { LS, toast, esc, syncWinsToSupabase } from '../app.js';
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

function _todayKey() { return new Date().toISOString().slice(0, 10); }

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

function _refresh() {
  renderWins();
  renderRings();    // momentum may shift
  renderWrapup();
  if (typeof syncWinsToSupabase === 'function') syncWinsToSupabase();  // fire-and-forget cloud sync
}

export function renderWins() {
  const el = document.getElementById('winsWidget');
  if (!el) return;

  const wins  = getWins();
  const today = wins.filter(w => w.date === _todayKey()).length;

  const rows = wins.slice(0, MAX_SHOWN).map(w => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid #1A1A1A;">
      <span style="color:${BRAND};font-size:13px;line-height:1.5;flex-shrink:0;">✦</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;color:#ddd;line-height:1.5;">${esc(w.text)}</div>
        <div style="font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:0.5px;margin-top:2px;">${_label(w.date)}</div>
      </div>
      <button onclick="winDelete(${w.ts})" title="Remove" style="flex-shrink:0;background:none;border:none;color:#444;font-size:14px;cursor:pointer;line-height:1;padding:0 2px;">×</button>
    </div>`).join('');

  const body = wins.length
    ? rows + (wins.length > MAX_SHOWN
        ? `<div style="font-family:var(--vault-mono);font-size:8px;color:#555;letter-spacing:0.5px;text-align:center;padding-top:8px;">+ ${wins.length - MAX_SHOWN} more logged</div>`
        : '')
    : `<div style="font-size:12px;color:#505058;font-style:italic;padding:6px 0;">No wins yet — log your first one above.</div>`;

  el.innerHTML = `
    <div style="background:#141414;border:1px solid #2a2a2a;border-radius:12px;padding:14px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:${BRAND};font-weight:800;letter-spacing:1px;">◈ WINS WALL</div>
        <div style="font-family:var(--vault-mono);font-size:10px;color:${today > 0 ? BRAND : '#505058'};">${today} today · ${wins.length} all-time</div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:12px;">
        <input id="winInput" type="text" maxlength="120" placeholder="Log a mini-win or conviction…"
          onkeydown="if(event.key==='Enter')winAdd()"
          style="flex:1;min-width:0;background:#0d0d0d;border:1px solid #333;border-radius:6px;padding:9px 11px;font-size:12px;color:#eee;font-family:inherit;">
        <button onclick="winAdd()"
          style="flex-shrink:0;background:${BRAND};border:none;border-radius:6px;padding:9px 14px;font-family:var(--vault-mono);font-size:10px;font-weight:800;letter-spacing:0.5px;color:#0a0a0a;cursor:pointer;">+ ADD</button>
      </div>
      ${body}
    </div>`;
}
