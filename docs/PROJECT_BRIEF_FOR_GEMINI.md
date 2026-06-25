# Cosmic Intentions — Catch-Up Brief (for Gemini)

_Snapshot: 2026-06-25. Purpose: bring Gemini fully up to speed on the project, what's been
built, and the strategy decisions made — since Gemini has been out of the loop._

---

## 1. What this is
**Cosmic Intentions (cosmicintentions.com / "CI.com")** — a personal goals + visualization /
manifestation web app. Users set goals, build a roadmap, visualize them daily, and log
micro-wins to build momentum.

- **Stack:** Netlify (static hosting + serverless functions), Supabase (auth + Postgres),
  Google Sheets (data source), vanilla HTML/CSS/JS. **No build step, no bundler.**
- **Repo:** `C:\WORK\ROOT`, branch `main`, auto-deploys to Netlify on push.
- **Detailed player docs:** see `docs/3MV_PLAYER_BRIEF.md` (file locations, config, scripts).

---

## 2. The 3MV player (main thing built recently)
`players/3min-viz.html` — the **3-Minute Creative Visualization** player. One self-contained
HTML file. It's the first of ~5 planned players (3-min viz, 10-min viz, quotes, affirmations,
beliefs/stoic, life goals) that will share this build — dial in 3MV, then mostly copy-paste.

**What it does:** 175-second guided sequence — intro logo → "3 MINUTE CREATIVE VISUALIZATION"
title → goal → recall a memory → intensify → close eyes (countdown) → creative viz (countdown)
→ release → outro. Tap anywhere to play/pause.

**Key features built this session:**
- **50/50 layout** — left column = white text panel; right column = full-frame artwork (you see
  the right half). Exactly half each.
- **Daily-rotating art** — 79 images in `images/50-50/` (4K JPGs, formatted from PSDs via
  `scripts/format-50-50.py`). One per day.
- **Auto-accent** — the frame border + center post + "I AM" text take the **most vibrant color**
  pulled from the current image; the nav circle ring takes the **2nd** color. Live canvas
  extraction on the hosted site; pre-baked palette for the offline build.
- **Pro typography** on the goal text (balanced wrap, auto-shrink to fit).
- **Official CI astronaut logo** (trimmed) on intro/outro.
- **Temp dev tools** (clearly marked `TEMP … remove before launch`): timeline scrubber, mute,
  fullscreen, art ◀▶ cycler, accent swatches. These are live on the site right now for tuning.

---

## 3. Voice-over / ElevenLabs (in progress — needs Scott's action)
- VO comes from a Netlify function `netlify/functions/tts.js`, returns base64 MP3, player caches it.
- **Just rewritten to: ElevenLabs primary → OpenAI fallback.** Tries ElevenLabs if
  `ELEVENLABS_API_KEY` is set (header `xi-api-key`, voice via `ELEVENLABS_VOICE_ID`, default
  "Rachel", model via `ELEVENLABS_MODEL`). Falls back to OpenAI on any error/quota so VO never
  goes silent.
- **Pending:** Scott needs to (1) get a fresh ElevenLabs API key, (2) add `ELEVENLABS_API_KEY`
  to Netlify env, (3) push. The function is committed and safe to deploy now (uses OpenAI until
  the key exists). The player's VO cache was bumped to `ci_vizmod_vo2` so the switch is clean.
- **Offline standalone** uses the browser's speech engine (no API).

---

## 4. Standalone build
`scripts/build-standalone.py` → `standalone-3mv/` : a self-contained folder (player + art +
logo) that runs offline / `file://` or on any static host, no Netlify needed. Accent palettes
are pre-baked; VO falls back to browser speech. Folder is gitignored (~70MB, regenerable).

---

## 5. Pricing decision
At **1,000 subscribers**, monthly costs ≈ **$320–770** (Netlify ~$19, Supabase ~$25,
ElevenLabs ~$150–600, OpenAI ~$15, Claude dev plan $100 fixed). → **~$4–9 cost per user/year.**
Software margins (~90–95%).

**Decision:** lead with **$99/year**, anchored by **$14.99/month**, plus a **7-day free trial**
(no permanent free tier). Matches premium mindfulness apps (Calm/Headspace ~$70/yr) but justified
higher by AI-personalization + premium voice. Profit at 1k users ≈ **$90–95k/yr**.
**Only usage-scaling cost = ElevenLabs** — cap it with a Flash voice model + generate-VO-only-on-play.

---

## 6. Go-to-market / marketing strategy
**Core thesis: give away the *what*, sell the *system*.** Information is free/infinite; the
product is the execution + emotional layer (organize, roadmap, visualize, track micro-wins,
momentum). Pitch line: _"You don't have an information problem, you have a follow-through problem."_

**Content engine:** Scott will publish "the 100 things people want most" + "30 entrepreneur
skills" as free videos on **TikTok / YouTube / X / Reels**, plus a **VSL** on YouTube. Each video
delivers real value standalone — the magic is recording/tracking those goals at CI.com.

**Channels, ranked for this niche:** Pinterest (affirmation/vision pins — huge long-tail),
TikTok/Reels (viral "manifest with me"), YouTube (VSL + free guided visualizations that rank
SEO), Facebook manifestation groups (promo-tolerant), Reddit (value-first, ban-averse).
**Compounding plays:** free no-login visualization (hook), daily affirmation email, "share my
win" social card (referral flywheel), micro-influencer affiliates (rev share).

---

## 7. Product / content flywheel (the plan)
```
Free content (100 things + 30 skills) → trust/audience
   → "I want to actually DO this" → CI.com (organize · roadmap · visualize · track micro-wins)
   → momentum + real results → user wins become new content → repeat
```
**Moat = execution + emotional, NOT more info.** Guard against the product feeling like "a folder
of the same videos." Micro-wins → momentum ("momo") is the retention/dopamine loop and the core
differentiator vs a static vision board.

---

## 8. Next build priorities (highest leverage first)
1. **One-click goal templates** — content video deep-links to CI.com with the goal pre-loaded
   (`?g=` / template id into "My Pegboard"). Turns every video into a frictionless on-ramp.
2. **Micro-win logging + streak/momentum tracker** — the retention loop.
3. **"Share my win" card** — app art + user's micro-win → auto social content (flywheel).
4. **No-login free visualization page** — top-of-funnel taste test.

---

## 9. Where Gemini can help
- Marketing copy / VSL script / content calendar for the 100-things series
- Pricing-page and paywall copy
- The "100 things people want most" + "30 entrepreneur skills" lists as structured goal templates
- SEO strategy for the YouTube guided-visualization videos
- Reviewing the GTM funnel logic

---

## 10. Working conventions (how we operate)
- **Definition of done:** verify on localhost (`http://127.0.0.1:8080`) before claiming anything
  works; never trust the live site blindly (it caches and deploys can silently fail on credit caps).
- **Deploy mode:** currently **commit locally, don't push** (to conserve Netlify credits while
  iterating). Push only on Scott's explicit "push it live." After any push, confirm the Netlify
  deploy reaches `ready`.
- **Git:** commits straight to `main`, no PRs/branches.
- **Two helper scripts:** `format-50-50.py` (art → 4K JPG), `build-standalone.py` (offline app).
