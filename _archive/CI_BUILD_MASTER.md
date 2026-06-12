# CI BUILD — MASTER SETUP DOCUMENT
*Cosmic Intentions · Claude Code Configuration · Last updated 2026-06-02*

Share this document with any new Claude project to replicate the full CI Local preview workflow.

---

## WHAT IS "CI LOCAL"?

CI Local is a lightweight static file server that runs the app at `http://localhost:3000` so Claude's built-in Preview tools can load pages, take screenshots, click elements, and verify changes visually — all without needing Netlify Dev or any build step.

**Why not Netlify Dev?**
Netlify Dev (`netlify dev`, port 8888) is needed only when testing Netlify Functions (serverless API endpoints). For all UI/frontend work, `npx serve` is faster, has no dependencies, and integrates cleanly with Claude's Preview MCP.

---

## FILE 1 — `.claude/launch.json`

Place this file at the root of your project inside the `.claude/` folder.

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "CI Local",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["serve", "-l", "3000", "."],
      "port": 3000
    }
  ]
}
```

**What it does:** Registers a named launch config called "CI Local". Claude's `preview_start` tool reads this file and starts the server automatically when verifying changes. Port 3000. Serves the project root as a static site.

**Prerequisite:** `npx` must be available (Node.js installed). No `npm install` needed — `npx serve` downloads `serve` on first run.

---

## FILE 2 — `.claude/settings.local.json`

This file grants Claude pre-approved permissions so it doesn't prompt you on every routine command. Paste this and extend the `allow` array as needed for your project.

```json
{
  "permissions": {
    "allow": [
      "mcp__Claude_Preview__preview_start",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git push *)",
      "Bash(git reset *)",
      "Bash(git rm *)",
      "Bash(git mv *)",
      "Bash(git revert *)",
      "Bash(git checkout *)",
      "Bash(git tag *)",
      "Bash(git config *)",
      "Bash(git remote *)",
      "Bash(npm list *)",
      "Bash(npx serve *)",
      "Bash(node --check *)",
      "Bash(node -e *)",
      "WebSearch",
      "Bash(gh repo *)"
    ]
  }
}
```

> **Note:** `settings.local.json` is gitignored by default — it stays on your machine only. For permissions you want shared with the whole team, use `.claude/settings.json` (committed to the repo) instead.

---

## THE VERIFY BEFORE RELEASING PROTOCOL

Add this block to your `CLAUDE.md`. It tells Claude it is **never** allowed to tell you something works until it has visual proof.

```markdown
## VERIFY BEFORE RELEASING — NON-NEGOTIABLE
NEVER tell the user something works until ALL of these are confirmed:
1. Start the preview server (`CI Local`) and load the page via `preview_eval`
2. Render the actual component being changed with test data via `preview_eval`
3. Take a `preview_screenshot` and visually confirm it looks correct
4. If screenshot fails, use `preview_eval` to check computed styles and DOM state
5. Only THEN commit, push, and report to the user

If any step fails — fix it first. Do NOT push broken code. Do NOT tell the user it works until you have visual or eval proof.
```

---

## HOW CLAUDE USES THE PREVIEW TOOLS

Once `launch.json` is in place, Claude follows this sequence automatically when verifying UI changes:

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `preview_start` | Starts CI Local server on port 3000 |
| 2 | `preview_eval` | Loads the page; injects JS to render specific components |
| 3 | `preview_console_logs` | Checks for JS errors |
| 4 | `preview_snapshot` | Reads DOM structure and text |
| 5 | `preview_screenshot` | Visual confirmation — shared with you as proof |
| 6 | `preview_click` / `preview_fill` | Tests interactions (buttons, forms, inputs) |
| 7 | `preview_inspect` | Reads computed CSS values if layout looks wrong |
| 8 | `preview_resize` | Tests responsive breakpoints or dark mode |

Claude only runs the steps relevant to the change — a CSS tweak doesn't need `preview_fill`.

---

## GIT + PUSH WORKFLOW

Add this to your `CLAUDE.md` memory or tell Claude once — it remembers:

```
After every commit, always push to origin/main immediately.
Do not ask for confirmation. Chain commit + push in one step.
```

Claude will run:
```bash
git add <files> && git commit -m "message" && git push origin main
```

---

## NETLIFY FUNCTIONS (when needed)

For testing serverless functions (`/api/*` endpoints), switch from CI Local to Netlify Dev:

```bash
# start-local.bat (Windows)
netlify dev
# Opens http://localhost:8888
```

Netlify redirects `/api/*` → `/.netlify/functions/*` automatically.

**Environment variables** (set in Netlify dashboard, not in code):
- Set under: Site → Environment variables → Builds / Functions / Runtime scope
- Changes require a redeploy (push to `main`) to take effect

---

## PROJECT STACK QUICK-REFERENCE

| Layer | Tech | Notes |
|-------|------|-------|
| Hosting | Netlify | Static. No server-side code. |
| Auth + DB | Supabase | Variable always named `sb`, never `supabase` (CDN conflict) |
| Data | Google Sheets | Via Sheets API or Apps Script |
| Frontend | Vanilla HTML/CSS/JS | No build step. No bundler. |
| API keys | Netlify Functions only | Never in frontend JS |
| AI | OpenAI (TTS, image keywords) | `OPEN_AI_KEY` env var. No Anthropic key. |

---

## DIVISION OF LABOR (AI AGENTS)

| Agent | Use for |
|-------|---------|
| **Claude** | All code writing, file editing, debugging, Netlify/Supabase logic, memory across sessions |
| **Gemini** | Google Sheets formulas, Apps Script, Google Workspace integrations, real-time web search |

---

## STARTING A FRESH CLAUDE SESSION

When a chat gets long and starts degrading, open a new one:

1. **First message:** "I'm continuing work on [Project Name]. Here is the project context:" then paste relevant sections from this doc.
2. **Attach files:** Drag in the main HTML files you're working on.
3. **State current task:** One sentence — what you're building right now.
4. **Verify Claude knows:** Ask it to confirm the `sb` naming rule (or your equivalent project-specific rules) before it writes any code.

---

## CLAUDE.md TEMPLATE (minimal starter)

```markdown
# CLAUDE.md — [Your Project Name]

## Stack
- Hosting: Netlify (static, no server-side code)
- Auth/DB: Supabase (always use `sb`, never `supabase`)
- Frontend: Vanilla HTML/CSS/JS — no build step

## Key Files
- `index.html` — main entry point
- `.claude/launch.json` — CI Local preview server (port 3000)

## VERIFY BEFORE RELEASING — NON-NEGOTIABLE
1. Start the preview server (CI Local) and load the page via `preview_eval`
2. Render the component being changed with test data
3. Take a `preview_screenshot` and visually confirm
4. Only THEN commit, push, and report

## Output Format
- No filler text. Just the answer.
- Code: full block, never partial snippets
- End with: what changed + what's next (one line max)

## Rules
- API keys stay in Netlify Functions. Never in frontend JS.
- After every commit, push to origin/main immediately.
- Touch only what the task requires. No cleanup of adjacent code.
```

---

*Copy this document into any new Claude Code project and it will behave the same way from day one.*
