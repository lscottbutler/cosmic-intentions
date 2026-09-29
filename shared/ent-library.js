/* ── ENTREPRENEUR LIBRARY — in-app card page ─────────────────────────────────
   Renders the fixed, community-shared identity cards using the "monitor" card
   design (see standalone/ent-monitor-proto.html). Content is frozen + identical
   for every member (see shared/ent-library-content.js). */

import { toast, intentions, currentUser } from '../app.js';
import { mountEntrepreneurPlayer } from './entrepreneur-player.js';
import { ENT_CARDS, entCardHasContent, entCardImg, ENT_MINDSET } from './ent-library-content.js';

let _entIdx = ENT_CARDS.findIndex(c => c.key === 'SELF CONFIDENT');   // start on the authored card
if (_entIdx < 0) _entIdx = 0;
const _open = { ab: false, rm: false };   // which content panels are expanded

const _esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const _pad2 = n => String(n).padStart(2, '0');
/* First sentence of a directive — the one-line "why this is crucial". Em dashes
   and semicolons don't end a sentence; only . ! ? followed by a space or the end. */
function _firstSentence(s) {
  const m = String(s || '').match(/^.*?[.!?](?=\s|$)/);
  return m ? m[0] : String(s || '');
}
/* Split "I AM SELF-CONFIDENT" onto two lines after the leading verb phrase. */
function _affLines(title) {
  const t = _esc(title);
  const m = t.match(/^(I AM|I HAVE|I LEAD WITH|I EXECUTE|I MANAGE|I ATTRACT|I THINK|I PROMOTE)\s+(.*)$/);
  return m ? `${m[1]}<br>${m[2]}` : t;
}

/* A content block in the green "monitor" theme — dark header bar + white item
   "screens", each with a dark tab holding a large white number. */
function _greenSection(title, items, mode, cardKey) {
  const hasFav = (mode === 'aff' || mode === 'belief');
  const favs = hasFav ? (_entFavs(mode)[cardKey] || []) : null;
  return `<div style="background:#8FA977;padding:16px 18px 20px;">
    <div style="background:#5c6158;color:#e9ebe6;font-weight:800;letter-spacing:6px;font-size:14px;text-align:center;padding:12px;margin-bottom:14px;">${title}</div>
    ${items.map((s, i) => `<div style="display:flex;align-items:stretch;margin-bottom:10px;">
      <div style="flex-shrink:0;width:56px;background:#20241f;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:28px;font-family:var(--vault-mono,monospace);">${i + 1}</div>
      <div style="flex:1;background:#fff;padding:13px 15px;color:#1c1c1c;font-size:14px;line-height:1.5;">${_esc(s)}</div>
      ${hasFav ? `<button onclick="entFav('${cardKey}','${mode}',${i})" title="Favorite" aria-label="Favorite" style="flex-shrink:0;width:56px;background:#20241f;border:none;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;line-height:1;">${favs.includes(i) ? '&#9829;' : '&#9825;'}</button>` : ''}
    </div>`).join('')}
  </div>`;
}
/* Favorited items per section (aff / belief), per card key — separate stores so
   an affirmation and a belief at the same index don't collide. Saved locally. */
function _entFavKey(mode) { return mode === 'belief' ? 'ci_ent_belief_favs' : 'ci_ent_aff_favs'; }
function _entFavs(mode) { try { return JSON.parse(localStorage.getItem(_entFavKey(mode)) || '{}'); } catch (e) { return {}; } }
export function entFav(key, mode, i) {
  const storeKey = _entFavKey(mode);
  const all = _entFavs(mode);
  const arr = all[key] || [];
  const at = arr.indexOf(i);
  if (at >= 0) arr.splice(at, 1); else arr.push(i);
  if (arr.length) all[key] = arr; else delete all[key];
  try { localStorage.setItem(storeKey, JSON.stringify(all)); } catch (e) {}
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
function _entResourcesBox(res) {
  res = res || _ENT_RESOURCES;   // per-card links if the card has them, else the shared defaults
  const icoYT = `<svg width="20" height="20" viewBox="0 0 24 24" style="vertical-align:-4px;margin-right:7px;"><rect x="1" y="5" width="22" height="14" rx="4.5" fill="#FF0000"/><path d="M10 8.4v7.2l6-3.6z" fill="#fff"/></svg>`;
  const icoPod = `<svg width="19" height="19" viewBox="0 0 24 24" style="vertical-align:-4px;margin-right:7px;" fill="none" stroke="#C05BEA" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="11" r="2.3" fill="#C05BEA" stroke="none"/><path d="M8.2 15a5 5 0 1 1 7.6 0"/><path d="M5.7 17.6a8.5 8.5 0 1 1 12.6 0"/><path d="M12 13.3 11 21h2z" fill="#C05BEA" stroke="none"/></svg>`;
  const icoArt = `<svg width="18" height="18" viewBox="0 0 24 24" style="vertical-align:-4px;margin-right:7px;" fill="none" stroke="#8FA977" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><path d="M9 12h6M9 16h6"/></svg>`;
  const col = (label, arr) => `<div>
    <div style="color:#8FA977;font-weight:800;letter-spacing:1px;font-size:13px;margin-bottom:8px;">${label}</div>
    ${(arr || []).map(r => r.url
      ? `<a href="${r.url}" target="_blank" rel="noopener" style="display:block;color:#dfe7d6;font-size:13px;line-height:1.45;margin-bottom:7px;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:6px;">${_esc(r.label)}</a>`
      : `<div style="color:#7f8a76;font-size:13px;line-height:1.45;margin-bottom:7px;">${_esc(r.label)}</div>`).join('')}
  </div>`;
  return `<div style="grid-column:1/-1;align-self:start;border:1px solid rgba(255,255,255,.14);padding:14px 16px 12px;">
    <div style="font-family:var(--vault-mono,monospace);font-weight:800;letter-spacing:2px;font-size:12px;color:#D9B94A;margin-bottom:12px;">GO DEEPER</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px 22px;">
      ${col(icoYT + 'YOUTUBE', res.youtube)}
      ${col(icoPod + 'PODCASTS', res.podcasts)}
      ${col(icoArt + 'ARTICLES', res.articles)}
    </div>
  </div>`;
}
function _entOverview(c) {
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
      ${_entResourcesBox(c && c.resources)}
    </div>
  </div>`;
}
/* Jump straight to a card by its key (from the overview skill links). */
export function entGoToCard(key) {
  const idx = ENT_CARDS.findIndex(c => c.key === key);
  if (idx < 0) return;
  // The card page can switch skills in place; a library tile must ask the
  // Master Player to open the card destination with the selected skill key.
  if (!document.getElementById('page-entcard')?.classList.contains('active')) {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'ci-open-ent-card', key }, location.origin);
    } else if (typeof window.navTo === 'function') {
      window.navTo('entcard');
      window.setTimeout(() => {
        document.getElementById('ciMasterPlayerFrame')?.contentWindow?.postMessage(
          { type: 'ci-lfm-select', action: 'ent-card', entKey: key }, location.origin);
      }, 250);
    }
    return;
  }
  _entIdx = idx;
  _open.ab = false; _open.rm = false;
  renderEntLibrary();
  window.scrollTo(0, 0);
}

export function entBackToLibrary() {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'ci-open-entrepreneur-library' }, location.origin);
  } else if (typeof window.navTo === 'function') {
    window.navTo('entrepreneurlibrary');
  }
}

/* THE 50 THINGS PEOPLE WANT MOST — a synthesized list of the most universal human wants,
   grounded in the classic desire frameworks (Cashvertising's "Life-Force 8" + secondary
   wants, Steven Reiss's 16 Basic Desires, and Maslow). Used as the second library on the
   Cosmic Library hub. (No apostrophes — labels ride inside inline onclick handlers.) */
const FIFTY_THINGS = [
  'Good Health', 'Financial Freedom', 'A Loving Relationship', 'Happiness', 'Peace of Mind',
  'Personal Freedom', 'Security', 'Self-Confidence', 'Success', 'Respect',
  'Recognition', 'A Sense of Purpose', 'More Time', 'More Energy', 'Less Stress',
  'Better Sleep', 'Physical Fitness', 'A Youthful Appearance', 'Popularity', 'Belonging',
  'True Friendship', 'Family Harmony', 'A Happy Marriage', 'Romance', 'Intimacy',
  'Thriving Children', 'Safety and Protection', 'A Comfortable Home', 'Wealth', 'Passive Income',
  'Career Advancement', 'Job Satisfaction', 'Mastery of a Skill', 'Knowledge', 'Creativity',
  'Adventure', 'Travel', 'Fun and Enjoyment', 'Beauty', 'Personal Style',
  'Status', 'Influence', 'Independence', 'Self-Improvement', 'Spiritual Fulfillment',
  'To Be Loved', 'To Feel Important', 'To Leave a Legacy', 'Fairness and Justice', 'Convenience',
];

/* The 50 wants sorted into intuitive life-area groups — same collapsible dropdown
   treatment as the Entrepreneur forces. Labels MUST match FIFTY_THINGS exactly
   (card art is looked up by each label's original index). All 50 appear once. */
const FIFTY_GROUPS = [
  ['HEALTH & VITALITY', 'Feel strong, rested, and fully alive.',
    ['Good Health', 'Physical Fitness', 'More Energy', 'Better Sleep', 'Less Stress', 'A Youthful Appearance']],
  ['WEALTH & SECURITY', 'Money, safety, and a stable foundation.',
    ['Financial Freedom', 'Wealth', 'Passive Income', 'Security', 'Safety and Protection', 'A Comfortable Home', 'Convenience']],
  ['LOVE & RELATIONSHIPS', 'Deep bonds with the people who matter most.',
    ['A Loving Relationship', 'A Happy Marriage', 'Romance', 'Intimacy', 'True Friendship', 'Family Harmony', 'Thriving Children', 'To Be Loved']],
  ['SUCCESS & ACHIEVEMENT', 'Win, grow, and be recognized for it.',
    ['Success', 'Career Advancement', 'Job Satisfaction', 'Mastery of a Skill', 'Status', 'Influence', 'Recognition', 'To Leave a Legacy']],
  ['FREEDOM & GROWTH', 'Own your time and keep becoming more.',
    ['Personal Freedom', 'Independence', 'More Time', 'Self-Improvement', 'Knowledge', 'Creativity']],
  ['PEACE & PURPOSE', 'Inner calm, confidence, and meaning.',
    ['Happiness', 'Peace of Mind', 'A Sense of Purpose', 'Spiritual Fulfillment', 'Self-Confidence', 'To Feel Important', 'Respect', 'Fairness and Justice']],
  ['FUN & BELONGING', 'Enjoy life and feel part of something.',
    ['Adventure', 'Travel', 'Fun and Enjoyment', 'Beauty', 'Personal Style', 'Popularity', 'Belonging']],
];

/* COSMIC LIBRARY hub — a 3-column grid of every Entrepreneur card image; each image
   opens its corresponding card in the Entrepreneur Library. Built from ENT_CARDS so it
   stays in sync and reuses entCardImg() (which handles the file-naming quirks).
   Also renders the "50 Things People Want Most" grid (placeholder art reuses ENT images). */
function renderEntrepreneurGrid(hostId) {
  // Entrepreneur Library — the 31 cards grouped under their four forces, each
  // card followed by a one-sentence "why this is crucial" (the card's directive).
  const host = document.getElementById(hostId);
  if (host) {
    host.className = 'ent-force-groups';
    const byKey = k => ENT_CARDS.find(c => c.key === k);
    host.innerHTML = _ENT_FORCES.map(([name, desc, skills], index) => {
      const cards = skills.map(([label, key]) => {
        const c = byKey(key);
        if (!c) return '';
        const why = c.directive ? _firstSentence(c.directive) : '';
        return `<div class="ent-force-card">
          <button class="cl-card" onclick="entGoToCard('${_esc(key)}')" title="${_esc(c.title || key)}" aria-label="${_esc(c.title || key)}">
            <img src="${entCardImg(key)}" alt="${_esc(c.title || key)}" loading="lazy" onerror="this.closest('.ent-force-card').style.display='none'">
          </button>
          <div class="ent-force-why">${_esc(why)}</div>
        </div>`;
      }).join('');
      return `<details class="ent-force-sec"${hostId === 'entrepreneurLibraryGrid' && index === 0 ? ' open' : ''}>
        <summary class="ent-force-sec__head"><span class="ent-force-sec__bar">${_esc(name)}<span class="ent-force-sec__chev">&#9662;</span></span></summary>
        <p class="ent-force-sec__desc">${_esc(desc)}</p>
        <div class="ent-force-sec__grid">${cards}</div>
      </details>`;
    }).join('');
  }
}

export function renderEntrepreneurLibrary() {
  renderEntrepreneurGrid('entrepreneurLibraryGrid');
}

export function renderCosmicLibrary() {
  // "The Successful Entrepreneur" overview (from the Entrepreneur Library card)
  // re-homed here as a collapsible dropdown, above the Entrepreneur grid.
  const dd = document.getElementById('entOverviewDropdown');
  if (dd) {
    const link = ([label, key]) => `<span onclick="entGoToCard('${key}')" style="cursor:pointer;">${label}</span>`;
    const forces = _ENT_FORCES.map(([name, desc, skills]) => `<div>
      <div style="color:#8FA977;font-weight:800;letter-spacing:1px;font-size:15px;margin-bottom:3px;">${name}</div>
      <div style="font-size:14px;line-height:1.5;opacity:.85;margin-bottom:6px;">${desc}</div>
      <div style="font-size:12px;line-height:1.7;color:#b9cfa8;">${skills.map(link).join(' &middot; ')}</div>
    </div>`).join('');
    dd.innerHTML = `<details class="ent-overview-dd">
      <summary class="ent-overview-dd__sum">THE SUCCESSFUL ENTREPRENEUR<span class="ent-overview-dd__chev">&#9662;</span></summary>
      <div class="ent-overview-dd__body">
        <p style="margin:0 0 16px;font-size:16px;line-height:1.55;">A successful entrepreneur isn't one trait &mdash; it's a stack of them. These 31 identity skills resolve into four forces. Master the balance and the business follows.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px 26px;">${forces}${_entResourcesBox(null)}</div>
      </div>
    </details>`;
  }
  renderEntrepreneurGrid('cosmicLibraryGrid');
  const fifty = document.getElementById('fiftyThingsGrid');
  if (fifty) {
    fifty.className = 'ent-force-groups';   // stack the group dropdowns full-width (not the 3-col image grid)
    fifty.innerHTML = FIFTY_GROUPS.map(([name, desc, labels]) => {
      const cards = labels.map(label => {
        const i = FIFTY_THINGS.indexOf(label);
        const img = entCardImg(ENT_CARDS[(i < 0 ? 0 : i) % ENT_CARDS.length].key);   // reused ENT art (placeholder)
        const t = _esc(label);
        return `
        <button class="cl-card cl-card--cap" onclick="toast('Coming soon: ${t}','info')" title="${t}" aria-label="${t}">
          <img src="${img}" alt="" loading="lazy" onerror="this.style.display='none'">
          <span class="cl-card-cap">${t}</span>
        </button>`;
      }).join('');
      return `<details class="ent-force-sec">
        <summary class="ent-force-sec__head"><span class="ent-force-sec__bar">${_esc(name)}<span class="ent-force-sec__chev">&#9662;</span></span></summary>
        <p class="ent-force-sec__desc">${_esc(desc)}</p>
        <div class="ent-force-sec__grid">${cards}</div>
      </details>`;
    }).join('');
  }
}

let _initialEntCardApplied = false;
let _disposeEntExperience;
export function renderEntLibrary() {
  if (!_initialEntCardApplied) {
    _initialEntCardApplied = true;
    const key = new URLSearchParams(location.search).get('ent');
    const idx = ENT_CARDS.findIndex(card => card.key === key);
    if (idx >= 0) _entIdx = idx;
  }
  const host = document.getElementById('entLibHost');
  if (!host) return;
  _disposeEntExperience?.();
  const c = ENT_CARDS[_entIdx] || ENT_CARDS[0];
  const has = entCardHasContent(c);

  const monitor = `
    <button type="button" onclick="entBackToLibrary()" style="display:block;margin:0 0 12px;padding:9px 12px;border:1px solid #20241f;border-radius:7px;background:#fff;color:#20241f;font-weight:800;cursor:pointer;">‹ ENTREPRENEUR LIBRARY</button>
    <div style="padding:0 0 14px;">
      <div style="background:#6f7570;border-radius:10px 10px 4px 4px;padding:0 14px 10px;">
        <div style="background:#5c6158;border-radius:14px 14px 0 0;margin:0 -14px 12px;padding:14px 0;text-align:center;color:#e9ebe6;font-weight:800;letter-spacing:4px;font-size:15px;white-space:nowrap;">ENTREPRENEUR PLAYER</div>
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

  host.innerHTML = monitor + '<div id="entExperience"></div><div id="entPlayer" style="display:none;"></div>';
  _disposeEntExperience = mountEntrepreneurPlayer(host.querySelector('#entExperience'), {
    card: c,
    goals: intentions || [],
    getAccount: () => currentUser?.id || '',
    notesHTML: _entNotesSection(c),
    mindsetHTML:
      _greenSection('AFFIRMATIONS', c.affirmations, 'aff', c.key) +
      _greenSection('BELIEFS', c.beliefs, 'belief', c.key) +
      (ENT_MINDSET[c.key] ? _greenSection('STOIC PRINCIPLES', ENT_MINDSET[c.key].stoic, 'num') +
       _greenSection('WINNING ATTITUDES', ENT_MINDSET[c.key].attitudes, 'num') : ''),
  });
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
    <div draggable="true" ondragstart="entNoteDragStart('${n.id}',event)" ondragover="entNoteDragOver(event)" ondrop="entNoteDrop('${n.id}',event)" ondragend="entNoteDragEnd(this)" style="position:relative;background:#fff;padding:14px 40px 30px 15px;">
      <button onclick="entNoteDelete('${n.id}')" title="Delete note" aria-label="Delete note" style="position:absolute;top:8px;right:8px;width:22px;height:22px;border-radius:50%;background:#000;border:none;color:#fff;cursor:pointer;font-size:13px;line-height:1;display:flex;align-items:center;justify-content:center;padding:0;">&times;</button>
      <span aria-hidden="true" style="float:left;shape-outside:circle(52%);-webkit-shape-outside:circle(52%);width:34px;height:34px;border-radius:50%;background:#000;color:#fff;font-weight:800;font-size:15px;text-align:center;line-height:34px;margin:2px 12px 4px 0;">${i + 1}</span>
      <div class="ent-note" contenteditable="true" onblur="entNoteSave('${n.id}',this)" data-ph="Type a note…" style="font-family:inherit;font-size:14px;line-height:1.6;color:#1c1c1c;min-height:34px;outline:none;">${_esc(n.text || '')}</div>
      <span title="Drag to reorder" style="position:absolute;bottom:7px;right:9px;cursor:grab;color:#c2c2c2;font-size:15px;line-height:1;user-select:none;">&#9776;</span>
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
  const ts = document.querySelectorAll('#entLibHost .ent-note');
  if (ts.length) ts[ts.length - 1].focus();
}
export function entNoteSave(id, el) {
  const c = ENT_CARDS[_entIdx]; if (!c || !el) return;
  const arr = _cardNotes(c.key);
  const n = arr.find(x => x.id === id);
  const val = (el.value != null ? el.value : (el.innerText || ''));   // textarea .value OR contenteditable .innerText
  if (n) { n.text = val.slice(0, 2000); _saveCardNotes(c.key, arr); }
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

/* Drag-to-reorder the MY NOTES cards with the mouse. Dragging that starts on
   the textarea is ignored so typing/selecting text still works. */
let _dragNoteId = null;
export function entNoteDragStart(id, ev) {
  if (ev && ev.target && (ev.target.tagName === 'TEXTAREA' || ev.target.isContentEditable)) { ev.preventDefault(); return; }
  _dragNoteId = id;
  if (ev && ev.dataTransfer) { ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', id); } catch (e) {} }
  if (ev && ev.currentTarget && ev.currentTarget.style) ev.currentTarget.style.opacity = '.45';
}
export function entNoteDragOver(ev) { if (ev) { ev.preventDefault(); if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move'; } }
export function entNoteDragEnd(el) { if (el && el.style) el.style.opacity = ''; _dragNoteId = null; }
export function entNoteDrop(targetId, ev) {
  if (ev) ev.preventDefault();
  const c = ENT_CARDS[_entIdx]; if (!c) return;
  let src = _dragNoteId;
  if (!src && ev && ev.dataTransfer) { try { src = ev.dataTransfer.getData('text/plain'); } catch (e) {} }
  _dragNoteId = null;
  if (!src || src === targetId) return;
  const arr = _cardNotes(c.key);
  const from = arr.findIndex(x => x.id === src);
  const to   = arr.findIndex(x => x.id === targetId);
  if (from < 0 || to < 0) return;
  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved);
  _saveCardNotes(c.key, arr);
  _noteMenuOpen = null;
  renderEntLibrary();
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
