# CLAUDE.md — Cosmic Intentions Project

## Project Overview
Cosmic Intentions is a personal goals and visualization web app.
Stack: Netlify (hosting), Supabase (auth + postgres), Google Sheets (data source), vanilla HTML/CSS/JS.
Repo root: `C:\WORK\ROOT` | Main branch: `main`

## Key Files
- `index.html` — main dashboard (277KB, large — use offset/limit when reading)
- `arsenal.html` — gallery-white aesthetic alternate dashboard
- `players/` — all player pages (countdown, visual-countdown, meditation, gratitude, viz-quick, viz-10min, video)
- `shared/player-core.js` — shared utilities: getDailyImage, speakText, playBell, returnToApp
- `images/icons/` — all UI icons (PNG)
- `CLAUDE_MASTER_BRIEF.md` — paste this at top of every new Claude CoWork session

## DEFINITION OF DONE — VERIFY OR DON'T CLAIM IT (NON-NEGOTIABLE)
The live site (cosmicintentions.com) does NOT reliably reflect changes — it caches,
and deploys can silently fail (see "Deploy reality"). NEVER judge a change by the
live site. NEVER tell Scott something "works", "is live", or "is done" without proof.

For ANY change to the app, before reporting:
1. **LOCAL = SOURCE OF TRUTH.** Make sure the local server is up
   (double-click `vibe-preview.bat` → http://127.0.0.1:8080) and load the affected
   page THERE. It runs the actual current code; the live site does not.
2. **PROVE IT RENDERS.** Standalone page (e.g. player/*.html) → headless screenshot
   with msedge `--headless --screenshot` and actually look at it. Auth-gated page
   (index.html) → can't screenshot without login; say plainly "could not visually
   verify — needs login" instead of implying it works.
3. **AFTER PUSHING, CONFIRM IT DEPLOYED.** Run `bash scripts/deploy-status.sh`.
   The newest Netlify deploy state MUST be `ready`. If it's `error`/`skipped`
   (e.g. "credit usage exceeded"), the change is NOT live — say so and STOP.
   Do NOT keep pushing into a failing pipeline.
4. **One change → verify → report.** No batches of hopeful commits.
5. **State the evidence** in the report ("verified on localhost", "deploy <hash>: ready").
   If you couldn't verify something, say exactly what you couldn't verify.

If you can't prove it, the honest answer is "not verified yet" — never "done".

## Deploy reality (learned the hard way 2026-06-18)
- Netlify auto-deploys `main`, BUT the team (CI26) hit its usage cap and EVERY deploy
  silently errored "Skipped due to account credit usage exceeded". Pushing did nothing
  visible for hours. ALWAYS check deploy state (step 3) — never assume a push went live.
- Repo is bloated (~528M: ~504M tracked images + a 23M MP4) which burns Netlify quota.
  Keep deploys lean; never commit MP4s/large media (they're gitignored — keep it that way).
- Netlify CLI is linked to site `bf7cacf8-3b22-42be-b187-baf4ab0ebe9c`. Direct CLI deploys
  are also blocked while the account cap is active (returns `Forbidden`).

## Output Format (ALWAYS follow this)
- Step-by-step with exact app name, menu, button, or field name
- No filler text. No "Great question!" Just the answer.
- Code: show full block, never partial snippets unless explicitly asked
- When referencing a file, include path:line_number
- Short summary at end: what changed, what's next — one sentence max

## Karpathy Rules (apply to every task)

**Think Before Coding**
State assumptions explicitly before writing any code.
If a request is ambiguous, present two interpretations and ask which.
Never make silent guesses.

**Simplicity First**
Write the minimum code that solves the problem.
No speculative features. No "while I'm here" cleanup.
If 200 lines could be 50 lines, say so — but don't rewrite unless asked.

**Surgical Changes**
Touch only what the task requires.
Do not improve adjacent code unless explicitly requested.
No reformatting, no renaming, no refactoring bystanders.

**Goal-Driven Execution**
When given a goal ("make this button use the new icon"), solve the goal.
Don't ask for step-by-step permission. State the plan in one line, then do it.

## Solved — Do Not Re-Suggest
- Player images compressed (181MB → 14MB)
- Daily rotating images per player using PLAYER_OFFSETS
- Eye open/closed icon fade on visual-countdown VO timing
- Countdown timer buttons (60/30/15) now use circular PNG icons
- `launchVisualCountdown()` passes goal text + duration via localStorage

## Active Stack Notes
- Supabase: auth + postgres. Check existing schema before suggesting new tables.
- Netlify: static hosting. No server-side code. All logic is client-side JS.
- Google Sheets: used as data source, accessed via API or Apps Script.
- No build step. No bundler. Pure HTML/CSS/JS files served directly.
