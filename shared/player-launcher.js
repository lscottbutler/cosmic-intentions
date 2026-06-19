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
export function openPlayerInColumn(src) {
  if (typeof closeDrawer === 'function') closeDrawer();
  const panel = document.getElementById('playerColumn');
  const frame = document.getElementById('playerColumnFrame');
  if (!panel || !frame) {                 // no column panel here → popup fallback
    window.open(src, 'ci_player', 'width=1100,height=720,resizable=yes,menubar=no,toolbar=no');
    return;
  }
  // Show the player inline in Column B, directly above the timers dropdown.
  // Nothing else is hidden — it simply appears in place and scrolls into view.
  frame.src = src;
  panel.style.display = '';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* Close the inline player (unload the iframe to stop its audio/timer). */
export function closePlayerColumn() {
  const panel = document.getElementById('playerColumn');
  const frame = document.getElementById('playerColumnFrame');
  if (frame) frame.src = 'about:blank';
  if (panel) panel.style.display = 'none';
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
