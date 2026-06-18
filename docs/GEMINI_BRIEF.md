# Brief for Gemini — Cosmic Intentions pro-build review

You are advising on a web app modernization. Please pressure-test the plan below and flag anything risky or over-engineered. Be concrete and skeptical; this is a live production site run by a **solo, non-deep-technical founder**.

## The app
- **Cosmic Intentions** (cosmicintentions.com) — a personal "life design" web app: set intentions, a dashboard, a "Pegboard," an AI-assisted roadmap/strategy generator, and an affirmation player.
- **Stack:** vanilla HTML/CSS/JS front end · **Netlify** (static hosting + serverless functions) · **Supabase** (auth + Postgres) · several Netlify Functions calling AI APIs · GitHub.
- **Scale:** small — 3 main user-facing surfaces (Home/Auth, Dashboard, My Pegboard + a "The Map" view), plus Admin and one affirmation player. ~5,900 lines of JS, ~175 inline `onclick` handlers across ~72 distinct functions.

## Where it started (v1)
A single `index.html` of ~9,900 lines with HTML, CSS, and JS all inline. No build step. Manual `?v=` cache-busting. Accumulated dead code (removed pages, dead "players"), orphaned CSS, and ~79 MB of tracked images that periodically blew the Netlify build-credit cap.

## What's already been done (all verified, live)
1. **Stripped to a lean core** — removed 6 unused pages, dead player system (kept only the Affirmation player), orphaned modules/functions.
2. **Purged orphaned CSS** (~57% of it) via PurgeCSS coverage analysis.
3. **Image optimization** — removed orphans, compressed in-use images with sharp: tracked images **79 MB → 14 MB**.
4. **Vite build pipeline (live in production):** extracted inline CSS → `src/styles/main.css` (minified + content-hashed), extracted the inline app script → `app.js`; `index.html` is now ~1,020 lines of pure HTML. Netlify now runs `npm run build`, publishes `dist/`, Node pinned to 22. Files: `index.html` / `src/styles/main.css` / `app.js` / `shared/*.js` (10 feature modules).
   - NOTE: `app.js` + `shared/*.js` are still **classic global scripts** (not ES modules yet). They share one global scope; that's why ~72 handler functions and shared symbols (`esc`, `intentions`, `ciApi`, `logActivity`, `LS`, `toast`, `selectedVaultIdx`…) work via implicit globals.

## The proposed next step (what to review)
Convert `app.js` + `shared/*.js` to **ES modules** with explicit imports/exports, and move the ~175 inline `onclick=""` handlers out of HTML into `addEventListener` using **event delegation** (one listener reading `data-action` attributes), since most handlers live in dynamically-rendered (`innerHTML`) templates.

Safety approach:
- A mechanically-extracted inventory of all handler target functions (74 found, 0 orphans) so none are missed.
- A boot-time "tripwire" that verifies every expected handler function is wired and reports any that aren't (turns silent failures loud).
- Done on a branch; live site untouched until verified.
- Final verification: the founder does a ~15-minute logged-in click-through of every screen (small enough to test exhaustively). **Constraint: the auth-gated screens cannot be tested headless by the AI agent — human click-test is the gate.**

Then: **Playwright smoke tests** (login, create intention, key buttons) wired into Netlify deploys; **Sentry** (errors); **PostHog** (analytics + session replay).

## Hard constraints / context
- Solo operator, must be able to maintain it alone after launch.
- "Verify before claiming done" — nothing is called complete until the live Netlify deploy is `ready` and rendered.
- Cost-sensitive (got burned by the Netlify credit cap once).
- Prefers simplicity over tool sprawl. Keeping Netlify + Supabase (no plans to switch).

## Questions for you (Gemini)
1. For an app this size, is the full ES-modules + event-delegation refactor worth it, or is "clean classic global scripts + Vite build" already a defensible pro architecture?
2. Event delegation vs re-binding listeners after each render — best pattern for a `innerHTML`-heavy app with argument-passing handlers?
3. Highest-leverage *non-code* pro investments for a solo founder here (we propose Playwright + Sentry + PostHog) — agree, or different priorities?
4. Any risk we're underweighting, or anything on this plan that's over-engineering for a one-person product?
