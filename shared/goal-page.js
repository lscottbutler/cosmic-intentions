/* ── GOAL PAGE (Scott 21 Nov 2026) ────────────────────────────────────────────
   One page per goal: everything for that goal in one place.
   It is the Roadmap page focused on a single goal, with a header on top:
     goal title · ✎ EDIT · ARCHIVE · 👁 VISUALIZE (3-minute visualization plays right here)
   and below it that goal's own TO DO (add box), NOTES (add box) and JOURNAL (add box),
   which already live in each goal's Roadmap section — so every add / tick / save keeps
   working exactly as before. SHOW ALL GOALS returns to the normal Roadmap. */
import { intentions, saveIntentions, esc, goalBadge, goalLetter, GOAL_COLORS } from '../app.js';
import { renderWrapup, wrapupGoalToggle } from './wrapup.js';

const BTN = 'border:0;border-radius:8px;padding:10px 14px;font:700 12px/1 Arial,sans-serif;letter-spacing:.08em;cursor:pointer;white-space:nowrap';

function page() { return document.getElementById('page-myroadmap'); }

function applyFocus() {
  const idx = window.__ciGoalFocus;
  const pg = page(); if (!pg) return;
  let st = document.getElementById('ci-goal-focus-style');
  if (idx == null) { st?.remove(); pg.classList.remove('ci-goal-focus'); document.getElementById('ciGoalPageBar')?.remove(); return; }
  if (!st) { st = document.createElement('style'); st.id = 'ci-goal-focus-style'; document.head.appendChild(st); }
  // Only this goal's Roadmap section shows; page intro, tabs and other goals are hidden.
  st.textContent = `
    #page-myroadmap.ci-goal-focus > *:not(#ciGoalPageBar):not(:has(#wrapupWidget)):not([data-todo-personal-e-slot]){display:none!important}
    #page-myroadmap.ci-goal-focus #wrapupWidget > *:not(:has(.wgoal)){display:none!important}
    #page-myroadmap.ci-goal-focus .wgoal:not([data-goal-idx="${idx}"]){display:none!important}
    #page-myroadmap.ci-goal-focus .wgoal[data-goal-idx="${idx}"] > details > summary{display:none!important}`;
  pg.classList.add('ci-goal-focus');
  renderBar(idx);
}

function renderBar(idx, editing = false) {
  const pg = page(); const it = intentions[idx]; if (!pg || !it) return;
  let bar = document.getElementById('ciGoalPageBar');
  if (!bar) { bar = document.createElement('section'); bar.id = 'ciGoalPageBar'; }
  const slot = pg.querySelector(':scope > [data-todo-personal-e-slot]');
  if (slot) { if (slot.nextElementSibling !== bar) slot.after(bar); } else if (pg.firstElementChild !== bar) pg.prepend(bar);
  const letter = goalLetter(it, idx);
  const ci = (typeof letter === 'string' && /^[A-Z]$/.test(letter)) ? letter.charCodeAt(0) - 65 : idx;
  const gc = GOAL_COLORS[((ci % GOAL_COLORS.length) + GOAL_COLORS.length) % GOAL_COLORS.length] || { bg: '#1D3557', text: '#fff' };
  const date = it.targetDate || it.target_date || '';
  bar.style.cssText = 'margin:0 0 16px;padding:18px 20px;background:#fff;border:2px solid #303030;border-radius:12px;color:#171717;font:15px/1.5 Arial,sans-serif';
  bar.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 10px">
      <span style="font:800 12px/1 Arial,sans-serif;letter-spacing:.12em;color:#555">GOAL PAGE</span>
      <button type="button" data-gp="all" style="${BTN};background:#fff;color:#171717;border:2px solid #171717">SHOW ALL GOALS</button>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12px">
      ${goalBadge(letter, gc.bg, gc.text, 40)}
      <div style="flex:1;min-width:0">
        ${editing
          ? `<textarea data-gp-text maxlength="150" rows="3" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #bbb;border-radius:8px;font:18px/1.4 Arial,sans-serif">${esc(it.title || '')}</textarea>
             <div style="display:flex;gap:8px;margin-top:8px"><button type="button" data-gp="save" style="${BTN};background:#000;color:#fff">SAVE</button><button type="button" data-gp="cancel" style="${BTN};background:#fff;color:#171717;border:2px solid #171717">CANCEL</button></div>`
          : `<div style="font:700 20px/1.35 Arial,sans-serif">${esc(it.title || '')}</div>${date ? `<div style="font-size:13px;color:#666;margin-top:2px">Target: ${esc(date)}</div>` : ''}`}
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 0">
      <button type="button" data-gp="viz" style="${BTN};background:#1e90ff;color:#fff;padding:12px 18px">👁 VISUALIZE</button>
      <button type="button" data-gp="edit" style="${BTN};background:#000;color:#fff">✎ EDIT</button>
      <button type="button" data-gp="archive" style="${BTN};background:#fff;color:#171717;border:2px solid #171717">ARCHIVE</button>
    </div>
    <div data-gp-viz></div>`;
  bar.onclick = async e => {
    const b = e.target.closest('[data-gp]'); if (!b) return;
    const a = b.dataset.gp;
    if (a === 'all') return closeGoalPage();
    if (a === 'edit') return renderBar(idx, true);
    if (a === 'cancel') return renderBar(idx, false);
    if (a === 'save') {
      const v = bar.querySelector('[data-gp-text]').value.trim(); if (!v) return;
      intentions[idx].title = v; await saveIntentions(); renderWrapup(); return renderBar(idx, false);
    }
    if (a === 'archive') { await window.ciArchiveGoal?.(idx); return closeGoalPage(); }
    if (a === 'viz') {
      const host = bar.querySelector('[data-gp-viz]');
      if (host.firstChild) { host.innerHTML = ''; return; }
      const t = (it.title || 'My Vision').replace(/^(i am)\s+/i, 'I AM ');
      try { localStorage.setItem('ci_goal_title', t); } catch (_) {}
      host.innerHTML = `<iframe src="players/3min-viz.html?g=${encodeURIComponent(t)}&_=${Date.now()}" title="3-minute visualization" allow="autoplay; fullscreen" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0;border-radius:10px;margin-top:14px;background:#000"></iframe>`;
    }
  };
}

export function openGoalPage(idx) {
  if (!intentions[idx]) return;
  window.__ciGoalFocus = idx;
  wrapupGoalToggle(idx, true);   // this goal's section open
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
