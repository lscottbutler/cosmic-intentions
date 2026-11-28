/* ── GOAL PAGE (Scott 21 Nov 2026) ────────────────────────────────────────────
   One page per goal: everything for that goal in one place.
   It is the Roadmap page focused on a single goal, with a header on top:
     goal title · ✎ EDIT · ARCHIVE · 👁 VISUALIZE (3-minute visualization plays right here)
   and below it that goal's own TO DO (add box), NOTES (add box) and JOURNAL (add box),
   which already live in each goal's Roadmap section — so every add / tick / save keeps
   working exactly as before. SHOW ALL GOALS returns to the normal Roadmap. */
import { intentions, saveIntentions, esc, goalBadge, goalLetter, GOAL_COLORS, toggleGoalFavorite } from '../app.js';
import { renderWrapup, wrapupGoalToggle } from './wrapup.js';

const BTN = 'border:0;border-radius:8px;padding:10px 14px;font:700 12px/1 Arial,sans-serif;letter-spacing:.08em;cursor:pointer;white-space:nowrap';

function page() { return document.getElementById('page-myroadmap'); }

function applyFocus() {
  const idx = window.__ciGoalFocus;
  const pg = page(); if (!pg) return;
  pg.querySelectorAll('[data-gp-hide]').forEach(el => el.removeAttribute('data-gp-hide'));
  let st = document.getElementById('ci-goal-focus-style');
  if (idx == null) { st?.remove(); pg.classList.remove('ci-goal-focus'); document.getElementById('ciGoalPageBar')?.remove(); document.getElementById('ciGoalPageNext')?.remove(); return; }
  if (!st) { st = document.createElement('style'); st.id = 'ci-goal-focus-style'; st.textContent = '#page-myroadmap [data-gp-hide]{display:none!important}#page-myroadmap.ci-goal-focus .roadmap-goal-entries,#page-myroadmap.ci-goal-focus [id^="wrapRegenBtn-"]{display:none!important}'; document.head.appendChild(st); }
  pg.classList.add('ci-goal-focus');
  const bar0 = document.getElementById('ciGoalPageBar');
  if (!bar0 || bar0.dataset.idx !== String(idx)) renderBar(idx);
  else { const slot = pg.querySelector(':scope > [data-todo-personal-e-slot]'); if (slot ? slot.nextElementSibling !== bar0 : pg.firstElementChild !== bar0) { if (slot) slot.after(bar0); else pg.prepend(bar0); } }
  // Hide everything on the page except the bar, the admin message slot and this goal's own section.
  const goal = pg.querySelector(`.wgoal[data-goal-idx="${idx}"]`);
  if (!goal) return;
  for (let node = goal; node && node !== pg; node = node.parentElement) {
    if (node.tagName === 'DETAILS') node.open = true;
    for (const sib of node.parentElement.children) {
      if (sib === node || sib.id === 'ciGoalPageBar' || sib.id === 'ciGoalPageNext' || sib.matches('[data-todo-personal-e-slot],style,script,.wgoal')) continue;   // Scott 27 Nov 2026: all goals stay listed (chevron to open/close)
      sib.setAttribute('data-gp-hide', '');
    }
  }
  const sum = goal.querySelector(':scope > details > summary'); if (sum) sum.setAttribute('data-gp-hide', '');
  // Scott 23 Nov 2026: the next goal follows below as a Goal Page card — tap it to open that goal.
  const nextIdx = -1;   // Scott 27 Nov 2026: NEXT GOAL card retired — every goal is listed below with its chevron
  let nx = document.getElementById('ciGoalPageNext');
  if (nextIdx < 0) { nx?.remove(); return; }
  if (!nx) { nx = document.createElement('section'); nx.id = 'ciGoalPageNext'; }
  if (goal.nextElementSibling !== nx) goal.after(nx);
  if (nx.dataset.idx !== String(nextIdx) || nx.dataset.title !== (intentions[nextIdx].title || '')) {
    const it = intentions[nextIdx], letter = goalLetter(it, nextIdx);
    const ci = (typeof letter === 'string' && /^[A-Z]$/.test(letter)) ? letter.charCodeAt(0) - 65 : nextIdx;
    const gc = GOAL_COLORS[((ci % GOAL_COLORS.length) + GOAL_COLORS.length) % GOAL_COLORS.length] || { bg: '#1D3557', text: '#fff' };
    const date = it.targetDate || it.target_date || '';
    nx.dataset.idx = String(nextIdx); nx.dataset.title = it.title || '';
    nx.style.cssText = 'margin:28px 0 16px;padding:18px 20px;background:#fff;border:2px solid #303030;border-radius:12px;color:#171717;font:15px/1.5 Arial,sans-serif;cursor:pointer';
    nx.innerHTML = `<div style="font:800 12px/1 Arial,sans-serif;letter-spacing:.12em;color:#555;margin:0 0 10px">NEXT GOAL</div>
      <div style="display:flex;align-items:flex-start;gap:12px">${goalBadge(letter, gc.bg, gc.text, 40)}<div style="flex:1;min-width:0"><div style="font:700 20px/1.35 Arial,sans-serif">${esc(it.title || '')}</div>${date ? `<div style="font-size:13px;color:#666;margin-top:2px">Target: ${esc(date)}</div>` : ''}</div></div>
      <div style="margin:14px 0 0"><button type="button" style="${BTN};background:#000;color:#fff">OPEN THIS GOAL →</button></div>`;
    nx.onclick = () => openGoalPage(nextIdx);
  }
}
// The Roadmap re-renders itself after every add / tick; keep the focus applied.
if (typeof window !== 'undefined') setInterval(() => { if (window.__ciGoalFocus != null) applyFocus(); }, 600);

function renderBar(idx, editing = false) {
  const pg = page(); const it = intentions[idx]; if (!pg || !it) return;
  let bar = document.getElementById('ciGoalPageBar');
  if (!bar) { bar = document.createElement('section'); bar.id = 'ciGoalPageBar'; }
  bar.dataset.idx = String(idx);
  const slot = pg.querySelector(':scope > [data-todo-personal-e-slot]');
  if (slot) { if (slot.nextElementSibling !== bar) slot.after(bar); } else if (pg.firstElementChild !== bar) pg.prepend(bar);
  const letter = goalLetter(it, idx);
  const ci = (typeof letter === 'string' && /^[A-Z]$/.test(letter)) ? letter.charCodeAt(0) - 65 : idx;
  const gc = GOAL_COLORS[((ci % GOAL_COLORS.length) + GOAL_COLORS.length) % GOAL_COLORS.length] || { bg: '#1D3557', text: '#fff' };
  const date = it.targetDate || it.target_date || '';
  bar.style.cssText = 'position:relative;margin:0 0 16px;padding:18px 116px 18px 20px;background:#fff;border:2px solid #303030;border-radius:12px;color:#171717;font:15px/1.5 Arial,sans-serif';
  // Scott 25 Nov 2026: no "GOAL PAGE" label; number on the right; VISUALIZE / EDIT / ARCHIVE in a row at the bottom.
  bar.innerHTML = `
    <div style="display:flex;align-items:${editing ? "flex-start" : "center"};gap:12px">
      ${goalBadge(letter, gc.bg, gc.text, 40)}
      <div style="flex:1;min-width:0">
        ${editing
          ? `<textarea data-gp-text maxlength="150" rows="3" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #bbb;border-radius:8px;font:18px/1.4 Arial,sans-serif">${esc(it.title || '')}</textarea>
             <div style="display:flex;gap:8px;margin-top:8px"><button type="button" data-gp="save" style="${BTN};background:#000;color:#fff">SAVE</button><button type="button" data-gp="cancel" style="${BTN};background:#fff;color:#171717;border:2px solid #171717">CANCEL</button></div>`
          : `<div style="font:700 20px/1.35 Arial,sans-serif">${esc(it.title || '')}</div>`}
      </div>
    </div>
    ${(() => { let fv = false; try { fv = (JSON.parse(localStorage.getItem('ci_favorites') || '[]') || []).some(f => f && f.player === 'mindset' && ((it.id != null && f.goalId === it.id) || f.goal === idx)); } catch (_) {} return `<button type="button" data-gp="fav" title="${fv ? 'Remove from' : 'Add to'} My Favorites Reel" aria-label="Favorite" style="position:absolute;right:66px;bottom:14px;width:42px;height:42px;border-radius:50%;border:0;background:#000;color:#fff;cursor:pointer;display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:transform .15s,background .2s" onmousedown="this.style.transform='scale(.88)'" onmouseup="this.style.transform=''"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.6 5c2.1 0 3.5 1.2 4.4 2.5C11.9 6.2 13.3 5 15.4 5 19 5 21 8.6 19.6 11.8 17.5 16.4 12 21 12 21z" fill="${fv ? '#e84040' : 'none'}" stroke="${fv ? '#e84040' : '#fff'}" stroke-width="2" stroke-linejoin="round"/></svg></button>`; })()}
    <button type="button" data-gp="vizplayer" title="Visualize this goal" aria-label="Visualize this goal" style="position:absolute;right:14px;bottom:14px;width:42px;height:42px;border-radius:50%;border:0;background:#1e90ff;cursor:pointer;display:grid;place-items:center;padding:0"><svg width="26" height="18" viewBox="0 0 44 30" fill="none" stroke="#ffd84d" stroke-width="3.5" stroke-linecap="round" aria-hidden="true"><path d="M3 15 C10 4 34 4 41 15 C34 26 10 26 3 15 Z"/><circle cx="22" cy="15" r="6" fill="#ffd84d"/></svg></button>
    <div data-gp-viz></div>`;
  bar.onclick = async e => {
    if (e.target.closest('[data-gp-vizclose]')) { closeGoalViz(); return; }
    const b = e.target.closest('[data-gp]'); if (!b) return;
    const a = b.dataset.gp;
    if (a === 'all') return closeGoalPage();
    if (a === 'vizplayer') { try { (window.top.ciGoalAction || (() => {}))('viz', it.title || ''); } catch (_) {} return; }
    if (a === 'edit') return renderBar(idx, true);
    if (a === 'cancel') return renderBar(idx, false);
    if (a === 'save') {
      const v = bar.querySelector('[data-gp-text]').value.trim(); if (!v) return;
      intentions[idx].title = v; await saveIntentions(); renderWrapup(); return renderBar(idx, false);
    }
    if (a === 'archive') { await window.ciArchiveGoal?.(idx); return closeGoalPage(); }
    if (a === 'fav') { toggleGoalFavorite(idx); renderBar(idx); return; }   // Scott 27 Nov 2026: ♥ adds this goal to My Favorites Reel
    if (a === 'viz') {
      const host = bar.querySelector('[data-gp-viz]');
      if (host.firstChild) { closeGoalViz(); return; }
      const t = (it.title || 'My Vision').replace(/^(i am)\s+/i, 'I AM ');
      try { localStorage.setItem('ci_goal_title', t); } catch (_) {}
      try { history.pushState({ ciGoalViz: 1 }, ''); } catch (_) {}
      host.innerHTML = `<div style="display:flex;justify-content:flex-end;margin-top:14px"><button type="button" data-gp-vizclose style="${BTN};background:#000;color:#fff">✕ CLOSE</button></div><iframe src="players/3min-viz.html?g=${encodeURIComponent(t)}&_=${Date.now()}" title="3-minute visualization" allow="autoplay; fullscreen" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0;border-radius:10px;margin-top:14px;background:#000"></iframe>`;
    }
  };
}

export function openGoalPage(idx) {
  try { const v = JSON.parse(localStorage.getItem('ci_goal_views') || '[]'); v.push(Date.now()); localStorage.setItem('ci_goal_views', JSON.stringify(v.slice(-500))); } catch (_) {}   // MY FOCUS TODAY stats
  if (!intentions[idx]) return;
  window.__ciGoalFocus = idx;
  intentions.forEach((_, i) => wrapupGoalToggle(i, i === idx));   // this goal open, the others folded (chevron opens them)
  renderWrapup();
  applyFocus();
  page()?.scrollIntoView?.({ block: 'start' });
}

export function closeGoalPage() {
  window.__ciGoalFocus = null;
  applyFocus();
}

if (typeof window !== 'undefined') {
  window.ciOpenGoalPage = openGoalPage;
  window.ciCloseGoalPage = closeGoalPage;
}

// Scott 23 Nov 2026: ✕ CLOSE (or the phone/browser back button) closes the visualization and returns to the to-dos.
function closeGoalViz(fromBack) {
  const host = document.querySelector('#ciGoalPageBar [data-gp-viz]');
  if (!host || !host.firstChild) return;
  host.innerHTML = '';
  if (!fromBack && history.state && history.state.ciGoalViz) { try { history.back(); } catch (_) {} }
  document.getElementById('ciGoalPageBar')?.scrollIntoView({ block: 'start' });
}
if (typeof window !== 'undefined') window.addEventListener('popstate', () => closeGoalViz(true));
