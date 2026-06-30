import { ringsSummary, ringsWeekSummary, currentTier } from './rings.js';
import { LS, esc, toast, buildContext, getPB, intentions } from '../app.js';
/* ── EVENING WRAP-UP ─────────────────────────────────────
   Phase 1: a STORY recap (daily + weekly), not a dashboard.
   "Here's what you did today / here's your week."
   Templated for now — the multi-pass AI personalization is a
   held future thought (see project_wrapup_tracking_vision).
───────────────────────────────────────────────────────── */

const BRAND = '#F5A623';
const DONE  = '#4ADE80';

/* Nightly checklist: every goal's 10 "Today I Will" actions with their
   done status. Clicking a row toggles it (logs a win + momentum) via the
   same toggleRoadmapTaskDone wiring, which re-renders this wrap-up. */
function _todayChecklist() {
  const items = (intentions || [])
    .map((it, idx) => ({ it, idx }))
    .filter(o => o.it && o.it.roadmapAI && Array.isArray(o.it.roadmapAI.tasks) && o.it.roadmapAI.tasks.length);
  if (!items.length) return null;
  let total = 0, done = 0, rows = '';
  items.forEach(({ it, idx }) => {
    const dones = it.roadmapAI.done || {};
    rows += `<div style="font-family:var(--vault-mono);font-size:8px;color:#888;letter-spacing:1px;margin:10px 0 4px;">◎ ${esc(it.title)}</div>`;
    it.roadmapAI.tasks.forEach((t, i) => {
      const d = !!dones[i]; total++; if (d) done++;
      rows += `<div onclick="toggleRoadmapTaskDone(${idx},${i})" style="display:flex;gap:8px;align-items:flex-start;padding:5px 2px;cursor:pointer;">
        <span style="color:${d ? DONE : '#555'};font-size:14px;line-height:1.45;flex-shrink:0;">${d ? '✓' : '○'}</span>
        <span style="flex:1;min-width:0;font-size:12px;line-height:1.45;color:${d ? '#666' : '#ccc'};${d ? 'text-decoration:line-through;' : ''}">${esc(t)}</span>
      </div>`;
    });
  });
  return { rows, total, done };
}

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

function _aiKey() { return `ci_wrapup_ai_${new Date().toISOString().slice(0, 10)}`; }

/* Build a compact plain-text data summary for the AI passes. */
function _aiSummary() {
  const s = ringsSummary();
  const wk = ringsWeekSummary();
  const { tier, total } = currentTier();
  const w = _winCounts();
  const recent = (LS.get('ci_wins') || []).slice(0, 3).map(x => x.text);
  return {
    summary: [
      `Pillars today: ${s.closed.length ? s.closed.join(', ') : 'none yet'} closed (${s.count}/3)${s.perfect ? ' — a Perfect Day' : ''}.`,
      `Streak: ${s.streak} day(s). Momentum: ${s.score}/100. Rank: ${tier.name} (${total} lifetime Perfect Days).`,
      `This week: ${wk.perfectDays} Perfect Day(s), ${wk.pillarsClosed} pillars closed, ${w.week} win(s) logged.`,
    ].join(' '),
    recentWins: recent,
  };
}

/* Multi-pass AI personalization — cached per day to control cost. */
export async function wrapupPersonalize() {
  const btn = document.getElementById('wrapupAiBtn');
  if (btn) { btn.disabled = true; btn.textContent = '✦ Personalizing…'; }
  try {
    const { summary, recentWins } = _aiSummary();
    const context = typeof buildContext === 'function' ? buildContext() : '';
    const name = (typeof getPB === 'function' && getPB()['pb-name']) || 'there';
    const data = await window.ciApiJson('wrapup-ai', { name, summary, context, recentWins });
    if (data && data.paragraph) {
      LS.set(_aiKey(), data.paragraph);
      renderWrapup();
    } else {
      throw new Error('No paragraph returned');
    }
  } catch (e) {
    if (typeof toast === 'function') toast('Personalize failed — using the standard recap.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '✦ Personalize'; }
  }
}

export function renderWrapup() {
  const el = document.getElementById('wrapupWidget');
  if (!el) return;

  const w = _winCounts();
  const aiPara = LS.get(_aiKey());
  const daily  = aiPara ? esc(aiPara) : _dailyStory(ringsSummary(), w.today);
  const weekly = _weeklyStory(ringsWeekSummary(), w.week);
  const chk    = _todayChecklist();

  el.innerHTML = `
    <div style="background:#141414;border:1px solid #2a2a2a;border-radius:12px;padding:14px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:${BRAND};font-weight:800;letter-spacing:1px;">◈ EVENING WRAP-UP</div>
        ${aiPara ? `<span style="font-family:var(--vault-mono);font-size:8px;color:${BRAND};letter-spacing:0.5px;">✦ PERSONALIZED</span>` : ''}
      </div>

      <div style="font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:1px;margin-bottom:5px;">TODAY</div>
      <p style="font-size:13px;line-height:1.6;color:#ddd;margin:0 0 14px;">${daily}</p>

      <div style="font-family:var(--vault-mono);font-size:8px;color:#666;letter-spacing:1px;margin-bottom:5px;">THIS WEEK</div>
      <p style="font-size:13px;line-height:1.6;color:#ddd;margin:0 0 12px;">${weekly}</p>

      ${chk ? `
      <div style="display:flex;justify-content:space-between;align-items:center;font-family:var(--vault-mono);font-size:8px;letter-spacing:1px;margin-bottom:6px;">
        <span style="color:#666;">TODAY I WILL — TICK WHAT YOU DID</span>
        <span style="color:${chk.total && chk.done === chk.total ? DONE : '#888'};">${chk.done}/${chk.total} done</span>
      </div>
      <div style="max-height:220px;overflow-y:auto;border:1px solid #222;border-radius:8px;padding:2px 10px 6px;margin-bottom:14px;">${chk.rows}</div>` : ''}

      <button id="wrapupAiBtn" onclick="wrapupPersonalize()"
        style="background:none;border:1px solid #383838;border-radius:6px;padding:7px 12px;font-family:var(--vault-mono);font-size:9px;color:#999;cursor:pointer;letter-spacing:0.5px;">
        ${aiPara ? '↺ Regenerate' : '✦ Personalize'}</button>
    </div>`;
}
