import './entrepreneur-player.css';
import { resourceForCard } from './entrepreneur-player-resources.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const containsTime = (moment, seconds) => seconds >= moment.start && (moment.end === null || seconds < moment.end);
const views = new Map();
let youtubeAPI;
function loadYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeAPI) return youtubeAPI;
  youtubeAPI = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const previous = window.onYouTubeIframeAPIReady;
    const timeout = setTimeout(() => { youtubeAPI = null; script.remove(); reject(new Error('Video connection timed out')); }, 15000);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      if (typeof previous === 'function') previous();
      resolve(window.YT);
    };
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { clearTimeout(timeout); youtubeAPI = null; script.remove(); reject(new Error('Video connection unavailable')); };
    document.head.append(script);
  });
  return youtubeAPI;
}

export function mountEntrepreneurPlayer(root, { card, mindsetHTML, notesHTML, goals = [], getAccount = () => '', initialTab = 'deeper', habit = null }) {
  const account = String(getAccount() || 'local-preview');
  const storageKey = `ci_ent_player_v1:${account}:${card.key}`;
  const view = views.get(storageKey) || { tab: initialTab, note: '', action: '', goal: '', resourceTab: 'youtube' };
  views.set(storageKey, view);
  const resource = resourceForCard(card.key);
  if (!resource && view.tab === 'deeper') view.tab = 'action';
  let records = [];
  let readFailed = false;
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(value)) throw new Error('Invalid notes');
    records = value.filter(x => x && typeof x.id === 'string' && typeof x.text === 'string' && ['moment', 'action'].includes(x.kind));
  } catch (_) { readFailed = true; }
  let player, ready = false, loading = false, disposed = false, timer, readyTimeout;
  let selected = 0, pendingTime = resource?.moments[0].start || 0;
  const goalItems = goals.filter(g => g?.id && (g.title || g.text));
  if (!goalItems.some(g => String(g.id) === view.goal)) view.goal = '';
  const goalLabel = () => goalItems.find(g => String(g.id) === view.goal)?.title || goalItems.find(g => String(g.id) === view.goal)?.text || '';
  const status = (message, target = 'moment') => { root.querySelector(`[data-status="${target}"]`).textContent = message; };
  const urlAt = seconds => `https://www.youtube.com/watch?v=${resource.videoId}&t=${Math.floor(seconds)}s`;
  const timeRange = m => m.end === null ? 'Full lesson · from the beginning' : `${clock(m.start)}–${clock(m.end)}`;
  const editorial = r => `<article class="ent-resource-card"><div class="ent-eyebrow">${r === resource?.article ? 'ARTICLE' : 'PODCAST'} · ${esc(r.creator)}</div><h3>${esc(r.title)}</h3><p class="ent-muted">${esc(r.time)}</p><dl><dt>Why this helps</dt><dd>${esc(r.why)}</dd><dt>Takeaway</dt><dd>${esc(r.takeaway)}</dd><dt>Put it to work</dt><dd>${esc(r.action)}</dd></dl><div class="ent-resource-actions"><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Open this ${r === resource?.article ? 'article' : 'episode'} ↗</a><button class="ent-button ent-button-secondary" data-use-practice="${r === resource?.article ? 'article' : 'podcast'}">Use this for my next step</button></div></article>`;
  root.className = 'ent-experience';
  root.innerHTML = `
    <div class="ent-intro"><div class="ent-eyebrow">ENTREPRENEUR PLAYER <span class="ent-review-badge">REVIEW EDITION</span></div>
      <h2>${esc(card.title.replace(/^I AM /, '').replace(/^I HAVE /, ''))}</h2><p>${esc(card.directive)}</p>
      ${habit ? `<div class="ent-habit-context"><div class="ent-eyebrow">FOR YOUR HABIT</div><strong>${esc(habit.name)}</strong><p>Choose a belief that helps you begin, then make your next repetition small and specific.</p><button type="button" class="ent-button ent-button-secondary" data-habit-step>Plan my next repetition →</button></div>` : ''}
      <div class="ent-pair"><div><strong>01 · DO THE WORK</strong><p>${esc(card.roadmap[0])}</p></div><div><strong>02 · BUILD THE MINDSET</strong><p>${esc(card.affirmations[0])}</p></div></div>
      <label class="ent-goal-select">Apply this to a goal<select data-goal><option value="">Personal practice · no goal selected</option>${goalItems.map(g => `<option value="${esc(g.id)}">${esc(g.title || g.text)}</option>`).join('')}</select></label>
      <p class="ent-muted" data-goal-context></p>
    </div>
    <div class="ent-tabs" role="tablist" aria-label="Entrepreneur learning sections">${[['action','ACTION'],['mindset','MINDSET'],['deeper','GO DEEPER'],['notes','MY NOTES']].map(([key,label]) => `<button type="button" role="tab" id="ent-tab-${key}" aria-controls="ent-panel-${key}" data-tab="${key}">${label}</button>`).join('')}</div>
    <section class="ent-panel" id="ent-panel-action" role="tabpanel" aria-labelledby="ent-tab-action" data-panel="action">
      <div class="ent-eyebrow">MAKE IT REAL</div><h3>Your next useful step</h3><p>Use this card’s practical steps to move a goal forward. Choose one to start today.</p>
      <ol class="ent-steps">${card.roadmap.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="ent-capture"><label for="ent-action-note">The action I will take</label><textarea id="ent-action-note" maxlength="2000" placeholder="What will you do, and when?">${esc(view.action)}</textarea><div class="ent-capture-footer"><span class="ent-muted">Saved to this card on this device.</span><button class="ent-button" data-save-action>Save my next step</button></div><p class="ent-status" role="status" data-status="action"></p></div>
    </section>
    <section class="ent-panel" id="ent-panel-mindset" role="tabpanel" aria-labelledby="ent-tab-mindset" data-panel="mindset"><div class="ent-eyebrow">PREPARE THE PERSON DOING THE WORK</div><h3>Practise how you show up</h3><p>Choose a belief or affirmation to use alongside your next action. Your favourites stay connected to this card.</p>${mindsetHTML}</section>
    <section class="ent-panel" id="ent-panel-deeper" role="tabpanel" aria-labelledby="ent-tab-deeper" data-panel="deeper">
    ${resource ? `<div class="ent-section-top"><div><div class="ent-eyebrow">GO DEEPER</div><h3>Find the moment you need.</h3></div><p class="ent-muted">Watch. Take something useful.<br>Put it into practice.</p></div>
      <div class="ent-resource-switch" role="group" aria-label="Resource format">${[['youtube','YouTube'],['podcast','Podcasts'],['article','Articles']].map(([key,label]) => `<button data-format="${key}" aria-pressed="${view.resourceTab === key}">${label}</button>`).join('')}</div>
      <div data-resource="youtube"><p>${esc(resource.why)}</p><div class="ent-video-grid"><div>
        <div class="ent-video"><div class="ent-video-cover"><div class="ent-eyebrow" style="justify-content:center">${esc(resource.creator)}</div><button class="ent-play" data-start aria-label="Play selected video moment">▶</button><h3>${esc(resource.title)}</h3><p>${resource.chapterMode === 'full-lesson' ? 'Start the lesson, then make it useful.' : 'Start with one useful moment.'}</p></div></div>
        <div class="ent-video-meta"><span>${esc(resource.time)}</span><a data-watch href="${urlAt(pendingTime)}" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a></div><p class="ent-muted">Playing connects to YouTube. Video controls remain available.</p>
      </div><div><div class="ent-eyebrow">${resource.chapterMode === 'full-lesson' ? 'START THE LESSON' : 'JUMP TO A MOMENT'}</div><ol class="ent-moments">${resource.moments.map((m,i) => `<li><button data-moment="${i}" aria-current="${i === 0}"><span class="ent-time">${clock(m.start)}</span><span><strong>${esc(m.title)}</strong><small>${timeRange(m)}</small></span></button></li>`).join('')}</ol><p class="ent-muted"><a href="${esc(resource.source)}" target="_blank" rel="noopener noreferrer">${esc(resource.sourceLabel)} ↗</a>${resource.chapterMode === 'full-lesson' ? '<br>Chapter timings are not yet verified for this video.' : ''}</p></div></div>
      <div class="ent-insight"><div class="ent-eyebrow">THE TAKEAWAY</div><p data-takeaway></p><div class="ent-eyebrow">TRY THIS · CI PRACTICE</div><p data-practice></p><button class="ent-button ent-button-secondary" data-use-practice="moment">Use this for my next step</button></div>
      <div class="ent-capture"><label for="ent-moment-note">What will you use from this moment?</label><textarea id="ent-moment-note" maxlength="2000" placeholder="Capture the idea and how you’ll use it…">${esc(view.note)}</textarea><div class="ent-capture-footer"><span class="ent-muted">Timestamp + your note, saved on this device.</span><button class="ent-button" data-save-moment>Save this moment</button></div><p class="ent-status" role="status" data-status="moment"></p></div>
      </div><div data-resource="podcast">${editorial(resource.podcast)}</div><div data-resource="article">${editorial(resource.article)}</div>` : `<div class="ent-eyebrow">GO DEEPER</div><h3>A resource should earn its place.</h3><p>The chapter experience is ready to explore on the Self-Confident card. Specific videos, episodes and articles for this card still need selection and review.</p><button class="ent-button" data-confidence>Explore the Self-Confident example →</button><p class="ent-status" role="status" data-status="moment"></p>`}
    </section>
    <section class="ent-panel" id="ent-panel-notes" role="tabpanel" aria-labelledby="ent-tab-notes" data-panel="notes"><div class="ent-eyebrow">KEEP WHAT MOVES YOU FORWARD</div><h3>Saved moments & next steps</h3><p class="ent-muted">Saved on this device${account === 'local-preview' ? ' for this preview' : ' for your account'}. Return to a moment, put it to work, or remove it.</p><ul class="ent-saved-list"></ul><p class="ent-status" role="status" data-status="notes"></p>${notesHTML}</section>`;

  function setTab(tab, focus = false) {
    view.tab = tab;
    if (tab !== 'deeper') player?.pauseVideo?.();
    root.querySelectorAll('[data-tab]').forEach(b => { const on = b.dataset.tab === tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    root.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== tab; });
  }
  function setFormat(format) {
    view.resourceTab = format;
    if (format !== 'youtube') player?.pauseVideo?.();
    root.querySelectorAll('[data-format]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.format === format)));
    root.querySelectorAll('[data-resource]').forEach(p => { p.hidden = p.dataset.resource !== format; });
  }
  function paintMoment(index) {
    selected = index;
    const m = resource.moments[index];
    root.querySelectorAll('[data-moment]').forEach(b => b.setAttribute('aria-current', String(Number(b.dataset.moment) === index)));
    root.querySelector('[data-takeaway]').textContent = m.takeaway;
    root.querySelector('[data-practice]').textContent = m.practice;
    root.querySelector('[data-watch]').href = urlAt(m.start);
  }
  function failVideo() {
    ready = false; loading = false;
    clearTimeout(readyTimeout); clearInterval(timer);
    status('The embedded video could not load. Use “Watch on YouTube” to open this moment.');
  }
  async function play(seconds) {
    pendingTime = seconds;
    if (ready) { player.seekTo(seconds, true); player.playVideo(); return; }
    if (loading) return;
    loading = true; status('Loading video…');
    try {
      const YT = await loadYouTube();
      if (disposed || !root.isConnected) return;
      player?.destroy?.();
      root.querySelector('.ent-video').innerHTML = '<div data-video-mount></div>';
      readyTimeout = setTimeout(failVideo, 15000);
      player = new YT.Player(root.querySelector('[data-video-mount]'), {
        host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%', videoId: resource.videoId,
        playerVars: { origin: location.origin, playsinline: 1, controls: 1, start: Math.floor(pendingTime) },
        events: {
          onReady: event => {
            if (disposed) { event.target.destroy(); return; }
            clearTimeout(readyTimeout); ready = true; loading = false;
            event.target.seekTo(pendingTime, true);
            if (view.tab === 'deeper' && view.resourceTab === 'youtube') event.target.playVideo();
            status('Choose a moment to jump there.');
            timer = setInterval(() => {
              if (!root.isConnected) { cleanup(); return; }
              if (event.target.getPlayerState?.() !== 1) return;
              const time = event.target.getCurrentTime();
              const index = resource.moments.findIndex(m => containsTime(m, time));
              if (index >= 0 && index !== selected) paintMoment(index);
              root.querySelectorAll('[data-moment]').forEach(b => b.setAttribute('aria-current', String(Number(b.dataset.moment) === index)));
            }, 500);
          }, onError: failVideo,
          onAutoplayBlocked: () => status('Press play inside the video to continue at your selected moment.'),
        },
      });
    } catch (_) { if (!disposed) failVideo(); }
  }
  function write(next, target) {
    if (String(getAccount() || 'local-preview') !== account) { status('Your account changed. Reopen this card before saving.', target); return false; }
    if (readFailed) { status('Existing saved items could not be read. They were left untouched.', target); return false; }
    try { localStorage.setItem(storageKey, JSON.stringify(next)); records = next; renderSaved(); return true; }
    catch (_) { status('Could not save on this device. Keep your text here and try again.', target); return false; }
  }
  function renderSaved() {
    root.querySelector('.ent-saved-list').innerHTML = records.length ? records.map(r => `<li><div class="ent-saved-label">${r.kind === 'moment' ? 'VIDEO MOMENT' : 'NEXT STEP'}${r.goal ? ` · ${esc(r.goal)}` : ''}${r.habit ? ` · Habit: ${esc(r.habit)}` : ''}</div><div class="ent-saved-row">${r.kind === 'moment' && resource && r.videoId === resource.videoId ? `<button data-replay="${esc(r.id)}">▶ ${clock(r.seconds)} · ${esc(r.title)}</button>` : '<strong>My next action</strong>'}<button data-remove="${esc(r.id)}" aria-label="Remove saved ${r.kind}">Remove</button></div><p>${esc(r.text)}</p></li>`).join('') : '<li>No saved moments yet. Keep a useful idea from GO DEEPER or save your next action.</li>';
  }
  const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  root.addEventListener('input', e => {
    if (e.target.id === 'ent-moment-note') view.note = e.target.value;
    if (e.target.id === 'ent-action-note') view.action = e.target.value;
  });
  root.querySelector('[data-goal]').value = view.goal;
  const paintGoal = () => { root.querySelector('[data-goal-context]').textContent = goalLabel() ? `For your goal: ${goalLabel()}. Saved moments and next steps will carry this goal.` : 'Choose a goal to connect your learning, or use this card for personal practice.'; };
  root.querySelector('[data-goal]').addEventListener('change', e => { view.goal = e.target.value; paintGoal(); });
  paintGoal();
  root.addEventListener('keydown', e => {
    if (!e.target.matches('[data-tab]') || !['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return;
    const tabs = [...root.querySelectorAll('[data-tab]')];
    const n = tabs.indexOf(e.target);
    const i = e.key === 'Home' ? 0 : e.key === 'End' ? 3 : (n + (e.key === 'ArrowRight' ? 1 : 3)) % 4;
    e.preventDefault(); setTab(tabs[i].dataset.tab, true);
  });
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tab) setTab(b.dataset.tab);
    if (b.hasAttribute('data-habit-step') && habit) {
      setTab('action');
      const field = root.querySelector('#ent-action-note');
      field.placeholder = `For “${habit.name}”: After [my cue], I will [a small, repeatable action].`;
      field.focus();
      status('Choose a cue and a manageable first step. Your existing draft is preserved.', 'action');
    }
    if (b.dataset.format) setFormat(b.dataset.format);
    if (b.hasAttribute('data-start')) play(resource.moments[selected].start);
    if (b.hasAttribute('data-moment')) { const i = Number(b.dataset.moment); paintMoment(i); play(resource.moments[i].start); }
    if (b.hasAttribute('data-confidence')) window.entGoToCard?.('SELF CONFIDENT');
    if (b.dataset.usePractice && resource) {
      const practice = b.dataset.usePractice === 'moment' ? resource.moments[selected].practice : resource[b.dataset.usePractice]?.action;
      if (!practice) return;
      if (!view.action.includes(practice)) view.action = [view.action.trim(), practice].filter(Boolean).join('\n\n').slice(0, 2000);
      root.querySelector('#ent-action-note').value = view.action;
      setTab('action');
      root.querySelector('#ent-action-note').focus();
      status('Practice added to your draft. Make it specific to your goal, then save your next step.', 'action');
    }
    if (b.hasAttribute('data-save-action')) {
      if (!view.action.trim()) { status('Write the step you want to take first.', 'action'); return; }
      if (write([{ id: id(), kind: 'action', text: view.action.trim(), goal: goalLabel(), goalId: view.goal, ...(habit ? { habit: habit.name, habitId: habit.id } : {}) }, ...records], 'action')) { view.action = ''; root.querySelector('#ent-action-note').value = ''; status('Next step saved in MY NOTES.', 'action'); }
    }
    if (b.hasAttribute('data-save-moment')) {
      const raw = ready ? player.getCurrentTime() : pendingTime;
      const seconds = Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : resource.moments[selected].start;
      const at = resource.moments.find(m => containsTime(m, seconds));
      const entry = { id: id(), kind: 'moment', videoId: resource.videoId, seconds, title: at?.title || resource.title, text: view.note.trim() || at?.takeaway || 'A moment to return to.', goal: goalLabel(), goalId: view.goal, ...(habit ? { habit: habit.name, habitId: habit.id } : {}) };
      if (write([entry, ...records], 'moment')) { view.note = ''; root.querySelector('#ent-moment-note').value = ''; status(`Saved at ${clock(seconds)} in MY NOTES.`); }
    }
    if (b.dataset.replay) { const r = records.find(x => x.id === b.dataset.replay); if (!r || !Number.isFinite(r.seconds)) return; setTab('deeper'); setFormat('youtube'); const i = resource.moments.findIndex(m => containsTime(m, r.seconds)); if (i >= 0) paintMoment(i); play(r.seconds); }
    if (b.dataset.remove) { if (write(records.filter(r => r.id !== b.dataset.remove), 'notes')) status('Saved item removed.', 'notes'); }
  });
  function cleanup() { disposed = true; clearInterval(timer); clearTimeout(readyTimeout); player?.destroy?.(); }
  setTab(view.tab); setFormat(view.resourceTab); renderSaved(); if (resource) paintMoment(0);
  if (readFailed) status('Existing saved items could not be read. They were left untouched.', 'notes');
  return cleanup;
}
