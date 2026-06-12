# HOME PAGE REDUX — Gemini Chat Brief
## Date: May 28, 2026
## Paste this at the top of your Gemini chat.

---

## Stack
- **Netlify** static hosting — no server-side code
- **Supabase** auth + Postgres — use `sb` not `supabase` (CDN conflict)
- **Single file**: `index.html` (all UI, CSS, JS — 277KB+, large)
- No framework, no bundler. Pure HTML/CSS/JS.
- All changes push to GitHub → Netlify auto-deploys

---

## Project: Cosmic Intentions
Personal goals and visualization web app.
- Users set "intentions" (goals written as affirmations: "I AM earning $10k/month")
- App provides: visualization timers, meditations, AI roadmaps, gratitude players, community feed
- Members pay $19/mo or $149/year

---

## Today's Task: Home Page Redux
We're rebuilding/redesigning the home page (`index.html`, the `#page-home` div).
The home page has TWO states:
1. **Logged-out** — public landing page (hero + features + pricing)
2. **Logged-in** — member home dashboard

---

## Current Home Page — Logged-Out State

**HTML location:** `index.html` → `<div id="homeLoggedOut">`

```
Structure:
├── .home-hero
│   ├── h1: "Set your intentions. Live your vision."
│   ├── p: "Your Personal Operating System for Life Design..."
│   └── .home-cta-row → [Get Started Free] [Member Log In]
├── .home-features (4 feature cards, emoji icons)
│   ├── My Pegboard
│   ├── 3-Level Dashboard System
│   ├── Action System
│   └── Cosmic Ecosystem
└── .home-pricing
    ├── Annual: $149/year (BEST VALUE badge)
    └── Monthly: $19/mo
    + "7-day free trial · No credit card required"
```

**CSS notes:**
- `.home-hero`: centered, padding 48px top, h1 font-size 28px, bold 800
- `.home-hero h1 em`: accent color (var(--accent) = cosmic blue)
- `.feature-card`: `background: var(--off)`, border, radius, emoji icon 22px
- `.home-price-card.featured`: highlighted best value card

---

## Current Home Page — Logged-In State

**HTML location:** `index.html` → `<div id="homeLoggedIn">`

```
Structure:
├── .home-astronaut-wrap (centered, padding-top 28px)
│   └── .home-astronaut-circle (200×200px circle)
│       ├── background: #FFFFFF
│       ├── border: 19px solid #2DA8E0
│       └── img: images/astronaut-meditation.png
└── .home-member-cols (flex row, gap 20px, padding 20px)
    ├── .home-col-left (flex: 1, two panels stacked)
    │   ├── .home-whats-new "⚡ What's New"
    │   │   └── 5 news items (dot + text)
    │   └── .home-whats-new "📚 New in Cosmic Library"
    │       └── 4 library update items
    └── .home-col-right (280px fixed width)
        └── .home-member-hero
            ├── h2: "Welcome back ✦"
            ├── p: "Your Personal Development Arsenal is ready."
            ├── [✦ Member Dashboard] (black btn, full width)
            └── [🌌 Community Feed] (secondary btn)
```

**CSS notes:**
- `.home-astronaut-circle`: 200px circle, white bg, 19px blue border (#2DA8E0)
- `.home-member-cols`: flex row, left col grows, right col 280px fixed
- `.home-whats-new-hdr`: background #252525, white text, uppercase, 11px
- `.home-whats-new-body`: news items with 6px accent-color dot, 13px gray text
- `.btn-member-login`: black bg, white text, 16px bold, full width, max 280px

---

## Recent Home Page History (git log)

```
775e2a8  Remove video placeholder — new video pending
dc9902e  Home page — video player below Community Feed button (video served locally)
ade788c  Swap to TINY FLOATING ASTRONAUT image
a23d7ff  Home page — meditating astronaut centered at top, white circle blue border
86a3f0b  Home page — 2-column layout: news left, buttons right
```

**Video note:** A video (`92 SLIDES.mp4`, 122MB) was planned below the Community Feed button. The placeholder was removed — video not yet embedded (too large for GitHub, pending Cloudflare Stream URL).

---

## Rules — Don't Break These
- `sb` not `supabase` everywhere
- No server-side code — Netlify is static only
- Do not suggest new Supabase tables without asking
- `DEV_MODE = true` stays as-is
- `index.html` is very large — when reading, always use offset/limit
- Always push to GitHub after every commit

---

## Output Format
- Step-by-step. Name the exact element, class, or ID being changed.
- No filler text. No intro. Just the answer.
- Code: full block, not partial snippets.
- End with: what changed + what's next (one line).
