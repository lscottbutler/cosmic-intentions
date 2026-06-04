/* ─────────────────────────────────────────────────────────
   CONTENT BANK — Rotating affirmations, beliefs, quotes, stoic
   Daily seed: same content all day, rotates at midnight.
   Personal layer: mixes user's own Pegboard data in pass 2.
───────────────────────────────────────────────────────── */

const CONTENT_BANK = {

  affirmations: [
    "I am becoming the person my future self already is.",
    "Every action I take today is an investment in who I'm becoming.",
    "I do not pursue success. I embody it.",
    "My consistency is my competitive advantage.",
    "I am the architect of my own reality.",
    "The work I do in private creates the life I live in public.",
    "I move through resistance — that's where growth lives.",
    "My standards are non-negotiable.",
    "I show up fully, even when no one is watching.",
    "I am not chasing a life. I am building one.",
    "Progress over perfection. Every single day.",
    "I trust the process because I built the process.",
    "My mind is clear. My intention is set. Let's go.",
    "I am exactly where I need to be, moving exactly where I choose.",
    "Discipline is my freedom.",
  ],

  beliefs: [
    "The gap between who I am and who I want to be is closed by daily action.",
    "What I repeatedly do defines me — not what I occasionally attempt.",
    "Discomfort is a signal I am in the right place.",
    "I believe my environment should reflect my ambitions.",
    "Small actions, compounded relentlessly, create extraordinary outcomes.",
    "I am not limited by my past. I am shaped by my choices.",
    "The people I surround myself with are a reflection of my standards.",
    "Everything I need is already inside me — waiting to be activated.",
    "My beliefs create my reality. I choose them deliberately.",
    "I do not need external validation to feel certain about my direction.",
    "The version of me I visualize today is the version I become tomorrow.",
    "Fear of failure is just unspent courage. I spend it.",
    "My energy is finite. I protect it like capital.",
  ],

  quotes: [
    { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
    { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
    { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
    { text: "It is not that I'm so smart. But I stay with the questions much longer.", author: "Albert Einstein" },
    { text: "The first principle is that you must not fool yourself — and you are the easiest person to fool.", author: "Richard Feynman" },
    { text: "We suffer more in imagination than in reality.", author: "Seneca" },
    { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
    { text: "He who fears death will never do anything worthy of a living man.", author: "Seneca" },
    { text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus" },
    { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
    { text: "The quality of your attention determines the quality of your work.", author: "Naval Ravikant" },
    { text: "Desire nothing for yourself which you would not desire for others.", author: "Spinoza" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.", author: "Aristotle" },
    { text: "Do not go where the path may lead — go instead where there is no path and leave a trail.", author: "Emerson" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Vision without execution is hallucination.", author: "Thomas Edison" },
  ],

  stoic: [
    "Ask yourself each morning: what is within my control today?",
    "Judge nothing before acting. Act before judging yourself.",
    "A man who suffers before it is necessary suffers more than necessary.",
    "The wise man looks forward to death, not with fear, but with readiness.",
    "Begin at once to live — and count each separate day as a separate life.",
    "If it is not right, do not do it. If it is not true, do not say it.",
    "The obstacle is not in your way. It is your way.",
    "You cannot step into the same river twice. Make today new.",
    "Confine yourself to the present.",
    "React less. Respond with intention.",
    "Today's discipline is tomorrow's freedom.",
    "Your reputation is what others think of you. Your character is what you are.",
    "Retreat into yourself as much as you can — associate with those who will make you better.",
  ],
};

/* ── DAILY SEED ──────────────────────────────────────────
   Returns a consistent index for today across the site.
   Same content all day — resets at midnight.
───────────────────────────────────────────────────────── */
function _dailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function _pick(arr, offset) {
  const seed = _dailySeed() + (offset || 0);
  return arr[seed % arr.length];
}

/* ── PUBLIC API ──────────────────────────────────────────
   getDailyAffirmation()  → string
   getDailyBelief()       → string
   getDailyQuote()        → { text, author }
   getDailyStoic()        → string
   getDailyLine(slot)     → formatted HTML string for a given slot
───────────────────────────────────────────────────────── */
function getDailyAffirmation()  { return _pick(CONTENT_BANK.affirmations, 0); }
function getDailyBelief()       { return _pick(CONTENT_BANK.beliefs, 7); }
function getDailyQuote()        { return _pick(CONTENT_BANK.quotes, 3); }
function getDailyStoic()        { return _pick(CONTENT_BANK.stoic, 11); }

/* Slot-specific formatted HTML */
function getDailyLine(slot) {
  switch (slot) {

    case 'sidebar': {
      const s = getDailyStoic();
      return `<div id="dailySidebarQuote" style="
        font-size:10px;color:#404048;font-style:italic;
        line-height:1.5;margin-top:6px;padding-top:6px;
        border-top:1px solid #1a1a1a;letter-spacing:0.2px;
      ">${s}</div>`;
    }

    case 'dashboard-sub': {
      const a = getDailyAffirmation();
      return `<div id="dailyDashAffirmation" style="
        font-size:11px;color:#F5A623;font-style:italic;
        margin-top:8px;line-height:1.5;letter-spacing:0.2px;
        border-left:2px solid #F5A62355;padding-left:10px;
      ">${a}</div>`;
    }

    case 'home-banner': {
      const q = getDailyQuote();
      return `<div id="dailyHomeBanner" style="
        text-align:center;padding:28px 24px;
        border-top:1px solid #1a1a1a;border-bottom:1px solid #1a1a1a;
        margin:0;
      ">
        <div style="font-size:14px;color:#888;font-style:italic;line-height:1.6;max-width:480px;margin:0 auto;">
          "${q.text}"
        </div>
        <div style="font-size:11px;color:#444;margin-top:8px;letter-spacing:1px;text-transform:uppercase;">
          — ${q.author}
        </div>
      </div>`;
    }

    default: return '';
  }
}

/* ── PERSONAL LAYER (pass 2) ─────────────────────────────
   Mixes user's own Pegboard beliefs/quotes into rotation.
   Call after getPB() is available.
───────────────────────────────────────────────────────── */
function injectPersonalContent() {
  try {
    const pb = typeof getPB === 'function' ? getPB() : {};
    if (pb['pb-beliefs']) {
      const personal = pb['pb-beliefs'].split('\n').map(s => s.trim()).filter(Boolean);
      if (personal.length) CONTENT_BANK.beliefs.push(...personal);
    }
    if (pb['pb-attitudes']) {
      const attitudes = pb['pb-attitudes'].split('\n').map(s => s.trim()).filter(Boolean);
      if (attitudes.length) CONTENT_BANK.affirmations.push(...attitudes);
    }
  } catch(e) {}
}
