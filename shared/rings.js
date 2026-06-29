import { LS, toast } from '../app.js';
import { renderWrapup } from './wrapup.js';
/* ── DAILY PILLARS (RINGS) ───────────────────────────────
   Phase 1 of the Evening Wrap-Up / tracking system.
   Three daily disciplines — Review · Visualize · Meditate.
   Close all 3 = a Perfect Day. Momentum dims & recovers
   (kind, never hard-resets). See project_wrapup_tracking_vision.

   v1: rings are TAP-to-close (manual). Auto-closing from real
   viz/meditation session completion is the next slice — those
   counters (ci_viz_plays/ci_med_plays) aren't wired yet.

   Depends on globals (from app.js): LS, toast.
───────────────────────────────────────────────────────── */

export const PILLARS = [
  { key: 'review',    label: 'Review',    icon: '◎', hint: 'Review your goals' },
  { key: 'visualize', label: 'Visualize', icon: '✦', hint: 'Creative visualization' },
  { key: 'meditate',  label: 'Meditate',  icon: '☾', hint: 'Meditation session' },
];

const MOMENTUM_WINDOW = 30;   // days scanned to derive momentum
const DONE  = '#4ADE80';
const BRAND = '#F5A623';

function _dayKey(d) { return d.toISOString().slice(0, 10); }
function _todayKey() { return _dayKey(new Date()); }

function _getRings(dateKey) {
  return LS.get(`ci_rings_${dateKey}`) || { review: false, visualize: false, meditate: false };
}
function _setRings(dateKey, rings) {
  LS.set(`ci_rings_${dateKey}`, rings);
}
function _closedCount(r) {
  return (r.review ? 1 : 0) + (r.visualize ? 1 : 0) + (r.meditate ? 1 : 0);
}
function _isPerfect(r) {
  return r.review && r.visualize && r.meditate;
}

/* Derived momentum — recomputed each render over a rolling window.
   Perfect day +12, partial +4, empty -8. Floored 0, capped 100.
   This gives "dim & recover" with no cron: misses just age out. */
function _computeMomentum() {
  let score = 0;
  const today = new Date();
  for (let i = MOMENTUM_WINDOW - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const c = _closedCount(_getRings(_dayKey(d)));
    if (c === 3) score += 12;
    else if (c > 0) score += 4;
    else score -= 8;
    score = Math.max(0, Math.min(100, score));
  }
  // Current streak of Perfect Days. Today-in-progress doesn't break it.
  let streak = 0;
  for (let i = 0; i < MOMENTUM_WINDOW + 1; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const perfect = _isPerfect(_getRings(_dayKey(d)));
    if (perfect) streak++;
    else if (i === 0) continue;   // today not yet perfect — keep counting prior days
    else break;
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

/* ── Toggle one pillar for today ─────────────────────── */
export function toggleRing(key) {
  const today = _todayKey();
  const rings = _getRings(today);
  if (!(key in rings)) return;
  const wasPerfect = _isPerfect(rings);
  rings[key] = !rings[key];
  _setRings(today, rings);
  if (!wasPerfect && _isPerfect(rings)) {
    toast('✦ Perfect Day — all 3 pillars closed', 'success');
  }
  renderRings();
  renderWrapup();
}

/* Map a player URL to the pillar a completed session should close.
   null = that player doesn't count toward a pillar (e.g. countdown). */
export function pillarForSrc(src) {
  const s = (src || '').toLowerCase();
  if (/meditation/.test(s)) return 'meditate';
  if (/creative-viz|3min-viz|viz-player|visualization|manifest|art-frame/.test(s)) return 'visualize';
  if (/affirmation|recite|ass-template/.test(s)) return 'review';
  return null;
}

/* Close a pillar from a COMPLETED session (idempotent for the day) and
   bump its lifetime counter. Called by playerFinished(). */
export function markPillar(key) {
  if (!PILLARS.some(p => p.key === key)) return;
  const today = _todayKey();
  const rings = _getRings(today);
  const wasPerfect = _isPerfect(rings);
  if (!rings[key]) { rings[key] = true; _setRings(today, rings); }

  // Lifetime play counters (finally wired — feed the stats row too).
  if (key === 'visualize') LS.set('ci_viz_plays', (LS.get('ci_viz_plays') || 0) + 1);
  if (key === 'meditate')  LS.set('ci_med_plays', (LS.get('ci_med_plays') || 0) + 1);

  if (!wasPerfect && _isPerfect(rings)) toast('✦ Perfect Day — all 3 pillars closed', 'success');
  renderRings();
  renderWrapup();
}

/* ── Render the widget ───────────────────────────────── */
export function renderRings() {
  const el = document.getElementById('ringsWidget');
  if (!el) return;

  const rings = _getRings(_todayKey());
  const { score, streak } = _computeMomentum();
  const perfect = _isPerfect(rings);

  const cells = PILLARS.map(p => {
    const done = !!rings[p.key];
    return `
      <button onclick="toggleRing('${p.key}')" title="${p.hint}"
        style="display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:none;cursor:pointer;padding:0;">
        <span style="width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-size:20px;line-height:1;transition:all .15s;
          ${done
            ? `background:${DONE};color:#0a0a0a;border:2px solid ${DONE};box-shadow:0 0 12px rgba(74,222,128,0.35);`
            : `background:#161616;color:#666;border:2px solid #333;`}">
          ${done ? '✓' : p.icon}</span>
        <span style="font-family:var(--vault-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;
          color:${done ? DONE : '#888'};">${p.label}</span>
      </button>`;
  }).join('');

  el.innerHTML = `
    <div style="background:#141414;border:1px solid ${perfect ? DONE : '#2a2a2a'};border-radius:12px;padding:14px;margin-bottom:8px;transition:border-color .3s;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:${BRAND};font-weight:800;letter-spacing:1px;">◈ TODAY'S 3 PILLARS</div>
        <div style="font-family:var(--vault-mono);font-size:10px;color:${streak > 0 ? BRAND : '#505058'};">🔥 ${streak} day${streak === 1 ? '' : 's'}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">
        ${cells}
      </div>
      ${perfect ? `<div style="text-align:center;font-family:var(--vault-mono);font-size:10px;color:${DONE};letter-spacing:0.5px;margin-bottom:10px;">✦ PERFECT DAY — all 3 pillars closed</div>` : ''}
      <div style="display:flex;justify-content:space-between;font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:1px;margin-bottom:4px;">
        <span>MOMENTUM</span><span>${score}</span>
      </div>
      <div style="height:6px;background:#1A1A1A;border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${score}%;background:linear-gradient(90deg,${BRAND},#FF7A1A);border-radius:3px;transition:width .3s;"></div>
      </div>
    </div>`;
}
