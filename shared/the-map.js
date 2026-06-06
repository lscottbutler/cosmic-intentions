/* ── THE MAP MODULE (v3) ─────────────────────────────────
   Three time horizons + J# journal coding system.
   Replaces ROADMAP + old Map into one unified tool.
   Depends on globals: intentions, esc, syncIntentionsToSupabase,
   selectedVaultIdx, logActivity, toast
───────────────────────────────────────────────────────── */

/* ── TOGGLE CHECKBOX ─────────────────────────────────── */
async function toggleMapItem(idx, section, itemIdx, checked) {
  const map = intentions[idx]?.theMap;
  if (!map) return;
  if (!map.checks) map.checks = {};
  const key = `${section}-${itemIdx}`;
  map.checks[key] = checked;
  if (checked) logActivity('map_todo', { todo: (map[section]?.[itemIdx]?.text || '').slice(0,60) }, 5);
  if (typeof syncIntentionsToSupabase === 'function') syncIntentionsToSupabase();
  // Re-render just the checkbox label without full re-render
  const el = document.getElementById(`mapItem-${idx}-${key}`);
  if (el) {
    el.style.textDecoration = checked ? 'line-through' : '';
    el.style.color = checked ? '#505058' : '#C8C8D0';
    const cb = document.getElementById(`mapCb-${idx}-${key}`);
    if (cb) cb.checked = checked;
  }
}

/* ── BUILD SHEET PANEL ───────────────────────────────── */
function buildBSTheMapPanel(intent, idx) {
  const map = intent.theMap;

  // Empty state
  if (!map || (!map.thisWeek && !map.thisMonth && !map.terrain)) {
    return `
      <div style="padding:32px 20px;text-align:center;">
        <div style="font-size:28px;margin-bottom:12px;">🗺</div>
        <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:2px;margin-bottom:8px;">THE MAP</div>
        <div style="font-size:12px;color:#505058;line-height:1.7;max-width:280px;margin:0 auto 20px;">
          Your complete terrain — daily actions, monthly milestones, and the domains to master.
          Includes J# codes for your physical journal.
        </div>
        <button id="bsTheMapBtn-${idx}" onclick="bsGenerateTheMap(${idx})"
          style="background:#F5A623;border:none;border-radius:8px;padding:10px 20px;
          font-family:var(--vault-mono);font-size:10px;font-weight:800;color:#000;cursor:pointer;letter-spacing:1px;">
          ◉ BUILD THE MAP →
        </button>
      </div>`;
  }

  const checks = map.checks || {};

  function renderSection(title, color, icon, items, sectionKey, cadence) {
    if (!items || items.length === 0) return '';
    const done  = items.filter((_, i) => checks[`${sectionKey}-${i}`]).length;
    const total = items.length;
    const pct   = Math.round((done / total) * 100);

    const rows = items.map((item, i) => {
      const key     = `${sectionKey}-${i}`;
      const checked = !!checks[key];
      const isJ     = !!item.isJournal;
      return `
        <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;
          border-bottom:1px solid #1a1a1a;cursor:pointer;"
          onclick="toggleMapItem(${idx},'${sectionKey}',${i},!document.getElementById('mapCb-${idx}-${key}').checked)">
          <input type="checkbox" id="mapCb-${idx}-${key}" ${checked ? 'checked' : ''}
            style="margin-top:3px;flex-shrink:0;accent-color:${color};cursor:pointer;"
            onchange="toggleMapItem(${idx},'${sectionKey}',${i},this.checked)" onclick="event.stopPropagation()">
          <div style="flex:1;min-width:0;">
            ${isJ ? `<span style="font-family:var(--vault-mono);font-size:8px;font-weight:800;color:${color};
              background:${color}22;border-radius:3px;padding:1px 5px;letter-spacing:0.5px;margin-right:6px;">📓 JOURNAL</span>` : ''}
            <span id="mapItem-${idx}-${key}"
              style="font-size:12px;line-height:1.6;color:${checked ? '#505058' : '#C8C8D0'};
              ${checked ? 'text-decoration:line-through;' : ''}">${esc(item.text)}</span>
          </div>
        </div>`;
    }).join('');

    return `
      <div style="margin-bottom:4px;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px 8px;background:#111;border-bottom:1px solid #222;">
          <div>
            <span style="font-size:16px;margin-right:8px;">${icon}</span>
            <span style="font-family:var(--vault-mono);font-size:10px;color:${color};font-weight:800;letter-spacing:1.5px;">${title}</span>
            <div style="font-family:var(--vault-mono);font-size:8px;color:#383840;letter-spacing:1px;margin-top:2px;padding-left:24px;">${cadence}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-family:var(--vault-mono);font-size:11px;color:${done===total?color:'#505058'};font-weight:800;">${done}/${total}</div>
            <div style="width:60px;height:3px;background:#252525;border-radius:2px;margin-top:4px;">
              <div style="height:3px;background:${color};border-radius:2px;width:${pct}%;"></div>
            </div>
          </div>
        </div>
        <div style="padding:0 16px;">
          ${rows}
        </div>
      </div>`;
  }

  return `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid #222;">
        <span style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:1px;">◉ THE MAP</span>
        <button onclick="bsGenerateTheMap(${idx})"
          style="background:none;border:1px solid #383838;border-radius:6px;padding:4px 10px;
          font-family:var(--vault-mono);font-size:9px;color:#888;cursor:pointer;">↺ Regenerate</button>
      </div>

      ${renderSection('THIS WEEK', '#F5A623', '⚡', map.thisWeek, 'thisWeek', 'DAILY ACTIONS — RESETS WEEKLY')}
      ${renderSection('THIS MONTH', '#60A0FF', '📅', map.thisMonth, 'thisMonth', 'MILESTONES — RESETS MONTHLY')}
      ${renderSection('THE TERRAIN', '#4ADE80', '🗺', map.terrain, 'terrain', 'MASTER THESE FOREVER')}

      <div style="padding:12px 16px;border-top:1px solid #1a1a1a;">
        <button onclick="navTo('journal')"
          style="width:100%;background:none;border:1px solid #2a2a2a;border-radius:8px;padding:10px;
          font-family:var(--vault-mono);font-size:9px;color:#505058;cursor:pointer;letter-spacing:1px;">
          📓 VIEW JOURNAL INDEX →
        </button>
      </div>
    </div>`;
}

/* ── GENERATE ────────────────────────────────────────── */
async function bsGenerateTheMap(idx) {
  const intent = intentions[idx];
  if (!intent) return;
  const btn = document.getElementById(`bsTheMapBtn-${idx}`);
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Building your map…'; }

  const panel = document.getElementById(`bsPanel-themap-${idx}`);
  if (panel) panel.innerHTML = `
    <div style="padding:48px 20px;text-align:center;">
      <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;letter-spacing:2px;margin-bottom:8px;">◉ BUILDING THE MAP</div>
      <div style="font-size:12px;color:#505058;line-height:1.8;">
        Mapping the full terrain of your goal…<br>
        Generating your J# journal prompts…<br>
        Building your daily, monthly and forever checklist…
      </div>
    </div>`;

  try {
    const res = await fetch('/api/map-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: intent.title })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (!data.thisWeek) throw new Error('Bad response format');

    intent.theMap = { ...data, checks: intent.theMap?.checks || {} };
    if (typeof syncIntentionsToSupabase === 'function') syncIntentionsToSupabase();
    if (selectedVaultIdx === idx && panel) {
      panel.innerHTML = buildBSTheMapPanel(intent, idx);
    }
    if (typeof renderProgressDashboard === 'function' && document.getElementById('page-progress')?.classList.contains('active')) {
      renderProgressDashboard();
    }
  } catch(e) {
    if (panel) panel.innerHTML = `
      <div style="padding:32px 20px;text-align:center;">
        <div style="font-size:12px;color:#F87171;margin-bottom:16px;">Generation failed — ${esc(e.message)}</div>
        <button onclick="bsGenerateTheMap(${idx})"
          style="background:none;border:1px solid #383838;border-radius:6px;padding:8px 16px;
          font-family:var(--vault-mono);font-size:9px;color:#888;cursor:pointer;">Try Again</button>
      </div>`;
  }
}

/* ── JOURNAL INDEX ───────────────────────────────────── */
function renderJournalIndex() {
  const el = document.getElementById('page-journal');
  if (!el) return;

  const entries = [];
  (intentions || []).forEach(intent => {
    const map = intent.theMap;
    if (!map) return;
    const title = intent.title.replace(/^i am\s+/i,'').replace(/\b\w/g, c => c.toUpperCase());
    ['thisWeek','thisMonth','terrain'].forEach(section => {
      (map[section] || []).forEach(item => {
        if (item.isJournal) {
          entries.push({ j: item.j, goal: title, text: item.text, section });
        }
      });
    });
  });

  entries.sort((a,b) => a.j - b.j);

  const sectionLabel = { thisWeek: 'This Week', thisMonth: 'This Month', terrain: 'The Terrain' };
  const sectionColor = { thisWeek: '#F5A623', thisMonth: '#60A0FF', terrain: '#4ADE80' };

  el.innerHTML = `
    <div style="padding:32px 24px;max-width:720px;margin:0 auto;">
      <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:2px;margin-bottom:4px;">◈ JOURNAL INDEX</div>
      <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;">Your J# Index</div>
      <div style="font-size:12px;color:#505058;line-height:1.7;margin-bottom:24px;">
        Each J# is a page in your physical journal. Open this on your phone, find the number, go to that page.
        Write the heading, fill in your personal detail. The app sets the frame — you fill the soul.
      </div>

      ${entries.length === 0 ? `
        <div style="background:#1A1A1A;border:1px solid #222;border-radius:12px;padding:32px;text-align:center;">
          <div style="font-size:28px;margin-bottom:12px;">📓</div>
          <div style="font-size:13px;color:#505058;">No journal entries yet.<br>Generate The Map on a goal to get your J# prompts.</div>
        </div>` : `
        <div style="background:#1A1A1A;border:1px solid #222;border-radius:12px;overflow:hidden;">
          ${entries.map((e, i) => `
            <div style="display:flex;gap:16px;align-items:flex-start;padding:14px 16px;
              ${i < entries.length-1 ? 'border-bottom:1px solid #1f1f1f;' : ''}">
              <div style="font-family:var(--vault-mono);font-size:13px;font-weight:900;color:#F5A623;
                flex-shrink:0;width:32px;text-align:center;">J${e.j}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:12px;color:#ccc;line-height:1.5;">${esc(e.text)}</div>
                <div style="display:flex;gap:8px;margin-top:4px;align-items:center;">
                  <span style="font-family:var(--vault-mono);font-size:8px;color:#505058;">${esc(e.goal)}</span>
                  <span style="font-family:var(--vault-mono);font-size:8px;color:${sectionColor[e.section]};
                    background:${sectionColor[e.section]}22;border-radius:3px;padding:1px 5px;">
                    ${sectionLabel[e.section]}
                  </span>
                </div>
              </div>
            </div>`).join('')}
        </div>`}
    </div>`;
}

/* ── LEGACY STUBS (keep old calls from erroring) ─────── */
function toggleMapAccordion() {}
async function toggleMapTodo() {}
async function generateTheMap() {}
async function bsGenerateRoadmap() {}
async function bsGenerateLibrary() {}
function closeViz() {}
