/* ── THE MAP MODULE ──────────────────────────────────────
   Depends on globals: intentions, esc, getPB, buildContext,
   callClaude, saveIntentions, selectedVaultIdx, logActivity,
   getDailyQuote (content-bank.js)
───────────────────────────────────────────────────────── */

const MAP_EMOJIS = { 1:'🎯', 2:'🔥', 3:'💎', 4:'🗺️', 5:'📊', 6:'🏗️', 7:'🤝', 8:'⚡', 9:'👑' };
const MAP_JOURNAL = n => `CI JOURNAL ${String(n).padStart(3,'0')}`;
if (!window._mapOpen) window._mapOpen = {};

function toggleMapAccordion(idx, compNum) {
  const key = `${idx}-${compNum}`;
  window._mapOpen[key] = !window._mapOpen[key];
  const body  = document.getElementById(`mapBody-${idx}-${compNum}`);
  const chev  = document.getElementById(`mapChev-${idx}-${compNum}`);
  if (body) body.style.display = window._mapOpen[key] ? 'block' : 'none';
  if (chev) chev.style.transform = window._mapOpen[key] ? 'rotate(90deg)' : 'rotate(0deg)';
}

async function toggleMapTodo(idx, compNum, todoIdx, checked) {
  if (!intentions[idx]?.theMap) return;
  if (!intentions[idx].theMap.todos) intentions[idx].theMap.todos = {};
  intentions[idx].theMap.todos[`c${compNum}-${todoIdx}`] = checked;
  if (checked) {
    const comp = (intentions[idx].theMap.components || []).find(c => c.number === compNum);
    const todo = comp?.todos?.[todoIdx] || '';
    logActivity('map_todo', { intention: intentions[idx].title, component: compNum, todo }, 5);
  }
  await saveIntentions();
}

function buildBSTheMapPanel(intent, idx) {
  if (!intent.theMap) {
    return `
      <div class="bs-section" style="border-bottom:none">
        <div class="bs-section-hd">◉ THE MAP</div>
        <p style="padding:8px 20px 4px;font-size:13px;color:#50505A;line-height:1.6">
          Break down this goal through the 9 Components of Goal Success — then find the real person who proves it's possible.
        </p>
        <button class="bs-gen-btn" id="bsTheMapBtn-${idx}"
          onclick="bsGenerateTheMap(${idx})">◉ Generate The Map</button>
      </div>`;
  }
  const m        = intent.theMap;
  const todos    = m.todos || {};
  const mistakes = m.mistakes || [];

  const accordions = (m.components || []).map(c => {
    const key      = `${idx}-${c.number}`;
    const isOpen   = !!window._mapOpen[key];
    const emoji    = MAP_EMOJIS[c.number] || '◉';
    const ref      = MAP_JOURNAL(c.number);
    const mistakeForComp = mistakes.find(mk => mk.component === c.number);
    const todoItems = Array.isArray(c.todos) ? c.todos : (c.action ? [c.action] : []);

    const todoHTML = todoItems.map((t, ti) => {
      const checked = !!todos[`c${c.number}-${ti}`];
      return `<label style="display:flex;gap:10px;align-items:flex-start;padding:6px 0;cursor:pointer;">
        <input type="checkbox" ${checked ? 'checked' : ''} style="margin-top:3px;flex-shrink:0;accent-color:#F5A623;"
          onchange="toggleMapTodo(${idx},${c.number},${ti},this.checked)">
        <span style="font-size:13px;color:${checked?'#505058':'#C8C8D0'};line-height:1.5;${checked?'text-decoration:line-through;':''}">${esc(t)}</span>
      </label>`;
    }).join('');

    const mistakeHTML = mistakeForComp ? `
      <div style="margin-top:12px;padding:10px 12px;background:#1E1010;border-radius:6px;border-left:3px solid #F87171;">
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

  const proof    = m.proof || {};
  const proofKey = `${idx}-proof`;
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

  return `
    <div style="padding:10px 16px 6px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #222;">
      <span style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:1px;">◉ THE MAP</span>
      <button class="bs-section-hd-action" onclick="bsGenerateTheMap(${idx})">↺ Regenerate</button>
    </div>
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

async function bsGenerateTheMap(idx) {
  const btn = document.getElementById(`bsTheMapBtn-${idx}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
  await generateTheMap(idx);
  if (selectedVaultIdx === idx) {
    const panel = document.getElementById(`bsPanel-themap-${idx}`);
    if (panel) panel.innerHTML = buildBSTheMapPanel(intentions[idx], idx);
  }
}

async function generateTheMap(idx) {
  try {
    const pb      = getPB();
    const context = buildContext(pb);
    const title   = intentions[idx]?.title || '';

    const system = `You are a goal success strategist. User profile:\n${context}\n\nYou use the 9 Components of Goal Success framework:\n1. Clarity — vivid picture of the end state\n2. Compelling Why — emotional fuel that survives adversity\n3. Belief — subconscious conviction it's achievable\n4. Plan (with slack) — a map plus habit of navigating\n5. Feedback Loops — regular signal: am I on track?\n6. Environment Design — context shapes behavior more than willpower\n7. Accountability — external commitment mechanisms\n8. Resilience — treating failure as data, not verdict\n9. Identity Alignment — becoming the person who achieves this\n\nFor each component: write a diagnosis specific to this goal, then provide 3 concrete to-do items the user can check off in their journal.\n\nAlso identify the 5-7 most common fatal mistakes people make when pursuing this exact goal. Each mistake maps directly to one of the 9 components — it is the real-world expression of that component failing.\n\nAlso find the single most famous real person who achieved this exact goal (or the closest equivalent). Tell their story briefly, then map their actual journey against all 9 components — marking each as WIN or LOSS.\n\nRespond ONLY with valid JSON — no prose, no markdown:\n{\n  "components": [\n    { "number": 1, "name": "Clarity", "diagnosis": "specific to this goal", "todos": ["concrete action 1", "concrete action 2", "concrete action 3"] },\n    { "number": 2, "name": "Compelling Why", "diagnosis": "...", "todos": ["...", "...", "..."] },\n    { "number": 3, "name": "Belief", "diagnosis": "...", "todos": ["...", "...", "..."] },\n    { "number": 4, "name": "Plan", "diagnosis": "...", "todos": ["...", "...", "..."] },\n    { "number": 5, "name": "Feedback Loops", "diagnosis": "...", "todos": ["...", "...", "..."] },\n    { "number": 6, "name": "Environment Design", "diagnosis": "...", "todos": ["...", "...", "..."] },\n    { "number": 7, "name": "Accountability", "diagnosis": "...", "todos": ["...", "...", "..."] },\n    { "number": 8, "name": "Resilience", "diagnosis": "...", "todos": ["...", "...", "..."] },\n    { "number": 9, "name": "Identity Alignment", "diagnosis": "...", "todos": ["...", "...", "..."] }\n  ],\n  "mistakes": [\n    { "component": 1, "mistake": "brief name of the fatal mistake", "why": "why this kills the goal — specific to this goal" },\n    { "component": 3, "mistake": "...", "why": "..." },\n    { "component": 5, "mistake": "...", "why": "..." },\n    { "component": 7, "mistake": "...", "why": "..." },\n    { "component": 9, "mistake": "...", "why": "..." }\n  ],\n  "proof": {\n    "name": "Full Name",\n    "tagline": "One line: who they are and what they achieved",\n    "story": "2-3 sentence story of how they achieved this goal",\n    "components": [\n      { "number": 1, "name": "Clarity", "verdict": "WIN", "detail": "what they actually did", "quote": "a real verified quote from this person or null" },\n      { "number": 2, "name": "Compelling Why", "verdict": "WIN", "detail": "...", "quote": "..." },\n      { "number": 3, "name": "Belief", "verdict": "LOSS", "detail": "where they struggled", "quote": null },\n      { "number": 4, "name": "Plan", "verdict": "WIN", "detail": "...", "quote": null },\n      { "number": 5, "name": "Feedback Loops", "verdict": "WIN", "detail": "...", "quote": null },\n      { "number": 6, "name": "Environment Design", "verdict": "WIN", "detail": "...", "quote": null },\n      { "number": 7, "name": "Accountability", "verdict": "LOSS", "detail": "...", "quote": null },\n      { "number": 8, "name": "Resilience", "verdict": "WIN", "detail": "...", "quote": "..." },\n      { "number": 9, "name": "Identity Alignment", "verdict": "WIN", "detail": "...", "quote": "..." }\n    ]\n  }\n}\n\nRules: diagnosis max 140 chars; each todo max 100 chars; mistake and why max 120 chars each; detail max 120 chars; quote must be real verified or null — never fabricate; story max 280 chars; output valid JSON only.`;
    const user = `Generate The Map for intention: "${title}".`;

    const raw    = await callClaude(system, user, 2800);
    const result = JSON.parse(raw.replace(/```json|```/g,'').trim());

    intentions[idx].theMap = result;
    await saveIntentions();
    toast('The Map generated ✓', 'success');
  } catch(e) {
    toast('Generation failed. Try again.', 'error');
    console.error(e);
    const btn = document.getElementById(`bsTheMapBtn-${idx}`);
    if (btn) { btn.disabled = false; btn.textContent = '◉ Generate The Map'; }
  }
}

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
