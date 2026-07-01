import { getWins, winStats, winsByGoal, catMeta, winDelete, winPageAdd } from './wins.js';
import { esc, intentions } from '../app.js';
/* ── FULL WINS PAGE ──────────────────────────────────────
   A dedicated "everything I've done" page: stats + streaks,
   grouped by goal, filterable by category. Reuses the wins
   store; renders into #winsPageBody. Theme-var styled so it
   adapts to light/dark. */

let _filter = '';   // '' = all · '__uncat' = uncategorized · else a category key

function _label(dateKey) {
  if (dateKey === new Date().toISOString().slice(0, 10)) return 'Today';
  const [y, m, d] = dateKey.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}`;
}

export function winPageSetFilter(f) { _filter = f; renderWinsPage(); }

export function renderWinsPage() {
  const el = document.getElementById('winsPageBody');
  if (!el) return;

  const s      = winStats();
  const groups = winsByGoal();
  const wins   = getWins();

  const stat = (label, val) => `<div style="flex:1;min-width:0;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 8px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:var(--text);line-height:1;">${val}</div>
    <div style="font-family:var(--vault-mono);font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-top:5px;">${label}</div>
  </div>`;
  const bestDay = s.bestDay ? `${_label(s.bestDay)} · ${s.bestCount}` : '—';
  const stats = `<div style="display:flex;gap:8px;margin-bottom:18px;">
    ${stat('Total Wins', s.total)}${stat('This Week', s.week)}${stat('Day Streak', s.streak)}${stat('Best Day', bestDay)}
  </div>`;

  const goalOpts = ['<option value="">— No goal (mini-win) —</option>']
    .concat((intentions || []).map(i => `<option value="${esc(i.title)}">${esc(i.title)}</option>`)).join('');
  const addForm = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">
    <input id="winPageInput" type="text" maxlength="160" placeholder="Log a win or conviction…" onkeydown="if(event.key==='Enter')winPageAdd()"
      style="flex:2;min-width:180px;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:11px 13px;font-size:14px;color:var(--text);">
    <select id="winPageGoal" style="flex:1;min-width:140px;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:11px;font-size:13px;color:var(--text);">${goalOpts}</select>
    <button onclick="winPageAdd()" style="background:var(--brand);border:none;border-radius:8px;padding:11px 20px;font-weight:800;color:#0a0a0a;cursor:pointer;">+ Add</button>
  </div>`;

  // filter chips
  const present = [...new Set(wins.map(w => w.category || ''))];
  const chip = (val, label, color) => {
    const active = _filter === val;
    return `<button onclick="winPageSetFilter('${val}')" style="background:${active ? color : 'transparent'};border:1px solid ${color};border-radius:999px;padding:5px 12px;font-family:var(--vault-mono);font-size:9px;font-weight:700;color:${active ? '#0a0a0a' : color};cursor:pointer;">${label}</button>`;
  };
  const filters = `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px;">
    ${chip('', 'ALL', 'var(--brand)')}
    ${present.map(c => { const m = catMeta(c); return chip(c === '' ? '__uncat' : c, m.label.toUpperCase(), m.color); }).join('')}
  </div>`;

  const matches = (w) => _filter === '' ? true : (_filter === '__uncat' ? !w.category : (w.category || '') === _filter);

  const goalNames = Object.keys(groups).sort((a, b) => (a === 'Uncategorized') - (b === 'Uncategorized'));
  let body = '';
  goalNames.forEach(g => {
    const items = groups[g].filter(matches);
    if (!items.length) return;
    const m = catMeta(items[0].category || '');
    body += `<div style="margin-bottom:22px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${m.color};flex-shrink:0;"></span>
        <span style="font-weight:800;color:var(--text);font-size:15px;">${esc(g)}</span>
        <span style="font-family:var(--vault-mono);font-size:9px;color:var(--muted);">${items.length}</span>
      </div>
      ${items.map(w => `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-2);">
        <span style="color:${m.color};font-size:13px;flex-shrink:0;line-height:1.5;">✦</span>
        <div style="flex:1;min-width:0;"><div style="font-size:14px;color:var(--text);line-height:1.5;">${esc(w.text)}</div>
          <div style="font-family:var(--vault-mono);font-size:8px;color:var(--muted);margin-top:2px;">${_label(w.date)}</div></div>
        <button onclick="winDelete(${w.ts})" title="Remove" style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;line-height:1;">×</button>
      </div>`).join('')}
    </div>`;
  });
  if (!body) body = `<div style="color:var(--muted);font-style:italic;padding:24px 0;text-align:center;">No wins${_filter ? ' in this filter' : ' yet'} — log one above.</div>`;

  el.innerHTML = stats + addForm + filters + body;
}

if (typeof window !== 'undefined') window.renderWinsPage = renderWinsPage;
