import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

const ALLOWED_HOSTS = new Set([
  'cosmicintentions.com',
  'www.cosmicintentions.com',
  'gilded-profiterole-47a2eb.netlify.app',
  'localhost',
  '127.0.0.1',
]);

function hostOf(value) {
  try { return new URL(value).hostname; } catch { return ''; }
}

function hostAllowed(host) {
  return ALLOWED_HOSTS.has(host)
    || host.endsWith('--gilded-profiterole-47a2eb.netlify.app');
}

export function publicHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = hostAllowed(hostOf(origin))
    ? origin
    : 'https://cosmicintentions.com';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
  };
}

export function isAllowedPublicRequest(request) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  return Boolean(
    (origin && hostAllowed(hostOf(origin))) ||
    (!origin && referer && hostAllowed(hostOf(referer)))
  );
}

export async function enforceRateLimit(context, namespace, limit, windowMs) {
  const ip = context.ip || 'unknown';
  const salt = Netlify.env.get('RATE_LIMIT_SALT') || context.site?.id || 'ci-public-tools';
  const fingerprint = createHash('sha256').update(`${salt}|${ip}`).digest('hex');
  const windowId = Math.floor(Date.now() / windowMs);
  const key = `${namespace}/${windowId}/${fingerprint}`;
  const store = getStore({ name: 'ci-public-rate-limits', consistency: 'strong' });
  const current = await store.get(key, { type: 'json' }) || { count: 0 };
  const next = Number(current.count || 0) + 1;
  await store.setJSON(key, { count: next });
  return {
    allowed: next <= limit,
    remaining: Math.max(0, limit - next),
    retryAfter: Math.max(1, Math.ceil(((windowId + 1) * windowMs - Date.now()) / 1000)),
  };
}

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}
