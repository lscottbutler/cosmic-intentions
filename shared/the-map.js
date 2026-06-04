/* ── THE MAP MODULE ──────────────────────────────────────
   Depends on globals: intentions, esc, getPB, buildContext,
   callClaude, saveIntentions, selectedVaultIdx, logActivity,
   getDailyQuote (content-bank.js)

   Todo format (v2): { text: string, citation: string }
   Todo format (v1): string  ← handled everywhere for backward compat
───────────────────────────────────────────────────────── */

const MAP_EMOJIS  = { 1:'🎯', 2:'🔥', 3:'💎', 4:'🗺️', 5:'📊', 6:'🏗️', 7:'🤝', 8:'⚡', 9:'👑' };
const MAP_JOURNAL = n => `CI JOURNAL ${String(n).padStart(3,'0')}`;
if (!window._mapOpen) window._mapOpen = {};

/* Normalise a todo item to { text, citation } regardless of format */
function _mapTodoText(t)     { return typeof t === 'string' ? t : (t?.text || ''); }
function _mapTodoCitation(t) { return typeof t === 'string' ? '' : (t?.citation || ''); }

/* ── ACCORDION ───────────────────────────────────────── */
function toggleMapAccordion(idx, compNum) {
  const key = `${idx}-${compNum}`;
  window._mapOpen[key] = !window._mapOpen[key];
  const body = document.getElementById(`mapBody-${idx}-${compNum}`);
  const chev = document.getElementById(`mapChev-${idx}-${compNum}`);
  if (body) body.style.display = window._mapOpen[key] ? 'block' : 'none';
  if (chev) chev.style.transform = window._mapOpen[key] ? 'rotate(90deg)' : 'rotate(0deg)';
}

async function toggleMapTodo(idx, compNum, todoIdx, checked) {
  if (!intentions[idx]?.theMap) return;
  if (!intentions[idx].theMap.todos) intentions[idx].theMap.todos = {};
  intentions[idx].theMap.todos[`c${compNum}-${todoIdx}`] = checked;
  if (checked) {
    const comp = (intentions[idx].theMap.components || []).find(c => c.number === compNum);
    const todo = _mapTodoText(comp?.todos?.[todoIdx] || '');
    logActivity('map_todo', { intention: intentions[idx].title, component: compNum, todo }, 5);
  }
  await saveIntentions();
}

/* ── BUILD SHEET PANEL ───────────────────────────────── */
function buildBSTheMapPanel(intent, idx) {
  if (!intent.theMap) {
    return `
      <div class="bs-section" style="border-bottom:none">
        <div class="bs-section-hd">◉ THE MAP</div>
        <p style="padding:8px 20px 4px;font-size:13px;color:#50505A;line-height:1.6">
          Break down this goal through the 9 Components of Goal Success — anchored to a real person who proved it's possible.
        </p>
        <button class="bs-gen-btn" id="bsTheMapBtn-${idx}"
          onclick="bsGenerateTheMap(${idx})">◉ Generate The Map</button>
      </div>`;
  }

  const m        = intent.theMap;
  const todos    = m.todos    || {};
  const mistakes = m.mistakes || [];
  const anchor   = m.celebrity_anchor;

  const accordions = (m.components || []).map(c => {
    const key       = `${idx}-${c.number}`;
    const isOpen    = !!window._mapOpen[key];
    const emoji     = MAP_EMOJIS[c.number] || '◉';
    const ref       = MAP_JOURNAL(c.number);
    const mistakeForComp = mistakes.find(mk => mk.component === c.number);
    const todoItems = Array.isArray(c.todos) ? c.todos : (c.action ? [c.action] : []);

    const todoHTML = todoItems.map((t, ti) => {
      const checked  = !!todos[`c${c.number}-${ti}`];
      const text     = _mapTodoText(t);
      const citation = _mapTodoCitation(t);
      return `<label style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;cursor:pointer;border-bottom:1px solid #111;">
        <input type="checkbox" ${checked ? 'checked' : ''} style="margin-top:3px;flex-shrink:0;accent-color:#F5A623;"
          onchange="toggleMapTodo(${idx},${c.number},${ti},this.checked)">
        <div style="flex:1;min-width:0;">
          <span style="font-size:13px;color:${checked?'#505058':'#C8C8D0'};line-height:1.5;${checked?'text-decoration:line-through;':''}">${esc(text)}</span>
          ${citation ? `<div style="font-size:11px;color:#505058;font-style:italic;line-height:1.5;margin-top:3px;padding-left:6px;border-left:2px solid #2A2A2A;">${esc(citation)}</div>` : ''}
        </div>
      </label>`;
    }).join('');

    const mistakeHTML = mistakeForComp ? `
      <div style="margin-top:10px;padding:10px 12px;background:#1E1010;border-radius:6px;border-left:3px solid #F87171;">
        <div style="font-family:var(--vault-mono);font-size:9px;color:#F87171;letter-spacing:1px;margin-bottom:4px;">⚠ FATAL MISTAKE</div>
        <div style="font-size:12px;color:#F87171;font-weight:600;margin-bottom:2px;">${esc(mistakeForComp.mistake)}</div>
        <div style="font-size:12px;color:#80808C;line-height:1.5;">${esc(mistakeForComp.why)}</div>
      </div>` : '';

    return `
    <div style="border-bottom:1px solid #222;">
      <div onclick="toggleMapAccordion(${idx},${c.number})"
        style="display:flex;align-items:center;gap:10px;padding:13px 16px;cursor:pointer;user-select:none;">
        <span style="font-size:18px;line-height:1;">${emoji}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-family:var(--vault-mono);font-size:9px;color:#50505A;letter-spacing:1px;">${ref}</div>
          <div style="font-family:var(--vault-mono);font-size:11px;color:#F5A623;font-weight:800;letter-spacing:1px;">${esc(c.name)}</div>
        </div>
        <span id="mapChev-${idx}-${c.number}" style="color:#50505A;font-size:16px;transition:transform 0.2s;transform:${isOpen?'rotate(90deg)':'rotate(0deg)'}">›</span>
      </div>
      <div id="mapBody-${idx}-${c.number}" style="display:${isOpen?'block':'none'};padding:0 16px 14px;">
        <div style="font-size:13px;color:#909098;line-height:1.6;margin-bottom:10px;">${esc(c.diagnosis)}</div>
        ${todoHTML}
        ${mistakeHTML}
      </div>
    </div>`;
  }).join('');

  const proof     = m.proof || {};
  const proofKey  = `${idx}-proof`;
  const proofOpen = !!window._mapOpen[proofKey];
  const proofRows = (proof.components || []).map(c => {
    const win = c.verdict === 'WIN';
    return `
      <div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #1E1E1E;align-items:flex-start;">
        <span style="font-family:var(--vault-mono);font-size:9px;font-weight:800;padding:2px 6px;border-radius:3px;margin-top:2px;flex-shrink:0;background:${win?'#1A3A1A':'#3A1A1A'};color:${win?'#4ADE80':'#F87171'}">${win?'WIN':'LOSS'}</span>
        <div>
          <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;letter-spacing:1px;margin-bottom:2px;">${esc(c.name)}</div>
          <div style="font-size:12px;color:#B0B0BC;line-height:1.5;">${esc(c.detail)}</div>
          ${c.quote ? `<div style="font-size:12px;color:#606068;line-height:1.5;margin-top:5px;padding-left:8px;border-left:2px solid #333;font-style:italic;">"${esc(c.quote)}"</div>` : ''}
        </div>
      </div>`;
  }).join('');

  const _mapQ = (typeof getDailyQuote === 'function') ? getDailyQuote() : null;
  const _mapQuoteHTML = _mapQ ? `
    <div style="padding:10px 16px 8px;border-bottom:1px solid #1A1A1A;">
      <div style="font-size:11px;color:#505058;font-style:italic;line-height:1.6;">"${_mapQ.text}"</div>
      <div style="font-size:10px;color:#383840;margin-top:3px;letter-spacing:0.5px;">— ${_mapQ.author}</div>
    </div>` : '';

  const anchorBanner = anchor ? `
    <div style="padding:8px 16px;background:#1A1A10;border-bottom:1px solid #2A2A1A;display:flex;align-items:center;gap:8px;">
      <span style="font-size:14px;">⚡</span>
      <div>
        <div style="font-family:var(--vault-mono);font-size:9px;color:#F5A623;letter-spacing:1px;">CELEBRITY ANCHOR</div>
        <div style="font-size:12px;color:#C8C870;font-weight:600;">${esc(anchor.name)}</div>
        ${anchor.tagline ? `<div style="font-size:11px;color:#606058;">${esc(anchor.tagline)}</div>` : ''}
      </div>
    </div>` : '';

  return `
    <div style="padding:10px 16px 6px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #222;">
      <span style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:1px;">◉ THE MAP</span>
      <button class="bs-section-hd-action" onclick="bsGenerateTheMap(${idx})">↺ Regenerate</button>
    </div>
    ${anchorBanner}
    ${_mapQuoteHTML}
    ${accordions}
    <div style="border-bottom:1px solid #222;">
      <div onclick="(() => { window._mapOpen['${proofKey}']=!window._mapOpen['${proofKey}']; const b=document.getElementById('mapBody-${idx}-proof'); const ch=document.getElementById('mapChev-${idx}-proof'); if(b) b.style.display=window._mapOpen['${proofKey}']?'block':'none'; if(ch) ch.style.transform=window._mapOpen['${proofKey}']?'rotate(90deg)':'rotate(0deg)'; })()"
        style="display:flex;align-items:center;gap:10px;padding:13px 16px;cursor:pointer;user-select:none;">
        <span style="font-size:18px;line-height:1;">🏆</span>
        <div style="flex:1;">
          <div style="font-family:var(--vault-mono);font-size:9px;color:#50505A;letter-spacing:1px;">THE HUMAN PROOF</div>
          <div style="font-family:var(--vault-mono);font-size:11px;color:#EFEFEF;font-weight:800;">${esc(proof.name||'')}</div>
        </div>
        <span id="mapChev-${idx}-proof" style="color:#50505A;font-size:16px;transition:transform 0.2s;transform:${proofOpen?'rotate(90deg)':'rotate(0deg)'}">›</span>
      </div>
      <div id="mapBody-${idx}-proof" style="display:${proofOpen?'block':'none'};padding:0 16px 14px;">
        <div style="font-size:12px;color:#50505A;margin-bottom:6px;">${esc(proof.tagline||'')}</div>
        <div style="font-size:13px;color:#909098;line-height:1.6;margin-bottom:12px;">${esc(proof.story||'')}</div>
        ${proofRows}
      </div>
    </div>`;
}

/* ── GENERATE WRAPPERS ───────────────────────────────── */
async function bsGenerateTheMap(idx) {
  const btn = document.getElementById(`bsTheMapBtn-${idx}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
  await generateTheMap(idx);
  if (selectedVaultIdx === idx) {
    const panel = document.getElementById(`bsPanel-themap-${idx}`);
    if (panel) panel.innerHTML = buildBSTheMapPanel(intentions[idx], idx);
  }
}

/* ── MULTI-PASS GENERATION ───────────────────────────── */
async function generateTheMap(idx) {
  const title   = intentions[idx]?.title || '';
  const pb      = getPB();
  const context = buildContext(pb);

  try {
    toast('Pass 1 — Finding your celebrity anchor…', '');

    /* ── PASS 1: Celebrity research ────────────────────── */
    const p1System = `You are a goal success researcher. Identify the single most famous real person who achieved a goal matching the one given. Be specific — name the person, their exact mechanism, what most people copy wrong about them. Return valid JSON only.`;
    const p1User   = `Goal: "${title}"\n\nRespond with valid JSON only:\n{\n  "name": "Full Name",\n  "tagline": "One line: who they are and what they achieved for this goal",\n  "key_mechanisms": [\n    { "component": 1, "behavior": "The exact specific behavior (not 'worked hard' — the precise action)", "citation": "One punchy sentence with their specific story or little-known quote. Max 120 chars." },\n    { "component": 2, "behavior": "...", "citation": "..." },\n    { "component": 3, "behavior": "...", "citation": "..." },\n    { "component": 4, "behavior": "...", "citation": "..." },\n    { "component": 5, "behavior": "...", "citation": "..." },\n    { "component": 6, "behavior": "...", "citation": "..." },\n    { "component": 7, "behavior": "...", "citation": "..." },\n    { "component": 8, "behavior": "...", "citation": "..." },\n    { "component": 9, "behavior": "...", "citation": "..." }\n  ]\n}\nRules: citations must be specific stories or real quotes — never generic. Max 120 chars each. Output valid JSON only.`;

    const p1Raw    = await callClaude(p1System, p1User, 800);
    const celebrity = JSON.parse(p1Raw.replace(/```json|```/g,'').trim());

    toast('Pass 2 — Building your Map with celebrity citations…', '');

    /* ── PASS 2: Full Map with citations baked in ──────── */
    const mechanismContext = celebrity.key_mechanisms
      .map(m => `Component ${m.component}: ${m.behavior} — Citation: "${m.citation}"`)
      .join('\n');

    const p2System = `You are a goal success strategist. User profile:\n${context}\n\nCelebrity anchor for this goal: ${celebrity.name} — ${celebrity.tagline}\n\nTheir proven mechanisms mapped to the 9 Components:\n${mechanismContext}\n\nYou use the 9 Components of Goal Success:\n1. Clarity 2. Compelling Why 3. Belief 4. Plan 5. Feedback Loops 6. Environment Design 7. Accountability 8. Resilience 9. Identity Alignment\n\nFor each component: write a specific diagnosis for this goal, then 3 todos. Each todo MUST have:\n- text: a concrete action the user can take this week (not advice — an action)\n- citation: the celebrity's specific behavior that proves this works (from the mechanisms above — be direct, punchy, max 100 chars)\n\nAlso identify 5-7 fatal mistakes specific to this goal (mapped to components).\nAlso build the Human Proof section using the celebrity anchor.\n\nRespond ONLY with valid JSON:\n{\n  "celebrity_anchor": { "name": "...", "tagline": "..." },\n  "components": [\n    {\n      "number": 1, "name": "Clarity",\n      "diagnosis": "specific to this goal, max 140 chars",\n      "todos": [\n        { "text": "concrete action the user takes this week", "citation": "celebrity's specific behavior that proves this — punchy, max 100 chars" },\n        { "text": "...", "citation": "..." },\n        { "text": "...", "citation": "..." }\n      ]\n    }\n  ],\n  "mistakes": [\n    { "component": 1, "mistake": "name of fatal mistake", "why": "why it kills this goal" }\n  ],\n  "proof": {\n    "name": "...", "tagline": "...", "story": "...",\n    "components": [\n      { "number": 1, "name": "Clarity", "verdict": "WIN", "detail": "...", "quote": "real verified quote or null" }\n    ]\n  }\n}\nRules: todos.text must be an action (starts with a verb). todos.citation must name the celebrity and be specific. No generic advice. Output valid JSON only.`;

    const p2User = `Generate The Map for: "${title}"`;
    const p2Raw  = await callClaude(p2System, p2User, 3200);
    const result = JSON.parse(p2Raw.replace(/```json|```/g,'').trim());

    intentions[idx].theMap = result;
    await saveIntentions();
    toast('The Map generated ✓', 'success');

  } catch(e) {
    toast('Generation failed — try again.', 'error');
    console.error(e);
    const btn = document.getElementById(`bsTheMapBtn-${idx}`);
    if (btn) { btn.disabled = false; btn.textContent = '◉ Generate The Map'; }
  }
}

/* ── BUILD SHEET PANEL WRAPPERS ──────────────────────── */
async function bsGenerateRoadmap(idx) {
  const btn = document.getElementById(`bsRoadmapBtn-${idx}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
  await generateAchievers(idx);
  if (selectedVaultIdx === idx) {
    const panel = document.getElementById(`bsPanel-roadmap-${idx}`);
    if (panel) panel.innerHTML = buildBSRoadmapPanel(intentions[idx], idx);
  }
}

async function bsGenerateLibrary(idx) {
  const btn = document.getElementById(`bsLibraryBtn-${idx}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
  await generateMindset(idx);
  if (selectedVaultIdx === idx) {
    const panel = document.getElementById(`bsPanel-library-${idx}`);
    if (panel) panel.innerHTML = buildBSLibraryPanel(intentions[idx], idx);
  }
}

function closeViz() {}
