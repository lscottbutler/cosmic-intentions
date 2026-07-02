/* ── waitlist-signup.js — EMAIL CAPTURE → SUPABASE ─────────────────────────
   Stores a launch waitlist email in the Supabase `waitlist` table via the
   PUBLIC anon key + an RLS insert policy (same pattern as tts caching).
   Duplicate emails are treated as success. No auth.

   ONE-TIME SETUP (run in Supabase SQL editor):
     create table if not exists public.waitlist (
       id uuid primary key default gen_random_uuid(),
       email text unique not null,
       source text,
       created_at timestamptz default now()
     );
     alter table public.waitlist enable row level security;
     create policy "anon can join waitlist" on public.waitlist
       for insert to anon, authenticated with check (true);
─────────────────────────────────────────────────────────────────────────── */
const SUPA_URL  = 'https://wbqzwbubbeorcknevips.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicXp3YnViYmVvcmNrbmV2aXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTM3NzMsImV4cCI6MjA5MTAyOTc3M30.mF_YGj1E2ib0mEx07lkZyjgBzdGDT7saK8wofEjcqNc';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const email  = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const source = String(body.source || 'unknown').slice(0, 60);
  // Basic email sanity check.
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please enter a valid email.' }) };
  }

  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        'apikey': SUPA_ANON,
        'Authorization': `Bearer ${SUPA_ANON}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ email, source }),
    });

    // 201 = inserted. 409 = duplicate (already on the list) → treat as success.
    if (res.ok || res.status === 409) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }
    const txt = await res.text();
    // Unique-violation code from Postgres → success.
    if (txt.includes('23505')) return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Could not save right now — please try again.', detail: txt }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
