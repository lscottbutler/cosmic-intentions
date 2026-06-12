# DAILY BRIEF — Cosmic Intentions
## Date: May 27, 2026
## Paste this at the top of your next Gemini chat.

---

## Stack Reminder
- Netlify static hosting — no server-side code
- Supabase auth + Postgres
- Single file: `index.html` (all UI, CSS, JS)
- No framework, no bundler
- Always use `sb` not `supabase` (CDN conflict)

---

## What Was Built Today

### 1. Dashboard — Grand Depository Header Removed
- Removed the `vault-sidebar-hd` div ("GRAND DEPOSITORY" label) from the left sidebar
- Moved the intention count badge (`id="vaultIntentionCount"`) to the **"My Pegboard"** drawer nav item
- Styled as a small green circle (`#38A038`, 22px) — shows total goal count (e.g. "8")
- JS still updates it via `setEl('vaultIntentionCount', intentions.length)`

### 2. Dashboard — Date Line Repositioned
- "DAY 147 OF 365 — 218 REMAINING" moved from inside `vaultWelcome` (right column)
- Now sits at the **top of `vault-main`** (right column), flush with the sidebar top
- Styled: black background (`#000`), bright white text (`#FFF`), centered, Roboto Condensed, uppercase
- Uses `margin: -16px -20px 0` to negate vault-main padding and sit flush

### 3. Dashboard — Goal Boxes
- Goal list (`vault-list`) now uses `overflow-y: visible` — all 8 goals show without clipping
- Gap between goal boxes: `20px`
- Goal text size: `14px` (up from 12px, +20%)
- "All" filter button now shows count: **All 8**

### 4. Dashboard — Player Buttons → Accordion
Replaced the flat button grid with a **vertical accordion list**. 7 items total:

| Label | SVG Icon | Behavior on open |
|-------|----------|-----------------|
| VISUALIZATION TIMERS | Alarm clock | Duration grid (1–60 min) → launches timer player |
| MEDITATION | Cross-legged figure | Guided/Unguided toggle → duration grid → opens meditation modal |
| 3-MIN VISUALIZATION | Brain head | Description + Launch button |
| 10-MIN VISUALIZATION | Brain head | Description + Launch button |
| GRATITUDE | Kneeling figure | Description + Launch button |
| PEGBOARD LOOP | Clipboard | Description + Launch button |
| NIGHT PROTOCOL | Rabbit in hat | Description + Launch button (full width) |

**Accordion design:**
- Each row: black circle SVG icon + uppercase Roboto Condensed label (20px, weight 400) + ▶ arrow
- Arrow rotates 90° when open
- Panel expands with `max-height` transition, `background: #1E1E1E`
- One panel open at a time
- SVG icons: white fill, 21px, inside 34px black circle (`.acc-svg-circle`)
- JS functions: `toggleAcc(key)`, `closeAllAcc()`, `accMedType(type)`

### 5. Home Page — 2-Column Layout (Logged-In View)
Restructured `homeLoggedIn` div:
- **Left column** (`.home-col-left`): "What's New" panel + "New in Cosmic Library" panel
- **Right column** (`.home-col-right`, 280px fixed): Welcome back heading + Member Dashboard button + Community Feed button

### 6. Home Page — Meditating Astronaut
- Image: `images/astronaut-meditation.png` (TINY FLOATING ASTRONAUT.PNG)
- Centered at top of logged-in home page
- White circle container (`200px × 200px`, `border-radius: 50%`)
- Blue border: `19px solid #2DA8E0` (14pt, matches logo blue)
- Sits above the 2-column section

### 7. Video — PENDING
- User has a video (`92 SLIDES.mp4`, 122MB) to embed below Community Feed button
- Too large for GitHub (100MB limit)
- Plan: upload to **Cloudflare Stream** (Media section in Cloudflare dashboard)
- Once uploaded → paste iframe/URL here → wire into `home-col-right` below Community Feed button

---

## Current Git State
- Branch: `main`
- All changes pushed to `https://github.com/lscottbutler/cosmic-intentions`
- Netlify auto-deploys on every push
- Last commit: `775e2a8` — video placeholder removed, pending Cloudflare Stream URL

---

## Next Session TODO
1. Get Cloudflare Stream URL for `92 SLIDES.mp4`
2. Wire video into home page right column below Community Feed button
3. Continue UI polish

---

## Rules — Don't Break These
- `DEV_MODE = true` stays as-is
- No popups for player selection — all inline accordion
- Always push to GitHub after every commit
- `sb` not `supabase`
