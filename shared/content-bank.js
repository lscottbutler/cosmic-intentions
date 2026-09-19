import { getPB } from '../app.js';
import { CONTENT_BANK, getDailyAffirmation, getDailyBelief, getDailyQuote, getDailyStoic } from './daily-inspiration.js';
export { getDailyAffirmation, getDailyBelief, getDailyQuote, getDailyStoic, getDailyInspiration } from './daily-inspiration.js';
/* ─────────────────────────────────────────────────────────
   CONTENT BANK — Rotating affirmations, beliefs, quotes, stoic
   Daily seed: same content all day, rotates at midnight.
   Personal layer: mixes user's own Pegboard data in pass 2.
───────────────────────────────────────────────────────── */

/* Slot-specific formatted HTML */
export function getDailyLine(slot) {
  switch (slot) {

    case 'sidebar': {
      const s = getDailyStoic();
      return `<div id="dailySidebarQuote" style="
        font-size:10px;color:#404048;font-style:italic;
        line-height:1.5;margin-top:6px;padding-top:6px;
        border-top:1px solid #1a1a1a;letter-spacing:0.2px;
      ">${s}</div>`;
    }

    case 'dashboard-sub': {
      const a = getDailyAffirmation();
      return `<div id="dailyDashAffirmation" style="
        font-size:11px;color:#F5A623;font-style:italic;
        margin-top:8px;line-height:1.5;letter-spacing:0.2px;
        border-left:2px solid #F5A62355;padding-left:10px;
      ">${a}</div>`;
    }

    case 'home-banner': {
      const q = getDailyQuote();
      return `<div id="dailyHomeBanner" style="
        text-align:center;padding:28px 24px;
        border-top:1px solid #1a1a1a;border-bottom:1px solid #1a1a1a;
        margin:0;
      ">
        <div style="font-size:14px;color:#888;font-style:italic;line-height:1.6;max-width:480px;margin:0 auto;">
          "${q.text}"
        </div>
        <div style="font-size:11px;color:#444;margin-top:8px;letter-spacing:1px;text-transform:uppercase;">
          — ${q.author}
        </div>
      </div>`;
    }

    default: return '';
  }
}

/* ── PERSONAL LAYER (pass 2) ─────────────────────────────
   Mixes user's own Pegboard beliefs/quotes into rotation.
   Call after getPB() is available.
───────────────────────────────────────────────────────── */
export function injectPersonalContent() {
  try {
    const pb = typeof getPB === 'function' ? getPB() : {};
    if (pb['pb-beliefs']) {
      const personal = pb['pb-beliefs'].split('\n').map(s => s.trim()).filter(Boolean);
      if (personal.length) CONTENT_BANK.beliefs.push(...personal);
    }
    if (pb['pb-attitudes']) {
      const attitudes = pb['pb-attitudes'].split('\n').map(s => s.trim()).filter(Boolean);
      if (attitudes.length) CONTENT_BANK.affirmations.push(...attitudes);
    }
  } catch(e) {}
}
