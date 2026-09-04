import { getWins, winStats, catMeta, winDelete, winPageAdd } from './wins.js';
import { esc, intentions, dayKey } from '../app.js';
/* ── FULL WINS PAGE ──────────────────────────────────────
   A dedicated "everything I've done" page: stats + streaks,
   grouped by goal, filterable by category. Reuses the wins
   store; renders into #winsPageBody. Theme-var styled so it
   adapts to light/dark. */

let _filter = '';   // '' = all · '__uncat' = uncategorized · else a category key

function _label(dateKey) {
  if (dateKey === dayKey()) return 'Today';
  const [y, m, d] = dateKey.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}`;
}

export function winPageSetFilter(f) { _filter = f; renderWinsPage(); }

export function renderWinsPage() {
  const el = document.getElementById('winsPageBody');
  if (!el) return;

  const s      = winStats();
  const wins   = getWins();

  const stat = (label, val) => `<div style="flex:1;min-width:0;background:#6e6e6e;border:none;border-radius:10px;padding:14px 8px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:#fff;line-height:1;">${val}</div>
    <div style="font-family:var(--vault-mono);font-size:8px;color:rgba(255,255,255,.85);text-transform:uppercase;letter-spacing:0.5px;margin-top:5px;">${label}</div>
  </div>`;
  const bestDay = s.bestDay ? `${_label(s.bestDay)} · ${s.bestCount}` : '—';
  const stats = `<div style="display:flex;gap:8px;margin-bottom:18px;">
    ${stat('Total Wins', s.total)}${stat('This Week', s.week)}${stat('Day Streak', s.streak)}${stat('Best Day', bestDay)}
  </div>`;

  const goalOpts = ['<option value="">— No goal (mini-win) —</option>']
    .concat((intentions || []).map(i => `<option value="${esc(i.title)}">${esc(i.title)}</option>`)).join('');
  const addForm = `<div style="margin-bottom:16px;">
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
      <input id="winPageInput" type="text" maxlength="160" placeholder="Log a win or conviction…" onkeydown="if(event.key==='Enter')winPageAdd()"
        style="flex:2;min-width:180px;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:11px 13px;font-size:14px;color:var(--text);">
      <select id="winPageGoal" style="flex:1;min-width:140px;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:11px;font-size:13px;color:var(--text);">${goalOpts}</select>
      <button onclick="winPageAdd()" style="background:var(--brand);border:none;border-radius:8px;padding:11px 20px;font-weight:800;color:#0a0a0a;cursor:pointer;">+ Add</button>
    </div>
    <input id="winPageFeeling" type="text" maxlength="90" placeholder="how did that feel? (optional)" onkeydown="if(event.key==='Enter')winPageAdd()"
      style="width:100%;box-sizing:border-box;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:9px 13px;font-size:13px;font-style:italic;color:var(--muted);">
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

  // Split wins into recency buckets — each win lands in its MOST-recent bucket
  // only (a today win shows under TODAY, not also THIS WEEK). "EARLIER" is a
  // catch-all for anything older than this year so nothing is hidden.
  const todayKey = dayKey();
  const wa = new Date(); wa.setDate(wa.getDate() - 6);
  const weekKey = dayKey(wa);   // 7-day window incl. today
  const ymKey = todayKey.slice(0, 7);              // this month  (YYYY-MM)
  const yKey  = todayKey.slice(0, 4);              // this year   (YYYY)
  const buckets = { today: [], week: [], month: [], year: [], earlier: [] };
  wins.filter(matches).forEach(w => {
    const d = w.date || '';
    if (d === todayKey)               buckets.today.push(w);
    else if (d >= weekKey)            buckets.week.push(w);
    else if (d.slice(0, 7) === ymKey) buckets.month.push(w);
    else if (d.slice(0, 4) === yKey)  buckets.year.push(w);
    else                              buckets.earlier.push(w);
  });

  const SECTIONS = [['today','TODAY'],['week','THIS WEEK'],['month','THIS MONTH'],['year','THIS YEAR'],['earlier','EARLIER']];
  let body = '';
  SECTIONS.forEach(([key, label]) => {
    const items = buckets[key];
    if (!items.length) return;
    items.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.ts || 0) - (a.ts || 0));
    // Brown divider bar just above the THIS YEAR group (matches the MY WINS header bar).
    if (key === 'year' && body) body += `<div style="height:20px;background:#5f5124;margin:8px -36px 22px;"></div>`;
    body += `<div style="margin-bottom:22px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-weight:800;color:var(--text);font-size:15px;">${label}</span>
        <span style="font-family:var(--vault-mono);font-size:9px;color:var(--muted);">${items.length}</span>
      </div>
      ${items.map(w => { const m = catMeta(w.category || ''); return `<div class="vault-row" style="margin-bottom:8px;">
        <div class="vault-item" style="background:#f1f2f4;cursor:default;align-items:flex-start;">
          <span style="color:${m.color};font-size:15px;flex-shrink:0;line-height:1.5;">✦</span>
          <div class="vault-item-body"><div style="font-size:14px;color:#26364b;line-height:1.5;">${esc(w.text)}${w.feeling ? `<div style="font-size:12px;font-style:italic;color:#8a97a6;margin-top:2px;">❦ ${esc(w.feeling)}</div>` : ''}</div></div>
          <span style="flex-shrink:0;font-family:var(--vault-mono);font-size:12px;color:var(--muted);white-space:nowrap;line-height:1.5;">${_label(w.date)}</span>
        </div>
        <div class="vault-actions" style="flex:0 0 60px;">
          <button class="vault-act" onclick="winDelete(${w.ts})" title="Remove" aria-label="Delete"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" style="display:block"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        </div>
      </div>`; }).join('')}
    </div>`;
  });
  if (!body) body = `<div style="color:var(--muted);font-style:italic;padding:24px 0;text-align:center;">No wins${_filter ? ' in this filter' : ' yet'} — log one above.</div>`;

  el.innerHTML = stats + addForm + filters + body;
}

if (typeof window !== 'undefined') window.renderWinsPage = renderWinsPage;
