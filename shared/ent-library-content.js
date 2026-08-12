/* ── ENTREPRENEUR LIBRARY — fixed, community-shared card content ──────────────
   The first Identity Library. Content here is AI-authored ONCE and FROZEN: every
   Cosmic member sees the SAME affirmations, beliefs, roadmap and directive per
   card, so the community has common reference points to discuss in the forum.
   (NOT per-user, NOT regenerated at runtime.)

   Card order + labels mirror netlify/functions/_entrepreneur-library.js.
   `img` maps to a file in images/entrepreneur-library/. Fill `content` for each
   card as it's authored; cards without content show title/art only for now. */

export const ENT_CARD_TYPE = 'WINNING ATTITUDE';

export const ENT_CARDS = [
  { n: 1,  key: 'DISCIPLINED',            title: 'I AM DISCIPLINED' },
  { n: 2,  key: 'RISK TAKER',             title: 'I AM A RISK TAKER' },
  { n: 3,  key: 'STRATEGIC THINKER',      title: 'I AM A STRATEGIC THINKER' },
  { n: 4,  key: 'EXECUTING STRATEGY',     title: 'I EXECUTE STRATEGY' },
  { n: 5,  key: 'SELF CONFIDENT',         title: 'I AM SELF-CONFIDENT',
    directive: 'Your confidence is internally sourced. Move without waiting for permission — the proof arrives after the step, never before it.',
    affirmations: [
      'I am self-confident. My certainty is earned, not borrowed.',
      'I trust myself to figure it out as I go.',
      'I do not need anyone’s permission to move.',
      'My confidence is the signal, not the noise.',
      'I was built for exactly this.',
    ],
    beliefs: [
      'Confidence is a decision I make daily, not a feeling I wait for.',
      'Every win is confirmation of what I already knew about myself.',
      'Doubt is a visitor, not a resident.',
      'I act first; the evidence follows.',
      'My self-belief is internally sourced and inexhaustible.',
    ],
    roadmap: [
      'Name one thing today you’ll do without asking permission.',
      'Start a daily proof log — one line of evidence you’re capable.',
      'Take the step before you feel ready; ready comes after.',
      'Replace “I hope” with “I know” when you speak about your goals.',
      'Surround your space with visible evidence of past wins.',
      'When doubt speaks, act anyway within five minutes.',
      'Review the proof log weekly and watch the certainty compound.',
    ],
  },
  { n: 6,  key: 'PASSIONATE',             title: 'I AM PASSIONATE' },
  { n: 7,  key: 'PROFITABLE',             title: 'I AM PROFITABLE' },
  { n: 8,  key: 'GREAT SALES PERSON',     title: 'I AM A GREAT SALESPERSON' },
  { n: 9,  key: 'SKILLFUL COMMUNICATOR',  title: 'I AM A SKILLFUL COMMUNICATOR' },
  { n: 10, key: 'EMPATHETIC',             title: 'I AM EMPATHETIC' },
  { n: 11, key: 'STRONG WORK ETHIC',      title: 'I HAVE A STRONG WORK ETHIC' },
  { n: 12, key: 'SELF STARTER',           title: 'I AM A SELF-STARTER' },
  { n: 13, key: 'SELF PROMOTER',          title: 'I PROMOTE MYSELF BOLDLY' },
  { n: 14, key: 'RESPECTED MANAGER',      title: 'I AM A RESPECTED MANAGER' },
  { n: 15, key: 'LIVING THE BRAND',       title: 'I AM LIVING THE BRAND' },
  { n: 16, key: 'MANAGING TIME WISELY',   title: 'I MANAGE TIME WISELY' },
  { n: 17, key: 'SUCCESSFUL NEGOTIATOR',  title: 'I AM A SUCCESSFUL NEGOTIATOR' },
  { n: 18, key: 'QUALITY PEOPLE',         title: 'I ATTRACT QUALITY PEOPLE' },
  { n: 19, key: 'EXECUTING CONCEPT',      title: 'I EXECUTE MY CONCEPTS' },
  { n: 20, key: 'FACILITATOR',            title: 'I AM A FACILITATOR' },
  { n: 21, key: 'OUTSIDE BOX',            title: 'I THINK OUTSIDE THE BOX' },
  { n: 22, key: 'FAIRNESS',              title: 'I LEAD WITH FAIRNESS' },
  { n: 23, key: 'GOOD LISTENER',          title: 'I AM A GOOD LISTENER' },
  { n: 24, key: 'METICULOUS PLANNER',     title: 'I AM A METICULOUS PLANNER' },
  { n: 25, key: 'AWARE OF LIMITATIONS',   title: 'I AM AWARE OF MY LIMITATIONS' },
  { n: 26, key: 'BALANCE IN LIFE',        title: 'I HAVE BALANCE IN LIFE' },
  { n: 27, key: 'CHARMING',               title: 'I AM CHARMING' },
  { n: 28, key: 'COMFORTABLE DELEGATING', title: 'I AM COMFORTABLE DELEGATING' },
  { n: 29, key: 'COMPETITIVE',            title: 'I AM COMPETITIVE' },
  { n: 30, key: 'DETERMINED TO SUCCEED',  title: 'I AM DETERMINED TO SUCCEED' },
  { n: 31, key: 'ORGANIZATIONAL SKILLS',  title: 'I HAVE STRONG ORGANIZATIONAL SKILLS' },
];

/* Look up a card by key (case-insensitive) or by number. */
export function getEntCard(idOrKey) {
  if (idOrKey == null) return null;
  if (typeof idOrKey === 'number') return ENT_CARDS.find(c => c.n === idOrKey) || null;
  const k = String(idOrKey).toUpperCase().trim();
  return ENT_CARDS.find(c => c.key === k) || null;
}

/* Has this card been authored with its frozen content yet? */
export function entCardHasContent(c) {
  return !!(c && c.directive && c.affirmations && c.roadmap);
}
