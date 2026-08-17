// SLEEP GURUS — "Teacher of the day" on the My Favorites Autoplay page.
// One teacher's section is shown at a time and rotates every 24 hours (UTC day),
// same daily-rotation trick as the player images. Format per teacher:
// name + book (source) → their thought (paragraph) → their points (2-col bullets).

export const SLEEP_GURUS = [
  {
    name: 'Dr. Joseph Murphy',
    src: 'The Power of Your Subconscious Mind',
    think: 'Murphy taught that the subconscious is most open and impressionable in the drowsy state right before sleep. Whatever you feed it as you drift off, it accepts as a command and quietly works to make real — which is why the last words or voices you hear at night carry unusual weight.',
    points: [
      'The subconscious never sleeps — it works your last impressions all night.',
      'Pre-sleep drowsiness slips past the critical, doubting conscious mind.',
      'Repeat a short, positive statement lovingly as you fall asleep.',
      'Feel the wish as already fulfilled — the feeling is the instruction.',
      'Same time each night deepens the groove.',
    ],
  },
  {
    name: 'Neville Goddard',
    src: 'The Power of Awareness · Feeling Is the Secret',
    think: 'Neville called the half-asleep moment the "state akin to sleep" — the ideal doorway to the subconscious. In that borderland, he said, assume the feeling of your wish already fulfilled and let it loop as you drift off, impressing the desired identity on the deeper mind.',
    points: [
      'Get drowsy and relaxed before you plant the idea.',
      'Assume the feeling of the wish fulfilled — live from the end.',
      'Loop a short "I AM" scene that implies it’s already done.',
      'Fall asleep inside that assumption.',
      'What you carry into sleep, you carry into your world.',
    ],
  },
  {
    name: 'Dr. Wayne Dyer',
    src: 'Wishes Fulfilled · I Can See Clearly Now',
    think: 'Dyer taught that the last five minutes before sleep are the most important of your day: whatever you hold in mind there marinates in your subconscious for the next eight hours. He urged dwelling on your "I AM" wishes fulfilled — and even letting a calm affirmation track play you into sleep.',
    points: [
      'Guard the final five minutes — no news, no worry, no scrolling.',
      'Put attention on who you intend to become, as if it’s done.',
      '"I AM" are the two most creative words you own.',
      'Let a gentle affirmation audio carry you under.',
      'Repeat again in the first five minutes on waking.',
    ],
  },
  {
    name: 'Émile Coué',
    src: 'Self-Mastery Through Conscious Autosuggestion',
    think: 'The French pioneer of conscious autosuggestion had people repeat one phrase — "Every day, in every way, I’m getting better and better" — softly, about twenty times, as they fell asleep. Effortless repetition at sleep onset, he found, reaches the imagination far more powerfully than willpower ever can.',
    points: [
      'Keep it to one short, positive phrase.',
      'Whisper it effortlessly — never strain or "try."',
      'About twenty easy repetitions as you drift off.',
      'Imagination beats willpower — let words paint, not push.',
      'Nightly reps quietly compound.',
    ],
  },
  {
    name: 'Shad Helmstetter',
    src: 'What to Say When You Talk to Your Self',
    think: 'Helmstetter argued we’re programmed by the self-talk we repeat, and the fastest way to overwrite old programming is to hear new, positive self-talk again and again — including recordings played quietly while you sleep. The brain, he said, doesn’t argue with what it hears enough times.',
    points: [
      'You become the sum of the self-talk you repeat.',
      'Hearing new self-talk rewires faster than reading it.',
      'Play affirmation audio softly during sleep and quiet hours.',
      'Keep it present-tense, first-person, positive.',
      'Repetition — not intensity — does the reprogramming.',
    ],
  },
  {
    name: 'Dr. Bruce Lipton',
    src: 'The Biology of Belief',
    think: 'Lipton popularized the idea that the subconscious runs about 95% of our behavior, and that it’s most reprogrammable in the theta brain-wave state — the same drowsy, hypnagogic window you pass through falling asleep and waking. Playing affirmations there, he suggests, helps rewrite the programs installed in childhood.',
    points: [
      'The subconscious drives ~95% of daily behavior.',
      'Theta — the sleepy state — is when the mind is most programmable.',
      'The hypnagogic window at sleep onset is prime rewrite time.',
      'Repetition installs the new program, like recording over a tape.',
      'Pair the audio with a relaxed body for best uptake.',
    ],
  },
];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Which teacher shows today. Whole days since the Unix epoch, mod the roster —
// advances by one at each UTC midnight so the section changes every 24 hours.
export function dailyGuruIndex() {
  const day = Math.floor(Date.now() / 86400000);
  return ((day % SLEEP_GURUS.length) + SLEEP_GURUS.length) % SLEEP_GURUS.length;
}

export function renderDailyGuru() {
  const box = document.getElementById('dailyGuru');
  if (!box) return;
  const i = dailyGuruIndex();
  const g = SLEEP_GURUS[i];
  box.innerHTML =
    '<div class="gb-eyebrow">Why play it as you drift off</div>' +
    '<p class="gb-intro">The autoplay you build here isn’t background noise — it’s the last thing your mind hears before sleep. Every teacher below points to the same window: the drowsy minutes as you fade off, when the subconscious is wide open to the words and voices you feed it.</p>' +
    '<div class="gb-daytag">Teacher of the day · a new one every 24 hours · ' + (i + 1) + ' of ' + SLEEP_GURUS.length + '</div>' +
    '<div class="guru-sec">' +
      '<h3>' + esc(g.name) + '</h3>' +
      '<div class="gb-src">' + esc(g.src) + '</div>' +
      '<p class="gb-think">' + esc(g.think) + '</p>' +
      '<ul>' + g.points.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul>' +
    '</div>';
}

if (typeof window !== 'undefined') window.renderDailyGuru = renderDailyGuru;
