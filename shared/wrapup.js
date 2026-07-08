import { ringsSummary, ringsWeekSummary, currentTier } from './rings.js';
import { RM_CIRCLE, LOCK_OPEN, LOCK_CLOSED, renderPBIntentionList } from './card-builder.js';
import { LS, esc, toast, buildContext, getPB, intentions, GREY_SHADES, saveIntentions } from '../app.js';
/* ── EVENING WRAP-UP ─────────────────────────────────────
   Phase 1: a STORY recap (daily + weekly), not a dashboard.
   "Here's what you did today / here's your week."
   Templated for now — the multi-pass AI personalization is a
   held future thought (see project_wrapup_tracking_vision).
───────────────────────────────────────────────────────── */

const BRAND = '#F5A623';
const DONE  = '#4ADE80';

// Which goal dropdowns are expanded in the wrap-up (survives re-renders).
const _openGoals = new Set();
export function wrapupGoalToggle(idx, open) { if (open) _openGoals.add(idx); else _openGoals.delete(idx); }

// Whether the "MY TASK LIST" (everything-at-once) panel is expanded (survives re-renders).
let _taskListOpen = false;
export function wrapupTaskListToggle(open) { _taskListOpen = !!open; }

// Which goals have their proven-actions "Show N more" list expanded (survives re-renders).
const _aiMoreOpen = new Set();
export function wrapupAiMoreToggle(idx, open) { if (open) _aiMoreOpen.add(idx); else _aiMoreOpen.delete(idx); }

// Per-goal active tab ("my" | "roadmap") for the two tabs hanging off the goal box. Survives re-renders.
const _activeTab = new Map();
export function wrapTab(idx, which) {
  _activeTab.set(idx, which);
  ['my', 'roadmap'].forEach(t => {
    const p = document.getElementById(`wtab-panel-${t}-${idx}`);
    const b = document.getElementById(`wtab-${t}-${idx}`);
    if (p) p.style.display = (t === which) ? 'block' : 'none';
    if (b) b.classList.toggle('wtab-active', t === which);
  });
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
    if (typeof toast === 'function') toast('Source search failed.', 'error');
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
    const data = await window.ciApiJson('roadmap-drilldown', { goal: it.title || '', action: node.text, breadcrumb, userNotes });
    const steps = (data && data.steps) || [];
    if (!steps.length) { if (typeof toast === 'function') toast('No sub-steps — try again.', 'error'); if (btn) { btn.disabled = false; btn.textContent = '↳'; } return; }
    node.children = steps.map(text => ({ id: Date.now() + Math.floor(Math.random() * 1e6), text, done: false }));
    await saveIntentions();
    renderWrapup();
  } catch (e) {
    if (typeof toast === 'function') toast('Break-down failed.', 'error');
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

// Free-standing "my actions" the user adds directly under the checklist header
// (not tied to any goal). Stored in ci_wrapup_actions as [{id,text,done}].
function _wrapActs()      { return LS.get('ci_wrapup_actions') || []; }
function _saveWrapActs(a) { LS.set('ci_wrapup_actions', a); }
export function wrapAddAction() {
  const input = document.getElementById('wrapActionInput');
  const text = (input?.value || '').trim(); if (!text) return;
  const a = _wrapActs(); a.unshift({ id: Date.now(), text: text.slice(0, 160), done: false });
  _saveWrapActs(a); if (input) input.value = ''; renderWrapup();
}
export function wrapToggleAction(id) {
  const a = _wrapActs(); const t = a.find(x => x.id === id); if (!t) return;
  t.done = !t.done; _saveWrapActs(a); renderWrapup();
}
export function wrapDeleteAction(id) {
  _saveWrapActs(_wrapActs().filter(x => x.id !== id)); renderWrapup();
}

/* Add a custom action to a specific goal FROM the "Today I Will" card.
   Writes to that goal's roadmapAI.userTasks (same store the Pegboard uses),
   then re-renders the wrap-up so it shows immediately. */
export function wrapGoalAddAction(idx) {
  const input = document.getElementById(`wrapGoalInput-${idx}`);
  const text = (input?.value || '').trim();
  if (!text) return;
  const it = intentions[idx];
  if (!it) return;
  if (!it.roadmapAI) it.roadmapAI = { intention: it.title || '', tasks: [], userTasks: [] };
  const r = it.roadmapAI;
  if (!Array.isArray(r.userTasks)) r.userTasks = [];
  if (r.userTasks.length >= 25) { toast('Max 25 of your own actions per goal.', 'error'); return; }
  r.userTasks.push({ id: Date.now(), text: text.slice(0, 160), done: false });
  saveIntentions();
  renderWrapup();
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

/* Render My Actions as a drillable TREE. "↳" breaks any action into deeper
   sub-steps (recursive). Top level keeps the win-logging toggle + promote;
   nested steps use lightweight path-based toggle/delete. */
function _renderUserTree(tasks, path, idx) {
  if (!Array.isArray(tasks) || !tasks.length) return '';
  return tasks.map((u, i) => {
    const p = [...path, i];
    const pStr = p.join('.');
    const depth = p.length - 1;
    const d = !!u.done;
    const toggleCall = depth === 0 ? `toggleRoadmapUserTaskDone(${idx},${u.id})` : `wrapSubToggle(${idx},'${pStr}')`;
    const deleteCall = depth === 0 ? `deleteRoadmapUserTask(${idx},${u.id})`     : `wrapSubDelete(${idx},'${pStr}')`;
    const promoteBtn = depth === 0
      ? `<button onclick="wrapPromoteToGoal(${idx},${u.id})" title="Make this a goal → adds it to your Pegboard" style="${RM_CIRCLE}font-size:13px;">◎</button>` : '';
    const indent = depth > 0 ? `margin-left:${Math.min(depth, 4) * 13}px;border-left:2px solid var(--border);padding-left:7px;` : '';
    const row = `<div style="display:flex;gap:6px;align-items:center;padding:4px 2px;${indent}">
      <button onclick="${toggleCall}" title="${d ? 'Completed — tap to undo' : 'Mark done'}" style="${RM_CIRCLE}font-size:14px;">${d ? '✓' : '○'}</button>
      <span style="flex:1;min-width:0;font-size:12px;line-height:1.45;color:${d ? 'var(--muted)' : 'var(--text)'};${d ? 'text-decoration:line-through;text-decoration-color:var(--muted);text-decoration-thickness:1px;' : ''}">${esc(u.text)}</span>
      <button onclick="wrapDrillDown(${idx},'${pStr}',this)" title="Break this into deeper steps" style="${RM_CIRCLE}font-size:13px;">↳</button>
      ${promoteBtn}
      <button onclick="${deleteCall}" title="Delete this action" style="${RM_CIRCLE}font-size:14px;">✕</button>
    </div>`;
    return row + _renderUserTree(u.children, p, idx);
  }).join('');
}

/* Nightly checklist: every goal's 10 "Today I Will" actions with their
   done status. Clicking a row toggles it (logs a win + momentum) via the
   same toggleRoadmapTaskDone wiring, which re-renders this wrap-up. */
function _todayChecklist() {
  // Show EVERY real goal — even ones with no roadmap yet (e.g. a goal just
  // promoted from an action). Empty goals still get an add-action box so you
  // can start building them right here.
  const items = (intentions || [])
    .map((it, idx) => ({ it, idx }))
    .filter(o => o.it && (o.it.title || '').trim());
  if (!items.length) return null;
  let total = 0, done = 0, rows = '', fullRows = '';
  items.forEach(({ it, idx }) => {
    const shade = GREY_SHADES[idx % GREY_SHADES.length];   // same color as this goal's card in Column A
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

    // 2) Your own custom actions — a drillable TREE ("↳" = break into deeper
    //    steps). Header count reflects the top-level actions.
    uTasks.forEach(u => { total++; if (u.done) done++; });
    const userHtml = _renderUserTree(uTasks, [], idx);

    // Proven / AI "tracker" tasks — NOT shown in the goal box (only your own
    // actions are). They appear in MY TASK LIST below, visually separated with
    // their own tint + header. Building them here does NOT touch total/done —
    // the header count reflects your own actions only.
    const dones = rai.done || {};
    const locks = rai.locks || {};
    const _aiRowArr = (_raiTasksOK ? (rai.tasks || []) : []).map((t, i) => {
      const d = !!dones[i]; const locked = !!locks[i];
      return `<div style="background:#ffffff;border-radius:6px;margin-bottom:5px;padding:9px 11px;">
        <div style="font-size:12px;line-height:1.45;color:${d ? '#9aa0a6' : '#1C2230'};${d ? 'text-decoration:line-through;text-decoration-color:#bbbbbb;text-decoration-thickness:1px;' : ''}margin-bottom:8px;">${esc(t)}</div>
        <div style="display:flex;gap:16px;align-items:center;justify-content:center;background:#8ba6a9;border-radius:999px;padding:5px 12px;">
          <button onclick="toggleRoadmapTaskDone(${idx},${i})" title="${d ? 'Completed — tap to undo' : 'Mark done → logs a win'}" style="${RM_CIRCLE}font-size:14px;">${d ? '✓' : '○'}</button>
          <button onclick="toggleRoadmapLock(${idx},${i})" title="${locked ? 'Unlock' : 'Lock — return to this next visit'}" style="${RM_CIRCLE}">${locked ? LOCK_CLOSED : LOCK_OPEN}</button>
          <button onclick="deleteRoadmapTask(${idx},${i})" title="Delete this action" style="${RM_CIRCLE}font-size:14px;">✕</button>
        </div>
      </div>`;
    });
    // Show the first 5 proven actions; the rest live behind a "Show N more" dropdown.
    const hasAi     = _aiRowArr.length > 0;
    const aiHead    = _aiRowArr.slice(0, 5).join('');
    const aiTail    = _aiRowArr.slice(5).join('');
    const aiMoreCnt = _aiRowArr.length - 5;

    // GOAL BOX: two tabs hanging off the bottom — "My Actions" (your own) and
    // "Roadmap Tasks" (the AI actions). Clicking a tab shows that panel.
    const roadmapBox = hasAi
      ? `<div style="background:#8ba6a9;border:1px solid #6f8a8d;border-radius:8px;padding:7px 9px;">${aiHead}${aiTail ? `<details class="rm-drop" ${_aiMoreOpen.has(idx) ? 'open' : ''} ontoggle="wrapupAiMoreToggle(${idx},this.open)" style="margin-top:2px;">
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
        <button onclick="wrapPinResource(${idx},${i})" title="${r.pinned ? 'Unpin' : 'Pin — keep this on refresh'}" style="flex-shrink:0;background:none;border:none;cursor:pointer;font-size:14px;opacity:${r.pinned ? '1' : '0.35'};padding:2px 4px;">📌</button>
        <span style="flex-shrink:0;color:#e0102b;font-size:15px;">↗</span>
      </div>`).join('') : `<div style="font-size:11px;color:rgba(28,34,48,0.65);padding:2px;">Real videos, official sites, articles &amp; podcasts from people who've done this.</div>`}
    </div>`;

    const activeTab = _activeTab.get(idx) || 'my';   // which tab shows by default
    rows += `<details class="rm-drop" ${_openGoals.has(idx) ? 'open' : ''} ontoggle="wrapupGoalToggle(${idx},this.open)" style="margin:14px 0 8px;">
      <summary style="position:relative;z-index:2;background:${shade.bg};color:${shade.text};border-radius:10px;padding:9px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px;cursor:pointer;font-family:var(--vault-mono);font-size:11pt;font-weight:400;letter-spacing:0.5px;">
        <span>◎ ${esc(it.title)}</span><span class="rm-caret" style="flex-shrink:0;">▾</span>
      </summary>
      <div class="wtabs">
        <button id="wtab-my-${idx}" class="wtab${activeTab === 'my' ? ' wtab-active' : ''}" style="background:#000;color:#fff;" onclick="wrapTab(${idx},'my')">MY ACTIONS${uTasks.length ? ` ${uTasks.length}` : ''}</button>
        <button id="wtab-roadmap-${idx}" class="wtab${activeTab === 'roadmap' ? ' wtab-active' : ''}" style="background:#000;color:#fff;" onclick="wrapTab(${idx},'roadmap')">ROADMAP${hasAi ? ` ${_aiRowArr.length}` : ''}</button>
      </div>
      <div style="padding:10px 2px 4px;">
        <div id="wtab-panel-my-${idx}" style="display:${activeTab === 'my' ? 'block' : 'none'};">${userHtml}${addBox}<button id="wrapRegenBtn-${idx}" onclick="wrapRegenRoadmap(${idx})" style="width:100%;margin-top:2px;background:rgba(139,166,169,0.14);border:1px solid #8ba6a9;border-radius:6px;padding:10px 12px;font-family:var(--vault-mono);font-size:10px;font-weight:800;letter-spacing:0.5px;color:#8ba6a9;cursor:pointer;">✦ REGENERATE ROADMAP FROM MY ACTIONS</button></div>
        <div id="wtab-panel-roadmap-${idx}" style="display:${activeTab === 'roadmap' ? 'block' : 'none'};">${roadmapBox}${resourcesBlock}</div>
      </div>
    </details>`;

    // MY TASK LIST group: PROVEN ACTIONS only. The goal title + your own actions
    // already show in the goal box above, so we DON'T duplicate them here — just
    // the proven-actions set, labelled with the goal name for context.
    fullRows += hasAi ? `<div style="margin:12px 0 6px;">
      <div style="background:#8ba6a9;border:1px solid #6f8a8d;border-radius:8px;padding:7px 9px;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:#1C2230;letter-spacing:0.5px;margin:2px 2px 1px;">◎ ${esc(it.title)}</div>
        <div style="font-family:var(--vault-mono);font-size:8px;color:rgba(28,34,48,0.72);letter-spacing:1px;margin:0 2px 6px;">◈ PROVEN ACTIONS = RESULTS</div>
        ${aiHead}${aiTail ? `<details class="rm-drop" ${_aiMoreOpen.has(idx) ? 'open' : ''} ontoggle="wrapupAiMoreToggle(${idx},this.open)" style="margin-top:2px;">
          <summary style="display:flex;align-items:center;justify-content:center;gap:6px;padding:6px;cursor:pointer;font-family:var(--vault-mono);font-size:10px;font-weight:800;letter-spacing:0.5px;color:#1C2230;border-top:1px solid rgba(28,34,48,0.18);">
            <span>Show ${aiMoreCnt} more</span><span class="rm-caret">▾</span>
          </summary>${aiTail}</details>` : ''}
      </div>
    </div>` : '';
  });
  return { rows, total, done, fullRows };
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
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
  const weekKey = weekAgo.toISOString().slice(0, 10);
  return {
    today: wins.filter(w => w.date === today).length,
    week:  wins.filter(w => w.date >= weekKey).length,
  };
}

function _aiKey() { return `ci_wrapup_ai_${new Date().toISOString().slice(0, 10)}`; }

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

/* Multi-pass AI personalization — cached per day to control cost. */
export async function wrapupPersonalize() {
  const btn = document.getElementById('wrapupAiBtn');
  if (btn) { btn.disabled = true; btn.textContent = '✦ Personalizing…'; }
  try {
    const { summary, recentWins } = _aiSummary();
    const context = typeof buildContext === 'function' ? buildContext(getPB() || {}) : '';
    const name = (typeof getPB === 'function' && getPB()['pb-name']) || 'there';
    const data = await window.ciApiJson('wrapup-ai', { name, summary, context, recentWins });
    if (data && data.paragraph) {
      LS.set(_aiKey(), data.paragraph);
      renderWrapup();
    } else {
      throw new Error('No paragraph returned');
    }
  } catch (e) {
    if (typeof toast === 'function') toast('Personalize failed — using the standard recap.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '✦ Personalize'; }
  }
}

export function renderWrapup() {
  const el = document.getElementById('wrapupWidget');
  if (!el) return;

  const w = _winCounts();
  const aiPara = LS.get(_aiKey());
  const daily  = aiPara ? esc(aiPara) : _dailyStory(ringsSummary(), w.today);
  const weekly = _weeklyStory(ringsWeekSummary(), w.week);
  const chk    = _todayChecklist();

  // TODAY I WILL — its own card, placed between the Morning & Day run-through cards.
  // The "add your own action" box now lives INSIDE each goal dropdown (see _todayChecklist),
  // so it only appears once you open a goal — not floating at the top.
  const todayEl = document.getElementById('todayWillWidget');
  if (todayEl) {
    todayEl.innerHTML = chk ? `
      <div style="background:var(--widget-bg);border:1px solid var(--widget-border);border-radius:12px;padding:14px;margin-bottom:8px;">
        <details class="rm-drop" open>
          <summary style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;background:#000;color:#fff;border-radius:10px;cursor:pointer;">
            <span style="font-size:18pt;font-weight:800;line-height:1.15;">DAILY ACTION PLAN</span>
            <span style="flex-shrink:0;display:flex;align-items:center;gap:8px;">
              <span style="font-family:var(--vault-mono);font-size:10px;letter-spacing:1px;color:${chk.total && chk.done === chk.total ? DONE : '#fff'};border:1px solid rgba(255,255,255,0.55);border-radius:999px;padding:3px 10px;white-space:nowrap;">${chk.done}/${chk.total} done</span>
              <span class="rm-caret" style="display:inline-block;color:#fff;">▾</span>
            </span>
          </summary>
          <div style="border:1px solid #222;border-radius:8px;padding:2px 10px 6px;margin-top:8px;">
            ${chk.rows}
            <details class="rm-drop" ${_taskListOpen ? 'open' : ''} ontoggle="wrapupTaskListToggle(this.open)" style="margin-top:14px;">
              <summary style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:11px 13px;background:#1c1c1c;color:#fff;border:1px solid #333;border-radius:10px;cursor:pointer;font-family:var(--vault-mono);font-size:11px;font-weight:800;letter-spacing:1px;">
                <span>◈ MY TASK LIST — everything at once</span><span class="rm-caret">▾</span>
              </summary>
              <div style="padding-top:8px;">${chk.fullRows}</div>
            </details>
          </div>
        </details>
      </div>` : '';
  }

  el.innerHTML = `
    <div style="background:var(--widget-bg);border:1px solid var(--widget-border);border-radius:12px;padding:14px;margin-bottom:8px;">
      <details class="rm-drop" ${_wrapupOpen ? 'open' : ''} ontoggle="wrapupCardToggle(this.open)">
        <summary style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;background:#000;border-radius:10px;cursor:pointer;">
          <span style="font-size:18pt;font-weight:800;line-height:1.15;color:#fff;">◈ EVENING WRAP-UP</span>
          <span style="flex-shrink:0;display:flex;align-items:center;gap:8px;">
            ${aiPara ? `<span style="font-family:var(--vault-mono);font-size:8px;color:#fff;letter-spacing:0.5px;">✦ PERSONALIZED</span>` : ''}
            <span class="rm-caret" style="color:#fff;">▾</span>
          </span>
        </summary>
        <div style="margin-top:12px;">
          <div style="font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:1px;margin-bottom:5px;">TODAY</div>
          <p style="font-size:13px;line-height:1.6;color:var(--widget-text);margin:0 0 14px;">${daily}</p>

          <div style="font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:1px;margin-bottom:5px;">THIS WEEK</div>
          <p style="font-size:13px;line-height:1.6;color:var(--widget-text);margin:0 0 12px;">${weekly}</p>

          <button id="wrapupAiBtn" onclick="wrapupPersonalize()"
            style="background:none;border:1px solid #383838;border-radius:6px;padding:7px 12px;font-family:var(--vault-mono);font-size:9px;color:#999;cursor:pointer;letter-spacing:0.5px;">
            ${aiPara ? '↺ Regenerate' : '✦ Personalize'}</button>
        </div>
      </details>
    </div>`;
}

// Let card-builder re-render the wrap-up after a lock/delete (avoids an import cycle).
if (typeof window !== 'undefined') {
  window.renderWrapup = renderWrapup;
  window.wrapGoalAddAction = wrapGoalAddAction;      // inline onclick in the Today-I-Will goal boxes
  window.wrapupTaskListToggle = wrapupTaskListToggle; // inline ontoggle on the MY TASK LIST panel
  window.wrapPromoteToGoal = wrapPromoteToGoal;      // inline onclick: promote an action to a Pegboard goal
  window.wrapupAiMoreToggle = wrapupAiMoreToggle;    // inline ontoggle on the proven-actions "Show N more"
  window.wrapTab = wrapTab;   // switch a goal's My Actions / Roadmap Tasks tab
  window.wrapRegenRoadmap = wrapRegenRoadmap; // rebuild a goal's roadmap from its My Actions
  window.wrapGenResources = wrapGenResources; // fetch the mixed resource shelf for a goal
  window.wrapPinResource = wrapPinResource;   // pin/unpin a resource (kept on refresh)
  window.wrapDrillDown = wrapDrillDown;       // break a My-Action into deeper sub-steps
  window.wrapSubToggle = wrapSubToggle;       // toggle a nested sub-step done
  window.wrapSubDelete = wrapSubDelete;       // delete a nested sub-step
  window.wrapupCardToggle = wrapupCardToggle;        // inline ontoggle on the EVENING WRAP-UP card
}
