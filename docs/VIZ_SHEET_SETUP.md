# Visualization Player — Google Sheet config (no-code tweaking)

Edit the **timing, the spoken words, the voice, and the background image** of the
visualization player from a Google Sheet — no code, no deploy. Change the sheet,
reload the player, done.

```
  GOOGLE SHEET ──(Publish to web: CSV)──▶ /api/viz-config ──▶ players/visualization.html
   edit timing/text                         Netlify reads it     builds blocks + speaks
```

The player speaks each line with cached text-to-speech, so **editing a line changes
what you hear**. Only changed lines are re-generated; everything else is instant.

---

## One-time setup (~2 min)

1. **Create the sheet.** New Google Sheet → **File ▸ Import** →  upload
   `docs/viz-config-template.csv` (or just paste its rows). It starts as an exact
   copy of the current player.
2. **Publish to web.** **File ▸ Share ▸ Publish to web** → choose the tab →
   format **Comma-separated values (.csv)** → **Publish**. Copy the URL
   (looks like `https://docs.google.com/spreadsheets/d/e/…/pub?gid=0&single=true&output=csv`).
3. **Tell Netlify the URL.** Netlify ▸ Site ▸ **Environment variables** → add
   `VIZ_SHEET_CSV` = that URL → **Save**, then redeploy (or push any commit).

That's it. Until `VIZ_SHEET_CSV` is set, the player uses its built-in defaults, so
nothing breaks in the meantime.

---

## The sheet

| column   | meaning                                                            |
|----------|-------------------------------------------------------------------|
| `key`    | block id (any unique word). Rows starting with `@` are settings.   |
| `phase`  | label shown in the DEV caption (e.g. `Core · Enter`)               |
| `at_3`   | seconds into a **3-minute** session when this line fires           |
| `at_10`  | seconds into a **10-minute** session when this line fires          |
| `text`   | the words spoken + shown. `{GOAL}` is replaced with the user's goal |

**Settings rows** (key starts with `@`):
- `@voice` — TTS voice: `shimmer` (soft), `nova`, `alloy`, `echo`, `fable`, `onyx`
- `@image` — a background image URL, or leave blank to use the goal's own image

### Rules of thumb
- Keep each `text` under ~150 characters (the TTS limit) for one clean clip.
- Order rows by time; `at_3` / `at_10` must be **less than** the session length
  (180s for 3-min, 600s for 10-min). The last line should land ~20s before the end.
- Add or remove rows freely — the player builds whatever blocks the sheet lists.
- Put `{GOAL}` in any line you want personalized to the user's goal.

---

## How edits take effect
- The config is cached for 60s, so a refresh ~a minute after editing shows changes.
- Each unique line is TTS-generated once and cached in the browser; edited lines
  regenerate on next play, unchanged lines stay instant/free.

## Files
- Function: `netlify/functions/viz-config.js` (env `VIZ_SHEET_CSV`; defaults baked in)
- Player:   `players/visualization.html` (`initBlocks()` fetches `/api/viz-config`)
- Template: `docs/viz-config-template.csv`
- Layout spec: `docs/VIZ_3MIN_LAYOUT.txt`
