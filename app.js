import { backfillGoalImages, buildCardHTML, buildRoadmapPanel, generateMindset, hideAddForm, renderPBIntentionList, runSurgicalVisualLoop, stopSurgicalVisualLoop } from './shared/card-builder.js';
import { getDailyLine, injectPersonalContent } from './shared/content-bank.js';
import { renderTodayStrip, renderTodayView } from './shared/today.js';
import { _hasBbfw, _hasTheMap, _paintStrategyPanel, _parseJsonField, closeViz, hydrateIntent, seedGoalPractice } from './shared/the-map.js';
import { _wfLoadChecks } from './shared/weekly-focus.js';
import { logActivity, logDailyLogin } from './shared/activity.js';
import { renderRings, _wireRingsSync, vizSideStatsHTML } from './shared/rings.js';
import { mountDissolve, stopDissolve } from './shared/dissolve.js';
import { renderWrapup } from './shared/wrapup.js';
import { renderHabits, renderRunThroughs, getHabitList } from './shared/habits.js';
import { renderWins } from './shared/wins.js';
import { renderSleepLoop } from './shared/sleeploop.js';
/* ─────────────────────────────────────────────────────────
   DEV MODE
───────────────────────────────────────────────────────── */
// Stub AI responses on localhost (fast, free dev); use the real OpenAI
// functions everywhere else (production). Override by hardcoding true/false.
const DEV_MODE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

/* ─────────────────────────────────────────────────────────
   STRIPE — REPLACE THESE WITH YOUR PAYMENT LINK URLs
   Create at: dashboard.stripe.com → Payment Links
   Append ?client_reference_id=USER_ID for tracking
───────────────────────────────────────────────────────── */
const STRIPE_MONTHLY_URL = 'https://buy.stripe.com/dRm6oB1ri1TF0uW5nG7kc02';
const STRIPE_ANNUAL_URL  = 'https://buy.stripe.com/bJe14hfi80PBa5w5nG7kc03';

/* ─────────────────────────────────────────────────────────
   LOCALSTORAGE WRAPPER
───────────────────────────────────────────────────────── */
export const LS = {
  get(key) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch(e) { console.warn('LS.set failed', e); }
  },
  remove(key) {
    try { localStorage.removeItem(key); }
    catch(e) {}
  }
};

/* Calendar date as YYYY-MM-DD in the DEVICE's own local time — NOT UTC.
   Every daily reset / "today" boundary (habits, wins, commitments, rings,
   sessions) flows through this, so each user's day flips at their own local
   midnight instead of a shared 00:00 UTC. getFullYear/getMonth/getDate are
   all local-time. Pass a Date to format it; omit for right now. */
export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* localStorage has a ~5MB quota. base64 data: image URLs (vision images) can be
   MBs each — storing them in ci_intentions blows the quota, which then blocks
   Supabase from writing its auth token → user gets logged out on every refresh.
   Strip every data: URL (anywhere in the tree) before persisting locally; the
   real image lives in Supabase Storage under imageUrl, re-fetched on load. */
function _leanForLS(arr) {
  try {
    return JSON.parse(JSON.stringify(arr, (k, v) =>
      (typeof v === 'string' && v.startsWith('data:')) ? null : v));
  } catch { return arr; }
}

/* A goal's stable alpha letter (A, B, C … AA …), locked per goal id in the
   ci_goal_letters map that wrapup.js maintains — so a goal reads the SAME letter
   on its card, in the viz library, and on its roadmap (matching its action codes
   like L1, L2). Positional fallback before the map is assigned. */
export function goalLetter(intention, idx) {
  try {
    const id = intention && intention.id;
    if (id) { const m = JSON.parse(localStorage.getItem('ci_goal_letters') || '{}') || {}; if (m[id]) return m[id]; }
  } catch (_) {}
  let s = '', n = (idx || 0) + 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/* Goal titles DISPLAY as "I AM launching…" — keep a leading "I AM" (or lone "I")
   uppercase, lowercase the rest. The stored title is untouched (edited as-typed). */
export function goalCase(t) {
  if (t == null) return t;
  const s = String(t);
  let m = s.match(/^(\s*)(i\s+am)\b(.*)$/is);
  if (m) return m[1] + 'I AM' + m[3].toLowerCase();
  m = s.match(/^(\s*)(i)\b(.*)$/is);
  if (m) return m[1] + 'I' + m[3].toLowerCase();
  return s.toLowerCase();
}
if (typeof window !== 'undefined') window.goalCase = goalCase;

/* ─────────────────────────────────────────────────────────
   SUPABASE INIT
───────────────────────────────────────────────────────── */
const SUPA_URL  = 'https://wbqzwbubbeorcknevips.supabase.co';
const SUPA_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicXp3YnViYmVvcmNrbmV2aXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTM3NzMsImV4cCI6MjA5MTAyOTc3M30.mF_YGj1E2ib0mEx07lkZyjgBzdGDT7saK8wofEjcqNc';
// Auth session is stored in IndexedDB — NOT localStorage. localStorage's ~5MB
// ceiling kept filling with app caches and squeezing/corrupting the token, which
// logged the user out on every refresh. IndexedDB is isolated and effectively
// unlimited, so the login can never be crowded out. Falls back to localStorage
// only if IndexedDB is unavailable (e.g. hardened private mode).
const authStorage = (() => {
  const DB = 'ci-auth-db', STORE = 'kv';
  let _dbP = null;
  const open = () => {
    if (_dbP) return _dbP;
    _dbP = new Promise((res, rej) => {
      let req;
      try { req = indexedDB.open(DB, 1); } catch (e) { return rej(e); }
      req.onupgradeneeded = () => { try { req.result.createObjectStore(STORE); } catch (e) {} };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    return _dbP;
  };
  const tx = (mode, run) => open().then(db => new Promise((res, rej) => {
    const r = run(db.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  return {
    getItem: (k) => tx('readonly', s => s.get(k)).then(v => (v == null ? null : v))
      .catch(() => { try { return localStorage.getItem(k); } catch (e) { return null; } }),
    setItem: (k, v) => tx('readwrite', s => s.put(v, k))
      .catch(() => { try { localStorage.setItem(k, v); } catch (e) {} }),
    removeItem: (k) => tx('readwrite', s => s.delete(k))
      .catch(() => { try { localStorage.removeItem(k); } catch (e) {} }),
  };
})();
// persistSession + autoRefreshToken keep the login on this device across
// refreshes/restarts so testing doesn't require a fresh sign-in each visit.
const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ci-auth', storage: authStorage },
});

// ── STORAGE RECLAIM — runs at load, BEFORE Supabase refreshes the token.
// localStorage was hitting the ~5MB browser ceiling, so the refreshed auth
// token couldn't be written → logout on every load even though a token existed.
// Free space by dropping stale/transient/regenerable caches; NEVER the login
// token ('ci-auth') or core user data. Everything removed re-syncs from Supabase.
function _reclaimStorage() {
  try {
    const KEEP = new Set();
    const ESSENTIAL = /^(ci_intentions|ci_favorites|ci_pegboard|ci_spirituality|ci_wins|ci_habit_list|openai_voice)/;
    const usage = () => { let b = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); b += (localStorage.getItem(k) || '').length + (k ? k.length : 0); } return b; };

    // 1. Stale auth tokens now living in IndexedDB instead (old sb-* key + the
    //    prior localStorage 'ci-auth'); remove so they can't crowd storage.
    localStorage.removeItem('ci-auth');
    Object.keys(localStorage).filter(k => /^sb-.*-auth-token$/.test(k)).forEach(k => localStorage.removeItem(k));
    // 2. Transient player hand-off blobs — rebuilt the next time a player opens.
    ['ci_ass_slides', 'ci_goal_image'].forEach(k => localStorage.removeItem(k));
    // 3. Old dated history keys (rings/habits/activity: *_YYYY-MM-DD) older than 21 days.
    const cutoff = new Date(Date.now() - 21 * 864e5).toISOString().slice(0, 10);
    Object.keys(localStorage).forEach(k => { const m = k.match(/_(\d{4}-\d{2}-\d{2})$/); if (m && m[1] < cutoff) localStorage.removeItem(k); });
    // 4. Still near the ceiling? Evict the biggest non-essential caches until safe.
    if (usage() > 3_500_000) {
      const sizes = [];
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (KEEP.has(k) || ESSENTIAL.test(k)) continue; sizes.push([k, (localStorage.getItem(k) || '').length]); }
      sizes.sort((a, b) => b[1] - a[1]);
      for (const [k] of sizes) { localStorage.removeItem(k); if (usage() < 3_000_000) break; }
    }
  } catch (e) { /* reclaim must never break the app */ }
}
_reclaimStorage();

// Always load at the TOP on refresh. Browsers default to restoring the previous
// scroll position on reload, which re-showed the page scrolled to the bottom.
if (typeof history !== 'undefined' && 'scrollRestoration' in history) history.scrollRestoration = 'manual';
if (typeof window !== 'undefined') window.addEventListener('load', () => window.scrollTo(0, 0));

// Expose the current Supabase access token to shared/api.js so every paid AI
// call carries the user's login — the server-side guard requires it (Stage B).
// Returns null when logged out (public pages), so non-gated calls still work.
window.ciAuthToken = async () => {
  try { const { data } = await sb.auth.getSession(); return data?.session?.access_token || null; }
  catch { return null; }
};
export let   currentUser   = null;
let   currentMember = false; // true = active paying member
let   syncPending   = false; // true while syncFromSupabase is in flight

/* ─────────────────────────────────────────────────────────
   CLAUDE API (DEV_MODE stub + real fetch)
───────────────────────────────────────────────────────── */
export async function callClaude(system, user, maxTokens = 800) {
  if (DEV_MODE) {
    await new Promise(r => setTimeout(r, 700));
    return JSON.stringify({
      affirmations: ["I am unstoppable","I am focused","I am wealthy",
                     "I am healthy","I am free","I am clear"],
      beliefs: ["Success is inevitable","I deserve this",
                "Action creates results","I am ready","My time is now"],
      attitudes: [
        {title:"Relentless", body:"I show up every day no matter what."},
        {title:"Grateful",   body:"I appreciate how far I've come."},
        {title:"Bold",       body:"I take action before I'm ready."},
        {title:"Focused",    body:"I eliminate what doesn't serve me."}
      ],
      meditation: "You are exactly where you need to be. Breathe deeply and trust the process.",
      quotes: [
        "The only way to do great work is to love what you do. — Steve Jobs",
        "Whether you think you can or you think you can't, you're right. — Henry Ford",
        "It always seems impossible until it's done. — Nelson Mandela",
        "Success is not final, failure is not fatal: the courage to continue is what counts. — Winston Churchill",
        "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt"
      ],
      achiever: {
        name: "Arnold Schwarzenegger",
        tagline: "Bodybuilder, actor, governor — a textbook case of vision-led reinvention across three industries."
      },
      media: {
        youtube:  ["Arnold's official channel — 'How to Visualize Success'", "Joe Rogan Experience interview clips"],
        articles: ["Tim Ferriss blog — Arnold's 6 rules of success", "Forbes — Arnold on long-term goal setting"],
        podcasts: ["Tim Ferriss Show — Arnold episodes", "The School of Greatness — Lewis Howes interview"]
      },
      risks_taken: [
        "Left home country at 21 with no English to pursue a niche sport",
        "Walked away from peak bodybuilding fame to break into Hollywood",
        "Ran for office without prior political experience"
      ],
      networking_strategy: [
        "Showed up in person — gyms, sets, parties — never just letters",
        "Became useful to mentors before asking for anything",
        "Stacked relationships across industries he hadn't entered yet"
      ],
      critical_skills: [
        "Public speaking and on-camera presence",
        "Long-horizon goal setting with weekly milestones",
        "Negotiation and self-promotion without arrogance"
      ],
      mindset_attitudes: [
        "Treat the goal as already done — only execution remains",
        "Pain is a signal, not a stop sign",
        "Reps over motivation: the work is the meditation"
      ],
      roadmap: ["Define your core vision with complete clarity","Build a daily non-negotiable routine",
                "Execute one keystone habit every morning","Track your wins weekly — never miss twice",
                "Find a mentor or accountability partner","Remove one major distraction this week",
                "Celebrate every milestone, no matter how small"]
    });
  }
  const res = await ciApi('claude', { system, user, maxTokens });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Generation failed');
  return data.text;
}

/* ─────────────────────────────────────────────────────────
   PEGBOARD
───────────────────────────────────────────────────────── */
export function getPB() {
  return LS.get('ci_pegboard') || {};
}

export function buildContext(pb) {
  const parts = [];
  if (pb['pb-name'])       parts.push(`Name: ${pb['pb-name']}`);
  if (pb['pb-mission'])    parts.push(`Life Mission: ${pb['pb-mission']}`);
  if (pb['pb-lifegol'])    parts.push(`Ultimate Goal: ${pb['pb-lifegol']}`);
  if (pb['pb-values'])     parts.push(`Core Values: ${pb['pb-values']}`);
  if (pb['pb-beliefs'])    parts.push(`Beliefs: ${pb['pb-beliefs']}`);
  if (pb['pb-attitudes'])  parts.push(`Winning Attitudes: ${pb['pb-attitudes']}`);
  if (pb['pb-stoicism'])   parts.push(`Stoic Principles: ${pb['pb-stoicism']}`);
  if (pb['pb-traits'])     parts.push(`Traits & Strengths: ${pb['pb-traits']}`);
  if (pb['bts-tone'])      parts.push(`AI Tone: ${pb['bts-tone']}`);
  if (pb['bts-authors'])   parts.push(`Mentors: ${pb['bts-authors']}`);
  if (pb['bts-obstacles']) parts.push(`Obstacles: ${pb['bts-obstacles']}`);
  if (pb['bts-why'])       parts.push(`Deeper Why: ${pb['bts-why']}`);
  if (pb['bts-context'])        parts.push(`Context: ${pb['bts-context']}`);
  if (pb['spirituality'])       parts.push(`Spirituality: ${pb['spirituality']}`);
  // Behavioral OS
  if (pb['pb-motiv'])           parts.push(`Dominant Motivation Type: ${pb['pb-motiv']}`);
  if (pb['pb-patterns'])        parts.push(`Known Failure Patterns: ${pb['pb-patterns']}`);
  if (pb['pb-identity-anchor']) parts.push(`Identity Anchor: ${pb['pb-identity-anchor']}`);
  if (pb['pb-hotstate-start'])  parts.push(`Hot State Hours: ${pb['pb-hotstate-start']}:00–${pb['pb-hotstate-end'] || '??'}:00`);
  if (pb['pb-fear'])            parts.push(`Biggest Fear: ${pb['pb-fear']}`);
  if (pb['pb-limiting'])        parts.push(`Limiting Beliefs: ${pb['pb-limiting']}`);
  return parts.join('\n');
}

/* ─────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────── */
export function toast(msg, type = '', duration = 3000) {
  const wrap = document.getElementById('toastWrap');
  const el   = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('show'));
  });
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/* ─────────────────────────────────────────────────────────
   PAGE NAVIGATION
───────────────────────────────────────────────────────── */
// My Thoughts + My Goals + My Habits are merged into ONE scrolling page. They sit
// contiguously in the DOM in exactly this order (notes → setup → habits), so we
// activate all three together whenever any of them is requested. Navigating to a
// specific one scrolls to that section.
const INPUT_PAGES = ['notes', 'setup', 'habits'];

/* Add the reusable right-hand column (clown + Big 3 stats) to a framed page,
   wrapping the page's existing content into a 75% main column. Idempotent —
   safe to call on every navigation; re-fills the stats each time. */
function ensurePageSideColumn(pageId) {
  try {
    const page = document.getElementById('page-' + pageId);
    if (!page) return;
    const screen = page.querySelector('.pg-screen, .wins-screen');
    if (!screen) return;
    let side = screen.querySelector('.pg-side');
    if (!screen.querySelector('.pg-body')) {
      const main = document.createElement('div');
      main.className = 'pg-body-main';
      while (screen.firstChild) main.appendChild(screen.firstChild);
      const layout = document.createElement('div');
      layout.className = 'pg-body';
      side = document.createElement('aside');
      side.className = 'pg-side';
      side.innerHTML =
        '<div class="colb-nav">' +
        '<button class="colb-nav-btn colb-nav-menu" onclick="toggleHamMenu()" aria-label="Menu" title="Where do you want to go?"><svg width="94" height="68" viewBox="0 0 64 46" style="display:block;overflow:visible;"><ellipse cx="32" cy="40.5" rx="16" ry="2.4" fill="#000" opacity=".13"/><path d="M5 24.5 C5 31 20 36 32 36 C44 36 59 31 59 24.5 C59 29 46 32 32 32 C18 32 5 29 5 24.5 Z" fill="#255E82"/><ellipse cx="32" cy="24.5" rx="27" ry="6.6" fill="#3B82B0"/><ellipse cx="32" cy="22.6" rx="19.5" ry="4.8" fill="#5AA0CB"/><circle cx="12.5" cy="24.8" r="1.9" fill="#EAF3F9"/><circle cx="22.2" cy="26" r="1.9" fill="#EAF3F9"/><circle cx="32" cy="26.4" r="1.9" fill="#EAF3F9"/><circle cx="41.8" cy="26" r="1.9" fill="#EAF3F9"/><circle cx="51.5" cy="24.8" r="1.9" fill="#EAF3F9"/><path d="M20.5 21.5 A11.6 13 0 0 1 43.5 21.5 Z" fill="#AAB1B7"/><path d="M23 20.6 A9 10 0 0 1 34.5 15.2 A9 10 0 0 0 23 20.6 Z" fill="#C9CFD4"/><ellipse cx="28" cy="15.5" rx="3.2" ry="2.2" fill="#D9DDE1" opacity=".85"/></svg></button>' +
        '</div>' +
        '<div class="pg-side-stats"></div>';
      layout.appendChild(main);
      layout.appendChild(side);
      screen.appendChild(layout);
      // Any element tagged data-side-column moves from Column A into Column B.
      main.querySelectorAll('[data-side-column]').forEach(function (el) { side.appendChild(el); });
    }
    const statsEl = side && side.querySelector('.pg-side-stats');
    if (statsEl && typeof vizSideStatsHTML === 'function') statsEl.innerHTML = vizSideStatsHTML();
  } catch (e) { console.error('[pageSideColumn]', e); }
}

/* Meditation stats box — counts completed meditation sessions (ci_med_log, one date-key
   per finished session) into This Week / Month / Year, and the consecutive-day streak. */
export function renderMeditationStats() {
  let log = [];
  try { log = LS.get('ci_med_log') || []; } catch (e) {}
  if (!Array.isArray(log)) log = [];
  const DAY = 86400000;
  const toTs = s => {
    if (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s)) { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).getTime(); }
    const d = new Date(s); return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  const tss = log.map(toTs).filter(t => t != null);
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const week  = tss.filter(t => t >= today0 - 6 * DAY && t <= today0).length;
  const month = tss.filter(t => { const d = new Date(t); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  const year  = tss.filter(t => new Date(t).getFullYear() === now.getFullYear()).length;
  const daySet = new Set(tss);
  let streak = 0, cur = today0;
  if (!daySet.has(cur)) cur -= DAY;   // if none logged today yet, count the run ending yesterday
  while (daySet.has(cur)) { streak++; cur -= DAY; }
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('medStatWeek', week); set('medStatMonth', month); set('medStatYear', year); set('medStatStreak', streak);
}

export function showPage(id) {
  // An LFM destination is authoritative inside its embedded iframe. App startup,
  // auth restoration, and stale history must never switch the frame back home.
  if (window.self !== window.top) {
    const inlineAction = new URLSearchParams(location.search).get('masterInline');
    const inlinePages = {
      goals: 'setup',
      'daily-habits': 'habits',
      'action-plan': 'myroadmap',
      visualization: 'vizlibrary',
      favorites: 'dailyfocus',
      gratitude: 'gratitude',
      journal: 'mynotes',
      thoughts: 'notes',
      'task-notes': 'tasknotes',
      'goal-workspace': 'goalworkspace',
      wins: 'wins',
      proof: 'proof',
      'cosmic-library': 'cosmiclibrary',
      'quickie-move': 'entcard',
      admin: 'admin',
    };
    if (inlineAction && inlinePages[inlineAction]) id = inlinePages[inlineAction];
  }
  // Favorites Autoplay is an LFM interface, never a standalone top-level page.
  if (id === 'dailyfocus' && window.self === window.top) {
    id = 'dashboard';
    window.setTimeout(() => {
      const frame = document.getElementById('ciMasterPlayerFrame');
      frame?.contentWindow?.postMessage({ type: 'ci-lfm-select', action: 'favorites' }, location.origin);
    }, 220);
  }
  // The Admin workspace is owner-only. A direct or stale navigation attempt by
  // any member returns to the Citadel without exposing editor controls.
  if (id === 'admin' && (!currentUser || currentUser.email !== 'lscottbutler@gmail.com')) id = 'dashboard';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // My Thoughts / My Goals / My Habits are now individual pages (no longer merged).
  const target = document.getElementById('page-' + id);
  if (target) target.classList.add('active');

  document.querySelectorAll('.drawer-nav-item').forEach(b => b.classList.remove('active'));

  if (id === 'dashboard') {
    renderDashboard();
    applyUserCitadelWelcome();

    const goalsGrid = document.getElementById('citadelActionsGrid');
    const goalsBox = document.getElementById('goalsBox');
    const extraLegacySections = document.getElementById('dashSections');
    const embeddedGoals = window.self !== window.top
      && new URLSearchParams(location.search).get('masterInline') === 'goals';

    // Citadel is the member homepage. Its full colored Goals workspace appears
    // only inside the LFM when Goals is selected—never duplicated above the LFM.
    if (goalsGrid) {
      goalsGrid.setAttribute('aria-hidden', embeddedGoals ? 'false' : 'true');
      goalsGrid.style.setProperty('display', embeddedGoals ? 'grid' : 'none', 'important');
      if (embeddedGoals) {
        goalsGrid.style.gridTemplateColumns = 'minmax(0,1fr)';
        goalsGrid.style.width = '100%';
        goalsGrid.style.padding = '0';
        goalsGrid.style.boxSizing = 'border-box';
      }
    }
    if (goalsBox) goalsBox.style.display = embeddedGoals ? 'block' : 'none';
    if (extraLegacySections) extraLegacySections.style.display = 'none';

    if (!embeddedGoals) {
      window.setTimeout(() => {
        const frame = document.getElementById('ciMasterPlayerFrame');
        frame?.contentWindow?.postMessage({ type: 'ci-lfm-select', action: 'home' }, location.origin);
      }, 80);
    }
  }
  if (id === 'dailyfocus') {
    if (typeof window.renderDailyGuru === 'function') window.renderDailyGuru();
    if (typeof window.renderFavorites === 'function') window.renderFavorites();
  }
  if (id === 'notes') {   // My Thoughts — its own page
    loadPegboard();             // personal foundation + legacy thought boxes now live here
    applyUserCitadelWelcome();   // sync the "My Citadel Welcome" textarea
    if (typeof window.renderNotesPage === 'function') window.renderNotesPage();
  }
  if (id === 'setup') renderPBIntentionList();   // My Goals — its own page
  if (id === 'habits' && typeof window.renderPBHabitList === 'function') window.renderPBHabitList();   // My Habits — its own page
  if (typeof window.sprinkleNotes === 'function') window.sprinkleNotes();   // rotate surfaced notes on every page
  if (id === 'admin') {
    ensureAdminPageBoxEditors();
    loadAIPrompts();
  }
  if (id === 'wins' && typeof window.renderWinsPage === 'function') window.renderWinsPage();
  if (id === 'entcard' && typeof window.renderEntLibrary === 'function') window.renderEntLibrary();
  if (id === 'cosmiclibrary' && typeof window.renderCosmicLibrary === 'function') window.renderCosmicLibrary();
  if (id === 'meditation') renderMeditationStats();
  if (id === 'mynotes' && typeof window.renderMyNotesPage === 'function') window.renderMyNotesPage();
  if (id === 'tasknotes' && typeof window.renderTaskNotesList === 'function') window.renderTaskNotesList();
  if (id === 'goalworkspace' && typeof window.renderGoalWorkspace === 'function') window.renderGoalWorkspace();

  // Master link list at the top of every Column B (single source: window.colbLinksHTML).
  if (typeof window.injectColbLinks === 'function') window.injectColbLinks();
  // Intro card at the top of Column A on selected pages, then the admin-editable
  // text box directly under whatever intro card the page ended up with.
  if (typeof window.injectPageIntro === 'function') window.injectPageIntro();
  if (typeof window.wireInfoBoxAdmin === 'function') window.wireInfoBoxAdmin();
  if (typeof window.injectTitleInfo === 'function') window.injectTitleInfo();
  if (typeof window.sprinkleEncouragements === 'function') window.sprinkleEncouragements();

  closeDrawer();
  // Force top now, and again after layout settles, so async re-renders
  // (images, deferred sidebar/build-sheet render) can't leave the page
  // scrolled down when a page first loads. For a merged sub-section (Goals /
  // Habits) scroll to that section instead of the very top.
  window.scrollTo(0, 0);
  const _section = null;   // pages are individual now — always land at the top
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (_section) _section.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  }));
}

/* ── PAGE HISTORY (back / forward) ─────────────────────── */
const _navHistory = [];
let   _navIndex   = -1;

function _updateSubnav() {
  const back    = document.getElementById('subnavBack');
  const forward = document.getElementById('subnavForward');
  if (back)    back.disabled    = _navIndex <= 0;
  if (forward) forward.disabled = _navIndex >= _navHistory.length - 1;
}

// Seed the browser-history base entry (the initial "home" load) so the very
// first Back press navigates *within* the app instead of leaving the site.
if (typeof history !== 'undefined' &&
    (!history.state || typeof history.state.navIndex !== 'number')) {
  _navHistory.length = 0;
  _navHistory.push('home');
  _navIndex = 0;
  history.replaceState({ navIndex: 0, page: 'home' }, '');
}

// The on-screen arrows delegate to the real browser history so they, the
// browser Back/Forward buttons, and the mouse Back/Forward button all behave
// identically. The actual page swap happens in the popstate handler below.
export function subnavBack()    { history.back();    }
export function subnavForward() { history.forward(); }

// Shared three-button mini nav used by LFM tools. The embedded tool sends one
// same-origin command to the master player, which owns Back / Menu / Forward.
export function lfmMiniNav(command) {
  if (!['back', 'menu', 'forward'].includes(command)) return;
  if (window.parent === window) return;
  window.parent.postMessage({ type: 'ci-lfm-mini-nav', command }, location.origin);
}

/* Step through the top tab bar in order (dir -1 = previous tab, +1 = next tab), wrapping
   around. The Column B nav cluster arrows use this — go to whichever tab is next/prev. */
const _TAB_ORDER = ['dashboard','notes','mynotes','myroadmap','vizlibrary','meditation','gratitude','wins','cosmiclibrary','proof'];
export function tabStep(dir) {
  const active = document.querySelector('.page.active');
  let cur = active ? active.id.replace(/^page-/, '') : 'dashboard';
  let i = _TAB_ORDER.indexOf(cur);
  if (i < 0) i = 0;
  i = (i + (dir || 0) + _TAB_ORDER.length) % _TAB_ORDER.length;
  const id = _TAB_ORDER[i];
  if (id === 'myroadmap'  && typeof window.openMyRoadmap === 'function')  return window.openMyRoadmap();
  if (id === 'vizlibrary' && typeof window.openVizLibrary === 'function') return window.openVizLibrary();
  navTo(id);
}

// Browser (or mouse) Back/Forward → move within the app, don't leave the site.
window.addEventListener('popstate', (e) => {
  const st = e.state;
  if (st && typeof st.navIndex === 'number' && st.navIndex < _navHistory.length) {
    _navIndex = st.navIndex;
    showPage(_navHistory[_navIndex] || 'home');
  } else {
    // No app state on this entry (walked back to before the app) → show home.
    _navIndex = 0;
    showPage('home');
  }
  _updateSubnav();
});

export function openFavoritesInLfm() {
  if (!currentUser) {
    closeDrawer();
    openAuth('signin');
    return;
  }
  closeDrawer();
  const revealFavorites = () => {
    const frame = document.getElementById('ciMasterPlayerFrame');
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ type: 'ci-lfm-select', action: 'favorites' }, location.origin);
    frame.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };
  const dashboard = document.getElementById('page-dashboard');
  if (!dashboard || !dashboard.classList.contains('active')) {
    navTo('dashboard');
    window.setTimeout(revealFavorites, 180);
    window.setTimeout(revealFavorites, 550);
  } else {
    revealFavorites();
  }
}

export function navTo(id) {
  if (id === 'dailyfocus') {
    openFavoritesInLfm();
    return;
  }
  // The old standalone Daily Habits/run-through page is retired. Habits now
  // live inside the LFM; stale links return safely to the Citadel dashboard.
  if (id === 'runthroughs') id = 'dashboard';
  // CI V2: all core member tools live inside the persistent LFM. Legacy links,
  // top tabs, and stale page URLs now reopen the Citadel and select the matching
  // LFM destination instead of exposing a standalone page or Column B.
  const lfmRoutes = {
    habits: 'daily-habits',
    notes: 'thoughts',
    mynotes: 'journal',
    tasknotes: 'task-notes',
    goalworkspace: 'goal-workspace',
    setup: 'goals',
    myroadmap: 'action-plan',
    vizlibrary: 'visualization',
    meditation: 'meditation',
    gratitude: 'gratitude',
    wins: 'wins',
    cosmiclibrary: 'cosmic-library',
  };
  if (window.self === window.top && lfmRoutes[id]) {
    if (!currentUser) {
      closeDrawer();
      openAuth('signin');
      return;
    }
    const action = lfmRoutes[id];
    const revealInLfm = () => {
      const frame = document.getElementById('ciMasterPlayerFrame');
      if (!frame || !frame.contentWindow) return;
      frame.contentWindow.postMessage({ type: 'ci-lfm-select', action }, location.origin);
      if (!['goals','daily-habits','favorites','thoughts','journal','action-plan','visualization','gratitude','wins'].includes(action)) {
        frame.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    };
    const dashboard = document.getElementById('page-dashboard');
    if (!dashboard || !dashboard.classList.contains('active')) {
      navTo('dashboard');
      window.setTimeout(revealInLfm, 180);
      window.setTimeout(revealInLfm, 550);
    } else {
      revealInLfm();
    }
    return;
  }
  // Must be logged in for any non-home page
  const auth_required = ['dashboard','dailyfocus','notes','setup','habits','wins','vizlibrary','vizgoal','myroadmap','entcard'];
  if (auth_required.includes(id) && !currentUser) {
    closeDrawer();
    openAuth('signin');
    return;
  }
  // Push to history, drop any forward stack — mirror it into the browser's
  // real history stack so Back/Forward (incl. the mouse buttons) work.
  if (_navHistory[_navIndex] !== id) {
    _navHistory.splice(_navIndex + 1);
    _navHistory.push(id);
    _navIndex = _navHistory.length - 1;
    history.pushState({ navIndex: _navIndex, page: id }, '');
  }
  _updateSubnav();
  showPage(id);
}

/* ─────────────────────────────────────────────────────────
   DRAWER
───────────────────────────────────────────────────────── */
function toggleVinMed(idx) {
  const sub   = document.getElementById(`vinMedSub-${idx}`);
  const arrow = document.getElementById(`vinMedArrow-${idx}`);
  if (!sub) return;
  const open = sub.style.display === 'none';
  sub.style.display   = open ? 'flex' : 'none';
  arrow.textContent   = open ? '▼' : '▶';
}

function toggleDrawer() {
  const drawer  = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  const ham     = document.getElementById('hamburger');
  const isOpen  = drawer.classList.contains('open');
  if (isOpen) { closeDrawer(); }
  else {
    drawer.classList.add('open');
    overlay.classList.add('open');
    ham.classList.add('open');
  }
}

export function closeDrawer() {
  document.getElementById('drawer')?.classList.remove('open');
  document.getElementById('drawerOverlay')?.classList.remove('open');
  document.getElementById('hamburger')?.classList.remove('open');
}

/* ─────────────────────────────────────────────────────────
   AUTH MODAL
───────────────────────────────────────────────────────── */
export function openAuth(tab = 'signin') {
  switchTab(tab);
  document.getElementById('authModal').classList.add('open');
  clearAuthError();
}

function closeAuth() {
  document.getElementById('authModal').classList.remove('open');
  clearAuthError();
}

/* ─────────────────────────────────────────────────────────
   UPGRADE MODAL
───────────────────────────────────────────────────────── */
export function openUpgrade() {
  document.getElementById('upgradeModal').classList.add('open');
}

export function closeUpgrade() {
  document.getElementById('upgradeModal').classList.remove('open');
}

export function goToStripe(plan) {
  const base = plan === 'annual' ? STRIPE_ANNUAL_URL : STRIPE_MONTHLY_URL;
  const url  = currentUser ? `${base}?client_reference_id=${currentUser.id}&prefilled_email=${encodeURIComponent(currentUser.email)}` : base;
  window.open(url, '_blank');
}

let selectedPlan = 'annual';

export function selectPlan(plan) {
  selectedPlan = plan;
  // Null-guarded: some of these plan/check elements may not exist in the DOM
  // (e.g. the monthly plan was removed). A missing element must NEVER throw here
  // — selectPlan runs during init(), and an uncaught error aborts the WHOLE boot
  // (including session restore → "logged out on every load"). See git history.
  const _pa = document.getElementById('planAnnual');   if (_pa) _pa.classList.toggle('selected', plan === 'annual');
  const _pm = document.getElementById('planMonthly');  if (_pm) _pm.classList.toggle('selected', plan === 'monthly');
  const _ca = document.getElementById('checkAnnual');  if (_ca) _ca.textContent = plan === 'annual'  ? '✓' : '';
  const _cm = document.getElementById('checkMonthly'); if (_cm) _cm.textContent = plan === 'monthly' ? '✓' : '';
}

// DEV shortcut — set yourself as member without Stripe
async function devSetMember(val = true) {
  if (!currentUser) { toast('Sign in first', 'error'); return; }
  const { error } = await sb.from('profiles').upsert({ id: currentUser.id, is_member: val });
  if (error) { toast('Error: ' + error.message, 'error'); return; }
  currentMember = val;
  updateUI(currentUser);
  toast(val ? 'Member access ON ✓' : 'Member access OFF', val ? 'success' : '');
}

export function switchTab(tab) {
  const signin = tab === 'signin';
  document.getElementById('tab-signin').classList.toggle('active', signin);
  document.getElementById('tab-signup').classList.toggle('active', !signin);
  document.getElementById('form-signin').classList.toggle('hidden', !signin);
  document.getElementById('form-signup').classList.toggle('hidden', signin);
  clearAuthError();
}

function showAuthError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg;
  el.classList.add('show');
}

function clearAuthError() {
  const el = document.getElementById('authError');
  el.textContent = '';
  el.classList.remove('show');
}

function setAuthLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait…' : (btnId === 'btn-signin' ? 'Sign In' : 'Create Account');
}

export async function doSignIn() {
  const email = document.getElementById('si-email').value.trim();
  const pass  = document.getElementById('si-pass').value;
  if (!email || !pass) { showAuthError('Enter your email and password.'); return; }
  setAuthLoading('btn-signin', true);
  clearAuthError();
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    closeAuth();
    toast('Welcome back!', 'success');
    // Switch to the logged-in UI RIGHT NOW instead of waiting on the
    // onAuthStateChange event (flaky on a slow connection — that's why sign-in
    // "sat there" without taking you inside). Data syncs in the background so
    // the UI is never blocked on the network.
    if (data?.user) {
      currentUser = data.user;
      updateUI(data.user);
      (async () => {
        try {
          await syncFromSupabase();
          await syncIntentionsFromSupabase();
          renderDashboard(); injectPersonalContent(); renderTodayView();
        } catch (err) { console.error('[signin] post-login sync failed:', err); }
      })();
    }
  } catch(e) {
    showAuthError(e.message || 'Sign in failed. Try again.');
  } finally {
    setAuthLoading('btn-signin', false);
  }
}

export async function doSignUp() {
  const name  = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const pass  = document.getElementById('su-pass').value;
  const code  = (document.getElementById('su-code')?.value || '').trim();
  // Invite-only while in build. Change INVITE_CODE to rotate it. (Soft gate — the
  // hard lock is "Disable new signups" in Supabase → Auth settings.)
  const INVITE_CODE = 'COSMIC-2026';
  if (code.toUpperCase() !== INVITE_CODE.toUpperCase()) { showAuthError('Sign-ups are invite-only right now — enter your invite code.'); return; }
  if (!name)            { showAuthError('Enter your name.'); return; }
  if (!email)           { showAuthError('Enter your email.'); return; }
  if (pass.length < 8)  { showAuthError('Password must be at least 8 characters.'); return; }
  setAuthLoading('btn-signup', true);
  clearAuthError();
  try {
    const { data, error } = await sb.auth.signUp({
      email, password: pass,
      options: {
        emailRedirectTo: 'https://cosmicintentions.com',
        data: { full_name: name }
      }
    });
    if (error) throw error;
    if (data.user && !data.session) {
      closeAuth();
      toast('Check your email to confirm your account.', 'info', 5000);
    } else {
      closeAuth();
      toast('Account created. Welcome!', 'success');
    }
  } catch(e) {
    showAuthError(e.message || 'Sign up failed. Try again.');
  } finally {
    setAuthLoading('btn-signup', false);
  }
}

export async function doResetPassword() {
  const email = document.getElementById('si-email').value.trim();
  if (!email) { showAuthError('Enter your email address first.'); return; }
  try {
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://cosmicintentions.com'
    });
    if (error) throw error;
    closeAuth();
    toast('Password reset email sent.', 'info');
  } catch(e) {
    showAuthError(e.message || 'Could not send reset email.');
  }
}

export async function goMemberDashboard() {
  const { data: { session }, error: sessErr } = await sb.auth.getSession();
  if (sessErr || !session?.user) {
    openAuth('signin');
    return;
  }
  // getUser() re-validates the token against the server. On a flaky connection it
  // can fail transiently — do NOT sign the user out over that (this was the
  // "logged out on every refresh" bug). Trust the persisted session's user; if
  // getUser succeeds use its fresher copy, otherwise keep the session user.
  let user = session.user;
  try {
    const { data, error } = await sb.auth.getUser();
    if (!error && data?.user) user = data.user;
  } catch (e) { /* network blip — keep the session user, stay logged in */ }
  currentUser = user;
  updateUI(user);
  await syncFromSupabase();
  await syncIntentionsFromSupabase();
  renderDashboard();
  injectPersonalContent();
  renderTodayView();
  navTo('dashboard');
}

export async function signOut() {
  closeDrawer();
  await sb.auth.signOut();
  currentUser = null;
  updateUI(null);
  showPage('home');
  openAuth('signin');
  toast('Signed out.', '');
}

/* ─────────────────────────────────────────────────────────
   UI STATE
───────────────────────────────────────────────────────── */
function updateUI(user) {
  currentUser = user;
  const loggedIn = !!user;

  const hdrUser = document.getElementById('hdrUser');
  // Prefer the user's own "YOUR NAME" field (pb-name); fall back to Supabase full_name / email.
  const pbName = (loggedIn && typeof getPB === 'function') ? ((getPB()['pb-name'] || '').trim()) : '';
  hdrUser.textContent = loggedIn ? (pbName || user.user_metadata?.full_name || user.email.split('@')[0]) : '';

  const drawerEmail = document.getElementById('drawerEmail');
  drawerEmail.textContent = loggedIn ? user.email : '';

  // Home page: show logged-in or logged-out section
  const homeLoggedIn  = document.getElementById('homeLoggedIn');
  const homeLoggedOut = document.getElementById('homeLoggedOut');
  if (homeLoggedIn)  homeLoggedIn.style.display  = loggedIn ? 'block' : 'none';
  if (homeLoggedOut) homeLoggedOut.style.display = loggedIn ? 'none'  : 'block';
  // Fill the home "rotating thought" slots now (updateUI shows home without going
  // through showPage, so sprinkleNotes would otherwise never run on first load).
  if (loggedIn && typeof window.sprinkleNotes === 'function') window.sprinkleNotes();
  // Hide the app header + hamburger on the logged-out landing (it has its own nav).
  const _appHdr = document.querySelector('header.hdr');
  if (_appHdr) _appHdr.style.display = loggedIn ? '' : 'none';
  const _topNav = document.getElementById('topNav');
  if (_topNav) _topNav.style.display = loggedIn ? '' : 'none';
  const _tabBar = document.getElementById('tabBar');
  if (_tabBar) _tabBar.style.display = loggedIn ? 'grid' : 'none';

  const topnavSignOut = document.getElementById('topnav-signout');
  if (topnavSignOut) topnavSignOut.style.display = loggedIn ? 'inline-block' : 'none';

  // Pricing section — only for logged-out visitors
  const hp = document.getElementById('homePricing');
  if (hp) hp.style.display = loggedIn ? 'none' : 'block';

  // Member badge in header
  const badge = document.getElementById('hdrMemberBadge');
  if (badge) badge.style.display = (loggedIn && currentMember) ? 'flex' : 'none';

  // Show/hide upgrade prompt in drawer
  const drawerUpgrade = document.getElementById('drawerUpgrade');
  if (drawerUpgrade) drawerUpgrade.style.display = (loggedIn && !currentMember) ? 'block' : 'none';

  // Show/hide upgrade prompt in home nav grid
  const homeNavUpgrade = document.getElementById('homeNavUpgrade');
  if (homeNavUpgrade) homeNavUpgrade.style.display = (loggedIn && !currentMember) ? 'block' : 'none';

  // Admin + Notes nav — only for site owner
  const isOwner = loggedIn && user.email === 'lscottbutler@gmail.com';
  window.ciOwnerAccess = isOwner;
  document.querySelectorAll('[data-owner-only]').forEach(el => {
    if (el.classList.contains('colb-links-hd')) el.style.display = isOwner ? '' : 'none';
    else if (!isOwner) el.style.display = 'none';
  });
  const navAdmin = document.getElementById('nav-admin');
  const navNotes = document.getElementById('nav-notes');
  if (navAdmin) navAdmin.style.display = isOwner ? 'flex' : 'none';
  if (navNotes) navNotes.style.display = isOwner ? 'flex' : 'none';
  const hnAdmin = document.getElementById('hn-admin');
  const hnNotes = document.getElementById('hn-notes');
  if (hnAdmin) hnAdmin.style.display = isOwner ? 'flex' : 'none';
  if (hnNotes) hnNotes.style.display = isOwner ? 'flex' : 'none';
  const dashAdmin = document.getElementById('dash-hn-admin');
  const dashNotes = document.getElementById('dash-hn-notes');
  if (dashAdmin) dashAdmin.style.display = isOwner ? 'flex' : 'none';
  if (dashNotes) dashNotes.style.display = isOwner ? 'flex' : 'none';
  const topAdmin = document.getElementById('topnav-admin');
  const topNotes = document.getElementById('topnav-notes');
  if (topAdmin) topAdmin.style.display = isOwner ? 'inline-block' : 'none';
  if (topNotes) topNotes.style.display = isOwner ? 'inline-block' : 'none';
}

/* ─────────────────────────────────────────────────────────
   SETUP & BTS — SAVE / LOAD
───────────────────────────────────────────────────────── */
const PB_FIELDS = [
  'pb-name','pb-mission','pb-lifegol','pb-lifegoal','pb-words','pb-quote','pb-values','pb-beliefs',
  'pb-attitudes','pb-stoicism','pb-traits',
  'pb-limiting','pb-rolemodels','pb-nonneg',
  'pb-target6m','pb-target1y','pb-target5y',
  'pb-fear','pb-why',
  'pb-area-health-now','pb-area-health-target',
  'pb-area-wealth-now','pb-area-wealth-target',
  'pb-area-relationships-now','pb-area-relationships-target',
  'pb-area-spirituality-now','pb-area-spirituality-target',
  'pb-area-career-now','pb-area-career-target',
  'pb-area-personalgrowth-now','pb-area-personalgrowth-target',
  'pb-area-funadventure-now','pb-area-funadventure-target',
  'bts-tone','bts-authors','bts-obstacles','bts-why','bts-context',
  'openai_voice',
  // Behavioral OS
  'pb-hotstate-start','pb-hotstate-end','pb-motiv','pb-mvd',
  'pb-patterns','pb-identity-anchor','pb-identity-word','pb-ulysses'
];

function readFormToPB() {
  const pb = LS.get('ci_pegboard') || {};
  PB_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) pb[id] = el.value.trim();
  });
  pb['spirituality'] = LS.get('ci_spirituality') || '';
  console.log('[PB] readFormToPB →', pb);
  return pb;
}

function populateForm(pb) {
  PB_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el && pb[id] !== undefined) el.value = pb[id];
  });
  if (pb['spirituality']) setSpirituality(pb['spirituality'], false);
  if (pb['openai_voice']) localStorage.setItem('openai_voice', pb['openai_voice']);
  // Restore choice buttons
  ['pb-motiv','pb-mvd'].forEach(fieldId => {
    const val = pb[fieldId];
    if (val) {
      document.querySelectorAll(`[data-pb="${fieldId}"]`).forEach(b => {
        b.classList.toggle('active', b.dataset.val === val);
      });
    }
  });
  // Restore Ulysses contracts
  const contracts = JSON.parse(pb['pb-ulysses'] || '[]');
  renderUlyssesContracts(contracts);
  // Populate sunk cost ledger
  renderSunkCostLedger();
}

/* ── BEHAVIORAL OS HELPERS ───────────────────────────── */
export function pbSetChoice(fieldId, val, btn) {
  // Toggle spirit-btn active state within same data-pb group
  document.querySelectorAll(`[data-pb="${fieldId}"]`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const input = document.getElementById(fieldId);
  if (input) input.value = val;
}

export function addUlyssesContract() {
  const ta = document.getElementById('ulyssesNewContract');
  const text = ta?.value.trim();
  if (!text) return;
  const pb = LS.get('ci_pegboard') || {};
  const contracts = JSON.parse(pb['pb-ulysses'] || '[]');
  contracts.push({ text, ts: Date.now() });
  pb['pb-ulysses'] = JSON.stringify(contracts);
  LS.set('ci_pegboard', pb);
  ta.value = '';
  renderUlyssesContracts(contracts);
}

function renderUlyssesContracts(contracts) {
  const list = document.getElementById('ulyssesContractList');
  if (!list) return;
  if (!contracts || contracts.length === 0) {
    list.innerHTML = `<div style="font-size:11px;color:var(--border);padding:8px 0;">No contracts yet. Add your first pre-commitment above.</div>`;
    return;
  }
  list.innerHTML = contracts.map((c, i) => `
    <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:#1a0808;border:1px solid #3a1a1a;border-radius:8px;margin-bottom:8px;">
      <span style="font-family:var(--vault-mono);font-size:8px;color:var(--danger);font-weight:800;white-space:nowrap;margin-top:3px;">⚓ ${i+1}</span>
      <span style="flex:1;font-size:11px;color:var(--mid);line-height:1.6;">${esc(c.text)}</span>
      <button onclick="removeUlyssesContract(${i})"
        style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;flex-shrink:0;opacity:0.5;"
        title="Remove">✕</button>
    </div>`).join('');
}

export function removeUlyssesContract(i) {
  const pb = LS.get('ci_pegboard') || {};
  const contracts = JSON.parse(pb['pb-ulysses'] || '[]');
  contracts.splice(i, 1);
  pb['pb-ulysses'] = JSON.stringify(contracts);
  LS.set('ci_pegboard', pb);
  renderUlyssesContracts(contracts);
  document.getElementById('pb-ulysses').value = JSON.stringify(contracts);
}

function renderSunkCostLedger() {
  const vizPlays = LS.get('ci_viz_plays')  || 0;
  const medPlays = LS.get('ci_med_plays')  || 0;
  const streak   = LS.get('ci_streak')     || 0;
  // Estimate: viz avg 5min, med avg 10min
  const totalMin = (vizPlays * 5) + (medPlays * 10);
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('scVizPlays',     vizPlays);
  setEl('scMedPlays',     medPlays);
  setEl('scStreak',       streak);
  setEl('scTotalMinutes', totalMin);
}

export function setSpirituality(val, save = true) {
  document.querySelectorAll('.spirit-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.val === val);
  });
  if (save) {
    const pb = LS.get('ci_pegboard') || {};
    pb['spirituality'] = val;
    LS.set('ci_pegboard', pb);
    LS.set('ci_spirituality', val);
  }
}

export function loadPegboard() {
  const pb = LS.get('ci_pegboard') || {};
  populateForm(pb);
  renderPBThoughts();
  if (typeof window !== 'undefined' && window.renderPBHabitList) window.renderPBHabitList();
}

/* Collapse/expand a Pegboard section (My Life & Purpose / My Intentions / My Thoughts). */
export function pbToggleSection(key) {
  const body = document.getElementById(key + '-body');
  const arr  = document.getElementById(key + '-arr');
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : '';
  if (arr) arr.style.transform = open ? 'rotate(-90deg)' : 'rotate(0deg)';
}

/* ── MY THOUGHTS (section 3) — up to 20 {title,text} boxes. Show the filled
   ones plus one empty "add" box; filling it auto-adds the next. Stored in
   ci_pegboard['pb-thoughts'] and synced to the pb_thoughts column. */
function pbGetThoughts() {
  const t = (LS.get('ci_pegboard') || {})['pb-thoughts'];
  return Array.isArray(t) ? t : [];
}
export function renderPBThoughts() {
  const el = document.getElementById('pbThoughtsList');
  if (!el) return;
  const boxes = pbGetThoughts().slice(0, 20);
  const showAdd = boxes.length < 20;
  if (showAdd) boxes.push({ title: '', text: '', _add: true });
  el.innerHTML = boxes.map((b, i) => `
    <div style="background:#2E2E2E;padding:16px 18px;border-radius:14px;margin-bottom:12px;${b._add ? 'border:1px dashed #5E5E5E;' : ''}">
      <input type="text" value="${esc(b.title || '')}" maxlength="80" data-th="${i}" data-f="title"
        onchange="pbSaveThought()" placeholder="${b._add ? '＋ New thought — title…' : 'Title…'}"
        style="width:100%;box-sizing:border-box;padding:10px 12px;border:none;border-radius:7px;font-size:14px;font-weight:700;color:#1a1a1a;background:#fff;margin-bottom:8px;" />
      <textarea data-th="${i}" data-f="text" onchange="pbSaveThought()" placeholder="Write what matters to you…"
        style="width:100%;box-sizing:border-box;padding:10px 12px;border:none;border-radius:7px;font-size:14px;color:#1a1a1a;background:#fff;min-height:64px;resize:vertical;">${esc(b.text || '')}</textarea>
    </div>`).join('');
}
export async function pbSaveThought() {
  const el = document.getElementById('pbThoughtsList');
  if (!el) return;
  const map = {};
  el.querySelectorAll('[data-th]').forEach(node => {
    const i = node.getAttribute('data-th'), f = node.getAttribute('data-f');
    (map[i] = map[i] || { title: '', text: '' })[f] = node.value.trim();
  });
  const arr = Object.keys(map).map(k => map[k]).filter(b => b.title || b.text).slice(0, 20);
  const pb = LS.get('ci_pegboard') || {};
  pb['pb-thoughts'] = arr;
  LS.set('ci_pegboard', pb);
  renderPBThoughts();
  try { await syncToSupabase(); } catch (e) {}
}

export async function saveSetup() {
  const pb = readFormToPB();
  LS.set('ci_pegboard', pb);
  LS.set('ci_spirituality', pb['spirituality'] || '');
  console.log('[Save] localStorage written:', LS.get('ci_pegboard'));
  setBtnLoading('btn-save-setup', true);
  try {
    await syncProfileToSupabase(pb);
    toast('Setup saved ✓', 'success');
  } catch(e) {
    console.error('[Save] Supabase sync failed:', e);
    toast('Saved locally. Sync failed: ' + e.message, 'error');
  } finally {
    setBtnLoading('btn-save-setup', false);
  }
}

export async function saveThoughtsProfile() {
  const pb = readFormToPB();
  LS.set('ci_pegboard', pb);
  LS.set('ci_spirituality', pb['spirituality'] || '');
  setBtnLoading('btn-save-thoughts', true);
  try {
    await syncProfileToSupabase(pb);
    toast('My Thoughts saved ✓', 'success');
  } catch(e) {
    console.error('[Save] My Thoughts sync failed:', e);
    toast('Saved locally. Sync failed: ' + e.message, 'error');
  } finally {
    setBtnLoading('btn-save-thoughts', false);
  }
}

async function saveBTS() {
  const pb = readFormToPB();
  LS.set('ci_pegboard', pb);
  console.log('[Save] localStorage written:', LS.get('ci_pegboard'));
  setBtnLoading('btn-save-bts', true);
  try {
    await syncProfileToSupabase(pb);
    toast('Behind the Scenes saved ✓', 'success');
  } catch(e) {
    console.error('[Save] Supabase sync failed:', e);
    toast('Saved locally. Sync failed: ' + e.message, 'error');
  } finally {
    setBtnLoading('btn-save-bts', false);
  }
}

function setBtnLoading(id, loading) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  const labels = {
    'btn-save-setup': 'Save My Goals',
    'btn-save-thoughts': 'Save My Thoughts',
    'btn-save-bts': 'Save BTS',
  };
  btn.textContent = loading ? 'Saving…' : (labels[id] || 'Save');
}

/* ─────────────────────────────────────────────────────────
   SUPABASE — PROFILES SYNC
───────────────────────────────────────────────────────── */
async function syncProfileToSupabase(pb) {
  if (!currentUser) { console.warn('[Supabase] upsert skipped — no currentUser'); return; }
  const payload = {
    id:            currentUser.id,
    updated_at:    new Date().toISOString(),
    pb_name:       pb['pb-name']       || '',
    pb_mission:    pb['pb-mission']    || '',
    pb_lifegol:    pb['pb-lifegol']    || '',
    pb_values:     pb['pb-values']     || '',
    pb_beliefs:    pb['pb-beliefs']    || '',
    pb_attitudes:  pb['pb-attitudes']  || '',
    pb_stoicism:   pb['pb-stoicism']   || '',
    pb_traits:     pb['pb-traits']     || '',
    pb_lifegoal:   pb['pb-lifegoal']   || '',
    pb_words:      pb['pb-words']       || '',
    pb_quote:      pb['pb-quote']       || '',
    pb_thoughts:   pb['pb-thoughts']    || [],
    bts_tone:      pb['bts-tone']      || '',
    bts_authors:   pb['bts-authors']   || '',
    bts_obstacles: pb['bts-obstacles'] || '',
    bts_why:       pb['bts-why']       || '',
    bts_context:   pb['bts-context']   || '',
    openai_voice:  pb['openai_voice']  || 'alloy',
    spirituality:  pb['spirituality']  || ''
  };
  // Resilient upsert: if an optional column doesn't exist yet, drop it and retry
  // (so saving never breaks before you run the column-add SQL).
  const OPTIONAL = ['pb_lifegoal', 'pb_words', 'pb_quote', 'pb_thoughts'];
  let body = { ...payload };
  let { error } = await sb.from('profiles').upsert(body);
  let guard = 0;
  while (error && guard++ < OPTIONAL.length) {
    const col = OPTIONAL.find(c => c in body && (error.message || '').includes(c));
    if (!col) break;
    delete body[col];
    ({ error } = await sb.from('profiles').upsert(body));
  }
  if (error) {
    console.error('[Supabase] upsert error:', error);
    throw new Error(error.message);
  }
  console.log('[Supabase] upsert OK');
}

async function syncToSupabase() {
  const pb = LS.get('ci_pegboard') || {};
  await syncProfileToSupabase(pb);
}

/* Wins Wall → cloud. Stored as a `wins` JSONB column on profiles.
   Resilient: if the column hasn't been added yet, this no-ops quietly
   so the local Wins Wall keeps working. Fire-and-forget from wins.js. */
export async function syncWinsToSupabase() {
  if (!currentUser) return;
  try {
    const wins = LS.get('ci_wins') || [];
    const { error } = await sb.from('profiles').upsert({
      id: currentUser.id,
      wins,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('[Supabase] wins sync skipped (run the add-column SQL?):', error.message);
  } catch (e) { console.warn('[Supabase] syncWinsToSupabase failed:', e); }
}

/* Habit list → cloud. Stored as a `habits` JSONB column on profiles.
   Resilient: if the column hasn't been added yet, this no-ops quietly
   so the local habit list keeps working. Fire-and-forget from habits.js. */
export async function syncHabitsToSupabase() {
  if (!currentUser) return;
  try {
    const habits = LS.get('ci_habit_list') || [];
    const { error } = await sb.from('profiles').upsert({
      id: currentUser.id,
      habits,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('[Supabase] habits sync skipped (run the add-column SQL?):', error.message);
  } catch (e) { console.warn('[Supabase] syncHabitsToSupabase failed:', e); }
}

/* Habit DONE-state (today's ticks) → cloud, so completions in the daily
   run-throughs follow the login across devices. Stored as a `habits_done`
   JSONB column on profiles: { date:'YYYY-MM-DD', done:{ habitId:true, … } }.
   Only today is kept (the checklist auto-resets each morning), so the column
   never grows. Resilient: no-ops quietly if the column doesn't exist yet.
   Fire-and-forget from habits.js on every tick. */
export async function syncHabitDoneToSupabase() {
  if (!currentUser) return;
  try {
    const date = dayKey();
    const done = LS.get('ci_habits_' + date) || {};
    const { error } = await sb.from('profiles').upsert({
      id: currentUser.id,
      habits_done: { date, done },
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('[Supabase] habits-done sync skipped (run the add-column SQL?):', error.message);
  } catch (e) { console.warn('[Supabase] syncHabitDoneToSupabase failed:', e); }
}

/* Big-3 rings history → cloud. Stored as a `rings_log` JSONB column on
   profiles: { 'YYYY-MM-DD': { review, visualize, meditate, gratitude }, … }.
   The whole log syncs (streak/momentum/tier need history), but each day is a
   tiny 4-bool object so it stays small. Resilient: no-ops if the column isn't
   there yet. Wired into rings.js via _wireRingsSync so every tap/finish syncs. */
export async function syncRingsToSupabase() {
  if (!currentUser) return;
  try {
    const log = {};
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('ci_rings_')) { const v = LS.get(k); if (v) log[k.slice(9)] = v; }
    }
    const { error } = await sb.from('profiles').upsert({
      id: currentUser.id,
      rings_log: log,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('[Supabase] rings sync skipped (run the add-column SQL?):', error.message);
  } catch (e) { console.warn('[Supabase] syncRingsToSupabase failed:', e); }
}
_wireRingsSync(syncRingsToSupabase);   // rings.js fires this on every ring change

/* My Thoughts library (ci_notes) → cloud. Stored as a `notes` JSONB column on
   profiles. Resilient: no-ops quietly if the column isn't there yet.
   Fire-and-forget from notes.js on every save (all thought edits funnel through
   _saveNotes). */
export async function syncNotesToSupabase() {
  if (!currentUser) return;
  try {
    const notes = LS.get('ci_notes') || [];
    const { error } = await sb.from('profiles').upsert({
      id: currentUser.id,
      notes,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('[Supabase] notes sync skipped (run the add-column SQL?):', error.message);
  } catch (e) { console.warn('[Supabase] syncNotesToSupabase failed:', e); }
}

/* Favorites / Daily-Focus autoplay pins (ci_favorites) → cloud. Stored as a
   `favorites` JSONB column on profiles. Resilient: no-ops if the column is
   missing. Fired instantly from notes.js saves, and by a tab-hide safety net
   below (favorites are also written from player-launcher/wrapup). */
export async function syncFavoritesToSupabase() {
  if (!currentUser) return;
  try {
    const favorites = LS.get('ci_favorites') || [];
    const { error } = await sb.from('profiles').upsert({
      id: currentUser.id,
      favorites,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('[Supabase] favorites sync skipped (run the add-column SQL?):', error.message);
  } catch (e) { console.warn('[Supabase] syncFavoritesToSupabase failed:', e); }
}

// Safety net: flush notes + favorites to the cloud when the tab is backgrounded
// or closed, so favorite writes that don't go through notes.js (player-launcher,
// wrapup) still reach Supabase. no-ops until logged in.
if (typeof window !== 'undefined') {
  const _bgSync = () => { try { syncFavoritesToSupabase(); syncNotesToSupabase(); } catch (e) {} };
  window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') _bgSync(); });
  window.addEventListener('pagehide', _bgSync);
}

async function syncFromSupabase() {
  if (!currentUser) return;
  syncPending = true;
  try {
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    if (error || !data) {
      console.warn('[Supabase] syncFromSupabase — no row found:', error?.message);
      currentMember = true;
      syncPending = false;
      updateUI(currentUser);
      return;
    }
    console.log('[Supabase] syncFromSupabase raw:', data);
    const pb = {
      'pb-name':       data.pb_name       || '',
      'pb-mission':    data.pb_mission    || '',
      'pb-lifegol':    data.pb_lifegol    || '',
      'pb-values':     data.pb_values     || '',
      'pb-beliefs':    data.pb_beliefs    || '',
      'pb-attitudes':  data.pb_attitudes  || '',
      'pb-stoicism':   data.pb_stoicism   || '',
      'pb-traits':     data.pb_traits     || '',
      'pb-lifegoal':   data.pb_lifegoal   || '',
      'pb-words':      data.pb_words      || '',
      'pb-quote':      data.pb_quote      || '',
      'pb-thoughts':   Array.isArray(data.pb_thoughts) ? data.pb_thoughts : [],
      'bts-tone':      data.bts_tone      || '',
      'bts-authors':   data.bts_authors   || '',
      'bts-obstacles': data.bts_obstacles || '',
      'bts-why':       data.bts_why       || '',
      'bts-context':   data.bts_context   || '',
      'openai_voice':  data.openai_voice  || 'alloy',
      'spirituality':  data.spirituality  || ''
    };

    // Guard: only overwrite localStorage if Supabase returned real data.
    // Prevents a failed/empty Supabase row from wiping a good local save.
    const hasData = Object.values(pb).some(v => v && v !== 'alloy');
    const local   = LS.get('ci_pegboard') || {};
    const hasLocal = Object.values(local).some(v => v && v !== 'alloy');
    if (!hasData && hasLocal) {
      console.warn('[Supabase] syncFromSupabase — Supabase row is empty, keeping localStorage data');
      currentMember = data?.is_member === true;
      syncPending = false;
      updateUI(currentUser);
      return;
    }

    LS.set('ci_pegboard', pb);
    LS.set('ci_spirituality', pb['spirituality']);
    if (pb['openai_voice']) localStorage.setItem('openai_voice', pb['openai_voice']);
    populateForm(pb);
    // Wins Wall — restore the cloud copy if present (column may not exist yet).
    if (Array.isArray(data.wins)) LS.set('ci_wins', data.wins);
    // Habit list — cross-device sync (mirrors wins). Cloud wins when it holds
    // data; otherwise seed the cloud once from a device that has a real
    // (categorized) setup, so an empty phone can't clobber the desktop list.
    if (Array.isArray(data.habits) && data.habits.length) {
      LS.set('ci_habit_list', data.habits);
    } else {
      const localHabits = LS.get('ci_habit_list') || [];
      if (localHabits.some(h => h && h.cat)) syncHabitsToSupabase();
    }
    // Habit DONE-state — restore today's ticks so completions follow the login
    // across devices. Ignore stale days (the checklist resets each morning).
    try {
      const hd = data.habits_done;
      const today = dayKey();
      if (hd && hd.date === today && hd.done && typeof hd.done === 'object') {
        LS.set('ci_habits_' + today, hd.done);
      }
    } catch (e) {}
    // Big-3 rings history — union-merge each day so a ring closed on ANY device
    // stays closed (closing is monotonic within a day; never lose a completion).
    try {
      const log = data.rings_log;
      if (log && typeof log === 'object') {
        Object.keys(log).forEach(day => {
          const c = log[day] || {}, l = LS.get('ci_rings_' + day) || {};
          LS.set('ci_rings_' + day, {
            review:    !!(l.review    || c.review),
            visualize: !!(l.visualize || c.visualize),
            meditate:  !!(l.meditate  || c.meditate),
            gratitude: !!(l.gratitude || c.gratitude),
          });
        });
        if (typeof renderRings === 'function') renderRings();
      }
    } catch (e) {}
    // My Thoughts library (cross-device, mirrors habits): cloud wins when it
    // holds data; otherwise seed the cloud from a device that has local thoughts.
    try {
      const localNotes = JSON.parse(localStorage.getItem('ci_notes') || '[]');
      if (Array.isArray(data.notes) && data.notes.length) LS.set('ci_notes', data.notes);
      else if (Array.isArray(localNotes) && localNotes.length) syncNotesToSupabase();
    } catch (e) {}
    // Favorites / autoplay pins — same guard.
    try {
      const localFavs = JSON.parse(localStorage.getItem('ci_favorites') || '[]');
      if (Array.isArray(data.favorites) && data.favorites.length) LS.set('ci_favorites', data.favorites);
      else if (Array.isArray(localFavs) && localFavs.length) syncFavoritesToSupabase();
    } catch (e) {}
    if (typeof window !== 'undefined' && window.sprinkleNotes) try { window.sprinkleNotes(); } catch (e) {}
    if (typeof window !== 'undefined' && window.renderFavorites) try { window.renderFavorites(); } catch (e) {}
    if (typeof window !== 'undefined' && window.renderRunThroughs) window.renderRunThroughs();
    if (typeof window !== 'undefined' && window.renderHabits) window.renderHabits();
    console.log('[Supabase] syncFromSupabase — localStorage updated:', pb);

    currentMember = data?.is_member === true;
    syncPending = false;
    updateUI(currentUser);
  } catch(e) {
    console.warn('[Supabase] syncFromSupabase failed:', e);
    syncPending = false;
  }
}

/* ─────────────────────────────────────────────────────────
   SUPABASE — INTENTIONS SYNC
───────────────────────────────────────────────────────── */
export async function syncIntentionsToSupabase() {
  if (!currentUser || !intentions.length) return;
  const rows = intentions.map(intention => {
    const storedImage = intention.imageStorageRef || intention.imageUrl;
    return ({
    id:          intention.id,
    user_id:     currentUser.id,
    title:       intention.title       || '',
    words:       intention.words       || {},
    mindset:     intention.mindset     || null,
    achievers:   intention.achievers   || null,
    target_date: intention.targetDate  || null,
    start_date:  intention.startDate   || null,
    category:    intention.category    || null,
    ai_enabled:  intention.aiEnabled !== false,
    the_map:     intention.theMap      || null,
    bbfw:        intention.bbfw        || null,
    // Persist the private Storage reference, never an expiring signed URL or base64.
    image_url:   (storedImage && !storedImage.startsWith('data:')) ? storedImage : null,
    roadmap_ai:  intention.roadmapAI   || null,
    active_danger_zone: intention.activeDangerZone || null,
    updated_at:  new Date().toISOString()
    });
  });
  // Resilient upsert: if an optional column doesn't exist yet, drop it and retry.
  const OPTIONAL_COLS = ['image_url', 'roadmap_ai', 'active_danger_zone', 'category', 'ai_enabled'];
  let payload = rows;
  let { error } = await sb.from('intentions').upsert(payload, { onConflict: 'id' });
  let guard = 0;
  while (error && guard++ < OPTIONAL_COLS.length) {
    const missing = OPTIONAL_COLS.find(c => new RegExp(c, 'i').test(error.message));
    if (!missing) break;
    payload = payload.map(({ [missing]: _omit, ...r }) => r);
    ({ error } = await sb.from('intentions').upsert(payload, { onConflict: 'id' }));
  }
  if (error) throw new Error(error.message);
}

const VISION_STORAGE_PREFIX = 'storage://vision-images/';

function _visionStoragePath(ref) {
  if (!ref || typeof ref !== 'string') return '';
  if (ref.startsWith(VISION_STORAGE_PREFIX)) return ref.slice(VISION_STORAGE_PREFIX.length);
  const marker = '/storage/v1/object/public/vision-images/';
  const pos = ref.indexOf(marker);
  return pos >= 0 ? decodeURIComponent(ref.slice(pos + marker.length)) : '';
}

async function _signedVisionUrl(ref) {
  const path = _visionStoragePath(ref);
  if (!path || !sb) return ref || null;
  const { data, error } = await sb.storage.from('vision-images').createSignedUrl(path, 6 * 60 * 60);
  if (error) throw error;
  return data?.signedUrl || null;
}

/* Upload a generated vision image to private Supabase Storage. The stable
   storage reference is saved; the signed URL is only used for this session. */
export async function uploadVisionImage(intentionId, b64) {
  if (!currentUser || !sb || !b64 || !intentionId) return null;
  try {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const path  = `${currentUser.id}/${intentionId}.png`;
    const { error } = await sb.storage.from('vision-images')
      .upload(path, bytes, { contentType: 'image/png', upsert: true });
    if (error) throw error;
    const storageRef = VISION_STORAGE_PREFIX + path;
    const url = await _signedVisionUrl(storageRef);
    return url ? { url, storageRef } : null;
  } catch(e) {
    console.warn('Vision image upload failed:', e.message);
    return null;
  }
}

async function syncIntentionsFromSupabase() {
  if (!currentUser) return;
  try {
    const { data, error } = await sb
      .from('intentions')
      .select('*')
      .eq('user_id', currentUser.id);
    if (error || !data) return;
    if (Array.isArray(data)) {
      // Preserve client-only vision-board fields not stored in Supabase
      const prevById = {};
      (intentions || []).forEach(i => { if (i && i.id) prevById[i.id] = i; });
      (LS.get(`ci_intentions_${currentUser.id}`) || []).forEach(i => {
        if (i && i.id && !prevById[i.id]) prevById[i.id] = i;
      });
      intentions = data.map(row => {
        const prev = prevById[row.id] || {};
        const rowMap  = _parseJsonField(row.the_map);
        const rowBbfw = _parseJsonField(row.bbfw);
        const prevMap  = prev.theMap ?? prev.the_map;
        const prevBbfw = prev.bbfw;
        return hydrateIntent({
          ...row,
          startDate:    row.start_date  ?? prev.startDate  ?? '',
          targetDate:   row.target_date ?? prev.targetDate ?? '',
          category:     row.category    ?? prev.category   ?? '',
          aiEnabled:    (typeof row.ai_enabled === 'boolean') ? row.ai_enabled
                          : (typeof prev.aiEnabled === 'boolean' ? prev.aiEnabled : true),
          imageStorageRef: _visionStoragePath(row.image_url) ? row.image_url : (prev.imageStorageRef || null),
          imageUrl:     _visionStoragePath(row.image_url) ? null : (row.image_url || prev.imageUrl || null),
          imageOptions: prev.imageOptions || ((!_visionStoragePath(row.image_url) && (row.image_url || prev.imageUrl)) ? [row.image_url || prev.imageUrl] : null),
          imageIdx:     prev.imageIdx     || 0,
          roadmapAI:        _parseJsonField(row.roadmap_ai) || prev.roadmapAI || null,
          activeDangerZone: row.active_danger_zone || prev.activeDangerZone || '',
          theMap:       _hasTheMap(rowMap) ? rowMap : (_hasTheMap(prevMap) ? _parseJsonField(prevMap) : null),
          bbfw:         _hasBbfw(rowBbfw) ? rowBbfw : (_hasBbfw(prevBbfw) ? _parseJsonField(prevBbfw) : null),
        });
      });
      await Promise.all(intentions.map(async (intention) => {
        if (!intention.imageStorageRef) return;
        try {
          const signed = await _signedVisionUrl(intention.imageStorageRef);
          if (signed) {
            intention.imageUrl = signed;
            intention.imageOptions = [signed];
          }
        } catch (e) {
          console.warn('Vision image download failed:', e.message);
        }
      }));
      // Supabase returns rows UNORDERED, which scrambles the goal list on every
      // reload (a goal promoted to the top would drift away). Re-apply the local
      // order so goals stay exactly where the user put them; ids we've never seen
      // locally (e.g. added on another device) fall to the end.
      const _localOrder = (LS.get(`ci_intentions_${currentUser.id}`) || []).map(i => i && i.id);
      if (_localOrder.length) {
        const _pos = new Map(_localOrder.map((id, i) => [id, i]));
        intentions.sort((a, b) => {
          const ai = _pos.has(a.id) ? _pos.get(a.id) : Number.MAX_SAFE_INTEGER;
          const bi = _pos.has(b.id) ? _pos.get(b.id) : Number.MAX_SAFE_INTEGER;
          return ai - bi;
        });
      }
      LS.set(`ci_intentions_${currentUser.id}`, _leanForLS(intentions));
      // Re-render build sheet if a goal is open — Map/Backbone now loaded from Supabase
      if (selectedVaultIdx !== null && intentions[selectedVaultIdx]) {
        showVaultBuildSheet(selectedVaultIdx);
      }
      renderVaultSidebar();
      // Keep the dedicated Goals workspace in sync with the same data used by
      // Roadmap. This matters when Supabase finishes after the inline Goals
      // destination first renders.
      renderPBIntentionList();
    }
  } catch(e) {
    console.warn('syncIntentionsFromSupabase failed:', e);
  }
}

/* ─────────────────────────────────────────────────────────
   INTENTIONS — DATA
───────────────────────────────────────────────────────── */
export let intentions = [];

function loadIntentionsFromLS() {
  const key = currentUser ? `ci_intentions_${currentUser.id}` : 'ci_intentions';
  intentions = LS.get(key) || [];
}

async function saveTargetDate(idx, val) {
  if (intentions[idx]) {
    intentions[idx].targetDate = val;
    await saveIntentions();
    const hdr = document.getElementById(`card-hdr-${idx}`);
    if (hdr) {
      const dateDiv = hdr.querySelector('.card-date');
      if (val) {
        if (dateDiv) dateDiv.textContent = '🗓 ' + val;
        else {
          const textEl = hdr.querySelector('.card-text');
          if (textEl && textEl.parentElement) {
            const d = document.createElement('div');
            d.className = 'card-date';
            d.textContent = '🗓 ' + val;
            textEl.parentElement.appendChild(d);
          }
        }
      } else if (dateDiv) dateDiv.remove();
    }
  }
}

export async function saveIntentions() {
  if (currentUser) LS.set(`ci_intentions_${currentUser.id}`, _leanForLS(intentions));
  try {
    await syncIntentionsToSupabase();
  } catch(e) {
    console.warn('Intentions sync failed:', e.message);
  }
}

/* ─────────────────────────────────────────────────────────
   DASHBOARD — RENDER
───────────────────────────────────────────────────────── */
const CARD_COLORS = [
  '#E4E8EB','#C6CCD1','#AEB6BC','#8A939B',
  '#6B747D','#515A63','#3B424A','#242A30'
];
/* Grayscale ramp (light → dark) — goal cards are black & white, not colored. */
export const GREY_SHADES = [
  { bg: '#F2F4F6', text: '#1C2126' },
  { bg: '#E4E8EB', text: '#1C2126' },
  { bg: '#D6DBDF', text: '#1C2126' },
  { bg: '#C6CCD1', text: '#1C2126' },
  { bg: '#AEB6BC', text: '#1C2126' },
  { bg: '#8A939B', text: '#1C2126' },
  { bg: '#6B747D', text: '#FFFFFF' },
  { bg: '#515A63', text: '#FFFFFF' },
  { bg: '#3B424A', text: '#FFFFFF' },
  { bg: '#2A3036', text: '#FFFFFF' },
  { bg: '#1C2126', text: '#FFFFFF' },
];

/* Full-color spectrum for the goal LETTER CIRCLES only (cards stay grayscale). */
export const GOAL_COLORS = [
  { bg: '#E84040', text: '#fff' }, { bg: '#E86030', text: '#fff' }, { bg: '#E88020', text: '#fff' },
  { bg: '#E8A828', text: '#1C2230' }, { bg: '#E8C830', text: '#1C2230' }, { bg: '#A8C830', text: '#1C2230' },
  { bg: '#48B860', text: '#fff' }, { bg: '#38A888', text: '#fff' }, { bg: '#2898A8', text: '#fff' },
  { bg: '#7888A8', text: '#fff' }, { bg: '#3878A8', text: '#fff' },
];
/* Inline style for a goal letter circle, colored by goal index. */
function _goalColor(idx) {
  return GOAL_COLORS[((idx % GOAL_COLORS.length) + GOAL_COLORS.length) % GOAL_COLORS.length] || { bg: '#1D3557', text: '#fff' };
}
function _goalCircleStyle(idx) {
  const c = _goalColor(idx);
  return 'background:' + c.bg + ';color:' + c.text;
}
// 8-lobe scalloped goal badge (replaces the round letter-circle). Static 100×100
// path; goalBadge() renders it at any px with the goal letter centered inside.
const _SCALLOP_D = (() => {
  const cx = 50, cy = 50, baseR = 32, bumpR = 14, lobes = 8, pts = [];
  for (let i = 0; i < lobes; i++) { const a = (i / lobes) * 2 * Math.PI - Math.PI / 2; pts.push([cx + baseR * Math.cos(a), cy + baseR * Math.sin(a)]); }
  let d = 'M ' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2) + ' ';
  for (let i = 1; i <= lobes; i++) { const p = pts[i % lobes]; d += 'A ' + bumpR + ' ' + bumpR + ' 0 0 1 ' + p[0].toFixed(2) + ' ' + p[1].toFixed(2) + ' '; }
  return d + 'Z';
})();
export function goalBadge(letter, bg, textColor, px) {
  px = px || 34;
  return '<span style="display:inline-flex;flex-shrink:0;width:' + px + 'px;height:' + px + 'px;line-height:0;vertical-align:middle;">' +
    '<svg width="' + px + '" height="' + px + '" viewBox="0 0 100 100" style="display:block;">' +
    '<path d="' + _SCALLOP_D + '" fill="' + (bg || '#1D3557') + '"/>' +
    '<text x="50" y="50" text-anchor="middle" dominant-baseline="central" fill="' + (textColor || '#fff') + '" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-weight="800" font-size="50">' + (letter == null ? '' : letter) + '</text></svg></span>';
}
if (typeof window !== 'undefined') window.goalBadge = goalBadge;
// Pretty date; falls back to the raw value if it isn't a parseable date.
function _fmtDate(d) { if (!d) return ''; const x = new Date(d); return isNaN(x.getTime()) ? String(d) : x.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
// Start date + "My Reality On or Before" target date, shown under a goal's title.
function _goalDatesHTML(g) {
  const sd = _fmtDate(g && g.startDate), td = _fmtDate(g && g.targetDate);
  const none = '<span style="opacity:.55">not set</span>';
  return '<div style="padding:0 6px 14px;font-size:13px;line-height:1.7;color:var(--muted);display:flex;flex-wrap:wrap;justify-content:center;text-align:center;gap:4px 22px;">' +
    '<span><strong style="color:var(--text);">Start date:</strong> ' + (sd || none) + '</span>' +
    '<span><strong style="color:var(--text);">My Reality On or Before:</strong> ' + (td || none) + '</span></div>';
}

/* Local (not-yet-synced) goal completion, keyed by goal index — same convention
   as the favorites store. */
function _isGoalComplete(idx) {
  try { return (JSON.parse(localStorage.getItem('ci_goal_complete') || '[]') || []).includes(idx); } catch (e) { return false; }
}
export function toggleGoalComplete(idx, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem('ci_goal_complete') || '[]') || []; } catch (e) {}
  const at = arr.indexOf(idx);
  if (at >= 0) arr.splice(at, 1); else arr.push(idx);
  try { localStorage.setItem('ci_goal_complete', JSON.stringify(arr)); } catch (e) {}
  const panel = document.getElementById('goalTimeline-' + idx);
  if (panel) { const wasOpen = panel.classList.contains('cc-open'); panel.innerHTML = _goalTimelineHTML(intentions[idx], idx); if (wasOpen) panel.style.maxHeight = 'none'; }
}
if (typeof window !== 'undefined') window.toggleGoalComplete = toggleGoalComplete;

/* The goal's timeline as 5 mini-columns: colored letter · start date · on-or-before
   completion date · days to completion · mark-complete circle. Opened by the
   TIMELINE & PROGRESS button in the workspace (replaces the old plain date line). */
function _goalTimelineHTML(g, idx) {
  const sd = _fmtDate(g && g.startDate), td = _fmtDate(g && g.targetDate);
  const none = '<span style="opacity:.5">—</span>';
  let days = none;
  if (g && g.targetDate) {
    const t = new Date(g.targetDate);
    if (!isNaN(t.getTime())) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const diff = Math.ceil((t.getTime() - today.getTime()) / 86400000);
      days = diff >= 0
        ? '<strong style="color:#fff;">' + diff + '</strong> day' + (diff === 1 ? '' : 's')
        : '<strong style="color:#ff6b6b;">' + Math.abs(diff) + '</strong> over';
    }
  }
  const done = _isGoalComplete(idx);
  const letter = goalLetter(g, idx);
  const _lci = (typeof letter === 'string' && /^[A-Z]$/.test(letter)) ? letter.charCodeAt(0) - 65 : (Number.isFinite(idx) ? idx : 0);
  const gc = GOAL_COLORS[((_lci % GOAL_COLORS.length) + GOAL_COLORS.length) % GOAL_COLORS.length] || { bg: '#1D3557', text: '#fff' };
  const head = 'font-size:10px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:6px;white-space:nowrap;';
  const val = 'font-size:13px;line-height:1.3;color:#fff;white-space:nowrap;';
  return '<div style="display:grid;grid-template-columns:auto 1fr 1fr auto auto;gap:8px 14px;align-items:center;justify-items:center;text-align:center;background:#1a1a1a;border:none;border-radius:12px;padding:16px;margin:0 4px 12px;overflow-x:auto;">' +
    '<div><div style="' + head + '">Goal</div>' + goalBadge(letter, gc.bg, gc.text, 32) + '</div>' +
    '<div><div style="' + head + '">Start date</div><div style="' + val + '">' + (sd || none) + '</div></div>' +
    '<div><div style="' + head + '">On or before</div><div style="' + val + '">' + (td || none) + '</div></div>' +
    '<div><div style="' + head + '">Days to go</div><div style="' + val + '">' + days + '</div></div>' +
    '<div><div style="' + head + '">Done</div><button onclick="toggleGoalComplete(' + idx + ', event)" title="Mark this goal complete" style="width:34px;height:34px;border-radius:50%;border:2px solid ' + (done ? '#2fae60' : 'rgba(255,255,255,.55)') + ';background:' + (done ? '#2fae60' : 'transparent') + ';color:#fff;font-size:16px;font-weight:800;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;">' + (done ? '&#10003;' : '') + '</button></div>' +
    '</div>';
}

/* Darken a hex color by fraction f (0-1) — used for the goal-card circles so
   they read as a deeper shade of the card, not black. */
export function darkenHex(hex, f) {
  const h = (hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (isNaN(n)) return hex;
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r * (1 - f)); g = Math.round(g * (1 - f)); b = Math.round(b * (1 - f));
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function renderDashboard() {
  const pb   = getPB();
  const name = pb['pb-name'] || 'Friend';
  const helloEl = document.getElementById('dashHello');
  if (helloEl) helloEl.innerHTML = `Welcome back, ${esc(name)} ✦<br><span>Your effort today is a testament to your dedication, your discipline, your drive.</span>`;

  // "Welcome back" greeting removed; move the page title ("The Inner Citadel")
  // down into its spot at the top of Column A instead.
  const greetEl = document.getElementById('dashGreeting');
  if (greetEl) greetEl.style.display = 'none';
  const _dashHdr  = document.querySelector('#page-dashboard .pg-hdr');
  const _dashMain = document.getElementById('vaultMain');
  if (_dashHdr && _dashMain && _dashHdr.parentElement !== _dashMain) _dashMain.insertBefore(_dashHdr, _dashMain.firstChild);

  // Only render Level 1 cards (tabs are now inside each card)
  const container = document.getElementById('intentionCards');
  if (container) {
    container.innerHTML = '';
    if (intentions.length === 0) {
      container.innerHTML = `
        <div class="dash-empty">
          <div class="dash-empty-icon">🎯</div>
          <h3>No intentions yet</h3>
          <p>Tap "+ Add Intention" above to add your first I AM statement.</p>
        </div>`;
    } else {
      intentions.forEach((intention, idx) => {
        const color = CARD_COLORS[idx % CARD_COLORS.length];
        const card  = document.createElement('div');
        card.className = 'intention-card';
        card.id = `card-${idx}`;
        card.innerHTML = buildCardHTML(intention, idx, color);
        container.appendChild(card);
      });
    }
  }

  updateProgressStats();
  renderVaultSidebar();
  if (typeof renderTodayView === 'function') renderTodayView();
  if (typeof renderTodayStrip === 'function') renderTodayStrip();
  checkHotStateAlert();
}

function checkHotStateAlert() {
  if (document.getElementById('hotStateToast')) return; // already shown
  const pb    = getPB();
  const start = parseInt(pb['pb-hotstate-start']);
  const end   = parseInt(pb['pb-hotstate-end']);
  if (isNaN(start) || isNaN(end)) return;
  const hour  = new Date().getHours();
  const inHot = start <= end ? (hour >= start && hour <= end) : (hour >= start || hour <= end);
  if (!inHot) return;

  const toast = document.createElement('div');
  toast.id = 'hotStateToast';
  toast.style.cssText = [
    'position:fixed;bottom:24px;left:50%;transform:translateX(-50%)',
    'background:#1a0505;border:1px solid #8B0000;border-radius:12px',
    'padding:14px 20px;z-index:9999;max-width:420px;width:calc(100% - 48px)',
    'box-shadow:0 8px 32px rgba(0,0,0,0.6);display:flex;gap:12px;align-items:flex-start',
    'animation:slideUp 0.4s ease'
  ].join(';');
  toast.innerHTML = `
    <span style="font-size:20px;flex-shrink:0;">🌙</span>
    <div style="flex:1;">
      <div style="font-family:'Roboto Condensed',sans-serif;font-size:10px;font-weight:800;
        color:var(--danger);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">
        Hot State — ${start}:00–${end}:00</div>
      <div style="font-size:11px;color:var(--mid);line-height:1.5;margin-bottom:8px;">
        Your high-risk window is active. You pre-wired the plan. Execute it.</div>
    </div>
    <button onclick="this.closest('#hotStateToast').remove()"
      style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px;
      flex-shrink:0;line-height:1;">✕</button>
  `;
  document.body.appendChild(toast);
  // Auto-dismiss after 12 seconds
  setTimeout(() => toast.remove(), 12000);
}

function toggleTodayTask(key, el) {
  const done = LS.get('ci_today_done') || [];
  const idx  = done.indexOf(key);
  const textEl = document.getElementById(`twt-${key}`);
  if (idx === -1) {
    done.push(key);
    el.classList.add('done');
    el.textContent = '✓';
    if (textEl) textEl.classList.add('done');
  } else {
    done.splice(idx, 1);
    el.classList.remove('done');
    el.textContent = '';
    if (textEl) textEl.classList.remove('done');
  }
  LS.set('ci_today_done', done);
  updateProgressStats();
}

function updateProgressStats() {
  const done     = LS.get('ci_today_done') || [];
  const aiCount  = intentions.filter(i => i.mindset || i.achievers).length;
  const total    = intentions.reduce((sum, i) => sum + (i.achievers?.roadmap?.length || 0), 0);
  const pct      = total > 0 ? Math.min(Math.round((done.length / total) * 100), 100) : 0;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('effortScoreNum', done.length);
  setEl('statIntentions', intentions.length);
  setEl('statTasksDone',  done.length);
  setEl('statAI',         aiCount);
  setEl('statStreak',     LS.get('ci_streak') || 0);

  const bar = document.getElementById('effortBarFill');
  if (bar) bar.style.width = pct + '%';
}

/* ─────────────────────────────────────────────────────────
   DASHBOARD LEVEL TABS
───────────────────────────────────────────────────────── */
function switchVizTab(tab) {
  const isText = tab === 'text';
  document.getElementById('vizPanelText').style.display  = isText ? 'flex' : 'none';
  document.getElementById('vizPanelVideo').style.display = isText ? 'none' : 'flex';
  document.getElementById('vizTabText').classList.toggle('active', isText);
  document.getElementById('vizTabVideo').classList.toggle('active', !isText);
}


function switchDLTab(n) {
  [1, 2, 3].forEach(i => {
    document.getElementById(`dlTab-${i}`)?.classList.toggle('active', i === n);
    document.getElementById(`dlPanel-${i}`)?.classList.toggle('active', i === n);
  });
}

/* community.js */



/* card-builder.js */

/* mission-control.js */

export async function generateBlueprint() {
  if (intentions.length === 0) {
    toast('Add at least one intention first.', 'error'); return;
  }

  // Open modal and show loading state
  openModal('blueprintModal');
  const body     = document.getElementById('blueprintBody');
  const regenBtn = document.getElementById('btnBlueprintRegen');
  const dashBtn  = document.getElementById('btnBlueprint');
  body.innerHTML = `<div style="text-align:center;padding:48px 0"><span class="inline-spinner"></span><span style="color:var(--muted);font-size:14px">Building your blueprint…</span></div>`;
  if (regenBtn) regenBtn.disabled = true;
  if (dashBtn)  dashBtn.disabled  = true;

  try {
    const pb           = getPB();
    const context      = buildContext(pb);
    const intentionList = intentions.map((i,n) => `${n+1}. ${i.title}`).join('\n');

    if (DEV_MODE) {
      await new Promise(r => setTimeout(r, 900));
      const fake = {
        summary: "You are building a life of freedom, purpose, and impact. Every intention you've set points toward the same north star — a person who creates on their own terms, leads with courage, and lives without regret.",
        themes: ["Financial Freedom", "Personal Mastery", "Health & Vitality", "Deep Purpose"],
        priorities: [
          "Lock in your non-negotiable morning routine — it sets the tone for everything.",
          "Build one income stream at a time. Diversify once the first is producing.",
          "Your health is the foundation. Without it, nothing else functions at full capacity.",
          "Say no to everything that doesn't serve your top 3 priorities this quarter."
        ],
        mantra: "I build daily. I trust the process. I am the proof."
      };
      body.innerHTML = renderBlueprintResult(fake);
      if (regenBtn) regenBtn.disabled = false;
      if (dashBtn)  dashBtn.disabled  = false;
      return;
    }

    const system = `You are a master life strategist AI. User profile:\n${context}\n\nRespond ONLY with valid JSON — no other text:\n{"summary":"...","themes":["..."],"priorities":["...","...","...","..."],"mantra":"..."}`;
    const user   = `Based on these intentions:\n${intentionList}\n\nCreate a master blueprint with: a 2-3 sentence strategic summary, 4 core themes, 4 top priorities (specific and actionable), and 1 personal mantra.`;

    const raw    = await callClaude(system, user, 1200);
    const result = JSON.parse(raw.replace(/```json|```/g,'').trim());

    body.innerHTML = renderBlueprintResult(result);
  } catch(e) {
    body.innerHTML = `<div style="text-align:center;padding:40px;color:var(--mb1)">Generation failed. Try again.</div>`;
    console.error(e);
  } finally {
    if (regenBtn) regenBtn.disabled = false;
    if (dashBtn)  dashBtn.disabled  = false;
  }
}

function renderBlueprintResult(r) {
  const themes = (r.themes||[]).map(t =>
    `<li><span class="blueprint-bullet">✦</span>${esc(t)}</li>`).join('');
  const priorities = (r.priorities||[]).map((p,i) =>
    `<li><span class="blueprint-bullet">${i+1}</span>${esc(p)}</li>`).join('');
  return `
    <div class="blueprint-section">
      <div class="blueprint-section-title">Strategic Overview</div>
      <p class="blueprint-text">${esc(r.summary||'')}</p>
    </div>
    <div class="blueprint-section">
      <div class="blueprint-section-title">Core Themes</div>
      <ul class="blueprint-list">${themes}</ul>
    </div>
    <div class="blueprint-section">
      <div class="blueprint-section-title">Top Priorities</div>
      <ul class="blueprint-list">${priorities}</ul>
    </div>
    <div class="blueprint-section">
      <div class="blueprint-section-title">Personal Mantra</div>
      <div class="meditation-box">${esc(r.mantra||'')}</div>
    </div>`;
}

export async function generateDaylife() {
  if (intentions.length === 0) {
    toast('Add at least one intention first.', 'error'); return;
  }

  openModal('daylifeModal');
  const body     = document.getElementById('daylifeBody');
  const regenBtn = document.getElementById('btnDaylifeRegen');
  const dashBtn  = document.getElementById('btnDaylife');
  body.innerHTML = `<div style="text-align:center;padding:48px 0"><span class="inline-spinner"></span><span style="color:var(--muted);font-size:14px">Crafting your ideal day…</span></div>`;
  if (regenBtn) regenBtn.disabled = true;
  if (dashBtn)  dashBtn.disabled  = true;

  try {
    const pb            = getPB();
    const context       = buildContext(pb);
    const intentionList = intentions.map(i => i.title).join(', ');

    if (DEV_MODE) {
      await new Promise(r => setTimeout(r, 900));
      const fake = {
        intro: "This is what your life looks like when you're fully living your intentions — not someday, but today.",
        schedule: [
          { time: "5:30 AM", activity: "You wake before the world stirs. 10 minutes of stillness — breathing, presence, setting the tone." },
          { time: "6:00 AM", activity: "Movement. 45 minutes of exercise that reminds your body who's in charge." },
          { time: "7:00 AM", activity: "Fuel and focus. A clean breakfast, your affirmations read aloud, and your #1 goal for the day written down." },
          { time: "8:00 AM", activity: "Deep work block. The most important creative or strategic work of your life gets done here, undistracted." },
          { time: "12:00 PM", activity: "A real lunch break. You close the laptop, eat well, take a short walk, and let ideas incubate." },
          { time: "2:00 PM", activity: "Meetings, calls, collaboration — the world gets your attention here, not before." },
          { time: "5:00 PM", activity: "You close the day with a 10-minute review. Wins captured. Tomorrow's priority set." },
          { time: "7:00 PM", activity: "Presence with family or people who matter. No phone. Full attention." },
          { time: "9:30 PM", activity: "Wind down. Reading, reflection, gratitude. You fall asleep knowing you lived today fully." }
        ],
        closing: "This is not a fantasy. This is already you — just the version that showed up."
      };
      body.innerHTML = renderDaylifeResult(fake);
      if (regenBtn) regenBtn.disabled = false;
      if (dashBtn)  dashBtn.disabled  = false;
      return;
    }

    const system = `You are a visionary life coach AI. User profile:\n${context}\n\nRespond ONLY with valid JSON — no other text:\n{"intro":"...","schedule":[{"time":"...","activity":"..."}],"closing":"..."}`;
    const user   = `Write a vivid, inspiring "A Day in My Life" narrative for someone living these intentions: ${intentionList}.\n\nInclude: 1 intro sentence, 8-9 time blocks from morning to night (specific times + 1-2 sentence activity descriptions), and 1 closing sentence. Make it feel real and achievable, not fantasy.`;

    const raw    = await callClaude(system, user, 1200);
    const result = JSON.parse(raw.replace(/```json|```/g,'').trim());

    body.innerHTML = renderDaylifeResult(result);
  } catch(e) {
    body.innerHTML = `<div style="text-align:center;padding:40px;color:var(--mb1)">Generation failed. Try again.</div>`;
    console.error(e);
  } finally {
    if (regenBtn) regenBtn.disabled = false;
    if (dashBtn)  dashBtn.disabled  = false;
  }
}

function renderDaylifeResult(r) {
  const blocks = (r.schedule||[]).map(b => `
    <div class="daylife-time-block">
      <div class="daylife-time">${esc(b.time)}</div>
      <div class="daylife-activity">${esc(b.activity)}</div>
    </div>`).join('');
  return `
    ${r.intro ? `<p style="font-size:14px;color:var(--mid);line-height:1.6;margin-bottom:20px;font-style:italic">${esc(r.intro)}</p>` : ''}
    ${blocks}
    ${r.closing ? `<div class="meditation-box" style="margin-top:20px">${esc(r.closing)}</div>` : ''}`;
}

/* ─────────────────────────────────────────────────────────
   MODAL HELPERS
───────────────────────────────────────────────────────── */
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

export function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

/* ─────────────────────────────────────────────────────────
   VOICE ENGINE
───────────────────────────────────────────────────────── */
function stopSpeech() {
  try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch(e) {}
}

function speakBrowser(text) {
  if (!('speechSynthesis' in window)) return;
  const utt  = new SpeechSynthesisUtterance(text.substring(0, 150));
  utt.rate   = 0.82;
  utt.pitch  = 0.88;
  utt.volume = 0.9;
  window.speechSynthesis.speak(utt);
}

async function speakText(text) {
  if (!text) return;
  stopSpeech();
  const safeText = text.trim().substring(0, 150);
  const voice    = localStorage.getItem('openai_voice') || 'alloy';
  try {
    const res = await ciApi('tts', { text: safeText, voice });
    if (!res.ok) throw new Error(`TTS ${res.status}`);
    const { audio: b64 } = await res.json();
    playBase64Audio(b64);
    return b64;
  } catch(err) {
    console.error('TTS failed:', err);
    speakBrowser(safeText);
  }
}

async function speakCached(text, idx) {
  if (!text) return;
  const safeText = text.trim().substring(0, 150);
  const intn = intentions[idx];
  if (intn && intn.audioBase64 && intn.audioText === safeText) {
    playBase64Audio(intn.audioBase64);
    return;
  }
  const b64 = await speakText(safeText);
  if (b64 && intn) {
    intn.audioBase64 = b64;
    intn.audioText   = safeText;
    saveIntentions();
  }
}

function playBase64Audio(b64) {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob  = new Blob([bytes], { type: 'audio/mpeg' });
  const audio = new Audio(URL.createObjectURL(blob));
  audio.volume = 0.6;
  audio.play();
  audio.onended = () => URL.revokeObjectURL(audio.src);
}

/* ─────────────────────────────────────────────────────────
   528HZ BELL
───────────────────────────────────────────────────────── */
function playBell(freq = 528) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.32, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 3.5);
    osc.onended = () => { try { ctx.close(); } catch(e) {} };
  } catch(e) {}
}

/* ─────────────────────────────────────────────────────────
   3-MIN MANIFEST
───────────────────────────────────────────────────────── */
const MANIFEST_SLIDES = [
  { type:'intro',     h:null,                          b:null,                                                            d:5000 },
  { type:'breathe',   h:'Breathe In.',                 b:null,                                                            d:5000 },
  { type:'breathe',   h:'Breathe Out.',                b:null,                                                            d:5000 },
  { type:'text',      h:'You are here.',               b:'This moment belongs entirely to you.',                          d:9000 },
  { type:'text',      h:'You are becoming.',           b:'Not who you were. The person you have decided to be.',          d:10000},
  { type:'iam',       h:null,                          b:null,                                                            d:14000},
  { type:'text',      h:'See it.',                     b:'Close your eyes. Picture yourself already there.',             d:12000},
  { type:'text',      h:'Feel it.',                    b:'The freedom. The certainty. The quiet pride.',                  d:10000},
  { type:'text',      h:'You are grateful.',           b:'For who you are. For what is coming.',                         d:9000 },
  { type:'gratitude', h:null,                          b:null,                                                            d:12000},
  { type:'text',      h:'You show up.',                b:'Every day. Without exception. Not because you have to — because you choose to.', d:11000},
  { type:'affirm',    h:null,                          b:null,                                                            d:10000},
  { type:'text',      h:'Breathe it in.',              b:'This is your identity now. Own it completely.',                 d:9000 },
  { type:'text',      h:'It is already done.',         b:'What you seek is already seeking you.',                         d:9000 },
  { type:'close',     h:'Now go live it.',             b:null,                                                            d:0    },
];

const mSt = { idx:null, slide:0, timer:null, aiIam:'', aiGratitude:'', affirm:'', running:false };

/* ── ARSENAL PLAYER ─────────────────────────────────────── */
const arsenalState = {
  mode: 'visualization',
  imgIdx: 1,
  activeImg: 0,
  timer: null,
  fadeTimer: null,
  paused: false,
  intentionIdx: 0,
  texts: [],
  textIdx: 0,
  failed: 0,
};

function getArsenalTexts(mode, idx) {
  const intn = (intentions && intentions[idx]) || null;
  if (mode === 'visualization' || mode === 'affirmation') {
    const aff = intn?.mindset?.affirmations || [];
    return aff.length ? aff : [
      'I AM exactly who I was born to become.',
      'I attract success, abundance, and deep purpose.',
      'Every action I take moves me closer to my vision.',
      'I am unstoppable. I am disciplined. I am free.',
      'My future is already written — I am living into it now.',
    ];
  }
  if (mode === 'gratitude') {
    return [
      'I am grateful for the life I am actively building.',
      'I am grateful for every challenge that forged my strength.',
      'I am grateful for the clarity I carry right now.',
      'I am grateful for my discipline, my drive, my direction.',
      'I am grateful — and that gratitude multiplies everything.',
    ];
  }
  return [
    'Breathe in. Breathe out.',
    'You are exactly where you need to be.',
    'Release what you cannot control.',
    'Stillness is power. Silence is fuel.',
    'Your mind is clear. Your path is certain.',
    'Rest here. Then rise.',
  ];
}

function launchArsenal(mode) {
  mode = mode || 'visualization';
  arsenalState.mode         = mode;
  arsenalState.imgIdx       = 1;
  arsenalState.activeImg    = 0;
  arsenalState.paused       = false;
  arsenalState.failed       = 0;
  arsenalState.textIdx      = 0;
  arsenalState.intentionIdx = (selectedVaultIdx !== null && selectedVaultIdx !== undefined)
    ? selectedVaultIdx : 0;
  arsenalState.texts = getArsenalTexts(mode, arsenalState.intentionIdx);

  clearTimeout(arsenalState.timer);
  clearTimeout(arsenalState.fadeTimer);
  arsenalStopProgress();

  const overlay = document.getElementById('arsenalOverlay');
  overlay.classList.add('open');

  ['arsenalImg0','arsenalImg1'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.opacity = '0'; }
  });
  ['arsenalHeroImg0','arsenalHeroImg1'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.src = ''; el.style.opacity = '0'; el.classList.remove('kb-active'); }
  });
  const heroDefault = document.getElementById('arsenalHeroImg0');
  if (heroDefault) { heroDefault.src = ''; heroDefault.style.opacity = '0'; }

  const fill = document.getElementById('arsenalProgressFill');
  if (fill) fill.style.width = '0%';

  const intn    = (intentions && intentions[arsenalState.intentionIdx]) || null;
  const titleEl = document.getElementById('arsenalIntentionTitle');
  const artEl   = document.getElementById('arsenalArtistName');
  if (titleEl) titleEl.textContent = intn?.title || 'Cosmic Intentions';
  if (artEl) {
    const pb = LS.get('ci_pegboard') || {};
    artEl.textContent = pb['pb-name'] || currentUser?.user_metadata?.full_name || 'Member';
  }

  const playIcon = document.getElementById('arsenalPlayIcon');
  if (playIcon) playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';

  arsenalUpdateModeButtons(mode);
  arsenalUpdateText(true);
  arsenalLoadImage(1);
}

function arsenalSetMode(mode) {
  arsenalState.mode    = mode;
  arsenalState.texts   = getArsenalTexts(mode, arsenalState.intentionIdx);
  arsenalState.textIdx = 0;
  arsenalUpdateModeButtons(mode);
  arsenalUpdateText(false);
}

function arsenalUpdateModeButtons(mode) {
  ['visualization','gratitude','affirmation','meditation'].forEach(m => {
    const btn = document.getElementById('arsenalMode' + m.charAt(0).toUpperCase() + m.slice(1));
    if (btn) btn.classList.toggle('active', m === mode);
  });
}

function arsenalUpdateText(instant) {
  const texts = arsenalState.texts;
  if (!texts.length) return;
  const el = document.getElementById('arsenalTextOverlay');
  if (!el) return;
  const text = texts[arsenalState.textIdx % texts.length];
  arsenalState.textIdx++;
  if (instant) {
    el.style.opacity = '1';
    el.textContent = text;
  } else {
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = text; el.style.opacity = '1'; }, 650);
  }
}

// Strip brackets and URL-encoded equivalents (%5B %5D %20) from any image path
function sanitizeImageSrc(src) {
  if (!src) return '';
  return src
    .replace(/%5B/gi, '').replace(/%5D/gi, '')
    .replace(/%20/g, '-')
    .replace(/[\[\]]/g, '')
    .replace(/-+/g, '-')
    .replace(/[^a-zA-Z0-9_.\/:\-]/g, '')
    .toLowerCase();
}

function getArsenalImageUrls() {
  const urls = (intentions || []).map(i => i.imageUrl).filter(Boolean);
  return urls.length ? urls : null;
}

function getArsenalImageSrc(n) {
  const urls = getArsenalImageUrls();
  if (!urls) return null;
  return urls[(n - 1) % urls.length];
}

function arsenalLoadImage(n) {
  if (arsenalState.paused) return;
  const src = getArsenalImageSrc(n);

  // No intention images available — show solid dark background, skip image cycling
  if (!src) {
    arsenalStartProgress();
    arsenalState.timer = setTimeout(() => {
      if (arsenalState.paused) return;
      arsenalUpdateText(false);
      arsenalScheduleNext(n + 1);
    }, 7000);
    return;
  }

  const active = arsenalState.activeImg;
  const next   = 1 - active;
  const nextEl     = document.getElementById(`arsenalImg${next}`);
  const heroNextEl = document.getElementById(`arsenalHeroImg${next}`);

  const probe = new Image();
  probe.onload = () => {
    arsenalState.failed = 0;

    if (nextEl) { nextEl.src = src; nextEl.style.opacity = '0'; }
    if (heroNextEl) {
      heroNextEl.src = src;
      heroNextEl.style.opacity = '0';
      heroNextEl.classList.remove('kb-active');
      void heroNextEl.offsetWidth;
      heroNextEl.classList.add('kb-active');
    }

    arsenalStartProgress();

    requestAnimationFrame(() => {
      if (nextEl)     nextEl.style.opacity     = '1';
      if (heroNextEl) heroNextEl.style.opacity = '1';
    });

    arsenalState.timer = setTimeout(() => {
      if (arsenalState.paused) return;
      arsenalUpdateText(false);
      const nextIdx = n + 1;
      const nextSrc = getArsenalImageSrc(nextIdx);
      if (!nextSrc) { arsenalScheduleNext(nextIdx); return; }
      const preload = new Image();
      preload.onload = () => {
        if (arsenalState.paused) return;
        const nextActive = 1 - arsenalState.activeImg;
        const nextNextEl = document.getElementById(`arsenalImg${nextActive}`);
        const heroNNEl   = document.getElementById(`arsenalHeroImg${nextActive}`);

        if (nextNextEl) { nextNextEl.src = nextSrc; nextNextEl.style.opacity = '0'; }
        if (heroNNEl) {
          heroNNEl.src = nextSrc;
          heroNNEl.style.opacity = '0';
          heroNNEl.classList.remove('kb-active');
          void heroNNEl.offsetWidth;
          heroNNEl.classList.add('kb-active');
        }
        requestAnimationFrame(() => {
          if (nextNextEl) nextNextEl.style.opacity = '1';
          if (heroNNEl)   heroNNEl.style.opacity   = '1';
        });
        arsenalState.fadeTimer = setTimeout(() => {
          const oldEl   = document.getElementById(`arsenalImg${arsenalState.activeImg}`);
          const heroOld = document.getElementById(`arsenalHeroImg${arsenalState.activeImg}`);
          if (oldEl)   oldEl.style.opacity   = '0';
          if (heroOld) heroOld.style.opacity = '0';
          arsenalState.activeImg = nextActive;
          arsenalState.imgIdx    = nextIdx;
          arsenalScheduleNext(nextIdx);
        }, 3000);
      };
      preload.onerror = () => { arsenalHandleError(nextIdx); };
      preload.src = nextSrc;
    }, 7000);

    arsenalState.activeImg = next;
  };
  probe.onerror = () => { arsenalHandleError(n); };
  probe.src = src;
}

function arsenalScheduleNext(n) {
  if (arsenalState.paused) return;
  arsenalState.timer = setTimeout(() => {
    if (arsenalState.paused) return;
    arsenalUpdateText(false);
    arsenalLoadImage(n);
  }, 7000);
}

function arsenalHandleError(n) {
  arsenalState.failed++;
  if (arsenalState.failed >= 3) {
    arsenalState.failed = 0;
    arsenalState.imgIdx = 1;
    arsenalLoadImage(1);
  } else if (n > 1) {
    arsenalState.imgIdx = 1;
    arsenalLoadImage(1);
  }
}

function arsenalPause() {
  const playIcon = document.getElementById('arsenalPlayIcon');
  if (arsenalState.paused) {
    arsenalState.paused = false;
    if (playIcon) playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    arsenalLoadImage(arsenalState.imgIdx);
  } else {
    arsenalState.paused = true;
    clearTimeout(arsenalState.timer);
    clearTimeout(arsenalState.fadeTimer);
    arsenalStopProgress();
    if (playIcon) playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  }
}

function arsenalExit() {
  clearTimeout(arsenalState.timer);
  clearTimeout(arsenalState.fadeTimer);
  arsenalStopProgress();
  arsenalState.paused = false;
  const overlay = document.getElementById('arsenalOverlay');
  if (overlay) overlay.classList.remove('open');
  ['arsenalImg0','arsenalImg1','arsenalHeroImg0','arsenalHeroImg1'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.src = ''; el.style.opacity = '0'; el.classList.remove('kb-active'); }
  });
}

/* ── ARSENAL PROGRESS BAR ────────────────────────────── */
let _arsenalProgressRaf   = null;
let _arsenalProgressStart = null;
const ARSENAL_CYCLE_MS    = 10000;

function arsenalStartProgress() {
  if (_arsenalProgressRaf) cancelAnimationFrame(_arsenalProgressRaf);
  _arsenalProgressStart = performance.now();
  const fill = document.getElementById('arsenalProgressFill');
  function tick() {
    if (arsenalState.paused) return;
    const pct = Math.min(((performance.now() - _arsenalProgressStart) / ARSENAL_CYCLE_MS) * 100, 100);
    if (fill) fill.style.width = pct + '%';
    if (pct < 100) _arsenalProgressRaf = requestAnimationFrame(tick);
  }
  _arsenalProgressRaf = requestAnimationFrame(tick);
}

function arsenalStopProgress() {
  if (_arsenalProgressRaf) { cancelAnimationFrame(_arsenalProgressRaf); _arsenalProgressRaf = null; }
}
/* ── END ARSENAL ─────────────────────────────────────── */

/* Open the new Visualization player (players/visualization.html) for a goal.
   Stashes the goal's title + image in ci_goal_* so the player reads them, then
   embeds it in the dashboard column. minutes = 3 or 10. */
export function launchVisualization(idx, minutes, ev) {
  if (!intentions.length) { toast('Add an intention first.', 'error'); return; }
  const intn  = intentions[idx] || intentions[0];
  const title = (intn?.title || 'My Vision').replace(/^(i am)\s+/i, 'I AM ');
  localStorage.setItem('ci_goal_title', title);
  // Never cache a base64 data: URL (they're 1-4MB each and blow the ~5MB quota,
  // which breaks the auth-token write → logout). Only a lightweight Storage URL.
  if (intn?.imageUrl && !intn.imageUrl.startsWith('data:')) localStorage.setItem('ci_goal_image', intn.imageUrl);
  else localStorage.removeItem('ci_goal_image');
  // Pass the goal in the URL (+ cache-buster) so the iframe RELOADS with this goal every time —
  // reusing the same src keeps the first goal that loaded (that was the "everything plays the same goal" bug).
  const q = `g=${encodeURIComponent(title)}&_=${Date.now()}`;
  const src = (!minutes || minutes === 3)
    ? `players/3min-viz.html?${q}`
    : `players/visualization.html?t=${minutes}&${q}`;
  if (typeof window.openPlayerInColumn === 'function') {
    window.openPlayerInColumn(src, ev);
  } else {
    window.open(src, 'ci_player', 'width=1100,height=720');
  }
}

/* Sidebar VISUALIZATION dropdown launcher — visualizes the currently-selected
   goal (or the first one if none selected) so the player shows its image and
   speaks it. */
export function launchViz(minutes, ev) {
  const idx = (selectedVaultIdx !== null && intentions[selectedVaultIdx]) ? selectedVaultIdx : 0;
  launchVisualization(idx, minutes, ev);
}

/* Open the selected goal's Digital Vision Board: exactly its five saved images,
   with no guidance, narration, or cross-player content. */
export function launchDVB(idx, ev) {
  const intn = intentions[idx] || intentions[0];
  if (!intn) { toast('Add an intention first.', 'error'); return; }
  const savedSet = Array.isArray(intn.imageOptions) ? intn.imageOptions.filter(Boolean) : [];
  const images = [...new Set((savedSet.length > 1 ? savedSet : [intn.imageUrl, ...savedSet, ...(Array.isArray(intn.images) ? intn.images : [])]).filter(Boolean))].filter(src => !/tesla/i.test(String(src))).slice(0, 5);
  try {
    localStorage.setItem('ci_dvb_images', JSON.stringify(images));
    localStorage.setItem('ci_dvb_title', intn.title || 'Digital Vision Board');
  } catch (e) {}
  const src = `players/dvb.html?goal=${encodeURIComponent(intn.title || '')}&images=${encodeURIComponent(JSON.stringify(images))}&_=${Date.now()}`;
  if (typeof window.openPlayerInColumn === 'function') window.openPlayerInColumn(src, ev);
  else window.open(src, 'ci_player', 'width=1100,height=720,resizable=yes');
}

/* ── PILLAR 1: VISUALIZATION LIBRARY ──────────────────────────────────────
   Full-screen goals list → tap a goal → its 4 activities (creative viz,
   review, meditate, gratitude). Single-column / mobile-first. */
let _vizGoalIdx = 0;

export function openVizLibrary() { renderVizLibrary(); navTo('vizlibrary'); }

export function renderVizLibrary() {
  const sideEl = document.getElementById('vizSideStats');
  if (sideEl) { try { sideEl.innerHTML = vizSideStatsHTML(); } catch (e) { console.error('[vizSideStats]', e); } }
  const el = document.getElementById('vizLibList');
  if (!el) return;
  if (!intentions.length) {
    el.innerHTML = `<div style="padding:16px 14px;font-size:13px;color:var(--muted);line-height:1.6;">No goals yet — add an intention first.</div>`;
    return;
  }
  const _HEART_PATH = `M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z`;
  const FAV_ADD_SVG    = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" style="display:block"><path d="${_HEART_PATH}"/></svg>`;
  const FAV_REMOVE_SVG = `<svg viewBox="0 0 24 24" width="17" height="17" fill="#fff" style="display:block"><path d="${_HEART_PATH}"/></svg>`;
  const VIZ_ICON  = `<svg viewBox="0 0 24 24" width="16" height="16" fill="#fff" style="display:block"><path d="M8 5v14l11-7z"/></svg>`;
  const EDIT_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>`;
  let _favsViz = []; try { _favsViz = JSON.parse(localStorage.getItem('ci_favorites') || '[]'); } catch (e) {}
  el.innerHTML = intentions.map((it, idx) => {
    const s = GREY_SHADES[idx % GREY_SHADES.length];
    const isFav = Array.isArray(_favsViz) && _favsViz.some(f => f && f.player === 'mindset' && f.goal === idx);
    return `
    <div class="vault-row">
      <button class="vault-item" onmousedown="event.preventDefault()" onclick="vizLibToggle(${idx})" style="background:${s.bg};color:${s.text}">
        ${goalBadge(goalLetter(it, idx), _goalColor(idx).bg, _goalColor(idx).text, 34)}
        <div class="vault-item-body"><div class="vault-item-title" style="color:${s.text}">${esc(goalCase(it.title || ''))}</div></div>
      </button>
      <div class="vault-actions">
        <button class="vault-act${isFav ? ' is-fav' : ''}" onclick="toggleGoalFavorite(${idx}, event)" title="${isFav ? 'Remove from' : 'Add to'} favorites" aria-label="Favorite">${isFav ? FAV_REMOVE_SVG : FAV_ADD_SVG}</button>
        <button class="vault-act" onclick="launchCountdown(${idx}, 180)" title="Visualize this goal" aria-label="Visualize">${VIZ_ICON}</button>
        <button class="vault-act" onclick="navTo('setup')" title="Edit this goal" aria-label="Edit">${EDIT_ICON}</button>
      </div>
    </div>
    <div id="vizLibPanel-${idx}" class="viz-lib-panel" style="display:none;"></div>`;
  }).join('');
}

/* The goal's visualization launchers, shown INLINE just below its card on the
   Visualization Library (accordion) — no page change. Image + quick-viz timers
   (launchCountdown opens the same full-screen countdown overlay from anywhere). */
function buildVizInline(idx, it) {
  const hasImg = it.imageUrl && !String(it.imageUrl).startsWith('data:');
  const img = hasImg ? `<img src="${esc(it.imageUrl)}" alt="${esc(it.title || '')}" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:8px;display:block;margin:0 0 10px;">` : '';
  const timers = [['15 Seconds', 15], ['30 Seconds', 30], ['1 Minute', 60], ['2 Minutes', 120], ['3 Minutes', 180], ['5 Minutes', 300], ['10 Minutes', 600], ['15 Minutes', 900]]
    .map(([lbl, secs]) => `<div style="display:flex;align-items:stretch;gap:8px;">
      <button onclick="launchCountdown(${idx},${secs})" title="${lbl} visualization" style="flex:1;min-width:0;box-sizing:border-box;padding:13px 16px;border-radius:10px;background:#fff;border:none;color:#1D3557;font-size:15px;font-weight:800;letter-spacing:.3px;cursor:pointer;text-align:center;line-height:1;">${lbl}</button>
      <div style="width:42px;flex-shrink:0;border-radius:8px;background:#fff;border:none;"></div>
      <div style="width:42px;flex-shrink:0;border-radius:8px;background:#fff;border:none;"></div>
      <div style="width:42px;flex-shrink:0;border-radius:8px;background:#fff;border:none;"></div>
    </div>`).join('');
  return `<div style="padding:10px 6px 14px;">
    ${img}
    <a href="/players/dvb.html" target="_blank" rel="noopener" title="Play Digital Vision Board" style="display:block;width:100%;box-sizing:border-box;margin:0 0 10px;padding:15px 16px;border-radius:10px;background:#087f9e;border:none;color:#fff;font-size:15px;font-weight:800;letter-spacing:.8px;cursor:pointer;text-align:center;line-height:1;text-decoration:none;">PLAY DIGITAL VISION BOARD</a>
    <div style="display:flex;flex-direction:column;gap:10px;background:#1a1a1a;border:none;border-radius:12px;padding:12px;">
      ${timers}
      <button onclick="openVizGoal(${idx})" title="Open the full visualization page" style="width:100%;box-sizing:border-box;padding:12px 16px;border-radius:10px;background:#7C5CC4;border:none;color:#fff;font-size:14px;font-weight:800;letter-spacing:.3px;cursor:pointer;text-align:center;line-height:1;">Open full visualization page &#8599;</button>
    </div>
  </div>`;
}

/* Accordion toggle for the Visualization Library — opens the goal's launchers in
   a panel right below its card; a second tap (or opening another) collapses it. */
export function vizLibToggle(idx) {
  const panel = document.getElementById(`vizLibPanel-${idx}`);
  if (!panel) return;
  const wasOpen = panel.style.display === 'block';
  document.querySelectorAll('.viz-lib-panel').forEach(p => { p.style.display = 'none'; p.innerHTML = ''; });
  document.querySelectorAll('[id^="vizLibCaret-"]').forEach(c => { c.style.transform = ''; });
  if (wasOpen) return;
  const it = intentions[idx] ? (intentions[idx] = hydrateIntent(intentions[idx])) : null;
  if (!it) return;
  panel.innerHTML = buildVizInline(idx, it);
  panel.style.display = 'block';
  const caret = document.getElementById(`vizLibCaret-${idx}`);
  if (caret) caret.style.transform = 'rotate(90deg)';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── GOAL → ENTREPRENEUR-SKILL MATCHING ──────────────────────────────────────
   On demand, run a goal through the 31-skill library and tag it with the 3-5
   skills it most depends on. Shown on the goal's visualization page. Stored per
   goal id in ci_goal_skills (local for now; Supabase sync is a follow-up). */
function _goalSkills(goalId) { try { return (JSON.parse(localStorage.getItem('ci_goal_skills') || '{}')[goalId]) || []; } catch (e) { return []; } }
function _saveGoalSkills(goalId, arr) {
  let all = {}; try { all = JSON.parse(localStorage.getItem('ci_goal_skills') || '{}'); } catch (e) {}
  if (arr && arr.length) all[goalId] = arr; else delete all[goalId];
  try { localStorage.setItem('ci_goal_skills', JSON.stringify(all)); } catch (e) {}
}
function _skillLabel(key) { return String(key).toLowerCase().replace(/\b\w/g, ch => ch.toUpperCase()); }
function _skillsChips(keys) {
  if (!keys.length) return '';
  return keys.map(k => `<span onclick="navTo('entcard');entGoToCard('${k}')" title="Open this skill in the Entrepreneur Library" style="display:inline-block;cursor:pointer;background:#8FA977;color:#1c1c1c;font-weight:800;font-size:12px;letter-spacing:.3px;padding:6px 11px;margin:0 6px 6px 0;">${_skillLabel(k)}</span>`).join('');
}
/* Match this goal to its top 3-5 skills via the AI, then refresh the viz page. */
export async function pbSharpenSkills(idx) {
  const intn = intentions[idx]; if (!intn) return;
  const btn = document.getElementById(`pbSharpenBtn-${idx}`);
  if (btn) { btn.disabled = true; btn.innerHTML = '&#8942; MATCHING…'; }
  try {
    const { ENT_CARDS } = await import('./shared/ent-library-content.js');
    const keys = ENT_CARDS.map(c => c.key);
    // The 'claude' endpoint is locked to JSON-object output, so ask for JSON.
    const system = 'You map a personal goal to the entrepreneur skills it most depends on. Given the GOAL and the SKILLS list, respond with ONLY a JSON object of the form {"skills":["SKILL","SKILL",...]} listing the 3 to 5 most relevant skill names, each copied EXACTLY as written in the SKILLS list.';
    const user = `GOAL: ${intn.title}\n\nSKILLS: ${keys.join(', ')}`;
    const text = await callClaude(system, user, 200);
    let arr = [];
    try { const obj = JSON.parse(text); arr = Array.isArray(obj?.skills) ? obj.skills : (Array.isArray(obj) ? obj : []); } catch (e) {}
    const found = [];
    arr.map(x => String(x).trim().toUpperCase()).forEach(x => {
      if (!x) return;
      const m = keys.find(k => k === x) || keys.find(k => x.includes(k) || k.includes(x));
      if (m && !found.includes(m)) found.push(m);
    });
    const skills = found.slice(0, 5);
    if (skills.length) { _saveGoalSkills(intn.id, skills); if (typeof toast === 'function') toast(`✦ Matched ${skills.length} skills`, 'success'); }
    else if (typeof toast === 'function') toast('Could not match skills — try again.', 'error');
  } catch (e) { if (typeof toast === 'function') toast('Skill match failed. Try again.', 'error'); }
  openVizGoal(idx);
}

export function openVizGoal(idx) {
  _vizGoalIdx = idx;
  const it = intentions[idx] ? (intentions[idx] = hydrateIntent(intentions[idx])) : intentions[0];
  const s = GREY_SHADES[idx % GREY_SHADES.length];
  // Title now lives inside the card (matches the workspace layout) — clear the
  // standalone pill slot so it isn't shown twice.
  const pill = document.getElementById('vizGoalPill');
  if (pill) pill.innerHTML = '';
  const opts = document.getElementById('vizGoalOptions');
  if (opts) {
    const acts = [['3min','&#9673;','3 MIN']];
    // The rest of the goals — tap one to jump straight to its card.
    const others = intentions
      .map((g, i) => ({ g, i }))
      .filter(o => o.i !== idx)
      .map(({ g, i }) => {
        const cs = GREY_SHADES[i % GREY_SHADES.length];
        return `<button onclick="openVizGoal(${i})" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:none;cursor:pointer;background:${cs.bg};color:${cs.text};border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,.12);">
          ${goalBadge(goalLetter(g, i), _goalColor(i).bg, _goalColor(i).text, 34)}
          <span style="flex:1;min-width:0;font-weight:700;font-size:14px;line-height:1.2;">${esc(g.title || '')}</span>
          <span style="flex-shrink:0;font-size:20px;opacity:.9;">›</span>
        </button>`;
      }).join('');
    const othersHtml = others
      ? `<div style="margin-top:22px;"><div style="font-size:11px;font-weight:800;letter-spacing:1px;color:var(--muted);text-transform:uppercase;margin:0 2px 12px;">More goals</div>${others}</div>`
      : '';
    opts.innerHTML = `
      <div class="goal-visualization-container" id="goalVisualizationContainer" style="position:relative;margin:0 0 12px;width:100%;border-radius:8px;overflow:hidden;border:1px solid var(--border);background:var(--sunken);">
        <img id="goalVisualizationImage" src="" alt="Visualization" style="width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;display:none;" />
        <div id="goalDissolve" style="position:absolute;inset:0;display:none;"></div>
        <div id="goalVisualizationLoader" style="padding:30px;text-align:center;color:var(--muted);font-size:13px;"><span class="inline-spinner"></span> Loading visualization…</div>
        <button onclick="fetchGoalDissolve(${idx})" title="Slow dissolve of 5 images" style="position:absolute;top:8px;right:48px;z-index:2;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.55);color:#fff;border:none;cursor:pointer;font-size:12px;font-weight:800;line-height:1;display:flex;align-items:center;justify-content:center;">5&#10022;</button>
        <button onclick="rerollGoalVisualization(${idx})" title="Get a different image for this goal" style="position:absolute;top:8px;right:8px;z-index:2;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.55);color:#fff;border:none;cursor:pointer;font-size:15px;line-height:1;display:flex;align-items:center;justify-content:center;">&#8635;</button>
      </div>
      <div style="background:${s.bg};color:${s.text};padding:20px;border-radius:8px;font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;line-height:1.3;margin-bottom:12px;">${esc(it?.title || '')}</div>
      ${_goalDatesHTML(it)}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${acts.map(([k,ic,lbl]) =>
          `<button onclick="playGoalInWorkspace(${idx},'${k}',event)" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:14px 6px;min-width:0;background:var(--ink);border:1px solid var(--border);color:var(--on-ink);border-radius:4px;font-size:12px;font-weight:700;letter-spacing:0.3px;cursor:pointer;"><span style="font-size:14px;line-height:1;color:var(--brand);flex-shrink:0;">${ic}</span>${lbl}</button>`
        ).join('')}
        <button onclick="navTo('vizlibrary')" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:14px 6px;min-width:0;background:var(--ink);border:1px solid var(--border);color:var(--brand);border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.3px;cursor:pointer;text-align:center;line-height:1.2;"><span style="font-size:14px;line-height:1;color:var(--brand);">&#8592;</span>BACK TO MY GOALS</button>
        <button id="pbSharpenBtn-${idx}" onclick="pbSharpenSkills(${idx})" title="Match this goal to its top entrepreneur skills" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:14px 6px;min-width:0;background:#8FA977;border:none;color:#1c1c1c;border-radius:4px;font-size:11px;font-weight:800;letter-spacing:0.3px;cursor:pointer;text-align:center;line-height:1.2;">&#10022; ${_goalSkills(it?.id).length ? 'RE-MATCH SKILLS' : 'SHARPEN WITH SKILLS'}</button>
      </div>
      ${_goalSkills(it?.id).length ? `<div style="margin:12px 0 4px;"><div style="font-size:11px;font-weight:800;letter-spacing:1px;color:var(--muted);text-transform:uppercase;margin:0 2px 8px;">Skills this goal needs</div>${_skillsChips(_goalSkills(it?.id))}</div>` : ''}
      <!-- QUICK-VIZ — tap a length to PLAY a visualization of this goal.
           data-player-box makes openPlayerInColumn drop the (visible) player
           panel right below this grid on THIS page — without it the shared
           #playerColumn stays inside the hidden dashboard page and the viz
           plays where you can't see it. -->
      <div data-player-box style="display:flex;gap:10px;align-items:stretch;background:var(--teal-ui);border-radius:12px;padding:12px;margin:12px 0 4px;">
        <div style="flex:1;min-width:0;display:grid;grid-template-columns:repeat(3,1fr);gap:12px 10px;">
          ${[1,3,5,10,15,20,30,45,60].map(m =>
            `<button onclick="launchVisualization(${idx}, ${m}, event)" title="${m} minute visualization" style="width:52px;height:52px;justify-self:center;border-radius:50%;background:#fff;border:4px solid var(--brand);color:var(--ink);font-size:14px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;">${m}</button>`
          ).join('')}
        </div>
        <button onclick="openVizLibrary()" title="Back to my goals" style="flex-shrink:0;width:54px;background:var(--purple);border:none;border-radius:10px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;">&#9776;</button>
      </div>
      ${(() => {
        // Notes the user linked to THIS goal (from My Thoughts → Notes).
        let all = []; try { all = JSON.parse(localStorage.getItem('ci_notes') || '[]'); } catch (e) {}
        const mine = (Array.isArray(all) ? all : []).filter(n => n && n.cat === 'note' && n.goal === it.id && (n.text || '').trim());
        if (!mine.length) return '';
        return `<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);">
          <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:var(--muted);text-transform:uppercase;margin:0 2px 10px;">📝 Notes for this goal</div>
          ${mine.map(n => `<div style="background:var(--sunken,#1a1a1a);border:1px solid var(--border);border-radius:8px;padding:11px 13px;margin-bottom:8px;font-size:14px;line-height:1.5;color:var(--text);">${esc(n.text)}</div>`).join('')}
        </div>`;
      })()}
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);">
        <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:var(--muted);text-transform:uppercase;margin:0 2px 10px;">Go back</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button onclick="navTo('vizlibrary')" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 8px;min-width:0;background:var(--ink);border:1px solid var(--border);color:var(--on-ink);border-radius:8px;font-size:12px;font-weight:700;letter-spacing:0.3px;cursor:pointer;text-align:center;line-height:1.2;"><span style="font-size:15px;line-height:1;color:var(--brand);flex-shrink:0;">&#8592;</span>VISUALIZATION LIBRARY</button>
          <button onclick="navTo('dashboard')" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 8px;min-width:0;background:var(--ink);border:1px solid var(--border);color:var(--on-ink);border-radius:8px;font-size:12px;font-weight:700;letter-spacing:0.3px;cursor:pointer;text-align:center;line-height:1.2;"><span style="font-size:15px;line-height:1;color:var(--brand);flex-shrink:0;">&#8962;</span>MY GOALS</button>
        </div>
      </div>`;
  }
  loadGoalVisualization(it);
  navTo('vizgoal');
}

/* Launch a goal's chosen activity full-page (mobile flow). Sets the goal in
   localStorage so the standalone player picks it up. */
export function vizAct(idx, kind) {
  const it = intentions[idx] || intentions[0];
  const title = (it?.title || 'My Vision').replace(/^(i am)\s+/i, 'I AM ');
  localStorage.setItem('ci_goal_title', title);
  if (it?.imageUrl && !it.imageUrl.startsWith('data:')) localStorage.setItem('ci_goal_image', it.imageUrl); else localStorage.removeItem('ci_goal_image');
  const q = `g=${encodeURIComponent(title)}&_=${Date.now()}`;
  if (kind === 'viz')            window.location.href = `players/3min-viz.html?${q}`;
  else if (kind === 'review')    window.location.href = `players/recite.html?type=affirmations&${q}`;
  else if (kind === 'meditate')  window.location.href = `players/meditation.html?${q}`;
  else if (kind === 'gratitude') window.location.href = `players/gratitude-guided.html?${q}`;
}

/* PILLAR 2: full-screen ACTION PLAN (goals + roadmap tasks). #todayWillWidget
   now lives on page-myroadmap; renderWrapup fills it wherever it is. */
export function openMyRoadmap() {
  if (typeof window !== 'undefined' && typeof window.renderWrapup === 'function') window.renderWrapup();
  navTo('myroadmap');
}

/* ── SHAREABLE ROADMAPS (read-only, link-only, nothing stored server-side) ─────
   The roadmap is encoded into the link itself (base64url). Anyone with the link can
   view the steps read-only; no comments, no PII, no database. See docs/SPEC_shareable_roadmaps.md */
function _b64urlEncode(obj) {
  const b = btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function _b64urlDecode(str) {
  try {
    const b = String(str).replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b))));
  } catch (e) { return null; }
}
/* Build + copy a read-only share link for a goal's roadmap. */
export function shareRoadmap(idx) {
  const list = intentions || [];
  const i = (typeof idx === 'number' && list[idx]) ? idx : (selectedVaultIdx != null && list[selectedVaultIdx] ? selectedVaultIdx : 0);
  const intn = list[i];
  if (!intn) { if (typeof toast === 'function') toast('Add a goal first.', 'error'); return; }
  const steps = (Array.isArray(intn.achievers?.roadmap) && intn.achievers.roadmap.length)
    ? intn.achievers.roadmap
    : ((intn.roadmapAI?.tasks || []).map(t => (t && (t.text || t.title)) || t).filter(Boolean));
  if (!steps.length) { if (typeof toast === 'function') toast("Generate this goal's roadmap first, then share it.", 'info'); return; }
  const title = (intn.title || 'My Roadmap').replace(/^(i am)\s+/i, 'I AM ');
  const payload = { v: 1, t: title, c: intn.category || '', h: 'Anonymous',
    s: steps.slice(0, 20).map(x => String(x).slice(0, 240)) };
  const link = location.origin + '/?r=' + _b64urlEncode(payload);
  try {
    navigator.clipboard.writeText(link);
    if (typeof toast === 'function') toast('Read-only link copied — anyone with it can view these steps (no personal info shared).', 'success');
  } catch (e) { if (typeof toast === 'function') toast('Share link: ' + link, 'info'); }
  return link;
}
/* Render a standalone, auth-free, read-only page for a shared roadmap link. */
function renderSharedRoadmap(encoded) {
  const d = _b64urlDecode(encoded);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const box = document.createElement('div');
  box.id = 'sharedRoadmapView';
  if (!d || !Array.isArray(d.s) || !d.s.length) {
    box.innerHTML = `<div style="max-width:640px;margin:70px auto;padding:0 22px;font-family:'Poppins',system-ui,sans-serif;text-align:center;color:#26364b;">
      <h1 style="font-size:22px;">This roadmap link is no longer valid.</h1>
      <p style="margin-top:14px;"><a href="/" style="color:#2b6cb0;font-weight:700;">Go to Cosmic Intentions →</a></p></div>`;
  } else {
    const steps = d.s.map(s => `<li style="margin:0 0 12px;line-height:1.5;">${esc(s)}</li>`).join('');
    box.innerHTML = `
      <div style="min-height:100vh;background:#eef1f4;font-family:'Poppins',system-ui,sans-serif;padding:40px 18px;box-sizing:border-box;">
        <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(20,40,80,.12);overflow:hidden;">
          <div style="background:#7888A8;color:#fff;padding:22px 26px;">
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.85;">Shared Roadmap &middot; ${esc(d.h || 'Anonymous')}</div>
            <div style="font-size:22px;font-weight:800;margin-top:6px;">${esc(d.t || 'My Roadmap')}</div>
          </div>
          <div style="padding:26px 30px;color:#1c2126;">
            <ol style="margin:0;padding-left:22px;font-size:16px;">${steps}</ol>
          </div>
          <div style="padding:20px 30px 30px;border-top:1px solid #e9edf2;text-align:center;">
            <div style="font-size:13px;color:#6b747d;margin-bottom:12px;">Build your own roadmap for any goal, one clear step at a time.</div>
            <a href="/" style="display:inline-block;background:#e0102b;color:#fff;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:.5px;padding:12px 22px;border-radius:10px;">Try Cosmic Intentions</a>
          </div>
        </div>
      </div>`;
  }
  document.body.innerHTML = '';
  document.body.appendChild(box);
  document.title = (d && d.t) ? d.t + ' · Cosmic Intentions' : 'Shared Roadmap · Cosmic Intentions';
}

/* ── ASS (Audio Slide Show) players: Affirmations / Beliefs / Stoic ───────────
   Each reads the SELECTED-by-idx goal's own mindset list (already AI-generated &
   saved to Supabase), drops it in localStorage, and opens the shared ASS player. */
function launchAss(idx, type, ev) {
  if (!intentions.length) { toast('Add an intention first.', 'error'); return; }
  const intn   = intentions[idx] || intentions[0];
  const slides = (intn?.mindset?.[type] || []).filter(Boolean);
  if (!slides.length) { toast(`No ${type} yet — generate this goal's mindset first.`, 'error'); return; }
  localStorage.setItem('ci_goal_title', (intn?.title || 'My Vision').replace(/^(i am)\s+/i, 'I AM '));
  localStorage.setItem('ci_ass_slides', JSON.stringify(slides));
  const src = `players/ass-template.html?type=${type}&_=${Date.now()}`;
  if (typeof window.openPlayerInColumn === 'function') window.openPlayerInColumn(src, ev);
  else window.open(src, 'ci_player', 'width=1100,height=720');
}
export function launchAffirmations(idx, ev) { launchAss(idx, 'affirmations', ev); }

/* Creative Visualization player (players/creative-viz.html) — a guided
   "manifestation" that weaves the goal's own generated content (a quote,
   gratitude items, affirmations) into the reverse-engineered card + countdown
   structure. Builds ci_creative_scene from the selected goal, then opens it. */
export function launchCreativeViz(ev) {
  const idx  = (selectedVaultIdx !== null && intentions[selectedVaultIdx]) ? selectedVaultIdx : 0;
  const intn = intentions[idx] || intentions[0] || {};
  const title = (intn.title || 'My Vision').replace(/^(i am)\s+/i, 'I AM ');
  const m = intn.mindset || {};
  const affs   = (m.affirmations || []).slice(0, 6);
  const quote  = (m.quotes || [])[0];
  let grat = [];
  try { grat = JSON.parse(localStorage.getItem('ci_goal_gratitude') || '[]'); } catch (e) {}

  const events = []; let t = 0;
  const add = (type, dur, text) => { events.push({ type, start: t, dur, ...(text != null ? { text } : {}) }); t += dur; };
  add('card', 6,  'Welcome to your creative visualization.');
  add('card', 10, 'Awesome effort today. Be mindful of all the positive outcomes you are expecting for yourself.');
  if (quote) add('card', 11, quote);
  if (grat.length) { add('card', 4, 'Gratitude.'); grat.slice(0, 6).forEach(g => add('card', 6, /^i am grateful/i.test(g) ? g : ('I am grateful for ' + g))); }
  add('card', 9,  'As we get ready to visualize, take sixty seconds to relax your body and mind with a few deep breaths.');
  add('hold', 60);
  add('card', 6,  'Get ready to invoke your emotions.');
  add('card', 8,  title);
  add('card', 8,  'Picture it as already real. See it, feel it, hear it.');
  add('card', 4,  'Close your eyes and visualize.');
  add('hold', 120);
  if (affs.length) { add('card', 4, 'Today I will...'); affs.forEach(a => add('card', 6, a)); }
  add('card', 9,  'Awesome effort on your creative visualization. Carry this feeling with you.');
  add('bell', 0);

  localStorage.setItem('ci_goal_title', title);
  localStorage.setItem('ci_creative_scene', JSON.stringify({ events }));
  if (typeof window.openPlayerInColumn === 'function') window.openPlayerInColumn('players/creative-viz.html', ev);
  else window.open('players/creative-viz.html', 'ci_player', 'width=1100,height=720');
}

/* ── RECITE players ───────────────────────────────────────────
   One reusable looping player (players/recite.html) per content type. The
   parent collects the lines, writes them to ci_recite, then opens the player.
   Adding a new library = one entry in RECITE_TYPES. */
function _reciteBlendGoals(key) {            // blend a mindset list across all goals
  const out = [];
  (intentions || []).forEach(it => {
    const arr = it?.mindset?.[key];
    if (Array.isArray(arr)) arr.forEach(t => {
      const text = (typeof t === 'string') ? t : (t.title || t.body || '');
      if (text) out.push({ text, tag: it.title || key });
    });
  });
  return out;
}
function _recitePegLines(field, tag) {       // split a pegboard field into lines
  const raw = (getPB() || {})[field] || '';
  return String(raw).split('\n').map(s => s.trim()).filter(Boolean).map(text => ({ text, tag }));
}
/* Universal libraries (Stoic, Quotes) live in the global content_blocks table
   (slug lib_<type>), loaded into _libCache on init. Shown as a rotating daily
   window so the whole library cycles over ~2 weeks. */
let _libCache = {};
/* Built-in defaults so a library is never empty on first use. Saving your own
   via the Library Manager overrides the seed. */
const SEED_LIBRARIES = {
  stoic: [
    'You have power over your mind — not outside events. Realize this, and you will find strength.',
    'We suffer more often in imagination than in reality.',
    'It is not what happens to you, but how you react to it, that matters.',
    'The happiness of your life depends upon the quality of your thoughts.',
    'The obstacle is the way — what stands in the way becomes the way.',
    'Waste no more time arguing what a good person should be. Be one.',
    'He who fears death will never do anything worthy of a living person.',
    'You are disturbed not by things, but by the view you take of them.',
    'First say to yourself what you would be; then do what you must do.',
    'If it is not right, do not do it; if it is not true, do not say it.',
  ],
};
function _getLibrary(type) {
  const slug = 'lib_' + type;
  let body = _libCache[slug];
  if (body == null) { try { body = localStorage.getItem('ci_' + slug) || ''; } catch (e) { body = ''; } }
  const lines = String(body || '').split('\n').map(s => s.trim()).filter(Boolean);
  if (!lines.length && SEED_LIBRARIES[type]) return SEED_LIBRARIES[type].slice();
  return lines;
}
function _rotatingWindow(items, days = 14) {
  const n = items.length;
  if (n <= days) return items;          // small library → just loop the whole set
  const size   = Math.ceil(n / days);
  const dayIdx = Math.floor(Date.now() / 86400000) % days;
  const start  = (dayIdx * size) % n;
  const win = [];
  for (let i = 0; i < size; i++) win.push(items[(start + i) % n]);
  return win;
}

const RECITE_TYPES = {
  affirmations: { label: 'Affirmations', collect: () => _reciteBlendGoals('affirmations') },
  beliefs:      { label: 'Beliefs',      collect: () => _reciteBlendGoals('beliefs') },
  values:       { label: 'Values',       collect: () => _recitePegLines('pb-values', 'Value') },
  pegboard:     { label: 'My Pegboard',  collect: () => [
                    ..._recitePegLines('pb-mission', 'Mission'),
                    ..._recitePegLines('pb-lifegol', 'Life Goal'),
                    ..._recitePegLines('pb-identity-anchor', 'Identity'),
                    ..._recitePegLines('pb-values', 'Value'),
                  ] },
  stoic:        { label: 'Stoic',  collect: () => _rotatingWindow(_getLibrary('stoic')).map(text => ({ text, tag: 'Stoic' })) },
  quotes:       { label: 'Quotes', collect: () => _reciteBlendGoals('quotes') },   // AI-generated per goal, blended
};
export function launchRecite(type, ev) {
  const def = RECITE_TYPES[type];
  if (!def) { toast('Unknown library: ' + type, 'error'); return; }
  const items = (def.collect() || []).filter(i => i.text);
  if (!items.length) { toast(`No ${def.label.toLowerCase()} yet — generate your AI Library on a goal first.`, 'error'); return; }
  localStorage.setItem('ci_recite', JSON.stringify({ type, label: def.label, items }));
  if (typeof window.openPlayerInColumn === 'function') window.openPlayerInColumn(`players/recite.html?type=${type}`, ev);
  else window.open(`players/recite.html?type=${type}`, 'ci_player', 'width=1100,height=720');
}

/* ── LIBRARY MANAGER — paste/edit the Stoic & Quotes libraries (content_blocks) ── */
export function openLibraryManager() {
  ['stoic'].forEach(t => {        // Quotes are AI-generated per goal, not hand-managed
    const ta = document.getElementById('libmgr-' + t);
    if (ta) ta.value = _getLibrary(t).join('\n');
  });
  const m = document.getElementById('libraryManager');
  if (m) m.style.display = 'flex';
}
export function closeLibraryManager() {
  const m = document.getElementById('libraryManager');
  if (m) m.style.display = 'none';
}
export async function saveLibrary(type) {
  const ta = document.getElementById('libmgr-' + type);
  const st = document.getElementById('libmgr-status-' + type);
  if (!ta) return;
  const slug = 'lib_' + type;
  const body = ta.value.split('\n').map(s => s.trim()).filter(Boolean).join('\n');
  _libCache[slug] = body;
  try { localStorage.setItem('ci_' + slug, body); } catch (e) {}
  const count = body.split('\n').filter(Boolean).length;
  if (st) st.textContent = 'Saving…';
  try {
    const { error } = await sb.from('content_blocks')
      .upsert({ slug, body, updated_at: new Date().toISOString() }, { onConflict: 'slug' });
    if (st) st.textContent = error ? ('✗ ' + error.message) : `✓ Saved ${count} lines`;
  } catch (e) { if (st) st.textContent = '✗ ' + e.message; }
  if (st) setTimeout(() => { st.textContent = ''; }, 3500);
}

export async function launch3Min(idx) {
  if (!intentions.length) { toast('Add an intention first.', 'error'); return; }

  mSt.idx     = idx;
  mSt.slide   = 0;
  mSt.running = true;
  mSt.aiIam   = '';
  mSt.aiGratitude = '';
  
  const intn   = intentions[idx] || intentions[0];
  const pills  = intn?.mindset?.affirmations || [];
  mSt.affirm   = pills[0] || 'I AM unstoppable and fully committed.';
  
  document.getElementById('manifestTitle').textContent =
    (intn?.title || 'My Intention').replace(/^(i am)\s+/i, 'I AM ');
  
  const title = (intn?.title || 'My Intention').replace(/^(i am)\s+/i, 'I AM ');

  document.getElementById('manifestModal').classList.add('open');
  playBell();
  setTimeout(() => speakCached(title, idx), 1200);
  fetchManifestAI(idx);
  showManifestSlide(0);
}

async function fetchManifestAI(idx) {
  const intn    = intentions[idx] || intentions[0];
  const title   = intn?.title || 'my intention';
  const pb      = getPB();
  const context = buildContext(pb);
  
  if (DEV_MODE) {
    await new Promise(r => setTimeout(r, 900));
    mSt.aiIam       = 'I AM exactly where I need to be, and exactly who I was meant to become.';
    mSt.aiGratitude = 'I am grateful for the courage it took to start, and the discipline it takes to continue.';
    return;
  }
  try {
    const system = `You are a personal development AI. User profile:\n${context}\n\nRespond ONLY with valid JSON — no other text:\n{"iam":"...","gratitude":"..."}`;
    const user   = `For the intention "${title}", write:\n1. One powerful personal I AM statement (max 20 words)\n2. One genuine gratitude phrase starting with "I am grateful" (max 20 words)`;
    const raw    = await callClaude(system, user, 300);
    const r      = JSON.parse(raw.replace(/```json|```/g,'').trim());
    mSt.aiIam       = r.iam       || title;
    mSt.aiGratitude = r.gratitude || 'I am grateful for this moment and this journey.';
  } catch {
    mSt.aiIam       = title;
    mSt.aiGratitude = 'I am grateful for this moment and this journey.';
  }
}

function showManifestSlide(n) {
  if (!mSt.running) return;
  if (n >= MANIFEST_SLIDES.length) { closeManifest(); return; }
  clearTimeout(mSt.timer);
  mSt.slide = n;
  
  const s   = MANIFEST_SLIDES[n];
  const pct = ((n + 1) / MANIFEST_SLIDES.length * 100).toFixed(1);
  
  document.getElementById('manifestProgress').style.width  = pct + '%';
  document.getElementById('manifestSlideNum').textContent  = n + 1;
  
  let h = s.h, b = s.b, type = s.type;
  const intn = intentions[mSt.idx] || intentions[0];
  
  if (type === 'intro') {
    h    = intn?.title || 'My Intention';
    b    = '3-Minute Manifest Session';
    type = 'intro';
  }
  if (type === 'iam')       { h = mSt.aiIam       || 'I AM…'; b = ''; }
  if (type === 'gratitude') { h = mSt.aiGratitude || 'I am grateful…'; b = ''; }
  if (type === 'affirm')    { h = mSt.affirm;      b = ''; }
  
  const slideEl   = document.getElementById('manifestSlide');
  const headingEl = document.getElementById('manifestHeading');
  const bodyEl    = document.getElementById('manifestBody');
  
  // Re-trigger animation
  slideEl.style.animation = 'none';
  slideEl.offsetHeight;
  slideEl.style.animation = '';
  
  headingEl.className = 'manifest-heading';
  if (type === 'iam')       headingEl.className = 'manifest-heading iam-style';
  if (type === 'gratitude') headingEl.className = 'manifest-heading gratitude-style';
  
  headingEl.textContent = h || '';
  
  if (type === 'breathe' && n === 1) {
    bodyEl.innerHTML = '<div class="manifest-circle breathe-in"></div>';
  } else if (type === 'breathe' && n === 2) {
    bodyEl.innerHTML = '<div class="manifest-circle breathe-out"></div>';
  } else if (type === 'close') {
    bodyEl.innerHTML = '<button class="manifest-close-btn" onclick="closeManifest()">Complete Session ✦</button>';
  } else {
    bodyEl.textContent = b || '';
  }
  
  if (type !== 'close' && type !== 'intro') {
    speakText((h||'') + (b ? '. ' + b : ''));
  }
  
  if ([5, 9, 14].includes(n)) playBell();
  if (s.d > 0) mSt.timer = setTimeout(() => showManifestSlide(n + 1), s.d);
}

function manifestNext() {
  clearTimeout(mSt.timer); stopSpeech();
  showManifestSlide(Math.min(mSt.slide + 1, MANIFEST_SLIDES.length - 1));
}
function manifestPrev() {
  clearTimeout(mSt.timer); stopSpeech();
  showManifestSlide(Math.max(mSt.slide - 1, 0));
}
export function closeManifest() {
  mSt.running = false;
  clearTimeout(mSt.timer);
  stopSpeech();
  document.getElementById('manifestModal').classList.remove('open');
  playBell(396);
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
export function esc(str) {
  return String(str||'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

/* ─────────────────────────────────────────────────────────
   SETUP & BTS — PEGBOARD FIELDS
───────────────────────────────────────────────────────── */
const PB_FIELDS_DEF = [
  'pb-name','pb-mission','pb-lifegol','pb-values','pb-beliefs',
  'pb-attitudes','pb-stoicism','pb-traits',
  'bts-tone','bts-authors','bts-obstacles','bts-why','bts-context',
  'openai_voice'
];

/* ─────────────────────────────────────────────────────────
   VAULT DASHBOARD 3 — THE CROWN JEWEL
───────────────────────────────────────────────────────── */
export let selectedVaultIdx    = null;
let vaultActiveCategory = 'all';
let inlineGoalPlayer = null;   // { idx, src } — the per-goal player rendered inline under its goal box

/* Mindset categories shown in the ASS player. Each maps a stored mindset key to
   an on-screen slide label. Order here = play order in the unified player. */
const MINDSET_KINDS = [
  { key: 'affirmations', label: 'AFFIRMATION'     },
  { key: 'beliefs',      label: 'BELIEF'          },
  { key: 'stoic',        label: 'STOIC PRINCIPLE' },
  { key: 'attitudes',    label: 'WINNING ATTITUDE' },
];

/* Turn one mindset array into player slides {text, tag}. Attitudes are stored as
   {title, body} objects; everything else is a plain string. */
function mindsetSlides(mindset, kind, label) {
  return (mindset?.[kind] || []).filter(Boolean).map(item => {
    let text;
    if (item && typeof item === 'object') text = item.title ? `${item.title}. ${item.body || ''}`.trim() : (item.body || item.text || '');
    else text = String(item);
    return { text, tag: label };
  }).filter(s => s.text);
}

/* A goal's FULL mindset as player slides (all categories, in order). */
function goalMindsetSlides(idx) {
  return MINDSET_KINDS.flatMap(k => mindsetSlides(intentions[idx]?.mindset, k.key, k.label));
}
/* Bridge so the favorites loop (player-launcher.js) can fetch a goal's mindset
   slides without importing app internals. */
if (typeof window !== 'undefined') window.__ciGoalSlides = goalMindsetSlides;

/* Resolve a MINDSET favorite to the RIGHT goal's slides. Favorites saved the
   goal by array INDEX, which drifts when goals are added/removed/reordered — so
   a Tesla favorite could end up playing another goal's affirmations. Match by
   the stable goal id first, then the saved title, and only fall back to the
   stored index. */
function _normTitle(t) { return String(t || '').replace(/^\s*i am\s+/i, '').trim().toLowerCase(); }
if (typeof window !== 'undefined') window.__ciGoalSlidesForFav = function (fav) {
  if (!fav) return [];
  let idx = -1;
  if (fav.goalId != null) idx = intentions.findIndex(g => g && g.id === fav.goalId);
  if (idx < 0) { const key = _normTitle(fav.title); if (key) idx = intentions.findIndex(g => g && _normTitle(g.title) === key); }
  if (idx < 0 && Number.isInteger(fav.goal) && intentions[fav.goal]) idx = fav.goal;
  if (idx < 0) return [];
  return goalMindsetSlides(idx) || [];
};

/* ♥ on a goal box — toggle the goal in the FAVORITES loop (plays its full
   mindset). Stored in ci_favorites as { player:'mindset', goal:idx, title }. */
export function toggleGoalFavorite(idx, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const intn = intentions[idx]; if (!intn) return;
  const title = (intn.title || 'My Vision').replace(/^(i am)\s+/i, 'I AM ');
  let favs; try { favs = JSON.parse(localStorage.getItem('ci_favorites') || '[]'); } catch (e) { favs = []; }
  if (!Array.isArray(favs)) favs = [];
  const at = favs.findIndex(f => f && f.player === 'mindset' && ((intn.id != null && f.goalId === intn.id) || f.goal === idx));
  if (at >= 0) { favs.splice(at, 1); toast('Removed from favorites', 'success'); }
  else { favs.push({ type: 'mindset', player: 'mindset', goal: idx, goalId: intn.id, title }); toast('Added to favorites loop ♥', 'success'); }
  localStorage.setItem('ci_favorites', JSON.stringify(favs));
  renderVaultSidebar();
  const box = document.getElementById('favorites-list');
  if (box && !box.classList.contains('hidden') && typeof window.renderFavorites === 'function') window.renderFavorites();
}

/* ☆ Favorite the CURRENT page → a jump-to shortcut in the Favorites panel
   (type:'page', routed back via navTo). Toggles: fire again to remove. Only the
   real app pages are favoritable (not home/landing/admin). */
const _FAV_PAGE_TITLES = { dashboard: 'Dashboard', setup: 'My Goals', habits: 'My Habits', wins: 'My Wins', vizlibrary: 'Visualization Library', myroadmap: 'Roadmap', runthroughs: 'Daily Habits' };
export function favThisPage() {
  const id = _navHistory[_navIndex];
  if (!id || !_FAV_PAGE_TITLES[id]) { toast('This page can’t be favorited.', 'info'); return; }
  let favs; try { favs = JSON.parse(localStorage.getItem('ci_favorites') || '[]'); } catch (e) { favs = []; }
  if (!Array.isArray(favs)) favs = [];
  const at = favs.findIndex(f => f && f.type === 'page' && f.target === id);
  if (at >= 0) { favs.splice(at, 1); toast('Removed from favorites', 'success'); }
  else { favs.push({ type: 'page', target: id, title: _FAV_PAGE_TITLES[id] }); toast(`Added “${_FAV_PAGE_TITLES[id]}” to favorites ♥`, 'success'); }
  localStorage.setItem('ci_favorites', JSON.stringify(favs));
  const box = document.getElementById('favorites-list');
  if (box && !box.classList.contains('hidden') && typeof window.renderFavorites === 'function') window.renderFavorites();
}

/* Open a player INLINE under its goal box (Column A), surviving list re-renders.
   kind: '3min' (visualization), 'mindset' (unified — all categories), or a single
   mindset key like 'affirmations' / 'beliefs' / 'stoic' / 'attitudes' (ASS player). */
export function playGoalInline(idx, kind, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  if (!intentions.length) { toast('Add an intention first.', 'error'); return; }
  const intn  = intentions[idx] || intentions[0];
  const title = (intn?.title || 'My Vision').replace(/^(i am)\s+/i, 'I AM ');
  localStorage.setItem('ci_goal_title', title);
  let src;
  if (kind === '3min') {
    src = `players/3min-viz.html?g=${encodeURIComponent(title)}&_=${Date.now()}`;
  } else {
    let slides;
    if (kind === 'mindset') {                         // unified — all categories, grouped in order
      slides = MINDSET_KINDS.flatMap(k => mindsetSlides(intn?.mindset, k.key, k.label));
    } else {                                          // single category
      const meta = MINDSET_KINDS.find(k => k.key === kind);
      slides = mindsetSlides(intn?.mindset, kind, meta ? meta.label : '');
    }
    if (!slides.length) { toast(`Nothing here yet — generate this goal's AI Library first.`, 'error'); return; }
    localStorage.setItem('ci_ass_slides', JSON.stringify(slides));
    src = `players/ass-template.html?type=${kind}&g=${encodeURIComponent(title)}&_=${Date.now()}`;
  }
  inlineGoalPlayer = { idx, src };
  renderVaultSidebar();
  setTimeout(() => { const el = document.getElementById('goalPlayer-' + idx); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60);
}
export function closeGoalPlayer() { inlineGoalPlayer = null; renderVaultSidebar(); }

/* The visualization slot (id goalVisualizationContainer / Image / Loader) can
   exist on TWO pages at once — the dashboard workspace AND the Visualization
   Library goal card. getElementById would grab whichever is first in the DOM
   (often the hidden one). This returns the copy that's actually visible
   (a descendant of a display:none .page has offsetParent === null). */
function activeEl(id) {
  const list = document.querySelectorAll('#' + id);
  for (const el of list) { if (el.offsetParent !== null) return el; }
  return list[0] || null;
}

/* Play a goal's player inside the OPEN workspace (build sheet), in the 16:9
   visualization slot — used by the 3 MIN / AFF / BELIEFS / STOIC / ATTITUDES
   buttons now living under the goal title in the workspace header. */
export async function playGoalInWorkspace(idx, kind, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const intn = intentions[idx]; if (!intn) return;
  const title = (intn.title || 'My Vision').replace(/^(i am)\s+/i, 'I AM ');
  localStorage.setItem('ci_goal_title', title);

  const play = (src) => {
    const c = activeEl('goalVisualizationContainer');
    if (c) c.innerHTML = `<iframe src="${src}" title="Player" allow="autoplay; fullscreen" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0;display:block;background:transparent;"></iframe>`;
  };

  if (kind === '3min') { play(`players/3min-viz.html?g=${encodeURIComponent(title)}&_=${Date.now()}`); return; }

  const meta = MINDSET_KINDS.find(k => k.key === kind);
  let slides = mindsetSlides(intn.mindset, kind, meta ? meta.label : '');

  // empty → this goal's AI Library is missing (or predates this category): generate it, then play
  if (!slides.length) {
    if (intn.aiEnabled === false) { toast('AI is off for this goal — turn it on in My Pegboard.', 'error'); return; }
    const c = activeEl('goalVisualizationContainer');
    if (c) c.innerHTML = '<div style="padding:30px;text-align:center;color:#9b8fd0;font-size:13px;"><span class="inline-spinner"></span> Generating this goal’s AI Library…</div>';
    try { await generateMindset(idx); } catch (e) {}
    slides = mindsetSlides(intentions[idx]?.mindset, kind, meta ? meta.label : '');
    if (!slides.length) { toast(`Couldn’t generate ${meta ? meta.label.toLowerCase() : kind}. Try again.`, 'error'); loadGoalVisualization(intentions[idx]); return; }
  }

  localStorage.setItem('ci_ass_slides', JSON.stringify(slides));
  play(`players/ass-template.html?type=${kind}&g=${encodeURIComponent(title)}&_=${Date.now()}`);
}

/* STANDALONE unified Mindset player (bottom of Column B). Plays the SELECTED
   goal's full mindset — all categories grouped & labeled — in the shared column
   panel. Defaults to the first goal when nothing is selected. */
export async function launchMindset(ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  if (!intentions.length) { toast('Add an intention first.', 'error'); return; }
  const idx   = (selectedVaultIdx != null && intentions[selectedVaultIdx]) ? selectedVaultIdx : 0;
  const intn  = intentions[idx];
  const title = (intn?.title || 'My Vision').replace(/^(i am)\s+/i, 'I AM ');
  let slides = MINDSET_KINDS.flatMap(k => mindsetSlides(intn?.mindset, k.key, k.label));
  if (!slides.length) {                              // no AI Library yet → generate it, then play
    if (intn && intn.aiEnabled === false) { toast('AI is off for this goal — turn it on in My Pegboard.', 'error'); return; }
    toast(`Generating "${title}"'s AI Library…`);
    try { await generateMindset(idx); } catch (e) {}
    slides = MINDSET_KINDS.flatMap(k => mindsetSlides(intentions[idx]?.mindset, k.key, k.label));
    if (!slides.length) { toast(`Couldn’t generate the AI Library. Try again.`, 'error'); return; }
  }
  localStorage.setItem('ci_goal_title', title);
  localStorage.setItem('ci_ass_slides', JSON.stringify(slides));
  window.openPlayerInColumn(`players/ass-template.html?type=mindset&g=${encodeURIComponent(title)}&_=${Date.now()}`, ev);
}

const VAULT_CATEGORIES = [
  { key: 'all',          label: 'All'          },
  { key: 'wealth',       label: 'Wealth'       },
  { key: 'health',       label: 'Health'       },
  { key: 'relationship', label: 'Relate'       },
  { key: 'purpose',      label: 'Purpose'      },
  { key: 'mindset',      label: 'Mindset'      },
  { key: 'creative',     label: 'Create'       },
  { key: 'growth',       label: 'Growth'       },
];

function detectCategory(title) {
  const t = (title || '').toLowerCase();
  if (/wealth|money|financ|rich|income|earn|business|entrepren|sales|revenue|profit|invest/.test(t))
    return 'wealth';
  if (/health|fit|body|gym|weight|run|strong|energy|sleep|diet|nutrition|wellnes/.test(t))
    return 'health';
  if (/love|relation|partner|family|friend|connect|social|marriage|dating|husband|wife/.test(t))
    return 'relationship';
  if (/purpose|mission|impact|contribut|legacy|meaning|call|spiritual|god|faith/.test(t))
    return 'purpose';
  if (/mind|mental|mindset|think|belief|confiden|peace|clarity|calm|aware/.test(t))
    return 'mindset';
  if (/creat|art|writ|music|design|build|create|invent|draw|film|story/.test(t))
    return 'creative';
  return 'growth';
}

function getTodayKey() {
  return dayKey();
}
export function renderVaultSidebar() {
  const pb   = getPB();
  const name = pb['pb-name'] || 'Friend';

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  // vaultWelcomeName replaced by todayPanel
  setEl('vaultIntentionCount',   intentions.length);
  const hnDot = document.getElementById('homeNavCount');
  if (hnDot) { hnDot.textContent = intentions.length; hnDot.style.display = intentions.length > 0 ? 'inline-block' : 'none'; }
  setEl('vsStreak',    LS.get('ci_streak')     || 0);
  setEl('vsVizPlays', LS.get('ci_viz_plays')  || 0);
  setEl('vsMedPlays', LS.get('ci_med_plays')  || 0);
  renderRings();
  renderWrapup();
  renderRunThroughs();
  renderHabits();
  renderWins();
  renderSleepLoop();
  if (typeof renderDailyHabitsInline === 'function') renderDailyHabitsInline();
  if (typeof renderActionPlanInline === 'function') renderActionPlanInline();

  // Date line: "Monday, May 26  ·  146/365"
  const _now      = new Date();
  const _days     = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const _months   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const _dayName  = _days[_now.getDay()];
  const _month    = _months[_now.getMonth()];
  const _date     = _now.getDate();
  const _year     = _now.getFullYear();
  const _isLeap   = (_year % 4 === 0 && _year % 100 !== 0) || _year % 400 === 0;
  const _daysInYear = _isLeap ? 366 : 365;
  const _start    = new Date(_year, 0, 0);
  const _diff     = _now - _start;
  const _dayOfYear = Math.floor(_diff / 86400000);
  const _remaining = _daysInYear - _dayOfYear;
  const _ord = (d) => { const s = ['th','st','nd','rd'], v = d % 100; return d + (s[(v - 20) % 10] || s[v] || s[0]); };
  setEl('vaultDateLine', `${_dayName} ${_month} ${_ord(_date)} — Day ${_dayOfYear} of ${_daysInYear} — ${_remaining} Remaining`);
  // Category filter strip
  const catsEl = document.getElementById('vaultCats');
  if (catsEl) {
    const counts = { all: intentions.length };
    intentions.forEach(i => {
      const k = detectCategory(i.title);
      counts[k] = (counts[k] || 0) + 1;
    });
    catsEl.innerHTML = VAULT_CATEGORIES
      .filter(c => c.key === 'all')
      .map(c => `<button class="vault-cat-btn${c.key === 'all' ? ' all-btn' : ''}${vaultActiveCategory === c.key ? ' active' : ''}"
        onclick="filterVaultCategory('${c.key}')">${c.label} <span class="vault-cat-count">${counts[c.key]||0}</span></button>`)
      .join('');
  }

  // Intention list
  const listEl = document.getElementById('vaultList');
  if (listEl) {
    const filtered   = intentions
      .map((i, idx) => ({ ...i, _idx: idx }))
      .filter(i => vaultActiveCategory === 'all' || detectCategory(i.title) === vaultActiveCategory);

    if (filtered.length === 0) {
      listEl.innerHTML = `<div style="padding:16px 14px;font-size:12px;color:var(--muted);line-height:1.6">${
        intentions.length === 0
          ? 'No intentions yet.<br>Tap <strong style="color:var(--muted)">+ Add Intention</strong> below.'
          : 'No intentions in this category.'
      }</div>`;
    } else {
      const playerNav = (idx) => `
        <div class="vault-item-nav">
          <button class="vin-row" onclick="window.location.href='players/roadmap.html?idx=${idx}'">
            <span class="vin-icon"><img src="images/icons/roadmap.png" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'" alt="" style="width:22px;height:22px;object-fit:contain;"><span style="display:none;font-size:18px;">🗺</span></span>
            <span class="vin-label">MY ROADMAP</span>
            <span class="vin-arrow">▶</span>
          </button>
        </div>`;

      let _favs; try { _favs = JSON.parse(localStorage.getItem('ci_favorites') || '[]'); } catch (e) { _favs = []; }
      // Favorites toggle icon — a HEART, matching the ♥ used on Notes and in the
      // players (so it's instantly recognizable). Not saved = hollow white outline;
      // saved = filled red (#e0102b). Same classic heart path in both states.
      const _HEART_PATH = `M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z`;
      const FAV_ADD_SVG    = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" style="display:block"><path d="${_HEART_PATH}"/></svg>`;
      const FAV_REMOVE_SVG = `<svg viewBox="0 0 24 24" width="17" height="17" fill="#fff" style="display:block"><path d="${_HEART_PATH}"/></svg>`;
      const VIZ_ICON  = `<svg viewBox="0 0 24 24" width="16" height="16" fill="#fff" style="display:block"><path d="M8 5v14l11-7z"/></svg>`;   // play = visualize
      const EDIT_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>`;   // pencil = edit
      listEl.innerHTML = filtered.map((i, listIdx) => {
        const shade    = GREY_SHADES[i._idx % GREY_SHADES.length];   // by goal index so the workspace title matches this card
        const circle   = darkenHex(shade.bg, 0.5);   // circles = a deeper shade of the card color, not black
        const _letr    = goalLetter(i, i._idx);
        const _lci     = (typeof _letr === 'string' && /^[A-Z]$/.test(_letr)) ? _letr.charCodeAt(0) - 65 : (Number.isFinite(i._idx) ? i._idx : listIdx);
        const gc       = GOAL_COLORS[((_lci % GOAL_COLORS.length) + GOAL_COLORS.length) % GOAL_COLORS.length] || { bg: circle, text: '#fff' };   // letter circle keyed by the goal LETTER (A=red, B=orange…) so it's always coloured + consistent
        const isSelected = selectedVaultIdx === i._idx;
        const isFav    = Array.isArray(_favs) && _favs.some(f => f && f.player === 'mindset' && f.goal === i._idx);
        // DVB image is no longer shown inline in the list — it opens in Column B on select.
        return `
        <div class="vault-row${isSelected ? ' selected' : ''}">
          <button class="vault-item${isSelected ? ' selected' : ''}"
            onmousedown="event.preventDefault()"
            onclick="selectVaultIntention(${i._idx})"
            style="background:${shade.bg};color:${shade.text}">
            ${goalBadge(goalLetter(i, i._idx), gc.bg, gc.text, 34)}
            <div class="vault-item-body">
              <div class="vault-item-title" style="color:${shade.text}">${esc(goalCase(i.title))}</div>
            </div>
          </button>
          <div class="vault-actions">
            <button class="vault-act${isFav ? ' is-fav' : ''}" onclick="toggleGoalFavorite(${i._idx}, event)" title="${isFav ? 'Remove from' : 'Add to'} favorites loop" aria-label="Favorite">${isFav ? FAV_REMOVE_SVG : FAV_ADD_SVG}</button>
            <button class="vault-act" onclick="launchCountdown(${i._idx}, 180)" title="Visualize this goal" aria-label="Visualize">${VIZ_ICON}</button>
            <button class="vault-act" onclick="navTo('setup')" title="Edit this goal" aria-label="Edit">${EDIT_ICON}</button>
          </div>
        </div>${(inlineGoalPlayer && inlineGoalPlayer.idx === i._idx) ? `
        <div class="goal-inline-player" id="goalPlayer-${i._idx}" style="margin:2px 0 12px;">
          <div style="display:flex; gap:8px; margin-bottom:6px;">
            <button onclick="closeGoalPlayer()" style="background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;">&times; Close</button>
            <button onclick="(function(f){f&&f.requestFullscreen&&f.requestFullscreen();})(this.parentElement.nextElementSibling)" style="background:var(--card);border:1px solid var(--maroon);color:var(--pink);border-radius:6px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;">&#9974; Full screen</button>
          </div>
          <iframe src="${inlineGoalPlayer.src}" title="Player" allow="autoplay; fullscreen" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0;border-radius:8px;background:transparent;display:block;"></iframe>
        </div>` : ''}`;
      }).join('');
    }
  }

  // Guard stale selection after deletion
  if (selectedVaultIdx !== null && !intentions[selectedVaultIdx]) {
    selectedVaultIdx = null;
    showVaultWelcome();
  }

  // Render embedded progress below category filters
  if (typeof currentUser !== 'undefined' && currentUser) renderEmbeddedProgress();

}

/* ── EMBEDDED PROGRESS WORKSPACE ────────────────────────────────────────────
   Renders CI metrics inline below category filters in #colb-selection-state.
   Mirrors renderProgressDashboard() but targets #embedded-progress-workspace.
────────────────────────────────────────────────────────────────────────── */
async function renderEmbeddedProgress() {
  const el = document.getElementById('embedded-progress-workspace');
  if (!el) return;

  el.innerHTML = `<div style="font-family:var(--vault-mono);font-size:9px;color:var(--muted);letter-spacing:2px;padding:4px 0 8px;">LOADING…</div>`;

  const weekStart = (() => {
    const d = new Date(); const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1); d.setHours(0,0,0,0); return d.toISOString();
  })();

  let activityRows = [], totalScore = 0;
  try {
    const { data } = await sb.from('activity_log')
      .select('event_type, points, created_at')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(500);
    activityRows = data || [];
  } catch(e) {}
  try {
    const { data } = await sb.from('user_scores').select('total_score').eq('user_id', currentUser.id).single();
    totalScore = data?.total_score || 0;
  } catch(e) {}

  const streak       = LS.get('ci_streak') || 0;
  const bestStreak   = Math.max(streak, LS.get('ci_best_streak') || 0,
    ...(intentions||[]).flatMap(i => (i.achievers?.commitments||[]).map(c => c.streak||0)));
  const daysAsMember = currentUser?.created_at
    ? Math.floor((Date.now() - new Date(currentUser.created_at)) / 86400000) : 0;
  const vizPlays     = LS.get('ci_viz_plays')      || 0;
  const medSessions  = LS.get('ci_med_plays')       || 0;
  const gratSessions = LS.get('ci_gratitude_plays') || 0;
  const cdownSessions = activityRows.filter(r => r.event_type === 'countdown').length;
  const sessionsAll   = activityRows.filter(r =>
    ['viz','meditation','countdown','gratitude'].includes(r.event_type)).length;
  const sessionsWeek  = activityRows.filter(r =>
    ['viz','meditation','countdown','gratitude'].includes(r.event_type) && r.created_at >= weekStart).length;
  const commitsToday  = (intentions||[]).reduce((n,i) =>
    n + (i.achievers?.commitments||[]).filter(c => !!c.checks?.[dayKey()]).length, 0);
  const wfDone        = typeof _wfLoadChecks === 'function' ? Object.values(_wfLoadChecks()).filter(Boolean).length : 0;
  const goalsSet      = (intentions||[]).length;
  const roadmapsGen   = (intentions||[]).filter(i => i.bbfw).length;
  const mapFilled     = (intentions||[]).filter(i => (i.theMap?.components||[]).length > 0).length;
  const mapTodos      = activityRows.filter(r => r.event_type === 'map_todo').length;

  const mapGoals = (intentions||[]).map(intent => {
    const components = intent.theMap?.components || [];
    const total   = components.reduce((n, comp) => n + (comp.todos?.length || 0), 0);
    const checked = components.reduce((n, comp) => n + (comp.todos||[]).filter(t => t.done).length, 0);
    return { title: intent.title, total, checked };
  }).filter(g => g.total > 0);

  const streakScore   = Math.min(streak / 30, 1) * 35;
  const practiceScore = Math.min(sessionsAll / 50, 1) * 40;
  const systemFrac    = Math.min((goalsSet/5*0.3) + ((roadmapsGen||0)/3*0.4) + ((mapFilled||0)/3*0.3), 1);
  const systemScore   = systemFrac * 25;
  const ciScore       = Math.round(streakScore + practiceScore + systemScore);
  const scoreColor    = ciScore >= 75 ? 'var(--success)' : ciScore >= 40 ? 'var(--brand)' : 'var(--accent)';
  const scoreLabel    = ciScore >= 75 ? 'ELITE' : ciScore >= 40 ? 'BUILDING' : 'STARTING';

  const practices = [
    { label: 'Sessions this week',count: sessionsWeek,  icon: '⚡',  nav: null },
    { label: 'Commitments today', count: commitsToday,  icon: '✅',  nav: null },
    { label: 'Weekly focus done', count: wfDone,        icon: '🎯',  nav: null },
  ].filter(p => p.count > 0).sort((a,b) => b.count - a.count);

  const system = [
    { label: 'Goals set',          count: goalsSet,    icon: '🎯' },
    { label: 'Roadmaps generated', count: roadmapsGen, icon: '◈'  },
    { label: 'Maps built',         count: mapFilled,   icon: '🗺'  },
    { label: 'Total points',       count: totalScore,  icon: '✦'  },
    { label: 'Best streak',        count: bestStreak,  icon: '🏆'  },
  ].filter(s => s.count > 0);

  const unlockQueue = [
    { test: goalsSet === 0,     cta: 'Set your first Intention',         action: `navTo('setup')`,             icon: '🎯'  },
    { test: roadmapsGen === 0,  cta: 'Generate your first Roadmap',      action: `navTo('dashboard')`,         icon: '◈'  },
    { test: mapFilled === 0,    cta: 'Build out My Roadmap on a goal',    action: `navTo('dashboard')`,         icon: '🗺'  },
    { test: streak === 0,       cta: 'Start a daily streak today',       action: `navTo('dashboard')`,         icon: '🔥'  },
  ];
  const nextUnlock = unlockQueue.find(u => u.test);
  const isNew = sessionsAll === 0 && goalsSet === 0;

  el.innerHTML = `<div style="border-top:1px solid var(--card);padding-top:16px;margin-top:4px;">

    <div style="font-family:var(--vault-mono);font-size:9px;color:var(--muted);font-weight:800;letter-spacing:2px;margin-bottom:16px;">◈ PROGRESS</div>

    <!-- CI SCORE HERO -->
    <div style="background:var(--card);border:1px solid var(--border-2);border-radius:12px;padding:20px 16px;margin-bottom:16px;
      display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
      <div style="text-align:center;flex-shrink:0;">
        <div style="font-size:56px;font-weight:900;color:${scoreColor};line-height:1;font-family:var(--vault-mono);">${ciScore}</div>
        <div style="font-family:var(--vault-mono);font-size:9px;color:${scoreColor};letter-spacing:2px;margin-top:4px;font-weight:800;">${scoreLabel}</div>
        <div style="font-family:var(--vault-mono);font-size:8px;color:var(--border);letter-spacing:1px;margin-top:2px;">CI SCORE</div>
      </div>
      <div style="flex:1;min-width:140px;">
        ${streak > 0 ? `<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:3px;">🔥 ${streak}-day streak</div>` : ''}
        ${daysAsMember > 0 ? `<div style="font-family:var(--vault-mono);font-size:9px;color:var(--muted);margin-bottom:12px;">Member ${daysAsMember}d</div>` : ''}
        ${_epScoreBar('Consistency', streakScore, 35, 'var(--brand)')}
        ${_epScoreBar('Practice',    practiceScore, 40, 'var(--accent)')}
        ${_epScoreBar('System',      systemScore, 25, 'var(--success)')}
        <div style="font-size:9px;color:var(--border);margin-top:8px;">Hit 75 to reach Elite.</div>
      </div>
    </div>

    ${isNew ? `
    <div style="background:var(--card);border:1px solid var(--border-2);border-radius:10px;padding:20px;text-align:center;margin-bottom:16px;">
      <div style="font-size:24px;margin-bottom:8px;">◈</div>
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px;">Your dashboard activates as you use CI.</div>
      <div style="font-size:11px;color:var(--muted);line-height:1.6;">Every session you run shows up here.</div>
    </div>` : ''}

    ${practices.length > 0 ? `
    <div style="margin-bottom:16px;">
      <div style="font-family:var(--vault-mono);font-size:9px;color:var(--muted);font-weight:800;letter-spacing:2px;margin-bottom:10px;">WHAT'S MOVING</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;">
        ${practices.map(p => `
          <div style="background:var(--card);border:1px solid var(--border-2);border-radius:10px;padding:12px 10px;text-align:center;
            ${p.nav ? 'cursor:pointer;' : ''}" ${p.nav ? `onclick="${p.nav}"` : ''}>
            <div style="font-size:18px;margin-bottom:4px;">${p.icon}</div>
            <div style="font-size:20px;font-weight:900;color:var(--text);font-family:var(--vault-mono);line-height:1;">${p.count.toLocaleString()}</div>
            <div style="font-size:8px;color:var(--muted);font-family:var(--vault-mono);margin-top:3px;letter-spacing:0.5px;">${p.label.toUpperCase()}</div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    ${system.length > 0 ? `
    <div style="margin-bottom:16px;">
      <div style="font-family:var(--vault-mono);font-size:9px;color:var(--muted);font-weight:800;letter-spacing:2px;margin-bottom:10px;">YOUR SYSTEM</div>
      <div style="background:var(--card);border:1px solid var(--border-2);border-radius:10px;overflow:hidden;">
        ${system.map((s,i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;
            ${i < system.length-1 ? 'border-bottom:1px solid var(--card);' : ''}">
            <span style="font-size:14px;width:20px;text-align:center;">${s.icon}</span>
            <span style="font-size:11px;color:var(--mid);flex:1;">${s.label}</span>
            <span style="font-family:var(--vault-mono);font-size:13px;font-weight:800;color:var(--text);">${s.count.toLocaleString()}</span>
          </div>`).join('')}
      </div>
    </div>` : ''}

    ${mapGoals.length > 0 ? `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-family:var(--vault-mono);font-size:9px;color:var(--muted);font-weight:800;letter-spacing:2px;">MY ROADMAP</div>
        ${mapTodos > 0 ? `<div style="font-family:var(--vault-mono);font-size:9px;color:var(--success);">${mapTodos} done</div>` : ''}
      </div>
      <div style="background:var(--card);border:1px solid var(--border-2);border-radius:10px;overflow:hidden;">
        ${mapGoals.map((g,i) => {
          const pct  = g.total > 0 ? Math.round((g.checked / g.total) * 100) : 0;
          const done = g.checked === g.total && g.total > 0;
          const barColor = done ? 'var(--success)' : pct >= 50 ? 'var(--brand)' : 'var(--accent)';
          const title = g.title.replace(/^i am\s+/i,'').replace(/\b\w/g, c => c.toUpperCase());
          return `
          <div style="padding:12px 14px;${i < mapGoals.length-1 ? 'border-bottom:1px solid var(--card);' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <div style="font-size:11px;color:${done?'var(--success)':'var(--mid)'};font-weight:${done?'700':'400'};
                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:75%;">${done?'✓ ':''} ${title}</div>
              <div style="font-family:var(--vault-mono);font-size:9px;color:${barColor};font-weight:800;flex-shrink:0;">${g.checked}/${g.total}</div>
            </div>
            <div style="height:3px;background:var(--off);border-radius:2px;">
              <div style="height:3px;background:${barColor};border-radius:2px;width:${pct}%;"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

  </div>`;
}

function _epScoreBar(label, score, max, color) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return `<div style="margin-bottom:8px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
      <span style="font-family:var(--vault-mono);font-size:8px;color:var(--muted);">${label}</span>
      <span style="font-family:var(--vault-mono);font-size:8px;color:${color};">${Math.round(score)}/${max}</span>
    </div>
    <div style="height:3px;background:var(--off);border-radius:2px;">
      <div style="height:3px;background:${color};border-radius:2px;width:${pct}%;transition:width 0.4s;"></div>
    </div>
  </div>`;
}

export function filterVaultCategory(cat) {
  vaultActiveCategory = cat;
  renderVaultSidebar();
}

export function selectVaultIntention(idx) {
  selectedVaultIdx = selectedVaultIdx === idx ? null : idx;
  renderVaultSidebar();
  if (selectedVaultIdx !== null) {
    if (intentions[selectedVaultIdx]) intentions[selectedVaultIdx] = hydrateIntent(intentions[selectedVaultIdx]);
    showVaultBuildSheet(selectedVaultIdx);
    // Seed goal-specific content into players
    if (typeof seedGoalPractice === 'function') seedGoalPractice(selectedVaultIdx);
    // Drive the Column A players (vision + phone) with this goal's image + affirmations
    if (typeof runSurgicalVisualLoop === 'function') runSurgicalVisualLoop(selectedVaultIdx);
  } else {
    if (typeof stopSurgicalVisualLoop === 'function') stopSurgicalVisualLoop();
    showVaultWelcome();
  }
}

/* ── AFFIRMATION TICKER ──────────────────────────────────
   startAffirmationLoop(affirmations)
     affirmations = string[] from goal data, or null/[] for defaults.
   Runs a 30-second cycle with 0.5s CSS fade between items.
───────────────────────────────────────────────────────── */
const AFFIRMATION_DEFAULTS = [
  "I am becoming the best version of myself.",
  "Every day I move closer to my vision.",
  "I am worthy of everything I desire.",
  "My goals are inevitable — the path is already set.",
  "I attract success with every thought and action.",
  "I am the architect of my destiny.",
  "Growth and abundance flow naturally to me."
];
let _affLoop = null;
let _affList = AFFIRMATION_DEFAULTS;
let _affIdx  = 0;

const TROUGH_IMAGES = [
  'trough001.jpg','trough002.jpg','trough003.jpg','trough004.jpg','trough005.jpg',
  'trough006.jpg','trough007.jpg','trough008.jpg','trough009.jpg','trough010.jpg',
  'trough011.jpg','trough012.jpg','trough013.jpg','trough014.jpg','trough015.jpg',
  'trough016.jpg','trough017.jpg','trough018.JPG','trough019.jpg','trough020.jpg',
  'trough021.jpg','trough022.jpg','trough023.jpg','trough024.jpg','trough025.jpg',
  'trough026.jpg','trough027.jpg','trough028.jpg','trough029.jpg','trough030.jpg',
  'trough031 (1).jpg','trough032.jpg','trough033.jpg','trough034.jpg'
];
let _troughIdx = 0;

function _affUpdate(text) {
  const ticker = document.getElementById('affirmation-ticker-text');
  const card   = document.getElementById('dashboard-affirmation-target');
  const img    = document.getElementById('dashboard-card-image');
  if (ticker) ticker.textContent = text;
  if (card)   card.textContent   = text;
  if (img) {
    _troughIdx = (_troughIdx + 1) % TROUGH_IMAGES.length;
    img.src = 'images/trough/' + TROUGH_IMAGES[_troughIdx];
    img.style.display = '';
  }
}

export function startAffirmationLoop(affirmations) {
  if (_affLoop) { clearInterval(_affLoop); _affLoop = null; }
  _affList    = (affirmations && affirmations.length) ? affirmations : AFFIRMATION_DEFAULTS;
  _affIdx     = 0;
  _troughIdx  = 0;
  const card  = document.getElementById('dashboard-affirmation-target');
  const img   = document.getElementById('dashboard-card-image');
  if (card) card.style.opacity = '1';
  if (img)  { img.src = 'images/trough/' + TROUGH_IMAGES[0]; img.style.display = ''; }
  const ticker = document.getElementById('affirmation-ticker-text');
  if (ticker) ticker.textContent = _affList[0];
  if (card)   card.textContent   = _affList[0];
  _affLoop = setInterval(() => {
    _affIdx = (_affIdx + 1) % _affList.length;
    const card2 = document.getElementById('dashboard-affirmation-target');
    const img2  = document.getElementById('dashboard-card-image');
    if (card2) card2.style.opacity = '0';
    if (img2)  img2.style.opacity  = '0';
    setTimeout(() => {
      _affUpdate(_affList[_affIdx]);
      if (card2) card2.style.opacity = '1';
      if (img2)  img2.style.opacity  = '1';
    }, 500);
  }, 30000);
}

function showVaultWelcome() {
  document.getElementById('addIntentionForm')?.classList.add('hidden');
  const sel = document.getElementById('colb-selection-state');
  const act = document.getElementById('colb-active-state');
  if (sel) sel.style.display = '';
  if (act) act.style.display = 'none';
  startAffirmationLoop(null);
}

export function closeVaultBuildSheet() {
  selectedVaultIdx = null;
  renderVaultSidebar();
  showVaultWelcome();
}

/* ── COLUMN B — movable triangle sections ──────────────────
   Each section key maps to its top-level block in #vaultMain.
   Order is persisted so ▲▼ reordering survives reloads.
─────────────────────────────────────────────────────────── */
const COLB_SECTIONS = { myRoadmap: 'vaultBuildSheet' };
const COLB_DEFAULT_ORDER = ['myRoadmap'];

function getColBOrder() {
  let o = LS.get('ci_colb_order');
  if (!Array.isArray(o)) o = [];
  // Migrate the legacy saved order (Cosmic Library first) to the new default now
  // that My Roadmap leads — the reorder arrows that wrote this were removed.
  if (o.length === 2 && o[0] === 'cosmicLibrary' && o[1] === 'myRoadmap') o = [];
  o = o.filter(k => COLB_DEFAULT_ORDER.includes(k));
  COLB_DEFAULT_ORDER.forEach(k => { if (!o.includes(k)) o.push(k); });
  return o;
}

function applyColBOrder() {
  // DOM reordering removed — vaultBuildSheet now lives inside #colb-active-state
  // and visibility is managed by showVaultBuildSheet / showVaultWelcome.
}

function moveColBSection(key, dir) {
  const order = getColBOrder();
  const i = order.indexOf(key);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  LS.set('ci_colb_order', order);
  applyColBOrder();
}

/* ── COLUMN B SECTION BANNER (bold colored bar; collapsible group container) ──
   Reuses toggleColBSection: toggles `${key}-body` + rotates `${key}-arr`.
   Drop pieces into bodyHtml to group them under the banner.
─────────────────────────────────────────────────────────────────────────── */
export function colBBanner(key, title, color, bodyHtml, opts) {
  opts = opts || {};
  const collapsed = !!opts.collapsed;
  const icon = opts.icon ? `<span class="colb-banner-icon">${opts.icon}</span>` : '';
  const meta = opts.meta ? `<span class="colb-banner-meta">${opts.meta}</span>` : '';
  return `
    <div class="colb-banner" onclick="toggleColBSection('${key}')"
      style="background:linear-gradient(90deg, ${color}, ${color}bb);">
      ${icon}
      <span class="colb-banner-title">${title}</span>
      ${meta}
      <span class="colb-banner-arrow${collapsed ? '' : ' open'}" id="${key}-arr">▶</span>
    </div>
    <div class="colb-banner-body" id="${key}-body"${collapsed ? ' style="display:none;"' : ''}>${bodyHtml || ''}</div>`;
}

/* ── BRAND BANNER RESOLVER ───────────────────────────────────────────
   Priority: pb['pb-name'] (in-memory pegboard) → Supabase profiles cache
   → currentUser metadata → email prefix → fallback "MY"
──────────────────────────────────────────────────────────────────── */
function fitBrandBannerText() {
  const el = document.getElementById('brand-banner-text');
  if (!el || el.clientWidth <= 0) return;
  const maxPx = 22;
  const minPx = 10;
  el.style.letterSpacing = '1px';
  let size = maxPx;
  el.style.fontSize = size + 'px';
  while (size > minPx && el.scrollWidth > el.clientWidth) {
    size -= 0.5;
    el.style.fontSize = size + 'px';
  }
}

if (!window._brandBannerResizeBound) {
  window._brandBannerResizeBound = true;
  window.addEventListener('resize', () => {
    if (document.getElementById('brand-banner-text')) fitBrandBannerText();
  });
}

async function populateWorkspaceBrandBanner() {
  let firstName = 'MY';
  try {
    // 1. Pegboard localStorage — primary source, always populated when user has a profile
    const pb = getPB();
    if (pb['pb-name']) {
      firstName = pb['pb-name'].split(' ')[0];
    } else {
      // 2. Supabase profiles cache (written on loadPegboard)
      const cached = localStorage.getItem('ci_user_profile');
      if (cached) {
        const profileData = JSON.parse(cached);
        if (profileData?.first_name)     firstName = profileData.first_name;
        else if (profileData?.pb_name)   firstName = profileData.pb_name.split(' ')[0];
        else if (profileData?.email)     firstName = profileData.email.split('@')[0];
      } else if (typeof sb !== 'undefined' && currentUser) {
        // 3. Supabase profiles table (single fetch, then cache for next time)
        const { data: profile, error } = await sb.from('profiles').select('*')
          .eq('id', currentUser.id).single();
        if (!error && profile) {
          localStorage.setItem('ci_user_profile', JSON.stringify(profile));
          firstName = profile.pb_name?.split(' ')[0] || profile.first_name
                   || currentUser.email?.split('@')[0] || 'MY';
        }
      } else if (currentUser?.email) {
        // 4. Email prefix last resort
        firstName = currentUser.email.split('@')[0];
      }
    }
  } catch (e) {
    console.error('Brand banner profile error:', e);
  }
  const el = document.getElementById('brand-banner-text');
  if (el) {
    el.innerText = `${firstName.toUpperCase()}'S PERSONAL ROADMAP`;
    requestAnimationFrame(() => fitBrandBannerText());
  }
}

function switchWorkspaceLayer(name) {
  ['strategy','tactics'].forEach(n => {
    const btn   = document.getElementById(`wsTab-${n}`);
    const layer = document.getElementById(`layer-content-${n}`);
    if (btn) {
      const on = n === name;
      btn.style.color        = on ? 'var(--brand)' : 'var(--muted)';
      btn.style.borderBottom = on ? '2px solid var(--brand)' : '2px solid transparent';
      btn.style.background   = on ? 'var(--card)' : 'transparent';
    }
    if (layer) layer.style.display = n === name ? '' : 'none';
  });
}

function showVaultBuildSheet(idx) {
  const intent = hydrateIntent(intentions[idx]);
  if (!intent) { showVaultWelcome(); return; }
  intentions[idx] = intent;
  // Switch Column B state: hide selection list, show active workspace
  const sel = document.getElementById('colb-selection-state');
  const act = document.getElementById('colb-active-state');
  if (sel) sel.style.display = 'none';
  if (act) act.style.display = '';
  document.getElementById('addIntentionForm')?.classList.add('hidden');

  // Populate workspace: header + the single 10-step AI roadmap view
  const hdr = document.getElementById('vaultWorkspaceHeader');
  if (hdr) hdr.innerHTML = buildWorkspaceHeader(intent, idx);
  if (typeof window.injectContentBlocks === 'function') window.injectContentBlocks();   // fill the admin-editable goal-viz-note block
  loadGoalVisualization(intent);

  const roadmapEl = document.getElementById('layer-content-roadmap');
  if (roadmapEl) { roadmapEl.innerHTML = buildRoadmapPanel(intent, idx); roadmapEl.style.display = 'none'; roadmapEl.classList.remove('cc-open'); }   // COLLAPSED by default — MY ACTION PLAN button / banner slides it open

  populateWorkspaceBrandBanner();

  const offset = document.getElementById('page-dashboard')?.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
}

/* Smoothly slide a panel open/closed (max-height + opacity). Returns the new
   open state. Pass forceOpen (true/false) to force a direction. */
export function slideToggle(el, forceOpen) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return false;
  el.classList.add('cc-collapse');
  const isOpen = el.classList.contains('cc-open');
  const open = (forceOpen === undefined || forceOpen === null) ? !isOpen : !!forceOpen;
  // Finalize only AFTER the max-height transition actually ends — a fixed timer can
  // fire a hair early on a busy render and chop the last frames (the "slam shut").
  if (el._ccTimer) { clearTimeout(el._ccTimer); el._ccTimer = null; }
  if (el._ccEnd) { el.removeEventListener('transitionend', el._ccEnd); el._ccEnd = null; }
  const finalize = (ev) => {
    if (ev && (ev.target !== el || (ev.propertyName && ev.propertyName !== 'max-height'))) return;
    el.removeEventListener('transitionend', finalize);
    if (el._ccTimer) { clearTimeout(el._ccTimer); el._ccTimer = null; }
    el._ccEnd = null;
    if (el.classList.contains('cc-open')) el.style.maxHeight = 'none';   // opened → let content grow
    else el.style.display = 'none';                                      // closed → remove from flow
  };
  el._ccEnd = finalize;
  el.addEventListener('transitionend', finalize);
  el._ccTimer = setTimeout(finalize, 1400);   // safety net if transitionend never fires
  if (open) {
    el.style.display = '';
    el.classList.add('cc-open');
    if (!isOpen) {
      // Paint the collapsed state, THEN transition to full on the next frame. Double
      // rAF reliably animates even when opening from display:none the first time
      // (a single sync reflow sometimes paints the final state → the "explode").
      el.style.maxHeight = '0px'; el.style.opacity = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!el.classList.contains('cc-open')) return;
        el.style.maxHeight = el.scrollHeight + 'px'; el.style.opacity = '1';
      }));
    } else {
      el.style.maxHeight = el.scrollHeight + 'px'; el.style.opacity = '1';
    }
  } else {
    el.style.maxHeight = el.scrollHeight + 'px'; el.style.opacity = '1';
    el.classList.remove('cc-open');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (el.classList.contains('cc-open')) return;
      el.style.maxHeight = '0px'; el.style.opacity = '0';
    }));
  }
  return open;
}
if (typeof window !== 'undefined') window.slideToggle = slideToggle;

/* The "…'S PERSONAL ROADMAP" banner (and the MY ACTION PLAN button) is a
   dropdown: slide the roadmap content open/closed and rotate the banner arrow. */
export function toggleRoadmap() {
  const c = document.getElementById('layer-content-roadmap');
  const a = document.getElementById('brand-banner-arrow');
  if (!c) return;
  const open = slideToggle(c);
  if (a) a.style.transform = 'translateY(-50%) rotate(' + (open ? '0deg' : '-90deg') + ')';
}

/* Hide/show the goal's greeting box (goal-viz-note, "What would you like to do…")
   when an action opens, so the content sits right under the header. Idempotent;
   only acts when the box actually holds text. */
function _setGreetingHidden(hidden) {
  const greet = document.querySelector('#vaultWorkspaceHeader [data-block="goal-viz-note"]');
  if (!greet || !greet.textContent.trim()) return;
  const visible = greet.classList.contains('cc-open') ||
    (greet.style.display !== 'none' && greet.style.maxHeight !== '0px' && greet.offsetHeight > 1);
  if (hidden && visible) slideToggle(greet, false);
  else if (!hidden && !visible) slideToggle(greet, true);
}

/* The VISUALIZATION button slides the goal's quick-viz timer box open/closed. */
export function wsToggleViz(idx) {
  const opened = slideToggle(document.getElementById('wsVizBox-' + idx));
  _setGreetingHidden(opened);
}
if (typeof window !== 'undefined') window.wsToggleViz = wsToggleViz;

/* MY ACTION PLAN: slide the roadmap open/closed AND fade away the clutter above it
   (the Timeline & Progress button + its panel + the Visualization button) so the
   open roadmap reads clean. MY ACTION PLAN itself stays (goes full-width) as the
   toggle to close again. */
export function openActionPlan(idx) {
  const c = document.getElementById('layer-content-roadmap');
  if (!c) return;
  const open = slideToggle(c);
  const tp   = document.getElementById('goalTimeline-' + idx);
  const vz   = document.getElementById('wsVizBtn-' + idx);
  const vbox = document.getElementById('wsVizBox-' + idx);
  const row  = document.getElementById('wsBtnRow-' + idx);
  if (open) {
    if (tp && tp.classList.contains('cc-open')) slideToggle(tp, false);       // close the timeline panel too
    if (vbox && vbox.classList.contains('cc-open')) slideToggle(vbox, false); // roll up the visualization timers
    slideToggle(vz, false);
    _setGreetingHidden(true);                          // hide the "what would you like to do" greeting
    if (row) row.style.gridTemplateColumns = '1fr';   // MY ACTION PLAN fills the row
  } else {
    slideToggle(vz, true);
    _setGreetingHidden(false);                         // bring the greeting back
    if (row) row.style.gridTemplateColumns = 'repeat(2,1fr)';
  }
}
if (typeof window !== 'undefined') window.openActionPlan = openActionPlan;

/* Calm, slow expand/collapse for the Column-A panels (meditation-app feel — move
   slowly = calmly). Slides the target box open/closed and flips the caret.
   `beforeOpen` runs just before opening so lazily-built panels have content to
   measure for the height animation. */
export function calmExpand(boxId, chev, beforeOpen) {
  const box = document.getElementById(boxId);
  if (!box) return false;
  const visible = box.classList.contains('cc-open') ||
    (box.style.display !== 'none' && box.style.maxHeight !== '0px' && box.offsetHeight > 1);
  const open = !visible;
  if (open && typeof beforeOpen === 'function') { try { beforeOpen(); } catch (e) {} }
  slideToggle(box, open);
  if (chev) chev.textContent = open ? '⌄' : '›';
  return open;
}
if (typeof window !== 'undefined') window.calmExpand = calmExpand;

/* Daily Habits inline on the dashboard — today's checklist grouped by time of day
   (same buckets/labels as the Habits page). Tick toggles in place. */
function renderDailyHabitsInline() {
  const el = document.getElementById('dailyHabitsInlineBody');
  if (!el) return;
  let done = {}, list = [];
  try { done = LS.get('ci_habits_' + dayKey()) || {}; } catch (e) {}
  try { list = getHabitList() || []; } catch (e) {}
  if (!list.length) { el.innerHTML = '<div style="color:var(--muted);font-style:italic;padding:10px 2px;font-size:13px;">No habits yet — add them on My Habits.</div>'; return; }
  const CATS  = ['MORNING', 'DAY', 'EVENING', 'BEDTIME', 'HEALTH'];
  const LABEL = { MORNING: 'Morning', DAY: 'Afternoon', EVENING: 'Evening', BEDTIME: 'Before Sleep', HEALTH: 'After Waking', '': 'Unsorted' };
  const COLOR = { MORNING: '#E8A828', DAY: '#4A9EAD', EVENING: '#7C5CC4', BEDTIME: '#5C6BA0', HEALTH: '#4ADE80', '': '#888' };
  const catOf = h => (CATS.indexOf(h && h.cat) >= 0 ? h.cat : '');
  const row = h => {
    const on = !!done[h.id];
    return `<div style="display:flex;align-items:center;gap:11px;padding:9px 2px;border-bottom:1px solid var(--widget-border,#2a2a2a);">
      <button onclick="habitToggle('${h.id}');renderDailyHabitsInline()" title="${on ? 'Done — tap to undo' : 'Mark done'}" style="flex-shrink:0;width:24px;height:24px;border-radius:50%;border:1.5px solid ${on ? '#2FA94B' : 'var(--muted)'};background:${on ? '#2FA94B' : 'transparent'};color:#fff;font-size:13px;font-weight:800;cursor:pointer;line-height:1;display:inline-flex;align-items:center;justify-content:center;padding:0;">${on ? '✓' : ''}</button>
      <span style="flex:1;min-width:0;font-size:14px;line-height:1.4;color:var(--widget-text,#eee);${on ? 'text-decoration:line-through;opacity:.6;' : ''}">${esc(h.name)}</span>
    </div>`;
  };
  let html = '';
  [...CATS, ''].forEach(cat => {
    const items = list.filter(h => catOf(h) === cat);
    if (!items.length) return;
    const dn = items.filter(h => done[h.id]).length;
    html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:14px 0 4px;">
      <span style="font-family:var(--vault-mono);font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${COLOR[cat]};">${LABEL[cat]}</span>
      <span style="font-family:var(--vault-mono);font-size:9px;color:var(--muted);">${dn}/${items.length}</span>
    </div>` + items.map(row).join('');
  });
  el.innerHTML = html + '<button onclick="navTo(\'habits\')" style="width:100%;margin-top:12px;background:none;border:1px dashed var(--widget-border,#2a2a2a);border-radius:8px;padding:9px;font-family:var(--vault-mono);font-size:9px;font-weight:800;letter-spacing:1px;color:var(--muted);cursor:pointer;">✎ EDIT HABITS</button>';
}
if (typeof window !== 'undefined') window.renderDailyHabitsInline = renderDailyHabitsInline;

/* Action Plan panel on the Citadel dashboard — lists each goal; tapping one opens
   that goal's roadmap in the goals workspace above. Real content, nothing stubbed. */
function renderActionPlanInline() {
  const el = document.getElementById('actionPlanInlineBody');
  if (!el) return;
  if (!intentions.length) {
    el.innerHTML = '<div style="color:var(--muted);font-style:italic;padding:10px 2px;font-size:13px;">Add a goal above to build its action plan.</div>';
    return;
  }
  const rows = intentions.map((g, i) => {
    const c = _goalColor(i);
    return `<button onclick="selectVaultIntention(${i})" style="display:flex;align-items:center;gap:11px;width:100%;text-align:left;background:var(--card,#fff);border:1px solid var(--border,#e3e7ec);border-radius:10px;padding:11px 13px;margin-bottom:8px;cursor:pointer;">
      ${goalBadge(goalLetter(g, i), c.bg, c.text, 24)}
      <span style="flex:1;min-width:0;font-size:14px;line-height:1.35;color:var(--text,#26364b);">${esc(goalCase(g.title || ''))}</span>
      <span style="flex-shrink:0;color:#7888A8;font-weight:800;font-size:18px;">&#8250;</span>
    </button>`;
  }).join('');
  el.innerHTML = rows + '<button onclick="openMyRoadmap()" style="width:100%;margin-top:4px;background:none;border:1px dashed var(--border,#cfd6de);border-radius:8px;padding:9px;font-family:var(--vault-mono);font-size:9px;font-weight:800;letter-spacing:1px;color:var(--muted);cursor:pointer;">OPEN FULL ACTION PLAN</button>';
}
if (typeof window !== 'undefined') window.renderActionPlanInline = renderActionPlanInline;

/* Fetch a Pexels visualization for the selected goal and slot it into the
   workspace header (keyword extraction + search happen server-side). */
async function loadGoalVisualization(intent) {
  const img = activeEl('goalVisualizationImage');
  const loader = activeEl('goalVisualizationLoader');
  const box = activeEl('goalVisualizationContainer');
  const diss = activeEl('goalDissolve');
  if (!img || !loader || !intent) return;

  // Multi-image slow dissolve when this goal has a 5-image set (opt-in).
  const opts = Array.isArray(intent.imageOptions) ? intent.imageOptions.filter(Boolean) : [];
  if (diss && opts.length > 1) {
    if (box) box.style.display = '';
    img.style.display = 'none';
    loader.style.display = 'none';
    diss.style.display = 'block';
    mountDissolve(diss, opts, { hold: 5000, fade: 2000 });
    return;
  }
  if (diss) { stopDissolve(diss); diss.style.display = 'none'; }

  const show = (url) => {
    img.onload = () => { loader.style.display = 'none'; img.style.display = 'block'; };
    img.onerror = () => { if (box) box.style.display = 'none'; };
    img.style.display = 'none';
    loader.style.display = '';
    img.src = url;
  };

  // Already stored for this goal → reuse it. No OpenAI/Pexels call, stable image.
  if (intent.imageUrl && !intent.imageUrl.startsWith('data:')) {
    show(intent.imageUrl);
    return;
  }

  // First time → fetch once from Pexels, show it, and persist the URL to the goal.
  img.style.display = 'none';
  loader.style.display = '';
  loader.innerHTML = '<span class="inline-spinner"></span> Loading visualization…';
  try {
    const data = await window.ciApiJson('image-search', { statement: intent.title });
    if (data && data.url) {
      show(data.url);
      intent.imageUrl = data.url;   // image_url column — persisted by saveIntentions()
      saveIntentions();
    } else if (box) {
      box.style.display = 'none';   // nothing found — hide the placeholder
    }
  } catch (e) {
    if (box) box.style.display = 'none';   // fail quietly, don't block the workspace
  }
}

/* ✧ Fetch 5 Unsplash images for this goal and play a slow dissolve. Stores them
   in imageOptions so the dissolve persists. Needs UNSPLASH_ACCESS_KEY on Netlify. */
export async function fetchGoalDissolve(idx) {
  const it = intentions[idx];
  if (!it) return;
  const loader = activeEl('goalVisualizationLoader');
  const box = activeEl('goalVisualizationContainer');
  if (box) box.style.display = '';
  if (loader) { loader.style.display = ''; loader.innerHTML = '<span class="inline-spinner"></span> Finding 5 images…'; }
  try {
    const data = await window.ciApiJson('image-multi', { statement: it.title, count: 5 });
    if (data && Array.isArray(data.urls) && data.urls.length > 1) {
      it.imageOptions = data.urls;
      if (!it.imageUrl || it.imageUrl.startsWith('data:')) it.imageUrl = data.urls[0];
      saveIntentions();
      loadGoalVisualization(it);
      toast('5-image dissolve ready ✓', 'success');
    } else {
      if (loader) loader.style.display = 'none';
      toast('Not enough images found — try a simpler goal title.', 'error');
    }
  } catch (e) {
    if (loader) loader.style.display = 'none';
    toast('Could not fetch images — is the Unsplash key set on Netlify?', 'error');
  }
}

/* ↻ Re-roll the goal's visualization: drop the cached image and fetch a fresh
   one. Lets you replace an image that doesn't match the goal. */
export function rerollGoalVisualization(idx) {
  const it = intentions[idx];
  if (!it) return;
  it.imageUrl = '';          // clear the stored URL so loadGoalVisualization re-fetches
  it.imageOptions = null;    // drop any 5-image dissolve set → back to a single fresh image
  saveIntentions();
  const box = activeEl('goalVisualizationContainer');
  if (box) box.style.display = '';
  loadGoalVisualization(it);
}

export function vaultShowAddForm() {
  selectedVaultIdx = null;
  document.getElementById('vaultBuildSheet')?.classList.add('hidden');
  document.getElementById('addIntentionForm')?.classList.remove('hidden');
  setTimeout(() => document.getElementById('iam-field1')?.focus(), 50);
  renderVaultSidebar();
}

/* A real, per-goal daily focus line for the pink workspace note. Rotates daily
   from the goal's OWN content (roadmap steps → your own actions → affirmations →
   beliefs) — no API call, stable within a day, and offset by idx so each goal
   shows a different line on the same day. Falls back to a visualization prompt
   built from the title when nothing's been generated yet. */
function buildDailyNote(intent, idx) {
  const pool = [];
  const r = intent.roadmapAI || {};
  (r.tasks || []).forEach(t => { if (t) pool.push(`Today's focus: ${t}`); });
  (r.userTasks || []).forEach(t => { if (t && t.text) pool.push(`Today's focus: ${t.text}`); });
  const m = intent.mindset || {};
  (m.affirmations || []).forEach(a => { if (a) pool.push(a); });
  (m.beliefs || []).forEach(b => { if (b) pool.push(b); });
  if (!pool.length) return `Picture "${intent.title}" as already real — hold that feeling for 60 seconds.`;
  const d = new Date();
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return pool[(dayOfYear + (idx || 0)) % pool.length];
}

/* Jump to the goals editor AND straight to this exact goal to tweak it. */
export function editGoalDirect(idx) {
  if (typeof window.navTo === 'function') window.navTo('setup');
  setTimeout(() => {
    const el = document.getElementById('pb-goal-' + idx);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('cb-flash');
    setTimeout(() => el.classList.remove('cb-flash'), 2500);
    const ta = el.querySelector('textarea');
    if (ta) ta.focus();
  }, 400);
}
if (typeof window !== 'undefined') window.editGoalDirect = editGoalDirect;

/* ── WORKSPACE HEADER — goal card + brand banner ──────── */
function buildWorkspaceHeader(intent, idx) {
  const color = CARD_COLORS[idx % CARD_COLORS.length];
  const shade = GREY_SHADES[idx % GREY_SHADES.length];   // same palette as the goal box → title matches its card
  const _letr = goalLetter(intent, idx);
  const _lci  = (typeof _letr === 'string' && /^[A-Z]$/.test(_letr)) ? _letr.charCodeAt(0) - 65 : (Number.isFinite(idx) ? idx : 0);
  const gc    = GOAL_COLORS[((_lci % GOAL_COLORS.length) + GOAL_COLORS.length) % GOAL_COLORS.length] || { bg: '#1D3557', text: '#fff' };
  return `
    <div style="padding:12px 16px 0;">
      <div style="position:relative;display:flex;align-items:center;gap:12px;padding:2px 4px 4px;">
        <div style="flex:1;display:flex;align-items:center;gap:12px;background:${shade.bg};color:${shade.text};padding:14px 16px;border-radius:8px;font-size:18px;font-weight:700;letter-spacing:0.3px;line-height:1.3;">${goalBadge(goalLetter(intent, idx), gc.bg, gc.text, 36)}<span style="min-width:0;">${esc(goalCase(intent.title))}</span></div>
        <button onclick="calmExpand('goalTimeline-${idx}')" title="Timeline &amp; progress" style="flex-shrink:0;width:40px;height:40px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--ink);border:1px solid var(--border);color:var(--brand);font-size:19px;line-height:1;cursor:pointer;padding:0;">&#9678;</button>
        <button onclick="editGoalDirect(${idx})" title="Edit this goal in Goals / Intentions" style="position:static;flex-shrink:0;width:40px;height:40px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--off,#eef1f5);border:1px solid var(--border);color:var(--text);font-size:15px;line-height:1;cursor:pointer;padding:0;">&#9998;</button>
      </div>
      <div id="goalTimeline-${idx}" class="cc-collapse" style="max-height:0;opacity:0;">${_goalTimelineHTML(intent, idx)}</div>
      <div class="goal-visualization-container" id="goalVisualizationContainer" style="position:relative;margin:6px 0 10px;width:100%;border-radius:8px;overflow:hidden;border:1px solid var(--border);background:var(--sunken);">
        <img id="goalVisualizationImage" src="" alt="Visualization" style="width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;display:none;" />
        <div id="goalDissolve" style="position:absolute;inset:0;display:none;"></div>
        <div id="goalVisualizationLoader" style="padding:30px;text-align:center;color:var(--muted);font-size:13px;"><span class="inline-spinner"></span> Loading visualization…</div>
        <button onclick="fetchGoalDissolve(${idx})" title="Slow dissolve of 5 images" style="position:absolute;top:8px;right:48px;z-index:2;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.55);color:#fff;border:none;cursor:pointer;font-size:12px;font-weight:800;line-height:1;display:flex;align-items:center;justify-content:center;">5&#10022;</button>
        <button onclick="rerollGoalVisualization(${idx})" title="Get a different image for this goal" style="position:absolute;top:8px;right:8px;z-index:2;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.55);color:#fff;border:none;cursor:pointer;font-size:15px;line-height:1;display:flex;align-items:center;justify-content:center;">&#8635;</button>
      </div>
      <!-- Admin-editable note (slug: goal-viz-note) — hidden until you add text on the Admin page. -->
      <div data-block="goal-viz-note" class="dash-note-block" style="display:none;position:relative;background:#ffffff;border:1px solid #e9edf2;border-radius:10px;box-shadow:0 6px 20px rgba(20,40,80,.06);padding:14px 16px;margin:0 4px 8px;font-size:15px;line-height:1.65;color:#3a4a63;"></div>
      <div id="wsBtnRow-${idx}" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:6px 4px 10px;">
        <button id="wsVizBtn-${idx}" onclick="wsToggleViz(${idx})" title="Open your visualization timers"
          style="display:flex;align-items:center;justify-content:center;gap:6px;padding:11px 6px;min-width:0;background:var(--ink);border:1px solid var(--border);color:var(--on-ink);border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.3px;cursor:pointer;text-align:center;line-height:1.2;">
          <span style="line-height:0;color:var(--brand);flex-shrink:0;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:block;"><path fill-rule="evenodd" d="M2 12 Q12 3.2 22 12 Q12 20.8 2 12 Z M12 7.8 A4.2 4.2 0 1 0 12.01 16.2 A4.2 4.2 0 1 0 12 7.8 Z"/><circle cx="12" cy="12" r="1.9"/></svg></span>VISUALIZATION</button>
        <button onclick="openActionPlan(${idx})" title="Open your Action Plan roadmap"
          style="display:flex;align-items:center;justify-content:center;gap:6px;padding:11px 6px;min-width:0;background:var(--ink);border:1px solid var(--border);color:var(--on-ink);border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.3px;cursor:pointer;text-align:center;line-height:1.2;">
          <span style="font-size:13px;line-height:1;color:var(--brand);flex-shrink:0;">&#9678;</span>MY ACTION PLAN</button>
      </div>
      <!-- QUICK-VIZ TIMERS — collapsed; opened by the VISUALIZATION button above -->
      <div id="wsVizBox-${idx}" class="cc-collapse" style="max-height:0;opacity:0;">
      <div style="display:flex;flex-direction:column;gap:10px;background:#1a1a1a;border:none;border-radius:12px;padding:12px;margin:4px 4px 12px;">
        ${[['15 Seconds',15],['30 Seconds',30],['1 Minute',60],['2 Minutes',120],['3 Minutes',180],['5 Minutes',300],['10 Minutes',600],['15 Minutes',900]].map(([lbl,secs]) =>
          `<div style="display:flex;align-items:stretch;gap:8px;">
            <button onclick="launchCountdown(${idx},${secs});event.stopPropagation()" title="${lbl} visualization"
              style="flex:1;min-width:0;box-sizing:border-box;padding:13px 16px;border-radius:10px;background:#fff;border:none;color:#1D3557;font-size:15px;font-weight:800;letter-spacing:.3px;cursor:pointer;text-align:center;line-height:1;">${lbl}</button>
            <div style="width:42px;flex-shrink:0;border-radius:8px;background:#fff;border:none;"></div>
            <div style="width:42px;flex-shrink:0;border-radius:8px;background:#fff;border:none;"></div>
            <div style="width:42px;flex-shrink:0;border-radius:8px;background:#fff;border:none;"></div>
          </div>`
        ).join('')}
        <button onclick="openVizLibrary();event.stopPropagation()" title="More visualization options"
          style="width:100%;box-sizing:border-box;padding:12px 16px;border-radius:10px;background:#7C5CC4;border:none;color:#fff;font-size:14px;font-weight:800;letter-spacing:.3px;cursor:pointer;text-align:center;line-height:1;">More visualization options &#9776;</button>
      </div>
      </div><!-- end #wsVizBox collapse -->
      <!-- Roadmap banner removed — the MY ACTION PLAN button above is the sole control for #layer-content-roadmap. -->
    </div>`;
}

/* ── STRATEGY LAYER — Backbone Framework ─────────────── */
function buildStrategyContent(intent, idx) {
  return `
    <div id="bsPanel-bbfw-${idx}">
      ${buildBBFWPanel(intent, idx)}
    </div>
    <div style="text-align:right;padding:4px 16px 8px;">
      <button onclick="deleteIntention(${idx})"
        style="background:none;border:none;color:var(--border);font-size:11px;cursor:pointer;
        letter-spacing:0.05em;padding:4px 8px;transition:color 0.15s;"
        onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--border)'">
        🗑 remove intention
      </button>
    </div>`;
}

/* ── TACTICS LAYER — Executive Brief ──────────────────── */
function buildTacticsContent(intent, idx) {
  return `<div id="bsPanel-tactics-${idx}">${_renderTactics(intent, idx)}</div>`;
}

function _renderTactics(intent, idx) {
  const bbfw = intent.bbfw;
  const ops  = Array.isArray(bbfw?.daily_ops) ? bbfw.daily_ops : [];
  const mile = typeof bbfw?.weekly_milestone === 'string' ? bbfw.weekly_milestone.trim() : '';

  if (!ops.length && !mile) {
    return `
      <div style="padding:48px 24px;text-align:center;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:var(--muted);letter-spacing:2px;margin-bottom:16px;">NO BRIEF YET</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.8;margin-bottom:24px;">Generate your Strategy first — the Tactics brief is built in the same pass.</div>
        <button onclick="generateBBFW(${idx}, true)"
          style="background:var(--brand);border:none;border-radius:6px;padding:10px 20px;
          font-family:var(--vault-mono);font-size:10px;font-weight:800;color:#000;cursor:pointer;letter-spacing:1px;">
          ◈ BUILD BRIEF
        </button>
      </div>`;
  }

  const opsHtml = ops.map((op, i) => `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--card);">
      <div style="width:20px;height:20px;flex-shrink:0;margin-top:1px;border:1.5px solid var(--brand);border-radius:4px;"></div>
      <div style="font-size:13px;color:var(--mid);line-height:1.5;">${esc(op)}</div>
    </div>`).join('');

  const mileHtml = mile ? `
    <div style="margin-top:24px;border:1px solid var(--border-2);border-radius:8px;padding:16px 18px;background:var(--sunken);">
      <div style="font-family:var(--vault-mono);font-size:9px;color:var(--accent);letter-spacing:1.5px;margin-bottom:10px;">⚡ WEEKLY MILESTONE</div>
      <div style="font-size:14px;font-weight:600;color:var(--mid);line-height:1.5;">${esc(mile)}</div>
    </div>` : '';

  return `
    <div style="padding:20px 24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:var(--brand);font-weight:800;letter-spacing:1.5px;">◈ EXECUTION BRIEF</div>
        <button onclick="generateBBFW(${idx}, true)"
          style="background:none;border:1px solid var(--border);border-radius:6px;padding:5px 10px;
          font-family:var(--vault-mono);font-size:9px;color:var(--muted);cursor:pointer;letter-spacing:0.5px;">
          ↺ Regenerate
        </button>
      </div>
      <div style="font-family:var(--vault-mono);font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:4px;">DAILY OPERATIONS</div>
      ${opsHtml}
      ${mileHtml}
    </div>`;
}

/* ── BBFW PANEL ─────────────────────────────────────────
   Backbone Framework — 6 Eternal Problems + 9 Components
───────────────────────────────────────────────────────── */
export function buildBBFWPanel(intent, idx) {
  hydrateIntent(intent);
  const bbfw = intent.bbfw;
  if (!_hasBbfw(bbfw)) {
    return `
      <div id="bbfw-loading-${idx}" style="padding:40px 20px;text-align:center;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:var(--brand);letter-spacing:2px;margin-bottom:10px;">◈ BUILDING YOUR FRAMEWORK</div>
        <div style="font-size:12px;color:var(--muted);line-height:2;">
          Connecting to your entrepreneur identity…<br>
          Mapping your friction points…<br>
          Building your executive brief…
        </div>
      </div>`;
  }
  return renderBBFW(bbfw, idx);
}

export function renderBBFW(bbfw, idx) {
  // Legacy data (v3 or older) — nudge a one-click refresh.
  const isLegacy = !bbfw._format || bbfw._format < 4;
  const legacyHtml = isLegacy
    ? `<div style="background:#2A2410;border:1px solid #5C4A12;border-radius:8px;padding:10px 12px;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
         <span style="font-size:14px;flex-shrink:0;">↺</span>
         <div style="flex:1;font-size:11px;color:#E8C76A;line-height:1.5;">Built with an older engine — refresh for the streamlined format.</div>
         <button onclick="generateBBFW(${idx}, true)" style="flex-shrink:0;background:var(--brand);border:none;border-radius:6px;padding:6px 12px;font-family:var(--vault-mono);font-size:9px;font-weight:800;color:#000;cursor:pointer;letter-spacing:0.5px;">REFRESH</button>
       </div>`
    : '';

  // Identity phrase
  const rawIdentity = (bbfw.identity_phrase || (window.activeEntCard ? `YOU ARE ${String(window.activeEntCard).toUpperCase()}` : '')).trim();
  const identityHtml = rawIdentity
    ? `<div style="font-family:var(--vault-mono);font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--brand);margin-bottom:16px;">${esc(rawIdentity)}</div>`
    : '';

  // Coaching paragraph
  const strategyHtml = (typeof bbfw.strategy_narrative === 'string' && bbfw.strategy_narrative.trim())
    ? `<p style="font-size:1rem;font-weight:500;color:var(--mid);line-height:1.6;letter-spacing:-0.01em;margin:0 0 20px;white-space:pre-wrap;">${esc(bbfw.strategy_narrative)}</p>`
    : (bbfw.eternal_problems || []).map(ep => {
        const insight = esc(ep.insight || '');
        const action  = ep.action ? `<div style="font-size:12px;color:var(--brand);margin:2px 0 14px;line-height:1.5;">→ ${esc(ep.action)}</div>` : '';
        return `<p style="font-size:1rem;font-weight:500;color:var(--mid);line-height:1.6;letter-spacing:-0.01em;margin:0 0 10px;">${insight}</p>${action}`;
      }).join('');

  // Single friction warning
  const frictionHtml = bbfw.friction_warning
    ? `<div style="border-left:3px solid #FF375F;padding:10px 14px;background:#1A0A0A;margin-bottom:4px;">
         <div style="font-family:var(--vault-mono);font-size:9px;color:#FF375F;letter-spacing:1px;margin-bottom:4px;">⚠ FRICTION POINT</div>
         <div style="font-size:12px;color:#E0A0A0;line-height:1.55;">${esc(bbfw.friction_warning)}</div>
       </div>`
    : '';

  return `
    <div style="padding:20px 24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:var(--brand);font-weight:800;letter-spacing:1.5px;">◈ STRATEGY</div>
        <button onclick="generateBBFW(${idx}, true)" id="bbfw-gen-btn-${idx}"
          style="background:none;border:1px solid var(--border);border-radius:6px;padding:5px 10px;
          font-family:var(--vault-mono);font-size:9px;color:var(--muted);cursor:pointer;letter-spacing:0.5px;">
          ↺ Regenerate
        </button>
      </div>

      ${legacyHtml}
      ${identityHtml}
      ${strategyHtml}
      ${frictionHtml}
    </div>`;
}

export async function generateBBFW(idx, force) {
  const intent = hydrateIntent(intentions[idx]);
  if (!intent) return;
  if (!force && _hasBbfw(intent.bbfw)) {
    if (selectedVaultIdx === idx) _paintStrategyPanel(idx, intent);
    return;
  }
  const btn = document.getElementById(`bbfw-gen-btn-${idx}`);
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating…'; }

  const panel = document.getElementById(`bsPanel-bbfw-${idx}`);
  const _apexSteps = [
    { t: 0,  msg: 'INITIALIZING APEX PROTOCOL: RETRIEVING EMULATED ACHIEVER SCHEMATICS…' },
    { t: 3,  msg: 'PASS 1/3: EXCAVATING ALIGNED AFFIRMATIONS & TARGET AXIS ROADMAPS…' },
    { t: 6,  msg: 'PASS 2/3: STRIPPING GENERIC NOISE. CALIBRATING STRATEGIC METRICS…' },
    { t: 9,  msg: 'PASS 3/3: WEAVING CUSTOM PERSONAL DANGER ZONES & MINDSET ARMOR SEEDS…' },
    { t: 12, msg: 'MINTING COMPLETED. ENGAGING MY GOALS.' },
  ];
  const _apexTimers = [];
  if (panel) {
    panel.innerHTML = `
      <div style="padding:40px 20px;text-align:center;">
        <div style="font-family:var(--vault-mono);font-size:10px;color:var(--brand);letter-spacing:2px;margin-bottom:16px;">◈ APEX PROTOCOL ACTIVE</div>
        <div id="apex-status-${idx}" style="font-family:var(--vault-mono);font-size:9px;color:var(--muted);letter-spacing:1px;line-height:1.8;min-height:40px;transition:opacity 0.4s;">${_apexSteps[0].msg}</div>
      </div>`;
    _apexSteps.forEach(step => {
      _apexTimers.push(setTimeout(() => {
        const el = document.getElementById(`apex-status-${idx}`);
        if (el) { el.style.opacity = '0'; setTimeout(() => { if (el) { el.textContent = step.msg; el.style.opacity = '1'; } }, 400); }
      }, step.t * 1000));
    });
  }

  try {
    const data = await ciApiJson('bbfw', { goal: intent.title, dangerZones: intent.theMap?.dangerZones || [], entrepreneurCard: window.activeEntCard || null });
    _apexTimers.forEach(clearTimeout);
    intent.bbfw = data;
    syncIntentionsToSupabase();
    if (panel) panel.innerHTML = renderBBFW(data, idx);
  } catch (e) {
    if (panel) panel.innerHTML = `
      <div style="padding:24px 20px;">
        <div style="color:#FF375F;font-family:var(--vault-mono);font-size:11px;margin-bottom:12px;">Generation failed</div>
        <div style="font-size:12px;color:var(--muted);">${esc(e.message)}</div>
        <button onclick="generateBBFW(${idx}, true)" style="margin-top:16px;background:var(--brand);color:#000;border:none;border-radius:8px;
          padding:10px 20px;font-family:var(--vault-mono);font-size:11px;font-weight:800;cursor:pointer;">Try Again</button>
      </div>`;
  }
}

/* ── CONTENT BLOCKS ─────────────────────────────────────
   Load all blocks from Supabase and inject into [data-block] elements.
   Admin: save individual blocks back.
──────────────────────────────────────────────────────── */
/* Cache of all content blocks (slug -> body) so dynamically re-rendered
   elements (e.g. the per-goal admin box) can be re-injected without a refetch.
   window.injectContentBlocks() fills every [data-block] from this cache. */
const _blockCache = {};
/* Content to show for a block — the per-user Citadel welcome overrides the admin
   dashboard-note-2 copy; every other block shows its admin body. ALL fill paths
   route through this so no path can clobber the user's override. */
/* Black "C" edit badge for the Citadel Welcome box → jumps to the My Citadel
   Welcome editor. Kept identical to editBadge('welcome') in shared/notes.js. */
const _WELCOME_EDIT_BADGE = `<button onclick="ciEditThought('welcome');event.stopPropagation();return false;" title="Edit this on My Thoughts" aria-label="Edit your Citadel welcome" class="ci-edit-badge"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>`;
function _blockContentFor(slug, body) {
  if (slug === 'dashboard-note-2') {
    const u = _citadelWelcome().trim();
    const base = u ? u.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') : (body || '');
    return base && base.trim() ? base + _WELCOME_EDIT_BADGE : base;
  }
  return body;
}
/* Admin content blocks that render inside the framed photo-card template with a
   green "B" badge (vs the user's purple "C" thought cards). The Citadel Welcome
   (dashboard-note-2) is deliberately NOT here — it stays the editable C block. */
const CARD_BLOCKS = new Set(['home-welcome', 'home-section-1', 'home-section-2', 'dashboard-inspiration']);
/* True if a content-block body is placeholder junk — a wall of one repeated character
   (e.g. "pppppp") once tags/whitespace are stripped. Lets us hide garbage instead of
   rendering it. Real copy has many distinct characters. */
function _isJunkBlock(html) {
  const txt = String(html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').replace(/&[a-z]+;/gi, '').replace(/\s+/g, '');
  if (txt.length < 8) return false;
  return new Set(txt.toLowerCase()).size <= 2;
}
/* ── INFO-BOX RICH INSERTS ────────────────────────────────────────────────────
   Admin can drop tokens into any content block; they expand to real embeds/players
   when the box renders. Tokens survive contenteditable (they're just text):
     {{video:URL}}            → responsive YouTube embed
     {{player:visualize}}     → "Take a minute to visualize" launch card
     {{player:meditate}}      → "Take a minute to meditate"
     {{player:gratitude}}     → "Take a minute to give thanks" */
function _videoEmbed(url) {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
  const src = m ? `https://www.youtube.com/embed/${m[1]}` : String(url);
  return `<div style="position:relative;padding-bottom:56.25%;height:0;border-radius:12px;overflow:hidden;margin:8px 0;"><iframe src="${esc(src)}" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allow="accelerometer;autoplay;encrypted-media;picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
}
function _playerCard(type) {
  const M = {
    visualize: { icon: '✦', label: 'Take a minute to visualize',   sub: 'Picture it done',          go: "navTo('vizlibrary')" },
    meditate:  { icon: '☾', label: 'Take a minute to meditate',    sub: 'Quiet the mind',           go: "navTo('meditation')" },
    gratitude: { icon: '❤', label: 'Take a minute to give thanks', sub: 'Appreciate what is yours', go: "navTo('gratitude')" },
    slideshow: { icon: '🎞', label: 'Take a minute — audio slideshow', sub: 'Your affirmations, on a loop', go: "encLaunch('slideshow')" },
    board:     { icon: '🖼', label: 'Open your Digital Vision Board',   sub: 'See it. Feel it. Believe it.', go: "encLaunch('board')" },
  };
  const c = M[type]; if (!c) return '';
  return `<div class="ib-player" role="button" tabindex="0" onclick="${c.go}" style="display:flex;align-items:center;gap:14px;cursor:pointer;background:#111;color:#fff;border-radius:12px;padding:14px 16px;margin:8px 0;"><span style="font-size:24px;line-height:1;flex-shrink:0;">${c.icon}</span><span style="flex:1;min-width:0;"><span style="display:block;font-weight:800;font-size:15px;">${c.label}</span><span style="display:block;font-size:12px;opacity:.72;">${c.sub}</span></span><span style="font-size:20px;opacity:.8;flex-shrink:0;">&rsaquo;</span></div>`;
}
function _expandBlockTokens(html) {
  if (!html || String(html).indexOf('{{') < 0) return html;
  return String(html)
    .replace(/\{\{video:([^}]+)\}\}/g, (m, u) => _videoEmbed(u.trim()))
    .replace(/\{\{player:(visualize|meditate|gratitude|slideshow|board)\}\}/g, (m, t) => _playerCard(t));
}
// Launch the audio slideshow / vision board for the member's first goal (or send
// them to pick one if they have none yet). Runs in app scope so `intentions` etc. resolve.
if (typeof window !== 'undefined') {
  window.encLaunch = function (what) {
    const has = (typeof intentions !== 'undefined' && intentions && intentions.length);
    if (what === 'board')     { has ? openVizGoal(0)        : (window.navTo && window.navTo('vizlibrary')); }
    else                      { has ? launchAffirmations(0) : (window.navTo && window.navTo('vizlibrary')); }
  };
}
function _fillBlockEl(el, content) {
  const hasContent = !!(content && content.trim() && !_isJunkBlock(content));
  if (hasContent) {
    if (CARD_BLOCKS.has(el.getAttribute('data-block')) && typeof window.renderBlockCard === 'function') window.renderBlockCard(el, content);
    else el.innerHTML = _expandBlockTokens(content);
    el.style.display = '';
  } else {
    el.innerHTML = '';
    el.style.display = 'none';
  }
  _syncAdminPageBox(el, hasContent);
}
if (typeof window !== 'undefined') {
  window.injectContentBlocks = function () {
    Object.keys(_blockCache).forEach(slug => {
      const body = _blockContentFor(slug, _blockCache[slug]);
      document.querySelectorAll(`[data-block="${slug}"]`).forEach(el => _fillBlockEl(el, body));
    });
    if (typeof stampContentBlockNums === 'function') stampContentBlockNums();
  };
}

/* Preview checkpoint: CI admin page-box template v1. */
/* ── PERMANENT TWO-BOX ADMIN PAGE TEMPLATE ──────────────────────────────────
   Every member workspace receives two owner-authored content boxes. Box 1 keeps
   the existing intro-note slug so previously written copy is preserved. Box 2
   uses page-note-<page>-2. Empty boxes are visible only to the owner. */
const ADMIN_PAGE_BOXES = {
  dashboard:     'CITADEL',
  setup:         'GOALS',
  habits:        'HABITS',
  myroadmap:     'ACTION PLAN',
  vizlibrary:    'VISUALIZE',
  vizgoal:       'GOAL VISUALIZATION',
  meditation:    'MEDITATION',
  dailyfocus:    'FAVORITES',
  notes:         'THOUGHTS',
  mynotes:       'JOURNAL',
  tasknotes:     'NOTES',
  goalworkspace: 'GOAL WORKSPACE',
  gratitude:     'GRATITUDE',
  wins:          'WINS',
  cosmiclibrary: 'COSMIC LIBRARY',
  entcard:       'ENTREPRENEUR LIBRARY',
  proof:         'PROOF',
  runthroughs:   'DAILY RUN-THROUGHS',
};

function _adminPageBoxSlug(pageId, boxNumber) {
  return boxNumber === 1 ? 'intro-note-' + pageId : 'page-note-' + pageId + '-2';
}

function _adminPenIcon() {
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
}

function _syncAdminPageBox(contentEl, hasContent) {
  const shell = contentEl && contentEl.closest('.ci-admin-page-box');
  if (!shell) return;
  const owner = !!window.ciOwnerAccess;
  shell.classList.toggle('is-empty', !hasContent);
  shell.classList.toggle('is-owner', owner);
  shell.style.display = (hasContent || owner) ? '' : 'none';
  if (!hasContent && owner) {
    contentEl.innerHTML = '<span class="ci-admin-page-box-placeholder">Empty — click the pen to add text.</span>';
    contentEl.style.display = '';
  }
}

function _buildLiveAdminPageBox(pageId, label, boxNumber) {
  const slug = _adminPageBoxSlug(pageId, boxNumber);
  const shell = document.createElement('section');
  shell.className = 'ci-admin-page-box';
  shell.dataset.pageBox = String(boxNumber);
  const editButton =
    '<button type="button" class="ci-admin-page-box-edit" onclick="adminEditBlock(\'' + slug + '\');event.stopPropagation()" aria-label="Edit ' + label + ' Box ' + boxNumber + '" title="Edit ' + label + ' Box ' + boxNumber + '">' +
      _adminPenIcon() +
    '</button>';
  // Permanent Block 1/2 display template: a clean white content box with no
  // title strip. Owners get the edit pen inside the lower-right border.
  shell.innerHTML =
    '<div class="ci-admin-page-box-content" data-block="' + slug + '"></div>' +
    '<span class="ci-admin-page-box-edit-slot" data-owner-only>' + editButton + '</span>';
  const content = shell.querySelector('[data-block]');
  _fillBlockEl(content, _blockCache[slug] || '');
  return shell;
}

function _pageBoxRoot(active) {
  return active.querySelector('.pg-screen, .wins-screen, .setup-page, .pg-2col-main, .pg-body-main') ||
    active.firstElementChild || active;
}

function wireAdminPageBoxes() {
  const active = document.querySelector('.page.active');
  if (!active) return;
  const pageId = active.id.replace('page-', '');
  const label = ADMIN_PAGE_BOXES[pageId];
  if (!label) return;

  let topStack = active.querySelector(':scope .ci-admin-page-box-stack--top');
  if (!topStack) {
    // Box 1 is the opening message at the top of the workspace.
    topStack = document.createElement('div');
    topStack.className = 'ci-admin-page-box-stack ci-admin-page-box-stack--top';
    topStack.setAttribute('aria-label', label + ' administrator text box 1');
    topStack.appendChild(_buildLiveAdminPageBox(pageId, label, 1));

    const pageTitle = pageId === 'dashboard' ? active.querySelector('.pg-hdr') : null;
    const anchor = active.querySelector('.page-intro-card, .ci-ph-card');
    if (pageTitle && pageTitle.parentNode) {
      // Citadel Box 1 sits directly beneath the CITADEL title.
      pageTitle.insertAdjacentElement('afterend', topStack);
    } else if (anchor && anchor.parentNode) {
      anchor.insertAdjacentElement('afterend', topStack);
    } else {
      const root = _pageBoxRoot(active);
      root.prepend(topStack);
    }
  }

  let bottomStack = active.querySelector(':scope .ci-admin-page-box-stack--bottom');
  if (!bottomStack) {
    // Box 2 is the closing message at the bottom of the workspace.
    bottomStack = document.createElement('div');
    bottomStack.className = 'ci-admin-page-box-stack ci-admin-page-box-stack--bottom';
    bottomStack.setAttribute('aria-label', label + ' administrator text box 2');
    bottomStack.appendChild(_buildLiveAdminPageBox(pageId, label, 2));
    _pageBoxRoot(active).appendChild(bottomStack);
  }

  [topStack, bottomStack].forEach(group => {
    group.querySelectorAll('[data-block]').forEach(el => {
      const slug = el.getAttribute('data-block');
      _fillBlockEl(el, _blockCache[slug] || '');
    });
  });
  if (typeof stampContentBlockNums === 'function') stampContentBlockNums();
}

function _adminEditorMarkup(pageId, label, boxNumber) {
  const slug = _adminPageBoxSlug(pageId, boxNumber);
  return '<div class="admin-block ci-page-box-admin-entry" id="adminBlock-' + slug + '">' +
    '<div class="admin-block-hd">📝 ' + label + ' BOX ' + boxNumber + ' <span class="admin-block-slug">' + slug + '</span></div>' +
    '<div class="admin-toolbar">' +
      '<button class="admin-tb-btn" onclick="adminFmt(\'' + slug + '\',\'bold\')"><b>B</b></button>' +
      '<button class="admin-tb-btn" onclick="adminFmt(\'' + slug + '\',\'italic\')"><i>I</i></button>' +
      '<button class="admin-tb-btn" onclick="adminLink(\'' + slug + '\')">🔗</button>' +
      '<button class="admin-tb-btn" onclick="adminFmt(\'' + slug + '\',\'removeFormat\')">✕</button>' +
    '</div>' +
    '<div class="admin-editor" id="admin-editor-' + slug + '" contenteditable="true" data-slug="' + slug + '"></div>' +
    '<div class="admin-block-foot">' +
      '<button class="admin-save-btn" id="admin-save-' + slug + '" onclick="saveContentBlock(\'' + slug + '\')">Save</button>' +
      '<span class="admin-save-status" id="admin-status-' + slug + '"></span>' +
    '</div>' +
  '</div>';
}

function ensureAdminPageBoxEditors() {
  const adminPage = document.querySelector('#page-admin .admin-page');
  if (!adminPage) return;
  let section = document.getElementById('adminPageBoxEditors');
  if (!section) {
    section = document.createElement('section');
    section.id = 'adminPageBoxEditors';
    section.className = 'ci-page-box-admin-section';
    section.innerHTML =
      '<div class="ci-page-box-admin-title">PAGE TEMPLATE BOXES</div>' +
      '<p class="ci-page-box-admin-help">Two editable text boxes for every member workspace: Box 1 at the top and Box 2 at the bottom. The pen opens its matching editor here. Blank boxes stay hidden from members.</p>' +
      '<div class="ci-page-box-admin-grid"></div>';
    const firstBlock = adminPage.querySelector('.admin-block');
    if (firstBlock) firstBlock.insertAdjacentElement('beforebegin', section);
    else adminPage.appendChild(section);
  }

  const grid = section.querySelector('.ci-page-box-admin-grid');
  Object.entries(ADMIN_PAGE_BOXES).forEach(([pageId, label]) => {
    for (let boxNumber = 1; boxNumber <= 2; boxNumber += 1) {
      const slug = _adminPageBoxSlug(pageId, boxNumber);
      let entry = document.getElementById('adminBlock-' + slug);
      if (!entry) {
        const holder = document.createElement('div');
        holder.innerHTML = _adminEditorMarkup(pageId, label, boxNumber);
        entry = holder.firstElementChild;
      } else {
        const header = entry.querySelector('.admin-block-hd');
        if (header) header.innerHTML = '📝 ' + label + ' BOX ' + boxNumber + ' <span class="admin-block-slug">' + slug + '</span>';
      }
      grid.appendChild(entry);
      const editor = document.getElementById('admin-editor-' + slug);
      if (editor && !editor.dataset.dirty) editor.innerHTML = _blockCache[slug] || '';
    }
  });

  if (typeof numberContentBlocks === 'function') numberContentBlocks();
}

function ensureAdminPageBoxStyles() {
  if (document.getElementById('ciAdminPageBoxStyles')) return;
  const style = document.createElement('style');
  style.id = 'ciAdminPageBoxStyles';
  style.textContent = `
    .ci-admin-page-box-stack{display:grid;grid-template-columns:1fr;gap:10px;margin:0 0 16px}
    .ci-admin-page-box-stack--bottom{margin:18px 0 0}
    .ci-admin-page-box{position:relative;box-sizing:border-box;background:#fff;border:1px solid #d9dee5;border-radius:12px;color:#171717;box-shadow:0 5px 18px rgba(18,32,55,.06);overflow:hidden}
    .ci-admin-page-box-edit{width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;border:1px solid #111;border-radius:8px;background:#fff;color:#111;cursor:pointer;padding:0}
    .ci-admin-page-box-edit:hover,.ci-admin-page-box-edit:focus-visible{background:#f1c40f;outline:2px solid #111;outline-offset:2px}
    .ci-admin-page-box-content{min-height:48px;padding:15px 52px 52px 18px;font-size:15px;line-height:1.6;overflow-wrap:anywhere}
    .ci-admin-page-box-edit-slot{display:none;position:absolute;right:12px;bottom:12px;z-index:2}
    .ci-admin-page-box.is-owner .ci-admin-page-box-edit-slot{display:block}
    .ci-admin-page-box-placeholder{color:#727272;font-style:italic}
    .ci-page-box-admin-section{margin:0 0 28px;padding:18px;background:#0f0f0f;border:1px solid #343434;border-radius:14px}
    .ci-page-box-admin-title{color:#fff;font-size:18px;font-weight:900;letter-spacing:.08em}
    .ci-page-box-admin-help{margin:6px 0 16px;color:#a8a8a8;font-size:13px;line-height:1.55}
    .ci-page-box-admin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .ci-page-box-admin-grid .admin-block{margin:0;min-width:0}
    .ci-page-box-admin-grid .admin-editor{background:#242424!important;color:#fff!important;caret-color:#fff!important}
    .ci-page-box-admin-grid .admin-editor *{color:inherit!important}
    .ci-page-box-admin-grid .ib-preview-body{background:#fff!important;color:#111!important}
    .ci-page-box-admin-grid .ib-preview-body *{color:#111!important}
    @media(max-width:700px){
      .ci-admin-page-box-stack{gap:8px;margin-bottom:12px}
      .ci-admin-page-box-content{min-height:44px;padding:13px 54px 56px 14px;font-size:14px}
      .ci-admin-page-box-edit-slot{right:10px;bottom:10px}
      .ci-admin-page-box-edit{width:34px;height:34px}
      .ci-page-box-admin-section{padding:12px}
      .ci-page-box-admin-grid{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);
}

if (typeof window !== 'undefined') {
  ensureAdminPageBoxStyles();
  // Preserve the existing showPage hook name while upgrading it to two boxes.
  window.wireInfoBoxAdmin = wireAdminPageBoxes;
  window.ensureAdminPageBoxEditors = ensureAdminPageBoxEditors;
}

/* ── CONTENT-BLOCK NUMBERING (refinement aid) ─────────────────────────────────
   Number every editor in the Admin "Content Blocks" section (1..N in page order)
   and stamp the SAME number onto each block's live box on the site (data-cbnum →
   a #N badge via CSS when body.cbnums is set). Lets Scott match a box on a page
   to its Admin editor. Numbers auto-follow the Admin DOM order — add/remove a
   block and everything renumbers on next load. */
// Which page each content block lives on (so the Admin header can jump to it).
// intro-note-<page> maps to its page automatically; the rest are listed here.
function _blockPage(slug) {
  if (slug.indexOf('intro-note-') === 0) return slug.slice('intro-note-'.length);
  const pageBoxMatch = slug.match(/^page-note-(.+)-2$/);
  if (pageBoxMatch) return pageBoxMatch[1];
  const M = {
    'home-welcome': 'home', 'home-section-1': 'home', 'home-section-2': 'home',
    'home-video-1': 'dashboard', 'dashboard-note-2': 'dashboard',
    'my-goals-note': 'dashboard', 'goal-viz-note': 'dashboard', 'dashboard-inspiration': 'dashboard',
    'proof-wall': 'proof',
  };
  return M[slug] || null;   // NOT-PLACED blocks (shows nowhere yet) return null
}
// Jump from the Admin editor to the block's live box on the site + flash it.
function adminGoToBlock(slug) {
  const page = _blockPage(slug);
  if (!page) { if (typeof toast === 'function') toast('Block "' + slug + '" isn\'t placed on a page yet.', ''); return; }
  if (typeof window.navTo === 'function') window.navTo(page);
  setTimeout(() => {
    const el = document.querySelector('#page-' + page + ' [data-block="' + slug + '"]');
    if (!el) { if (typeof toast === 'function') toast('Placed on "' + page + '", but its box isn\'t on screen right now.', ''); return; }
    // If the box is empty (hidden), briefly reveal a placeholder so you can SEE its spot.
    if (getComputedStyle(el).display === 'none') {
      el.style.display = '';
      if (!el.textContent.trim()) {
        el.dataset._ph = '1';
        el.innerHTML = '<span style="opacity:.55;font-style:italic">Empty — add text in Admin block #' + ((window.BLOCK_NUM && window.BLOCK_NUM[slug]) || '?') + '</span>';
      }
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('cb-flash');
    setTimeout(() => {
      el.classList.remove('cb-flash');
      if (el.dataset._ph) { delete el.dataset._ph; el.innerHTML = ''; el.style.display = 'none'; }
    }, 3000);
  }, 500);
}
if (typeof window !== 'undefined') window.adminGoToBlock = adminGoToBlock;

function numberContentBlocks() {
  const blocks = document.querySelectorAll('[id^="adminBlock-"]');
  const map = {};
  blocks.forEach((el, i) => {
    const n = i + 1;
    const slug = el.id.replace('adminBlock-', '');
    map[slug] = n;
    const hd = el.querySelector('.admin-block-hd');
    if (hd) {
      let chip = hd.querySelector('.admin-block-num');
      if (!chip) {
        chip = document.createElement('span');
        chip.className = 'admin-block-num';
      }
      chip.textContent = n;
      if (hd.firstChild !== chip) hd.insertBefore(chip, hd.firstChild);
    }
    // Make the header a link to where the block appears (if it's placed).
    if (hd && !hd.dataset.linked && _blockPage(slug)) {
      hd.dataset.linked = '1';
      hd.classList.add('cb-hd-link');
      hd.title = 'Click to jump to where this block appears on the site';
      hd.addEventListener('click', () => adminGoToBlock(slug));
    }
  });
  window.BLOCK_NUM = map;
  stampContentBlockNums();
}
function stampContentBlockNums() {
  const map = window.BLOCK_NUM; if (!map) return;
  document.querySelectorAll('[data-block]').forEach(el => {
    const n = map[el.getAttribute('data-block')];
    if (n && el.getAttribute('data-cbnum') != n) el.setAttribute('data-cbnum', n);
  });
}
if (typeof window !== 'undefined') {
  window.numberContentBlocks = numberContentBlocks;
  window.stampContentBlockNums = stampContentBlockNums;
}

/* Admin inserts — drop a token into a content-block editor at the caret. */
function _adminInsertAtCaret(slug, text) {
  const ed = document.getElementById('admin-editor-' + slug);
  if (!ed) return;
  ed.focus();
  try { if (!document.execCommand('insertText', false, text)) ed.innerHTML += text; }
  catch (e) { ed.innerHTML += text; }
  ed.dispatchEvent(new Event('input', { bubbles: true }));
}
export function adminInsertVideo(slug) {
  const url = window.prompt('Paste a YouTube (or video) link to embed in this box:');
  if (url && url.trim()) _adminInsertAtCaret(slug, ' {{video:' + url.trim() + '}} ');
}
export function adminInsertPlayer(slug, type) { _adminInsertAtCaret(slug, ' {{player:' + type + '}} '); }
/* Insert the classic info-box layout: a full-width paragraph, then two columns of
   bullets below (the old intro-card format). Editable HTML the admin fills in. */
export function adminInsertCols(slug) {
  const ed = document.getElementById('admin-editor-' + slug);
  if (!ed) return;
  const tpl = '<p>Write your intro here &mdash; this spans the full width.</p>' +
    '<div class="ib-2col"><ul><li>Point one</li><li>Point two</li><li>Point three</li></ul>' +
    '<ul><li>Point four</li><li>Point five</li><li>Point six</li></ul></div><p><br></p>';
  ed.focus();
  try { if (!document.execCommand('insertHTML', false, tpl)) ed.innerHTML += tpl; }
  catch (e) { ed.innerHTML += tpl; }
  ed.dispatchEvent(new Event('input', { bubbles: true }));
}
/* Add the "2 Columns" layout button to EVERY content-block toolbar. */
function addColsButtonToToolbars() {
  document.querySelectorAll('[id^="adminBlock-"] .admin-toolbar').forEach(tb => {
    if (tb.dataset.colsBtn) return;
    const holder = tb.closest('[id^="adminBlock-"]'); if (!holder) return;
    tb.dataset.colsBtn = '1';
    const slug = holder.id.replace('adminBlock-', '');
    const b = document.createElement('button');
    b.className = 'admin-tb-btn admin-tb-insert'; b.type = 'button';
    b.setAttribute('onclick', "adminInsertCols('" + slug + "')");
    b.textContent = '▤ 2 Columns';
    tb.appendChild(b);
  });
}
if (typeof window !== 'undefined') { window.adminInsertCols = adminInsertCols; window.addColsButtonToToolbars = addColsButtonToToolbars; }
/* Add the rich-insert buttons + a LIVE PREVIEW to every info-box (intro-note-*)
   editor. The preview renders the box exactly as members will see it (tokens
   expanded), so the admin never has to think about raw HTML/tokens. */
function enhanceInfoBoxToolbars() {
  document.querySelectorAll('[id^="adminBlock-intro-note-"]').forEach(holder => {
    if (holder.dataset.ibEnhanced) return;
    const slug = holder.id.replace('adminBlock-', '');
    const tb = holder.querySelector('.admin-toolbar');
    const ed = document.getElementById('admin-editor-' + slug);
    if (!tb || !ed) return;
    holder.dataset.ibEnhanced = '1';
    // 1) Rich-insert buttons.
    const grp = document.createElement('span');
    grp.className = 'admin-tb-inserts';
    [['🎬 Video', "adminInsertVideo('" + slug + "')"],
     ['✦ Visualize', "adminInsertPlayer('" + slug + "','visualize')"],
     ['☾ Meditate', "adminInsertPlayer('" + slug + "','meditate')"],
     ['❤ Give thanks', "adminInsertPlayer('" + slug + "','gratitude')"],
     ['🎞 Slideshow', "adminInsertPlayer('" + slug + "','slideshow')"],
     ['🖼 Vision Board', "adminInsertPlayer('" + slug + "','board')"]].forEach(([label, onclick]) => {
      const b = document.createElement('button');
      b.className = 'admin-tb-btn admin-tb-insert'; b.type = 'button';
      b.setAttribute('onclick', onclick); b.textContent = label;
      grp.appendChild(b);
    });
    tb.appendChild(grp);
    // 2) Live preview under the editor.
    const prev = document.createElement('div');
    prev.className = 'ib-preview';
    prev.innerHTML = '<div class="ib-preview-label">Live preview &mdash; how this info box will look</div><div class="ib-preview-body page-intro-card"></div>';
    ed.insertAdjacentElement('afterend', prev);
    const body = prev.querySelector('.ib-preview-body');
    const render = () => { const html = _expandBlockTokens(ed.innerHTML || ''); body.innerHTML = html; body.style.display = (html && html.replace(/<[^>]*>/g, '').trim()) || /<(iframe|img|div|button)/i.test(html) ? '' : 'none'; };
    ed.addEventListener('input', render);
    render();
  });
}
if (typeof window !== 'undefined') {
  window.adminInsertVideo = adminInsertVideo;
  window.adminInsertPlayer = adminInsertPlayer;
  window.enhanceInfoBoxToolbars = enhanceInfoBoxToolbars;
}

// Jump FROM a numbered box on the site TO its editor on the Admin page (reverse of
// adminGoToBlock). Scroll to it, flash it, focus the editor for a quick edit.
function adminEditBlock(slug) {
  if (typeof window.navTo === 'function') window.navTo('admin');
  setTimeout(() => {
    const ab = document.getElementById('adminBlock-' + slug);
    if (!ab) return;
    ab.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ab.classList.add('cb-flash');
    setTimeout(() => ab.classList.remove('cb-flash'), 3000);
    const ed = document.getElementById('admin-editor-' + slug);
    if (ed) ed.focus();
  }, 400);
}
if (typeof window !== 'undefined') {
  window.adminEditBlock = adminEditBlock;
  // Refinement view only: clicking any numbered content box jumps to its Admin
  // editor. Delegated so it works for boxes injected/re-rendered at any time.
  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('cbnums')) return;
    const box = e.target.closest('[data-block][data-cbnum]');
    if (!box) return;
    if (e.target.closest('a,button,input,select,textarea')) return;   // don't hijack real controls inside
    adminEditBlock(box.getAttribute('data-block'));
  });
}

async function loadContentBlocks() {
  const { data, error } = await sb.from('content_blocks').select('slug, body');
  if (error || !data) return;
  data.forEach(({ slug, body }) => {
    _blockCache[slug] = body || '';
    if (slug && slug.startsWith('lib_')) _libCache[slug] = body || '';   // recitation libraries
    // Inject into display elements
    document.querySelectorAll(`[data-block="${slug}"]`).forEach(el => {
      _fillBlockEl(el, _blockContentFor(slug, body));
    });
    // Pre-fill admin editors
    const ed = document.getElementById(`admin-editor-${slug}`);
    if (ed && !ed.dataset.dirty) ed.innerHTML = body || '';
    // Pre-fill notes page fields — parse bold line + body
    const boldEl = document.getElementById(`nb-bold-${slug}`);
    const bodyEl = document.getElementById(`nb-body-${slug}`);
    if (boldEl && bodyEl && body) {
      const m = body.match(/^<strong>([\s\S]*?)<\/strong>(?:<br><br>)?([\s\S]*)$/i);
      if (m) {
        boldEl.value = m[1].trim();
        bodyEl.value = m[2].trim();
      } else {
        bodyEl.value = body.replace(/<[^>]+>/g, '').trim();
      }
    }
  });
  applyNoteBlobs();
  applyUserCitadelWelcome();   // per-user welcome overrides the admin default
}

/* ── PER-USER CITADEL WELCOME ─────────────────────────────────────────────
   Users can't edit admin content blocks, but they CAN write their own opening
   message for Column A of the Inner Citadel (edited in My Thoughts). When set,
   it overrides the admin home-video-1 block; blank = fall back to admin copy. */
function _citadelWelcome() { try { return localStorage.getItem('ci_citadel_welcome') || ''; } catch (e) { return ''; } }
function applyUserCitadelWelcome() {
  const v = _citadelWelcome().trim();
  // The visible first paragraph in Column A is the dashboard-note-2 box.
  document.querySelectorAll('[data-block="dashboard-note-2"]').forEach(el => {
    if (v) {
      el.innerHTML = v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + _WELCOME_EDIT_BADGE;
      el.style.display = '';
    } else {
      const admin = _blockCache['dashboard-note-2'] || '';
      const showAdmin = admin.trim() && !_isJunkBlock(admin);
      el.innerHTML = showAdmin ? admin + _WELCOME_EDIT_BADGE : '';
      el.style.display = showAdmin ? '' : 'none';
    }
  });
  const inp = document.getElementById('citadelWelcomeInput');
  if (inp && document.activeElement !== inp) inp.value = _citadelWelcome();
}
export function saveCitadelWelcome(el) {
  const v = ((el && el.value) || '').slice(0, 2000);
  try { localStorage.setItem('ci_citadel_welcome', v); } catch (e) {}
  applyUserCitadelWelcome();
  if (typeof toast === 'function') toast(v.trim() ? 'Your Citadel welcome saved ✓' : 'Reverted to the default welcome', 'success');
}

/* Cycle the 3 blob backgrounds (green / red / orange) across all note boxes
   in document order so the My Notes postings vary instead of all-green. */
function applyNoteBlobs() {
  document.querySelectorAll('.cb-display').forEach((el, i) => {
    el.classList.remove('cb-blob-1', 'cb-blob-2', 'cb-blob-3');
    el.classList.add('cb-blob-' + ((i % 3) + 1));
  });
}


export async function saveContentBlock(slug) {
  const ed  = document.getElementById(`admin-editor-${slug}`);
  const btn = document.getElementById(`admin-save-${slug}`);
  const st  = document.getElementById(`admin-status-${slug}`);
  if (!ed || !btn) return;
  const body = ed.innerHTML.trim();
  _blockCache[slug] = body;   // keep cache fresh so re-renders re-inject the new content
  btn.disabled = true; btn.textContent = 'Saving…';
  st.textContent = '';
  const { error } = await sb.from('content_blocks')
    .upsert({ slug, body, updated_at: new Date().toISOString() }, { onConflict: 'slug' });
  if (error) {
    btn.textContent = 'Save'; btn.disabled = false;
    st.textContent = '✗ Error — ' + error.message;
    return;
  }
  btn.textContent = 'Save'; btn.disabled = false;
  st.textContent = '✓ Saved';
  setTimeout(() => { st.textContent = ''; }, 3000);
  // Push live immediately to any display elements on page.
  // _fillBlockEl also keeps the reusable two-box page template in sync.
  document.querySelectorAll(`[data-block="${slug}"]`).forEach(el => {
    _fillBlockEl(el, body);
  });
}

/* ── ADMIN PHOTO UPLOAD ─────────────────────────────────────────
   Upload a photo for a content block (e.g. the Inspiration champion).
   Uses the public 'content-images' bucket for owner-authored editorial media. Inserts the <img>
   at the top of the block's editor; the admin then writes the story
   below and hits Save (saveContentBlock persists the whole HTML). */
export function adminUploadPhoto(slug) {
  const input = document.getElementById(`admin-photo-input-${slug}`);
  if (input) input.click();
}
export async function adminPhotoSelected(slug, inputEl) {
  const file = inputEl && inputEl.files && inputEl.files[0];
  if (!file) return;
  const st = document.getElementById(`admin-status-${slug}`);
  const ed = document.getElementById(`admin-editor-${slug}`);
  const setSt = m => { if (st) st.textContent = m; };
  try {
    if (!currentUser || !sb) return setSt('✗ Not signed in');
    if (!/^image\//.test(file.type)) return setSt('✗ Pick an image file');
    if (file.size > 8 * 1024 * 1024) return setSt('✗ Image too big (max 8MB)');
    setSt('Uploading photo…');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const path = `${currentUser.id}/${slug}-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from('content-images').upload(path, bytes, { contentType: file.type, upsert: true });
    if (error) throw error;
    const { data } = sb.storage.from('content-images').getPublicUrl(path);
    const url = data && data.publicUrl;
    if (!url) throw new Error('no public URL');
    if (ed) ed.innerHTML = `<img src="${url}" alt="" style="max-width:100%;border-radius:10px;display:block;margin:0 0 10px;">` + ed.innerHTML;
    setSt('✓ Photo added — write the story below, then Save');
  } catch (e) {
    setSt('✗ Upload failed — ' + (e && e.message ? e.message : e));
  } finally {
    if (inputEl) inputEl.value = '';
  }
}

/* ── AI CONTROL ROOM — live-editable AI prompts (stored in content_blocks) ──
   Resolution at call time (in the function): request override > Supabase > default.
   Defaults come from the function itself (mode:'defaults') so there's ONE source. */
let _promptDefaults = null;
const _PROMPT_SLUGS = { 'prompt_roadmap_system': 'system', 'prompt_roadmap_user': 'user' };

export async function loadAIPrompts() {
  if (!_promptDefaults) {
    try { _promptDefaults = await window.ciApiJson('roadmap-ai', { mode: 'defaults' }); }
    catch (e) { _promptDefaults = { system: '', user: '' }; }
  }
  let saved = {};
  try {
    const { data } = await sb.from('content_blocks').select('slug, body').in('slug', Object.keys(_PROMPT_SLUGS));
    (data || []).forEach(r => { saved[r.slug] = r.body || ''; });
  } catch (e) {}
  Object.keys(_PROMPT_SLUGS).forEach(slug => {
    const ta = document.getElementById(`prompt-editor-${slug}`);
    if (!ta) return;
    const override = (saved[slug] || '').trim();
    ta.value = override || (_promptDefaults[_PROMPT_SLUGS[slug]] || '');
    ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px';   // grow to fit — no scroll box
  });
}

export async function savePrompt(slug) {
  const ta  = document.getElementById(`prompt-editor-${slug}`);
  const btn = document.getElementById(`prompt-save-${slug}`);
  const st  = document.getElementById(`prompt-status-${slug}`);
  if (!ta) return;
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  const { error } = await sb.from('content_blocks')
    .upsert({ slug, body: ta.value, updated_at: new Date().toISOString() }, { onConflict: 'slug' });
  if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
  if (st) { st.textContent = error ? ('✗ ' + error.message) : '✓ Saved — live now'; setTimeout(() => { if (st) st.textContent = ''; }, 3500); }
}

export async function resetPrompt(slug) {
  const ta = document.getElementById(`prompt-editor-${slug}`);
  if (!ta || !_promptDefaults) return;
  ta.value = _promptDefaults[_PROMPT_SLUGS[slug]] || '';
  ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px';
  await sb.from('content_blocks').upsert({ slug, body: '', updated_at: new Date().toISOString() }, { onConflict: 'slug' });
  const st = document.getElementById(`prompt-status-${slug}`);
  if (st) { st.textContent = '↺ Reset to default'; setTimeout(() => { if (st) st.textContent = ''; }, 3500); }
}

export async function testRoadmapPrompt() {
  const out  = document.getElementById('prompt-test-out');
  const goal = (document.getElementById('prompt-test-goal')?.value || '').trim();
  const userActions = (document.getElementById('prompt-test-notes')?.value || '').split('\n').map(x => x.trim()).filter(Boolean);
  const systemOverride = document.getElementById('prompt-editor-prompt_roadmap_system')?.value || '';
  const userOverride   = document.getElementById('prompt-editor-prompt_roadmap_user')?.value || '';
  if (!goal) { if (out) out.innerHTML = '<span style="color:#FF375F">Enter a sample goal to test.</span>'; return; }
  if (out) out.innerHTML = '<span style="color:#999">Running your prompts against gpt-4o…</span>';
  try {
    const data = await window.ciApiJson('roadmap-ai', { intention: goal, userActions, systemOverride, userOverride });
    const tasks = (data && data.tasks) || [];
    if (out) out.innerHTML = tasks.length
      ? '<ol style="margin:0;padding-left:20px;line-height:1.6;color:#eee;">' + tasks.map(t => `<li>${esc(t)}</li>`).join('') + '</ol>'
      : '<span style="color:#FF375F">No tasks returned.</span>';
  } catch (e) {
    if (out) out.innerHTML = `<span style="color:#FF375F">Test failed: ${esc(e.message)}</span>`;
  }
}

export function adminFmt(slug, cmd) {
  const ed = document.getElementById(`admin-editor-${slug}`);
  if (!ed) return;
  ed.focus();
  document.execCommand(cmd, false, null);
  ed.dataset.dirty = '1';
}

export function adminLink(slug) {
  const ed = document.getElementById(`admin-editor-${slug}`);
  if (!ed) return;
  const url = prompt('Enter URL:');
  if (!url) return;
  ed.focus();
  document.execCommand('createLink', false, url);
  ed.dataset.dirty = '1';
}

/* ── ROADMAP PANEL (with Proven Paths + Tactical Log) ── */
function buildBSRoadmapPanel(intent, idx) {
  let roadmapHTML = '';
  if (!intent.achievers) {
    roadmapHTML = `
      <div class="bs-section">
        <div class="bs-section-hd">◈ AI ROADMAP</div>
        <p style="padding:8px 20px 4px;font-size:13px;color:var(--muted);line-height:1.6">
          Generate a personalized 7-step action strategy for this intention.
        </p>
        <button class="bs-gen-btn" id="bsRoadmapBtn-${idx}"
          onclick="bsGenerateRoadmap(${idx})">✦ Generate AI Roadmap</button>
      </div>`;
  } else {
    const steps = Array.isArray(intent.achievers.roadmap) ? intent.achievers.roadmap : [];
    const items = steps.map((s, i) =>
      `<li class="bs-roadmap-item">
        <span class="bs-roadmap-num">${i+1}</span>
        <span class="bs-roadmap-text">${esc(s)}</span>
       </li>`).join('');
    roadmapHTML = `
      <div class="bs-section">
        <div class="bs-section-hd">◈ AI ROADMAP
          <button class="bs-section-hd-action" onclick="bsGenerateRoadmap(${idx})">↺ Regenerate</button>
        </div>
        <ul class="bs-roadmap-list">${items}</ul>
      </div>`;
  }
  return roadmapHTML;
}

/* ── AI LIBRARY PANEL ───────────────────────────────── */
function buildBSLibraryPanel(intent, idx) {
  if (!intent.mindset) {
    return `
      <div class="bs-section" style="border-bottom:none">
        <div class="bs-section-hd">✦ AI LIBRARY</div>
        <p style="padding:8px 20px 4px;font-size:13px;color:var(--muted);line-height:1.6">
          Generate personalized affirmations, beliefs, attitudes &amp; meditation for this intention.
        </p>
        <button class="bs-gen-btn" id="bsLibraryBtn-${idx}"
          onclick="bsGenerateLibrary(${idx})">✦ Generate AI Library</button>
      </div>`;
  }
  const m = intent.mindset;
  const pills = (m.affirmations||[]).map(a => `<span class="bs-affirmation-pill">${esc(a)}</span>`).join('');
  const beliefs = (m.beliefs||[]).map(b =>
    `<div class="bs-belief-item"><span class="bs-belief-arrow">→</span>${esc(b)}</div>`).join('');
  const attitudes = (m.attitudes||[]).map(a =>
    `<div class="bs-attitude-card">
       <div class="bs-attitude-title">${esc(a.title||a)}</div>
       <div class="bs-attitude-body">${esc(a.body||'')}</div>
     </div>`).join('');

  return `
    <div class="bs-section">
      <div class="bs-section-hd">AFFIRMATIONS
        <button class="bs-section-hd-action" onclick="bsGenerateLibrary(${idx})">↺ Regenerate</button>
      </div>
      <div class="bs-affirmation-pills">${pills}</div>
    </div>
    <div class="bs-section">
      <div class="bs-section-hd">BELIEFS</div>
      ${beliefs}
    </div>
    <div class="bs-section">
      <div class="bs-section-hd">ATTITUDES</div>
      ${attitudes}
    </div>
    ${m.meditation ? `
    <div class="bs-section" style="border-bottom:none">
      <div class="bs-section-hd">MEDITATION</div>
      <div class="bs-meditation-box">${esc(m.meditation)}</div>
    </div>` : ''}
  `;
}

/* ── PEGBOARD PANEL ─────────────────────────────────── */
function buildBSPegboardPanel(intent) {
  const pb = getPB();
  const fields = [
    { label: 'Name',              value: pb['pb-name']      },
    { label: 'Life Mission',      value: pb['pb-mission']   },
    { label: 'Life Goal',         value: pb['pb-lifegol']   },
    { label: 'Core Values',       value: pb['pb-values']    },
    { label: 'Beliefs',           value: pb['pb-beliefs']   },
    { label: 'Win. Attitudes',    value: pb['pb-attitudes'] },
    { label: 'Traits',            value: pb['pb-traits']    },
    { label: 'Stoic Principles',  value: pb['pb-stoicism']  },
  ];
  const rows = fields.map(f => f.value
    ? `<div class="bs-pb-row">
         <div class="bs-pb-label">${f.label}</div>
         <div class="bs-pb-value">${esc(f.value)}</div>
       </div>` : '').join('');
  const empty = fields.every(f => !f.value);
  const launchBtn = '';
  return (empty
    ? `<div style="padding:20px;font-size:13px;color:var(--muted);line-height:1.6">
         Your Pegboard is empty.
         <button style="color:var(--accent);background:none;border:none;cursor:pointer;font-size:13px;font-family:inherit"
           onclick="navTo('setup')">Fill in My Pegboard →</button>
       </div>`
    : rows) + launchBtn;
}

/* ── BS AI GENERATION WRAPPERS ──────────────────────── */
/* the-map.js */



/* activity.js */

/* ─────────────────────────────────────────────────────────
   REVIEW-ONLY DASHBOARD PREVIEW
   Lets us load the auth-gated dashboard with sample data for visual QA.
   It can activate only on localhost or this site's password-protected Netlify
   deploy-preview host, and only when the URL includes ?preview=1.
   Production cosmicintentions.com can never match this guard.
───────────────────────────────────────────────────────── */
function _previewActive() {
  const host = location.hostname;
  const local = host === 'localhost' || host === '127.0.0.1';
  const netlifyReview = /^deploy-preview-\d+--gilded-profiterole-47a2eb\.netlify\.app$/.test(host);
  const flag = new URLSearchParams(location.search).has('preview');
  return (local || netlifyReview) && flag;
}

function _seedPreviewDashboard() {
  // Fake, logged-out "user" — never touches Supabase.
  currentUser = { id: 'preview', email: 'preview@localhost',
    user_metadata: { full_name: 'Preview User' }, created_at: new Date().toISOString() };
  updateUI(currentUser);

  // Sample goals so the colored goal boxes AND MY TASK LIST both render.
  const mk = (id, title, cat, tasks, userTasks) => ({
    id, title, category: cat,
    roadmapAI: { intention: title, tasks, done: {}, locks: {}, userTasks: userTasks || [] },
    mindset: { affirmations: [`I embody: ${title}.`], beliefs: [] },
  });
  intentions = [
    mk('pv1', 'I AM LAUNCHING COSMIC INTENTIONS GLOBALLY THIS SEPTEMBER', 'Career',
      ['Analyze the profiles of your earliest subscription buyers.',
       'Ship the public landing page and start collecting emails.',
       'Record a 90-second launch teaser.'],
      [{ id: 1, text: 'Draft the launch announcement', done: false }]),
    mk('pv2', 'I AM PERFECT EYE HEALTH', 'Health',
      ['Do 5 minutes of eye exercises.', 'Take a screen break every hour.'], []),
    mk('pv3', 'I AM THE PROUD OWNER OF A XIAOMI SU7', 'Lifestyle',
      ['Set aside the monthly savings target.', 'Book a test drive this month.'], []),
  ];

  renderDashboard();
  if (typeof renderTodayView === 'function') renderTodayView();
  if (typeof window !== 'undefined' && typeof window.renderWrapup === 'function') window.renderWrapup();
  navTo('dashboard');
  if (typeof toast === 'function') toast('👁 PREVIEW MODE — localhost only, not signed in', '');
}

/* ─────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────── */
/* Shared orientation card — added at the TOP (under the title) on
   BOTTOM of the listed member pages. Same soft-card style as My Roadmap. The
   copy lives here in one place; injected additively so no page markup changes. */
function _makePhCard() {
  const card = document.createElement('div');
  card.className = 'ci-ph-card';
  card.style.cssText = 'background:var(--off,#F5F5F5);border:1px solid var(--border,#E6E8EB);border-radius:14px;padding:22px 24px;margin:18px 0;';
  card.innerHTML =
    '<p style="margin:0 0 14px;max-width:680px;color:var(--text);font-size:15px;line-height:1.6;opacity:.9;">Use this workspace to capture what matters, work with it inside the LFM player, and return to it as your direction evolves.</p>' +
    '<div style="display:flex;gap:24px;flex-wrap:wrap;">' +
      '<div style="flex:1;min-width:240px;"><ul style="margin:0;padding-left:20px;color:var(--text);font-size:14px;line-height:1.9;"><li>Add or edit your own entries</li><li>Keep your language personal</li><li>Use the player to review it</li><li>Save changes before leaving</li><li>Return as your priorities change</li></ul></div>' +
      '<div style="flex:1;min-width:240px;"><ul style="margin:0;padding-left:20px;color:var(--text);font-size:14px;line-height:1.9;"><li>Back returns to the Citadel</li><li>LFM Menu opens every workspace</li><li>Next moves forward</li><li>AI assistance is optional</li><li>Your words remain the source</li></ul></div>' +
    '</div>';
  return card;
}
function injectPlaceholderCards() {
  if (document.querySelector('.ci-ph-card')) return;   // inject once
  // Per-page anchor: the top card goes right AFTER this element (the title/header).
  const cfg = {
    notes:       '#page-notes .pg-intro',
    setup:       '#page-setup .setup-page-header',
    habits:      '#page-habits .setup-page-header',
    vizlibrary:  '#page-vizlibrary .pg-intro',
    runthroughs: '#page-runthroughs .pg-intro',
    wins:        '#page-wins .wins-intro',
  };
  Object.keys(cfg).forEach(id => {
    const page = document.getElementById('page-' + id);
    if (!page) return;
    // On the framed pages the content lives in the white .pg-screen/.wins-screen,
    // not the outer frame — inject there so the cards sit in the content, not the frame edge.
    const wrap = page.querySelector('.viz-main, .pg-screen, .wins-screen') || page.firstElementChild || page;
    const anchor = page.querySelector(cfg[id]);
    if (anchor) anchor.insertAdjacentElement('afterend', _makePhCard());   // the info box, under the title
    else wrap.insertBefore(_makePhCard(), wrap.firstChild);
    // (bottom placeholder card removed — one admin-controlled info box per page)
  });
}

export async function init() {
  // Shared read-only roadmap link (?r=<encoded>) — render a standalone public view and
  // stop normal boot. No auth, no data stored server-side (the roadmap rides in the link).
  const _shared = new URLSearchParams(location.search).get('r');
  if (_shared) { try { renderSharedRoadmap(_shared); } catch (e) {} return; }
  // Load local data first
  loadIntentionsFromLS();
  // Non-critical UI setup must NOT abort boot — an uncaught throw here skips the
  // session restore below and logs the user out on every load (root cause of the
  // "have to sign in every time" bug: selectPlan crashed on a missing element).
  try { injectPlaceholderCards(); } catch (e) { console.error('[init] injectPlaceholderCards:', e); }

  // One-time self-heal: an older build stored base64 vision images in
  // ci_intentions_*, blowing the ~5MB quota. A full quota blocks Supabase from
  // writing its auth token → logout on every refresh. Compact every intentions
  // store (strip data: URLs) BEFORE the getSession() call below so the token can
  // persist again. Harmless once stores are already lean.
  try {
    Object.keys(localStorage)
      .filter(k => k === 'ci_intentions' || k.startsWith('ci_intentions_'))
      .forEach(k => { const v = LS.get(k); if (Array.isArray(v) && v.length) LS.set(k, _leanForLS(v)); });
  } catch (e) {}

  // Inject daily rotating content
  const _dashAff = document.getElementById('dashDailyAffirmation');
  if (_dashAff) _dashAff.innerHTML = getDailyLine('dashboard-sub');
  const _homeBanner = document.getElementById('homeQuoteBanner');
  if (_homeBanner) _homeBanner.innerHTML = getDailyLine('home-banner');

  // Pre-select annual plan in upgrade modal
  try { selectPlan('annual'); } catch (e) { console.error('[init] selectPlan:', e); }

  const _preview = _previewActive();
  if (_preview) {
    const _previewParams = new URLSearchParams(location.search);
    const _qaWidth = Number.parseInt(_previewParams.get('qaWidth') || '', 10);
    if (Number.isInteger(_qaWidth) && _qaWidth >= 320 && _qaWidth <= 1400) {
      document.documentElement.style.width = _qaWidth + 'px';
      document.documentElement.style.margin = '0 auto';
      const _qaDashboard = document.getElementById('page-dashboard');
      if (_qaDashboard) {
        _qaDashboard.style.setProperty('width', _qaWidth + 'px', 'important');
        _qaDashboard.style.setProperty('max-width', _qaWidth + 'px', 'important');
        _qaDashboard.querySelectorAll('.pg-frame, .pg-bezel, .pg-screen, .vault-layout, .vault-main').forEach((el) => {
          el.style.setProperty('width', _qaWidth + 'px', 'important');
          el.style.setProperty('max-width', _qaWidth + 'px', 'important');
          el.style.setProperty('margin-left', '0', 'important');
          el.style.setProperty('margin-right', '0', 'important');
        });
      }
    }
    _seedPreviewDashboard();
    // Deep-link to any page for review verification: ?preview=1&page=vizlibrary
    const _pg = _previewParams.get('page');
    if (_pg) setTimeout(() => { try { (window.navTo || showPage)(_pg); } catch (e) { try { showPage(_pg); } catch (e2) {} } }, 200);
  }

  // Auth state listener (skipped in localhost preview mode)
  if (!_preview) sb.auth.onAuthStateChange((event, session) => {
    const user = session?.user || null;
    updateUI(user);
    if (event === 'SIGNED_IN') {
      localStorage.removeItem('ci_intentions');
      syncFromSupabase(); // also pulls is_member
      syncIntentionsFromSupabase().then(() => {
        renderDashboard();
        logDailyLogin();
        injectPersonalContent();
        renderTodayView();
      });
    }
    if (event === 'SIGNED_OUT') {
      currentMember = false;
    }
  });

  // Failsafe: a slow or unreachable Supabase must NEVER trap the user on the
  // loading spinner. hideLoader() is idempotent; the timer below guarantees the
  // dashboard (rendered from local data) becomes usable even on a total network
  // stall. See "stuck loading" bug — the boot used to await Supabase with no
  // timeout or error handling, so any hang left the spinner up forever.
  let _loaderHidden = false;
  const hideLoader = () => {
    if (_loaderHidden) return;
    _loaderHidden = true;
    const loader = document.getElementById('loadingScreen');
    if (!loader) return;
    loader.classList.add('fade');
    setTimeout(() => loader.remove(), 500);
  };
  const _loaderFailsafe = setTimeout(hideLoader, 8000);
  const withTimeout = (p, ms, label) => Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error((label || 'op') + ' timed out after ' + ms + 'ms')), ms)),
  ]);

  // Check existing session (skipped in localhost preview mode)
  try {
    if (!_preview) {
      const { data: { session } } = await withTimeout(sb.auth.getSession(), 6000, 'getSession');
      if (session?.user) {
        updateUI(session.user);
        await withTimeout(syncFromSupabase(), 8000, 'syncFromSupabase');
        await withTimeout(syncIntentionsFromSupabase(), 8000, 'syncIntentionsFromSupabase');
        logDailyLogin();
        injectPersonalContent();
        renderTodayView();
      } else {
        updateUI(null);
        // If someone arrives via a /?auth=signin|signup link, open that modal.
        const _authParam = new URLSearchParams(location.search).get('auth');
        if (_authParam === 'signin' || _authParam === 'signup') openAuth(_authParam);
      }
    }
  } catch (e) {
    // Network/auth failure — fall through and show the dashboard from local data
    // rather than hanging. The auth listener will re-sync if the session recovers.
    console.error('[init] session/sync failed — rendering from local data:', e);
    updateUI(null);
  }

  renderDashboard();

  // Backfill vision images for any goals that don't have one yet.
  if (typeof backfillGoalImages === 'function') backfillGoalImages();

  // Hide loading (whatever happened above, clear the failsafe and drop the spinner)
  clearTimeout(_loaderFailsafe);
  hideLoader();

  // Populate Setup/BTS forms
  loadPegboard();

  // Load content blocks for all users (public read)
  loadContentBlocks();

  // Keep Admin editor numbering available inside Admin, but never expose the
  // matching #N refinement badges in the member experience.
  document.body.classList.remove('cbnums');
  try { numberContentBlocks(); } catch (e) { console.error('[init] numberContentBlocks:', e); }
  try { enhanceInfoBoxToolbars(); } catch (e) { console.error('[init] enhanceInfoBoxToolbars:', e); }
  try { addColsButtonToToolbars(); } catch (e) { console.error('[init] addColsButtonToToolbars:', e); }

  // Inline Master Player destinations run inside one reusable Column A frame.
  // They share the production origin/session, but hide duplicate app chrome.
  const _masterInlineAction = new URLSearchParams(location.search).get('masterInline');
  if (_masterInlineLabels[_masterInlineAction]) {
    document.documentElement.classList.add('master-inline-mode');
    document.documentElement.classList.add('master-inline-' + _masterInlineAction);
    const _hdr = document.querySelector('header.hdr');
    const _top = document.getElementById('topNav');
    const _tabs = document.getElementById('tabBar');
    if (_hdr) _hdr.style.setProperty('display', 'none', 'important');
    if (_top) _top.style.setProperty('display', 'none', 'important');
    if (_tabs) _tabs.style.setProperty('display', 'none', 'important');
    const _inlineGoal = new URLSearchParams(location.search).get('goal');
    openMasterDestination(_masterInlineAction, _inlineGoal);
  } else {
    // The standalone Master Player may have handed us a destination. Wait until
    // session restoration above is complete before navigating, otherwise navTo()
    // mistakes a returning member for a logged-out visitor and opens sign-in.
    _consumeMasterDestination();
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeAuth();
    closeDrawer();
    closeUpgrade();
    hideAddForm();
    closeModal('blueprintModal');
    closeModal('daylifeModal');
    closeManifest();
    closeViz();
  }
});

// Tap background to close AI modals
document.getElementById('blueprintModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal('blueprintModal');
});
document.getElementById('daylifeModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal('daylifeModal');
});

// Close auth modal on background tap
document.getElementById('authModal').addEventListener('click', function(e) {
  if (e.target === this) closeAuth();
});



// Boot is orchestrated by src/main.js (after all modules load) — see init() export.

// ── SUTHERLAND ALCHEMY ────────────────────────────────────────
let _alchemyIntention = '';

function launchAlchemy() {
  let intention = '';
  const uid = currentUser ? currentUser.id : null;
  const stored = LS.get(uid ? `ci_intentions_${uid}` : 'ci_intentions') || [];
  if (stored.length > 0) intention = stored[0].title || '';
  if (!intention) {
    intention = prompt('Enter your intention for the Alchemy Reframe:') || '';
  }
  if (!intention) return;
  _alchemyIntention = intention;

  const modal = document.getElementById('alchemyModal');
  modal.style.display = 'flex';
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'all';
    modal.classList.add('open');
  });
  document.getElementById('alchemySubtitle').textContent = `"${intention.slice(0, 60)}${intention.length > 60 ? '…' : ''}"`;
  runAlchemy();
}

const ALCHEMY_STUBS = [
  {
    limiting_belief: "I don't have enough resources, connections, or proof that I can pull this off.",
    identity_truth: "I AM someone who attracts exactly what I need, precisely when I need it. Resources flow to me because I am the resource.",
    embodiment_action: "Write down one thing you already have — a skill, a contact, an insight — that directly moves this intention forward. Use it today.",
    affirmation: "I AM resourceful, ready, and already in motion."
  },
  {
    limiting_belief: "Other people have achieved this but I'm different — my situation is too complex or my starting point too far back.",
    identity_truth: "I AM the person who turns my unique path into my greatest advantage. My story is not a setback — it is the strategy.",
    embodiment_action: "Identify one way your specific background gives you an edge no one else has. Write it down and say it out loud.",
    affirmation: "I AM shaped by my past and unstoppable because of it."
  },
  {
    limiting_belief: "I'm not ready yet. I need more time, more knowledge, more certainty before I can truly commit.",
    identity_truth: "I AM ready now. Readiness is a decision, not a destination. I move forward with what I have and grow as I go.",
    embodiment_action: "Take one visible action toward this intention before the day ends — no matter how small. Motion creates readiness.",
    affirmation: "I AM ready, willing, and moving forward now."
  },
  {
    limiting_belief: "People like me don't get to have this. Success at this level is for someone else.",
    identity_truth: "I AM exactly the kind of person who achieves this. I belong in the room, at the table, and in the result.",
    embodiment_action: "Find one person from a similar background who achieved something like this. Study one thing they did. Do it today.",
    affirmation: "I AM deserving, capable, and already becoming this."
  },
  {
    limiting_belief: "What if I fail publicly? What if people see me try and fall short?",
    identity_truth: "I AM someone who acts despite uncertainty. My willingness to be seen — even imperfectly — is itself the success.",
    embodiment_action: "Share your intention with one person today. Say it out loud. Make it real by making it witnessed.",
    affirmation: "I AM bold, visible, and proud of every attempt."
  }
];

export function runAlchemy() {
  const btn = document.getElementById('alchemyRegenBtn');
  if (btn) btn.disabled = true;
  document.getElementById('alchemyBody').innerHTML = `
    <div style="text-align:center;padding:40px 0;color:var(--muted);">
      <span class="inline-spinner"></span> Performing alchemy…
    </div>`;

  setTimeout(() => {
    const stub = ALCHEMY_STUBS[Math.floor(Math.random() * ALCHEMY_STUBS.length)];
    renderAlchemy(JSON.stringify(stub));
    if (btn) btn.disabled = false;
  }, 900);
}

function renderAlchemy(raw) {
  let d;
  try { d = JSON.parse(raw); } catch { d = null; }
  if (!d) {
    document.getElementById('alchemyBody').innerHTML = `<p style="font-size:14px;line-height:1.7;white-space:pre-wrap;">${raw}</p>`;
    return;
  }
  document.getElementById('alchemyBody').innerHTML = `
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:6px;">Limiting Belief Surfaced</div>
      <div style="background:#fff3f3;border-left:3px solid var(--mb1);padding:12px 14px;border-radius:0 8px 8px 0;font-size:14px;line-height:1.6;color:var(--black);">${d.limiting_belief || '—'}</div>
    </div>
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:6px;">Identity Truth (Transmuted)</div>
      <div style="background:rgba(61,127,212,.07);border-left:3px solid var(--accent);padding:12px 14px;border-radius:0 8px 8px 0;font-size:15px;font-weight:700;line-height:1.6;color:var(--black);">${d.identity_truth || '—'}</div>
    </div>
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:6px;">Embodiment Action (Today)</div>
      <div style="background:var(--off);border:1px solid var(--border);padding:12px 14px;border-radius:8px;font-size:14px;line-height:1.6;color:var(--black);">${d.embodiment_action || '—'}</div>
    </div>
    <div style="background:var(--black);color:var(--white);border-radius:8px;padding:16px 18px;text-align:center;font-size:16px;font-weight:800;letter-spacing:-.2px;line-height:1.4;">
      ✦ ${d.affirmation || d.identity_truth || ''}
    </div>`;
}

export function closeAlchemyModal() {
  const modal = document.getElementById('alchemyModal');
  modal.style.opacity = '0';
  modal.style.pointerEvents = 'none';
  modal.classList.remove('open');
  setTimeout(() => { modal.style.display = 'none'; }, 300);
}

/* ── COUNTDOWN TIMER ─────────────────────────────────── */
const cdState = { timer: null, remaining: 0, total: 0, paused: false, title: '', repeatEvery: 15 };

export function launchCountdown(idx, seconds) {
  if (!intentions.length) return;
  const intn = intentions[idx] || intentions[0];
  const text = (intn?.title || 'My Intention').replace(/^(i am)\s+/i, 'I AM ');
  logActivity('countdown', { duration_s: seconds, intention: text }, 10);
  const titleEl = document.getElementById('countdownIntention');
  const numEl   = document.getElementById('countdownNumber');
  if (titleEl) titleEl.textContent = text;
  cdState.remaining  = seconds;
  cdState.total      = seconds;
  cdState.title      = text;
  cdState.paused     = false;
  cdState.repeatEvery = seconds <= 15 ? 15 : seconds <= 30 ? 15 : 20;
  if (numEl) numEl.textContent = seconds;
  const btn = document.getElementById('countdownPauseBtn');
  if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="#000"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
  document.getElementById('countdownOverlay').classList.add('open');
  clearTimeout(cdState.timer);
  playBell();
  setTimeout(() => speakText(text), 1200);
  tickCountdown();
}

function tickCountdown() {
  clearTimeout(cdState.timer);
  if (cdState.paused || cdState.remaining <= 0) {
    if (cdState.remaining <= 0) closeCountdown();
    return;
  }
  cdState.timer = setTimeout(() => {
    cdState.remaining--;
    const el = document.getElementById('countdownNumber');
    if (el) el.textContent = cdState.remaining;
    const elapsed = cdState.total - cdState.remaining;
    if (elapsed > 0 && elapsed % cdState.repeatEvery === 0 && cdState.remaining > 0) {
      speakText(cdState.title);
    }
    tickCountdown();
  }, 1000);
}

function toggleCountdownPause() {
  cdState.paused = !cdState.paused;
  const btn = document.getElementById('countdownPauseBtn');
  if (btn) btn.innerHTML = cdState.paused
    ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="#000"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
    : '<svg viewBox="0 0 24 24" width="22" height="22" fill="#000"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
  if (cdState.paused) stopSpeech();
  else tickCountdown();
}

function closeCountdown() {
  clearTimeout(cdState.timer);
  stopSpeech();
  playBell(396);
  document.getElementById('countdownOverlay').classList.remove('open');
}


/* player-launcher.js */

/* ── PEGBOARD LOOP WIDGET ────────────────────────────── */
const PB_LOOP_FIELDS = [
  { label: 'MY MISSION',    key: 'pb-mission'   },
  { label: 'LIFE GOAL',     key: 'pb-lifegol'   },
  { label: 'CORE VALUES',   key: 'pb-values'    },
  { label: 'BELIEFS',       key: 'pb-beliefs'   },
  { label: 'ATTITUDES',     key: 'pb-attitudes' },
  { label: 'STOICISM',      key: 'pb-stoicism'  },
  { label: 'TRAITS',        key: 'pb-traits'    },
];

let pbLoopIdx = 0;

function updatePbLoop() {
  const pb      = LS.get('ci_pegboard') || {};
  const field   = PB_LOOP_FIELDS[pbLoopIdx];
  const value   = pb[field.key] || '—';
  const imgN    = String((Math.floor(Date.now() / 86400000) + pbLoopIdx) % 25 + 1).padStart(2, '0');
  const bg      = document.getElementById('pbLoopBg');
  const content = document.getElementById('pbLoopContent');
  const lbl     = document.getElementById('pbLoopLabel');
  const body    = document.getElementById('pbLoopBody');
  if (!bg) return;

  // Fade out
  bg.style.opacity      = '0';
  content.style.opacity = '0';

  setTimeout(() => {
    // Swap content while invisible
    bg.style.backgroundImage = `url("images/players/player-${imgN}.jpg")`;
    lbl.textContent          = field.label;
    body.textContent         = value;
    // Fade in
    bg.style.opacity      = '0.25';
    content.style.opacity = '1';
  }, 1200);

  pbLoopIdx = (pbLoopIdx + 1) % PB_LOOP_FIELDS.length;
}

setInterval(updatePbLoop, 120000);
document.addEventListener('DOMContentLoaded', updatePbLoop);

/* ── ENTREPRENEUR SLIDESHOW ─────────────────────────────── */
const ENT_SLIDES = [
  'ENT EXECUTING STRATEGY.PNG','ENT QUALITY PEOPLE.PNG','ENT EMPATHETIC.PNG',
  'ENT EXECUTING CONCEPT.PNG','ENT SKILLFUL COMMUNICATOR.PNG','ENT GREAT SALES PERSON.PNG',
  'ENT LIVING THE BRAND.PNG','ENT MANAGING TIME WISELY.PNG','ENT SUCCESSFUL NEGOTIATOR.PNG',
  'ENT PASSIONATE.PNG','ENT FACILITATOR.PNG','ENT PROFITABLE.PNG',
  'ENT RESPECTED MANAGER.PNG','ENT RISK TAKER.PNG','ENT SELF CONFIDENT.PNG',
  'ENT SELF PROMOTER.PNG','ENT SELF STARTER.PNG','ENT STRATEGIC THINKER.PNG',
  'ENT STRONG WORK ETHIC.PNG','ENT OUTSIDE BOX.PNG',
  'ENT - FAIRNESS.PNG','ENT - GOOD LISTENER.PNG','ENT - METICULOUS PLANNER.PNG',
  'ENT AWARE OF LIMITATIONS.PNG','ENT BALANCE IN LIFE.PNG','ENT CHARMING copy.PNG',
  'ENT COMFORTABLE DELEGATING.PNG','ENT COMPETITIVE.PNG','ENT DETERMINED TO SUCCEED.PNG',
  'ENT DISCIPLINED.PNG','ORGANIZATIONAL SKILLS.JPG'
];

function getEntCardName(filename) {
  return filename
    .replace(/^ENT\s*[-–]\s*/i, '')
    .replace(/^ENT\s+/i, '')
    .replace(/\s*copy$/i, '')
    .replace(/\.(PNG|JPG)$/i, '')
    .trim()
    .toUpperCase();
}

window.activeEntCard = getEntCardName(ENT_SLIDES[0]);

function startEntSlideshow() {
  document.querySelectorAll('.ent-slideshow').forEach(host => {
    if (host.dataset.started) return;
    host.dataset.started = '1';

    const order = ENT_SLIDES.slice().sort(() => Math.random() - 0.5);
    order.forEach((file, i) => {
      const slide = document.createElement('div');
      slide.className = 'ent-slide' + (i === 0 ? ' active' : '');
      slide.style.backgroundImage = `url("images/entrepreneur-library/${encodeURIComponent(file)}")`;
      host.appendChild(slide);
    });

    window.activeEntCard = getEntCardName(order[0]);

    let idx = 0;
    setInterval(() => {
      const slides = host.querySelectorAll('.ent-slide');
      if (!slides.length) return;
      slides[idx].classList.remove('active');
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add('active');
      window.activeEntCard = getEntCardName(order[idx]);
    }, 8000);
  });
}

document.addEventListener('DOMContentLoaded', startEntSlideshow);

document.addEventListener('DOMContentLoaded', () => { applyColBOrder(); startAffirmationLoop(null); });



/* ── MASTER PLAYER DESTINATIONS ─────────────────────────────────────────────
   Keeps the six card icons contextual when the player is embedded, and accepts
   the same hand-off from the standalone player page through sessionStorage. */
function _masterGoalIndex(value) {
  const idx = typeof value === 'number' ? value : Number.parseInt(value, 10);
  return Number.isInteger(idx) && idx >= 0 && idx < (intentions || []).length ? idx : null;
}

function _masterRevealGoalTab(idx, which, findNextAction = false) {
  window.setTimeout(() => {
    const tab = document.getElementById(`wtab-${which}-${idx}`);
    const details = tab && tab.closest('details');
    if (details) details.open = true;
    if (typeof window.wrapTab === 'function') window.wrapTab(idx, which);

    window.setTimeout(() => {
      const panel = document.getElementById(`wtab-panel-${which}-${idx}`);
      const nextButton = findNextAction && panel
        ? panel.querySelector('.wcard button[title="Mark done"]')
        : null;
      const target = (nextButton && nextButton.closest('.wcard')) || panel || details;
      if (!target) return;
      target.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
      });
      if (nextButton && target.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        target.animate(
          [
            { boxShadow: '0 0 0 0 rgba(245,166,35,0)' },
            { boxShadow: '0 0 0 4px rgba(245,166,35,.55)' },
            { boxShadow: '0 1px 2px rgba(0,0,0,.12)' },
          ],
          { duration: 1100, easing: 'ease-out' },
        );
      }
    }, 40);
  }, 80);
}

const _masterInlineLabels = {
  meditation: 'Meditation',
  roadmap: 'Roadmap',
  goals: 'Goals',
  'daily-habits': 'Daily Habits',
  visualization: 'Visualization',
  'action-plan': 'Action Plan',
  favorites: 'Favorites Autoplay',
  gratitude: 'Gratitude',
  journal: 'Journal',
  thoughts: 'My Thoughts',
  'task-notes': 'Notes',
  'goal-workspace': 'Goal Workspace',
  wins: 'Wins',
  proof: 'Proof',
  'cosmic-library': 'Cosmic Library',
  'quickie-move': 'Quickie Move',
  admin: 'Admin',
};

export function closeMasterInlineDestination() {
  const workspace = document.getElementById('masterInlineWorkspace');
  const frame = document.getElementById('masterInlineFrame');
  if (frame) frame.src = 'about:blank';
  if (workspace) workspace.hidden = true;
}

export function openMasterInlineDestination(action, goalIndex = null) {
  if (!_masterInlineLabels[action]) return false;
  const workspace = document.getElementById('masterInlineWorkspace');
  const frame = document.getElementById('masterInlineFrame');
  const title = document.getElementById('masterInlineTitle');
  if (!workspace || !frame) return false;

  const idx = _masterGoalIndex(goalIndex);
  const url = new URL('/', location.origin);
  url.searchParams.set('masterInline', action);
  if (idx !== null) url.searchParams.set('goal', String(idx));

  if (title) title.textContent = _masterInlineLabels[action];
  workspace.hidden = false;

  // Meditation is already a complete 16:9 player. Load it directly so the
  // full Meditation page cannot add a tall black canvas around the player.
  const isMeditation = action === 'meditation';
  frame.style.height = isMeditation ? 'auto' : 'min(760px, 75vh)';
  frame.style.minHeight = isMeditation ? '0' : '520px';
  frame.style.aspectRatio = isMeditation ? '16 / 9' : 'auto';
  frame.style.background = isMeditation ? '#4c812f' : 'var(--bg, #f5f5f5)';
  frame.src = isMeditation ? '/players/meditation.html?t=15' : url.pathname + url.search;
  workspace.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  });
  return true;
}

export function openMasterDestination(action, goalIndex = null) {
  // The Citadel's persistent LFM is the only top-level destination workspace.
  // Never open a second inline frame beneath it or a legacy standalone page.
  if (window.self === window.top) {
    const revealInLfm = () => {
      const frame = document.getElementById('ciMasterPlayerFrame');
      if (!frame || !frame.contentWindow) return;
      frame.contentWindow.postMessage({ type: 'ci-lfm-select', action, goalIndex }, location.origin);
      if (!['goals','daily-habits','favorites','thoughts','journal','action-plan','visualization','gratitude','wins'].includes(action)) {
        frame.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    };
    const dashboard = document.getElementById('page-dashboard');
    if (!dashboard || !dashboard.classList.contains('active')) {
      navTo('dashboard');
      window.setTimeout(revealInLfm, 180);
      window.setTimeout(revealInLfm, 550);
    } else {
      revealInLfm();
    }
    return;
  }

  const idx = _masterGoalIndex(goalIndex);
  switch (action) {
    case 'meditation':
      navTo('meditation');
      break;
    case 'daily-habits':
      navTo('habits');
      break;
    case 'favorites':
      navTo('dailyfocus');
      break;
    case 'gratitude':
      navTo('gratitude');
      break;
    case 'journal':
      navTo('mynotes');
      break;
    case 'thoughts':
      navTo('notes');
      break;
    case 'task-notes':
      navTo('tasknotes');
      break;
    case 'goal-workspace':
      navTo('goalworkspace');
      break;
    case 'wins':
      navTo('wins');
      break;
    case 'proof':
      navTo('proof');
      break;
    case 'quickie-move':
      navTo('myroadmap');
      break;
    case 'admin':
      navTo('admin');
      break;
    case 'roadmap':
      openMyRoadmap();
      if (idx !== null) _masterRevealGoalTab(idx, 'roadmap');
      break;
    case 'goals':
      if (idx !== null) editGoalDirect(idx);
      else navTo('setup');
      break;
    case 'visualization':
      if (idx !== null) openVizGoal(idx);
      else openVizLibrary();
      break;
    case 'action-plan':
      openMyRoadmap();
      if (idx !== null) _masterRevealGoalTab(idx, 'my', true);
      break;
    case 'cosmic-library':
      navTo('cosmiclibrary');
      break;
  }
}

function _consumeMasterDestination() {
  let pending = null;
  try {
    pending = JSON.parse(sessionStorage.getItem('ci_master_destination') || 'null');
    sessionStorage.removeItem('ci_master_destination');
  } catch (_) {
    try { sessionStorage.removeItem('ci_master_destination'); } catch (_) {}
  }
  if (pending && typeof pending.action === 'string') {
    openMasterDestination(pending.action, pending.goalIndex);
  }
}

if (typeof window !== 'undefined') {
  window.openMasterDestination = openMasterDestination;
  window.openMasterInlineDestination = openMasterInlineDestination;
  window.closeMasterInlineDestination = closeMasterInlineDestination;
}
