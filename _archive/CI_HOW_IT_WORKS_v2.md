# Cosmic Intentions (C.I.): How It Works
*Updated 2026-06-02 — reflects actual current build*

---

## Executive Summary

Cosmic Intentions is a behavioral masterstroke — hacking the human psyche's intention-action gap by leveraging the simple truth: **We move toward what we think about most.**

Built on Humanistic Psychology principles, C.I. empowers users as creative beings, turning limiting beliefs into unbreakable momentum via AI-enhanced dashboards, visualization players, and guided sessions.

**Target:** Lifelong learners like "Jane" — frustrated by fragmented self-help, craving a unified space for missions, goals, and visualizations.

**Success vision:** A worldwide phenomenon, donating 100K+ subs to nonprofits, praised by A-listers, proving "this shit works" through measurable wins.

**Launch strategy:** Killer VSL first for traction, then partnerships for scale.

**Market fit:** In a $50B+ personal dev boom, C.I.'s AI personalization closes the 96% failure rate in goals, aiming for 10M users (1/10 Headspace size) via habit loops and belief shifts.

---

## Part 1: The Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Hosting | **Netlify** | Static file hosting. No server-side code. |
| Auth + Database | **Supabase** (postgres) | User auth, personal data storage |
| Data Source | **Google Sheets** | Content libraries accessed via Sheets API / Apps Script |
| Frontend | **Vanilla HTML/CSS/JS** | No build step. No bundler. Pure files served directly. |
| AI Voice | **OpenAI TTS** | Text-to-speech for all player VO scripts |
| AI Content | **OpenAI + Claude API** | Content generation (via Netlify Functions — keys never in frontend) |
| Vision Board Images | **Pexels API** | Keyword-extracted image search for Digital Vision Boards |
| Deployment | **GitHub → Netlify** | Push to `main` → auto-deploys to cosmicintentions.com |

**Live at:** `cosmicintentions.com`

**Critical naming rule:** Supabase client is always called `sb` — never `supabase` (CDN conflict).

---

## Part 2: How It Works — The Architecture

### The Two Dashboards

**`index.html` — The Main Portal**
The primary dashboard. User's hub for all content: their goals, affirmations, beliefs, visualization access, and AI-generated content. This is the entry point after login. Large file (~277KB) — the heart of the app.

**`arsenal.html` — The Gallery White Dashboard**
A premium, high-end alternate experience. Aesthetic: pure white backgrounds, black text, luxury boutique feel ("Gallery White"). Built as a bolt-on to the main portal — same data, elevated presentation.

### The Players (Content Experiences)

All players live in the `players/` folder. Each is a standalone HTML page launched from the main dashboard. Shared utilities (image rotation, TTS, bells, navigation) live in `shared/player-core.js`.

| Player | File | What It Does |
|--------|------|-------------|
| **Visual Countdown** | `visual-countdown.html` | Full-screen immersive timer with goal text, rotating background images, VO narration, eye open/close icon synced to TTS timing |
| **Countdown** | `countdown.html` | Focused countdown timer. 60 / 30 / 15 minute buttons (circular PNG icons). Launches Visual Countdown with goal + duration via localStorage |
| **Visualization Quick** | `viz-quick.html` | Short guided visualization session |
| **Visualization 10-Min** | `viz-10min.html` | Full 10-minute guided visualization |
| **Meditation** | `meditation.html` | Guided meditation player with background imagery |
| **Meditation Select** | `meditation-select.html` | Library selector for meditation sessions |
| **Meditation Timer** | `meditation-timer.html` | Standalone timer for self-guided meditation |
| **Gratitude** | `gratitude.html` | Guided gratitude session |
| **Video** | `video.html` | Video player for visualization/motivation content |

### Daily Rotating Images
Each player has a unique rotating background image system. Images cycle daily using `PLAYER_OFFSETS` — each player gets a different image on the same day, so the experience always feels fresh. Image library compressed from 181MB → 14MB.

### The Content Pipeline (3-Pass)
All AI-generated content runs through a 3-pass filter before displaying to users:
1. **Raw** — initial AI output
2. **Refine** — cleaned, tightened
3. **Belief System Filter** — checked against C.I. values (positive, empowering, no toxic positivity)

---

## Part 3: The Netlify Functions (Serverless API)

API keys are **never** in frontend code. All external API calls go through Netlify Functions at `/api/*`.

| Function | File | Purpose |
|----------|------|---------|
| `tts` | `netlify/functions/tts.js` | OpenAI text-to-speech — powers all VO narration |
| `generate-content` | `netlify/functions/generate-content.js` | AI content generation for dashboards |
| `image-search` | `netlify/functions/image-search.js` | Vision Board: keyword extraction (OpenAI) + Pexels image search |
| `image-generate` | `netlify/functions/image-generate.js` | AI image generation |
| `claude` | `netlify/functions/claude.js` | Claude API calls |

**Env vars** set in Netlify dashboard (never in code): `OPEN_AI_KEY`, `PEXELS_API_KEY`
Changes to env vars require a redeploy (push to `main`) to take effect.

---

## Part 4: The Visualization Experience (Rolex Build)

The current build milestone is the **Rolex / Arsenal phase** — the most premium, immersive expression of C.I.

**Visual Countdown flow:**
1. User sets goal + duration on `countdown.html`
2. Goal text + duration passed to `visual-countdown.html` via `localStorage`
3. Full-screen experience: rotating background image, goal text overlay, AI VO narration
4. Eye open/closed icon fades in sync with TTS timing
5. Bell chimes at completion, returns user to app

**Visualization scenes:** 13 scenes, 300-frame intervals (e.g., the Rolex sequence — seeing yourself achieving the goal in vivid detail).

**Aesthetic rule:** Gallery White — pure white, black text, luxury boutique. No clutter. No noise.

---

## Part 5: User Journey (Current Build)

1. **Landing Page** → VSL (video sales letter) → CTA: "Sign Up Now"
2. **Sign Up** → Supabase auth (email/password)
3. **Main Dashboard** (`index.html`) → User enters Mission Statement, Life Goal, individual goals, affirmations, beliefs, traits
4. **Aha! Moment** → AI generates personalized content, vision board populates, players become available
5. **Core Loop** → Daily return: launch a visualization or meditation player, review AI roadmap, update goals
6. **Premium Experience** → `arsenal.html` for the Gallery White, Rolex-level presentation

---

## Part 6: Division of Labor (AI Agents)

| Agent | Use For |
|-------|---------|
| **Claude** (in Claude Code / FleetView) | All code writing, file editing, debugging, Supabase/Netlify logic, memory across sessions |
| **Gemini** | Google Sheets formulas, Apps Script, YouTube API, NewsAPI, Google Workspace integrations, real-time web search, marketing strategy |

---

## Part 7: Growth Vision

- **Market:** $50–65B personal development, ripe for AI integration
- **Edge:** Unifies fragmented self-help, closes the 96% goal failure gap
- **Launch:** VSL first (5–15 min, story-driven, urgency CTA) — bootstrap, test conversions
- **Then:** Influencer partnerships, nonprofits, B2B corporate dev programs
- **Goal:** 10M users, $35M revenue, $300M valuation in 3–5 years

**The core truth hasn't changed:**
> C.I. is built on the fact that we are all creative beings. It erodes doubt via proof, turning thoughts into empires.

---

## Part 8: Starting a Fresh Claude Session

When a chat gets long and starts degrading, open a new one:

1. **First message:** "I'm continuing work on Cosmic Intentions. Here is the context:" then paste Part 1 (stack table) and Part 2 (architecture).
2. **Attach:** `index.html` and `arsenal.html` (drag in).
3. **State the rule:** "Supabase client is always `sb`, never `supabase`."
4. **State current task:** One sentence — what you're building right now.
5. **Claude will verify** it understands before writing any code.

---

*This document reflects the build as of 2026-06-02. Update "Current Build State" in PROJECT_BIBLE.md after each milestone.*
