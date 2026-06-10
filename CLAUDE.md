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

## VERIFY BEFORE RELEASING — NON-NEGOTIABLE
NEVER tell the user something works until ALL of these are confirmed:
1. Start the preview server (`CI Local`) and load the page via `preview_eval`
2. Render the actual component being changed with test data via `preview_eval`
3. Take a `preview_screenshot` and visually confirm it looks correct
4. If screenshot fails, use `preview_eval` to check computed styles and DOM state
5. Only THEN commit, push, and report to the user

If any step fails — fix it first. Do NOT push broken code. Do NOT tell the user it works until you have visual or eval proof.

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
