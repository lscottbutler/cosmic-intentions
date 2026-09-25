import { RM_CIRCLE } from './card-builder.js';
import { LS, esc, syncHabitsToSupabase, syncHabitDoneToSupabase, dayKey } from '../app.js';
import { setTaskWin, getWins } from './wins.js';
import { renderRings } from './rings.js';
/* ── DAILY TRACKER ───────────────────────────────────────
   A customizable daily habit checklist, grouped into time-of-day
   / type banners: MORNING · DAY · EVENING · BEDTIME · HEALTH.
   - The LIST (name, category, order) is editable on the Pegboard
     and stored in ci_habit_list as [{id, name, cat}].
   - The DONE state is per-day in ci_habits_<date> keyed by id,
     so it auto-resets each morning and survives edits/reorders.
───────────────────────────────────────────────────────── */

const DEFAULT_HABITS = [
  'MOMO', 'SUNRISE', 'KILOS', 'WATER', 'MEDITATION', 'PRAYER', 'MINDFULNESS',
  'BP', 'KETOSIS', 'GLUCOSE', 'SHROOM', 'JOURNAL', 'STOIC', 'CI VIZ',
  'AFFIRMATIONS', 'BABY STEPS', 'THAI LESSON', 'IF', 'NET DIARY', 'LOW CARB',
  'NO SUGAR', 'A.C.V.', 'PSYLLIUM', 'CHEAT DAY', 'FAST', 'BM', 'MEDS',
  'CARDIO', 'WEIGHTS', 'CORE', 'STRETCH', 'SUN', 'NO PHONE', 'CI VIZ',
  'BOOM', 'BUDGETING',
];

// Banner categories, in display order. '' = Unsorted (shown last).
export const HABIT_CATS = ['MORNING', 'DAY', 'EVENING', 'BEDTIME', 'HEALTH'];

// Second tag: life-DOMAIN (what a habit is ABOUT) — independent of the
// time-of-day banner above. Grouped so the editor dropdown renders as scannable
// <optgroup>s. Each habit stores its choice in `domain` ('' = none).
export const HABIT_DOMAINS = [
  { group: 'Health & Body',       items: ['Fitness', 'Nutrition', 'Hydration', 'Sleep', 'Fasting', 'Supplements', 'Biometrics', 'Mobility', 'Recovery', 'Grooming'] },
  { group: 'Mind & Emotion',      items: ['Meditation', 'Gratitude', 'Journaling', 'Visualization', 'Affirmations', 'Breathwork', 'Mood', 'Stress', 'Digital Detox', 'Stoicism'] },
  { group: 'Growth & Learning',   items: ['Reading', 'Language', 'Skill', 'Study', 'Writing', 'Creativity', 'Music', 'Notes'] },
  { group: 'Work & Productivity', items: ['Deep Work', 'Planning', 'Review', 'Goals', 'Email', 'Admin', 'Networking'] },
  { group: 'Wealth & Finance',    items: ['Budgeting', 'Investing', 'Expenses', 'Business', 'Bookkeeping'] },
  { group: 'Relationships',       items: ['Family', 'Partner', 'Friends', 'Kindness', 'Communication'] },
  { group: 'Spirit & Purpose',    items: ['Prayer', 'Spiritual Reading', 'Nature', 'Service', 'Purpose'] },
];
const HABIT_DOMAIN_SET = new Set(HABIT_DOMAINS.flatMap(g => g.items));
function _domain(h) { return HABIT_DOMAIN_SET.has(h && h.domain) ? h.domain : ''; }
const CAT_COLORS = {
  MORNING: '#E8A828', DAY: '#4A9EAD', EVENING: '#7C5CC4',
  BEDTIME: '#3B4A6B', HEALTH: '#48B860', '': '#5E5E5E',
};
const CAT_LABEL = (c) => c || 'UNSORTED';

let _open = true;   // dashboard dropdown expanded? (survives re-renders)
export function habitsToggleSection(open) { _open = !!open; }

// Time-of-day sections shown as their own collapsible dropdowns (display label + order).
const SECTION_ORDER = ['MORNING', 'DAY', 'EVENING', 'BEDTIME', 'HEALTH', ''];
const SECTION_LABEL = { MORNING: 'Morning', DAY: 'Afternoon', EVENING: 'Evening', BEDTIME: 'Before Sleep', HEALTH: 'After Waking', '': 'Unsorted' };
// Sections open FULLY EXPANDED by default; we only remember which ones the user collapses.
const _closedCats = new Set();
export function habitsSectionToggle(cat, open) { if (open) _closedCats.delete(cat); else _closedCats.add(cat); }

function _todayKey() { return dayKey(); }
function _doneKey()  { return `ci_habits_${_todayKey()}`; }
function _done()     { return LS.get(_doneKey()) || {}; }

let _seed = 0;
function _newId() { _seed++; return 'h' + Date.now() + '_' + _seed; }

export function getHabitList() {
  let list = LS.get('ci_habit_list');
  if (!Array.isArray(list) || !list.length) {
    list = DEFAULT_HABITS.map(name => ({ id: _newId(), name, cat: '' }));
    LS.set('ci_habit_list', list);
  }
  return list;
}
function _saveList(list) {
  LS.set('ci_habit_list', list);
  if (typeof syncHabitsToSupabase === 'function') syncHabitsToSupabase();  // fire-and-forget cloud sync
}
function _cat(h) { return HABIT_CATS.includes(h.cat) ? h.cat : ''; }

/* Group the list by category, preserving array order within each group. */
function _grouped(list) {
  const g = {}; [...HABIT_CATS, ''].forEach(c => g[c] = []);
  list.forEach(h => g[_cat(h)].push(h));
  return g;
}

function _refresh() {
  renderHabits();
  renderRunThroughs();
  if (typeof window !== 'undefined' && window.renderPBHabitList) window.renderPBHabitList();
}

/* ── Tick a habit for today ───────────────────────────── */
export function habitToggle(id) {
  const d = _done();
  const nowOn = !d[id];
  if (d[id]) delete d[id]; else d[id] = true;
  LS.set(_doneKey(), d);
  if (typeof syncHabitDoneToSupabase === 'function') syncHabitDoneToSupabase();  // fire-and-forget cloud sync (cross-device)
  // Completing a MORNING RUN THROUGH task lands it on the Wall of Wins
  // (add on check, remove on uncheck — idempotent via the habit's src key).
  const h = getHabitList().find(x => x.id === id);
  if (h && _cat(h) === 'MORNING') {
    // Date-scoped src key so each day's completion is its own win (and untick removes just today's).
    setTaskWin('habit_' + id + '_' + _todayKey(), h.name, nowOn, { category: 'growth' });
  }
  renderHabits();
  renderRunThroughs();
  if (typeof renderRings === 'function') renderRings();   // habit = +1 pt → refresh The Big 3 live
}

/* ── Pegboard editing: add / rename / recategorize / delete / reorder ── */
export function pbAddHabit() {
  const inp = document.getElementById('pbNewHabitInput');
  const name = (inp?.value || '').trim();
  if (!name) return;
  const sel = document.getElementById('pbNewHabitCat');
  const list = getHabitList();
  list.push({ id: _newId(), name: name.slice(0, 160), cat: sel ? sel.value : '' });
  _saveList(list);
  if (inp) inp.value = '';
  _refresh();
}
export function pbSaveHabitName(id, val) {
  const list = getHabitList();
  const h = list.find(x => x.id === id);
  if (!h) return;
  h.name = (val || '').trim().slice(0, 160) || h.name;
  _saveList(list);
  renderHabits();
}
export function pbSetHabitCat(id, cat) {
  const list = getHabitList();
  const h = list.find(x => x.id === id);
  if (!h) return;
  h.cat = HABIT_CATS.includes(cat) ? cat : '';
  _saveList(list);
  _refresh();
}
/* Set a habit's life-domain tag (the second axis, independent of cat/time). */
export function pbSetHabitDomain(id, domain) {
  const list = getHabitList();
  const h = list.find(x => x.id === id);
  if (!h) return;
  h.domain = HABIT_DOMAIN_SET.has(domain) ? domain : '';
  _saveList(list);
  _refresh();
}
export function pbDeleteHabit(id) {
  _saveList(getHabitList().filter(x => x.id !== id));
  _refresh();
}
/* Reorder within the same category (swap with nearest same-cat neighbor). */
export function pbMoveHabit(id, dir) {
  const list = getHabitList();
  const i = list.findIndex(x => x.id === id);
  if (i < 0) return;
  const cat = _cat(list[i]);
  let j = i + dir;
  while (j >= 0 && j < list.length && _cat(list[j]) !== cat) j += dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  _saveList(list);
  _refresh();
}

/* One tickable habit row. */
function _habitRow(h, on) {
  const dom = _domain(h);
  return `<div style="display:flex;gap:8px;align-items:center;padding:4px 2px;">
    <button onclick="habitToggle('${h.id}')" title="${on ? 'Done — tap to undo' : 'Mark done'}" style="${RM_CIRCLE}font-size:14px;">${on ? '✓' : '○'}</button>
    <span style="flex:1;min-width:0;font-size:12px;line-height:1.45;color:${on ? '#8a8a8a' : 'var(--widget-text)'};${on ? 'text-decoration:line-through;' : ''}">${esc(h.name)}</span>
    ${dom ? `<span title="${esc(dom)}" style="flex-shrink:0;font-size:8px;font-weight:800;letter-spacing:.3px;color:var(--muted);border:1px solid var(--widget-border);border-radius:5px;padding:1px 4px;white-space:nowrap;">${esc(dom)}</span>` : ''}
  </div>`;
}

/* ── "RUN THROUGH" cards — one per time-of-day category ──
   Each renders its own category's habits into its container. */
const RUN_CATS = ['MORNING', 'DAY', 'EVENING'];   // these get their own banner cards

function _renderRun(cat, elId) {
  const el = document.getElementById(elId); if (!el) return;
  const list = getHabitList().filter(h => _cat(h) === cat);
  const d = _done();
  const done = list.filter(h => d[h.id]).length;
  // Done/total count chip in the card header (e.g. "3/8"): morningRunBody -> morningRunCount.
  const countEl = document.getElementById(elId.replace('Body', 'Count'));
  if (countEl) countEl.textContent = `${done}/${list.length}`;
  // EVENING closes the day with a recap of everything completed today.
  const results = cat === 'EVENING' ? _dayResults() : '';
  if (!list.length) { el.innerHTML = `<div style="color:var(--muted);font-size:12px;font-style:italic;padding:4px 2px;">No ${cat.toLowerCase()} habits yet — set a habit's category to ${cat} on your Pegboard.</div>` + results; return; }
  // All run-throughs keep completed habits visible with a strikethrough (so the
  // card never goes blank when everything's done). Morning also mirrors each
  // completion to the Wall of Wins — that happens in habitToggle, independent
  // of this view.
  el.innerHTML = list.map(h => _habitRow(h, !!d[h.id])).join('')
    + results;
}

/* End-of-day recap for the EVENING run-through: everything completed TODAY.
   Reads today's habit done-state directly (same source as the checkmarks, so it
   can never drift), plus any non-habit wins logged today (e.g. Today-I-Will). */
function _dayResults() {
  const d = _done();                       // ci_habits_<today> — what you ticked today
  const doneHabits = getHabitList().filter(h => d[h.id]).map(h => h.name);
  // Other wins logged today that aren't habit-sourced, so they aren't double-counted.
  const otherWins = (getWins() || [])
    .filter(w => w.date === _todayKey() && !String(w.src || '').startsWith('habit_'))
    .map(w => w.text);
  const items = [...doneHabits, ...otherWins].map(t => String(t || '').trim()).filter(Boolean);

  const hd = `<div style="display:flex;align-items:center;gap:8px;margin:14px 2px 8px;">
      <div style="flex:1;height:1px;background:var(--widget-border);"></div>
      <span style="font-family:var(--vault-mono);font-size:9px;font-weight:800;letter-spacing:1.5px;color:#2FA94B;">TODAY'S RESULTS</span>
      <div style="flex:1;height:1px;background:var(--widget-border);"></div>
    </div>`;
  if (!items.length) {
    return hd + `<div style="color:var(--muted);font-size:12px;font-style:italic;padding:2px 2px 4px;">Nothing logged yet today — your completed tasks will show here.</div>`;
  }
  const rows = items.map(t => `<div style="display:flex;gap:8px;align-items:flex-start;padding:3px 2px;">
      <span style="color:#2FA94B;font-weight:800;flex-shrink:0;font-size:13px;line-height:1.5;">✓</span>
      <span style="flex:1;font-size:12px;line-height:1.45;color:var(--widget-text);">${esc(t)}</span>
    </div>`).join('');
  return hd + rows
    + `<div style="background:#EAF7EE;border-radius:8px;text-align:center;padding:8px;margin-top:8px;font-weight:800;font-size:12px;color:#2FA94B;letter-spacing:.4px;">✦ ${items.length} DONE TODAY — WELL DONE, SCOTT</div>`;
}

export function renderMorningRun() { _renderRun('MORNING', 'morningRunBody'); }
export function renderDayRun()     { _renderRun('DAY',     'dayRunBody'); }
export function renderEveningRun() { _renderRun('EVENING', 'eveningRunBody'); }
export function renderRunThroughs() { renderMorningRun(); renderDayRun(); renderEveningRun(); }

/* ── Daily Tracker widget — a master list of EVERY habit, grouped by category
   (Morning/Day/Evening/Bedtime/Health/Unsorted). Ticks share the same per-day
   done state as the run-through cards, so checking here or there stays in sync. ── */
export function showHabitView(view = 'daily') {
  const editing = view === 'editor';
  const daily = document.getElementById('habitsDailyView');
  const editor = document.getElementById('habitsEditorView');
  if (daily) daily.hidden = editing;
  if (editor) editor.hidden = !editing;
  if (editing) renderPBHabitList();
  else renderHabits();
}

export function renderHabits() {
  const el = document.getElementById('habitsWidget');
  if (!el) return;

  const d = _done();
  const groups = _grouped(getHabitList());

  // Each time-of-day section is its own collapsible dropdown (EXPANDED by default).
  let html = '';
  SECTION_ORDER.forEach(cat => {
    const items = [...groups[cat]].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    if (!items.length) return;
    const doneN = items.filter(h => !!d[h.id]).length;
    const open = !_closedCats.has(cat);
    html += `<details class="habit-drop" ${open ? 'open' : ''} ontoggle="habitsSectionToggle('${cat}',this.open)" style="margin-bottom:8px;">
      <summary style="display:flex;justify-content:space-between;align-items:center;gap:10px;background:${CAT_COLORS[cat]};color:#fff;font-family:var(--vault-mono);font-size:12px;font-weight:800;letter-spacing:1.5px;padding:11px 14px;border-radius:8px;cursor:pointer;">
        <span>${SECTION_LABEL[cat]}</span>
        <span style="display:flex;align-items:center;gap:9px;"><span style="opacity:.85;font-size:11px;">${doneN}/${items.length}</span><span class="habit-caret">&#9656;</span></span>
      </summary>
      <div style="background:#fff;border-radius:8px;padding:8px 12px 10px;margin-top:6px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px;">${items.map(h => _habitRow(h, !!d[h.id])).join('')}</div>
      </div>
    </details>`;
  });
  el.innerHTML = (html || '<p>No habits yet. Choose Edit habits to add your first one.</p>') +
    `<div style="font-size:10px;color:#888;line-height:1.4;padding:10px 4px 2px;">⚕ Not medical advice. Cosmic Intentions is not a medical device and does not diagnose or treat. For any health metric, consult a qualified healthcare professional.</div>`;
}

/* ── Pegboard editor (banner-grouped, rename / recategorize / reorder / delete) ── */
export function lfmMiniNav(command) {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'ci-lfm-mini-nav', command }, location.origin);
  }
}

export function renderPBHabitList() {
  const el = document.getElementById('pbHabitList');
  if (!el) return;
  // Keep sections the user opened while editing; a fresh page starts closed.
  const openCats = new Set(Array.from(el.querySelectorAll('details[data-habit-category][open]'), section => section.dataset.habitCategory));
  const list = getHabitList();
  const groups = _grouped(list);
  const catOpts = (cur) => ['<option value=""' + (cur === '' ? ' selected' : '') + '>— Unsorted —</option>']
    .concat(HABIT_CATS.map(c => `<option value="${c}"${cur === c ? ' selected' : ''}>${c}</option>`)).join('');
  const domainOpts = (cur) => '<option value=""' + (cur === '' ? ' selected' : '') + '>— No category —</option>'
    + HABIT_DOMAINS.map(g => `<optgroup label="${g.group}">`
        + g.items.map(d => `<option value="${d}"${cur === d ? ' selected' : ''}>${d}</option>`).join('')
        + '</optgroup>').join('');

  let html = `
    <nav class="lfm-mini-nav" aria-label="Long Form Manifestation navigation">
      <button type="button" onclick="lfmMiniNav('back')" aria-label="Previous LFM tool" title="Previous"><span aria-hidden="true">◀</span></button>
      <button type="button" onclick="lfmMiniNav('menu')" aria-label="Open LFM menu" title="Menu"><span aria-hidden="true">☰</span></button>
      <button type="button" onclick="lfmMiniNav('forward')" aria-label="Next LFM tool" title="Next"><span aria-hidden="true">▶</span></button>
    </nav>`;
  [...HABIT_CATS, ''].forEach(cat => {
    const items = groups[cat];
    if (cat === '' && !items.length) return;   // hide empty Unsorted; always show the 5 named banners
    html += `<details class="pb-habit-section" id="pbcat-${CAT_LABEL(cat)}" data-habit-category="${cat}"${openCats.has(cat) ? ' open' : ''}>
      <summary style="background:${CAT_COLORS[cat]};color:#fff;font-weight:800;font-size:12px;letter-spacing:1.5px;padding:8px 12px;border-radius:8px;">
        <span>${CAT_LABEL(cat)}</span><svg class="pb-habit-chevron" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </summary>`;
    if (!items.length) {
      html += `<div style="color:var(--muted);font-size:11px;font-style:italic;padding:10px 2px 6px;">No habits here yet — set a habit's category to "${cat}".</div></details>`;
      return;
    }
    html += `<div class="pb-habit-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:start;">`;
    items.forEach((h, gi) => {
      html += `
      <div class="pb-habit-card" style="background:#fff;padding:11px 12px;border:2px solid ${CAT_COLORS[cat]};border-radius:10px;">
        <textarea maxlength="160" rows="1" onchange="pbSaveHabitName('${h.id}',this.value)" oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"
          style="width:100%;box-sizing:border-box;padding:13px 14px;border:none;border-radius:7px;background:#fff;color:#1a1a1a;font-size:10pt;line-height:1.5;font-family:inherit;resize:none;field-sizing:content;min-height:62px;overflow:hidden;margin-bottom:8px;">${esc(h.name)}</textarea>
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" class="pb-habit-circle" onclick="pbMoveHabit('${h.id}',-1)" title="Move up" aria-label="Move habit up"${gi === 0 ? ' disabled' : ''}>▲</button>
          <button type="button" class="pb-habit-circle" onclick="pbMoveHabit('${h.id}',1)" title="Move down" aria-label="Move habit down"${gi === items.length - 1 ? ' disabled' : ''}>▼</button>
          <select onchange="pbSetHabitCat('${h.id}',this.value)"
            style="flex:1;min-width:0;box-sizing:border-box;padding:9px 8px;border:none;border-radius:7px;background:#fff;color:#1a1a1a;font-size:12px;">${catOpts(_cat(h))}</select>
          <button type="button" class="pb-habit-circle" onclick="pbDeleteHabit('${h.id}')" title="Delete habit" aria-label="Delete habit">✕</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
          <span style="flex-shrink:0;font-size:9px;font-weight:800;letter-spacing:1px;color:#9a9a9a;">CATEGORY</span>
          <select onchange="pbSetHabitDomain('${h.id}',this.value)" title="What this habit is about"
            style="flex:1;min-width:0;box-sizing:border-box;padding:9px 8px;border:none;border-radius:7px;background:#fff;color:#1a1a1a;font-size:12px;">${domainOpts(_domain(h))}</select>
        </div>
      </div>`;
    });
    html += `</div></details>`;
  });
  el.innerHTML = html || `<div style="color:var(--muted);font-size:12px;font-style:italic;padding:6px 0;">No habits yet — add one below.</div>`;
}

/* Open the My Habits editor scrolled to a category's banner. Fired by the
   run-through cards' edit button (Morning/Day/Evening) so the user lands on the
   matching section. showPage() force-scrolls to top across two rAFs, so wait for
   that to settle before scrolling to the anchor. */
export function openHabitsAt(cat) {
  const label = HABIT_CATS.includes(cat) ? cat : 'UNSORTED';
  if (typeof window !== 'undefined' && typeof window.navTo === 'function') window.navTo('habits');
  setTimeout(() => {
    showHabitView('editor');
    const el = document.getElementById('pbcat-' + label);
    if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }, 170);
}

if (typeof window !== 'undefined') {
  window.renderHabits = renderHabits;
  window.showHabitView = showHabitView;
  window.openHabitsAt = openHabitsAt;
  window.renderMorningRun = renderMorningRun;
  window.renderRunThroughs = renderRunThroughs;
  window.renderPBHabitList = renderPBHabitList;
}
