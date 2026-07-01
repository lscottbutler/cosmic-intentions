import { buildContext, callClaude, currentUser, esc, getPB, intentions, renderDashboard, renderVaultSidebar, saveIntentions, selectVaultIntention, selectedVaultIdx, toast, uploadVisionImage } from '../app.js';
import { launchAffirmationPlayer } from './player-launcher.js';
import { setTaskWin } from './wins.js';
/* ── CARD BUILDER + INTENTION MANAGEMENT ────────────────
   Depends on globals: intentions, esc, getPB, buildContext,
   callClaude, saveIntentions, syncIntentionsToSupabase,
   syncIntentionsFromSupabase, renderDashboard, renderVaultSidebar,
   selectVaultIntention, navTo, currentUser, sb, toast,
   launchCountdown, launch3Min, generateBlueprint, generateDaylife,
   showAddForm, switchPDTab, openVaultBuildSheet, selectedVaultIdx
───────────────────────────────────────────────────────── */

/* ── CARD HTML ───────────────────────────────────────── */
export function buildCardHTML(intention, idx, color) {
  const startDate  = intention.startDate  || '';
  const targetDate = intention.targetDate || '';
  const views      = intention.views      || Math.floor(Math.random()*120)+10;

  return `
    <!-- CARD HEADER -->
    <div class="card-header-v2" style="background:${color}" onclick="toggleCardV2(${idx})">
      <button class="card-play-btn" onclick="launchVisualization(${idx},3);event.stopPropagation()">▶</button>
      <div class="card-num-circle">${idx+1}</div>
      <div class="card-title-v2">${esc(intention.title)}</div>
      <div class="card-views">👁 ${views}</div>
      <span class="card-chevron-v2" id="chev-${idx}">▾</span>
    </div>

    <!-- CARD BODY -->
    <div class="card-body-v2" id="card-body-${idx}">

      <div class="card-goal-box">
        <div class="card-goal-statement">${esc(intention.title)}</div>
      </div>

      <div class="card-timer-row">
        <button class="card-timer-btn" onclick="launchCountdown(${idx},60);event.stopPropagation()"><img src="images/icons/60-seconds-button.png" alt="60 sec"></button>
        <button class="card-timer-btn" onclick="launchCountdown(${idx},30);event.stopPropagation()"><img src="images/icons/30-seconds-button.png" alt="30 sec"></button>
        <button class="card-timer-btn" onclick="launchCountdown(${idx},15);event.stopPropagation()"><img src="images/icons/15-seconds-button.png" alt="15 sec"></button>
      </div>

      <div class="card-dates-row">
        <div class="card-date-field">
          <label>Started</label>
          <input type="date" value="${esc(startDate)}"
            onchange="saveCardDate(${idx},'startDate',this.value)" />
        </div>
        <div class="card-date-field">
          <label>Completion</label>
          <input type="date" value="${esc(targetDate)}"
            onchange="saveCardDate(${idx},'targetDate',this.value)" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--border)">
        ${buildActionBtn(idx, 1, '3 Min',    'Visualize',  `launchVisualization(${idx},3)`)}
        ${buildActionBtn(idx, 3, '10 Min',   'Visualize',  `launchVisualization(${idx},10)`)}
        ${buildActionBtnBorder(idx, 4, 'Dash',   '#2',       `switchPDTab(${idx},'mindset')`)}
        ${buildActionBtnBorder(idx, 5, 'Dash',   '#3',       `switchPDTab(${idx},'roadmap')`)}
        ${buildActionBtnBorder(idx, 6, 'More',   '···',      '')}
      </div>

      <div class="pd-panel hidden" id="panel-words-${idx}">
        ${buildWordsPanel(intention, idx)}
      </div>
      <div class="pd-panel hidden" id="panel-mindset-${idx}">
        ${buildMindsetPanel(intention, idx)}
      </div>
      <div class="pd-panel hidden" id="panel-roadmap-${idx}">
        ${buildRoadmapPanel(intention, idx)}
      </div>
      <div class="pd-panel hidden" id="panel-fullplan-${idx}">
        ${buildFullPlanPanel(intention, idx)}
      </div>

      <div class="pd-tabs">
        <button class="pd-tab" id="tab-words-${idx}"    onclick="switchPDTab(${idx},'words')">My Pegboard</button>
        <button class="pd-tab" id="tab-mindset-${idx}"  onclick="switchPDTab(${idx},'mindset')">AI Library</button>
        <button class="pd-tab" id="tab-roadmap-${idx}"  onclick="switchPDTab(${idx},'roadmap')">AI Roadmap</button>
        <button class="pd-tab" id="tab-fullplan-${idx}" onclick="switchPDTab(${idx},'fullplan')">Full Plan</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,1fr);border-bottom:1px solid var(--border)">
        <button class="card-action-btn" onclick="generateBlueprint();event.stopPropagation()" style="border-right:1px solid var(--border)">
          <div class="cab-label">My<br>Blueprint</div>
        </button>
        <button class="card-action-btn" onclick="generateDaylife();event.stopPropagation()" style="border-right:none">
          <div class="cab-label">My<br>Ideal Day</div>
        </button>
      </div>

      <div class="card-footer">
        <button class="btn-delete-card" onclick="deleteIntention(${idx})">🗑 Remove</button>
        <button class="btn-add-intention-inline" onclick="showAddForm()">+ Add Intention</button>
      </div>
    </div>
  `;
}

function buildActionBtn(idx, num, line1, line2, action) {
  return `<button class="card-action-btn" onclick="${action};event.stopPropagation()" style="border-right:1px solid var(--border)">
    <div class="cab-num">${num}</div>
    <div class="cab-label">${line1}<br>${line2}</div>
  </button>`;
}

function buildActionBtnBorder(idx, num, line1, line2, action) {
  return `<button class="card-action-btn" onclick="${action};event.stopPropagation()" style="border-right:${num===8?'none':'1px solid var(--border)'};border-top:1px solid var(--border)">
    <div class="cab-num">${num}</div>
    <div class="cab-label">${line1}<br>${line2}</div>
  </button>`;
}

export function toggleCardV2(idx) {
  const body = document.getElementById(`card-body-${idx}`);
  const chev = document.getElementById(`chev-${idx}`);
  if (!body) return;
  const isOpen = body.classList.toggle('open');
  if (chev) chev.style.transform = isOpen ? 'rotate(180deg)' : '';
}

export function saveCardDate(idx, field, val) {
  if (intentions[idx]) { intentions[idx][field] = val; saveIntentions(); }
}

/* ── PANEL BUILDERS ──────────────────────────────────── */
function buildWordsPanel(intention, idx) {
  const pb     = getPB();
  const psych  = intention.psychReframe || {};
  const fields = [
    { label: 'Name',               value: pb['pb-name']      },
    { label: 'Life Mission',       value: pb['pb-mission']   },
    { label: 'Life Goal',          value: pb['pb-lifegol']   },
    { label: 'Core Values',        value: pb['pb-values']    },
    { label: 'Beliefs',            value: pb['pb-beliefs']   },
    { label: 'Winning Attitudes',  value: pb['pb-attitudes'] },
    { label: 'Traits & Strengths', value: pb['pb-traits']    },
    { label: 'Stoic Principles',   value: pb['pb-stoicism']  },
  ];
  const rows  = fields.map(f => f.value ? `
    <div class="pb-view-row">
      <div class="pb-view-label">${f.label}</div>
      <div class="pb-view-value">${esc(f.value)}</div>
    </div>` : '').join('');
  const empty = fields.every(f => !f.value);

  return `
    <div class="intention-psych-reframe" style="background-color:#161616;border:2px solid #555555;padding:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #333333;padding-bottom:10px;">
        <span style="font-weight:700;color:#F8F7F5;font-size:1rem;letter-spacing:0.03em;text-transform:uppercase;">Subconscious Friction Audit</span>
        <span style="color:#FFFFFF;background-color:#A32A2A;font-size:0.75rem;font-weight:700;padding:4px 8px;letter-spacing:0.05em;text-transform:uppercase;">Psychological Reframing</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <label style="font-size:0.85rem;font-weight:600;color:#9A948F;text-transform:uppercase;letter-spacing:0.02em;">Who is your North Star for this? (The Giant Achiever)</label>
        <input type="text" class="pb-alignment-input" data-param="giant_achiever" data-idx="${idx}"
          placeholder="e.g. Alex Hormozi, Kobe Bryant, Sara Blakely..."
          value="${esc(psych.giant_achiever || '')}"
          style="width:100%;padding:12px;background-color:#0A0A0A;border:1px solid #333333;color:#FFFFFF;font-size:0.95rem;border-radius:0;line-height:1.5;" />
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <label style="font-size:0.85rem;font-weight:600;color:#9A948F;text-transform:uppercase;letter-spacing:0.02em;">Your Self-Sabotage Blueprint (Fears, limiting beliefs, habits that broke past attempts)</label>
        <textarea class="pb-alignment-input" data-param="blockers_and_fears" data-idx="${idx}" rows="3"
          placeholder="Be brutally honest. What is the emotional or social friction keeping you from executing? (e.g., Fear of looking foolish, avoiding cold rejection, comfort zone attachment, toxic hidden habits)..."
          style="width:100%;padding:12px;background-color:#0A0A0A;border:1px solid #333333;color:#FFFFFF;font-size:0.95rem;border-radius:0;resize:vertical;line-height:1.5;">${esc(psych.blockers_and_fears || '')}</textarea>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <label style="font-size:0.85rem;font-weight:600;color:#9A948F;text-transform:uppercase;letter-spacing:0.02em;">Identity Alignment (How does this goal protect or conflict with your core values?)</label>
        <textarea class="pb-alignment-input" data-param="values_jive_check" data-idx="${idx}" rows="2"
          placeholder="Does achieving this target map natively to your desire for autonomy and truth, or is it a vanity metric driven by external expectations?..."
          style="width:100%;padding:12px;background-color:#0A0A0A;border:1px solid #333333;color:#FFFFFF;font-size:0.95rem;border-radius:0;resize:vertical;line-height:1.5;">${esc(psych.values_jive_check || '')}</textarea>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <label style="font-size:0.85rem;font-weight:600;color:#9A948F;text-transform:uppercase;letter-spacing:0.02em;">The Rory Sutherland Reframe (What counter-intuitive mental hack lowers the stakes?)</label>
        <textarea class="pb-alignment-input" data-param="alchemy_reframe" data-idx="${idx}" rows="2"
          placeholder="How can we flip this weakness or obstacle into your unique unfair advantage? (e.g., 'Being small means I am agile; having zero budget forces creative storytelling')..."
          style="width:100%;padding:12px;background-color:#0A0A0A;border:1px solid #333333;color:#FFFFFF;font-size:0.95rem;border-radius:0;resize:vertical;line-height:1.5;">${esc(psych.alchemy_reframe || '')}</textarea>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:5px;">
        <button id="lockPsychBtn-${idx}" onclick="lockPsychReframe(${idx})"
          style="background-color:#A32A2A;color:#FFFFFF;border:none;padding:10px 24px;font-weight:700;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;cursor:pointer;transition:background-color 0.2s;">
          Lock Subconscious Parameters
        </button>
      </div>
    </div>
    <div class="pb-view-wrap">
      ${empty
        ? `<div class="pb-view-empty">Your Pegboard is empty. <button class="pb-view-link" onclick="navTo('setup')">Fill in My Pegboard →</button></div>`
        : rows}
    </div>`;
}

export async function lockPsychReframe(idx) {
  const btn    = document.getElementById(`lockPsychBtn-${idx}`);
  const inputs = document.querySelectorAll(`.pb-alignment-input[data-idx="${idx}"]`);
  const reframe = {};
  inputs.forEach(el => { reframe[el.dataset.param] = el.value.trim(); });
  if (!intentions[idx]) return;
  intentions[idx].psychReframe = reframe;
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
  try {
    await saveIntentions();
    if (btn) { btn.textContent = 'Parameters Locked ✓'; }
    setTimeout(() => { if (btn) { btn.textContent = 'Lock Subconscious Parameters'; btn.disabled = false; } }, 2000);
  } catch(e) {
    if (btn) { btn.textContent = 'Save Failed'; btn.disabled = false; }
    console.error(e);
  }
}

/* Persist the user's active-danger-zone selection from the intake control. */
export function setActiveDangerZone(idx, value) {
  if (!intentions[idx]) return;
  intentions[idx].activeDangerZone = value || '';
  saveIntentions();
}

/* Check/uncheck a roadmap task. Checking marks it done for this goal,
   auto-logs it to the Wins Wall (→ momentum), and re-renders the panel.
   Unchecking reverses all of it. */
export function toggleRoadmapTaskDone(idx, i) {
  const r = intentions[idx]?.roadmapAI;
  if (!r || !Array.isArray(r.tasks)) return;
  if (!r.done) r.done = {};
  r.done[i] = !r.done[i];
  const done = !!r.done[i];
  const it = intentions[idx];
  saveIntentions();
  setTaskWin(`task-${idx}-${i}`, `✓ ${r.tasks[i] || ''}`, done, { goal: it?.title || '', category: it?.category || '' });   // log/remove the win + momentum
  const panel = document.getElementById(`panel-roadmap-ai-${idx}`);
  if (panel) panel.innerHTML = renderRoadmapAI(r, idx);
}

/* ── USER-ADDED ROADMAP TASKS (up to 25/goal) ─────────────
   Stored separately (r.userTasks) so they SURVIVE AI regenerate.
   Each is {id, text, done}; checking one logs a win + momentum. */
const MAX_USER_TASKS = 25;
function _rerenderRoadmap(idx, r) {
  const panel = document.getElementById(`panel-roadmap-ai-${idx}`);
  if (panel) panel.innerHTML = renderRoadmapAI(r, idx);
}
export function addRoadmapUserTask(idx) {
  const r = intentions[idx]?.roadmapAI;
  if (!r) return;
  if (!Array.isArray(r.userTasks)) r.userTasks = [];
  const input = document.getElementById(`roadmapUserInput-${idx}`);
  const text = (input?.value || '').trim();
  if (!text) return;
  if (r.userTasks.length >= MAX_USER_TASKS) { toast(`Max ${MAX_USER_TASKS} of your own tasks per goal.`, 'error'); return; }
  r.userTasks.push({ id: Date.now(), text: text.slice(0, 160), done: false });
  saveIntentions();
  _rerenderRoadmap(idx, r);
}
export function toggleRoadmapUserTaskDone(idx, id) {
  const r = intentions[idx]?.roadmapAI;
  const t = r?.userTasks?.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  const it = intentions[idx];
  saveIntentions();
  setTaskWin(`task-${idx}-u${id}`, `✓ ${t.text}`, t.done, { goal: it?.title || '', category: it?.category || '' });
  _rerenderRoadmap(idx, r);
}
export function deleteRoadmapUserTask(idx, id) {
  const r = intentions[idx]?.roadmapAI;
  if (!r || !Array.isArray(r.userTasks)) return;
  setTaskWin(`task-${idx}-u${id}`, '', false);   // drop any logged win for it
  r.userTasks = r.userTasks.filter(x => x.id !== id);
  saveIntentions();
  _rerenderRoadmap(idx, r);
}

/* Lock/unlock a roadmap task so the user can return to it next visit.
   State persists on the intention (saved + synced via saveIntentions). */
export function toggleRoadmapLock(idx, i) {
  const r = intentions[idx]?.roadmapAI;
  if (!r) return;
  if (!r.locks) r.locks = {};
  r.locks[i] = !r.locks[i];
  const locked = !!r.locks[i];
  const btn = document.getElementById(`roadmapLock-${idx}-${i}`);
  if (btn) {
    btn.textContent = locked ? '🔒' : '🔓';
    btn.style.color = locked ? '#F5A623' : '#505058';
    btn.title = locked ? 'Unlock' : 'Lock — return to this next visit';
  }
  saveIntentions();
}

/* Remember whether a roadmap dropdown (MY ACTION PLAN / PROVEN ACTIONS) is
   open, so a re-render (checking a task, adding one) doesn't collapse it. */
export function roadmapSectionToggle(idx, key, open) {
  const r = intentions[idx]?.roadmapAI;
  if (!r) return;
  if (!r.ui) r.ui = {};
  r.ui[key] = !!open;
  saveIntentions();
}

/* Resolve the single active danger zone for an intention. Uses the explicit
   user selection if set, else falls back to the first logged danger zone. */
function getActiveDangerZone(intent) {
  const zones = intent.theMap?.dangerZones || [];
  if (!zones.length) return null;
  if (intent.activeDangerZone) {
    const match = zones.find(z => (z.title || '') === intent.activeDangerZone);
    if (match) return match;
  }
  return zones[0];
}

export async function generateRoadmapAI(idx) {
  const btn    = document.getElementById(`btn-roadmap-ai-${idx}`);
  const panel  = document.getElementById(`panel-roadmap-ai-${idx}`);
  const intent = intentions[idx];
  if (!intent) return;

  // ── Intake: the goal (+ optional danger zone for targeting) ────────────
  const intention = intent.title || '';
  const dz        = getActiveDangerZone(intent);

  if (!intention) { toast('This intention has no title.', 'error'); return; }

  if (btn)   { btn.disabled = true; btn.textContent = 'Generating…'; }
  if (panel) { panel.innerHTML = '<div style="padding:24px 0;text-align:center;color:#505058;font-family:var(--vault-mono);font-size:10px;letter-spacing:2px;">◈ BUILDING YOUR 10 STEPS…</div>'; }

  try {
    const result = await ciApiJson('roadmap-ai', dz ? { intention, dangerZone: dz } : { intention });

    intent.roadmapAI = result;
    await saveIntentions();
    if (panel) panel.innerHTML = renderRoadmapAI(result, idx);
    toast('Roadmap generated ✓', 'success');
  } catch(e) {
    if (panel) panel.innerHTML = `<div style="padding:16px;color:#FF375F;font-size:12px;">${esc(e.message)}</div>`;
    toast('Roadmap generation failed.', 'error');
    console.error(e);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '✦ Generate AI Roadmap'; }
  }
}

function renderRoadmapAI(r, idx) {
  // Surgical view: active Intention + Danger Zone chips, then the flat top-10
  // tactical task list. No paragraphs, no fluff.
  const locks = r.locks || {};
  const dones = r.done  || {};
  const tasks = (r.tasks || []).map((t, i) => {
    const locked = !!locks[i];
    const done   = !!dones[i];
    return `<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
      <span style="flex-shrink:0;width:22px;height:22px;border-radius:50%;background:#000;display:flex;align-items:center;justify-content:center;font-family:var(--vault-mono);font-size:15px;font-weight:800;color:#fff;line-height:1;">${i + 1}</span>
      <span style="flex:1;min-width:0;font-size:13px;line-height:1.6;${done ? 'text-decoration:line-through;color:var(--muted);' : 'color:var(--text);'}">${esc(t)}</span>
      <button onclick="toggleRoadmapTaskDone(${idx},${i});event.stopPropagation();"
        style="flex-shrink:0;background:none;border:none;cursor:pointer;padding:0;font-size:20px;line-height:1;color:${done ? '#4ADE80' : '#999'};"
        title="${done ? 'Completed — tap to undo' : 'Mark done → logs a win'}">${done ? '✓' : '○'}</button>
      <button id="roadmapLock-${idx}-${i}" onclick="toggleRoadmapLock(${idx},${i});event.stopPropagation();"
        style="flex-shrink:0;background:none;border:none;cursor:pointer;padding:0;font-size:18px;line-height:1;color:${locked ? '#F5A623' : '#999'};"
        title="${locked ? 'Unlock' : 'Lock — return to this next visit'}">${locked ? '🔒' : '🔓'}</button>
    </div>`;
  }).join('');

  const uTasks = (r.userTasks || []);
  const userTasks = uTasks.map(t => `
    <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
      <span style="flex-shrink:0;width:22px;height:22px;border-radius:50%;background:#8ba6a9;display:flex;align-items:center;justify-content:center;font-size:11px;color:#0a0a0a;line-height:1;">✎</span>
      <span style="flex:1;min-width:0;font-size:13px;line-height:1.6;${t.done ? 'text-decoration:line-through;color:var(--muted);' : 'color:var(--text);'}">${esc(t.text)}</span>
      <button onclick="toggleRoadmapUserTaskDone(${idx},${t.id});event.stopPropagation();"
        style="flex-shrink:0;background:none;border:none;cursor:pointer;padding:0;font-size:20px;line-height:1;color:${t.done ? '#4ADE80' : '#999'};"
        title="${t.done ? 'Completed — tap to undo' : 'Mark done → logs a win'}">${t.done ? '✓' : '○'}</button>
      <button onclick="deleteRoadmapUserTask(${idx},${t.id});event.stopPropagation();"
        style="flex-shrink:0;background:none;border:none;cursor:pointer;padding:0;font-size:16px;line-height:1;color:#999;" title="Delete">×</button>
    </div>`).join('');

  const ui         = r.ui || {};
  const planOpen   = ui.plan   !== false;   // default open
  const provenOpen = ui.proven !== false;   // default open

  const summaryCss = (bg, fg) => `display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;background:${bg};color:${fg};font-family:var(--vault-mono);font-size:11px;font-weight:800;letter-spacing:1px;border-radius:10px;`;

  // DROPDOWN 1 — MY ACTION PLAN (the user's own actions)
  const planBody = `
    ${userTasks ? `<div style="margin-bottom:10px;">${userTasks}</div>` : `<div style="font-size:12px;color:var(--muted);font-style:italic;padding:4px 0 10px;">No actions yet — add your first one below.</div>`}
    ${uTasks.length < 25 ? `<div style="display:flex;gap:6px;">
      <input id="roadmapUserInput-${idx}" type="text" maxlength="160" placeholder="Add your own action…" onkeydown="if(event.key==='Enter'){addRoadmapUserTask(${idx});}" onclick="event.stopPropagation();"
        style="flex:1;min-width:0;background:var(--sunken);border:1px solid var(--border);border-radius:6px;padding:9px 11px;font-size:12px;color:var(--text);font-family:inherit;">
      <button onclick="addRoadmapUserTask(${idx});event.stopPropagation();"
        style="flex-shrink:0;background:#8ba6a9;border:none;border-radius:6px;padding:9px 14px;font-family:var(--vault-mono);font-size:10px;font-weight:800;letter-spacing:0.5px;color:#0a0a0a;cursor:pointer;">+ ADD</button>
    </div>` : `<div style="font-family:var(--vault-mono);font-size:8px;color:var(--muted);">Max 25 reached.</div>`}`;

  const planDrop = `
    <details class="rm-drop" ${planOpen ? 'open' : ''} ontoggle="roadmapSectionToggle(${idx},'plan',this.open)" style="margin-bottom:14px;">
      <summary style="${summaryCss('#8ba6a9', '#0a0a0a')}">
        <span>✎ MY ACTION PLAN · ${uTasks.length}/25</span><span class="rm-caret">▾</span>
      </summary>
      <div style="padding:12px 4px 4px;">${planBody}</div>
    </details>`;

  // DROPDOWN 2 — PROVEN ACTIONS = RESULTS (the AI-generated 10)
  const provenDrop = `
    <details class="rm-drop" ${provenOpen ? 'open' : ''} ontoggle="roadmapSectionToggle(${idx},'proven',this.open)" style="margin-bottom:16px;">
      <summary style="${summaryCss('#000', '#fff')}">
        <span>◈ PROVEN ACTIONS = RESULTS</span><span class="rm-caret">▾</span>
      </summary>
      <div style="padding:12px 4px 4px;">${tasks || `<div style="font-size:12px;color:var(--muted);font-style:italic;padding:4px 0;">Generate your 10 steps below.</div>`}</div>
    </details>`;

  return `
    <div style="padding:4px 0 16px;">
      <div style="background:#E84B3C;border-radius:12px;padding:16px 18px;margin-bottom:16px;">
        <span style="font-size:18px;font-weight:800;color:#fff;letter-spacing:0.5px;">${esc(r.intention || '')}</span>
      </div>

      ${planDrop}
      ${provenDrop}

      ${r.danger_zone ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
        <span style="font-family:var(--vault-mono);font-size:8px;letter-spacing:1px;color:#FF375F;background:#1A0505;border:1px solid #3a1010;border-radius:6px;padding:5px 9px;">⚠ ${esc(r.danger_zone)}</span>
      </div>` : ''}

      <button onclick="generateRoadmapAI(${idx})" style="display:flex;align-items:center;width:100%;background:var(--ink);color:var(--on-ink);padding:14px 16px;border:1px solid var(--border);border-radius:4px;cursor:pointer;font-weight:700;letter-spacing:1px;font-size:14px;"><span style="display:inline-block;width:1.3em;margin-right:9px;text-align:center;">↺</span>REGENERATE</button>
    </div>`;
}

function buildMindsetPanel(intention, idx) {
  if (!intention.mindset) {
    return `
      <div class="ai-panel-intro">
        <p>Generate personalized affirmations, beliefs, attitudes, and a meditation for this intention.</p>
        <button class="ai-gen-btn" id="btn-mindset-${idx}" onclick="generateMindset(${idx})">✦ Generate AI Library</button>
      </div>`;
  }
  return renderMindsetResult(intention.mindset, idx);
}

function renderMindsetResult(m, idx) {
  const pills = (m.affirmations||[]).map(a =>
    `<span class="affirmation-pill">${esc(a)}</span>`).join('');
  const beliefs = (m.beliefs||[]).map(b =>
    `<div class="belief-item"><span class="belief-arrow">→</span>${esc(b)}</div>`).join('');
  const attitudes = (m.attitudes||[]).map(a =>
    `<div class="attitude-card">
      <div class="attitude-title">${esc(a.title||a)}</div>
      <div class="attitude-body">${esc(a.body||'')}</div>
    </div>`).join('');
  return `
    <div class="mindset-section">
      <div class="mindset-section-title">Affirmations</div>
      <div class="affirmation-pills">${pills}</div>
    </div>
    <div class="mindset-section">
      <div class="mindset-section-title">Beliefs</div>
      ${beliefs}
    </div>
    <div class="mindset-section">
      <div class="mindset-section-title">Attitudes</div>
      ${attitudes}
    </div>
    ${m.meditation ? `
    <div class="mindset-section">
      <div class="mindset-section-title">Meditation</div>
      <div class="meditation-box">${esc(m.meditation)}</div>
    </div>` : ''}
    <button class="ai-gen-btn regen" id="btn-mindset-${idx}"
      onclick="generateMindset(${idx})">↺ Regenerate</button>`;
}

export function buildRoadmapPanel(intention, idx) {
  const zones = intention.theMap?.dangerZones || [];

  // Optional targeting: if danger zones exist, let the user aim the 10 steps at
  // one. Not required — the steps generate from the goal itself.
  const dzOpts = zones.map(z =>
    `<option value="${esc(z.title || '')}"${intention.activeDangerZone === (z.title || '') ? ' selected' : ''}>${esc(z.title || '')}</option>`).join('');

  const selStyle = 'width:100%;background:#141414;border:1px solid #2a2a2a;border-radius:6px;padding:8px 10px;font-size:12px;color:#ddd;font-family:inherit;margin-bottom:12px;';

  const intakeControls = zones.length
    ? `<div style="font-family:var(--vault-mono);font-size:8px;color:#FF375F;letter-spacing:1px;margin-bottom:4px;">⚠ FOCUS ON DANGER ZONE (optional)</div>
    <select style="${selStyle}" onchange="setActiveDangerZone(${idx}, this.value)">${dzOpts}</select>`
    : '';

  return `
    <div style="padding:16px;">
      <div style="font-family:var(--vault-mono);font-size:22px;color:#F5A623;font-weight:800;letter-spacing:1.5px;margin-bottom:10px;">◈ TODAY I WILL</div>
      ${intakeControls}
      <div id="panel-roadmap-ai-${idx}">
        ${intention.roadmapAI ? renderRoadmapAI(intention.roadmapAI, idx) : ''}
      </div>
      ${!intention.roadmapAI ? `<button class="ai-gen-btn" id="btn-roadmap-ai-${idx}" onclick="generateRoadmapAI(${idx})">✦ Generate My 10 Steps</button>` : ''}
    </div>`;
}

function renderRoadmapResult(a, idx) {
  const steps = Array.isArray(a.roadmap) ? a.roadmap : (a.strategy ? [a.strategy] : []);
  const items = steps.map((s, i) =>
    `<li class="roadmap-item">
      <span class="roadmap-num">${i+1}</span>
      <span class="roadmap-text">${esc(s)}</span>
    </li>`).join('');
  const bulletSection = (title, arr) => {
    if (!Array.isArray(arr) || !arr.length) return '';
    return `
      <div class="mindset-section">
        <div class="mindset-section-title">${esc(title)}</div>
        <ul class="roadmap-list">
          ${arr.map(s => `<li class="roadmap-item"><span class="roadmap-num">•</span><span class="roadmap-text">${esc(s)}</span></li>`).join('')}
        </ul>
      </div>`;
  };
  let achieverBlock = '';
  if (a.achiever?.name) {
    achieverBlock = `
      <div class="mindset-section">
        <div class="mindset-section-title">Famous Achiever</div>
        <div class="roadmap-item"><span class="roadmap-text"><strong>${esc(a.achiever.name)}</strong>${a.achiever.tagline ? ` — ${esc(a.achiever.tagline)}` : ''}</span></div>
      </div>`;
  }
  let mediaBlock = '';
  if (a.media && (a.media.youtube || a.media.articles || a.media.podcasts)) {
    const row = (label, arr) => {
      if (!Array.isArray(arr) || !arr.length) return '';
      return `<li class="roadmap-item"><span class="roadmap-num">${esc(label)}</span><span class="roadmap-text">${arr.map(s => esc(s)).join(' · ')}</span></li>`;
    };
    mediaBlock = `
      <div class="mindset-section">
        <div class="mindset-section-title">Where They Shared the Playbook</div>
        <ul class="roadmap-list">
          ${row('YouTube',  a.media.youtube)}
          ${row('Articles', a.media.articles)}
          ${row('Podcasts', a.media.podcasts)}
        </ul>
      </div>`;
  }
  return `
    ${achieverBlock}
    ${mediaBlock}
    ${bulletSection('Risks Taken',         a.risks_taken)}
    ${bulletSection('Networking Strategy', a.networking_strategy)}
    ${bulletSection('Critical Skills',     a.critical_skills)}
    ${bulletSection('Mindset & Attitudes', a.mindset_attitudes)}
    <div class="mindset-section">
      <div class="mindset-section-title">Your Roadmap</div>
      <ul class="roadmap-list">${items}</ul>
    </div>
    <button class="ai-gen-btn regen" id="btn-roadmap-${idx}"
      onclick="generateAchievers(${idx})">↺ Regenerate</button>`;
}

/* ── ADD / DELETE INTENTIONS ─────────────────────────── */
export function showAddForm() {
  document.getElementById('addIntentionForm')?.classList.remove('hidden');
  document.getElementById('btnAddIntention')?.classList.add('hidden');
  setTimeout(() => document.getElementById('newIntentionInput')?.focus(), 50);
}

/* ── COLUMN A AMBIENT AFFIRMATION LOOP ───────────────────
   Cycles the selected goal's affirmations through the phone
   player's caption (#ppSlideText). Silent — text only, no TTS. */
const ActiveVisualPlayer = { currentIdx: 0, timer: null };

export function stopSurgicalVisualLoop() {
  clearTimeout(ActiveVisualPlayer.timer);
  ActiveVisualPlayer.timer = null;
}

/* Tap the Column A player → open the Affirmation player. */
function openVisionPlayer() {
  if (typeof launchAffirmationPlayer === 'function') launchAffirmationPlayer();
}

export function runSurgicalVisualLoop(idx) {
  stopSurgicalVisualLoop();
  // Drives the phone player (#ppSlideText / #ppScreenImg).
  const txtEls = [document.getElementById('ppSlideText')].filter(Boolean);
  if (!txtEls.length) return;
  const intention = (typeof intentions !== 'undefined' && intentions) ? intentions[idx] : null;
  if (!intention) return;

  // Paint this goal's vision image into the phone screen (CSS fallback shows if none yet).
  const screenEl = document.getElementById('ppScreenImg');
  if (screenEl) screenEl.style.backgroundImage = intention.imageUrl ? `url("${intention.imageUrl}")` : '';

  // Backfill a vision image for this goal on the spot if it has none yet.
  if (!intention.imageUrl && !intention._imgLoading && typeof fetchGoalImage === 'function') {
    fetchGoalImage(idx, intention.title);
  }

  // Ingest affirmations from the current goal; fall back to the intention title.
  const statements = (intention.mindset && intention.mindset.affirmations && intention.mindset.affirmations.length)
    ? intention.mindset.affirmations
    : [intention.title];

  ActiveVisualPlayer.currentIdx = 0;

  function cycle() {
    if (ActiveVisualPlayer.currentIdx >= statements.length) ActiveVisualPlayer.currentIdx = 0;
    const statement = statements[ActiveVisualPlayer.currentIdx];
    txtEls.forEach(el => {
      el.style.opacity = '0';
      setTimeout(() => { el.textContent = statement || ''; el.style.opacity = '1'; }, 300);
    });
    ActiveVisualPlayer.currentIdx++;
    ActiveVisualPlayer.timer = setTimeout(cycle, 6000); // silent 6s hold per slide
  }
  cycle();
}

export function updateIamPreview() {
  const f1 = (document.getElementById('iam-field1')?.value || '').trim();
  const f2 = (document.getElementById('iam-field2')?.value || '').trim();
  const preview = document.getElementById('iam-preview');
  if (!preview) return;
  const hasContent = f1 || f2;
  preview.style.opacity = hasContent ? '1' : '0.3';
  preview.textContent = hasContent
    ? 'I AM ' + [f1, f2].filter(Boolean).join(' ')
    : 'I AM …';
}

export function hideAddForm() {
  document.getElementById('addIntentionForm')?.classList.add('hidden');
  document.getElementById('btnAddIntention')?.classList.remove('hidden');
  const f1 = document.getElementById('iam-field1');
  const f2 = document.getElementById('iam-field2');
  if (f1) f1.value = '';
  if (f2) f2.value = '';
  updateIamPreview();
}

export async function confirmAddIntention() {
  const f1 = (document.getElementById('iam-field1')?.value || '').trim();
  const f2 = (document.getElementById('iam-field2')?.value || '').trim();
  if (!f1 && !f2) { toast('Fill in your intention.', 'error'); return; }
  let title = ('I AM ' + [f1, f2].filter(Boolean).join(' ')).slice(0, 150);
  const intention = {
    id: crypto.randomUUID(), title,
    words: { mission:'', affirmations:'', beliefs:'', quotes:'', insights:'' },
    mindset: null, achievers: null, imageUrl: null,
  };
  intentions.push(intention);
  hideAddForm();
  await saveIntentions();
  renderDashboard();
  selectVaultIntention(intentions.length - 1);
  toast('Intention added ✓ — finding your vision image…', 'success');
  fetchGoalImage(intentions.length - 1, title);
}

async function fetchGoalImage(idx, title, opts = {}) {
  const silent = !!opts.silent;
  const intn = intentions[idx];
  if (intn) intn._imgLoading = true;
  renderVaultSidebar();
  try {
    const res = await ciApi('image-generate', { intention: title });
    if (!res.ok) throw new Error(`generate ${res.status}`);
    const { b64 } = await res.json();
    if (!b64 || !intentions[idx]) return;
    // Store in Supabase Storage (cross-device); fall back to inline data URL.
    let url = null;
    if (typeof uploadVisionImage === 'function') {
      url = await uploadVisionImage(intentions[idx].id, b64);
    }
    intentions[idx].imageUrl = url || `data:image/png;base64,${b64}`;
    await saveIntentions();
    // If this goal's player is on screen, paint the new image in immediately.
    const onScreen = typeof selectedVaultIdx !== 'undefined' && selectedVaultIdx === idx;
    if (onScreen) {
      const u = `url("${intentions[idx].imageUrl}")`;
      ['ppScreenImg', 'bsDvbImg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.backgroundImage = u;
      });
    }
    if (!silent) toast('Vision image ready ✓', 'success');
  } catch(e) {
    console.error('Image generation failed:', e);
    if (!silent) toast('Image generation failed — try regenerate.', 'error');
  } finally {
    if (intentions[idx]) intentions[idx]._imgLoading = false;
    renderVaultSidebar();
  }
}

/* Ensure every goal has a vision image — generate sequentially for any
   that are missing one. Safe to call repeatedly: skips goals that already
   have an image or are mid-generation, and only one pass runs at a time. */
let _imgBackfillRunning = false;
export async function backfillGoalImages() {
  if (_imgBackfillRunning) return;
  if (typeof intentions === 'undefined' || !intentions || !intentions.length) return;
  _imgBackfillRunning = true;
  try {
    for (let i = 0; i < intentions.length; i++) {
      const intn = intentions[i];
      if (!intn || intn._imgLoading || !intn.title) continue;
      if (!intn.imageUrl) {
        // No image yet — generate one (uploads to Storage inside fetchGoalImage).
        await fetchGoalImage(i, intn.title, { silent: true });
        await new Promise(r => setTimeout(r, 500)); // gentle throttle between generations
      } else if (intn.imageUrl.startsWith('data:') && typeof uploadVisionImage === 'function') {
        // Existing local-only image — migrate it to Storage for cross-device.
        const url = await uploadVisionImage(intn.id, intn.imageUrl.split(',')[1]);
        if (url) { intn.imageUrl = url; await saveIntentions(); }
        await new Promise(r => setTimeout(r, 150));
      }
    }
  } finally {
    _imgBackfillRunning = false;
  }
}

async function regenerateGoalImage(idx, ev) {
  if (ev) ev.stopPropagation();
  const intn = intentions[idx];
  if (!intn || intn._imgLoading) return;
  toast('Generating a new image…', 'success');
  await fetchGoalImage(idx, intn.title);
}

export function renderPBIntentionList() {
  const el = document.getElementById('pbIntentionList');
  if (!el) return;
  if (intentions.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:#AAAAAA;padding:4px 0;">No intentions yet.</div>';
    return;
  }
  const catOptions = [
    { value: '', label: '— Category —' },
    { value: 'wealth',       label: 'Wealth'       },
    { value: 'health',       label: 'Health'       },
    { value: 'relationship', label: 'Relationship' },
    { value: 'purpose',      label: 'Purpose'      },
    { value: 'mindset',      label: 'Mindset'      },
    { value: 'creative',     label: 'Create'       },
    { value: 'growth',       label: 'Growth'       },
  ];
  const fld = 'width:100%;box-sizing:border-box;padding:12px 14px;border:none;border-radius:7px;font-size:15px;color:#1a1a1a;';
  const lbl = 'color:#fff;font-weight:800;font-size:15px;letter-spacing:.5px;margin-bottom:10px;';
  el.innerHTML = intentions.map((i, idx) => {
    const optHtml = catOptions.map(o =>
      `<option value="${o.value}"${i.category === o.value ? ' selected' : ''}>${o.label}</option>`
    ).join('');
    const aiOn = i.aiEnabled !== false;   // ON unless explicitly turned off
    return `
    <div style="margin-bottom:24px;border-radius:14px;overflow:hidden;border:1px solid var(--border);box-shadow:var(--shadow);">
      <div style="position:relative;padding:18px 20px;background:#8ba6a9;">
        <div style="font-size:20px;font-weight:800;color:var(--text);text-transform:uppercase;letter-spacing:.5px;">Goal ${idx + 1}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px;">Set this goal's details below.</div>
        <button onclick="pbDeleteIntention(${idx})" title="Remove goal"
          style="position:absolute;top:14px;right:14px;background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;line-height:1;">✕</button>
      </div>
      <div style="background:#2E2E2E;padding:18px 20px;">
        <div style="${lbl}">GOAL</div>
        <input type="text" value="${esc(i.title)}" maxlength="150"
          onchange="pbSaveIntentionTitle(${idx}, this.value)" style="${fld}" />
      </div>
      <div style="background:#2E2E2E;padding:18px 20px;border-top:1px solid #3a3a3a;">
        <div style="${lbl}">START &amp; END DATES</div>
        <div style="display:flex;gap:12px;">
          <div style="flex:1;">
            <input type="date" value="${esc(i.startDate || '')}" onchange="saveCardDate(${idx},'startDate',this.value)" style="${fld}" />
            <div style="color:#fff;font-size:11px;margin-top:5px;opacity:.9;">Start</div>
          </div>
          <div style="flex:1;">
            <input type="date" value="${esc(i.targetDate || '')}" onchange="saveCardDate(${idx},'targetDate',this.value)" style="${fld}" />
            <div style="color:#fff;font-size:11px;margin-top:5px;opacity:.9;">End</div>
          </div>
        </div>
      </div>
      <div style="background:#2E2E2E;padding:18px 20px;border-top:1px solid #3a3a3a;">
        <div style="${lbl}">CATEGORY</div>
        <select onchange="pbSaveCategory(${idx}, this.value)" style="${fld}">${optHtml}</select>
      </div>
      <div style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--card);">
        <div>
          <div style="font-weight:800;color:var(--text);font-size:14px;letter-spacing:.5px;">AI FOR THIS GOAL</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">Auto-generate affirmations, beliefs, roadmap &amp; more.</div>
        </div>
        <button role="switch" aria-checked="${aiOn}" onclick="pbToggleAI(${idx})" title="${aiOn ? 'AI on' : 'AI off'}"
          style="flex:0 0 auto;width:52px;height:30px;border-radius:15px;border:none;cursor:pointer;position:relative;background:${aiOn ? '#34C759' : '#999'};transition:background .2s;">
          <span style="position:absolute;top:3px;left:${aiOn ? '25px' : '3px'};width:24px;height:24px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.4);"></span>
        </button>
      </div>
    </div>`;
  }).join('');
}

/* Per-goal AI on/off. Persisted to the dedicated `ai_enabled` Supabase column.
   OFF stops AI auto-generation for the goal. */
export async function pbToggleAI(idx) {
  const intn = intentions[idx]; if (!intn) return;
  intn.aiEnabled = (intn.aiEnabled === false);   // false→on(true), else→off(false)
  await saveIntentions();
  renderPBIntentionList();
}

export async function pbSaveCategory(idx, val) {
  if (!intentions[idx]) return;
  intentions[idx].category = val;
  await saveIntentions();
  renderVaultSidebar();
}

export async function pbConfirmAddIntention() {
  const inp      = document.getElementById('pbNewIntentionInput');
  const startEl  = document.getElementById('pbNewStartDate');
  const targetEl = document.getElementById('pbNewTargetDate');
  const catEl    = document.getElementById('pbNewCategory');
  if (!inp) return;
  let title = inp.value.trim().slice(0, 150);
  if (!title) { toast('Enter your intention.', 'error'); return; }
  if (!title.toLowerCase().startsWith('i am')) title = 'I AM ' + title;
  intentions.push({
    id: crypto.randomUUID(), title,
    startDate:  startEl?.value  || '',
    targetDate: targetEl?.value || '',
    category:   catEl?.value    || '',
    words: { mission:'', affirmations:'', beliefs:'', quotes:'', insights:'' },
    mindset: null, achievers: null
  });
  inp.value = '';
  if (catEl)    catEl.value    = '';
  if (startEl)  startEl.value  = '';
  if (targetEl) targetEl.value = '';
  await saveIntentions();
  renderPBIntentionList();
  renderVaultSidebar();
  toast('Intention added ✓', 'success');
}

export async function pbSaveIntentionTitle(idx, newTitle) {
  const t = newTitle.trim().slice(0, 150);
  if (!t || !intentions[idx] || intentions[idx].title === t) return;
  intentions[idx].title = t;
  await saveIntentions();
  renderVaultSidebar();
}

export async function pbDeleteIntention(idx) {
  if (!confirm(`Remove "${intentions[idx]?.title}"?`)) { renderPBIntentionList(); return; }
  const deletedId = intentions[idx]?.id;
  intentions.splice(idx, 1);
  await saveIntentions();
  if (currentUser && deletedId) {
    await sb.from('intentions').delete().eq('id', deletedId).eq('user_id', currentUser.id);
  }
  renderPBIntentionList();
  renderVaultSidebar();
  toast('Intention removed.', '');
}

export async function deleteIntention(idx) {
  if (!confirm(`Remove "${intentions[idx]?.title}"?`)) return;
  const deletedId = intentions[idx]?.id;
  intentions.splice(idx, 1);
  await saveIntentions();
  if (currentUser && deletedId) {
    await sb.from('intentions').delete().eq('id', deletedId).eq('user_id', currentUser.id);
  }
  renderDashboard();
  toast('Intention removed.', '');
}

/* ── ACCORDION & TABS ────────────────────────────────── */
function toggleCard(idx) {
  const body = document.getElementById(`card-body-${idx}`);
  const hdr  = document.getElementById(`card-hdr-${idx}`);
  if (!body) return;
  const isOpen = body.classList.contains('open');
  if (!isOpen) { body.classList.add('open'); hdr?.classList.add('open'); }
  else         { body.classList.remove('open'); hdr?.classList.remove('open'); }
}

export function switchPDTab(idx, tab) {
  const activeTab    = document.getElementById(`tab-${tab}-${idx}`);
  const isAlreadyActive = activeTab?.classList.contains('active');
  ['words','mindset','roadmap','fullplan'].forEach(t => {
    document.getElementById(`tab-${t}-${idx}`)?.classList.remove('active');
    document.getElementById(`panel-${t}-${idx}`)?.classList.add('hidden');
  });
  if (!isAlreadyActive) {
    activeTab?.classList.add('active');
    document.getElementById(`panel-${tab}-${idx}`)?.classList.remove('hidden');
  }
}

/* ── YOUR WORDS ──────────────────────────────────────── */
async function saveWordFields(idx) {
  if (!intentions[idx]) return;
  intentions[idx].words = {
    mission:      document.getElementById(`w-mission-${idx}`)?.value.trim()      || '',
    affirmations: document.getElementById(`w-affirmations-${idx}`)?.value.trim() || '',
    beliefs:      document.getElementById(`w-beliefs-${idx}`)?.value.trim()      || '',
    quotes:       document.getElementById(`w-quotes-${idx}`)?.value.trim()       || '',
    insights:     document.getElementById(`w-insights-${idx}`)?.value.trim()     || ''
  };
  await saveIntentions();
  toast('Words saved ✓', 'success');
}

/* ── AI GENERATION ───────────────────────────────────── */
export async function generateMindset(idx) {
  const btn = document.getElementById(`btn-mindset-${idx}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
  try {
    const pb      = getPB();
    const context = buildContext(pb);
    const title   = intentions[idx]?.title || '';
    const system  = `You are a personal development AI coach. User profile:\n${context}\n\nRespond ONLY with valid JSON in this exact shape — no other text:\n{"affirmations":["..."],"beliefs":["..."],"attitudes":[{"title":"...","body":"..."}],"stoic":["..."],"quotes":["quote — Author"],"meditation":"..."}`;
    const user    = `Generate a powerful mindset library for the intention: "${title}". Include 6 affirmations, 5 beliefs, 4 attitudes with title+body, 5 stoic principles (each a short first-person principle the user can live by, in the spirit of Marcus Aurelius / Epictetus / Seneca, tailored to this intention), 5 real famous quotes (each "quote — Author") from notable thinkers directly relevant to this intention, and 1 short meditation sentence.`;
    const raw     = await callClaude(system, user, 1000);
    const result  = JSON.parse(raw.replace(/```json|```/g,'').trim());
    intentions[idx].mindset = result;
    await saveIntentions();
    const panel = document.getElementById(`panel-mindset-${idx}`);
    if (panel) panel.innerHTML = renderMindsetResult(result, idx);
    toast('AI Library generated ✓', 'success');
  } catch(e) {
    toast('Generation failed. Try again.', 'error');
    console.error(e);
    const btn2 = document.getElementById(`btn-mindset-${idx}`);
    if (btn2) { btn2.disabled = false; btn2.textContent = '✦ Generate AI Library'; }
  }
}

export async function generateAchievers(idx) {
  const btn = document.getElementById(`btn-roadmap-${idx}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
  try {
    const pb      = getPB();
    const context = buildContext(pb);
    const title   = intentions[idx]?.title || '';
    const system  = `You are a strategic life coach AI building a "Famous Achiever Blueprint". User profile:\n${context}\n\nFor the user's intention, identify the single most famous person who has accomplished a goal closely matching it, then extract the playbook they used. Be specific, name real people, real podcasts, real shows, real channels — no generic placeholders.\n\nRespond ONLY with valid JSON — no prose, no markdown fences:\n{\n  "achiever": {\n    "name": "Full Name",\n    "tagline": "One-line description of who they are and what they achieved relevant to this goal."\n  },\n  "media": {\n    "youtube":  ["specific channel or video title 1", "..."],\n    "articles": ["specific publication + topic 1", "..."],\n    "podcasts": ["specific show + episode/host 1", "..."]\n  },\n  "risks_taken":        ["specific risk 1", "specific risk 2", "..."],\n  "networking_strategy":["specific tactic 1", "..."],\n  "critical_skills":    ["skill 1", "skill 2", "..."],\n  "mindset_attitudes":  ["mindset 1", "mindset 2", "..."],\n  "roadmap": ["practical step 1 the user can take today", "step 2", "...", "step 7"]\n}\n\nRules: each array has 3-5 concrete entries; roadmap has exactly 7 steps the USER can act on (not the achiever); no entry exceeds 160 characters; output valid JSON only.`;
    const user    = `Build the Famous Achiever Blueprint for intention: "${title}".`;
    const raw     = await callClaude(system, user, 1800);
    const result  = JSON.parse(raw.replace(/```json|```/g,'').trim());
    intentions[idx].achievers = result;
    await saveIntentions();
    const panel = document.getElementById(`panel-roadmap-${idx}`);
    if (panel) panel.innerHTML = renderRoadmapResult(result, idx);
    toast('AI Roadmap generated ✓', 'success');
  } catch(e) {
    toast('Generation failed. Try again.', 'error');
    console.error(e);
    const btn2 = document.getElementById(`btn-roadmap-${idx}`);
    if (btn2) { btn2.disabled = false; btn2.textContent = '✦ Generate AI Roadmap'; }
  }
}

/* ── FULL PLAN ────────────────────────────────────────── */
function buildFullPlanPanel(intention, idx) {
  if (!intention.fullPlan) {
    return `
      <div class="ai-panel-intro">
        <p>Run the full 3-pass pipeline — achievers, 13 affirmations, mental attitudes, active beliefs, and a 12-week roadmap — all saved to your account.</p>
        <button class="ai-gen-btn fullplan-btn" id="btn-fullplan-${idx}" onclick="generateFullPlan(${idx})">✦ Generate Full Plan</button>
      </div>`;
  }
  return renderFullPlanResult(intention.fullPlan, idx);
}

function renderFullPlanResult(plan, idx) {
  const achievers = (plan.achievers || []).map(a => `
    <div class="achiever-card">
      <div class="achiever-name">${esc(a.name)} <span class="achiever-domain">— ${esc(a.domain)}</span></div>
      <div class="achiever-belief">"${esc(a.identity_belief)}"</div>
      <div class="achiever-principle">↳ ${esc(a.principle)}</div>
    </div>`).join('');
  const attitudes = (plan.mental_attitudes || []).map(a => `
    <div class="attitude-card">
      <div class="attitude-title">${esc(a.label)}</div>
      <div class="attitude-body">${esc(a.description)}</div>
    </div>`).join('');
  const beliefs = (plan.active_beliefs || []).map(b =>
    `<div class="belief-item"><span class="belief-arrow">→</span>${esc(b)}</div>`).join('');
  const affirmations = (plan.affirmations || []).map(a =>
    `<span class="affirmation-pill">${esc(a)}</span>`).join('');

  const EP_COLORS = ['#F5A623','#60A0FF','#4ADE80','#BF5AF2','#FF6B6B','#FFD700'];
  const strategyBlocks = (plan.strategy_blocks || []).map((sb, i) => `
    <div style="background:#1A1A1A;border-left:3px solid ${EP_COLORS[i] || '#888'};border-radius:0 8px 8px 0;padding:12px 14px;margin-bottom:8px;">
      <div style="font-family:var(--vault-mono);font-size:9px;color:${EP_COLORS[i] || '#888'};font-weight:800;letter-spacing:1px;margin-bottom:6px;">${esc(sb.block || '')}</div>
      <div style="font-size:12px;color:#ddd;line-height:1.6;">${esc(sb.coaching || '')}</div>
    </div>`).join('');

  const strategySection = strategyBlocks ? `
    <div class="mindset-section">
      <div class="mindset-section-title" style="color:#F5A623;">◈ ${esc(plan.entrepreneur_card || 'IDENTITY')} — STRATEGY BLOCKS</div>
      ${strategyBlocks}
    </div>` : '';

  return `
    ${strategySection}
    <div class="mindset-section">
      <div class="mindset-section-title">Achiever Wisdom</div>${achievers}
    </div>
    <div class="mindset-section">
      <div class="mindset-section-title">Mental Attitudes</div>${attitudes}
    </div>
    <div class="mindset-section">
      <div class="mindset-section-title">Active Beliefs</div>${beliefs}
    </div>
    <div class="mindset-section">
      <div class="mindset-section-title">13 Affirmations</div>
      <div class="affirmation-pills">${affirmations}</div>
    </div>
    <button class="ai-gen-btn regen" id="btn-fullplan-${idx}"
      onclick="generateFullPlan(${idx})">↺ Regenerate Full Plan</button>`;
}

export async function generateFullPlan(idx) {
  const btn = document.getElementById(`btn-fullplan-${idx}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
  try {
    const pb   = getPB();
    const goal = intentions[idx]?.title || '';
    if (!goal) { toast('No goal set for this intention.', 'error'); return; }
    const entrepreneurCard = (typeof window !== 'undefined' && window.activeEntCard) || null;
    const dangerZones = intentions[idx]?.theMap?.dangerZones || [];
    const res    = await ciApi('generate-content', { goal, pegboard: pb, entrepreneurCard, dangerZones });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Generation failed');
    await saveContentToSupabase(result, goal);
    intentions[idx].fullPlan = result;
    await saveIntentions();
    const panel = document.getElementById(`panel-fullplan-${idx}`);
    if (panel) panel.innerHTML = renderFullPlanResult(result, idx);
    toast('Full plan generated and saved ✓', 'success');
  } catch(e) {
    toast('Generation failed. Try again.', 'error');
    console.error(e);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '✦ Generate Full Plan'; }
  }
}

async function saveContentToSupabase(result, goal) {
  if (!currentUser) throw new Error('Not logged in');
  const scenes = (result.affirmations || []).map((text, i) => ({
    scene_id: i + 1, type: 'affirmation', text,
    sub_text: i === 0 ? 'Ground yourself here.' : i === 12 ? 'Lock it in.' : null
  }));
  const core_blueprint = {
    achievers:        result.achievers        || [],
    affirmations:     result.affirmations     || [],
    mental_attitudes: result.mental_attitudes || [],
    active_beliefs:   result.active_beliefs   || []
  };
  const text_manifest = { belief_system: result.belief_system || '', scenes };
  const { data: contentRow, error: contentErr } = await sb
    .from('user_content')
    .insert({
      user_id: currentUser.id, user_name: getPB()['pb-name'] || '', goal,
      belief_system: result.belief_system || '', core_blueprint, text_manifest,
      viz_script: result.script || '', pipeline_version: '3.1',
      generated_at: result.generated_at || new Date().toISOString()
    })
    .select('id').single();
  if (contentErr) throw new Error(contentErr.message);
  const roadmapRows = [];
  for (const phaseKey of ['phase1', 'phase2', 'phase3']) {
    const phase = result.roadmap?.[phaseKey];
    if (!phase?.weeks) continue;
    for (const w of phase.weeks) {
      roadmapRows.push({
        user_id: currentUser.id, content_id: contentRow.id,
        week: w.week, phase: w.phase, focus: w.focus || '',
        daily_action: w.daily_action || '', milestone: w.milestone || '',
        is_complete: false, completed_at: null
      });
    }
  }
  if (roadmapRows.length > 0) {
    const { error: roadmapErr } = await sb.from('roadmap_items').insert(roadmapRows);
    if (roadmapErr) throw new Error(roadmapErr.message);
  }
}

function openRoadmapForSelected() {
  if (selectedVaultIdx === null || selectedVaultIdx === undefined) {
    toast('Select an intention first', 'info'); return;
  }
  openVaultBuildSheet(selectedVaultIdx);
}
