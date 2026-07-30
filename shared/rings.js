import { LS, toast, dayKey } from '../app.js';
import { renderWrapup } from './wrapup.js';
/* ── THE BIG 3 (daily reward tracker) ────────────────────
   Three pillars — Completed Tasks · Visualize · Habits.
   Close all 3 = a Perfect Day. MEDITATE and GRATITUDE are BONUS
   rings: they earn points but are NOT required for a Perfect Day.

   Two pillars are DERIVED (not stored), so they self-sync and past days
   reflect real history:
     • Completed Tasks (internal key 'review') — ≥1 task finished that day
     • Habits — ≥1 daily habit ticked that day
   Visualize/Meditate/Gratitude all close ONLY from completing their player
   session (un-fakeable — no tap grants credit). Gratitude's heart launches
   its player; Meditate is launched from its own grid.

   POINTS (derived, never stored — recomputed from the day's
   ring record + habit checkmarks + tasks completed today, so
   cross-device sync is automatic once those are synced):
     • each completed TASK (action/roadmap)  +10   ← rewarded most
     • Perfect Day (Tasks+Visualize+Habits)  +15
     • each closed pillar .................. +5
     • Meditate (bonus) ................... +5
     • Gratitude (bonus) ................... +5
     • each ticked habit ................... +1
     • Mind Loop (capped, once/day) ........ +1

   Momentum dims & recovers over a rolling window (kind, never
   hard-resets). Anchors close by TAP or from a completed
   session (markPillar via playerFinished). Grayscale by design.
   Depends on globals (from app.js): LS, toast, dayKey.
───────────────────────────────────────────────────────── */

export const PILLARS = [
  { key: 'review',    label: 'Completed Tasks', icon: '✓', hint: 'Finish a task (Action or Roadmap step)' },
  { key: 'visualize', label: 'Visualize', icon: '✦', hint: 'Creative visualization' },
  { key: 'habits',    label: 'Habits',    icon: '☑', hint: 'Tick a daily habit' },
];
// Bonus rings — earn points but NEVER count toward a Perfect Day.
export const GRATITUDE = { key: 'gratitude', label: 'Gratitude', icon: '♥', hint: 'Log a gratitude' };
export const MEDITATE  = { key: 'meditate',  label: 'Meditate',  icon: '☾', hint: 'Meditation session' };
// Bonus rings rendered under the grid, in order (Gratitude, then Meditate).
const BONUS = [GRATITUDE, MEDITATE];

// Point values — single source of truth.
// Point values — single source of truth. Completed TASKS are worth the most:
// finishing real work (a free-standing Action or a goal's Roadmap step) is the
// point of the app, so it out-rewards the daily disciplines. Tune `task` here.
const PTS = { task: 10, habit: 1, anchor: 5, gratitude: 5, mindloop: 1, perfect: 15 };

const MOMENTUM_WINDOW = 30;   // days scanned to derive momentum

// Grayscale ramp DERIVED FROM THE THEME so it reads on dark, light-olive AND
// kids-white. --widget-text always contrasts its --widget-bg (by theme design);
// every shade is that text token at a lower opacity, so hierarchy = shade, and
// it auto-flips dark-on-light. No fixed grays (those vanished on light themes).
const TX = 'var(--widget-text,#fff)';
const G = {
  bg:     'var(--widget-bg,#141414)',
  border: 'var(--widget-border,#2a2a2a)',
  bright: TX,                                                 // headings
  lite:   `color-mix(in srgb, ${TX} 78%, transparent)`,      // primary labels
  mid:    `color-mix(in srgb, ${TX} 60%, transparent)`,      // secondary text
  dim:    `color-mix(in srgb, ${TX} 42%, transparent)`,      // muted captions
  track:  `color-mix(in srgb, ${TX} 22%, transparent)`,      // ring track / dashes
  faint:  `color-mix(in srgb, ${TX} 10%, transparent)`,      // subtle fills
  // Status colors — pulled from theme tokens so they stay legible on dark AND
  // light/white themes (green=done, orange=momentum, pink=gratitude bonus).
  done:   'var(--success,#4ade80)',
  brand:  'var(--brand,#f5a623)',
  grat:   'var(--pink,#ff8ab8)',
};

/* Identity tiers — earned by cumulative Perfect Days (consistency,
   not points). Citadel-themed. */
export const TIERS = [
  { min: 0,   name: 'Initiate' },
  { min: 3,   name: 'Aspirant' },
  { min: 7,   name: 'Sentinel' },
  { min: 21,  name: 'Guardian' },
  { min: 50,  name: 'Keeper' },
  { min: 100, name: 'Warden of the Citadel' },
];

// Cloud sync — late-bound by app.js once currentUser exists, so rings.js has
// no hard dependency on it and still works logged-out. Set via _wireRingsSync.
let syncRingsToSupabase = null;

function _dayKey(d) { return dayKey(d); }
function _todayKey() { return _dayKey(new Date()); }

function _rawRings(dateKey) {
  return LS.get(`ci_rings_${dateKey}`) || { review: false, visualize: false, meditate: false, gratitude: false };
}
// Two of the three pillars are DERIVED, not stored, so they stay in sync
// automatically and past days reflect real history:
//   • review  → "Completed Tasks": ≥1 task (Action/Roadmap step) finished that day
//   • habits  → ≥1 daily habit ticked that day
// Visualize (pillar) and the Meditate/Gratitude bonus rings are still stored.
// Write paths use _rawRings so they never persist the derived values.
function _getRings(dateKey) {
  const r = _rawRings(dateKey);
  return { ...r, review: _hasTaskWin(dateKey), habits: _doneHabitCount(dateKey) > 0 };
}
function _setRings(dateKey, rings) {
  LS.set(`ci_rings_${dateKey}`, rings);
  if (typeof syncRingsToSupabase === 'function') { try { syncRingsToSupabase(dateKey, rings); } catch (e) {} }
}
// Only the 3 PILLARS count toward "closed" / Perfect Day — Meditate & Gratitude
// are bonus rings.
function _closedCount(r) {
  return (r.review ? 1 : 0) + (r.visualize ? 1 : 0) + (r.habits ? 1 : 0);
}
function _isPerfect(r) {
  return !!(r.review && r.visualize && r.habits);
}

/* ── Points ───────────────────────────────────────────── */
// Ticked habits for a day = every true entry in ci_habits_<date>.
function _doneHabitCount(dateKey) {
  const d = LS.get(`ci_habits_${dateKey}`) || {};
  // Count only ticks that map to a habit still on the list. Orphaned entries —
  // from a deleted/renamed habit, or an id mismatch after a Supabase resync —
  // must NOT award phantom points, or "pts today" drifts above what's actually
  // checked (the "19 pts / zero visible tracking" bug).
  const ids = new Set((LS.get('ci_habit_list') || []).map(h => h && h.id));
  return Object.keys(d).filter(id => d[id] && ids.has(id)).length;
}
// Mind Loop earns its single daily point once awardMindLoopPoint() fires.
function _mindLoopEarned(dateKey) {
  return !!LS.get(`ci_mindloop_pt_${dateKey}`);
}
/* Mind Loop earns ONE point per day after a genuine listen (sleeploop calls
   this once it's played ~10 continuous minutes). Hard-capped: a loop left
   running all day still earns exactly +1, so it can't farm points. */
export function awardMindLoopPoint() {
  const key = _todayKey();
  if (_mindLoopEarned(key)) return false;   // already earned today
  LS.set(`ci_mindloop_pt_${key}`, true);
  renderRings();
  try { renderWrapup(); } catch (e) {}
  return true;
}
// Tasks completed today. Every Action / Roadmap-step tick logs a dated win via
// setTaskWin with a 'wrapact-' or 'task-' src, so counting today's task-wins is
// inherently per-day and undo-safe (unticking removes the win). Manual mini-wins
// (no src) and habit wins ('habit_' src) are excluded so nothing double-counts.
function _taskWinCount(dateKey) {
  const wins = LS.get('ci_wins') || [];
  return wins.filter(w => w.date === dateKey && /^(wrapact-|task-)/.test(String(w.src || ''))).length;
}
// Set of days with ≥1 completed task — memoized so the 365-day ring scan doesn't
// re-filter every win on every _getRings call. Cache key = win count + newest ts,
// which changes on any add/remove (unshift/delete), so it self-invalidates.
let _twCache = { key: null, set: null };
function _taskWinDates() {
  const wins = LS.get('ci_wins') || [];
  const cacheKey = wins.length + ':' + (wins[0] ? wins[0].ts : 0);
  if (_twCache.key === cacheKey) return _twCache.set;
  const set = new Set();
  for (const w of wins) if (/^(wrapact-|task-)/.test(String(w.src || ''))) set.add(w.date);
  _twCache = { key: cacheKey, set };
  return set;
}
function _hasTaskWin(dateKey) { return _taskWinDates().has(dateKey); }
export function dailyPoints(dateKey) {
  const key = dateKey || _todayKey();
  const r = _getRings(key);
  let pts = _taskWinCount(key) * PTS.task + _doneHabitCount(key) * PTS.habit + _closedCount(r) * PTS.anchor;
  if (r.gratitude) pts += PTS.gratitude;
  if (r.meditate)  pts += PTS.anchor;     // Meditate is now a bonus ring (+5), like Gratitude
  if (_mindLoopEarned(key)) pts += PTS.mindloop;
  if (_isPerfect(r)) pts += PTS.perfect;
  return pts;
}

/* Derived momentum — recomputed each render over a rolling window.
   Perfect day +12, partial +4, empty -8. Floored 0, capped 100.
   This gives "dim & recover" with no cron: misses just age out. */
function _computeMomentum() {
  let score = 0;
  const today = new Date();
  const winDays = new Set((LS.get('ci_wins') || []).map(w => w.date));
  for (let i = MOMENTUM_WINDOW - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = _dayKey(d);
    const c = _closedCount(_getRings(key));
    if (c === 3) score += 12;
    else if (c > 0) score += 4;
    else score -= 8;
    if (winDays.has(key)) score += 3;
    score = Math.max(0, Math.min(100, score));
  }
  // Current streak of Perfect Days, with ONE freeze: a single missed day in
  // the run doesn't break the streak (Duolingo-style grace). Two misses do.
  let streak = 0, freezeUsed = false;
  for (let i = 0; i < MOMENTUM_WINDOW + 1; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const perfect = _isPerfect(_getRings(_dayKey(d)));
    if (perfect) { streak++; continue; }
    if (i === 0) continue;              // today not yet perfect — keep counting prior days
    if (!freezeUsed) { freezeUsed = true; continue; }   // spend the freeze on the first miss
    break;                             // second miss ends the streak
  }
  return { score, streak };
}

/* ── Summaries for the Evening Wrap-Up ───────────────── */
export function ringsSummary() {
  const r = _getRings(_todayKey());
  const { score, streak } = _computeMomentum();
  return {
    closed:  PILLARS.filter(p => r[p.key]).map(p => p.label),
    open:    PILLARS.filter(p => !r[p.key]).map(p => p.label),
    perfect: _isPerfect(r),
    count:   _closedCount(r),
    gratitude: !!r.gratitude,
    points:  dailyPoints(_todayKey()),
    score, streak,
  };
}

export function ringsWeekSummary() {
  const today = new Date();
  let perfectDays = 0, pillarsClosed = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const c = _closedCount(_getRings(_dayKey(d)));
    pillarsClosed += c;
    if (c === 3) perfectDays++;
  }
  return { perfectDays, pillarsClosed };
}

/* ── Toggle one ring for today (tap) ─────────────────── */
/* Launch the gratitude session in the dashboard's player column. Credit is
   granted only when it finishes (playerFinished → markPillar('gratitude')). */
export function launchGratitude(ev) {
  const src = `players/gratitude.html?_=${_todayKey()}`;
  if (typeof window !== 'undefined' && typeof window.openPlayerInColumn === 'function') window.openPlayerInColumn(src, ev);
  else if (typeof window !== 'undefined') window.location.href = src;
}

export function toggleRing(key) {
  // All non-tappable: review/habits are derived; meditate & gratitude are
  // session-only (un-fakeable) — no tap ever grants credit.
  if (key === 'review' || key === 'habits' || key === 'meditate' || key === 'gratitude') return;
  const today = _todayKey();
  const rings = _rawRings(today);
  if (!(key in rings)) return;
  const wasPerfect = _isPerfect(_getRings(today));
  rings[key] = !rings[key];
  _setRings(today, rings);
  if (!wasPerfect && _isPerfect(_getRings(today))) _celebratePerfect();
  renderRings();
  renderWrapup();
}

/* Cumulative lifetime Perfect Days — scan all ci_rings_* day records. */
export function totalPerfectDays() {
  let n = 0;
  try {
    for (const k of Object.keys(localStorage)) {
      if (!k.startsWith('ci_rings_')) continue;
      // Use the derived reader so a Perfect Day reflects Completed-Tasks, not the
      // stale stored 'review' flag from the old affirmation-based pillar.
      if (_isPerfect(_getRings(k.slice('ci_rings_'.length)))) n++;
    }
  } catch (e) {}
  return n;
}

/* Current tier + next tier, from cumulative Perfect Days. */
export function currentTier() {
  const total = totalPerfectDays();
  let tier = TIERS[0], next = null;
  for (let i = 0; i < TIERS.length; i++) {
    if (total >= TIERS[i].min) tier = TIERS[i];
    else { next = TIERS[i]; break; }
  }
  return { tier, next, total };
}

/* Map a player URL to the ring a completed session should close.
   null = that player doesn't count toward a ring (e.g. countdown). */
export function pillarForSrc(src) {
  const s = (src || '').toLowerCase();
  if (/gratitude/.test(s)) return 'gratitude';
  if (/meditation/.test(s)) return 'meditate';
  if (/creative-viz|3min-viz|viz-player|visualization|manifest|art-frame/.test(s)) return 'visualize';
  // 'review' is no longer session-closed — it's the derived Completed-Tasks ring.
  return null;
}

/* Close a ring from a COMPLETED session (idempotent for the day) and
   bump its lifetime counter. Called by playerFinished(). */
export function markPillar(key) {
  const valid = PILLARS.some(p => p.key === key) || key === GRATITUDE.key || key === MEDITATE.key;
  if (!valid) return;
  if (key === 'review' || key === 'habits') return;   // derived rings — not session-closed
  const today = _todayKey();
  const rings = _rawRings(today);
  const wasPerfect = _isPerfect(_getRings(today));
  if (!rings[key]) {
    rings[key] = true; _setRings(today, rings);
    // Confirm the credit so a completed session visibly "registers" on the board.
    const meta = PILLARS.find(p => p.key === key) || (key === GRATITUDE.key ? GRATITUDE : MEDITATE);
    const val  = key === GRATITUDE.key ? PTS.gratitude : PTS.anchor;
    try { toast(`✦ ${meta.label} complete · +${val}`, 'success'); } catch (e) {}
  }

  if (key === 'visualize') LS.set('ci_viz_plays', (LS.get('ci_viz_plays') || 0) + 1);
  if (key === 'meditate')  LS.set('ci_med_plays', (LS.get('ci_med_plays') || 0) + 1);

  if (!wasPerfect && _isPerfect(_getRings(today))) _celebratePerfect();
  renderRings();
  renderWrapup();
}

/* ── Perfect-Day celebration (grayscale confetti + soft chime) ── */
function _celebratePerfect() {
  toast('✦ Perfect Day — all 3 anchors closed', 'success');
  try { _confetti(); } catch (e) {}
  try { _chime(); } catch (e) {}
}
function _confetti() {
  if (typeof document === 'undefined') return;
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
  // Celebratory confetti — pull theme color tokens so it pops on any theme.
  let grays = ['#4ade80', '#f5a623', '#ff8ab8', '#3d7fd4'];
  try {
    const cs = getComputedStyle(document.body), pk = (v, f) => (cs.getPropertyValue(v).trim() || f);
    grays = [pk('--success', '#4ade80'), pk('--brand', '#f5a623'), pk('--pink', '#ff8ab8'), pk('--accent', '#3d7fd4')];
  } catch (e) {}
  const N = 90, bits = [];
  for (let i = 0; i < N; i++) bits.push({
    x: W / 2 + (i - N / 2) * 3, y: H * 0.28,
    vx: (i / N - 0.5) * 9, vy: -6 - (i % 7),
    s: 4 + (i % 4) * 2, c: grays[i % grays.length], r: i * 0.3,
  });
  let t = 0;
  (function frame() {
    t++; ctx.clearRect(0, 0, W, H);
    bits.forEach(b => {
      b.vy += 0.32; b.x += b.vx; b.y += b.vy; b.r += 0.2;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
      ctx.globalAlpha = Math.max(0, 1 - t / 90);
      ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 2, b.s, b.s * 0.6);
      ctx.restore();
    });
    if (t < 90) requestAnimationFrame(frame); else cv.remove();
  })();
}
function _chime() {
  if (typeof window === 'undefined' || !(window.AudioContext || window.webkitAudioContext)) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  const ac = new AC();
  [523.25, 659.25, 783.99].forEach((f, i) => {   // C-E-G, a soft ascending triad
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = f;
    const t0 = ac.currentTime + i * 0.11;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.18, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
    o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + 0.65);
  });
}

/* ── Render helpers ──────────────────────────────────── */
const _mono = 'font-family:var(--vault-mono),ui-monospace,Menlo,Consolas,monospace;';
function _ringSVG(sz, r, sw, closed, strokeCol) {
  const c = sz / 2, circ = Math.round(2 * Math.PI * r);
  return `<svg width="${sz}" height="${sz}" style="transform:rotate(-90deg);display:block;">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${G.track}" stroke-width="${sw}"/>
    ${closed ? `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${strokeCol}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="0"/>` : ''}
  </svg>`;
}

/* ── Nested Big-3 rings (Daily / Weekly / Monthly / Yearly) ──
   Four concentric progress rings per anchor, outer→inner. Each ring =
   % of that horizon's days the anchor was closed. Horizon hues are FIXED
   (not theme grays) — the whole point is four distinguishable colors — but
   they're saturated mid-tones so they stay legible on dark AND light themes. */
const RING_SZ = 96, RING_SW = 6;
const RING_R  = [42, 32, 22, 12];   // Daily, Weekly, Monthly, Yearly
const HORIZONS = [
  { key: 'daily',   label: 'DAILY',   col: '#ff5a5a' },
  { key: 'weekly',  label: 'WEEKLY',  col: '#f5b301' },
  { key: 'monthly', label: 'MONTHLY', col: '#28c7b7' },
  { key: 'yearly',  label: 'YEARLY',  col: '#8b7bf7' },
];

function _nestedRingSVG(fracs) {
  const c = RING_SZ / 2;
  const arcs = RING_R.map((r, i) => {
    const circ = 2 * Math.PI * r;
    const frac = Math.max(0, Math.min(1, fracs[i]));
    const track = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${G.track}" stroke-width="${RING_SW}"/>`;
    if (frac <= 0) return track;
    const off = circ * (1 - frac);
    return track + `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${HORIZONS[i].col}" stroke-width="${RING_SW}" stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>`;
  }).join('');
  return `<svg width="${RING_SZ}" height="${RING_SZ}" style="transform:rotate(-90deg);display:block;">${arcs}</svg>`;
}

/* One pass over the last 365 days → per-anchor horizon fractions + current
   streak. Daily is binary (done today?); weekly/monthly/yearly = done-days ÷
   7/30/365. Streak = consecutive closed days ending today (0 once today lapses,
   so the center reads "keep it alive today"). One LS.get per day, not per anchor. */
function _allAnchorStats() {
  const keys = PILLARS.map(p => p.key);
  const today = new Date();
  const acc = {};
  keys.forEach(k => acc[k] = { w: 0, m: 0, y: 0, streak: 0, live: true, daily: 0 });
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const r = _getRings(_dayKey(d));
    keys.forEach(k => {
      const done = !!r[k];
      const a = acc[k];
      if (done) { a.y++; if (i < 30) a.m++; if (i < 7) a.w++; if (i === 0) a.daily = 1; }
      // streak: count while the run of closed days is unbroken from today
      if (a.live) { if (done) a.streak++; else a.live = false; }
    });
  }
  const out = {};
  keys.forEach(k => {
    const a = acc[k];
    out[k] = { daily: a.daily, weekly: a.w / 7, monthly: a.m / 30, yearly: a.y / 365, streak: a.streak };
  });
  return out;
}

/* ── Render the widget ───────────────────────────────── */
export function renderRings() {
  const el = document.getElementById('ringsWidget');
  if (!el) return;

  const today = _todayKey();
  const rings = _getRings(today);
  const { score, streak } = _computeMomentum();
  const perfect = _isPerfect(rings);
  const { tier, next, total } = currentTier();
  const points = dailyPoints(today);

  // 3 anchor rings — DISPLAY ONLY, never faked by tapping. Completed Tasks closes
  // from finishing a task; Visualize/Meditate close from a real session
  // (playerFinished → markPillar). Each is 4 nested horizons; center = streak.
  const stats = _allAnchorStats();

  // Horizontal grid: rows = horizons (Daily→Yearly), columns = the 3 pillars.
  // Each cell is a horizontal progress bar in that horizon's colour. Row labels
  // carry the colour dot, so no separate legend is needed.
  const pillarHead = PILLARS.map(p => {
    const done = !!rings[p.key];
    const s = stats[p.key];
    const tip = done ? `${p.label} done today` : p.hint;
    return `<div title="${tip}" style="text-align:center;${_mono}font-size:10px;font-weight:800;letter-spacing:.4px;color:${done ? G.done : G.lite};">
        <span style="display:block;font-size:15px;margin-bottom:2px;color:${done ? G.done : G.mid};">${p.icon}</span>${p.label.toUpperCase()}
        <span style="display:block;font-size:8.5px;font-weight:800;color:${done ? G.done : G.dim};margin-top:2px;">${done ? '✓ ' : ''}+${PTS.anchor}</span>
        ${s.streak > 0 ? `<span style="display:block;font-size:9px;color:${G.brand};margin-top:1px;">🔥${s.streak}</span>` : ''}
      </div>`;
  }).join('');
  const barRows = HORIZONS.map(h => {
    const label = `<div style="display:flex;align-items:center;gap:6px;${_mono}font-size:9px;font-weight:800;letter-spacing:.3px;color:${G.mid};">
        <span style="width:9px;height:9px;border-radius:50%;flex:0 0 auto;background:${h.col};"></span>${h.label}</div>`;
    const bars = PILLARS.map(p => {
      const frac = Math.max(0, Math.min(1, stats[p.key][h.key]));
      return `<div title="${h.label} · ${p.label}: ${Math.round(frac * 100)}%" style="position:relative;height:11px;background:${G.track};border-radius:6px;overflow:hidden;">
          <div style="position:absolute;left:0;top:0;bottom:0;width:${(frac * 100).toFixed(0)}%;background:${h.col};border-radius:6px;transition:width .3s;"></div>
        </div>`;
    }).join('');
    return label + bars;
  }).join('');
  const bigGrid = `
    <div style="display:grid;grid-template-columns:64px 1fr 1fr 1fr;gap:9px 10px;align-items:center;margin-bottom:6px;">
      <div></div>${pillarHead}${barRows}
    </div>`;

  // Bonus rings (Gratitude, then Meditate) — earn points, not required for a
  // Perfect Day. Gratitude is tappable; Meditate closes only from a session.
  // Both bonus rings are un-fakeable — earned only by completing their session,
  // never a tap-to-credit. Gratitude's heart LAUNCHES its player (finish → ring
  // closes via markPillar); Meditate is a static indicator (launched from its
  // own grid). onclick null = static.
  const _bonusCfg = {
    gratitude: { col: G.grat,     pts: PTS.gratitude, onclick: 'launchGratitude(event)', sub: 'Bonus ring — play to earn (not required for a Perfect Day)', title: 'Play a gratitude session' },
    meditate:  { col: '#8b7bf7',  pts: PTS.anchor,    onclick: null,                     sub: 'Bonus ring — closes from a meditation session',              title: 'Closes when you finish a meditation session' },
  };
  const bonus = BONUS.map(b => {
    const on  = !!rings[b.key];
    const cfg = _bonusCfg[b.key] || _bonusCfg.gratitude;
    const col = cfg.col, val = cfg.pts;
    const icon = `${_ringSVG(44, 18, 4, on, col)}<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:16px;color:${on ? col : G.dim};">${b.icon}</span>`;
    const knob = cfg.onclick
      ? `<button onclick="${cfg.onclick}" title="${cfg.title}" style="position:relative;width:44px;height:44px;flex:0 0 auto;background:none;border:none;cursor:pointer;padding:0;">${icon}</button>`
      : `<span title="${cfg.title}" style="position:relative;width:44px;height:44px;flex:0 0 auto;display:inline-block;">${icon}</span>`;
    const sub = cfg.sub;
    return `
    <div style="margin-top:10px;padding-top:12px;border-top:1px dashed ${G.track};display:flex;align-items:center;gap:12px;">
      ${knob}
      <span style="flex:1;min-width:0;">
        <div style="font-weight:800;font-size:13px;color:${G.bright};">${b.label}${on ? ' ✓' : ''}</div>
        <div style="font-size:11px;color:${G.dim};margin-top:2px;">${sub}</div>
      </span>
      <span style="${_mono}font-size:9px;font-weight:800;letter-spacing:1px;color:${col};border:1px solid ${col};border-radius:999px;padding:4px 9px;white-space:nowrap;">+${val} BONUS</span>
    </div>`;
  }).join('');

  // Week strip — last 7 days ending today
  const wd = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  let weekCells = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const c = _closedCount(_getRings(_dayKey(d)));
    const isToday = i === 0;
    let box;
    if (c === 3)      box = `background:${G.done};color:#0b3d1a;`;                 // green = perfect day
    else if (c > 0)   box = `background:${G.faint};color:${G.mid};border:1px solid ${G.track};`;
    else              box = `background:transparent;color:${G.dim};border:1px solid ${G.track};`;
    const face = c === 3 ? '✓' : c > 0 ? String(c) : '·';
    weekCells += `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
      <span style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;${_mono}font-size:11px;font-weight:800;${box}${isToday ? `outline:2px solid ${G.bright};outline-offset:2px;` : ''}">${face}</span>
      <span style="${_mono}font-size:8px;color:${G.dim};">${wd[d.getDay()]}</span>
    </div>`;
  }

  el.innerHTML = `
    <div style="background:${G.bg};border:1px solid ${perfect ? G.done : G.border};border-radius:16px;padding:16px 16px 18px;margin-bottom:8px;transition:border-color .3s;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="${_mono}font-size:12px;font-weight:800;letter-spacing:1.5px;color:${G.bright};">◈ THE BIG 3</span>
        <span style="${_mono}font-size:12px;font-weight:800;color:${G.mid};"><b style="font-size:16px;color:${G.brand};">${points}</b> pts today</span>
      </div>
      <div style="display:flex;justify-content:flex-end;margin:0 0 12px;"><span style="${_mono}font-size:11px;color:${G.dim};letter-spacing:.5px;">🔥 ${streak} DAY STREAK</span></div>

      <!-- Evening Wrap-Up story slot — filled by renderWrapup() (see call at end of renderRings). -->
      <div id="wrapupWidget"></div>

      ${bigGrid}
      ${bonus}
      ${perfect ? `<div style="text-align:center;${_mono}font-size:10px;letter-spacing:1px;color:${G.done};margin:14px 0 4px;font-weight:800;">✦ PERFECT DAY — all 3 closed · +${PTS.perfect} bonus</div>` : ''}

      <div style="display:flex;justify-content:space-between;${_mono}font-size:9px;letter-spacing:1px;color:${G.dim};margin:16px 0 5px;">
        <span>MOMENTUM</span><span>${score}</span>
      </div>
      <div style="height:7px;background:${G.faint};border:1px solid ${G.track};border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${score}%;background:linear-gradient(90deg,${G.brand},color-mix(in srgb,${G.brand} 55%,#ff5e1a));border-radius:4px;transition:width .3s;"></div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
        <span style="${_mono}font-size:11px;font-weight:800;letter-spacing:.5px;color:${G.lite};">⛨ ${tier.name.toUpperCase()}</span>
        <span style="${_mono}font-size:9px;color:${G.dim};letter-spacing:.5px;">${total} Perfect Day${total === 1 ? '' : 's'}${next ? ` · ${next.min - total} to ${next.name}` : ''}</span>
      </div>

      <div style="margin-top:16px;padding-top:14px;border-top:1px solid ${G.border};">
        <div style="${_mono}font-size:9px;letter-spacing:1px;color:${G.dim};margin-bottom:9px;">THIS WEEK</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;">${weekCells}</div>
      </div>
    </div>`;

  // Fill the Evening Wrap-Up story slot we just rendered above the pillars.
  // Runtime call (NOT an import) → no circular-load risk; wrapup.js never calls
  // back into renderRings, so there's no render loop.
  if (typeof window !== 'undefined' && typeof window.renderWrapup === 'function') window.renderWrapup();
}

/* app.js calls this once, passing its Supabase upsert fn (see cross-device sync). */
export function _wireRingsSync(fn) { syncRingsToSupabase = fn; }
