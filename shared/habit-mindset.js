import './habit-mindset.css';

export const HABIT_MINDSET_LINKS = [
  ['DISCIPLINED', 'Build a habit that sticks', 'Disciplined'],
  ['STRONG WORK ETHIC', 'Show up even when motivation drops', 'Strong Work Ethic'],
  ['MANAGING TIME WISELY', 'Make time for what matters', 'Managing Time Wisely'],
  ['DETERMINED TO SUCCEED', 'Get back on track after missing a day', 'Determined to Succeed'],
  ['ORGANIZATIONAL SKILLS', 'Make your routine easier to manage', 'Organizational Skills'],
  ['LIVING THE BRAND', 'Become the person your habits support', 'Living the Brand'],
];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const contextKey = account => `ci_habit_support_v1:${account || 'local-preview'}`;
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

function shellURL() {
  try {
    const parentURL = new URL(window.parent.location.href);
    if (parentURL.origin === location.origin && parentURL.pathname === '/players/master-player.html') return parentURL;
  } catch (_) { /* Cross-origin hosts cannot supply navigation context. */ }
  return new URL(location.href);
}

export function habitPlayerURL(key = '') {
  const url = new URL('/players/master-player.html', location.origin);
  url.searchParams.set('start', key ? 'ent-card' : 'daily-habits');
  url.searchParams.set('entry', key ? 'habits' : 'habits-return');
  if (key) url.searchParams.set('ent', key);
  const reviewHost = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    || /^deploy-preview-\d+--gilded-profiterole-47a2eb\.netlify\.app$/.test(location.hostname);
  if (reviewHost && shellURL().searchParams.get('preview') === '1') url.searchParams.set('preview', '1');
  return url.pathname + url.search;
}

export function readHabitSupport(account) {
  try {
    const value = JSON.parse(sessionStorage.getItem(contextKey(account)) || 'null');
    if (value?.day === today() && HABIT_MINDSET_LINKS.some(([key]) => key === value.cardKey)) return value;
    sessionStorage.removeItem(contextKey(account));
  } catch (_) { /* Navigation still works when session storage is unavailable. */ }
  return null;
}

export function habitEntryContext(account) {
  if (shellURL().searchParams.get('entry') !== 'habits') return null;
  const saved = readHabitSupport(account);
  return { ...(saved || {}), fromHabits: true };
}

function rememberSupport(cardKey, account, habit, closedCats = []) {
  try {
    const day = today();
    const done = JSON.parse(localStorage.getItem(`ci_habits_${day}`) || '{}');
    const list = JSON.parse(localStorage.getItem('ci_habit_list') || '[]');
    // Snapshot both checked and unchecked rows. A fresh account read on return
    // must not undo the last local click while its existing sync is in flight.
    const checklist = Array.isArray(list) ? Object.fromEntries(list.filter(h => h?.id).map(h => [h.id, !!done[h.id]])) : {};
    sessionStorage.setItem(contextKey(account), JSON.stringify({
      day, cardKey, closedCats, checklist,
      habit: habit ? { id: String(habit.id), name: String(habit.name).slice(0, 160) } : null,
    }));
  } catch (_) { /* The card and return link remain usable without personal context. */ }
}

export function createHabitMindsetCard(getAccount) {
  const card = document.createElement('section');
  card.className = 'ci-habit-mindset';
  card.setAttribute('aria-labelledby', 'habitMindsetTitle');
  card.innerHTML = `<h2 id="habitMindsetTitle">BUILD THE MINDSET BEHIND YOUR HABITS</h2>
    <p>Choose the support you need today.</p>
    <div class="habit-mindset-links">${HABIT_MINDSET_LINKS.map(([key, label, title], index) =>
      `<a href="${esc(habitPlayerURL(key))}" target="_parent" data-mindset-key="${key}"><span class="habit-mindset-circle" aria-hidden="true">${index + 1}</span><span><strong>${label}</strong><small>${title}</small></span></a>`).join('')}</div>`;
  card.addEventListener('click', event => {
    const link = event.target.closest('[data-mindset-key]');
    if (!link) return;
    const closedCats = [...document.querySelectorAll('#habitsWidget details[data-habit-section]:not([open])')].map(el => el.dataset.habitSection);
    rememberSupport(link.dataset.mindsetKey, getAccount(), null, closedCats);
  });
  return card;
}

let restored = false;
export function restoreHabitSupport(account, closedCats) {
  if (restored || shellURL().searchParams.get('entry') !== 'habits-return') return;
  const context = readHabitSupport(account);
  if (!context) return;
  restored = true;
  closedCats.clear();
  if (Array.isArray(context.closedCats)) context.closedCats.forEach(cat => closedCats.add(cat));
  try {
    const key = `ci_habits_${today()}`;
    const current = JSON.parse(localStorage.getItem(key) || '{}');
    for (const [id, checked] of Object.entries(context.checklist || {})) {
      if (checked === true) current[id] = true;
      else if (checked === false) delete current[id];
    }
    localStorage.setItem(key, JSON.stringify(current));
  } catch (_) { /* Keep the existing checklist if browser storage is blocked. */ }
  try { sessionStorage.removeItem(contextKey(account)); } catch (_) { /* Optional context. */ }
  // The checklist is rendered once while hidden during app hydration. Wait for
  // both the active page and its parent frame to be displayed before focusing.
  const deadline = Date.now() + 15000;
  let stopped = false;
  let retry;
  const cleanup = () => {
    stopped = true;
    window.clearTimeout(retry);
    observer.disconnect();
    document.removeEventListener('pointerdown', cleanup, true);
    document.removeEventListener('keydown', cleanup, true);
  };
  const focusSource = () => {
    if (stopped) return;
    // Return to the mindset card, including sessions opened before row links were removed.
    const selector = `[data-mindset-key="${CSS.escape(context.cardKey)}"]`;
    const target = document.querySelector(selector);
    const pageVisible = document.getElementById('page-habits')?.classList.contains('active');
    const frameVisible = !window.frameElement || window.frameElement.getClientRects().length > 0;
    if (target && pageVisible && frameVisible && target.getClientRects().length) {
      target.closest('details')?.setAttribute('open', '');
      // A link can be the active element in an inactive iframe. Activate this
      // browsing context too, and only finish when keyboard focus is real.
      window.focus();
      target.focus({ preventScroll: true });
      if (document.hasFocus() && document.activeElement === target) {
        target.scrollIntoView({ block: 'center', behavior: 'instant' });
        return;
      }
    }
    if (Date.now() < deadline) retry = window.setTimeout(focusSource, 100);
  };
  // Account hydration can replace the checklist after its first visible paint.
  // Restore focus on that replacement, but stop as soon as the member acts.
  const observer = new MutationObserver(() => {
    window.clearTimeout(retry);
    retry = window.setTimeout(focusSource, 100);
  });
  const widget = document.getElementById('habitsWidget');
  if (widget) observer.observe(widget, { childList: true, subtree: true });
  document.addEventListener('pointerdown', cleanup, true);
  document.addEventListener('keydown', cleanup, true);
  window.setTimeout(cleanup, 15000);
  retry = window.setTimeout(focusSource, 100);
}
