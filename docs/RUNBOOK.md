# RUNBOOK — Cosmic Intentions (solo operator survival guide)

This is your "what do I do" manual. When something's wrong, start here.
Run commands in **Git Bash** from `C:\WORK\ROOT`.

---

## The 3 commands you actually need

| Command | What it does |
|---|---|
| `bash scripts/health.sh` | One screen: is the site up? did my last push deploy? is Supabase ok? |
| `bash scripts/deploy-status.sh` | Just the deploy check (is the latest deploy `ready`?) |
| `bash scripts/rollback.sh <tag>` | Safely restore the whole site to a known-good backup |

Live site: **https://cosmicintentions.com** · Netlify team: **CI26** · Repo: `lscottbutler/cosmic-intentions`

---

## Normal workflow (every change)

1. Edit files. See the change locally at **http://127.0.0.1:8080** (run `vibe-preview.bat` if it's not up).
2. When it looks right: `git add … && git commit -m "…" && git push origin main`.
3. Wait ~90s, then `bash scripts/health.sh`. Confirm deploy state = **`ready`**.
4. **Never tell yourself it's live until step 3 says `ready`.** (The live site lies — it caches and deploys can fail.)

## Make a backup before any big change
```
git tag -a CI-BACKUP-$(date +%Y-%m-%d) -m "backup before X" && git push origin --tags
```
Backups are git tags named `CI-*`. List them: `git tag -l "CI-*"`.

---

## ⚠️ WHEN IT BREAKS

### "My changes aren't showing on the live site"
1. `bash scripts/deploy-status.sh`.
2. If state = **`error` / "credit usage exceeded"** → **billing**: Netlify → team CI26 → Usage & billing → buy credits / upgrade. Nothing deploys until that's fixed.
3. If state = **`ready`** but you still see old → **browser cache**: hard-refresh **Ctrl+Shift+R**. If it persists, the asset's `?v=` wasn't bumped — change the `?v=` number on that `<script>`/`<link>` in `index.html`.
4. If there's **no recent deploy at all** → Netlify → Deploys → "Trigger deploy → Deploy site".

### "The site is down / blank / broken after a change"
1. `bash scripts/health.sh` — see what's red.
2. **Fastest fix (no command):** Netlify → Deploys → pick the last good deploy → **"Publish deploy"**. Instant rollback, no git.
3. Or roll back in git: `bash scripts/rollback.sh CI-THU-JUNE-18-2026-BACKUP-2` (or any `CI-*` tag). Then `bash scripts/health.sh` in ~90s.

### "A user can't log in / data won't load"
- Check **https://www.supabase-status.com** and your Supabase dashboard (project `wbqzwbubbeorcknevips`).
- If the free tier **paused** from inactivity → open the dashboard to resume (and consider Supabase Pro so it never pauses).

### "I ran out of Netlify credits again"
- Long-term fix is to shrink deploys (see "Keep it lean"). Short-term: buy credits / upgrade plan (Netlify → CI26 → Usage & billing).

---

## Keep it lean (so it doesn't break the budget)
- **Never commit videos or big media.** `MP4/` and large image folders are gitignored — keep them that way (they live on your disk, not in git).
- Compress new images before committing (max ~1600px). Big repo = expensive deploys.

## Where things live
- `index.html` — the whole app (HTML + CSS + JS). Large.
- `shared/*.js` — modular app logic (loaded by index.html; bump its `?v=` when you edit one).
- `player/affirmation.html` — the only player (rebuild in progress).
- `scripts/` — health, deploy-status, rollback.
- `CLAUDE.md` — the rules Claude follows (verify before claiming done).

## Backups on GitHub right now
`git tag -l "CI-*"` — e.g. `CI-THU-JUNE-18-2026-BACKUP-2`, `CI-WED-JUNE-17-2026-END-OF-DAY`.
Any of these can be restored with `scripts/rollback.sh`.
