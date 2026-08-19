import { backfillGoalImages, buildCardHTML, buildRoadmapPanel, generateMindset, hideAddForm, renderPBIntentionList, runSurgicalVisualLoop, stopSurgicalVisualLoop } from './shared/card-builder.js';
import { getDailyLine, injectPersonalContent } from './shared/content-bank.js';
import { ENT_CARDS } from './shared/ent-library-content.js';
import { renderTodayStrip, renderTodayView } from './shared/today.js';
import { _hasBbfw, _hasTheMap, _paintStrategyPanel, _parseJsonField, closeViz, hydrateIntent, seedGoalPractice } from './shared/the-map.js';
import { _wfLoadChecks } from './shared/weekly-focus.js';
import { logActivity, logDailyLogin } from './shared/activity.js';
import { renderRings, _wireRingsSync, vizSideStatsHTML } from './shared/rings.js';
import { mountDissolve, stopDissolve } from './shared/dissolve.js';
import { renderWrapup } from './shared/wrapup.js';
import { renderHabits, renderRunThroughs } from './shared/habits.js';
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
      side.innerHTML = '<img src="images/home-clown.png" alt="" style="width:100%;height:auto;display:block;margin-bottom:14px;"><div class="pg-side-stats"></div>';
      layout.appendChild(main);
      layout.appendChild(side);
      screen.appendChild(layout);
    }
    const statsEl = side && side.querySelector('.pg-side-stats');
    if (statsEl && typeof vizSideStatsHTML === 'function') statsEl.innerHTML = vizSideStatsHTML();
  } catch (e) { console.error('[pageSideColumn]', e); }
}

export function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const isInputs = INPUT_PAGES.includes(id);
  if (isInputs) {
    INPUT_PAGES.forEach(pid => { const el = document.getElementById('page-' + pid); if (el) el.classList.add('active'); });
  } else {
    const target = document.getElementById('page-' + id);
    if (target) target.classList.add('active');
  }

  document.querySelectorAll('.drawer-nav-item').forEach(b => b.classList.remove('active'));

  if (id === 'dashboard') renderDashboard();
  if (id === 'dailyfocus') {
    if (typeof window.renderDailyGuru === 'function') window.renderDailyGuru();
    if (typeof window.renderFavorites === 'function') window.renderFavorites();
  }
  if (isInputs) {   // render all three merged sections
    if (typeof window.renderNotesPage === 'function') window.renderNotesPage();
    renderPBIntentionList();
    if (typeof window.renderPBHabitList === 'function') window.renderPBHabitList();
  }
  if (typeof window.sprinkleNotes === 'function') window.sprinkleNotes();   // rotate surfaced notes on every page
  if (id === 'admin') loadAIPrompts();
  if (id === 'wins' && typeof window.renderWinsPage === 'function') window.renderWinsPage();
  if (id === 'entcard' && typeof window.renderEntLibrary === 'function') window.renderEntLibrary();

  // Reusable right-hand column (clown + Big 3 stats) on these framed pages.
  if (id === 'dailyfocus') ensurePageSideColumn('dailyfocus');
  if (isInputs) ensurePageSideColumn('notes');
  if (id === 'myroadmap') ensurePageSideColumn('myroadmap');
  if (id === 'wins') ensurePageSideColumn('wins');

  closeDrawer();
  // Force top now, and again after layout settles, so async re-renders
  // (images, deferred sidebar/build-sheet render) can't leave the page
  // scrolled down when a page first loads. For a merged sub-section (Goals /
  // Habits) scroll to that section instead of the very top.
  window.scrollTo(0, 0);
  const _section = (isInputs && id !== 'notes') ? document.getElementById('page-' + id) : null;
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

export function navTo(id) {
  // Must be logged in for any non-home page
  const auth_required = ['dashboard','dailyfocus','notes','setup','habits','wins','vizlibrary','vizgoal','myroadmap','runthroughs','entcard'];
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
  btn.textContent = loading ? 'Saving…' : (id === 'btn-save-setup' ? 'Save My Pegboard' : 'Save BTS');
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
  const rows = intentions.map(intention => ({
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
    // Only persist a lightweight Storage URL — never a base64 data: URL.
    image_url:   (intention.imageUrl && !intention.imageUrl.startsWith('data:')) ? intention.imageUrl : null,
    roadmap_ai:  intention.roadmapAI   || null,
    active_danger_zone: intention.activeDangerZone || null,
    updated_at:  new Date().toISOString()
  }));
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

/* Upload a generated vision image to Supabase Storage; returns the public
   URL (small, cross-device) or null if Storage isn't set up yet. */
export async function uploadVisionImage(intentionId, b64) {
  if (!currentUser || !sb || !b64 || !intentionId) return null;
  try {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const path  = `${currentUser.id}/${intentionId}.png`;
    const { error } = await sb.storage.from('vision-images')
      .upload(path, bytes, { contentType: 'image/png', upsert: true });
    if (error) throw error;
    const { data } = sb.storage.from('vision-images').getPublicUrl(path);
    return data?.publicUrl || null;
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
          imageUrl:     row.image_url     || prev.imageUrl || null,
          imageOptions: prev.imageOptions || ((row.image_url || prev.imageUrl) ? [row.image_url || prev.imageUrl] : null),
          imageIdx:     prev.imageIdx     || 0,
          roadmapAI:        _parseJsonField(row.roadmap_ai) || prev.roadmapAI || null,
          activeDangerZone: row.active_danger_zone || prev.activeDangerZone || '',
          theMap:       _hasTheMap(rowMap) ? rowMap : (_hasTheMap(prevMap) ? _parseJsonField(prevMap) : null),
          bbfw:         _hasBbfw(rowBbfw) ? rowBbfw : (_hasBbfw(prevBbfw) ? _parseJsonField(prevBbfw) : null),
        });
      });
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
  '#E8524A','#E8893A','#88B83A','#52B896',
  '#4A9EAD','#5A8EA8','#6A7E9E','#8A7A9E'
];
export const GREY_SHADES = [
  { bg: '#E84040', text: '#FFFFFF' },
  { bg: '#E86030', text: '#FFFFFF' },
  { bg: '#E88020', text: '#FFFFFF' },
  { bg: '#E8A828', text: '#1C2230' },
  { bg: '#E8C830', text: '#1C2230' },
  { bg: '#A8C830', text: '#1C2230' },
  { bg: '#48B860', text: '#FFFFFF' },
  { bg: '#38A888', text: '#FFFFFF' },
  { bg: '#2898A8', text: '#FFFFFF' },
  { bg: '#7888A8', text: '#FFFFFF' },
  { bg: '#3878A8', text: '#FFFFFF' },
];

export function renderDashboard() {
  const pb   = getPB();
  const name = pb['pb-name'] || 'Friend';
  const helloEl = document.getElementById('dashHello');
  if (helloEl) helloEl.innerHTML = `Welcome back, ${esc(name)} ✦<br><span>Your effort today is a testament to your dedication, your discipline, your drive.</span>`;

  // Script-font greeting at the top of the member dashboard (one line)
  const greetEl = document.getElementById('dashGreeting');
  if (greetEl) greetEl.textContent = `Welcome back ${name}`;

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
  el.innerHTML = intentions.map((it, idx) => {
    const s = GREY_SHADES[idx % GREY_SHADES.length];
    return `<button onclick="openVizGoal(${idx})" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:none;cursor:pointer;background:${s.bg};color:${s.text};border-radius:12px;padding:14px;box-shadow:0 2px 6px rgba(0,0,0,.12);">
      <span style="flex-shrink:0;width:34px;height:34px;border-radius:50%;background:var(--ink,#1D3557);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;">${goalLetter(it, idx)}</span>
      <span style="flex:1;min-width:0;font-weight:700;font-size:14px;line-height:1.2;">${esc(it.title || '')}</span>
      <span style="flex-shrink:0;font-size:20px;opacity:.9;">›</span>
    </button>`;
  }).join('');
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
          <span style="flex-shrink:0;width:34px;height:34px;border-radius:50%;background:var(--ink,#1D3557);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;">${goalLetter(g, i)}</span>
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
          <button onclick="navTo('dashboard')" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 8px;min-width:0;background:var(--ink);border:1px solid var(--border);color:var(--on-ink);border-radius:8px;font-size:12px;font-weight:700;letter-spacing:0.3px;cursor:pointer;text-align:center;line-height:1.2;"><span style="font-size:15px;line-height:1;color:var(--brand);flex-shrink:0;">&#8962;</span>THE INNER CITADEL</button>
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
      const FAV_REMOVE_SVG = `<svg viewBox="0 0 24 24" width="17" height="17" fill="#e0102b" style="display:block"><path d="${_HEART_PATH}"/></svg>`;
      listEl.innerHTML = filtered.map((i, listIdx) => {
        const shade    = GREY_SHADES[i._idx % GREY_SHADES.length];   // by goal index so the workspace title matches this card
        const isSelected = selectedVaultIdx === i._idx;
        const isFav    = Array.isArray(_favs) && _favs.some(f => f && f.player === 'mindset' && f.goal === i._idx);
        // DVB image is no longer shown inline in the list — it opens in Column B on select.
        return `
        <button class="vault-item${isSelected ? ' selected' : ''}"
          onmousedown="event.preventDefault()"
          onclick="selectVaultIntention(${i._idx})"
          style="background:${shade.bg};color:${shade.text}">
          <div class="vault-item-num" style="background:#000;color:#fff">${goalLetter(i, i._idx)}</div>
          <div class="vault-item-body">
            <div class="vault-item-title" style="color:${shade.text}">${esc(i.title)}</div>
          </div>
          <span class="vault-fav" onclick="event.stopPropagation(); toggleGoalFavorite(${i._idx}, event)"
            title="${isFav ? 'Remove from' : 'Add to'} favorites loop"
            style="margin-left:auto;flex:0 0 auto;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#000;color:#fff;opacity:1;">${isFav ? FAV_REMOVE_SVG : FAV_ADD_SVG}</span>
        </button>${(inlineGoalPlayer && inlineGoalPlayer.idx === i._idx) ? `
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
  loadGoalVisualization(intent);

  const roadmapEl = document.getElementById('layer-content-roadmap');
  if (roadmapEl) { roadmapEl.innerHTML = buildRoadmapPanel(intent, idx); roadmapEl.style.display = ''; }   // OPEN by default — Visualization + Roadmap stacked; banner can still collapse it

  populateWorkspaceBrandBanner();

  const offset = document.getElementById('page-dashboard')?.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
}

/* The "…'S PERSONAL ROADMAP" banner is a dropdown: show/hide the roadmap content
   below it and rotate the banner arrow. */
export function toggleRoadmap() {
  const c = document.getElementById('layer-content-roadmap');
  const a = document.getElementById('brand-banner-arrow');
  if (!c) return;
  const open = c.style.display !== 'none';        // currently open → about to close
  c.style.display = open ? 'none' : '';
  if (a) a.style.transform = 'translateY(-50%) rotate(' + (open ? '-90deg' : '0deg') + ')';
}

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

/* ── WORKSPACE HEADER — goal card + brand banner ──────── */
function buildWorkspaceHeader(intent, idx) {
  const color = CARD_COLORS[idx % CARD_COLORS.length];
  const shade = GREY_SHADES[idx % GREY_SHADES.length];   // same palette as the goal box → title matches its card
  return `
    <div style="padding:12px 16px 0;">
      <div class="goal-visualization-container" id="goalVisualizationContainer" style="position:relative;margin:6px 0 10px;width:100%;border-radius:8px;overflow:hidden;border:1px solid var(--border);background:var(--sunken);">
        <img id="goalVisualizationImage" src="" alt="Visualization" style="width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;display:none;" />
        <div id="goalDissolve" style="position:absolute;inset:0;display:none;"></div>
        <div id="goalVisualizationLoader" style="padding:30px;text-align:center;color:var(--muted);font-size:13px;"><span class="inline-spinner"></span> Loading visualization…</div>
        <button onclick="fetchGoalDissolve(${idx})" title="Slow dissolve of 5 images" style="position:absolute;top:8px;right:48px;z-index:2;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.55);color:#fff;border:none;cursor:pointer;font-size:12px;font-weight:800;line-height:1;display:flex;align-items:center;justify-content:center;">5&#10022;</button>
        <button onclick="rerollGoalVisualization(${idx})" title="Get a different image for this goal" style="position:absolute;top:8px;right:8px;z-index:2;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.55);color:#fff;border:none;cursor:pointer;font-size:15px;line-height:1;display:flex;align-items:center;justify-content:center;">&#8635;</button>
      </div>
      <div style="position:relative;display:flex;align-items:center;gap:12px;padding:8px 4px 4px;">
        <div style="flex:1;background:${shade.bg};color:${shade.text};padding:20px;border-radius:8px;font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;line-height:1.3;">${esc(intent.title)}</div>
        <button class="bs-close-btn" onclick="closeVaultBuildSheet()" title="Close">✕</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:6px 4px 10px;">
        ${[['3min','&#9673;','3 MIN']].map(([k,ic,lbl]) =>
          `<button onclick="playGoalInWorkspace(${idx},'${k}',event)"
            style="display:flex;align-items:center;justify-content:center;gap:6px;padding:11px 6px;min-width:0;background:var(--ink);border:1px solid var(--border);color:var(--on-ink);border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.3px;cursor:pointer;">
            <span style="font-size:13px;line-height:1;color:var(--brand);flex-shrink:0;">${ic}</span>${lbl}</button>`
        ).join('')}
        <button onclick="closeVaultBuildSheet()"
          style="display:flex;align-items:center;justify-content:center;gap:6px;padding:11px 6px;min-width:0;background:var(--ink);border:1px solid var(--border);color:var(--brand);border-radius:4px;font-size:10px;font-weight:700;letter-spacing:0.3px;cursor:pointer;text-align:center;line-height:1.2;">
          <span style="font-size:13px;line-height:1;color:var(--brand);">&#8592;</span>BACK TO MY GOALS</button>
      </div>
      <!-- QUICK-VIZ TIMERS — one tap drops an experienced user straight into a visualization of a set length -->
      <div style="display:flex;gap:10px;align-items:stretch;background:#1AA5BA;border:3px solid #F2911E;border-radius:12px;padding:12px;margin:4px 4px 12px;">
        <div style="flex:1;min-width:0;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
          ${[['15s',15],['30s',30],['60s',60],['2m',120],['3m',180],['5m',300],['10m',600],['15m',900]].map(([lbl,secs]) =>
            `<button onclick="launchCountdown(${idx},${secs});event.stopPropagation()" title="${lbl} visualization"
              style="aspect-ratio:1;min-width:0;border-radius:50%;background:#fff;border:3px solid #F2911E;color:#1D3557;font-size:13px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;line-height:1;">${lbl}</button>`
          ).join('')}
        </div>
        <button onclick="openVizLibrary();event.stopPropagation()" title="More visualization options"
          style="flex-shrink:0;width:54px;background:#7C5CC4;border:none;border-radius:10px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;">&#9776;</button>
      </div>
      <div class="dashboard-note-container">
        <div class="dashboard-note-box">
          <span class="note-pin-icon">📍</span>
          <p class="dashboard-note-text">${esc(buildDailyNote(intent, idx))}</p>
        </div>
      </div>
      <div id="brand-banner" onclick="toggleRoadmap()" title="Show / hide roadmap" style="margin:8px 0; position:relative; cursor:pointer;">
        <span id="brand-banner-text">MY'S PERSONAL ROADMAP</span>
        <span id="brand-banner-arrow" style="position:absolute; right:14px; top:50%; transform:translateY(-50%) rotate(0deg); color:var(--brand); font-size:13px; transition:transform .25s ease; pointer-events:none;">&#9660;</span>
      </div>
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
    { t: 12, msg: 'MINTING COMPLETED. ENGAGING THE INNER CITADEL.' },
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
if (typeof window !== 'undefined') {
  window.injectContentBlocks = function () {
    Object.keys(_blockCache).forEach(slug => {
      const body = _blockCache[slug];
      document.querySelectorAll(`[data-block="${slug}"]`).forEach(el => {
        if (body && body.trim()) { el.innerHTML = body; el.style.display = ''; }
        else { el.style.display = 'none'; }
      });
    });
  };
}

async function loadContentBlocks() {
  const { data, error } = await sb.from('content_blocks').select('slug, body');
  if (error || !data) return;
  data.forEach(({ slug, body }) => {
    _blockCache[slug] = body || '';
    if (slug && slug.startsWith('lib_')) _libCache[slug] = body || '';   // recitation libraries
    // Inject into display elements
    document.querySelectorAll(`[data-block="${slug}"]`).forEach(el => {
      if (body && body.trim()) {
        el.innerHTML = body;
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
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
  // Push live immediately to any display elements on page
  document.querySelectorAll(`[data-block="${slug}"]`).forEach(el => {
    if (body) { el.innerHTML = body; el.style.display = ''; }
    else el.style.display = 'none';
  });
}

/* ── ADMIN PHOTO UPLOAD ─────────────────────────────────────────
   Upload a photo for a content block (e.g. the Inspiration champion).
   Reuses the existing 'vision-images' Storage bucket. Inserts the <img>
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
    const { error } = await sb.storage.from('vision-images').upload(path, bytes, { contentType: file.type, upsert: true });
    if (error) throw error;
    const { data } = sb.storage.from('vision-images').getPublicUrl(path);
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
   LOCALHOST-ONLY DASHBOARD PREVIEW
   Lets us load the auth-gated dashboard WITHOUT logging in — purely to
   eyeball / screenshot layout changes. HARD-GUARDED two ways so it can NEVER
   activate on cosmicintentions.com:
     1) only on localhost / 127.0.0.1  (a live domain never matches)
     2) only when the URL has ?preview=1
   Open http://127.0.0.1:5173/?preview=1 to use it.
───────────────────────────────────────────────────────── */
function _previewActive() {
  const host  = location.hostname;
  const local = host === 'localhost' || host === '127.0.0.1';
  const flag  = new URLSearchParams(location.search).has('preview');
  return local && flag;
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
      ['Analyze the profiles of your first 200 Founder Subscription buyers.',
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
/* Placeholder intro/outro copy card — added at the TOP (under the title) and
   BOTTOM of the listed member pages. Same soft-card style as My Roadmap. The
   copy lives here in one place; injected additively so no page markup changes. */
function _makePhCard() {
  const card = document.createElement('div');
  card.className = 'ci-ph-card';
  card.style.cssText = 'background:var(--off,#F5F5F5);border:1px solid var(--border,#E6E8EB);border-radius:14px;padding:22px 24px;margin:18px 0;';
  card.innerHTML =
    '<p style="margin:0 0 14px;max-width:680px;color:var(--text);font-size:15px;line-height:1.6;opacity:.9;">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>' +
    '<div style="display:flex;gap:24px;flex-wrap:wrap;">' +
      '<div style="flex:1;min-width:240px;"><ul style="margin:0;padding-left:20px;color:var(--text);font-size:14px;line-height:1.9;"><li>Lorem ipsum dolor sit amet</li><li>Consectetur adipiscing elit</li><li>Sed do eiusmod tempor incididunt</li><li>Ut labore et dolore magna aliqua</li><li>Ut enim ad minim veniam</li></ul></div>' +
      '<div style="flex:1;min-width:240px;"><ul style="margin:0;padding-left:20px;color:var(--text);font-size:14px;line-height:1.9;"><li>Quis nostrud exercitation ullamco</li><li>Laboris nisi ut aliquip ex ea</li><li>Duis aute irure dolor in reprehenderit</li><li>Voluptate velit esse cillum dolore</li><li>Excepteur sint occaecat cupidatat</li></ul></div>' +
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
    if (anchor) anchor.insertAdjacentElement('afterend', _makePhCard());   // top: under the title
    else wrap.insertBefore(_makePhCard(), wrap.firstChild);
    wrap.appendChild(_makePhCard());                                        // bottom: end of page
  });
}

export async function init() {
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
  if (_preview) _seedPreviewDashboard();

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
