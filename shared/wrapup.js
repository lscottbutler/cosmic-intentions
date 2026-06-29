import { ringsSummary, ringsWeekSummary } from './rings.js';
import { LS } from '../app.js';
/* ── EVENING WRAP-UP ─────────────────────────────────────
   Phase 1: a STORY recap (daily + weekly), not a dashboard.
   "Here's what you did today / here's your week."
   Templated for now — the multi-pass AI personalization is a
   held future thought (see project_wrapup_tracking_vision).
───────────────────────────────────────────────────────── */

const BRAND = '#F5A623';

/* Join labels into natural prose: "Review and Visualize",
   "Review, Visualize and Meditate". */
function _list(arr) {
  if (!arr.length) return '';
  if (arr.length === 1) return arr[0];
  return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
}

function _streakPhrase(streak) {
  if (streak <= 0) return '';
  return ` You're ${streak} day${streak === 1 ? '' : 's'} into your streak.`;
}

function _winPhrase(n) {
  if (n <= 0) return '';
  return ` You also logged ${n} win${n === 1 ? '' : 's'} — that momentum counts.`;
}

function _dailyStory(s, winsToday) {
  if (s.perfect) {
    return `You closed all three pillars today — a Perfect Day. That keeps your ${s.streak}-day streak alive and pushes momentum to ${s.score}.${_winPhrase(winsToday)} This is exactly how it compounds.`;
  }
  if (s.count === 0) {
    return `The day's still open. Close your three pillars — Review, Visualize and Meditate — to keep things moving.${_streakPhrase(s.streak)}${_winPhrase(winsToday)}`;
  }
  const closed = _list(s.closed);
  const open   = _list(s.open);
  const it     = s.open.length === 1 ? 'it' : 'them';
  return `So far today you've handled ${closed} — ${open} still to go. Close ${it} for a Perfect Day.${_streakPhrase(s.streak)}${_winPhrase(winsToday)}`;
}

function _weeklyStory(w, winsWeek) {
  const trend =
    w.perfectDays >= 4 ? 'You’re on a roll.' :
    w.perfectDays >= 1 ? 'Building nicely — keep stacking them.' :
    'A fresh week to stack some wins.';
  const winsBit = winsWeek > 0 ? ` ${winsWeek} win${winsWeek === 1 ? '' : 's'} logged.` : '';
  return `This week: ${w.perfectDays} Perfect Day${w.perfectDays === 1 ? '' : 's'} and ${w.pillarsClosed} pillar${w.pillarsClosed === 1 ? '' : 's'} closed in all.${winsBit} ${trend}`;
}

/* Win counts straight from the store (no import cycle with wins.js). */
function _winCounts() {
  const wins = LS.get('ci_wins') || [];
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
  const weekKey = weekAgo.toISOString().slice(0, 10);
  return {
    today: wins.filter(w => w.date === today).length,
    week:  wins.filter(w => w.date >= weekKey).length,
  };
}

export function renderWrapup() {
  const el = document.getElementById('wrapupWidget');
  if (!el) return;

  const w = _winCounts();
  const daily  = _dailyStory(ringsSummary(), w.today);
  const weekly = _weeklyStory(ringsWeekSummary(), w.week);

  el.innerHTML = `
    <div style="background:#141414;border:1px solid #2a2a2a;border-radius:12px;padding:14px;margin-bottom:8px;">
      <div style="font-family:var(--vault-mono);font-size:10px;color:${BRAND};font-weight:800;letter-spacing:1px;margin-bottom:12px;">◈ EVENING WRAP-UP</div>

      <div style="font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:1px;margin-bottom:5px;">TODAY</div>
      <p style="font-size:13px;line-height:1.6;color:#ddd;margin:0 0 14px;">${daily}</p>

      <div style="font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:1px;margin-bottom:5px;">THIS WEEK</div>
      <p style="font-size:13px;line-height:1.6;color:#ddd;margin:0;">${weekly}</p>
    </div>`;
}
