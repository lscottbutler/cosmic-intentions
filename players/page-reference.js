// Page-specific learning references. Summaries are paraphrases; application tips
// are CI's suggestions, not quotations or endorsements by the named authors.
export const TEACHERS = {
  systems: {
    name: 'James Clear', source: 'Goal Setting: A Scientific Guide',
    url: 'https://jamesclear.com/goal-setting',
    thought: 'Clear distinguishes the result you want from the routine that can move you toward it. A goal gives direction; a repeatable process gives you something concrete to work on today.',
    points: ['Choose one priority for this session.', 'Name an action you can repeat.', 'Give that action a time and place.', 'Review the process as you learn.'],
  },
  habits: {
    name: 'James Clear', source: 'Habit Stacking',
    url: 'https://jamesclear.com/habit-stacking',
    thought: 'Clear recommends connecting a small new behavior to a routine that already happens. The existing routine becomes a cue, making it easier to remember what comes next.',
    points: ['Pick a reliable daily cue.', 'Start with a small, specific behavior.', 'Put the new action after that cue.', 'Adjust the cue if the timing keeps failing.'],
  },
  progress: {
    name: 'James Clear', source: 'The Ultimate Habit Tracker Guide',
    url: 'https://jamesclear.com/habit-tracker',
    thought: 'Clear describes tracking as immediate feedback: a visible record of whether you showed up. Small completed actions can make progress easier to see while larger results take time.',
    points: ['Record what you actually completed.', 'Keep the record simple.', 'Notice which actions are becoming consistent.', 'Use a missed day to adjust your next attempt.'],
  },
  woop: {
    name: 'Gabriele Oettingen', source: 'WOOP: Wish, Outcome, Obstacle, Plan',
    url: 'https://woopmylife.org/en/practice',
    thought: 'Oettingen’s WOOP practice connects an important wish and an imagined outcome with an obstacle in yourself and a plan for responding. Imagining the desired result is followed by considering what could get in the way.',
    points: ['Choose a meaningful, feasible wish.', 'Imagine its most important outcome.', 'Identify an inner obstacle.', 'Decide what you will do when that obstacle appears.'],
  },
  attention: {
    name: 'Sharon Salzberg', source: 'Just Sit',
    url: 'https://www.sharonsalzberg.com/just-sit',
    thought: 'Salzberg describes concentration as returning attention to a chosen object, such as the breath. When the mind wanders, recognizing that and beginning again is part of the practice. Awareness and kindness accompany that return.',
    points: ['Choose a comfortable position.', 'Let the breath settle naturally.', 'Notice when your attention wanders.', 'Return gently, without judging the distraction.'],
  },
  gratitude: {
    name: 'Robert Emmons', source: '10 Ways to Become More Grateful',
    url: 'https://greatergood.berkeley.edu/article/item/ten_ways_to_become_more_grateful1',
    thought: 'Emmons encourages deliberately remembering good things in ordinary life, including help from other people. Recording specific moments gives you material to revisit, and remembering earlier difficulties can help you recognize what has changed.',
    points: ['Name one specific moment.', 'Notice who contributed to it.', 'Describe why it matters to you.', 'Return to the entry and notice what you appreciate now.'],
  },
  organize: {
    name: 'David Allen', source: 'Getting Things Done: The Fundamentals',
    url: 'https://gettingthingsdone.com/what-is-gtd/',
    thought: 'Allen’s method separates collecting ideas from deciding what they mean. Capture what has your attention, clarify any next action, organize it, and review it regularly so the information supports a decision.',
    points: ['Write down the thought before you lose it.', 'Separate reference material from an action.', 'Put it with the goal or task it belongs to.', 'Review it before deciding what to do next.'],
  },
  autosuggestion: {
    name: 'Émile Coué', source: 'Self Mastery Through Conscious Autosuggestion',
    url: 'https://www.gutenberg.org/files/27203/27203-h/27203-h.htm',
    thought: 'Coué advocated simple, gently repeated suggestions, including a brief routine on waking and before sleep. This is his historical perspective on working with imagination and self-talk, rather than proof that repeating words guarantees an outcome.',
    points: ['Choose a short phrase you can understand.', 'Repeat it calmly rather than forcing a feeling.', 'Notice whether the words are useful to you.', 'Connect your chosen words with an action today.'],
  },
  entrepreneur: {
    name: 'Steve Blank', source: 'Customer Development',
    url: 'https://steveblank.com/tag/customer-development/',
    thought: 'Blank frames early business ideas as hypotheses to test with customers. Learning about their problems and needs helps a founder decide what to keep, change, or investigate next.',
    points: ['Write down one assumption.', 'Talk with someone who has the problem.', 'Record what you heard separately from your interpretation.', 'Choose a small next experiment.'],
  },
};

// Title, page-specific application, and relevant teacher roster.
export const PAGE_REFERENCES = {
  dashboard: ['Build a daily practice', 'Use the Citadel to choose a focus, take an action, and return to what you learned.', ['systems','organize']],
  setup: ['Give your goal a practical direction', 'Use your goal statement to choose a repeatable action and make space for it in your day.', ['systems','woop']],
  habits: ['Make showing up easier', 'Use this checklist to remember your routines and record what you completed today.', ['habits','progress']],
  myroadmap: ['Turn a goal into the next action', 'Keep the next step clear enough to begin. Use task notes to record obstacles, decisions, and what you learn.', ['organize','woop']],
  vizlibrary: ['Picture the outcome, then prepare to act', 'Use a visualization session to explore a meaningful outcome. Afterwards, decide how you will respond to a real obstacle.', ['woop','systems']],
  vizgoal: ['Give your mental rehearsal a next step', 'Explore the goal in your visualization, then record an action you can take toward it.', ['woop','systems']],
  meditation: ['Practice coming back to the present', 'Use your chosen session as time to notice your attention and gently return. You can begin with a short session.', ['attention','habits']],
  notes: ['Choose the words you return to', 'Use My Thoughts to keep language that matters to you, then notice how it relates to your choices.', ['autosuggestion','organize']],
  mynotes: ['Reflect on what happened', 'Use your journal to record an experience, what it meant to you, and what you want to revisit.', ['organize','gratitude']],
  tasknotes: ['Make notes useful when you return', 'Keep your observations beside the goal or action they concern, so you can find them when deciding what comes next.', ['organize','systems']],
  goalworkspace: ['Keep the goal and its evidence together', 'Review your actions, notes, and journal entries together to see what has changed and choose your next move.', ['organize','woop']],
  gratitude: ['Notice something specific to appreciate', 'Use this space to pause over an ordinary moment, a person, or something you might otherwise pass by.', ['gratitude']],
  wins: ['Make your progress visible', 'Record a concrete win, including the smaller actions that helped it happen.', ['progress','gratitude']],
  proof: ['Keep a record you can return to', 'Save specific evidence of what you did or learned, and use it to review your direction.', ['progress','organize']],
  cosmiclibrary: ['Turn learning into practice', 'Choose a resource that fits your current goal, capture one useful idea, and decide how to try it.', ['organize','systems']],
  entcard: ['Learn, test, and build', 'Explore an entrepreneur skill, use the existing learning resources, and turn one idea into an experiment.', ['entrepreneur','systems']],
  runthroughs: ['Return to your daily routines', 'Check what you have completed and choose one small action to do next.', ['habits','progress']],
};

const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function referenceHTML(page, offset = 0, now = Date.now()) {
  const entry = PAGE_REFERENCES[page];
  if (!entry) return '';
  const [title,intro,roster] = entry;
  const index = ((Math.floor(now / 86400000) + offset) % roster.length + roster.length) % roster.length;
  const teacher = TEACHERS[roster[index]];
  return `<div class="ci-reference-eyebrow">${esc(title)}</div><p class="ci-reference-intro">${esc(intro)}</p>
    <div class="ci-reference-day">${roster.length > 1 ? `Teacher of the day · ${index+1} of ${roster.length}` : 'Teacher perspective'}</div>
    <div class="ci-reference-teacher"><h3>${esc(teacher.name)}</h3><a class="ci-reference-source" href="${esc(teacher.url)}" target="_blank" rel="noopener noreferrer">${esc(teacher.source)} ↗</a>
    <p>${esc(teacher.thought)}</p><h4>Try this here</h4><ul>${teacher.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul></div>
    ${roster.length > 1 ? '<button type="button" class="ci-reference-next">Another perspective</button>' : ''}`;
}

function ensureStyles(doc) {
  if (doc.getElementById('ciReferenceStyles')) return;
  const style = doc.createElement('style'); style.id = 'ciReferenceStyles';
  style.textContent = `
    .ci-page-reference{box-sizing:border-box;background:#fff;color:#222;border:1px solid #d9dee5;border-radius:14px;padding:26px 28px;margin:24px 0;font:inherit;text-align:left;grid-column:1/-1;min-width:0}
    .ci-page-reference[hidden]{display:none!important}
    .ci-page-reference .ci-reference-eyebrow{font-size:13px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#b77400}
    .ci-page-reference p{font-size:17px;line-height:1.65;margin:12px 0;color:#30343b}
    .ci-page-reference .ci-reference-intro{font-size:18px}
    .ci-reference-day{display:inline-block;padding:6px 13px;border:1px solid #d9dee5;border-radius:24px;background:#f5f5f5;color:#737b86;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase}
    .ci-reference-teacher{border-top:1px solid #d9dee5;margin-top:20px;padding-top:20px}
    .ci-reference-teacher h3{margin:0 0 5px;font-size:24px;line-height:1.25;color:#171717}
    .ci-reference-teacher h4{font-size:14px;margin:16px 0 8px;color:#333}
    .ci-reference-source{font-size:14px;font-style:italic;color:#586579;overflow-wrap:anywhere}
    .ci-reference-teacher ul{columns:240px 2;column-gap:34px;margin:0;padding-left:20px;color:#222;font-size:16px;line-height:1.8}
    .ci-reference-teacher li{break-inside:avoid}
    .ci-page-reference .ci-reference-next{margin-top:18px;padding:9px 14px;border:0;border-radius:8px;background:#000;color:#fff;font:inherit;font-size:14px;cursor:pointer}
    .ci-page-reference a:focus-visible,.ci-page-reference button:focus-visible{outline:2px solid #1d3557;outline-offset:3px}
    @media(max-width:600px){.ci-page-reference{padding:22px 20px}.ci-reference-teacher ul{columns:1}}
  `;
  doc.head.appendChild(style);
}

export function mountPageReference(root, page) {
  if (!root || !PAGE_REFERENCES[page]) return;
  const doc = root.ownerDocument; ensureStyles(doc);
  let box = root.querySelector(':scope > .ci-page-reference');
  if (!box) { box=doc.createElement('section'); box.className='ci-page-reference'; root.appendChild(box); }
  box.setAttribute('aria-label','Teacher reference');
  const before = root.querySelector(':scope > .ci-admin-page-box-stack--bottom');
  if (before) root.insertBefore(box,before);
  let offset=0;
  const render=()=>{box.innerHTML=referenceHTML(page,offset);};
  box.onclick=event=>{if(event.target.closest('.ci-reference-next')){offset++;render();}};
  render(); return box;
}

// Only the standalone engines/home need a reference in the outer player.
// App workspaces render their own reference before their bottom admin box.
export function renderMasterReference(deck, action) {
  const page = action === 'meditation' ? 'meditation' : ['home','citadel'].includes(action) ? 'dashboard' : null;
  const current=deck.querySelector(':scope > .ci-page-reference');
  if (!page) {current?.remove();return;}
  mountPageReference(deck,page);
}
