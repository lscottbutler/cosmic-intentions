// ── Sentry error monitoring ──────────────────────────────────────────────
// Paste your Sentry DSN below (it's a PUBLIC client key — safe to commit).
// Find it in Sentry: Settings → Projects → (your project) → Client Keys (DSN).
// Until a DSN is set, this is completely inert.
const SENTRY_DSN = 'https://a7199a901b371ba750ea15ea69bbfd82@o4511588938285056.ingest.us.sentry.io/4511588960370688';

const isProd = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';

if (SENTRY_DSN && isProd) {
  // Keep monitoring out of the critical application bundle. Capture any error
  // that happens while the SDK chunk is loading, then forward it once Sentry is
  // ready so startup visibility is preserved without delaying the interface.
  const earlyErrors = [];
  const queueError = (event) => {
    const error = event?.error || event?.reason;
    if (!/ResizeObserver/i.test(String(error?.message || error || ''))) {
      earlyErrors.push(error instanceof Error ? error : new Error(String(error || 'Unknown startup error')));
    }
  };

  window.addEventListener('error', queueError);
  window.addEventListener('unhandledrejection', queueError);

  import('@sentry/browser').then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0,            // errors only — no performance tracing (lighter / cheaper)
      replaysSessionSampleRate: 0,
      ignoreErrors: [/ResizeObserver/i],
    });
    earlyErrors.forEach((error) => Sentry.captureException(error));
  }).catch((error) => {
    console.warn('[monitoring] Sentry failed to load', error);
  }).finally(() => {
    window.removeEventListener('error', queueError);
    window.removeEventListener('unhandledrejection', queueError);
  });
}
