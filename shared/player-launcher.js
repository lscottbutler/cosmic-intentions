import { closeDrawer } from '../app.js';
import { markPillar, pillarForSrc } from './rings.js';

/* Pillar of the player currently open in the column — set on open,
   consumed (and cleared) when that session finishes naturally. */
let _currentPillar = null;
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
  // so the global launchers (meditation, countdown, visualization…) open beneath their buttons.
  // Meditation's grid lives in a collapsible drawer, so it anchors to its [data-player-box]
  // wrapper instead — the player opens right under the meditation banner, not page-bottom.
  // (Per-goal play buttons use the inline player in the vault list instead — see playGoalInline.)
  const anchor = ev && ev.target && ev.target.closest ? ev.target.closest('.player-times-grid, [data-player-box]') : null;
  if (anchor) anchor.insertAdjacentElement('afterend', panel);
  _currentPillar = pillarForSrc(src);   // remember which ring a natural finish should close
  frame.src = src;
  panel.style.display = '';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* Close the inline player (unload the iframe to stop its audio/timer). */
export function closePlayerColumn() {
  _autoLooping = false;                    // a manual/real close stops auto-play
  _currentPillar = null;                   // dropped before finishing → no ring credit
  _clearNowPlaying();                      // drop the "now playing" row highlight
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

/* ── TYPED FAVORITES ──────────────────────────────────────────
   Every favorite carries a `type`. PLAYABLE types are audio sessions that
   loop in the sleep-player; everything else is a jump-to shortcut (open a
   goal / task / video / page). Legacy items (no `type`, just `player`) are
   inferred so old ci_favorites entries keep working unchanged. */
const FAV_PLAYABLE = new Set(['meditation', 'countdown', 'gratitude', 'affirmation', 'stoic', 'visualization', 'mindset', 'note']);
const FAV_ICON = { meditation: '🧘', countdown: '⏳', gratitude: '🙏', affirmation: '✦', stoic: '◈', visualization: '◉', mindset: '✦', goal: '🎯', task: '✓', video: '🎬', page: '🔗', note: '📝' };

export function favType(f) {
  if (!f) return '';
  if (f.type) return f.type;
  if (f.player === 'mindset') return 'mindset';   // legacy goal-mindset shape
  return f.player || '';                            // legacy audio-session shape
}
export function favIsPlayable(f) { return FAV_PLAYABLE.has(favType(f)); }

/* Route a favorite by type: playable → play in the column; jump-to → navigate. */
export function openFavorite(f) {
  if (!f) return;
  const t = favType(f);
  if (FAV_PLAYABLE.has(t)) { _openFav(f); return; }
  switch (t) {
    case 'goal':
      if (f.goal != null && typeof window.openVizGoal === 'function') window.openVizGoal(f.goal);
      else if (typeof window.openVizLibrary === 'function') window.openVizLibrary();
      break;
    case 'task':
      if (typeof window.openMyRoadmap === 'function') window.openMyRoadmap();
      break;
    case 'video':
      if (f.target) window.open(f.target, '_blank', 'noopener');
      break;
    case 'page':
      if (f.target && typeof window.navTo === 'function') window.navTo(f.target);
      break;
    case 'note':
      // Stage 2 will show this as an on-screen card; for now jump to My Notes.
      if (typeof window.navTo === 'function') window.navTo('notes');
      break;
    default: break;
  }
}
if (typeof window !== 'undefined') window.openFavorite = openFavorite;

export function renderFavorites() {
  const list = document.getElementById('favorites-list');
  if (!list) return;
  const favs = readFavs();
  // Daily Focus = the "Play My Day" playlist: playable audio sessions only.
  // Pinned jump-to shortcuts (tasks / pages / goals) are intentionally not
  // listed here — this page is the play queue, not a bookmark list.
  const playable = favs.filter(favIsPlayable);
  if (!playable.length) {
    list.innerHTML = '<div style="color:#777;font-size:13px;padding:8px 2px;">No sessions pinned yet — tap ♥ in any player.</div>';
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
    play.innerHTML = n ? `&#9654; Play My Day (${n})` : '&#9654; Play My Day';
  }
  playable.forEach(f => {
    const row = document.createElement('div');
    row.className = 'fav-row';
    row.draggable = true;
    row._fav = f;
    row.style.cssText = 'display:flex;align-items:center;gap:12px;background:#1A1A1A;border:1px solid #333;border-radius:6px;padding:11px 14px;margin-bottom:6px;cursor:pointer;';
    const _esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const _t = favType(f);
    const _label = _t === 'note' ? (f.text || f.title || 'Note')
                 : f.player === 'mindset' ? (f.title || 'Goal mindset')
                 : (FAV_LABEL[f.player] || f.player);
    const _meta = _t === 'note' ? 'card' : (f.player === 'mindset' ? 'Mindset' : f.minutes + ' min');
    row.innerHTML =
      '<span class="fav-grip" title="Drag to reorder" style="cursor:grab;color:#666;font-size:20px;line-height:.55;letter-spacing:-4px;">&#8942;&#8942;</span>' +
      '<input type="checkbox" style="width:20px;height:20px;accent-color:#e02020;cursor:pointer;">' +
      `<span style="flex:1;min-width:0;font-size:15px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(_label)}</span>` +
      `<span style="margin-left:auto;flex-shrink:0;color:#9a9a9a;font-size:14px;">${_meta}</span>`;
    const cb = row.querySelector('input');
    cb.checked = true;                    // default: the whole day is queued, ready to Play
    row.style.borderColor = '#e02020';
    row.style.background  = '#261515';
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
  play.style.cssText = 'display:block;width:100%;text-align:center;padding:15px;margin:0 0 14px;background:#e02020;border:none;color:#fff;font-weight:800;letter-spacing:1px;text-transform:uppercase;border-radius:8px;cursor:pointer;font-size:16px;';
  play.innerHTML = '&#9654; Play My Day';
  play.addEventListener('click', playAllFavorites);
  list.insertBefore(play, list.firstChild);   // Play My Day sits at the very top
  syncPlay();
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

/* Highlight the playlist row whose session is playing right now. Distinct from
   the red "queued/checked" style so you can see where you are in the day. */
let _playingRow = null;
function _clearNowPlaying() {
  if (!_playingRow) return;
  const cb = _playingRow.querySelector('input');
  const on = cb && cb.checked;
  _playingRow.style.borderColor = on ? '#e02020' : '#333';
  _playingRow.style.background  = on ? '#261515' : '#1A1A1A';
  _playingRow.style.boxShadow   = '';
  _playingRow = null;
}
function _markNowPlaying(f) {
  _clearNowPlaying();
  const list = document.getElementById('favorites-list');
  if (!list) return;
  const row = [...list.querySelectorAll('.fav-row')].find(r => r._fav === f);
  if (!row) return;
  _playingRow = row;
  row.style.borderColor = '#ffd24a';                                   // gold = now playing
  row.style.background  = '#2e2410';
  row.style.boxShadow   = '0 0 0 2px rgba(255,210,74,.55), 0 0 14px rgba(255,210,74,.35)';
}

function _openFav(f) {
  const panel = document.getElementById('playerColumn');
  const anchor = document.getElementById('favorites-list');
  if (panel && anchor) anchor.insertAdjacentElement('afterend', panel);
  _markNowPlaying(f);
  // Note favorite → show it as an on-screen card (auto-advances the loop).
  if (favType(f) === 'note') {
    try { localStorage.setItem('ci_note_card', JSON.stringify({ text: f.text || f.title || '', cat: f.cat || '' })); } catch (e) {}
    openPlayerInColumn(`players/note-card.html?_=${Date.now()}`);
    return;
  }
  // Goal favorite → play that goal's full mindset once (so the loop advances).
  if (f.player === 'mindset' && f.goal != null && typeof window.__ciGoalSlides === 'function') {
    const slides = window.__ciGoalSlides(f.goal) || [];
    if (slides.length) { try { localStorage.setItem('ci_ass_slides', JSON.stringify(slides)); localStorage.setItem('ci_goal_title', f.title || ''); } catch (e) {} }
    openPlayerInColumn(`players/ass-template.html?type=mindset&once=1&_=${Date.now()}`);
    return;
  }
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
  // A session finished naturally → close its pillar ring for today.
  if (_currentPillar) { markPillar(_currentPillar); _currentPillar = null; }
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
