/* ── ENTREPRENEUR LIBRARY — in-app card page ─────────────────────────────────
   Renders the fixed, community-shared identity cards using the "monitor" card
   design (see standalone/ent-monitor-proto.html). Content is frozen + identical
   for every member (see shared/ent-library-content.js). */

import { toast } from '../app.js';
import { ENT_CARDS, ENT_CARD_TYPE, entCardHasContent, entCardImg } from './ent-library-content.js';

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
   "screens", each with a dark tab holding a large white number. */
function _greenSection(title, items, mode, cardKey) {
  const favs = mode === 'aff' ? (_entAffFavs()[cardKey] || []) : null;
  return `<div style="background:#8FA977;padding:16px 18px 20px;">
    <div style="background:#5c6158;color:#e9ebe6;font-weight:800;letter-spacing:6px;font-size:14px;text-align:center;padding:12px;margin-bottom:14px;">${title}</div>
    ${items.map((s, i) => `<div style="display:flex;align-items:stretch;margin-bottom:10px;">
      <div style="flex-shrink:0;width:56px;background:#20241f;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:28px;font-family:var(--vault-mono,monospace);">${i + 1}</div>
      <div style="flex:1;background:#fff;padding:13px 15px;color:#1c1c1c;font-size:14px;line-height:1.5;">${_esc(s)}</div>
      ${mode === 'aff' ? `<button onclick="entFav('${cardKey}',${i})" title="Favorite" aria-label="Favorite" style="flex-shrink:0;width:56px;background:#20241f;border:none;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;line-height:1;">${favs.includes(i) ? '&#9829;' : '&#9825;'}</button>` : ''}
    </div>`).join('')}
  </div>`;
}
/* Favorited affirmations, per card key (personal, saved locally). */
function _entAffFavs() { try { return JSON.parse(localStorage.getItem('ci_ent_aff_favs') || '{}'); } catch (e) { return {}; } }
export function entFav(key, i) {
  const all = _entAffFavs();
  const arr = all[key] || [];
  const at = arr.indexOf(i);
  if (at >= 0) arr.splice(at, 1); else arr.push(i);
  if (arr.length) all[key] = arr; else delete all[key];
  try { localStorage.setItem('ci_ent_aff_favs', JSON.stringify(all)); } catch (e) {}
  renderEntLibrary();
}

/* Shared overview shown where the per-card directive used to be: the make-up of a
   successful entrepreneur, the 31 skills grouped into four forces. Same on every card. */
const _ENT_FORCES = [
  ['LEG WORK', 'Show up and do the unglamorous work, every single day.',
    [['Disciplined', 'DISCIPLINED'], ['Strong Work Ethic', 'STRONG WORK ETHIC'], ['Self-Starter', 'SELF STARTER'], ['Executing Strategy', 'EXECUTING STRATEGY'], ['Executing Concept', 'EXECUTING CONCEPT'], ['Managing Time Wisely', 'MANAGING TIME WISELY'], ['Organizational Skills', 'ORGANIZATIONAL SKILLS'], ['Meticulous Planner', 'METICULOUS PLANNER']]],
  ['SMART THINKING', 'See clearly, decide well, and out-think the field.',
    [['Strategic Thinker', 'STRATEGIC THINKER'], ['Outside the Box', 'OUTSIDE BOX'], ['Skillful Communicator', 'SKILLFUL COMMUNICATOR'], ['Good Listener', 'GOOD LISTENER'], ['Successful Negotiator', 'SUCCESSFUL NEGOTIATOR'], ['Profitable', 'PROFITABLE'], ['Facilitator', 'FACILITATOR'], ['Aware of Limitations', 'AWARE OF LIMITATIONS']]],
  ['DRIVE', 'The fire that pulls you forward and draws people in.',
    [['Passionate', 'PASSIONATE'], ['Self-Confident', 'SELF CONFIDENT'], ['Competitive', 'COMPETITIVE'], ['Risk Taker', 'RISK TAKER'], ['Self Promoter', 'SELF PROMOTER'], ['Great Salesperson', 'GREAT SALES PERSON'], ['Charming', 'CHARMING'], ['Quality People', 'QUALITY PEOPLE']]],
  ['GRIT & DETERMINATION', 'The character and staying power to outlast the hard days.',
    [['Determined to Succeed', 'DETERMINED TO SUCCEED'], ['Living the Brand', 'LIVING THE BRAND'], ['Empathetic', 'EMPATHETIC'], ['Respected Manager', 'RESPECTED MANAGER'], ['Comfortable Delegating', 'COMFORTABLE DELEGATING'], ['Fairness', 'FAIRNESS'], ['Balance in Life', 'BALANCE IN LIFE']]],
];
/* Shared "GO DEEPER" media for the whole library (the overview is the same on
   every card). 3 columns — YouTube · Podcasts · Articles — 2 links each.
   Real starter links; swap these for your own curated ones anytime. */
const _ENT_RESOURCES = {
  youtube: [
    { label: 'Y Combinator — Startup advice', url: 'https://www.youtube.com/@ycombinator' },
    { label: 'GaryVee — Entrepreneurship', url: 'https://www.youtube.com/@garyvee' },
  ],
  podcasts: [
    { label: 'How I Built This (NPR)', url: 'https://www.npr.org/series/490248027/how-i-built-this' },
    { label: 'Masters of Scale', url: 'https://mastersofscale.com' },
  ],
  articles: [
    { label: 'Paul Graham — Essays', url: 'https://www.paulgraham.com/articles.html' },
    { label: 'First Round Review', url: 'https://review.firstround.com' },
  ],
};
function _entResourcesBox() {
  const col = (label, arr) => `<div>
    <div style="color:#8FA977;font-weight:800;letter-spacing:1px;font-size:13px;margin-bottom:8px;">${label}</div>
    ${arr.map(r => r.url
      ? `<a href="${r.url}" target="_blank" rel="noopener" style="display:block;color:#dfe7d6;font-size:13px;line-height:1.45;margin-bottom:7px;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:6px;">${_esc(r.label)}</a>`
      : `<div style="color:#7f8a76;font-size:13px;line-height:1.45;margin-bottom:7px;">${_esc(r.label)}</div>`).join('')}
  </div>`;
  return `<div style="grid-column:span 2;align-self:start;border:1px solid rgba(255,255,255,.14);padding:14px 16px 12px;">
    <div style="font-family:var(--vault-mono,monospace);font-weight:800;letter-spacing:2px;font-size:12px;color:#D9B94A;margin-bottom:12px;">GO DEEPER</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px 22px;">
      ${col('&#9654; YOUTUBE', _ENT_RESOURCES.youtube)}
      ${col('&#127911; PODCASTS', _ENT_RESOURCES.podcasts)}
      ${col('&#128196; ARTICLES', _ENT_RESOURCES.articles)}
    </div>
  </div>`;
}
function _entOverview() {
  const link = ([label, key]) => `<span onclick="entGoToCard('${key}')" style="cursor:pointer;text-decoration:none;">${label}</span>`;
  return `<div style="background:#1c1c1c;color:#fff;padding:20px 22px;">
    <div style="font-family:var(--vault-mono,monospace);font-weight:800;letter-spacing:2px;font-size:12px;color:#D9B94A;margin-bottom:8px;">THE SUCCESSFUL ENTREPRENEUR</div>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.55;">A successful entrepreneur isn't one trait — it's a stack of them. These 31 identity skills resolve into four forces. Master the balance and the business follows.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px 26px;">
      ${_ENT_FORCES.map(([name, desc, skills]) => `<div>
        <div style="color:#8FA977;font-weight:800;letter-spacing:1px;font-size:15px;margin-bottom:3px;">${name}</div>
        <div style="font-size:14px;line-height:1.5;opacity:.85;margin-bottom:6px;">${desc}</div>
        <div style="font-size:12px;line-height:1.7;color:#b9cfa8;">${skills.map(link).join(' &middot; ')}</div>
      </div>`).join('')}
      ${_entResourcesBox()}
    </div>
  </div>`;
}
/* Jump straight to a card by its key (from the overview skill links). */
export function entGoToCard(key) {
  const idx = ENT_CARDS.findIndex(c => c.key === key);
  if (idx < 0) return;
  _entIdx = idx;
  _open.ab = false; _open.rm = false;
  renderEntLibrary();
  window.scrollTo(0, 0);
}

export function renderEntLibrary() {
  const host = document.getElementById('entLibHost');
  if (!host) return;
  const c = ENT_CARDS[_entIdx] || ENT_CARDS[0];
  const has = entCardHasContent(c);

  const monitor = `
    <div style="background:#8FA977;padding:22px 20px 14px;">
      <div style="background:#6f7570;border-radius:10px 10px 4px 4px;padding:0 14px 10px;">
        <div style="background:#5c6158;border-radius:14px 14px 0 0;margin:0 -14px 12px;padding:14px 0;text-align:center;color:#e9ebe6;font-weight:800;letter-spacing:4px;font-size:15px;white-space:nowrap;">${_esc(ENT_CARD_TYPE)}</div>
        <div style="background:#fff;position:relative;min-height:120px;display:flex;align-items:center;justify-content:center;line-height:0;">
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:26px 22px;font-weight:900;letter-spacing:1px;font-size:28px;line-height:1.15;color:#1c1c1c;text-align:center;text-transform:uppercase;">${_affLines(c.title)}</div>
          <img src="${entCardImg(c.key)}" alt="${_esc(c.title)}" style="position:relative;width:100%;display:block;" onerror="this.style.display='none'">
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
    `${_entOverview()}
     ${_entNotesSection(c)}
     ${_greenSection('ROADMAP', c.roadmap, 'num')}
     ${_greenSection('AFFIRMATIONS', c.affirmations, 'aff', c.key)}
     ${_greenSection('BELIEFS', c.beliefs, 'belief')}
     <div id="entPlayer" style="display:none;"></div>`;
}

export function entNav(dir) {
  _entIdx = (_entIdx + dir + ENT_CARDS.length) % ENT_CARDS.length;
  _open.ab = false; _open.rm = false;
  renderEntLibrary();
}
export function entTogglePanel(which) { _open[which] = !_open[which]; renderEntLibrary(); }

/* ── MY NOTES — the user's OWN notes per card (per-user, saved locally). Multiple
   notes, two-column, each with a ⋯ menu to reorder (prioritize) or delete. The
   fixed content above is shared/identical for the community; this is personal. ── */
let _noteMenuOpen = null;
function _entNotes() { try { return JSON.parse(localStorage.getItem('ci_ent_notes') || '{}'); } catch (e) { return {}; } }
function _cardNotes(key) {
  const raw = _entNotes()[key];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) return [{ id: 'legacy', text: raw }];   // migrate old single note
  return [];
}
function _saveCardNotes(key, arr) {
  const all = _entNotes();
  if (arr.length) all[key] = arr; else delete all[key];
  try { localStorage.setItem('ci_ent_notes', JSON.stringify(all)); } catch (e) {}
}
function _noteId() { return 'n' + Date.now().toString(36) + Math.floor(Math.random() * 1e5).toString(36); }

function _entNotesSection(c) {
  const notes = _cardNotes(c.key);
  const mBtn = 'display:block;width:100%;text-align:left;background:none;border:none;color:#fff;padding:10px 14px;cursor:pointer;font-size:13px;font-weight:700;white-space:nowrap;';
  const grow = "this.style.height='auto';this.style.height=this.scrollHeight+'px';";
  const cards = notes.map((n, i) => `
    <div style="position:relative;background:#fff;padding:14px 42px 12px 15px;">
      <button onclick="entNoteMenu('${n.id}')" title="Organize / prioritize" style="position:absolute;top:6px;right:8px;background:none;border:none;cursor:pointer;font-size:22px;line-height:1;color:#555;padding:2px 4px;">&#8942;</button>
      <textarea onchange="entNoteSave('${n.id}',this)" oninput="${grow}" placeholder="Type a note…" style="width:100%;box-sizing:border-box;border:none;resize:none;overflow:hidden;font-family:inherit;font-size:14px;line-height:1.6;color:#1c1c1c;background:transparent;min-height:64px;outline:none;">${_esc(n.text || '')}</textarea>
      ${_noteMenuOpen === n.id ? `<div style="position:absolute;top:34px;right:8px;background:#20241f;z-index:6;box-shadow:0 6px 18px rgba(0,0,0,.45);min-width:160px;">
        ${i > 0 ? `<button onclick="entNoteMove('${n.id}',-1)" style="${mBtn}">&#9650;&nbsp; Prioritize</button>` : ''}
        ${i < notes.length - 1 ? `<button onclick="entNoteMove('${n.id}',1)" style="${mBtn}">&#9660;&nbsp; Move down</button>` : ''}
        <button onclick="entNoteDelete('${n.id}')" style="${mBtn}color:#ff8a8a;">&times;&nbsp; Delete</button>
      </div>` : ''}
    </div>`).join('');
  return `<div style="background:#8FA977;padding:16px 18px 20px;">
    <div style="background:#5c6158;color:#e9ebe6;font-weight:800;letter-spacing:6px;font-size:14px;text-align:center;padding:12px;margin-bottom:14px;">MY NOTES</div>
    ${notes.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:12px;align-items:start;">${cards}</div>` : ''}
    <button onclick="entAddNote()" style="display:block;width:100%;text-align:center;background:transparent;border:2px dashed #5c6158;color:#3a3f34;font-weight:800;letter-spacing:1px;padding:13px;cursor:pointer;font-size:13px;">&#43; ADD A NOTE</button>
  </div>`;
}
export function entAddNote() {
  const c = ENT_CARDS[_entIdx]; if (!c) return;
  const arr = _cardNotes(c.key);
  arr.push({ id: _noteId(), text: '' });
  _saveCardNotes(c.key, arr);
  _noteMenuOpen = null;
  renderEntLibrary();
  const ts = document.querySelectorAll('#entLibHost textarea');
  if (ts.length) ts[ts.length - 1].focus();
}
export function entNoteSave(id, el) {
  const c = ENT_CARDS[_entIdx]; if (!c || !el) return;
  const arr = _cardNotes(c.key);
  const n = arr.find(x => x.id === id);
  if (n) { n.text = (el.value || '').slice(0, 2000); _saveCardNotes(c.key, arr); }
}
export function entNoteMove(id, dir) {
  const c = ENT_CARDS[_entIdx]; if (!c) return;
  const arr = _cardNotes(c.key);
  const i = arr.findIndex(x => x.id === id); if (i < 0) return;
  const j = i + dir; if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  _saveCardNotes(c.key, arr);
  _noteMenuOpen = null;
  renderEntLibrary();
}
export function entNoteDelete(id) {
  const c = ENT_CARDS[_entIdx]; if (!c) return;
  _saveCardNotes(c.key, _cardNotes(c.key).filter(x => x.id !== id));
  _noteMenuOpen = null;
  renderEntLibrary();
}
export function entNoteMenu(id) { _noteMenuOpen = (_noteMenuOpen === id) ? null : id; renderEntLibrary(); }

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
