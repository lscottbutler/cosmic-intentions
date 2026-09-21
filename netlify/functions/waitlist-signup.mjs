import {
  enforceRateLimit,
  isAllowedPublicRequest,
  json,
  publicHeaders,
} from './_shared/public-guard.mjs';

export default async (request, context) => {
  const headers = publicHeaders(request);
  if (request.method === 'OPTIONS') return new Response('', { status: 204, headers });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);
  if (!isAllowedPublicRequest(request)) return json({ error: 'Forbidden origin' }, 403, headers);

  const rate = await enforceRateLimit(context, 'waitlist', 5, 60 * 60 * 1000);
  if (!rate.allowed) {
    return json(
      { error: 'Too many attempts. Please try again later.' },
      429,
      { ...headers, 'Retry-After': String(rate.retryAfter) },
    );
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, headers); }

  // Honeypot field: real visitors never fill it.
  if (String(body.company || '').trim()) return json({ ok: true }, 200, headers);

  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const source = String(body.source || 'unknown').replace(/[^a-z0-9_-]/gi, '').slice(0, 60);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'Please enter a valid email.' }, 400, headers);
  }

  const supabaseUrl = Netlify.env.get('SUPABASE_URL') || 'https://wbqzwbubbeorcknevips.supabase.co';
  const supabaseKey = Netlify.env.get('SUPABASE_PUBLISHABLE_KEY')
    || Netlify.env.get('SUPABASE_ANON_KEY')
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicXp3YnViYmVvcmNrbmV2aXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTM3NzMsImV4cCI6MjA5MTAyOTc3M30.mF_YGj1E2ib0mEx07lkZyjgBzdGDT7saK8wofEjcqNc';
  if (!supabaseKey) return json({ error: 'Signup is temporarily unavailable' }, 503, headers);

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email, source }),
    });
    if (response.ok || response.status === 409) return json({ ok: true }, 200, headers);
    return json({ error: 'Could not save right now — please try again.' }, 502, headers);
  } catch {
    return json({ error: 'Could not save right now — please try again.' }, 500, headers);
  }
};

export const config = { path: '/api/waitlist-signup' };
