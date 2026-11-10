import { ringsSummary, ringsWeekSummary, currentTier } from './rings.js';
import { renderPBIntentionList } from './card-builder.js';
import { LS, esc, toast, buildContext, getPB, goalBadge, goalCase, intentions, GREY_SHADES, GOAL_COLORS, saveIntentions, dayKey, currentUser } from '../app.js';
import { setTaskWin } from './wins.js';
import { taskNoteKey, taskNoteContext, taskNoteButton, taskNotePanel, taskLinkedEntriesHTML } from './task-notes.js';
/* ── EVENING WRAP-UP ─────────────────────────────────────
   Phase 1: a STORY recap (daily + weekly), not a dashboard.
   "Here's what you did today / here's your week."
   Templated for now — the multi-pass AI personalization is a
   held future thought (see project_wrapup_tracking_vision).
───────────────────────────────────────────────────────── */

const BRAND = '#F5A623';
const DONE  = '#4ADE80';
const ROADMAP_COLOR = '#2e7d32';

/* ── CODE-CARD SYSTEM (Phase 1) ───────────────────────────────────────────
   Every action row is a quiet white card: a thin goal-color rail, one visible
   action (the complete checkbox), a goal-colored CODE chip (e.g. "C2.1"), the
   text, and a ⋯ overflow menu holding everything else.

   Codes this pass are POSITION-based (goal letter by slot, number by order) —
   same semantics as the old 10/20/30 badge. Phase 2 freezes them at creation
   so they're safe to write in a physical journal. */
/* ── STABLE GOAL LETTERS ─────────────────────────────────────────────────────
   Each goal owns a permanent letter (A, B … Z, AA …) that never shifts on
   reorder/delete — the counterpart to the stable NUMBERS. Kept in its own
   localStorage registry (ci_goal_letters) keyed by the goal's stable id, so it
   survives intention re-syncs and isn't tied to list position. On first run each
   goal is LOCKED to its current positional letter (nothing jumps); new goals
   take the next free letter, and a deleted goal frees its letter for reuse. */
function _letterAt(n) { let s = ''; n = n + 1; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; }
function _letterMapRead() { try { return JSON.parse(localStorage.getItem('ci_goal_letters') || '{}') || {}; } catch (_) { return {}; } }
let _goalLetterCache = {};
function _ensureGoalLetters() {
  const list = intentions || [];
  const map = _letterMapRead();
  let changed = false;
  const liveIds = new Set(list.map(it => it && it.id).filter(Boolean));
  const used = new Set();
  Object.keys(map).forEach(id => { if (liveIds.has(id)) used.add(map[id]); else { delete map[id]; changed = true; } });  // free letters of deleted goals
  // Assign in list order: the LOWEST free letter. On first lock this reproduces
  // each goal's current positional letter (A,B,C…); later a new goal reuses the
  // lowest freed letter (compact, predictable) instead of drifting ever upward.
  list.forEach((it) => {
    if (!it || !it.id || map[it.id]) return;
    let k = 0, letter = _letterAt(0);
    while (used.has(letter)) { k++; letter = _letterAt(k); }
    map[it.id] = letter; used.add(letter); changed = true;
  });
  if (changed) { try { localStorage.setItem('ci_goal_letters', JSON.stringify(map)); } catch (_) {} }
  _goalLetterCache = map;
  return map;
}
const _goalLetter = (idx) => {
  const it = (intentions || [])[idx];
  if (it && it.id && _goalLetterCache[it.id]) return _goalLetterCache[it.id];
  return _letterAt(idx);   // fallback before assignment / for id-less goals
};

// One overflow-menu item / separator.
const _mItem = (onclick, icon, label, danger) =>
  `<button onclick="${onclick}" style="display:flex;align-items:center;gap:9px;width:100%;padding:8px 9px;border:none;background:transparent;border-radius:6px;font-size:12pt;font-weight:500;color:${danger ? '#d1364b' : '#2a2c31'};cursor:pointer;text-align:left;font-family:inherit;"><span style="width:16px;text-align:center;font-size:13px;">${icon}</span>${label}</button>`;
const _mSep = () => `<div style="height:1px;background:#eee;margin:4px 6px;"></div>`;

/* Darken (f<1) or lighten (f>1) a #rrggbb toward black/white by factor f. Used
   to derive the two card shades from the goal's own colour. */
function _shade(hex, f) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex || '');
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map(c => Math.max(0, Math.min(255, Math.round(c * f))));
  return '#' + ch.map(x => x.toString(16).padStart(2, '0')).join('');
}

// The shared quiet card. `items` is the pre-built ⋯ menu HTML.
// The menu is IN-FLOW (expands inside the card, pushing the next card down) —
// deliberately NOT an absolute popover, so it can never be clipped by the goal
// dropdown's `overflow:hidden` (details-content) and needs no position math.
function _card({ shade, code, text, done, toggleCall, items, indent = 0, fade = false, variant = 'my', noteContext, showLinkedEntries = false, deleteCall, railColor }) {
  // To-do lists retain provenance colors; Roadmap cards match their green tab.
  // The code chip retains the goal's shade.
  const rail = showLinkedEntries ? (railColor || '#292929') : (variant === 'roadmap' ? ROADMAP_COLOR : '#000');
  return `<div class="wcard" style="position:relative;background:#fff;border:1px solid #e6e6e9;border-radius:13px;margin:0 0 9px 0;padding:12px 10px 12px 26px;box-shadow:0 1px 2px rgba(0,0,0,.12);overflow:hidden;">
    <span style="position:absolute;left:0;top:0;bottom:0;width:15px;background:${rail};${fade ? 'opacity:.5;' : ''}"></span>
    <div style="display:flex;align-items:center;gap:11px;${showLinkedEntries ? 'flex-wrap:wrap;' : ''}">
      <button onclick="${toggleCall}" title="${done ? 'Completed — tap to undo' : 'Mark done'}" style="flex-shrink:0;width:22px;height:22px;border-radius:50%;border:2px solid ${done ? '#111' : '#c9ccd1'};background:${done ? '#111' : '#fff'};color:#fff;cursor:pointer;font-size:12px;line-height:1;display:inline-flex;align-items:center;justify-content:center;">${done ? '✓' : ''}</button>
      <span style="flex:${showLinkedEntries ? '1 1 150px' : '1'};min-width:0;font-size:15px;line-height:1.45;color:${done ? '#a2a5ac' : '#15161a'};${done ? 'text-decoration:line-through;text-decoration-color:#c4c6cb;' : ''}">${esc(text)}</span>
      ${showLinkedEntries && noteContext ? `<div class="goal-task-entry-buttons" style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">${[['note','#000'],['journal','#4e4e4e']].map(([kind,color]) => `<button type="button" aria-expanded="false" aria-label="Show ${kind} for task ${esc(code)}" onclick="const panel=this.closest('.wcard').querySelector('[data-linked-kind=${kind}]');panel.hidden=!panel.hidden;this.setAttribute('aria-expanded',String(!panel.hidden));" style="background:${color};color:#fff;border:0;border-radius:5px;padding:6px 10px;font-size:12px;font-weight:800;cursor:pointer">${kind.toUpperCase()}</button>`).join('')}</div>` : ''}
      <!-- Goal-code box + ⋯ menu, Priority P, × delete: shown on roadmap/other views,
           HIDDEN on the TO DO page (showLinkedEntries) for a simpler card. -->
      ${!showLinkedEntries && noteContext ? `<button type="button" class="task-priority" aria-label="Priority task ${esc(code)}" aria-pressed="${!!taskIsPriority(noteContext)}" onclick="wrapTogglePriority('${encodeURIComponent(taskNoteKey(noteContext)).replace(/'/g,'%27')}')" title="Toggle priority" style="flex-shrink:0;width:32px;height:32px;border:2px solid #4e4e4e;border-radius:50%;background:${taskIsPriority(noteContext) ? '#4e4e4e' : '#fff'};color:${taskIsPriority(noteContext) ? '#fff' : '#4e4e4e'};font-weight:700;cursor:pointer;">P</button>` : ''}
      ${taskNoteButton(noteContext)}
      ${!showLinkedEntries ? `<div style="flex-shrink:0;display:flex;flex-direction:column;width:46px;border-radius:9px;overflow:hidden;background:${shade.bg};box-shadow:0 1px 2px rgba(0,0,0,.15);">
        <span style="display:flex;align-items:center;justify-content:center;padding:7px 4px 5px;color:${shade.text};font-family:var(--vault-mono);font-size:13px;font-weight:800;letter-spacing:.4px;line-height:1;">${esc(code)}</span>
        <button class="wcard-more" onclick="wrapCardMenu(event,this)" title="More actions" aria-label="More actions" style="border:none;border-top:1px solid rgba(0,0,0,.2);background:rgba(0,0,0,.13);color:${shade.text};cursor:pointer;font-size:16px;line-height:1;padding:3px 0 5px;">⋯</button>
      </div>` : ''}
    </div>
    <div class="wcard-menu"><div style="margin:9px -3px -3px;padding:6px 3px 3px;border-top:1px solid #eee;">${items}</div></div>
    ${taskNotePanel(noteContext)}
    ${showLinkedEntries && noteContext ? `<div class="goal-action-records" data-task-context="${esc(JSON.stringify(noteContext))}">${taskLinkedEntriesHTML(noteContext)}</div>` : ''}
  </div>`;
}

// ── ⋯ overflow menu: one open at a time; closes on outside-click or any action ──
// Finds the menu RELATIVE to the tapped ⋯ button (this card's .wcard-menu) — the
// same rows render in several tab panels at once, so an id lookup would hit a
// duplicate in a hidden panel. closest() always targets the button you tapped.
export function wrapCardMenu(ev, btn) {
  if (ev) ev.stopPropagation();
  const card = btn && btn.closest ? btn.closest('.wcard') : null;
  const el = card ? card.querySelector('.wcard-menu') : null;
  if (!el) return;
  const open = el.classList.contains('open');
  document.querySelectorAll('.wcard-menu.open').forEach(m => m.classList.remove('open'));
  if (!open) el.classList.add('open');
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', () => {
    document.querySelectorAll('.wcard-menu.open').forEach(m => m.classList.remove('open'));
  });
}

// Copy a task's journal code (e.g. "C2.1") — the paper-journal handoff.
export function wrapCopyCode(code) {
  try { navigator.clipboard.writeText(code); toast(`Copied ${code}`, 'success'); }
  catch (_) { toast(code, 'info'); }
}

/* ── Favorite a code-card (My-Action or Roadmap task) ─────────────────────────
   Saves the task as a jump-to shortcut in the Favorites panel (type:'task',
   keyed by goal + stable code). Toggles: fire again to remove. Text is passed
   URI-encoded (apostrophes → %27) so any punctuation survives the inline
   onclick. */
const _qFav = (s) => encodeURIComponent(String(s == null ? '' : s)).replace(/'/g, '%27');
function _favsRead() { try { return JSON.parse(localStorage.getItem('ci_favorites') || '[]'); } catch (_) { return []; } }
function _isTaskFav(idx, code) { return _favsRead().some(f => f && f.type === 'task' && f.goal === idx && f.code === code); }
export function wrapFavTask(idx, code, encText) {
  let text = ''; try { text = decodeURIComponent(encText || ''); } catch (_) { text = encText || ''; }
  const favs = _favsRead();
  const at = favs.findIndex(f => f && f.type === 'task' && f.goal === idx && f.code === code);
  if (at >= 0) { favs.splice(at, 1); toast('Removed from favorites', 'info'); }
  else { favs.push({ type: 'task', goal: idx, code, title: text || code }); toast('Added to favorites ♥', 'success'); }
  try { localStorage.setItem('ci_favorites', JSON.stringify(favs)); } catch (_) {}
  if (typeof window !== 'undefined' && typeof window.renderFavorites === 'function') window.renderFavorites();
  renderWrapup();
}

/* Turn a raw AI/network error into a calm, human message. Quota/billing/rate
   or 5xx outages (the OpenAI account running dry, an overloaded model) read as
   "busy, try again" — not "failed". Returns '' for anything unrecognised so
   the caller can fall back to its own specific wording. */
function _aiErrMsg(e) {
  const m = ((e && e.message) || '').toLowerCase();
  if (/quota|billing|insufficient|rate.?limit|overloaded|\b429\b|\b50[0-9]\b/.test(m))
    return 'The AI is busy right now — give it a moment and try again.';
  if (/network|failed to fetch|load failed|timeout|timed out|offline/.test(m))
    return 'Connection hiccup — check your internet and try again.';
  return '';
}

// Which goal dropdowns are expanded in the wrap-up (survives re-renders).
const _openGoals = new Set();
let _didDefaultOpen = false;   // launch the Action Plan with the first goal already expanded
export function wrapupGoalToggle(idx, open) { if (open) _openGoals.add(idx); else _openGoals.delete(idx); }

// Whether the "MY TASK LIST" (everything-at-once) panel is expanded (survives re-renders).
let _taskListOpen = true;
export function wrapupTaskListToggle(open) { _taskListOpen = !!open; }

// Which goals have their proven-actions "Show N more" list expanded (survives re-renders).
const _aiMoreOpen = new Set();
export function wrapupAiMoreToggle(idx, open) { if (open) _aiMoreOpen.add(idx); else _aiMoreOpen.delete(idx); }

// Which goal is picked in the MY TASK LIST dropdown (survives re-renders).
let _taskGoalSel = null;
export function wrapupTaskGoalToggle(idx) {
  const panel = document.getElementById(`taskGoalPanel-${idx}`);
  if (!panel) return;
  const willOpen = panel.style.display === 'none';
  // Single-open accordion: close every goal, then open the tapped one.
  document.querySelectorAll('[id^="taskGoalPanel-"]').forEach(p => { p.style.display = 'none'; });
  document.querySelectorAll('[id^="taskGoalArr-"]').forEach(a => { a.style.transform = 'rotate(-90deg)'; });
  if (willOpen) {
    panel.style.display = 'block';
    const arr = document.getElementById(`taskGoalArr-${idx}`);
    if (arr) arr.style.transform = 'rotate(0deg)';
    _taskGoalSel = idx;
  } else {
    _taskGoalSel = null;
  }
}

// Per-goal view ("my" | "both" | "roadmap") for the tabs and + button above the goal box. Survives re-renders.
const _activeTab = new Map();
export function wrapTab(idx, which) {
  _activeTab.set(idx, which);
  ['my', 'both', 'roadmap'].forEach(t => {
    const p = document.getElementById(`wtab-panel-${t}-${idx}`);
    const b = document.getElementById(`wtab-${t}-${idx}`);
    if (p) p.style.display = (t === which) ? 'block' : 'none';
    if (b) {
      b.classList.toggle('wtab-active', t === which);
      b.setAttribute('aria-pressed', String(t === which));
    }
  });
}

/* Reorder a My-Actions task within its sibling list (up/down = prioritize your
   daily to-dos). Path is dot-joined indices, e.g. "1" or "1.2" for a sub-step. */
export function wrapMoveUserTask(idx, pStr, dir) {
  const it = intentions[idx]; if (!it || !it.roadmapAI) return;
  let list = Array.isArray(it.roadmapAI.userTasks) ? it.roadmapAI.userTasks : [];
  const path = String(pStr).split('.').map(Number);
  for (let k = 0; k < path.length - 1; k++) { const n = list[path[k]]; if (!n) return; list = n.children || []; }
  const i = path[path.length - 1], j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  saveIntentions(); renderWrapup();
}

/* Reorder a Roadmap task, carrying its done/lock state (both keyed by index)
   with it so a moved task keeps its checkmark and lock. */
export function wrapMoveRoadmapTask(idx, i, dir) {
  const it = intentions[idx]; if (!it || !it.roadmapAI) return;
  const rai = it.roadmapAI;
  const tasks = Array.isArray(rai.tasks) ? rai.tasks : [];
  const j = i + dir;
  if (j < 0 || j >= tasks.length) return;
  [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
  const swap = (o) => { if (!o) return; const a = o[i], b = o[j];
    if (b === undefined) delete o[i]; else o[i] = b;
    if (a === undefined) delete o[j]; else o[j] = a; };
  swap(rai.done); swap(rai.locks); swap(rai.codes);   // codes ride with the task (Phase 2b — stable codes)
  saveIntentions(); renderWrapup();
}

/* ▶ LEARN FROM THE GREATS — fetch a mixed shelf of real primary sources
   (videos, official sites, articles, podcasts). Pinned items are kept; a
   refresh only swaps the unpinned ones. Cached on the goal. */
export async function wrapGenResources(idx) {
  const it = intentions[idx];
  if (!it) return;
  const btn = document.getElementById(`wrapVidBtn-${idx}`);
  if (btn) { btn.disabled = true; btn.textContent = '▶ FINDING…'; }
  try {
    const userActions = (it.roadmapAI?.userTasks || []).map(u => u && u.text).filter(Boolean);
    const data = await window.ciApiJson('roadmap-videos', { intention: it.title || '', userActions });
    const fresh = (data && data.resources) || [];
    if (!it.roadmapAI) it.roadmapAI = { intention: it.title || '', tasks: [], userTasks: [] };
    const pinned = (it.roadmapAI.resources || []).filter(r => r && r.pinned);
    const pinnedUrls = new Set(pinned.map(r => r.url));
    it.roadmapAI.resources = [...pinned, ...fresh.filter(r => r && !pinnedUrls.has(r.url))].slice(0, 10);
    await saveIntentions();
    _activeTab.set(idx, 'roadmap');
    renderWrapup();
    if (!fresh.length && !pinned.length && typeof toast === 'function') toast('Nothing found — try again.', 'error');
  } catch (e) {
    if (typeof toast === 'function') toast(_aiErrMsg(e) || 'Couldn’t reach the source finder — try again.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '▶ FIND SOURCES'; }
  }
}

/* Pin/unpin a resource so a refresh keeps it. */
export function wrapPinResource(idx, i) {
  const arr = intentions[idx]?.roadmapAI?.resources;
  if (!arr || !arr[i]) return;
  arr[i].pinned = !arr[i].pinned;
  saveIntentions();
  renderWrapup();
}

/* ★ Favorite a "Learn from the Greats" resource (video/site/article/podcast) →
   a jump-to shortcut in the Favorites panel. Stored as type:'video' (external
   URL that opens in a new tab via openFavorite), keyed by its URL so it's one
   entry. Toggles: fire again to remove. */
function _isResFav(url) { return !!url && _favsRead().some(f => f && f.type === 'video' && f.target === url); }
export function wrapFavResource(idx, i) {
  const r = intentions[idx]?.roadmapAI?.resources?.[i];
  if (!r || !r.url) return;
  const favs = _favsRead();
  const at = favs.findIndex(f => f && f.type === 'video' && f.target === r.url);
  if (at >= 0) { favs.splice(at, 1); toast('Removed from favorites', 'info'); }
  else { favs.push({ type: 'video', target: r.url, title: r.title || r.url, subtitle: r.subtitle || '' }); toast('Added to favorites ♥', 'success'); }
  try { localStorage.setItem('ci_favorites', JSON.stringify(favs)); } catch (_) {}
  if (typeof window !== 'undefined' && typeof window.renderFavorites === 'function') window.renderFavorites();
  renderWrapup();
}

/* ↳ BREAK IT DOWN — expand a My-Action into deeper sub-steps (recursive).
   Sends the goal + breadcrumb path + this action; stores steps as children. */
export async function wrapDrillDown(idx, pStr, btn) {
  const it = intentions[idx];
  const rai = it && it.roadmapAI;
  if (!rai) return;
  const path = String(pStr).split('.').map(Number);
  const node = _taskAtPath(rai, path);
  if (!node) return;
  if (btn) { btn.disabled = true; btn.textContent = '…'; }
  try {
    const breadcrumb = [];
    let list = rai.userTasks || [];
    for (const p of path) { const n = list[p]; if (!n) break; breadcrumb.push(n.text); list = n.children || []; }
    const userNotes = (rai.userTasks || []).map(u => u && u.text).filter(Boolean);
    // Vite dev / preview mode has no Netlify functions, so the AI endpoint 404s.
    // Stub it on localhost so break-down is testable; production always calls the real endpoint.
    const _isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    const data = _isLocal
      ? { steps: [
          `Define exactly what "${node.text}" means in one sentence.`,
          `List the specific tool, person, or resource it needs.`,
          `Do the smallest first version and set a deadline.`,
          `Review the result and note the next step.`,
        ] }
      : await window.ciApiJson('roadmap-drilldown', { goal: it.title || '', action: node.text, breadcrumb, userNotes });
    const steps = (data && data.steps) || [];
    if (!steps.length) { if (typeof toast === 'function') toast('No sub-steps — try again.', 'error'); if (btn) { btn.disabled = false; btn.textContent = '↳'; } return; }
    node.children = steps.map(text => ({ id: Date.now() + Math.floor(Math.random() * 1e6), text, done: false }));
    await saveIntentions();
    renderWrapup();
  } catch (e) {
    if (typeof toast === 'function') toast(_aiErrMsg(e) || 'Couldn’t break this down — try again.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '↳'; }
  }
}

export function wrapSubToggle(idx, pStr) {
  const rai = intentions[idx]?.roadmapAI; if (!rai) return;
  const node = _taskAtPath(rai, String(pStr).split('.').map(Number));
  if (!node) return;
  node.done = !node.done;
  saveIntentions(); renderWrapup();
}

export function wrapSubDelete(idx, pStr) {
  const rai = intentions[idx]?.roadmapAI; if (!rai) return;
  const path = String(pStr).split('.').map(Number);
  const i = path.pop();
  const parentList = path.length ? (_taskAtPath(rai, path) || {}).children : rai.userTasks;
  if (parentList && parentList[i]) { parentList.splice(i, 1); saveIntentions(); renderWrapup(); }
}

/* Rebuild this goal's AI roadmap from its "My Actions", then flip to the
   Roadmap tab so the fresh tasks are visible. */
export async function wrapRegenRoadmap(idx) {
  const btn = document.getElementById(`wrapRegenBtn-${idx}`);
  if (btn) { btn.disabled = true; btn.textContent = '✦ BUILDING YOUR ROADMAP…'; }
  try {
    if (typeof window.generateRoadmapAI === 'function') await window.generateRoadmapAI(idx);
  } catch (e) { /* generateRoadmapAI surfaces its own error toast */ }
  _activeTab.set(idx, 'roadmap');   // reveal the freshly-built roadmap
  renderWrapup();
}

// Whether the EVENING WRAP-UP card is expanded (survives re-renders). Default open.
let _wrapupOpen = true;
export function wrapupCardToggle(open) { _wrapupOpen = !!open; }

// Dashboard "Today's story" visibility toggle (lives in the Big 3 card).
// Read LAZILY — NEVER at module load. wrapup.js and app.js import each other, so
// calling LS during module evaluation throws before LS is ready and white-screens
// the whole app. Hydrate on first use (runtime), which is always after boot.
let _storyOpen = null;
function _storyIsOpen() {
  if (_storyOpen === null) _storyOpen = (LS.get('ci_wrapup_story_open') !== false);
  return _storyOpen;
}
export function wrapupStoryToggle() {
  _storyOpen = !_storyIsOpen();
  LS.set('ci_wrapup_story_open', _storyOpen);
  renderWrapup();
}

// Free-standing "my actions" the user adds directly under the checklist header
// (not tied to any goal). Stored in ci_wrapup_actions as [{id,text,done}].
function _wrapActs()      { return LS.get('ci_wrapup_actions') || []; }
function _saveWrapActs(a) { LS.set('ci_wrapup_actions', a); }
export function wrapAddAction(input = document.getElementById('wrapActionInput')) {
  const text = (input?.value || '').trim(); if (!text) return;
  const a = _wrapActs(); a.unshift({ id: Date.now(), text: text.slice(0, 160), done: false });
  _saveWrapActs(a); if (input) input.value = ''; renderWrapup();
}
export function wrapToggleAction(id) {
  const a = _wrapActs(); const t = a.find(x => x.id === id); if (!t) return;
  t.done = !t.done; _saveWrapActs(a);
  // A completed action lands on the Wins Wall (→ momentum); unchecking removes it.
  // Idempotent via the 'wrapact-<id>' src key, so it stays consistent everywhere.
  setTaskWin('wrapact-' + id, `✓ ${t.text}`, t.done, {});
  renderWrapup();
}
export function wrapDeleteAction(id) {
  _saveWrapActs(_wrapActs().filter(x => x.id !== id)); renderWrapup();
}

/* Add a custom action to a specific goal FROM the "Today I Will" card.
   Writes to that goal's roadmapAI.userTasks (same store the Pegboard uses),
   then re-renders the wrap-up so it shows immediately. */
export function wrapGoalAddAction(idx, input = document.getElementById(`wrapGoalInput-${idx}`)) {
  const text = (input?.value || '').trim();
  if (!text) return;
  const it = intentions[idx];
  if (!it) return;
  if (!it.roadmapAI) it.roadmapAI = { intention: it.title || '', tasks: [], userTasks: [] };
  const r = it.roadmapAI;
  if (!Array.isArray(r.userTasks)) r.userTasks = [];
  if (r.userTasks.length >= 25) { toast('Max 25 of your own actions per goal.', 'error'); return; }
  r.userTasks.push({ id: Date.now(), text: text.slice(0, 160), done: false });
  input.value = "";
  saveIntentions();
  renderWrapup();
  // Re-focus the add box so you can keep typing actions in quick succession.
  const box = input.id ? document.getElementById(input.id) : input;
  if (box) box.focus();
}

/* Promote a custom action into a full GOAL on the Pegboard. Non-destructive:
   the action stays where it is; a new "I AM …" intention is created from its
   text (same shape/prefix rule as the Pegboard's own add-intention). */
export async function wrapPromoteToGoal(idx, id) {
  const t = intentions[idx]?.roadmapAI?.userTasks?.find(x => x.id === id);
  if (!t) return;
  let title = (t.text || '').trim().slice(0, 150);
  if (!title) return;
  if (!title.toLowerCase().startsWith('i am')) title = 'I AM ' + title;
  // unshift → the promoted goal lands at the TOP of the goals list (first position).
  intentions.unshift({
    id: crypto.randomUUID(), title,
    startDate: '', targetDate: '', category: '',
    words: { mission: '', affirmations: '', beliefs: '', quotes: '', insights: '' },
    mindset: null, achievers: null,
  });
  await saveIntentions();
  if (typeof renderPBIntentionList === 'function') renderPBIntentionList();   // refresh the Pegboard list if it's on screen
  renderWrapup();
  toast(`Added “${title}” as a goal in your Pegboard ✓`, 'success');
}

/* Find a My-Action node by its index path (e.g. [0,2] = userTasks[0].children[2]). */
function _taskAtPath(rai, path) {
  let list = (rai && rai.userTasks) || [];
  let node = null;
  for (const p of path) { node = list[p]; if (!node) return null; list = node.children || []; }
  return node;
}

/* ── STABLE CODES (Phase 2 = My Actions, Phase 2b = Roadmap) ─────────────────
   Give every task a permanent code number that never shifts on Move / Delete /
   Break-down. The number rides WITH the task: on the object (u.code) for My
   Actions, and in an index-keyed sidecar (rai.codes[i], carried on move/delete
   like rai.done/rai.locks) for roadmap tasks — since those are plain strings.
   Top-level My-Actions + roadmap tasks share one per-goal counter (D1, D2 …);
   sub-steps use a parent-local counter (D2.1, D2.2 …).

   Self-healing: the high-water mark is recomputed from the codes already on the
   data every run — NOT trusted from a persisted _codeSeq — because regenerate
   rebuilds roadmapAI ({...result, userTasks}) and drops _codeSeq while keeping
   coded userTasks. Recomputing prevents a fresh counter from re-issuing a code
   an existing task already owns. Idempotent; returns true if it assigned any. */
function _ensureCodes(it) {
  const rai = it && it.roadmapAI;
  if (!rai || !Array.isArray(rai.userTasks)) return false;
  let changed = false;
  // ── My Actions: their OWN sequence (D1, D2, D3 …) — Roadmap no longer bumps
  //    it, so the Nth action is always DN.
  // One-time re-base to a clean 1..N in current order: older shared-numbering
  // builds could bake a high code into a new action (the D13 bug). This rewrites
  // My-Action codes once, then they stay stable.
  if (!rai._myV2) {
    let n = 0;
    rai.userTasks.forEach(u => { u.code = ++n; });
    const reb = (node) => {
      const kids = Array.isArray(node.children) ? node.children : null;
      if (!kids || !kids.length) return;
      let c = 0; kids.forEach(k => { k.code = ++c; reb(k); }); node._childSeq = c;
    };
    rai.userTasks.forEach(reb);
    rai._codeSeq = n; rai._myV2 = true; changed = true;
  }
  let seq = 0;
  rai.userTasks.forEach(u => { if (typeof u.code === 'number' && u.code > seq) seq = u.code; });
  // Sub-steps: parent-local counter, likewise recomputed from existing children.
  const walk = (node) => {
    const kids = Array.isArray(node.children) ? node.children : null;
    if (!kids || !kids.length) return;
    let cs = (typeof node._childSeq === 'number') ? node._childSeq : 0;
    kids.forEach(c => { if (typeof c.code === 'number' && c.code > cs) cs = c.code; });
    kids.forEach(c => { if (typeof c.code !== 'number') { c.code = ++cs; changed = true; } walk(c); });
    node._childSeq = cs;
  };
  rai.userTasks.forEach(u => {
    if (typeof u.code !== 'number') { u.code = ++seq; changed = true; }
    walk(u);
  });
  rai._codeSeq = seq;
  // ── Roadmap: its OWN independent sequence (D1 … DN). One-time re-base: older
  //    builds numbered roadmap in the SHARED space (continuing after My Actions
  //    → D13 etc.); reset it to 1..N once so each list counts from 1.
  if (Array.isArray(rai.tasks) && rai.tasks.length) {
    if (!rai._rmV2) { rai.codes = {}; rai._rmSeq = 0; rai._rmV2 = true; changed = true; }
    if (!rai.codes) rai.codes = {};
    let rmSeq = (typeof rai._rmSeq === 'number') ? rai._rmSeq : 0;
    Object.keys(rai.codes).forEach(k => { const c = rai.codes[k]; if (typeof c === 'number' && c > rmSeq) rmSeq = c; });
    for (let i = 0; i < rai.tasks.length; i++) {
      if (typeof rai.codes[i] !== 'number') { rai.codes[i] = ++rmSeq; changed = true; }
    }
    rai._rmSeq = rmSeq;
  }
  return changed;
}

/* Render My Actions as a drillable TREE. "↳" breaks any action into deeper
   sub-steps (recursive). Top level keeps the win-logging toggle + promote;
   nested steps use lightweight path-based toggle/delete. codePrefix carries
   the parent card's STABLE code down the tree (e.g. "D2" → "D2.1"). */
function _renderUserTree(tasks, path, idx, codePrefix, showLinkedEntries = false, priorityOnly = false) {
  if (!Array.isArray(tasks) || !tasks.length) return '';
  const shade  = GREY_SHADES[idx % GREY_SHADES.length];   // goal color → rail + code chip
  const letter = _goalLetter(idx);
  const colorIndex = /^[A-Z]$/.test(letter) ? letter.charCodeAt(0) - 65 : idx;
  const goalRail = GOAL_COLORS[colorIndex % GOAL_COLORS.length]?.bg || '#000';
  return tasks.map((u, i) => {
    const p = [...path, i];
    const pStr = p.join('.');
    const depth = p.length - 1;
    const d = !!u.done;
    // Phase 2 — STABLE code: the number rides on the task (u.code), so Move/
    // Delete/Break-down never renumber it. Falls back to position pre-migration.
    const num  = (typeof u.code === 'number') ? u.code : (i + 1);
    const code = codePrefix ? `${codePrefix}.${num}` : `${letter}${num}`;
    const toggleCall = depth === 0 ? `toggleRoadmapUserTaskDone(${idx},${u.id})` : `wrapSubToggle(${idx},'${pStr}')`;
    const deleteCall = depth === 0 ? `deleteRoadmapUserTask(${idx},${u.id})`     : `wrapSubDelete(${idx},'${pStr}')`;
    const items = [
      i > 0                 ? _mItem(`wrapMoveUserTask(${idx},'${pStr}',-1)`, '▲', 'Move up') : '',
      i < tasks.length - 1  ? _mItem(`wrapMoveUserTask(${idx},'${pStr}',1)`,  '▼', 'Move down') : '',
      _mItem(`wrapDrillDown(${idx},'${pStr}',this)`, '↳', 'Break down'),
      depth === 0 ? _mItem(`wrapPromoteToGoal(${idx},${u.id})`, '◎', 'Make a goal') : '',
      _mItem(`wrapFavTask(${idx},'${code}','${_qFav(u.text)}')`, _isTaskFav(idx, code) ? '★' : '☆', _isTaskFav(idx, code) ? 'Unfavorite' : 'Favorite'),
      // ⋯ Delete only where the card has no black × (Scott 5 Nov 2026: no duplicate delete on To Do)
      showLinkedEntries ? '' : _mSep(),
      showLinkedEntries ? '' : _mItem(deleteCall, '✕', 'Delete', true),
    ].join('');
    const noteContext = taskNoteContext(intentions[idx], 'my', u.id ?? code, code, u.text);
    return (priorityOnly && (d || (priorityOnly === 'nonpriority' ? taskIsPriority(noteContext) : !taskIsPriority(noteContext))) ? '' : _card({ shade, code, text: u.text, done: d, toggleCall, items, indent: depth, fade: !showLinkedEntries && depth > 0, noteContext, showLinkedEntries, deleteCall, railColor: depth > 0 ? '#292929' : goalRail }))
         + _renderUserTree(u.children, p, idx, code, showLinkedEntries, priorityOnly);
  }).join('');
}

/* Count every node in a My-Actions tree — recursively, so AI drill-down
   sub-steps count toward the completed tally too. */
function _countTree(nodes) {
  let total = 0, done = 0;
  (nodes || []).forEach(n => {
    total++; if (n.done) done++;
    const c = _countTree(n.children);
    total += c.total; done += c.done;
  });
  return { total, done };
}

/* Nightly checklist: every goal's 10 "Today I Will" actions with their
   done status. Clicking a row toggles it (logs a win + momentum) via the
   same toggleRoadmapTaskDone wiring, which re-renders this wrap-up. */
function _roadmapCards(it, idx, showLinkedEntries = false, priorityOnly = false) {
    const rai = it.roadmapAI || {};
    const _raiTasksOK = !rai.intention || String(rai.intention).trim() === String(it.title || "").trim();
    const dones = rai.done || {};
    const shade = GREY_SHADES[idx % GREY_SHADES.length];
    const letter = _goalLetter(idx);
    const locks = rai.locks || {};
    return (_raiTasksOK ? (rai.tasks || []) : []).map((t, i, _arr) => {
      const d = !!dones[i]; const locked = !!locks[i];
      // Phase 2b — STABLE roadmap code from the sidecar map (rides on move/
      // delete); falls back to position pre-migration.
      const cnum = (rai.codes && typeof rai.codes[i] === 'number') ? rai.codes[i] : (i + 1);
      const code = letter + cnum;
      const items = [
        i > 0                ? _mItem(`wrapMoveRoadmapTask(${idx},${i},-1)`, '▲', 'Move up') : '',
        i < _arr.length - 1  ? _mItem(`wrapMoveRoadmapTask(${idx},${i},1)`,  '▼', 'Move down') : '',
        _mItem(`toggleRoadmapLock(${idx},${i})`, locked ? '🔒' : '🔓', locked ? 'Unlock' : 'Lock'),
        _mItem(`wrapFavTask(${idx},'${code}','${_qFav(t)}')`, _isTaskFav(idx, code) ? '★' : '☆', _isTaskFav(idx, code) ? 'Unfavorite' : 'Favorite'),
        showLinkedEntries ? '' : _mSep(),
        showLinkedEntries ? '' : _mItem(`deleteRoadmapTask(${idx},${i})`, '✕', 'Delete', true),
      ].join('');
      const noteContext = taskNoteContext(it, 'roadmap', JSON.stringify([cnum, t]), code, t);
      if(priorityOnly && (d || (priorityOnly === 'nonpriority' ? taskIsPriority(noteContext) : !taskIsPriority(noteContext)))) return '';
      return _card({ shade, code, text: t, done: d, toggleCall: `toggleRoadmapTaskDone(${idx},${i})`, items, variant: 'roadmap', noteContext, showLinkedEntries, deleteCall: `deleteRoadmapTask(${idx},${i})` });
    });
}

function _todayChecklist() {
  // Show EVERY real goal — even ones with no roadmap yet (e.g. a goal just
  // promoted from an action). Empty goals still get an add-action box so you
  // can start building them right here.
  const items = (intentions || [])
    .map((it, idx) => ({ it, idx }))
    .filter(o => o.it && (o.it.title || '').trim());
  if (!items.length) return null;
  // Launch with the first goal's My Actions tab already expanded (default tab is
  // 'my'), so the user immediately sees something actionable — not a wall of
  // identical collapsed bars. Only forced once; user toggles are respected after.
  if (!_didDefaultOpen && items[0]) {
    const params = new URLSearchParams(location.search);
    const selected = params.get('masterInline') === 'action-plan' && params.has('goal')
      ? Number(params.get('goal')) : -1;
    _openGoals.add(items.some(item => item.idx === selected) ? selected : items[0].idx);
    _didDefaultOpen = true;
  }
  let total = 0, done = 0, rows = '', fullRows = '';
  let allTaskCards = '';   // MY TASK LIST: every proven action across all goals, flattened into one list
  items.forEach(({ it, idx }) => {
    const shade = GREY_SHADES[idx % GREY_SHADES.length];   // same color as this goal's card in Column A
    const goalLetter = _goalLetter(idx);
    const colorIndex = /^[A-Z]$/.test(goalLetter) ? goalLetter.charCodeAt(0) - 65 : idx;
    const gc = GOAL_COLORS[colorIndex % GOAL_COLORS.length] || { bg: '#000', text: '#fff' };
    const rai = it.roadmapAI || {};                         // goal may have no roadmap yet
    // A roadmap belongs to ONE goal — it records the title it was built for.
    // If that doesn't match THIS goal, it's a stale/mismatched roadmap (belongs
    // to another goal): don't show its tasks here. Regenerating rebuilds it correctly.
    const _raiTasksOK = !rai.intention || String(rai.intention).trim() === String(it.title || '').trim();
    const uTasks = Array.isArray(rai.userTasks) ? rai.userTasks : [];
    // Each goal is a collapsible dropdown. When OPENED it reveals, in order:
    //   1) an "add your own action" box for THIS goal,
    //   2) the custom actions you've already added, then
    //   3) the goal's daily tracker (proven / AI) actions.

    // 1) Add-your-own-action box — scoped to this goal.
    const addBox = `<div style="display:flex;gap:6px;margin:2px 0 10px;">
      <input id="wrapGoalInput-${idx}" type="text" maxlength="160" placeholder="Add your own action…" onkeydown="if(event.key==='Enter')wrapGoalAddAction(${idx})"
        style="flex:1;min-width:0;background:var(--sunken);border:1px solid var(--border);border-radius:6px;padding:9px 11px;font-size:12px;color:var(--text);">
      <button onclick="wrapGoalAddAction(${idx})"
        style="flex-shrink:0;background:#8ba6a9;border:none;border-radius:6px;padding:9px 14px;font-family:var(--vault-mono);font-size:10px;font-weight:800;letter-spacing:0.5px;color:#0a0a0a;cursor:pointer;">+ ADD</button>
    </div>`;

    const letter = _goalLetter(idx);

    // 2) Your own custom actions — a drillable TREE ("↳" = break into deeper
    //    steps). Header count reflects the top-level actions.
    // Count EVERY checkable item: your actions recursively (incl. AI drill-down
    // sub-steps). The flat AI roadmap tasks are added below, where `dones` is known.
    const _uc = _countTree(uTasks); total += _uc.total; done += _uc.done;
    const userHtml = _renderUserTree(uTasks, [], idx);

    // Proven / AI "tracker" tasks — shown in the Roadmap tab / MY TASK LIST.
    // Their checkmarks NOW count toward the tally too (1a): every checkable
    // roadmap task increments total/done, same as your own actions.
    const dones = rai.done || {};
    if (_raiTasksOK) (rai.tasks || []).forEach((t, i) => { total++; if (dones[i]) done++; });
    const _aiRowArr = _roadmapCards(it, idx);
    // Show the first 5 proven actions; the rest live behind a "Show N more" dropdown.
    const hasAi     = _aiRowArr.length > 0;
    const aiHead    = _aiRowArr.slice(0, 5).join('');
    const aiTail    = _aiRowArr.slice(5).join('');
    const aiMoreCnt = _aiRowArr.length - 5;

    // GOAL BOX: two tabs hanging off the bottom — "My Actions" (your own) and
    // "Roadmap Tasks" (the AI actions). Clicking a tab shows that panel.
    const roadmapBox = hasAi
      ? `<div style="background:transparent;border:none;border-radius:8px;padding:0;">${aiHead}${aiTail ? `<details class="rm-drop" ${_aiMoreOpen.has(idx) ? 'open' : ''} ontoggle="wrapupAiMoreToggle(${idx},this.open)" style="margin-top:2px;">
          <summary style="display:flex;align-items:center;justify-content:center;gap:6px;padding:6px;cursor:pointer;font-family:var(--vault-mono);font-size:10px;font-weight:800;letter-spacing:0.5px;color:#1C2230;border-top:1px solid rgba(28,34,48,0.18);"><span>Show ${aiMoreCnt} more</span><span class="rm-caret">▾</span></summary>${aiTail}</details>` : ''}</div>`
      : `<div style="font-size:12px;color:#9a9a9a;padding:8px 2px;">No roadmap yet — open the MY ACTIONS tab and tap ✦ Regenerate Roadmap.</div>`;

    // ▶ LEARN FROM THE GREATS — a mixed shelf of primary sources (videos,
    // official sites, articles, podcasts). Pin ones you love; refresh swaps the rest.
    const res = Array.isArray(rai.resources) ? rai.resources : [];
    const _rIcon = { video: '🎬', source: '🌐', article: '📄', podcast: '🎧' };
    const resourcesBlock = `<div style="background:#8ba6a9;border:1px solid #6f8a8d;border-radius:8px;padding:7px 9px;margin-top:9px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:2px 2px 6px;">
        <span style="font-family:var(--vault-mono);font-size:10px;font-weight:800;letter-spacing:1px;color:#1C2230;">▶ LEARN FROM THE GREATS</span>
        <button id="wrapVidBtn-${idx}" onclick="wrapGenResources(${idx})" style="flex-shrink:0;background:#1C2230;border:none;border-radius:6px;padding:6px 10px;font-family:var(--vault-mono);font-size:9px;font-weight:800;letter-spacing:0.5px;color:#fff;cursor:pointer;">${res.length ? '↻ REFRESH' : '▶ FIND SOURCES'}</button>
      </div>
      ${res.length ? res.map((r, i) => `<div style="display:flex;gap:8px;align-items:center;padding:5px 2px;border-top:1px solid rgba(28,34,48,0.14);">
        ${r.type === 'video' && r.thumbnail ? `<img src="${esc(r.thumbnail)}" alt="" style="width:52px;height:30px;object-fit:cover;border-radius:4px;flex-shrink:0;">` : `<span style="width:30px;text-align:center;font-size:16px;flex-shrink:0;">${_rIcon[r.type] || '🔗'}</span>`}
        <a href="${esc(r.url)}" target="_blank" rel="noopener" style="flex:1;min-width:0;text-decoration:none;">
          <span style="display:block;font-size:11px;line-height:1.3;color:#12251f;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.title)}</span>
          <span style="display:block;font-size:9px;color:#3e4a4c;">${esc(r.subtitle || '')}</span>
        </a>
        <button onclick="wrapFavResource(${idx},${i})" title="${_isResFav(r.url) ? 'Unfavorite' : 'Favorite — save to your Favorites panel'}" style="flex-shrink:0;background:none;border:none;cursor:pointer;font-size:15px;line-height:1;opacity:${_isResFav(r.url) ? '1' : '0.4'};padding:2px 4px;color:#e0102b;">${_isResFav(r.url) ? '♥' : '♡'}</button>
        <button onclick="wrapPinResource(${idx},${i})" title="${r.pinned ? 'Unpin' : 'Pin — keep this on refresh'}" style="flex-shrink:0;background:none;border:none;cursor:pointer;font-size:14px;opacity:${r.pinned ? '1' : '0.35'};padding:2px 4px;">📌</button>
        <span style="flex-shrink:0;color:#e0102b;font-size:15px;">↗</span>
      </div>`).join('') : `<div style="font-size:11px;color:rgba(28,34,48,0.65);padding:2px;">Real videos, official sites, articles &amp; podcasts from people who've done this.</div>`}
    </div>`;

    const activeTab = _activeTab.get(idx) || 'my';   // which tab shows by default
    rows += `<div class="wgoal">

      <details class="rm-drop" ${_openGoals.has(idx) ? 'open' : ''} ontoggle="wrapupGoalToggle(${idx},this.open)" style="margin:0;">
      <summary style="position:relative;z-index:2;background:${shade.bg};color:${shade.text};border-radius:10px;padding:9px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px;cursor:pointer;font-family:var(--vault-mono);font-size:11pt;font-weight:400;letter-spacing:0.5px;">
        <span style="display:inline-flex;align-items:center;gap:8px;flex:1;min-width:0;">${goalBadge(letter, gc.bg, gc.text, 24)}<span style="min-width:0;">${esc(goalCase(it.title))}</span></span><span class="rm-caret2" style="flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#000;color:#fff;font-size:10px;line-height:1;">▶</span>
      </summary>
      <div class="roadmap-goal-body" style="padding:10px 2px 4px;">
        <section class="roadmap-goal-section roadmap-goal-todo" data-goal-section="todo">
          <h3>TO DO</h3>
      <div class="wtabs">
        <button id="wtab-my-${idx}" class="wtab${activeTab === 'my' ? ' wtab-active' : ''}" style="background:${gc.bg};color:${gc.text};" aria-pressed="${activeTab === 'my'}" onclick="wrapTab(${idx},'my')">MY ACTIONS${uTasks.length ? ` ${uTasks.length}` : ''}</button>
        <button id="wtab-both-${idx}" class="wtab-combine${activeTab === 'both' ? ' wtab-active' : ''}" onclick="wrapTab(${idx},'both')" title="Show My Actions and Roadmap together" aria-label="Show My Actions and Roadmap together" aria-pressed="${activeTab === 'both'}">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button id="wtab-roadmap-${idx}" class="wtab${activeTab === 'roadmap' ? ' wtab-active' : ''}" style="background:${ROADMAP_COLOR};color:#fff;" aria-pressed="${activeTab === 'roadmap'}" onclick="wrapTab(${idx},'roadmap')">ROADMAP${hasAi ? ` ${_aiRowArr.length}` : ''}</button>
      </div>
        <div id="wtab-panel-my-${idx}" style="display:${activeTab === 'my' ? 'block' : 'none'};">${userHtml}${addBox}<button id="wrapRegenBtn-${idx}" onclick="wrapRegenRoadmap(${idx})" style="width:100%;margin-top:2px;background:rgba(139,166,169,0.14);border:1px solid #8ba6a9;border-radius:6px;padding:10px 12px;font-family:var(--vault-mono);font-size:10px;font-weight:800;letter-spacing:0.5px;color:#8ba6a9;cursor:pointer;">✦ REGENERATE ROADMAP FROM MY ACTIONS</button></div>
        <div id="wtab-panel-both-${idx}" style="display:${activeTab === 'both' ? 'block' : 'none'};">
          <div style="font-family:var(--vault-mono);font-size:9.5px;font-weight:800;letter-spacing:1.5px;color:${gc.text};background:${gc.bg};border-radius:5px;padding:5px 10px;margin:2px 0 10px;">◆ MY ACTIONS</div>
          ${userHtml || '<div style="font-size:12px;color:#9a9a9a;padding:2px 2px 10px;">No custom actions yet — add some on the My Actions tab.</div>'}
          <div style="font-family:var(--vault-mono);font-size:9.5px;font-weight:800;letter-spacing:1.5px;color:#fff;background:${ROADMAP_COLOR};border:1px solid ${ROADMAP_COLOR};border-radius:5px;padding:5px 10px;margin:16px 0 10px;">◇ ROADMAP</div>
          ${roadmapBox}
        </div>
        <div id="wtab-panel-roadmap-${idx}" style="display:${activeTab === 'roadmap' ? 'block' : 'none'};">${roadmapBox}${resourcesBlock}</div>
        </section>
        ${typeof window.roadmapGoalEntriesHTML === 'function' ? window.roadmapGoalEntriesHTML(it.id) : ''}
      </div>
      </details>
    </div>`;

    // MY TASK LIST — group each goal's tasks under its OWN collapsible bar
    // (single-open accordion via wrapupTaskGoalToggle). Tap a goal to reveal
    // that goal's task cards.
    if (hasAi) {
      const gOpen = _taskGoalSel === idx;
      allTaskCards += `<div style="margin-bottom:10px;">
        <button onclick="wrapupTaskGoalToggle(${idx})" style="width:100%;display:flex;align-items:center;gap:10px;background:${shade.bg};color:${shade.text};border:none;border-radius:10px;padding:11px 14px;cursor:pointer;font-family:var(--vault-mono);font-weight:400;font-size:11pt;letter-spacing:.5px;text-align:left;">
          ${goalBadge(letter, gc.bg, gc.text, 24)}
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(goalCase(it.title))}</span>
          <span style="flex-shrink:0;font-family:var(--vault-mono);font-size:10px;opacity:.85;">${_aiRowArr.length}</span>
          <span id="taskGoalArr-${idx}" style="flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#000;color:#fff;font-size:10px;transition:transform .2s;transform:rotate(${gOpen ? '0' : '-90'}deg);">▾</span>
        </button>
        <div id="taskGoalPanel-${idx}" style="display:${gOpen ? 'block' : 'none'};padding-top:8px;">${_aiRowArr.join('')}</div>
      </div>`;
    }
  });

  // MY TASK LIST — each goal in its own collapsible bar (see the per-goal build
  // in the loop above); tasks still show their goal-colour rail + code.
  fullRows = allTaskCards;
  return { rows, total, done, fullRows };
}

// Both pages render the same task cards and call the same save/toggle handlers.
function findPriorityNode(nodes, id) {
  for (const node of nodes || []) {
    if (String(node.id) === String(id)) return node;
    const child = findPriorityNode(node.children, id); if (child) return child;
  }
  return null;
}
function taskIsPriority(context) {
  const rai = intentions.find(g => String(g.id) === context.goalId)?.roadmapAI;
  return context.kind === 'my' ? !!findPriorityNode(rai?.userTasks, context.taskId)?.priority
    : !!rai?.priorityTasks?.[taskNoteKey(context)];
}
export function wrapTogglePriority(encodedKey) {
  let key, parts;
  try { key = decodeURIComponent(encodedKey); parts = JSON.parse(key); } catch (_) { return; }
  const goal = intentions.find(g => String(g.id) === parts[0]);
  if (!goal?.roadmapAI) return;
  if (parts[1] === 'my') {
    const node = findPriorityNode(goal.roadmapAI.userTasks, parts[2]);
    if (!node) return; node.priority = !node.priority;
  } else if (parts[1] === 'roadmap') {
    goal.roadmapAI.priorityTasks ||= {};
    if (goal.roadmapAI.priorityTasks[key]) delete goal.roadmapAI.priorityTasks[key];
    else goal.roadmapAI.priorityTasks[key] = true;
  } else return;
  saveIntentions(); renderWrapup();
}

/* Goal trough button 6 (Scott, 5 Nov 2026): mark every task of a goal as priority, or clear them all. */
export function wrapSetGoalPriority(idx) {
  const goal = intentions[idx];
  if (!goal) return false;
  if (!goal.roadmapAI) goal.roadmapAI = { intention: goal.title || '', tasks: [], userTasks: [] };
  const ctxs = goalWorkspaceTaskContexts(idx);
  if (!ctxs.length) return false;
  const turnOn = !ctxs.every(c => taskIsPriority(c));
  for (const c of ctxs) {
    if (!!taskIsPriority(c) === turnOn) continue;
    const key = taskNoteKey(c), parts = JSON.parse(key);
    if (parts[1] === 'my') { const node = findPriorityNode(goal.roadmapAI.userTasks, parts[2]); if (node) node.priority = turnOn; }
    else if (parts[1] === 'roadmap') { goal.roadmapAI.priorityTasks ||= {}; if (turnOn) goal.roadmapAI.priorityTasks[key] = true; else delete goal.roadmapAI.priorityTasks[key]; }
  }
  saveIntentions(); renderWrapup();
  return turnOn;
}

export function masterPriorityTaskMarkup(priority = true) {
  const filter = priority ? true : 'nonpriority';
  return intentions.map((goal, idx) => {
    _ensureGoalLetters();
    if (_ensureCodes(goal)) saveIntentions();
    const rows = _renderUserTree(goal.roadmapAI?.userTasks, [], idx, undefined, true, filter)
      + _roadmapCards(goal, idx, true, filter).join('');
    const shade = GREY_SHADES[idx % GREY_SHADES.length];
    const letter = _goalLetter(idx), colorIndex = /^[A-Z]$/.test(letter) ? letter.charCodeAt(0) - 65 : idx;
    const color = GOAL_COLORS[colorIndex % GOAL_COLORS.length];
    return rows ? `<section data-workspace-goal="${esc(goal.id)}"><h3 class="goal-workspace-goal-title" style="font-size:16px;color:${color.text};background:${color.bg};border:2px solid ${color.bg};border-radius:10px;padding:12px 16px;text-align:left;width:fit-content;max-width:min(100%,max(55%,280px));box-sizing:border-box;margin-right:auto;white-space:normal;word-break:normal;overflow-wrap:break-word;text-wrap:balance">${esc(goal.title || 'Untitled goal')}</h3>${rows}</section>` : '';
  }).join('');
}

export function goalWorkspaceTaskMarkup(idx) {
  const it = intentions[idx];
  if (!it) return { my: '', roadmap: '', done: 0, total: 0 };
  _ensureGoalLetters();
  if (_ensureCodes(it)) saveIntentions();
  const rai = it.roadmapAI || {};
  const userTasks = Array.isArray(rai.userTasks) ? rai.userTasks : [];
  const counts = _countTree(userTasks);
  const roadmap = _roadmapCards(it, idx, true);
  return { my: _renderUserTree(userTasks, [], idx, undefined, true), roadmap: roadmap.join(''),
    total: counts.total + roadmap.length,
    done: counts.done + roadmap.reduce((n, _row, i) => n + (rai.done?.[i] ? 1 : 0), 0) };
}

export function goalWorkspaceTaskContexts(idx) {
  const goal = intentions[idx];
  if (!goal) return [];
  _ensureGoalLetters();
  if (_ensureCodes(goal)) saveIntentions();
  const rai = goal.roadmapAI || {};
  const letter = _goalLetter(idx);
  const contexts = [];
  const walk = (tasks, prefix = '') => (tasks || []).forEach((task, i) => {
    const num = typeof task.code === 'number' ? task.code : i + 1;
    const code = prefix ? `${prefix}.${num}` : `${letter}${num}`;
    contexts.push(taskNoteContext(goal, 'my', task.id ?? code, code, task.text));
    walk(task.children, code);
  });
  walk(rai.userTasks);
  if (!rai.intention || String(rai.intention).trim() === String(goal.title || '').trim()) {
    (rai.tasks || []).forEach((text, i) => {
      const num = typeof rai.codes?.[i] === 'number' ? rai.codes[i] : i + 1;
      contexts.push(taskNoteContext(goal, 'roadmap', JSON.stringify([num, text]), letter + num, text));
    });
  }
  return contexts;
}

/* Join labels into natural prose: "Review and Visualize",
   "Review, Visualize and Meditate". */
function _list(arr) {
  if (!arr.length) return '';
  if (arr.length === 1) return arr[0];
  return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
}

function _streakPhrase(streak) {
  if (streak <= 0) return '';
  return ` You're ${streak} day${streak === 1 ? '' : 's'} into your streak.`;
}

function _winPhrase(n) {
  if (n <= 0) return '';
  return ` You also logged ${n} win${n === 1 ? '' : 's'} — that momentum counts.`;
}

function _dailyStory(s, winsToday) {
  if (s.perfect) {
    return `You closed all three pillars today — a Perfect Day. That keeps your ${s.streak}-day streak alive and pushes momentum to ${s.score}.${_winPhrase(winsToday)} This is exactly how it compounds.`;
  }
  if (s.count === 0) {
    return `The day's still open. Close your three pillars — Review, Visualize and Meditate — to keep things moving.${_streakPhrase(s.streak)}${_winPhrase(winsToday)}`;
  }
  const closed = _list(s.closed);
  const open   = _list(s.open);
  const it     = s.open.length === 1 ? 'it' : 'them';
  return `So far today you've handled ${closed} — ${open} still to go. Close ${it} for a Perfect Day.${_streakPhrase(s.streak)}${_winPhrase(winsToday)}`;
}

function _weeklyStory(w, winsWeek) {
  const trend =
    w.perfectDays >= 4 ? 'You’re on a roll.' :
    w.perfectDays >= 1 ? 'Building nicely — keep stacking them.' :
    'A fresh week to stack some wins.';
  const winsBit = winsWeek > 0 ? ` ${winsWeek} win${winsWeek === 1 ? '' : 's'} logged.` : '';
  return `This week: ${w.perfectDays} Perfect Day${w.perfectDays === 1 ? '' : 's'} and ${w.pillarsClosed} pillar${w.pillarsClosed === 1 ? '' : 's'} closed in all.${winsBit} ${trend}`;
}

/* Win counts straight from the store (no import cycle with wins.js). */
function _winCounts() {
  const wins = LS.get('ci_wins') || [];
  const today = dayKey();
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
  const weekKey = dayKey(weekAgo);
  return {
    today: wins.filter(w => w.date === today).length,
    week:  wins.filter(w => w.date >= weekKey).length,
  };
}

function _aiKey() { return `ci_wrapup_ai_${dayKey()}`; }
/* Guard: a failed AI call can return a raw provider error (e.g. OpenAI
   "insufficient_quota"). Never store or display that as the story. */
function _looksLikeAiError(s) {
  return typeof s === 'string' && /"error"|insufficient_quota|exceeded your current quota|billing details/i.test(s);
}

/* Build a compact plain-text data summary for the AI passes. */
function _aiSummary() {
  const s = ringsSummary();
  const wk = ringsWeekSummary();
  const { tier, total } = currentTier();
  const w = _winCounts();
  const recent = (LS.get('ci_wins') || []).slice(0, 3).map(x => x.text);
  return {
    summary: [
      `Pillars today: ${s.closed.length ? s.closed.join(', ') : 'none yet'} closed (${s.count}/3)${s.perfect ? ' — a Perfect Day' : ''}.`,
      `Streak: ${s.streak} day(s). Momentum: ${s.score}/100. Rank: ${tier.name} (${total} lifetime Perfect Days).`,
      `This week: ${wk.perfectDays} Perfect Day(s), ${wk.pillarsClosed} pillars closed, ${w.week} win(s) logged.`,
    ].join(' '),
    recentWins: recent,
  };
}

/* AI personalization — runs automatically ONCE per day, cached to control cost.
   No user-facing refresh: the recap is written for them, not regenerated on demand.
   If the AI is unavailable it silently leaves the standard recap in place. */
let _aiAutoKey = null;               // the _aiKey() we've already auto-attempted this session
export async function wrapupPersonalize() {
  try {
    const { summary, recentWins } = _aiSummary();
    const context = typeof buildContext === 'function' ? buildContext(getPB() || {}) : '';
    const name = (typeof getPB === 'function' && getPB()['pb-name']) || 'there';
    const data = await window.ciApiJson('wrapup-ai', { name, summary, context, recentWins });
    if (data && data.paragraph && !_looksLikeAiError(data.paragraph)) {
      LS.set(_aiKey(), data.paragraph);
      renderWrapup();
    }
    // otherwise: keep the standard recap, no nagging
  } catch (e) {
    console.warn('wrap-up personalize failed — using standard recap:', e && e.message);
  }
}

/* ✦ WRITE MY STORY — manual, on-demand version of wrapupPersonalize().
   Same data + multi-pass AI, but user-triggered with a loading state and a
   real error toast (the auto version fails silently). Re-rolls the recap each
   press, overwriting today's cached paragraph. */
export async function wrapupRegenerate(btn) {
  const b0 = btn || document.getElementById('wrapupRegenBtn');
  if (b0) { b0.disabled = true; b0.textContent = '↻ WRITING…'; }
  try {
    const { summary, recentWins } = _aiSummary();
    const context = typeof buildContext === 'function' ? buildContext(getPB() || {}) : '';
    const name = (typeof getPB === 'function' && getPB()['pb-name']) || 'there';
    const data = await window.ciApiJson('wrapup-ai', { name, summary, context, recentWins });
    if (data && data.paragraph && !_looksLikeAiError(data.paragraph)) {
      LS.set(_aiKey(), data.paragraph);
      renderWrapup();   // rebuilds the card with the fresh paragraph (and a fresh button)
      return;
    }
    toast('The AI is busy right now — give it a moment and try again.', 'error');
  } catch (e) {
    toast(_aiErrMsg(e) || 'Couldn’t write your recap — try again.', 'error');
  }
  const b = document.getElementById('wrapupRegenBtn');
  if (b) { b.disabled = false; b.textContent = '↻ REWRITE'; }
}

export function renderWrapup() {
  window.captureRoadmapGoalDrafts?.();
  if (typeof window.renderGoalWorkspaceTasks === "function") window.renderGoalWorkspaceTasks();
  const el = document.getElementById('wrapupWidget');
  if (!el) return;

  const w = _winCounts();
  let aiPara = LS.get(_aiKey());
  if (_looksLikeAiError(aiPara)) { LS.remove(_aiKey()); aiPara = null; }   // drop a cached API error, fall back to the standard recap
  // No cached recap yet for today → generate it for them automatically (once per
  // day per session). Fires and re-renders when it lands; falls back silently.
  // The member dashboard exists in the landing-page DOM even while signed out.
  // Do not spend quota or emit an auth warning until a real member is present.
  if (currentUser && !aiPara && _aiAutoKey !== _aiKey()) {
    _aiAutoKey = _aiKey();
    wrapupPersonalize();
  }
  // The day's story (AI-personalized once written; templated fallback before then).
  // The AI version already weaves the week in, so no separate weekly line here.
  const daily = aiPara ? esc(aiPara) : _dailyStory(ringsSummary(), w.today);
  // Stable goal letters (locked per goal id) — assign before any code renders.
  _ensureGoalLetters();
  // Phase 2 — make sure every My-Action has its stable code before we render;
  // persist once if we just assigned any (idempotent, so this fires rarely).
  let _codesAssigned = false;
  (intentions || []).forEach(it => { if (_ensureCodes(it)) _codesAssigned = true; });
  if (_codesAssigned) saveIntentions();
  const chk    = _todayChecklist();

  // TODAY I WILL — its own card, placed between the Morning & Day run-through cards.
  // The "add your own action" box now lives INSIDE each goal dropdown (see _todayChecklist),
  // so it only appears once you open a goal — not floating at the top.
  const todayEl = document.getElementById('todayWillWidget');
  if (todayEl) {
    todayEl.innerHTML = chk ? `
      <div style="padding:0;margin-bottom:8px;">
        <details class="rm-drop" open>
          <summary style="display:none;">
            <span style="font-size:10pt;font-weight:800;line-height:1.15;">YOUR STEPS</span>
            <span style="flex-shrink:0;display:flex;align-items:center;gap:8px;">
              <span style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:#000;border:1px solid rgba(255,255,255,0.55);display:inline-flex;align-items:center;justify-content:center;font-family:var(--vault-mono);font-weight:800;font-size:11px;letter-spacing:.5px;color:${chk.total && chk.done === chk.total ? DONE : '#fff'};white-space:nowrap;">${chk.done}/${chk.total}</span>
              <span class="rm-caret" style="display:inline-block;color:#fff;">▾</span>
            </span>
          </summary>
          <div style="padding:6px 0 0;margin-top:8px;">
            <div style="display:flex;flex-direction:column;gap:12px;">${chk.rows}</div>
          </div>
        </details>
      </div>` : '';
    // Feed the My Roadmap monitor chips with the real Action Plan counts.
    if (chk) {
      const _rs = document.getElementById('rmStepCount'); if (_rs) _rs.textContent = chk.total;
      const _rd = document.getElementById('rmDoneCount'); if (_rd) _rd.textContent = chk.done;
      const _rc = document.getElementById('rmStepsCircle'); if (_rc) _rc.textContent = chk.done + '/' + chk.total;
      const _rl = document.getElementById('rmLeftCount'); if (_rl) _rl.textContent = Math.max(0, chk.total - chk.done);
    }
    // Fill any [data-block] admin boxes just rendered into the goal cards.
    if (typeof window !== 'undefined' && window.injectContentBlocks) window.injectContentBlocks();
  }

  // MY TASK LIST — everything at once. Moved OFF the Action Plan (roadmap page)
  // onto the dashboard, between the 3 Pillars and the Morning Run Through.
  const taskListEl = document.getElementById('taskListWidget');
  if (taskListEl) {
    taskListEl.innerHTML = (chk && chk.fullRows) ? `
      <div style="margin-bottom:12px;">
        <details class="rm-drop" ${_taskListOpen ? 'open' : ''} ontoggle="wrapupTaskListToggle(this.open)">
          <summary style="display:flex;align-items:center;gap:14px;padding:9px 16px;background:var(--ink,#111);color:#fff;border-radius:6px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.18);line-height:1;">
            <span style="flex-shrink:0;line-height:0;"><svg width="18" height="18" viewBox="0 0 64 64" fill="currentColor"><path d="M57.3638,25.8994c0,0,3.9517-7.0232-1.0266-8.9007c-4.9778-1.8776-10.6816,9.374-10.6816,9.374s-4.5-0.8711-7.8044-0.6693c-2.6404,0.1616-7.4351,0.2857-6.8716,5.3135l-7.0715,1.5822c-0.241-1.0858,0.3589-2.043,1.4001-2.3601l3.1392-0.981c-0.6309-2.8903-2.2117-5.0723-4.1306-5.278c-2.6692-0.2861-4.9714,3.3087-4.939,8.0306c0.0327,4.7212,2.3835,8.2842,5.0491,7.9614c1.9829-0.2401,3.5745-2.5919,4.1157-5.6406l3.0879-0.4242c-0.4485,6.9872-3.4888,13.0157-7.6606,14.0447c-5.2856,1.3044-10.2678-5.7123-10.3379-15.902C13.5615,21.861,18.447,14.7759,23.75,16.0073c3.2314,0.7501,5.8296,4.4891,7.0969,9.3668c1.1057-0.9022,2.467-1.356,3.7678-1.5991c-1.707-7.6962-5.6868-14.0198-10.8982-15.7642c-8.6936-2.9095-17.3977,7.546-17.2839,24.0887s8.9609,26.8776,17.6135,23.8487c5.9927-2.0977,10.2561-10.2845,11.2556-19.594c1.6926,0.0295,3.5103-0.8217,4.7942-1.3865c3.0303-1.3336,6.6418-4.1288,6.6418-4.1288s10.2219,7.3921,13.7886,3.4439C64.0923,30.3339,57.3638,25.8994,57.3638,25.8994z"/></svg></span>
            <span style="flex:1;min-width:0;font-weight:400;font-size:16px;letter-spacing:.3px;">Task List</span>
            <span class="rm-caret" style="flex-shrink:0;font-size:15px;opacity:.8;">▾</span>
          </summary>
          <div style="padding-top:10px;">${chk.fullRows}</div>
        </details>
      </div>` : '';
  }

  // Minimal treatment inside The Big 3 card (the #wrapupWidget slot rings.js
  // renders above the pillars): the day's story as indented text + a show/hide
  // toggle switch. ↻ REWRITE keeps on-demand regenerate without a big button.
  const _open = _storyIsOpen();
  el.innerHTML = `
    <div style="margin:2px 0 12px;padding-top:12px;border-top:1px solid var(--widget-border,#2a2a2a);">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 0 6px;">
        <span style="font-family:var(--vault-mono);font-size:9px;font-weight:800;letter-spacing:1px;color:var(--muted,#9a9a9a);">&#10022; TODAY'S STORY</span>
        <button onclick="wrapupStoryToggle()" role="switch" aria-checked="${_open ? 'true' : 'false'}" title="Show or hide today's story"
          style="flex-shrink:0;width:38px;height:22px;border-radius:11px;border:none;cursor:pointer;padding:2px;background:${_open ? '#E8743B' : '#c9ccd1'};display:inline-flex;align-items:center;transition:background .2s;">
          <span style="display:block;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.3);transform:translateX(${_open ? '16px' : '0'});transition:transform .2s;"></span>
        </button>
      </div>
      ${_open ? `<div style="padding-left:12px;border-left:2px solid var(--widget-border,#2a2a2a);">
        <p style="color:var(--widget-text);margin:0;">${daily}</p>
        <button id="wrapupRegenBtn" onclick="wrapupRegenerate(this)" style="margin-top:8px;background:none;border:none;padding:0;cursor:pointer;font-family:var(--vault-mono);font-size:9px;font-weight:800;letter-spacing:.5px;color:#E8743B;">&#8635; REWRITE</button>
      </div>` : ''}
    </div>`;
}

// Let card-builder re-render the wrap-up after a lock/delete (avoids an import cycle).
if (typeof window !== 'undefined') {
  window.renderWrapup = renderWrapup;
  window.wrapGoalAddAction = wrapGoalAddAction;      // inline onclick in the Today-I-Will goal boxes
  window.wrapupTaskListToggle = wrapupTaskListToggle; // inline ontoggle on the MY TASK LIST panel
  window.wrapupTaskGoalToggle = wrapupTaskGoalToggle; // inline onclick on each MY TASK LIST goal bar
  window.wrapPromoteToGoal = wrapPromoteToGoal;      // inline onclick: promote an action to a Pegboard goal
  window.wrapupAiMoreToggle = wrapupAiMoreToggle;    // inline ontoggle on the proven-actions "Show N more"
  window.wrapTab = wrapTab;   // switch a goal's My Actions / Both / Roadmap Tasks tab
  window.wrapMoveUserTask = wrapMoveUserTask;       // reorder a My-Action up/down
  window.wrapMoveRoadmapTask = wrapMoveRoadmapTask; // reorder a Roadmap task up/down
  window.wrapRegenRoadmap = wrapRegenRoadmap; // rebuild a goal's roadmap from its My Actions
  window.wrapGenResources = wrapGenResources; // fetch the mixed resource shelf for a goal
  window.wrapPinResource = wrapPinResource;   // pin/unpin a resource (kept on refresh)
  window.wrapFavResource = wrapFavResource;   // ♥ favorite a resource → Favorites panel shortcut
  window.wrapDrillDown = wrapDrillDown;       // break a My-Action into deeper sub-steps
  window.wrapTogglePriority = wrapTogglePriority;
  window.wrapSubToggle = wrapSubToggle;       // toggle a nested sub-step done
  window.wrapSubDelete = wrapSubDelete;       // delete a nested sub-step
  window.wrapCardMenu = wrapCardMenu;         // open/close a card's ⋯ overflow menu
  window.wrapCopyCode = wrapCopyCode;         // copy a task's journal code (e.g. "C2.1")
  window.wrapFavTask = wrapFavTask;           // ★ favorite/unfavorite a task → Favorites panel shortcut
  window.wrapupCardToggle = wrapupCardToggle;        // inline ontoggle on the EVENING WRAP-UP card
  window.wrapupRegenerate = wrapupRegenerate;        // ↻ REWRITE — on-demand AI recap
  window.wrapupStoryToggle = wrapupStoryToggle;      // show/hide the "Today's story" text in the Big 3 card
}
