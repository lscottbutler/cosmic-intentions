import { closeDrawer } from '../app.js';
/* ── PLAYER LAUNCHER — Affirmation only ───────────────────
   Cosmic Intentions ships ONE player: the Affirmation player.
     • Inline:     the .ent-slideshow loop driven by
                   startAffirmationLoop() in index.html
     • Standalone: player/affirmation.html (focused popout)
   Meditation, gratitude, visualization, countdown and timer
   players were removed — this module is intentionally small.

   Also hosts two generic UI accordion helpers used by the
   Pegboard / The Map (they are not players, just collapsibles).

   Depends on globals (all optional): closeDrawer, selectedVaultIdx
──────────────────────────────────────────────────────────── */

/* ── OPEN IN COLUMN — the shared pattern for ALL players ──────
   Embeds a player page in an <iframe> inside the dashboard's main
   column (#playerColumn / #playerColumnFrame in index.html) instead
   of spawning a popup window. Falls back to a popup if the panel
   isn't on the page (e.g. launched from the logged-out home). */
export function openPlayerInColumn(src, ev) {
  if (typeof closeDrawer === 'function') closeDrawer();
  const panel = document.getElementById('playerColumn');
  const frame = document.getElementById('playerColumnFrame');
  if (!panel || !frame) {                 // no column panel here → popup fallback
    window.open(src, 'ci_player', 'width=1100,height=720,resizable=yes,menubar=no,toolbar=no');
    return;
  }
  // Drop the shared player panel directly BELOW whichever time grid was clicked,
  // so every launcher (meditation, countdown, …) opens beneath its own buttons.
  const grid = ev && ev.target && ev.target.closest ? ev.target.closest('.player-times-grid') : null;
  if (grid) grid.insertAdjacentElement('afterend', panel);
  frame.src = src;
  panel.style.display = '';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* Close the inline player (unload the iframe to stop its audio/timer). */
export function closePlayerColumn() {
  _autoLooping = false;                    // a manual/real close stops auto-play
  const panel = document.getElementById('playerColumn');
  const frame = document.getElementById('playerColumnFrame');
  if (frame) frame.src = 'about:blank';
  if (panel) panel.style.display = 'none';
  // Roll every time grid back up when the player closes.
  document.querySelectorAll('.player-times-grid').forEach(g => g.classList.add('hidden'));
}

/* ── FAVORITES ───────────────────────────────────────────────
   Heart in each player saves {player, minutes} to localStorage
   'ci_favorites'. The dashboard panel is a checkbox playlist: tick
   the ones to include, drag the 6-dot grip to set the order, choose
   how many loops, then Play — the selected set chains in the column
   iframe (doze-off / fall-asleep mode). */
const FAV_LABEL = { meditation: 'Meditation', countdown: 'Countdown', gratitude: 'Gratitude', affirmation: 'Affirmations', stoic: 'Stoic', visualization: 'Visualization' };
function readFavs() { try { return JSON.parse(localStorage.getItem('ci_favorites') || '[]'); } catch (e) { return []; } }

export function renderFavorites() {
  const list = document.getElementById('favorites-list');
  if (!list) return;
  const favs = readFavs();
  if (!favs.length) {
    list.innerHTML = '<div style="color:#777;font-size:13px;padding:8px 2px;">No favorites yet — tap ♥ in any player.</div>';
    return;
  }
  list.innerHTML = '';

  // Loops control — how many times to play the whole selected list.
  const loops = document.createElement('div');
  loops.style.cssText = 'display:flex;align-items:center;gap:10px;background:#1A1A1A;border:1px solid #333;border-radius:6px;padding:10px 14px;margin-bottom:10px;';
  loops.innerHTML =
    '<span style="font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#ccc;">Loops</span>' +
    '<input id="fav-loops" type="number" min="1" max="99" value="1" style="width:60px;text-align:center;font-size:18px;font-weight:700;background:#0d0d0d;color:#fff;border:1px solid #444;border-radius:6px;padding:6px;">' +
    '<span style="margin-left:auto;color:#777;font-size:12px;">how many times to play the list</span>';
  list.appendChild(loops);

  // Checkbox rows with drag-to-reorder grips.
  let dragEl = null;
  function syncPlay() {
    const n = list.querySelectorAll('.fav-row input:checked').length;
    play.disabled = n === 0;
    play.style.opacity = n ? '1' : '.5';
    play.innerHTML = n ? `&#9654; Play ${n} selected` : '&#9654; Play selected';
  }
  favs.forEach(f => {
    const row = document.createElement('div');
    row.className = 'fav-row';
    row.draggable = true;
    row._fav = f;
    row.style.cssText = 'display:flex;align-items:center;gap:12px;background:#1A1A1A;border:1px solid #333;border-radius:6px;padding:11px 14px;margin-bottom:6px;cursor:pointer;';
    row.innerHTML =
      '<span class="fav-grip" title="Drag to reorder" style="cursor:grab;color:#666;font-size:20px;line-height:.55;letter-spacing:-4px;">&#8942;&#8942;</span>' +
      '<input type="checkbox" style="width:20px;height:20px;accent-color:#e02020;cursor:pointer;">' +
      `<span style="font-size:15px;font-weight:700;color:#fff;">${FAV_LABEL[f.player] || f.player}</span>` +
      `<span style="margin-left:auto;color:#9a9a9a;font-size:14px;">${f.minutes} min</span>`;
    const cb = row.querySelector('input');
    cb.addEventListener('change', () => {
      row.style.borderColor = cb.checked ? '#e02020' : '#333';
      row.style.background  = cb.checked ? '#261515' : '#1A1A1A';
      syncPlay();
    });
    row.addEventListener('click', e => {
      if (e.target === cb || e.target.classList.contains('fav-grip')) return;
      cb.checked = !cb.checked; cb.dispatchEvent(new Event('change'));
    });
    row.addEventListener('dragstart', () => { dragEl = row; row.style.opacity = '.4'; });
    row.addEventListener('dragend',   () => { row.style.opacity = '1'; dragEl = null; });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      if (!dragEl || dragEl === row) return;
      const r = row.getBoundingClientRect();
      list.insertBefore(dragEl, (e.clientY - r.top) < r.height / 2 ? row : row.nextSibling);
    });
    list.appendChild(row);
  });

  // Play button.
  const play = document.createElement('button');
  play.id = 'fav-play';
  play.disabled = true;
  play.style.cssText = 'display:block;width:100%;text-align:center;padding:13px;margin-top:4px;background:#e02020;border:none;color:#fff;font-weight:800;letter-spacing:1px;text-transform:uppercase;border-radius:6px;cursor:pointer;opacity:.5;';
  play.innerHTML = '&#9654; Play selected';
  play.addEventListener('click', playAllFavorites);
  list.appendChild(play);
}

export function toggleFavorites() {
  const box = document.getElementById('favorites-list');
  if (!box) return;
  const nowHidden = box.classList.toggle('hidden');
  if (!nowHidden) renderFavorites();
}

/* Selected favorites, in the current top-to-bottom (drag-set) order. */
function _selectedFavs() {
  const list = document.getElementById('favorites-list');
  if (!list) return [];
  return [...list.querySelectorAll('.fav-row')].filter(r => r.querySelector('input').checked).map(r => r._fav);
}

let _favQueue = [];
let _autoLooping = false;
function _openFav(f) {
  const panel = document.getElementById('playerColumn');
  const anchor = document.getElementById('favorites-list');
  if (panel && anchor) anchor.insertAdjacentElement('afterend', panel);
  openPlayerInColumn(`players/${f.player}.html?t=${f.minutes}`);
}

/* Play the checked favorites for the chosen number of loops (finite queue). */
export function playAllFavorites() {
  const sel = _selectedFavs();
  if (!sel.length) return;
  const box = document.getElementById('fav-loops');
  const loops = Math.max(1, Math.min(99, parseInt(box && box.value, 10) || 1));
  _favQueue = [];
  for (let l = 0; l < loops; l++) _favQueue.push(...sel);
  _autoLooping = true;
  _openFav(_favQueue.shift());
}

/* Called by a player when its timer finishes naturally. Advance the queue;
   when it's empty (all loops played) just close. */
export function playerFinished() {
  if (_autoLooping && _favQueue.length) { _openFav(_favQueue.shift()); return; }
  _autoLooping = false;
  closePlayerColumn();
}

/* Open the Affirmation player inline in the column (was a popout window). */
export function launchAffirmationPlayer() {
  openPlayerInColumn('player/affirmation.html');
}

/* ── GENERIC ACCORDIONS (used by index.html + the-map.js) ──
   Not players — collapsible panels for roadmap / Column-B sections. */
export function toggleAcc(key) {
  const panel = document.getElementById('accPanel-' + key);
  const trig  = document.getElementById('accTrig-'  + key);
  if (!panel || !trig) return;
  const isOpen = panel.classList.contains('open');
  document.querySelectorAll('.acc-panel').forEach(p  => { p.classList.remove('open'); p.style.maxHeight = ''; });
  document.querySelectorAll('.acc-trigger').forEach(t => t.classList.remove('open'));
  if (!isOpen) { panel.classList.add('open'); trig.classList.add('open'); }
}

/* Collapsible Column B section (e.g. My Roadmap triangle dropdown). */
export function toggleColBSection(key) {
  const body = document.getElementById(key + '-body');
  const arr  = document.getElementById(key + '-arr');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  if (arr) arr.classList.toggle('open', !isOpen);
}
