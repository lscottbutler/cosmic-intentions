import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Exercise the real boot orchestration with controlled auth/network failures.
// No account data, browser storage or Supabase service is touched.
const source = await readFile(process.env.CI_STARTUP_SOURCE || 'app.js', 'utf8');
const start = source.includes('let _masterInlineWaitingForAuth')
  ? source.indexOf('let _masterInlineWaitingForAuth') : source.indexOf('export async function init()');
const boot = source.slice(start, source.indexOf('// Keyboard shortcuts', start))
  .replace('export async function init()', 'async function init()');
const user = { id: 'test-member', email: 'member@example.test' };
const tick = () => new Promise(resolve => setTimeout(resolve, 10));

function harness(options = {}) {
  const calls = { profile: 0, goals: 0, reference: 0, destinations: [], cachedFor: [] };
  let listener;
  const classes = () => ({ add() {}, remove() {}, contains() { return false; } });
  const node = { classList: classes(), style: { setProperty() {} }, remove() {} };
  const context = vm.createContext({
    URLSearchParams, Promise,
    console: { error() {}, warn() {} },
    location: { search: '?masterInline=' + (options.action || 'favorites') },
    currentUser: null, currentMember: false,
    document: { documentElement: node, body: node, querySelector: () => null,
      getElementById: id => id === 'loadingScreen' ? node : null },
    window: { renderDailyGuru() { calls.reference++; } },
    localStorage: { removeItem() {} },
    LS: { get: () => null, set() {} },
    setTimeout: (fn, ms) => setTimeout(fn, ms >= 6000 ? 2 : 0), clearTimeout,
    _masterInlineLabels: { favorites: 'Favorites', 'action-plan': 'Roadmap', goals: 'Goals', 'daily-habits': 'Habits' },
    _previewActive: () => false,
    updateUI(value) { context.currentUser = value; },
    closeAuth() {},
    loadIntentionsFromLS() { calls.cachedFor.push(context.currentUser?.id || null); },
    syncFromSupabase() { calls.profile++; return options.profile ? options.profile() : Promise.resolve(); },
    syncIntentionsFromSupabase() { calls.goals++; return Promise.resolve(); },
    openMasterDestination(action) { calls.destinations.push({ action, user: context.currentUser }); },
    renderDashboard() { if (options.brokenDashboard) throw Error('secondary dashboard renderer'); },
    loadPegboard() { if (options.brokenSetup) throw Error('secondary setup renderer'); },
    sb: { auth: {
      onAuthStateChange(fn) { listener = fn; },
      getSession() {
        if (options.listenerSession) listener('INITIAL_SESSION', { user });
        if (options.sessionStalls) return new Promise(() => {});
        return Promise.resolve({ data: { session: options.signedOut ? null : { user } } });
      },
    } },
    injectPlaceholderCards() {}, getDailyLine: () => '', selectPlan() {},
    logDailyLogin() {}, injectPersonalContent() {}, renderTodayView() {},
    backfillGoalImages() {}, loadContentBlocks() {}, numberContentBlocks() {},
    enhanceInfoBoxToolbars() {}, addColsButtonToToolbars() {}, _consumeMasterDestination() {},
  });
  vm.runInContext(boot + '\nthis.runBoot = init;', context);
  return { context, calls, run: () => context.runBoot(), fire: (event, session) => listener(event, session) };
}

{
  const h = harness({ profile: () => new Promise(() => {}) });
  await h.run();
  assert.equal(h.context.currentUser, user, 'profile timeout must retain the restored session');
  assert.equal(h.calls.goals, 1, 'a stuck profile must not skip the independent goals fetch');
  assert.equal(h.calls.destinations.at(-1).user, user, 'Favorites must still render as the signed-in member');
  assert.ok(h.calls.cachedFor.includes(user.id), 'offline goals must use the authenticated account cache');
}
{
  const h = harness({ listenerSession: true, sessionStalls: true });
  await h.run();
  assert.equal(h.context.currentUser, user, 'getSession timeout must not erase a session supplied by the listener');
}
for (const action of ['action-plan', 'goals', 'daily-habits']) {
  const h = harness({ brokenDashboard: true, brokenSetup: true, action });
  await h.run();
  assert.equal(h.calls.destinations.at(-1).action, action, 'an unrelated renderer must not prevent destination navigation');
}
{
  const h = harness({ signedOut: true, profile: () => new Promise(() => {}) });
  await h.run();
  assert.equal(h.calls.reference, 1, 'public Favorites reference renders even without a session');
  assert.equal(h.calls.profile, 0, 'signed-out boot must not fetch member data');
  h.fire('SIGNED_IN', { user });
  assert.equal(h.calls.profile, 0, 'no network call may start inside the Supabase auth callback');
  await tick();
  assert.equal(h.calls.profile, 1);
  assert.equal(h.calls.destinations.at(-1).user, user, 'late sign-in resumes the destination before a slow profile request');
}
{
  const h = harness({ signedOut: true });
  await h.run();
  h.fire('SIGNED_IN', { user });
  h.fire('SIGNED_OUT', null);
  await tick();
  assert.equal(h.calls.profile, 0, 'a stale scheduled sign-in must not load another session’s data');
  assert.equal(h.context.currentUser, null);
}
console.log('Member startup regression checks passed.');
