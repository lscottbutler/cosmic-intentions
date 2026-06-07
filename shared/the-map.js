/* ── THE MAP MODULE (v4) ─────────────────────────────────
   5-section personalized goal framework:
   THIS WEEK / DANGER ZONES / MINDSET AUDIT / THIS MONTH / THE TERRAIN
   + PRACTICE FEED → viz players, gratitude, meditation
   Depends on globals: intentions, esc, syncIntentionsToSupabase,
   selectedVaultIdx, logActivity, toast
───────────────────────────────────────────────────────── */

/* ── SEED PLAYERS WITH GOAL AFFIRMATIONS ─────────────── */
function seedGoalPractice(idx) {
  const map = intentions[idx]?.theMap;
  if (!map?.practice) return;
  const p = map.practice;
  if (p.vizAffirmations?.length) {
    localStorage.setItem('ci_goal_affirmations', JSON.stringify(p.vizAffirmations));
    localStorage.setItem('ci_goal_affirmations_idx', String(idx));
  }
  if (p.gratitudeItems?.length) {
    localStorage.setItem('ci_goal_gratitude', JSON.stringify(p.gratitudeItems));
  }
  if (p.meditationFocus) {
    localStorage.setItem('ci_goal_meditation', p.meditationFocus);
  }
}

/* ── TOGGLE CHECKBOX ─────────────────────────────────── */
async function toggleMapItem(idx, section, itemIdx, checked) {
  const map = intentions[idx]?.theMap;
  if (!map) return;
  if (!map.checks) map.checks = {};
  const key = `${section}-${itemIdx}`;
  map.checks[key] = checked;
  if (checked) logActivity('map_todo', { todo: (map[section]?.[itemIdx]?.text || '').slice(0,60) }, 5);
  if (typeof syncIntentionsToSupabase === 'function') syncIntentionsToSupabase();
  const el = document.getElementById(`mapItem-${idx}-${key}`);
  if (el) {
    el.style.textDecoration = checked ? 'line-through' : '';
    el.style.color = checked ? '#505058' : '#C8C8D0';
    const cb = document.getElementById(`mapCb-${idx}-${key}`);
    if (cb) cb.checked = checked;
  }
}

/* ── RENDER: STANDARD CHECKLIST SECTION ─────────────── */
function _renderCheckSection(title, color, icon, items, sectionKey, cadence, idx) {
  if (!items || items.length === 0) return '';
  const checks = (intentions[idx]?.theMap?.checks) || {};
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
            background:${color}22;border-radius:3px;padding:1px 5px;letter-spacing:0.5px;margin-right:6px;margin-bottom:3px;display:inline-block;">📓 J${item.j}</span>` : ''}
          <span id="mapItem-${idx}-${key}"
            style="font-size:12px;line-height:1.6;color:${checked ? '#505058' : '#C8C8D0'};
            ${checked ? 'text-decoration:line-through;' : ''}">${esc(item.text)}</span>
        </div>
      </div>`;
  }).join('');

  return `
    <div style="margin-bottom:2px;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px 8px;background:#111;border-bottom:1px solid #222;">
        <div>
          <span style="font-size:15px;margin-right:8px;">${icon}</span>
          <span style="font-family:var(--vault-mono);font-size:10px;color:${color};font-weight:800;letter-spacing:1.5px;">${title}</span>
          <div style="font-family:var(--vault-mono);font-size:8px;color:#383840;letter-spacing:1px;margin-top:2px;padding-left:24px;">${cadence}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--vault-mono);font-size:11px;color:${done===total&&total>0?color:'#505058'};font-weight:800;">${done}/${total}</div>
          <div style="width:60px;height:3px;background:#252525;border-radius:2px;margin-top:4px;">
            <div style="height:3px;background:${color};border-radius:2px;width:${pct}%;transition:width 0.3s;"></div>
          </div>
        </div>
      </div>
      <div style="padding:0 16px;">${rows}</div>
    </div>`;
}

/* ── RENDER: DANGER ZONES ────────────────────────────── */
function _renderDangerZones(zones, idx) {
  if (!zones || zones.length === 0) return '';
  const rows = zones.map((z, i) => `
    <div style="margin:0 0 12px;background:#1a0a0a;border:1px solid #3a1a1a;border-radius:10px;overflow:hidden;">
      <div style="padding:10px 14px 8px;border-bottom:1px solid #2a1010;">
        <span style="font-family:var(--vault-mono);font-size:9px;font-weight:800;color:#F87171;letter-spacing:1.5px;">⚠ DANGER ZONE ${i+1}</span>
        <span style="font-size:12px;font-weight:700;color:#fff;margin-left:8px;">${esc(z.title)}</span>
      </div>
      <div style="padding:10px 14px;">
        <div style="font-size:11px;color:#C8C8D0;line-height:1.6;margin-bottom:8px;">${esc(z.pitfall)}</div>
        <div style="font-family:var(--vault-mono);font-size:8px;color:#F87171;letter-spacing:1px;margin-bottom:4px;">👁 WATCH FOR</div>
        <div style="font-size:11px;color:#aaa;line-height:1.5;margin-bottom:10px;font-style:italic;">${esc(z.warning)}</div>
        <div style="background:#0f1a0f;border:1px solid #1a3a1a;border-radius:8px;padding:10px 12px;margin-bottom:8px;">
          <div style="font-family:var(--vault-mono);font-size:8px;color:#F5A623;letter-spacing:1px;margin-bottom:6px;">⚡ IF / THEN PLAN</div>
          <div style="font-size:11px;color:#F5A623;line-height:1.6;margin-bottom:4px;">${esc(z.ifTrigger)}</div>
          <div style="font-size:11px;color:#4ADE80;line-height:1.6;">${esc(z.thenAction)}</div>
        </div>
        ${z.journalText ? `
        <div style="display:flex;gap:8px;align-items:flex-start;padding:8px 10px;background:#0a0a1a;border-radius:6px;">
          <span style="font-family:var(--vault-mono);font-size:8px;font-weight:800;color:#60A0FF;white-space:nowrap;margin-top:2px;">📓 J${z.j}</span>
          <span style="font-size:11px;color:#7090C0;line-height:1.5;">${esc(z.journalText)}</span>
        </div>` : ''}
      </div>
    </div>`).join('');

  return `
    <div style="margin-bottom:2px;">
      <div style="padding:12px 16px 8px;background:#111;border-bottom:1px solid #222;">
        <span style="font-size:15px;margin-right:8px;">⚠️</span>
        <span style="font-family:var(--vault-mono);font-size:10px;color:#F87171;font-weight:800;letter-spacing:1.5px;">DANGER ZONES</span>
        <div style="font-family:var(--vault-mono);font-size:8px;color:#383840;letter-spacing:1px;margin-top:2px;padding-left:24px;">IF/THEN TRIGGERS — KNOW THESE COLD</div>
      </div>
      <div style="padding:12px 16px;">${rows}</div>
    </div>`;
}

/* ── RENDER: MINDSET AUDIT ───────────────────────────── */
function _renderMindset(mindset, idx) {
  if (!mindset) return '';

  const attitudes = (mindset.currentAttitudes || []).map(a => `
    <div style="display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px solid #1a1a1a;">
      <span style="color:#F87171;flex-shrink:0;font-size:12px;margin-top:2px;">✗</span>
      <span style="font-size:11px;color:#888;line-height:1.5;font-style:italic;">${esc(a)}</span>
    </div>`).join('');

  const installs = (mindset.toInstall || []).map(b => `
    <div style="display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px solid #1a1a1a;">
      <span style="color:#4ADE80;flex-shrink:0;font-size:12px;margin-top:2px;">✓</span>
      <span style="font-size:11px;color:#C8C8D0;line-height:1.5;">${esc(b)}</span>
    </div>`).join('');

  const recitations = (mindset.recitations || []).map(r => `
    <div style="padding:8px 12px;background:#0d0d1a;border-left:2px solid #8B5CF6;border-radius:0 6px 6px 0;margin-bottom:6px;">
      <span style="font-size:12px;color:#C4B5FD;line-height:1.6;font-style:italic;">"${esc(r)}"</span>
    </div>`).join('');

  return `
    <div style="margin-bottom:2px;">
      <div style="padding:12px 16px 8px;background:#111;border-bottom:1px solid #222;">
        <span style="font-size:15px;margin-right:8px;">🧠</span>
        <span style="font-family:var(--vault-mono);font-size:10px;color:#8B5CF6;font-weight:800;letter-spacing:1.5px;">MINDSET AUDIT</span>
        <div style="font-family:var(--vault-mono);font-size:8px;color:#383840;letter-spacing:1px;margin-top:2px;padding-left:24px;">ATTITUDES · BELIEFS · RECITATIONS · PRAYER</div>
      </div>
      <div style="padding:12px 16px;">

        <div style="font-family:var(--vault-mono);font-size:8px;color:#F87171;font-weight:800;letter-spacing:1.5px;margin-bottom:6px;">WHERE YOU ARE NOW</div>
        <div style="margin-bottom:14px;">${attitudes}</div>

        <div style="font-family:var(--vault-mono);font-size:8px;color:#4ADE80;font-weight:800;letter-spacing:1.5px;margin-bottom:6px;">INSTALL THESE INSTEAD</div>
        <div style="margin-bottom:14px;">${installs}</div>

        <div style="font-family:var(--vault-mono);font-size:8px;color:#8B5CF6;font-weight:800;letter-spacing:1.5px;margin-bottom:8px;">📿 DAILY RECITATIONS</div>
        <div style="margin-bottom:14px;">${recitations}</div>

        ${mindset.prayer ? `
        <div style="font-family:var(--vault-mono);font-size:8px;color:#F5A623;font-weight:800;letter-spacing:1.5px;margin-bottom:8px;">🙏 YOUR PRAYER / INTENTION</div>
        <div style="background:#0a0a0a;border:1px solid #2a2a2a;border-radius:8px;padding:14px;font-size:12px;color:#C9A96E;line-height:1.8;font-style:italic;">"${esc(mindset.prayer)}"</div>` : ''}
      </div>
    </div>`;
}

/* ── RENDER: PRACTICE FEED ───────────────────────────── */
function _renderPracticeFeed(practice, idx) {
  if (!practice) return '';

  return `
    <div style="margin-bottom:2px;">
      <div style="padding:12px 16px 8px;background:#111;border-bottom:1px solid #222;">
        <span style="font-size:15px;margin-right:8px;">🎯</span>
        <span style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:1.5px;">YOUR CI IS TUNED TO THIS GOAL</span>
        <div style="font-family:var(--vault-mono);font-size:8px;color:#383840;letter-spacing:1px;margin-top:2px;padding-left:24px;">PLAYERS · GRATITUDE · MEDITATION · WEEKLY REVIEW</div>
      </div>
      <div style="padding:12px 16px;">

        ${practice.vizAffirmations?.length ? `
        <div style="font-family:var(--vault-mono);font-size:8px;color:#60A0FF;font-weight:800;letter-spacing:1.5px;margin-bottom:6px;">⚡ VISUALIZATION AFFIRMATIONS</div>
        <div style="margin-bottom:14px;font-size:11px;color:#888;line-height:1.7;">
          ${practice.vizAffirmations.map(a => `<div style="padding:3px 0;border-bottom:1px solid #1a1a1a;">"${esc(a)}"</div>`).join('')}
        </div>` : ''}

        ${practice.gratitudeItems?.length ? `
        <div style="font-family:var(--vault-mono);font-size:8px;color:#4ADE80;font-weight:800;letter-spacing:1.5px;margin-bottom:6px;">🙏 GRATITUDE ITEMS</div>
        <div style="margin-bottom:14px;font-size:11px;color:#888;line-height:1.7;">
          ${practice.gratitudeItems.map(g => `<div style="padding:3px 0;border-bottom:1px solid #1a1a1a;">I am grateful for ${esc(g)}</div>`).join('')}
        </div>` : ''}

        ${practice.meditationFocus ? `
        <div style="font-family:var(--vault-mono);font-size:8px;color:#8B5CF6;font-weight:800;letter-spacing:1.5px;margin-bottom:6px;">🧘 MEDITATION FOCUS</div>
        <div style="background:#0d0a1a;border:1px solid #2a1a3a;border-radius:8px;padding:12px;font-size:11px;color:#C4B5FD;line-height:1.7;margin-bottom:14px;font-style:italic;">"${esc(practice.meditationFocus)}"</div>` : ''}

        ${practice.weeklyQuestion ? `
        <div style="font-family:var(--vault-mono);font-size:8px;color:#F5A623;font-weight:800;letter-spacing:1.5px;margin-bottom:6px;">📅 FRIDAY REVIEW QUESTION</div>
        <div style="background:#0a0f00;border:1px solid #2a3a00;border-radius:8px;padding:12px;font-size:12px;color:#D4E650;line-height:1.6;font-style:italic;">"${esc(practice.weeklyQuestion)}"</div>` : ''}
      </div>
    </div>`;
}

/* ── BUILD SHEET PANEL ───────────────────────────────── */
function buildBSTheMapPanel(intent, idx) {
  const map = intent.theMap;

  if (!map || (!map.thisWeek && !map.dangerZones && !map.mindset)) {
    return `
      <div style="padding:32px 20px;text-align:center;">
        <div style="font-size:28px;margin-bottom:12px;">🗺</div>
        <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:2px;margin-bottom:8px;">THE MAP</div>
        <div style="font-size:12px;color:#505058;line-height:1.7;max-width:280px;margin:0 auto 20px;">
          Your complete personalized framework — weekly commitments, danger zones, mindset audit, beliefs, and your daily practice tuned to this specific goal.
        </div>
        <button id="bsTheMapBtn-${idx}" onclick="bsGenerateTheMap(${idx})"
          style="background:#F5A623;border:none;border-radius:8px;padding:10px 20px;
          font-family:var(--vault-mono);font-size:10px;font-weight:800;color:#000;cursor:pointer;letter-spacing:1px;">
          ◉ BUILD THE MAP →
        </button>
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

      ${_renderCheckSection('THIS WEEK', '#F5A623', '⚡', map.thisWeek, 'thisWeek', 'WEEKLY COMMITMENTS — YES OR NO BY FRIDAY', idx)}
      ${_renderDangerZones(map.dangerZones, idx)}
      ${_renderMindset(map.mindset, idx)}
      ${_renderCheckSection('THIS MONTH', '#60A0FF', '📅', map.thisMonth, 'thisMonth', 'MILESTONES — RESETS MONTHLY', idx)}
      ${_renderCheckSection('THE TERRAIN', '#4ADE80', '🗺', map.terrain, 'terrain', 'MASTER THESE FOREVER', idx)}
      ${_renderPracticeFeed(map.practice, idx)}

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
      <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;letter-spacing:2px;margin-bottom:12px;">◉ BUILDING YOUR FRAMEWORK</div>
      <div style="font-size:12px;color:#505058;line-height:2;">
        Mapping your weekly commitments…<br>
        Identifying your danger zones…<br>
        Auditing your mindset…<br>
        Tuning your visualization sessions…<br>
        Building your prayer and gratitude practice…
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
    if (!data.thisWeek && !data.dangerZones) throw new Error('Bad response format');

    intent.theMap = { ...data, checks: intent.theMap?.checks || {} };
    if (typeof syncIntentionsToSupabase === 'function') syncIntentionsToSupabase();

    // Seed players with goal-specific content
    seedGoalPractice(idx);

    if (selectedVaultIdx === idx && panel) {
      panel.innerHTML = buildBSTheMapPanel(intent, idx);
    }
    if (typeof renderProgressDashboard === 'function' &&
        document.getElementById('page-progress')?.classList.contains('active')) {
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

    // thisWeek, thisMonth, terrain journal items
    ['thisWeek','thisMonth','terrain'].forEach(section => {
      (map[section] || []).forEach(item => {
        if (item.isJournal && item.j) {
          entries.push({ j: item.j, goal: title, text: item.text, section });
        }
      });
    });

    // Danger zone journal items
    (map.dangerZones || []).forEach(zone => {
      if (zone.journalText && zone.j) {
        entries.push({ j: zone.j, goal: title, text: zone.journalText, section: 'dangerZones' });
      }
    });
  });

  entries.sort((a,b) => a.j - b.j);

  const sectionLabel = {
    thisWeek: 'This Week', thisMonth: 'This Month',
    terrain: 'The Terrain', dangerZones: 'Danger Zone'
  };
  const sectionColor = {
    thisWeek: '#F5A623', thisMonth: '#60A0FF',
    terrain: '#4ADE80', dangerZones: '#F87171'
  };

  el.innerHTML = `
    <div style="padding:32px 24px;max-width:720px;margin:0 auto;">
      <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:2px;margin-bottom:4px;">◈ JOURNAL INDEX</div>
      <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;">Your J# Index</div>
      <div style="font-size:12px;color:#505058;line-height:1.7;margin-bottom:24px;">
        Each J# is a page in your physical journal. Open this on your phone, find the number, go to that page.
        The app sets the architecture — you fill the soul.
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
                  <span style="font-family:var(--vault-mono);font-size:8px;color:${sectionColor[e.section]||'#888'};
                    background:${sectionColor[e.section]||'#888'}22;border-radius:3px;padding:1px 5px;">
                    ${sectionLabel[e.section]||e.section}
                  </span>
                </div>
              </div>
            </div>`).join('')}
        </div>`}
    </div>`;
}

/* ── LEGACY STUBS ─────────────────────────────────────── */
function toggleMapAccordion() {}
async function toggleMapTodo() {}
async function generateTheMap() {}
async function bsGenerateRoadmap() {}
async function bsGenerateLibrary() {}
function closeViz() {}
