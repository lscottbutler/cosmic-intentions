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
const today = () => new Date().toLocaleDateString('en-CA');

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
    sessionStorage.setItem(contextKey(account), JSON.stringify({
      day: today(), cardKey, closedCats,
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
    <div class="habit-mindset-links">${HABIT_MINDSET_LINKS.map(([key, label, title]) =>
      `<a href="${esc(habitPlayerURL(key))}" target="_parent" data-mindset-key="${key}"><span><strong>${label}</strong><small>${title}</small></span><span aria-hidden="true">→</span></a>`).join('')}</div>`;
  card.addEventListener('click', event => {
    const link = event.target.closest('[data-mindset-key]');
    if (!link) return;
    const closedCats = [...document.querySelectorAll('#habitsWidget details[data-habit-section]:not([open])')].map(el => el.dataset.habitSection);
    rememberSupport(link.dataset.mindsetKey, getAccount(), null, closedCats);
  });
  return card;
}

export function habitSupportLink(habit) {
  return `<a class="habit-follow-through" href="${esc(habitPlayerURL('DISCIPLINED'))}" target="_parent" data-habit-support="${esc(habit.id)}" aria-label="Help me follow through: ${esc(habit.name)}">Help me follow through <span aria-hidden="true">→</span></a>`;
}

export function wireHabitSupportLinks(root, account, habits, closedCats) {
  root.querySelectorAll('[data-habit-support]').forEach(link => link.addEventListener('click', () => {
    const habit = habits.find(h => String(h.id) === link.dataset.habitSupport);
    rememberSupport('DISCIPLINED', account, habit, [...closedCats]);
  }));
}

let restored = false;
export function restoreHabitSupport(account, closedCats) {
  if (restored || shellURL().searchParams.get('entry') !== 'habits-return') return;
  const context = readHabitSupport(account);
  if (!context) return;
  restored = true;
  closedCats.clear();
  if (Array.isArray(context.closedCats)) context.closedCats.forEach(cat => closedCats.add(cat));
  try { sessionStorage.removeItem(contextKey(account)); } catch (_) { /* Optional context. */ }
  // Wait for the canonical frame to measure its new content before restoring focus.
  window.setTimeout(() => {
    const selector = context.habit?.id
      ? `[data-habit-support="${CSS.escape(context.habit.id)}"]`
      : `[data-mindset-key="${CSS.escape(context.cardKey)}"]`;
    const target = document.querySelector(selector);
    if (!target) return;
    target.closest('details')?.setAttribute('open', '');
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, 750);
}
