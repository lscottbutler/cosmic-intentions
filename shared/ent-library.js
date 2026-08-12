/* ── ENTREPRENEUR LIBRARY — in-app card page ─────────────────────────────────
   Renders the fixed, community-shared identity cards using the "monitor" card
   design (see standalone/ent-monitor-proto.html). Content is frozen + identical
   for every member (see shared/ent-library-content.js). */

import { toast } from '../app.js';
import { ENT_CARDS, ENT_CARD_TYPE, entCardHasContent } from './ent-library-content.js';

let _entIdx = ENT_CARDS.findIndex(c => c.key === 'SELF CONFIDENT');   // start on the authored card
if (_entIdx < 0) _entIdx = 0;
const _open = { ab: false, rm: false };   // which content panels are expanded

const _esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const _pad2 = n => String(n).padStart(2, '0');
/* Split "I AM SELF-CONFIDENT" onto two lines after the leading verb phrase. */
function _affLines(title) {
  const t = _esc(title);
  const m = t.match(/^(I AM|I HAVE|I LEAD WITH|I EXECUTE|I MANAGE|I ATTRACT|I THINK|I PROMOTE)\s+(.*)$/);
  return m ? `${m[1]}<br>${m[2]}` : t;
}

/* A content block in the green "monitor" theme — dark header bar + white item
   "screens", each with a dark tab (number for roadmap, ✦/◈ for affirmations/beliefs). */
function _greenSection(title, items, mode) {
  const tab = i => mode === 'num' ? _pad2(i + 1) : (mode === 'belief' ? '◈' : '✦');
  return `<div style="background:#8FA977;padding:16px 18px 20px;">
    <div style="background:#5c6158;color:#e9ebe6;font-weight:800;letter-spacing:6px;font-size:14px;text-align:center;padding:12px;margin-bottom:14px;">${title}</div>
    ${items.map((s, i) => `<div style="display:flex;align-items:stretch;margin-bottom:10px;">
      <div style="flex-shrink:0;width:48px;background:#20241f;color:#e9ebe6;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;font-family:var(--vault-mono,monospace);">${tab(i)}</div>
      <div style="flex:1;background:#fff;padding:13px 15px;color:#1c1c1c;font-size:14px;line-height:1.5;">${_esc(s)}</div>
    </div>`).join('')}
  </div>`;
}

export function renderEntLibrary() {
  const host = document.getElementById('entLibHost');
  if (!host) return;
  const c = ENT_CARDS[_entIdx] || ENT_CARDS[0];
  const has = entCardHasContent(c);

  const monitor = `
    <div style="background:#8FA977;padding:22px 20px 14px;">
      <div style="background:#6f7570;border-radius:10px 10px 4px 4px;padding:0 14px 10px;">
        <div style="background:#5c6158;border-radius:14px 14px 0 0;margin:0 -14px 12px;padding:14px 0;text-align:center;color:#e9ebe6;font-weight:800;letter-spacing:8px;font-size:15px;">${_esc(ENT_CARD_TYPE)}</div>
        <div style="background:#fff;min-height:200px;display:flex;align-items:center;justify-content:center;padding:26px 22px;">
          <div style="font-weight:900;letter-spacing:1px;font-size:28px;line-height:1.15;color:#1c1c1c;text-align:center;text-transform:uppercase;">${_affLines(c.title)}</div>
        </div>
        <div style="display:flex;gap:10px;margin-top:12px;">
          ${[['CARD', _pad2(c.n)], ['TYPE', 'ATTITUDE'], ['LIBRARY', 'ENTREP'], ['DECK', c.n + ' · ' + ENT_CARDS.length]]
            .map(([k, v]) => `<div style="flex:1;text-align:center;"><div style="background:#7d827b;border-radius:12px 12px 0 0;color:#e9ebe6;font-weight:800;letter-spacing:1px;font-size:11px;padding:8px 4px;">${k}</div><div style="background:#20241f;color:#e9ebe6;font-weight:800;letter-spacing:1px;font-size:14px;padding:8px 4px;">${_esc(v)}</div></div>`).join('')}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:12px;">
        <button onclick="entNav(-1)" style="background:#20241f;border:none;color:#fff;font-weight:800;letter-spacing:1px;font-size:12px;padding:10px 16px;cursor:pointer;">‹ PREV</button>
        <span style="align-self:center;color:#20241f;font-weight:800;font-size:12px;font-family:var(--vault-mono,monospace);">${c.n} / ${ENT_CARDS.length}</span>
        <button onclick="entNav(1)" style="background:#20241f;border:none;color:#fff;font-weight:800;letter-spacing:1px;font-size:12px;padding:10px 16px;cursor:pointer;">NEXT ›</button>
      </div>
    </div>`;

  if (!has) {
    host.innerHTML = monitor +
      `<div style="background:#1c1c1c;color:#fff;padding:20px 18px;text-align:center;font-size:15px;line-height:1.5;">This card's affirmations, beliefs and roadmap are coming soon.</div>`;
    return;
  }

  const btn = (t, s, on, extra = '') => `<button ${on ? `onclick="${on}"` : ''} style="display:flex;align-items:center;justify-content:space-between;width:100%;background:#fff;border:1px solid #cfcfcf;padding:15px 18px;margin-bottom:10px;cursor:pointer;${extra}"><span style="font-weight:800;font-size:17px;color:#2b2f45;">${t}</span><span style="font-family:var(--vault-mono,monospace);font-size:12px;color:#8a8a8a;">${s}</span></button>`;
  const soon = (t, s) => `<button disabled style="display:flex;align-items:center;justify-content:space-between;width:100%;background:#fff;border:1px solid #cfcfcf;padding:15px 18px;margin-bottom:10px;opacity:.5;"><span style="font-weight:800;font-size:17px;color:#2b2f45;">${t} <span style="font-family:var(--vault-mono,monospace);font-size:9px;font-weight:800;color:#b23;border:1px solid #b23;padding:2px 5px;margin-left:6px;">SOON</span></span><span style="font-family:var(--vault-mono,monospace);font-size:12px;color:#8a8a8a;">${s}</span></button>`;

  host.innerHTML = monitor +
    `<div style="background:#1c1c1c;color:#fff;padding:18px;">
       <div style="font-family:var(--vault-mono,monospace);font-weight:800;letter-spacing:2px;font-size:12px;color:#D9B94A;margin-bottom:8px;">DIRECTIVE</div>
       <p style="margin:0;font-size:18px;line-height:1.5;">${_esc(c.directive)}</p>
     </div>
     ${_greenSection('AFFIRMATIONS', c.affirmations, 'aff')}
     ${_greenSection('BELIEFS', c.beliefs, 'belief')}
     ${_greenSection('ROADMAP', c.roadmap, 'num')}
     ${_entNotesSection(c)}
     <div id="entPlayer" style="display:none;"></div>`;
}

export function entNav(dir) {
  _entIdx = (_entIdx + dir + ENT_CARDS.length) % ENT_CARDS.length;
  _open.ab = false; _open.rm = false;
  renderEntLibrary();
}
export function entTogglePanel(which) { _open[which] = !_open[which]; renderEntLibrary(); }

/* ── MY NOTES — the user's OWN note per card (per-user, saved locally). The fixed
   content above is shared/identical for the community; this is personal. ── */
function _entNotes() { try { return JSON.parse(localStorage.getItem('ci_ent_notes') || '{}'); } catch (e) { return {}; } }
function _entNotesSection(c) {
  const note = _esc(_entNotes()[c.key] || '');
  return `<div style="background:#8FA977;padding:16px 18px 20px;">
    <div style="background:#5c6158;color:#e9ebe6;font-weight:800;letter-spacing:6px;font-size:14px;text-align:center;padding:12px;margin-bottom:14px;">MY NOTES</div>
    <textarea onchange="entSaveNote(this)" placeholder="Add your own note on this card — this one is just for you." style="width:100%;box-sizing:border-box;min-height:110px;resize:vertical;background:#fff;border:none;padding:14px 15px;font-size:14px;line-height:1.6;color:#1c1c1c;font-family:inherit;">${note}</textarea>
  </div>`;
}
export function entSaveNote(el) {
  if (!el) return;
  const c = ENT_CARDS[_entIdx] || ENT_CARDS[0];
  const all = _entNotes();
  const v = (el.value || '').slice(0, 2000);
  if (v) all[c.key] = v; else delete all[c.key];
  try { localStorage.setItem('ci_ent_notes', JSON.stringify(all)); } catch (e) {}
  if (typeof toast === 'function') toast('✦ Note saved', 'success');
}

/* Visualize this card: feed the fixed card into the existing 3-min viz player and
   embed it inline. Reuses players/3min-viz.html (reads the ?g= title). */
export function entVisualize() {
  const c = ENT_CARDS[_entIdx] || ENT_CARDS[0];
  try {
    localStorage.setItem('ci_goal_title', c.title);
    localStorage.setItem('ci_ass_slides', JSON.stringify(c.affirmations || []));
    localStorage.removeItem('ci_goal_image');
  } catch (e) {}
  const host = document.getElementById('entPlayer');
  if (!host) return;
  const src = `players/3min-viz.html?g=${encodeURIComponent(c.title)}&_=${Date.now()}`;
  host.innerHTML =
    `<iframe src="${src}" title="Visualization" allow="autoplay; fullscreen" allowfullscreen style="width:100%;height:560px;border:0;display:block;background:#000;"></iframe>` +
    `<button onclick="entClosePlayer()" style="width:100%;background:#20241f;border:none;color:#fff;font-weight:800;letter-spacing:1px;padding:12px;cursor:pointer;">CLOSE PLAYER</button>`;
  host.style.display = '';
  host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
export function entClosePlayer() {
  const h = document.getElementById('entPlayer');
  if (h) { h.innerHTML = ''; h.style.display = 'none'; }
}
export function entTakeAction() {
  const c = ENT_CARDS[_entIdx] || ENT_CARDS[0];
  try {
    const d = new Date();
    const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    const w = JSON.parse(localStorage.getItem('ci_wins') || '[]');
    w.unshift({ text: 'Took action: ' + c.title, date: key, ts: Date.now() });
    localStorage.setItem('ci_wins', JSON.stringify(w));
  } catch (e) {}
  if (typeof toast === 'function') toast('✦ Win logged', 'success');
}
