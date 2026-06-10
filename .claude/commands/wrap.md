# /wrap — Write a session summary into the Master Brief

When invoked, summarize the work done in THIS session and append it to the
master brief, then commit and push. This is the richer, hand-written companion
to the automatic SessionEnd commit-logger.

## Steps

1. **Gather what happened this session.** Use the conversation context plus:
   - `git -C C:\WORK\ROOT log --oneline -15` (recent commits)
   - `git -C C:\WORK\ROOT diff --stat HEAD~N..HEAD` if useful
   Focus on what changed and WHY — not a blow-by-blow.

2. **Write a concise dated entry** (3–8 bullet points max). For each meaningful
   change: what changed, which file(s) (`path:line` where helpful), and the
   reason/outcome. Note anything left unfinished or any follow-up.

3. **Append it to** `docs/CLAUDE_MASTER_BRIEF.txt` under the
   `AUTO SESSION LOG` section (at the end of the file). Format:

   ```
   --------------------------------------------------------------------------------
   [YYYY-MM-DD] /wrap summary
   - <what changed and why> (file.ext:line)
   - <next steps, if any>
   ```

4. **Bump the "Last updated:" date** near the top of the brief to today.

5. **If a change this session is a locked decision or a solved-forever item,**
   also add it to the relevant brief section ("UI / LAYOUT DECISIONS (LOCKED)"
   or "WHAT'S ALREADY SOLVED — DO NOT RE-SUGGEST") and to `CLAUDE.md`'s
   "Solved — Do Not Re-Suggest" list. Use judgment; don't duplicate.

6. **Commit + push together** — but the master brief is a LOCAL file (untracked
   by design: local copy + Google Drive). Do NOT `git add` it. Only commit
   *tracked* files you changed (e.g. CLAUDE.md from step 5) using `git add -u`:
   `git -C C:\WORK\ROOT add -u && git -C C:\WORK\ROOT commit -m "Session wrap: <one-line summary>" && git -C C:\WORK\ROOT push origin main`
   If nothing tracked changed, skip the commit — the brief update is local-only.

## Rules
- Keep it tight. The brief is onboarding context, not a changelog dump.
- Do not invent work that didn't happen — base it on real commits/diffs.
- No filler. Match the brief's existing terse style.
