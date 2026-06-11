#!/usr/bin/env node
/* ── Cosmic Intentions — post-deploy health check ───────────────────────────
   Confirms the live site + every serverless endpoint is deployed and routing.
   GET on an /api endpoint should return 405 (the function's method guard) —
   that proves it's reachable WITHOUT spending an OpenAI/Pexels call.

   Usage:
     node scripts/healthcheck.mjs
     node scripts/healthcheck.mjs https://your-preview-url.netlify.app
   Exit code 1 if anything is unhealthy (so CI / a cron can alert on it).
─────────────────────────────────────────────────────────────────────────── */

const BASE = (process.argv[2] || 'https://gilded-profiterole-47a2eb.netlify.app').replace(/\/$/, '');

// [path, method, expected status codes, label]
const CHECKS = [
  ['/',                       'GET', [200],      'home page'],
  ['/shared/api.js',          'GET', [200],      'shared/api.js'],
  ['/api/map-ai',             'GET', [405],      'fn: map-ai'],
  ['/api/bbfw',               'GET', [405],      'fn: bbfw'],
  ['/api/generate-content',   'GET', [405],      'fn: generate-content'],
  ['/api/claude',             'GET', [405],      'fn: claude'],
  ['/api/tts',                'GET', [405],      'fn: tts'],
  ['/api/image-generate',     'GET', [405],      'fn: image-generate'],
  ['/api/image-search',       'GET', [405],      'fn: image-search'],
];

const TIMEOUT_MS = 15000;

async function hit(path, method) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BASE + path + '?cb=' + Date.now(), { method, signal: ctrl.signal });
    return res.status;
  } catch (e) {
    return `ERR ${e.name === 'AbortError' ? 'timeout' : e.message}`;
  } finally {
    clearTimeout(t);
  }
}

console.log(`\nHealth check → ${BASE}\n`);
let failed = 0;
for (const [path, method, ok, label] of CHECKS) {
  const status = await hit(path, method);
  const pass = ok.includes(status);
  if (!pass) failed++;
  console.log(`  ${pass ? '✅' : '❌'}  ${label.padEnd(22)} ${method} ${path}  →  ${status}${pass ? '' : `  (expected ${ok.join('/')})`}`);
}
console.log('');
if (failed) {
  console.error(`✗ ${failed} check(s) FAILED\n`);
  process.exit(1);
}
console.log('✓ all healthy\n');
