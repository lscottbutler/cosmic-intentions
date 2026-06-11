/* ── shared/api.js — single entry point for all Netlify function calls ──────
   Every client → serverless call goes through ciApi() so the endpoint path,
   headers, and (later) the auth token live in ONE place instead of being
   duplicated across index.html, arsenal.html, the players, and shared/*.js.

   Behavior-preserving: returns the raw fetch Response, so callers keep their
   existing `if (!res.ok)…` / `await res.json()` / `await res.text()` handling.

   Usage:
     const res  = await ciApi('map-ai', { goal });
     const data = await res.json();

   Endpoint name maps to /api/<name>, which netlify.toml redirects to
   /.netlify/functions/<name>.
─────────────────────────────────────────────────────────────────────────── */
(function (global) {
  async function ciApi(name, body, opts) {
    opts = opts || {};
    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      opts.headers || {}
    );
    // ── AUTH HOOK ──────────────────────────────────────────────────────────
    // When the AI endpoints are locked down, attach the Supabase access token
    // here (the ONE place), e.g.:
    //   const t = await window.sb?.auth?.getSession();
    //   if (t?.data?.session) headers.Authorization = 'Bearer ' + t.data.session.access_token;
    // ────────────────────────────────────────────────────────────────────────
    return fetch('/api/' + name, {
      method: opts.method || 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
  global.ciApi = ciApi;
})(typeof window !== 'undefined' ? window : this);
