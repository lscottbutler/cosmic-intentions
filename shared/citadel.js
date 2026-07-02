import { LS, esc, intentions, GREY_SHADES } from '../app.js';
import { RM_CIRCLE, LOCK_OPEN, LOCK_CLOSED } from './card-builder.js';
/* ── THE CITADEL — tabbed two-pillar view ────────────────
   Column A = the "become it" pillar (visualize / affirmations /
   beliefs / stoic / attitudes / gratitude, + the Mind Loop).
   Column B = the "do it" pillar (My Action Plan / Proven Actions).
   Goal pills up top are the spine — pick one, both binders refill.
   Reuses the existing roadmap + mindset handlers (global on window).
───────────────────────────────────────────────────────── */

let _goal = 0, _tabA = 'visualize', _tabB = 'plan';
export function citadelSelectGoal(idx) { _goal = idx; renderCitadel(); }
export function citadelTabA(k) { _tabA = k; renderCitadel(); }
export function citadelTabB(k) { _tabB = k; renderCitadel(); }

const A_TABS = [
  ['visualize', 'Visualize', '#7C5CC4'], ['affirmations', 'Affirm', '#F5A623'],
  ['beliefs', 'Beliefs', '#4A9EAD'], ['stoic', 'Stoic', '#5A8EA8'],
  ['attitudes', 'Attitudes', '#48B860'], ['gratitude', 'Gratitude', '#FF8AB8'],
];
const B_TABS = [['plan', 'My Action Plan', '#577590'], ['proven', 'Proven Actions', '#111111']];

const _tabRow = (tabs, active, fn) => `<div class="cit-tabs">${tabs.map(([k, label, c]) =>
  `<button class="cit-tab ${k === active ? 'on' : ''}" style="background:${c}" onclick="${fn}('${k}')">${label}</button>`).join('')}</div>`;
const _activeColor = (tabs, active) => (tabs.find(x => x[0] === active) || [])[2] || '#333';

/* ── Gratitude — a general daily practice (not per-goal) ── */
function _grat() { return LS.get('ci_gratitude') || []; }
export function citadelAddGratitude() {
  const inp = document.getElementById('citGratInput'); const t = (inp?.value || '').trim(); if (!t) return;
  const g = _grat(); g.unshift({ id: Date.now(), text: t.slice(0, 160) }); LS.set('ci_gratitude', g); renderCitadel();
}
export function citadelDelGratitude(id) { LS.set('ci_gratitude', _grat().filter(x => x.id !== id)); renderCitadel(); }

/* ── COLUMN A content ── */
function _panelA(intent, idx) {
  const m = intent.mindset;
  if (_tabA === 'visualize') {
    const img = intent.imageUrl && !String(intent.imageUrl).startsWith('data:')
      ? `<img src="${esc(intent.imageUrl)}" alt="" style="width:100%;border-radius:8px;aspect-ratio:16/9;object-fit:cover;">`
      : `<div style="width:100%;aspect-ratio:16/9;border-radius:8px;background:var(--sunken);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:13px;">Your visualization image</div>`;
    return `${img}
      <div onclick="launchMindset(event)" title="Play your mindset loop" style="display:flex;align-items:center;gap:12px;background:linear-gradient(90deg,#7C5CC4,#5a3fa0);color:#fff;border-radius:10px;padding:11px 14px;margin-top:10px;cursor:pointer;">
        <span style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">▶</span>
        <div><b>Mind Loop</b><br><span style="opacity:.85;font-size:11px;">Play your goals &amp; mindset back to you</span></div>
      </div>`;
  }
  if (_tabA === 'gratitude') {
    const g = _grat();
    return `<div style="font-size:13px;color:var(--muted);margin-bottom:10px;">A daily gratitude practice.</div>
      ${g.map(x => `<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);"><span style="color:#FF8AB8;">♥</span><span style="flex:1;min-width:0;font-size:14px;color:var(--text);">${esc(x.text)}</span><button onclick="citadelDelGratitude(${x.id})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px;">×</button></div>`).join('')}
      <div style="display:flex;gap:6px;margin-top:10px;"><input id="citGratInput" maxlength="160" placeholder="I'm grateful for…" onkeydown="if(event.key==='Enter')citadelAddGratitude()" style="flex:1;min-width:0;border:1px solid var(--border);border-radius:6px;padding:10px;background:var(--sunken);color:var(--text);"><button onclick="citadelAddGratitude()" style="background:#FF8AB8;border:none;border-radius:6px;color:#3a1020;font-weight:800;padding:0 16px;cursor:pointer;">+</button></div>`;
  }
  if (!m) {
    return `<div style="text-align:center;padding:34px 6px;color:var(--muted);">
      <p style="margin-bottom:14px;font-size:14px;">No mindset library yet for this goal.</p>
      <button onclick="generateMindset(${idx})" style="background:var(--brand);border:none;border-radius:8px;padding:12px 20px;font-weight:800;color:#0a0a0a;cursor:pointer;">✦ Generate AI Library</button></div>`;
  }
  const empty = '<div style="color:var(--muted);font-style:italic;padding:8px 0;">None generated yet.</div>';
  if (_tabA === 'affirmations') return (m.affirmations || []).map(a => `<div style="background:var(--sunken);border-left:3px solid #F5A623;border-radius:8px;padding:12px 14px;margin-bottom:10px;font-size:15px;font-weight:600;color:var(--text);">${esc(a)}</div>`).join('') || empty;
  if (_tabA === 'beliefs')  return (m.beliefs || []).map(b => `<div style="padding:9px 0;border-bottom:1px solid var(--border);font-size:14px;color:var(--text);">→ ${esc(b)}</div>`).join('') || empty;
  if (_tabA === 'stoic')    return (m.stoic || []).map(s => `<div style="padding:9px 0;border-bottom:1px solid var(--border);font-size:14px;color:var(--text);font-style:italic;">“${esc(s)}”</div>`).join('') || empty;
  if (_tabA === 'attitudes') return (m.attitudes || []).map(a => `<div style="background:var(--sunken);border-radius:8px;padding:12px;margin-bottom:8px;"><div style="font-weight:800;color:var(--text);">${esc(a.title || a)}</div><div style="font-size:13px;color:var(--muted);margin-top:2px;">${esc(a.body || '')}</div></div>`).join('') || empty;
  return '';
}

/* ── COLUMN B content (reuses roadmap handlers) ── */
function _panelB(intent, idx) {
  const r = intent.roadmapAI;
  if (_tabB === 'plan') {
    const uTasks = (r && r.userTasks) || [];
    const rows = uTasks.map(t => `<div style="display:flex;gap:8px;align-items:center;padding:5px 0;">
      <button onclick="deleteRoadmapUserTask(${idx},${t.id})" title="Delete" style="${RM_CIRCLE}font-size:14px;">✕</button>
      <span style="flex:1;min-width:0;font-size:13px;color:${t.done ? 'var(--muted)' : 'var(--text)'};${t.done ? 'text-decoration:line-through;' : ''}">${esc(t.text)}</span>
      <button onclick="toggleRoadmapUserTaskDone(${idx},${t.id})" style="${RM_CIRCLE}font-size:14px;">${t.done ? '✓' : '○'}</button>
    </div>`).join('');
    return `<div style="font-family:var(--vault-mono);font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:8px;">✎ YOUR ACTIONS · ${uTasks.length}/25</div>
      ${rows || '<div style="color:var(--muted);font-style:italic;margin-bottom:8px;">No actions yet — add your first below.</div>'}
      ${uTasks.length < 25 ? `<div style="display:flex;gap:6px;margin-top:8px;">
        <textarea id="roadmapUserInput-${idx}" maxlength="160" rows="2" placeholder="Add your own action…" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();addRoadmapUserTask(${idx});}" style="flex:1;min-width:0;border:1px solid var(--border);border-radius:6px;padding:9px;background:var(--sunken);color:var(--text);font-family:inherit;resize:vertical;"></textarea>
        <button onclick="addRoadmapUserTask(${idx})" style="flex-shrink:0;background:#577590;border:none;border-radius:6px;color:#fff;font-weight:800;padding:0 16px;cursor:pointer;">+ ADD</button></div>` : ''}`;
  }
  // proven
  if (!r || !(r.tasks || []).length) {
    return `<div style="text-align:center;padding:34px 6px;color:var(--muted);">
      <p style="margin-bottom:14px;font-size:14px;">No proven actions yet.</p>
      <button onclick="generateRoadmapAI(${idx})" style="background:#577590;border:none;border-radius:8px;padding:12px 20px;font-weight:800;color:#fff;cursor:pointer;">✦ Generate My 10 Steps</button></div>`;
  }
  const dones = r.done || {}, locks = r.locks || {};
  return (r.tasks || []).map((t, i) => { const d = !!dones[i], l = !!locks[i]; return `<div style="display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);">
    <button onclick="deleteRoadmapTask(${idx},${i})" title="Delete" style="${RM_CIRCLE}font-size:14px;">✕</button>
    <span style="${RM_CIRCLE}font-family:var(--vault-mono);font-size:13px;font-weight:800;">${i + 1}</span>
    <span style="flex:1;min-width:0;font-size:13px;color:${d ? 'var(--muted)' : 'var(--text)'};${d ? 'text-decoration:line-through;' : ''}">${esc(t)}</span>
    <button onclick="toggleRoadmapTaskDone(${idx},${i})" style="${RM_CIRCLE}font-size:14px;">${d ? '✓' : '○'}</button>
    <button id="roadmapLock-${idx}-${i}" onclick="toggleRoadmapLock(${idx},${i})" style="${RM_CIRCLE}">${l ? LOCK_CLOSED : LOCK_OPEN}</button>
  </div>`; }).join('') + `<button onclick="generateRoadmapAI(${idx})" style="width:100%;margin-top:12px;background:#577590;border:none;border-radius:6px;color:#fff;font-weight:700;letter-spacing:1px;padding:12px;cursor:pointer;">↺ REGENERATE</button>`;
}

export function renderCitadel() {
  const el = document.getElementById('citadelBody'); if (!el) return;
  const list = intentions || [];
  if (!list.length) { el.innerHTML = `<div class="cit-wrap"><p style="color:var(--muted);">No goals yet — add one on your Pegboard first.</p></div>`; return; }
  if (_goal >= list.length) _goal = 0;
  const intent = list[_goal];

  const pills = list.map((it, idx) => { const s = GREY_SHADES[idx % GREY_SHADES.length];
    return `<button class="cit-gpill ${idx === _goal ? 'on' : ''}" style="background:${s.bg};color:${s.text}" onclick="citadelSelectGoal(${idx})"><span class="n">${idx + 1}</span> ${esc(it.title)}</button>`; }).join('');

  el.innerHTML = `<div class="cit-wrap">
    <div class="cit-spine">${pills}</div>
    <div class="cit-cols">
      <div>
        <div class="cit-colhead">◈ The Citadel — become it</div>
        ${_tabRow(A_TABS, _tabA, 'citadelTabA')}
        <div class="cit-panel" style="border-top-color:${_activeColor(A_TABS, _tabA)}">${_panelA(intent, _goal)}</div>
      </div>
      <div>
        <div class="cit-colhead">◈ The Roadmap — do it</div>
        ${_tabRow(B_TABS, _tabB, 'citadelTabB')}
        <div class="cit-panel" style="border-top-color:${_activeColor(B_TABS, _tabB)}">${_panelB(intent, _goal)}</div>
      </div>
    </div>
  </div>`;
}

if (typeof window !== 'undefined') window.renderCitadel = renderCitadel;
