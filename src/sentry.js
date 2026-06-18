import * as Sentry from '@sentry/browser';

// ── Sentry error monitoring ──────────────────────────────────────────────
// Paste your Sentry DSN below (it's a PUBLIC client key — safe to commit).
// Find it in Sentry: Settings → Projects → (your project) → Client Keys (DSN).
// Until a DSN is set, this is completely inert.
const SENTRY_DSN = 'https://a7199a901b371ba750ea15ea69bbfd82@o4511588938285056.ingest.us.sentry.io/4511588960370688';

const isProd = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';

if (SENTRY_DSN && isProd) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0,            // errors only — no performance tracing (lighter / cheaper)
    replaysSessionSampleRate: 0,
    ignoreErrors: [/ResizeObserver/i],
  });
}
