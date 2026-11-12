# CLAUDE.md — Cosmic Intentions Project

## PERSONAL E vs ADMIN BOX — NEVER CONFUSE THESE (Scott, 12 Nov 2026 — hard rule)
Two completely different text boxes. Every time you forget this, Scott re-explains it.

- **Personal E (member note)**: `.ci-player-personal-e-box`. Stored in
  `player_personal_notes` table, keyed per-user via RLS. **The MEMBER edits it**
  via the blue pen icon on the player page. Each user sees ONLY THEIR OWN. Scott,
  as admin, does NOT edit this from the admin page — it's not his to change, it's
  the member's private note.

- **Admin box**: `.ci-admin-page-box` + friends. Stored in `content_blocks` table,
  shared across all members. **ONLY Scott (admin) edits these**, and ONLY from the
  admin page. Members see them read-only — **NO PEN ICON on the player page**.
  Slugs: `page-welcome-<pageId>`, `page-ab1-<pageId>`, `page-instructions-<pageId>`,
  `page-note-<pageId>-<n>`.

When Scott asks for "an admin welcome", "admin message", "admin-only text", "not a
personal e", "no pen" — he means ADMIN BOX. Use the content_blocks row, render it
read-only, no pen, no edit affordance for members. He edits it from the admin page.

Never stuff a Personal E into a spot that should be an admin box, and never put a
pen on an admin box on the player page.

**TO DO page specifically:** the box at the top of the TO DO list IS the Personal E
(member's own message). It gets DOM-moved there by member-design-test.js from the
header iframe via adoptNode into `[data-todo-personal-e-slot]`. KEEP the blue pen —
it's the user's own message. The admin WELCOME MESSAGE is a DIFFERENT box that
lives above it in the header, not in the TO DO slot.

## MISSION — THE BACKBONE OF CI (Scott, 2 Nov 2026)
**Cosmic Intentions helps people repeatedly think and act as the person they intend to be.**
Every feature, page, message and design choice must serve this. Test any request or idea against it:
does it help someone think or act, again and again, as the person they intend to be? If a change
works against it, flag that to Scott before building.

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
2. **PROVE IT RENDERS — you CAN see the auth-gated app now (no excuses).** Start the
   Vite dev server (`npm run dev`; run it in the background, and unsandboxed if the
   port bind is refused), then open the REAL logged-in dashboard with NO auth via
   preview mode:
     `http://localhost:5173/?preview=1&page=<id>`
     ids: dashboard · notes · mynotes · dailyfocus · myroadmap · wins · vizlibrary ·
          entcard · setup · habits
   Screenshot with headless msedge `--headless=new --screenshot`, OR — for exact
   sizes/positions — MEASURE with Playwright driving the installed Edge
   (`chromium.launch({channel:'msedge'})`; set localStorage, reload, read
   `getBoundingClientRect()`). "The CSS has the rule" / "the code looks right" is NOT
   proof — look at the pixels or measure them.
3. **AFTER PUSHING, CONFIRM IT DEPLOYED.** Run `bash scripts/deploy-status.sh`.
   The newest Netlify deploy state MUST be `ready`. If it's `error`/`skipped`
   (e.g. "credit usage exceeded"), the change is NOT live — say so and STOP.
4. **One change → verify → report.** No batches of hopeful commits.
5. **State the evidence with real numbers** ("welcome 560, cards 560, aligned; deploy
   <hash>: ready"). If you couldn't verify something, say exactly what you couldn't.

**NO SHIT RESPONSES (Scott's words, 2026-08-20 — hard rule).** NEVER say "done",
"fixed", "matching", or "works" on a hunch or because the code/CSS looks right. That
is banned. Prove it with a screenshot or a measurement, or state plainly what you did
NOT verify. If you can't prove it, the honest answer is "not verified yet" — never "done".

**DON'T ARGUE WITH SCOTT ABOUT WHAT HE SEES.** If he says it's wrong and your check
says right, there IS a gap (browser/CDN cache, live ≠ preview, his zoom/viewport) —
find and close it, don't insist you're right. To see HIS actual live render: tell him
to append `?diag=1` to the URL — a green overlay prints the real rendered width/left/
right of the key elements; he screenshots it and you finally see what HIS browser draws.

## Publishing routine — COST CONTROL (Scott, 2026-10-28 — hard rule)
Every Netlify production deploy costs 15 credits; Deploy Previews and branch deploys cost 0.
~208 production deploys in Oct 2026 exhausted the team's credits and paused publishing.
1. ALL work goes on the long-lived `staging` branch (commit + push there). Do NOT merge to `main` per change.
2. Scott reviews at the fixed free preview: https://staging--gilded-profiterole-47a2eb.netlify.app
   (deep-link the changed page, e.g. /standalone/member-design-test.html?feature=daily-habits).
3. Merge `staging` → `main` (one PR) ONLY when Scott says "publish" (or an end-of-day batch he approves).
   One publish = 15 credits. Never more than one production deploy per publish request.
4. After a publish, reset `staging` to the new `main` and keep going.
6. **DAILY PUBLISH — FIRST ACTION, NO EXCEPTIONS (Scott, 2026-10-30, reinforced 2026-11-10):**
   At the START of each session (including context resets / continuations), run:
   ```
   bash scripts/preflight.sh
   ```
   If staging is ahead of main, immediately run:
   ```
   bash scripts/daily-publish.sh
   ```
   Do this BEFORE any other work. No excuses. No "I'll get to it." FIRST.
   Reason: under ChatGPT, work got stranded on side branches and was lost. On 2026-11-10
   a context reset caused the daily publish to be skipped, stranding a week of fixes.
   No work may live only on a side branch overnight — merge review branches into `staging`
   the same day, and report anything found on a branch that isn't in `main`.
5. Verify on the local build first (free), then on the staging preview in Scott's signed-in Chrome.

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

## Autonomy & Implementation Thresholds
- **Autonomous Execution:** Full permission to hardcode, debug, and execute fixes for minor bugs, styling tweaks, small components, configuration updates, and file creation. Do not ask for confirmation or state what you "plan" to do for routine changes — just execute them.
- **Escalation (Big Things):** Pause, explain your strategy, and request human review ONLY if a task involves:
  - Destructive data migrations or major schema alterations.
  - Introducing massive new architectural patterns or heavy third-party core libraries.
  - High-risk security configurations or destructive `git` operations outside the feature branch.
- **The Rule:** If it's isolated code logic, build it, test it, and hardcode it directly.

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

## Claude Code Behavior & Output Guidelines

### Deep Linking & App Location Requirements
- For every bug, traceback, or code change, you must provide the exact, copyable link or file-path reference.
- Format local files as terminal-friendly OSC 8 clickable paths or clean Markdown links like `[src/components/Auth.tsx:42](src/components/Auth.tsx)`.
- If referring to specific app screens or routing endpoints, provide the exact application deep link format (e.g., `myapp://settings/notifications` or `http://localhost:3000/dashboard?user=123`) so they are copyable and instantly accessible.

### Verification Requirements (Double-Check Policy)
- CRITICAL: You must explicitly double-check your logic and verify syntax before printing any code or file paths.
- Run appropriate local tests, lints, or dry-runs using available bash tools to ensure your troubleshooting path is completely accurate before responding.
- End your troubleshooting insights with a brief "Verification Summary" confirming exactly what was double-checked.

### Dead-Simple External-Tool Instructions
- When steps happen in an external dashboard (Supabase, GitHub, Netlify, VS Code): give ONE path, lead with a direct deep-link, exact numbered clicks, no options, no menu-hunting.
- Supabase deep links use the project ref `wbqzwbubbeorcknevips`, e.g. SQL editor: `https://supabase.com/dashboard/project/wbqzwbubbeorcknevips/sql/new`
