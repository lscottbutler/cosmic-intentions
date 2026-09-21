/* ── _guard.js — shared request guard for money-spending functions ──────────
   One gate in front of every serverless call that costs money (OpenAI /
   ElevenLabs / Pexels). Three independently-enforced layers:

     1) ORIGIN allow-list  — reject cross-site callers (blocks other sites + the
        lazy majority of scripted abuse).
     2) AUTH (opts.requireAuth) — require a valid Supabase login; verifies the
        caller's access token against Supabase. Closes anonymous abuse.
     3) QUOTA (opts.dailyLimit) — per-user daily cap via the bump_ai_usage RPC.

   Usage in a function:
     const { guard } = require('./_guard');
     exports.handler = async (event) => {
       const g = await guard(event, { requireAuth: true, dailyLimit: 50 });
       if (!g.ok) return g.response;           // 200 OPTIONS / 403 / 401 / 429
       const headers = g.headers;               // CORS headers to reuse
       // …g.user.id is the verified Supabase user…
     };

   Paid requests fail CLOSED when identity or quota verification is unavailable.
   This protects member data and prevents an infrastructure error from turning
   into an unlimited third-party API bill. */

const SUPA_URL  = process.env.SUPABASE_URL || 'https://wbqzwbubbeorcknevips.supabase.co';
const SUPA_ANON = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicXp3YnViYmVvcmNrbmV2aXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTM3NzMsImV4cCI6MjA5MTAyOTc3M30.mF_YGj1E2ib0mEx07lkZyjgBzdGDT7saK8wofEjcqNc';

// Hosts allowed to call the paid endpoints. localhost/127.0.0.1 keep dev working.
const ALLOWED_HOSTS = [
  'cosmicintentions.com',
  'www.cosmicintentions.com',
  'gilded-profiterole-47a2eb.netlify.app',
  'localhost',
  '127.0.0.1',
];

function _hostOf(u) { try { return new URL(u).hostname; } catch { return ''; } }
function _hostAllowed(host) {
  return ALLOWED_HOSTS.includes(host)
    || host.endsWith('--gilded-profiterole-47a2eb.netlify.app');
}
function _hdr(event, name) {
  const h = event.headers || {};
  return h[name] || h[name.toLowerCase()] || h[name.toUpperCase()] || '';
}

/* CORS headers echoing the caller's origin when it's on the allow-list,
   otherwise pinned to the production site. */
function corsHeaders(origin) {
  const allow = origin && _hostAllowed(_hostOf(origin)) ? origin : 'https://cosmicintentions.com';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
}

/* Only BLOCK when a cross-site Origin/Referer is present and not allowed. If
   both are absent (rare for a browser POST) we allow — the auth layer covers
   that gap, and we don't want to break a legit client that omits Origin. */
function originAllowed(event) {
  const origin  = _hdr(event, 'origin');
  const referer = _hdr(event, 'referer');
  if (origin)  return _hostAllowed(_hostOf(origin));
  if (referer) return _hostAllowed(_hostOf(referer));
  return true;
}

/* Verify the caller's Supabase access token → the user object, or null. */
async function verifyUser(event) {
  const auth  = _hdr(event, 'authorization');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  try {
    const r = await fetch(`${SUPA_URL}/auth/v1/user`, {
      headers: { apikey: SUPA_ANON, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return (u && u.id) ? { user: u, accessToken: token } : null;
  } catch { return null; }
}

/* Atomically bump today's usage for this user and learn if they're still under
   the cap. Fails OPEN (allowed:true) on any infra error. */
async function bumpQuota(userId, action, limit, accessToken) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/rpc/bump_ai_usage`, {
      method: 'POST',
      headers: { apikey: SUPA_ANON, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_user: userId, p_action: action, p_limit: limit }),
    });
    if (!r.ok) return { allowed: false, unavailable: true };
    const allowed = await r.json();
    return { allowed: allowed !== false };
  } catch { return { allowed: false, unavailable: true }; }
}

/* Same, but a per-CALENDAR-MONTH cap keyed by an action name (e.g. 'drilldown'),
   so different features get independent monthly pools. Backed by the
   bump_ai_usage_monthly RPC. Fails OPEN on any infra error — a missing RPC or a
   Supabase blip never locks a real user out. */
async function bumpMonthly(userId, action, limit, accessToken) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/rpc/bump_ai_usage_monthly`, {
      method: 'POST',
      headers: { apikey: SUPA_ANON, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_user: userId, p_action: action, p_limit: limit }),
    });
    if (!r.ok) return { allowed: false, unavailable: true };
    const allowed = await r.json();
    return { allowed: allowed !== false };
  } catch { return { allowed: false, unavailable: true }; }
}

async function guard(event, opts = {}) {
  const origin  = _hdr(event, 'origin');
  const headers = corsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') return { ok: false, response: { statusCode: 200, headers, body: '' } };

  if (!originAllowed(event)) {
    console.warn('[guard] blocked origin:', origin || _hdr(event, 'referer') || '(none)');
    return { ok: false, response: { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden origin' }) } };
  }

  let user = null;
  let accessToken = null;
  if (opts.requireAuth) {
    const verified = await verifyUser(event);
    user = verified && verified.user;
    accessToken = verified && verified.accessToken;
    if (!user) return { ok: false, response: { statusCode: 401, headers, body: JSON.stringify({ error: 'Please sign in to use AI features.' }) } };
    if (opts.dailyLimit) {
      const { allowed, unavailable } = await bumpQuota(user.id, opts.action || 'ai', opts.dailyLimit, accessToken);
      if (unavailable) {
        return { ok: false, response: { statusCode: 503, headers, body: JSON.stringify({ error: 'AI usage protection is temporarily unavailable. Please try again shortly.' }) } };
      }
      if (!allowed) {
        console.warn('[guard] daily limit hit:', user.id);
        return { ok: false, response: { statusCode: 429, headers, body: JSON.stringify({ error: `You've hit today's AI limit (${opts.dailyLimit}). It resets tomorrow.` }) } };
      }
    }
    if (opts.monthlyLimit) {
      const { allowed, unavailable } = await bumpMonthly(user.id, opts.action || 'ai', opts.monthlyLimit, accessToken);
      if (unavailable) {
        return { ok: false, response: { statusCode: 503, headers, body: JSON.stringify({ error: 'AI usage protection is temporarily unavailable. Please try again shortly.' }) } };
      }
      if (!allowed) {
        console.warn('[guard] monthly limit hit:', user.id, opts.action || 'ai');
        return { ok: false, response: { statusCode: 429, headers, body: JSON.stringify({ error: `You've reached this month's limit (${opts.monthlyLimit}). It resets on the 1st.` }) } };
      }
    }
  }
  return { ok: true, user, accessToken, headers };
}

module.exports = { guard, corsHeaders };
