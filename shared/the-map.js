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
    if (typeof startAffirmationLoop === 'function') startAffirmationLoop(p.vizAffirmations);
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
function _renderCheckSection(title, color, icon, items, sectionKey, cadence, idx, collapsed) {
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

  const secKey = `mapsec-${idx}-${sectionKey}`;
  const meta = `
    <span style="display:inline-flex;align-items:center;gap:8px;">
      <span>${done}/${total}</span>
      <span style="width:54px;height:4px;background:rgba(0,0,0,0.3);border-radius:2px;display:inline-block;overflow:hidden;">
        <span style="display:block;height:4px;background:#fff;width:${pct}%;transition:width 0.3s;"></span>
      </span>
    </span>`;
  const body = `
    <div style="font-family:var(--vault-mono);font-size:8px;color:#383840;letter-spacing:1px;padding:6px 16px 2px;">${cadence}</div>
    <div style="padding:0 16px;">${rows}</div>`;
  return colBBanner(secKey, title, color, body, { collapsed: collapsed, icon: icon, meta: meta });
}

/* ── RENDER: DANGER ZONES ────────────────────────────── */
/* ── HOT STATE DETECTION ─────────────────────────────────
   Returns true if current hour falls in the user's configured
   danger window (pb-hotstate-start → pb-hotstate-end).
─────────────────────────────────────────────────────────── */
function _isHotState() {
  const pb    = (typeof LS !== 'undefined' ? LS.get('ci_pegboard') : null) || {};
  const start = parseInt(pb['pb-hotstate-start']);
  const end   = parseInt(pb['pb-hotstate-end']);
  if (isNaN(start) || isNaN(end)) return false;
  const hour = new Date().getHours();
  // Handle wrap-around (e.g. 22:00–02:00)
  return start <= end ? (hour >= start && hour <= end)
                      : (hour >= start || hour <= end);
}

function _hotStateBanner() {
  if (!_isHotState()) return '';
  const pb   = (typeof LS !== 'undefined' ? LS.get('ci_pegboard') : null) || {};
  const start = pb['pb-hotstate-start'];
  const end   = pb['pb-hotstate-end'];
  return `
    <div style="background:#1a0505;border:1px solid #8B0000;border-radius:10px;
      padding:14px 16px;margin:0 14px 10px;display:flex;gap:12px;align-items:flex-start;">
      <span style="font-size:20px;flex-shrink:0;">🌙</span>
      <div style="flex:1;">
        <div style="font-family:var(--vault-mono);font-size:9px;font-weight:800;
          color:#F87171;letter-spacing:1.5px;margin-bottom:4px;">HOT STATE WINDOW ACTIVE — ${start}:00–${end}:00</div>
        <div style="font-size:11px;color:#C8C8D0;line-height:1.5;margin-bottom:10px;">
          This is your highest-risk window. Willpower is depleted. Your danger zones are live. You pre-wired a plan for exactly this moment.
        </div>
        <div style="display:flex;gap:6px;">
          <button onclick="launchVizInline('viz-quick',{},'taInlineSlot')"
            style="flex:1;background:#1a1a2e;border:1px solid #3030a0;border-radius:7px;
            padding:8px 4px;cursor:pointer;font-family:var(--vault-mono);font-size:9px;
            font-weight:800;color:#8080FF;letter-spacing:0.8px;">⚡ AFFIRMATIONS</button>
          <button onclick="launchGratitudeInline()"
            style="flex:1;background:#1a0f1a;border:1px solid #600060;border-radius:7px;
            padding:8px 4px;cursor:pointer;font-family:var(--vault-mono);font-size:9px;
            font-weight:800;color:#D080D0;letter-spacing:0.8px;">🙏 GRATITUDE</button>
          <button onclick="launchVizInline('meditation-timer',{duration:300},'taInlineSlot')"
            style="flex:1;background:#0a1a1a;border:1px solid #006060;border-radius:7px;
            padding:8px 4px;cursor:pointer;font-family:var(--vault-mono);font-size:9px;
            font-weight:800;color:#40C0C0;letter-spacing:0.8px;">🧘 MEDITATE</button>
        </div>
      </div>
    </div>`;
}

function _toggleDangerZone(id) {
  const body  = document.getElementById('dz-body-' + id);
  const arrow = document.getElementById('dz-arrow-' + id);
  if (!body) return;
  const open = body.style.display === 'none';
  body.style.display  = open ? 'block' : 'none';
  if (arrow) arrow.style.transform = open ? 'rotate(90deg)' : '';
}

function _renderDangerZones(zones, idx) {
  if (!zones || zones.length === 0) return '';

  const rows = zones.map((z, i) => {
    const id = `dz-${idx}-${i}`;
    return `
    <div style="margin:0 0 6px;background:#1a0a0a;border:1px solid #3a1a1a;border-radius:10px;overflow:hidden;">

      <!-- TRIGGER HEADER -->
      <div onclick="_toggleDangerZone('${id}')"
        style="display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;user-select:none;">
        <span style="font-family:var(--vault-mono);font-size:8px;font-weight:800;color:#F87171;
          letter-spacing:1px;white-space:nowrap;">⚠ ${i+1}</span>
        <span style="flex:1;font-size:13px;font-weight:700;color:#fff;">${esc(z.title)}</span>
        <span id="dz-arrow-${id}"
          style="font-size:9px;color:#F87171;transition:transform 0.2s;flex-shrink:0;">▶</span>
      </div>

      <!-- COLLAPSIBLE BODY -->
      <div id="dz-body-${id}" style="display:none;border-top:1px solid #2a1010;padding:12px 14px;">
        <div style="font-size:11px;color:#C8C8D0;line-height:1.6;margin-bottom:10px;">${esc(z.pitfall)}</div>

        <div style="font-family:var(--vault-mono);font-size:8px;color:#F87171;letter-spacing:1px;margin-bottom:4px;">👁 WATCH FOR</div>
        <div style="font-size:11px;color:#aaa;line-height:1.5;margin-bottom:12px;font-style:italic;">${esc(z.warning)}</div>

        <div style="background:#0f1a0f;border:1px solid #1a3a1a;border-radius:8px;padding:10px 12px;margin-bottom:10px;">
          <div style="font-family:var(--vault-mono);font-size:8px;color:#F5A623;letter-spacing:1px;margin-bottom:6px;">⚡ IF / THEN PLAN</div>
          <div style="font-size:11px;color:#F5A623;line-height:1.6;margin-bottom:6px;">${esc(z.ifTrigger)}</div>
          <div style="font-size:11px;color:#4ADE80;line-height:1.6;">${esc(z.thenAction)}</div>
        </div>

        ${z.journalText ? `
        <div style="display:flex;gap:8px;align-items:flex-start;padding:8px 10px;background:#0a0a1a;border-radius:6px;margin-bottom:10px;">
          <span style="font-family:var(--vault-mono);font-size:8px;font-weight:800;color:#60A0FF;white-space:nowrap;margin-top:2px;">📓 J${z.j}</span>
          <span style="font-size:11px;color:#7090C0;line-height:1.5;">${esc(z.journalText)}</span>
        </div>` : ''}

        <!-- REAFFIRM BAR -->
        <div style="display:flex;gap:6px;border-top:1px solid #2a1010;padding-top:10px;margin-top:2px;">
          <button onclick="launchVizInline('viz-quick',{},'taInlineSlot')"
            style="flex:1;background:#1a1a2e;border:1px solid #3030a0;border-radius:8px;
            padding:9px 6px;cursor:pointer;font-family:var(--vault-mono);font-size:9px;
            font-weight:800;color:#8080FF;letter-spacing:0.8px;transition:background 0.15s;"
            onmouseover="this.style.background='#252550'" onmouseout="this.style.background='#1a1a2e'">
            ⚡ AFFIRMATIONS
          </button>
          <button onclick="launchGratitudeInline()"
            style="flex:1;background:#1a0f1a;border:1px solid #600060;border-radius:8px;
            padding:9px 6px;cursor:pointer;font-family:var(--vault-mono);font-size:9px;
            font-weight:800;color:#D080D0;letter-spacing:0.8px;transition:background 0.15s;"
            onmouseover="this.style.background='#2a1a2a'" onmouseout="this.style.background='#1a0f1a'">
            🙏 GRATITUDE
          </button>
          <button onclick="launchVizInline('meditation-timer',{duration:300},'taInlineSlot')"
            style="flex:1;background:#0a1a1a;border:1px solid #006060;border-radius:8px;
            padding:9px 6px;cursor:pointer;font-family:var(--vault-mono);font-size:9px;
            font-weight:800;color:#40C0C0;letter-spacing:0.8px;transition:background 0.15s;"
            onmouseover="this.style.background='#1a2a2a'" onmouseout="this.style.background='#0a1a1a'">
            🧘 MEDITATE
          </button>
        </div>

      </div>
    </div>`;
  }).join('');

  const dzId = `dz-section-${idx}`;
  const meta = `${zones.length} trigger${zones.length !== 1 ? 's' : ''}`;
  const body = `
    ${_hotStateBanner()}
    <div style="padding:10px 14px;">${rows}</div>`;
  return colBBanner(dzId, 'Danger Zones', '#C41E3A', body, { collapsed: true, icon: '⚠', meta: meta });
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

  const recitationList = (mindset.recitations || []);
  const recitationsAttr = recitationList.map(r => esc(r)).join('||');
  const rid = `rec-${idx}`;

  // Each Mindset sub-section is now its own standalone collapsible piece (no parent wrapper).
  const piece = (key, color, icon, title, bodyHtml) => `
    <div style="margin-bottom:2px;">
      <div onclick="toggleColBSection('${key}')" style="display:flex;align-items:center;gap:8px;padding:12px 16px 8px;background:#111;border-bottom:1px solid #222;cursor:pointer;user-select:none;">
        <span class="ts-arrow" id="${key}-arr" style="color:${color};font-size:9px;flex-shrink:0;">▶</span>
        <span style="font-size:15px;">${icon}</span>
        <span style="font-family:var(--vault-mono);font-size:10px;color:${color};font-weight:800;letter-spacing:1.5px;">${title}</span>
      </div>
      <div id="${key}-body" style="padding:12px 16px;display:none;">${bodyHtml}</div>
    </div>`;

  const recBody = `
    <div id="${rid}-wrap" data-recitations="${recitationsAttr}"
      style="background:#0a0a14;border:1px solid #2a1a4a;border-radius:12px;padding:28px 20px;text-align:center;min-height:100px;display:flex;align-items:center;justify-content:center;">
      <div id="${rid}-text" style="font-size:15px;color:#C4B5FD;line-height:1.7;font-style:italic;transition:opacity 1s ease;opacity:1;">&ldquo;<span id="${rid}-inner"></span>&rdquo;</div>
    </div>
    <div style="display:flex;justify-content:center;gap:6px;margin-top:10px;" id="${rid}-dots"></div>`;

  const prayerBody = mindset.prayer
    ? `<div style="background:#0a0a0a;border:1px solid #2a2a2a;border-radius:8px;padding:14px;font-size:12px;color:#C9A96E;line-height:1.8;font-style:italic;">"${esc(mindset.prayer)}"</div>`
    : '';

  let out = '';
  if (attitudes)             out += piece(`mindNow-${idx}`,     '#F87171', '🧠', 'WHERE YOU ARE NOW',       attitudes);
  if (installs)              out += piece(`mindInstall-${idx}`, '#4ADE80', '✅', 'INSTALL THESE INSTEAD',   installs);
  if (recitationList.length) out += piece(`recsec-${idx}`,      '#8B5CF6', '📿', 'DAILY RECITATIONS',       recBody);
  if (mindset.prayer)        out += piece(`mindPrayer-${idx}`,  '#F5A623', '🙏', 'YOUR PRAYER / INTENTION', prayerBody);
  if (!out) return '';
  return colBBanner(`bannerMindset-${idx}`, 'Mindset Audit', '#8B5CF6', out, { collapsed: true, icon: '🧠' });
}

/* ── RENDER: PRACTICE FEED ───────────────────────────────
   Flattened: each item is its own standalone collapsible triangle piece.
───────────────────────────────────────────────────────── */
function _renderPracticeFeed(practice, idx) {
  if (!practice) return '';

  const piece = (key, color, icon, title, bodyHtml) => `
    <div style="margin-bottom:2px;">
      <div onclick="toggleColBSection('${key}')" style="display:flex;align-items:center;gap:8px;padding:12px 16px 8px;background:#111;border-bottom:1px solid #222;cursor:pointer;user-select:none;">
        <span class="ts-arrow" id="${key}-arr" style="color:${color};font-size:9px;flex-shrink:0;">▶</span>
        <span style="font-size:15px;">${icon}</span>
        <span style="font-family:var(--vault-mono);font-size:10px;color:${color};font-weight:800;letter-spacing:1.5px;">${title}</span>
      </div>
      <div id="${key}-body" style="padding:12px 16px;display:none;">${bodyHtml}</div>
    </div>`;

  let out = '';

  // Visualization Affirmations removed from Daily Practice banner —
  // they now live in the Column A affirmation ticker (#dashboard-affirmation-ticker).

  if (practice.gratitudeItems?.length) {
    out += piece(`gratItems-${idx}`, '#4ADE80', '🙏', 'GRATITUDE ITEMS',
      `<div style="font-size:11px;color:#888;line-height:1.7;">${
        practice.gratitudeItems.map(g => `<div style="padding:3px 0;border-bottom:1px solid #1a1a1a;">I am grateful for ${esc(g)}</div>`).join('')
      }</div>`);
  }

  if (practice.meditationFocus) {
    out += piece(`medFocus-${idx}`, '#8B5CF6', '🧘', 'MEDITATION FOCUS',
      `<div style="background:#0d0a1a;border:1px solid #2a1a3a;border-radius:8px;padding:12px;font-size:11px;color:#C4B5FD;line-height:1.7;font-style:italic;">"${esc(practice.meditationFocus)}"</div>`);
  }

  if (practice.weeklyQuestion) {
    out += piece(`fridayReview-${idx}`, '#F5A623', '📅', 'FRIDAY REVIEW QUESTION',
      `<div style="background:#0a0f00;border:1px solid #2a3a00;border-radius:8px;padding:12px;font-size:12px;color:#D4E650;line-height:1.6;font-style:italic;">"${esc(practice.weeklyQuestion)}"</div>`);
  }

  if (!out) return '';
  return colBBanner(`bannerPractice-${idx}`, 'Daily Practice', '#EC4899', out, { collapsed: true, icon: '🔁' });
}

/* ── BUILD SHEET PANEL ───────────────────────────────── */
function buildBSTheMapPanel(intent, idx) {
  const map = intent.theMap;

  if (!map || (!map.thisWeek && !map.dangerZones && !map.mindset)) {
    return `
      <div style="padding:32px 20px;text-align:center;">
        <div style="margin-bottom:12px;">
          <svg viewBox="0 0 64 64" width="52" height="52" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;" aria-hidden="true">
            <circle cx="32" cy="32" r="30" fill="#3c3c3c"/>
            <circle cx="32" cy="32" r="24" fill="#ffffff"/>
            <circle cx="32" cy="32" r="21" fill="#c4c4c4"/>
            <path d="M47 17 L36 36 L28 28 Z" fill="#454545"/>
            <path d="M17 47 L36 36 L28 28 Z" fill="#f2f2f2"/>
            <circle cx="32" cy="32" r="6" fill="#ffffff" stroke="#9a9a9a" stroke-width="1.2"/>
          </svg>
        </div>
        <div style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:2px;margin-bottom:8px;">MY ROADMAP</div>
        <div style="font-size:12px;color:#505058;line-height:1.7;max-width:280px;margin:0 auto 20px;">
          Your complete personalized framework — weekly commitments, danger zones, mindset audit, beliefs, and your daily practice tuned to this specific goal.
        </div>
        <button id="bsTheMapBtn-${idx}" onclick="bsGenerateTheMap(${idx})"
          style="background:#F5A623;border:none;border-radius:8px;padding:10px 20px;
          font-family:var(--vault-mono);font-size:10px;font-weight:800;color:#000;cursor:pointer;letter-spacing:1px;">
          ◉ BUILD MY ROADMAP →
        </button>
      </div>`;
  }

  return `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid #222;">
        <span style="font-family:var(--vault-mono);font-size:10px;color:#F5A623;font-weight:800;letter-spacing:1px;">◉ MY ROADMAP</span>
        <button onclick="bsGenerateTheMap(${idx})"
          style="background:none;border:1px solid #383838;border-radius:6px;padding:4px 10px;
          font-family:var(--vault-mono);font-size:9px;color:#888;cursor:pointer;">↺ Regenerate</button>
      </div>

      ${_renderCheckSection('THIS WEEK', '#F5A623', '⚡', map.thisWeek, 'thisWeek', 'WEEKLY COMMITMENTS — YES OR NO BY FRIDAY', idx)}
      ${_renderDangerZones(map.dangerZones, idx)}
      ${_renderMindset(map.mindset, idx)}
      ${_renderCheckSection('THIS MONTH', '#60A0FF', '📅', map.thisMonth, 'thisMonth', 'MILESTONES — RESETS MONTHLY', idx, true)}
      ${_renderCheckSection('THE TERRAIN', '#4ADE80', '🗺', map.terrain, 'terrain', 'MASTER THESE FOREVER', idx, true)}
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
    const res = await ciApi('map-ai', { goal: intent.title });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (!data.thisWeek && !data.dangerZones) throw new Error('Bad response format');

    intent.theMap = { ...data, checks: intent.theMap?.checks || {} };
    if (typeof syncIntentionsToSupabase === 'function') syncIntentionsToSupabase();

    // Seed players with goal-specific content
    seedGoalPractice(idx);

    if (selectedVaultIdx === idx && panel) {
      panel.innerHTML = buildBSTheMapPanel(intent, idx);
      _initMapRecitations(idx);
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
          <div style="font-size:13px;color:#505058;">No journal entries yet.<br>Generate My Roadmap on a goal to get your J# prompts.</div>
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

/* ── RECITATION CAROUSEL INIT ────────────────────────── */
function _initMapRecitations(idx) {
  var rid   = 'rec-' + idx;
  var wrap  = document.getElementById(rid + '-wrap');
  var inner = document.getElementById(rid + '-inner');
  var textEl= document.getElementById(rid + '-text');
  var dots  = document.getElementById(rid + '-dots');
  if (!wrap || !inner || !textEl || !dots) return;

  var raw   = wrap.getAttribute('data-recitations') || '';
  var items = raw ? raw.split('||').filter(Boolean) : [];
  if (!items.length) return;

  var cur = 0;
  inner.textContent = items[0];

  // Build dots
  items.forEach(function(_, i) {
    var d = document.createElement('div');
    d.id = rid + '-dot-' + i;
    d.style.cssText = 'width:5px;height:5px;border-radius:50%;background:' +
      (i === 0 ? '#8B5CF6' : '#2a1a4a') + ';transition:background 0.4s;cursor:pointer;';
    d.onclick = function() { show(i); cur = i; };
    dots.appendChild(d);
  });

  function show(i) {
    textEl.style.opacity = '0';
    setTimeout(function() {
      inner.textContent = items[i];
      textEl.style.opacity = '1';
      items.forEach(function(_, j) {
        var dot = document.getElementById(rid + '-dot-' + j);
        if (dot) dot.style.background = j === i ? '#8B5CF6' : '#2a1a4a';
      });
    }, 800);
  }

  // Clear any previous interval on this idx
  if (window._recIntervals && window._recIntervals[idx]) {
    clearInterval(window._recIntervals[idx]);
  }
  if (!window._recIntervals) window._recIntervals = {};
  window._recIntervals[idx] = setInterval(function() {
    cur = (cur + 1) % items.length;
    show(cur);
  }, 30000);
}

/* ── LEGACY STUBS ─────────────────────────────────────── */
function toggleMapAccordion() {}
async function toggleMapTodo() {}
async function generateTheMap() {}
async function bsGenerateRoadmap() {}
async function bsGenerateLibrary() {}
function closeViz() {}
