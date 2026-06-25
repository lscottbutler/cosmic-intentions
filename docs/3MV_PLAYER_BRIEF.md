# 3-Minute Visualization (3MV) Player — Build Brief

_Last updated: 2026-06-25. Personal notes on how the 3MV player is built, where the files
live, how it works, and how to change/rebuild it._

---

## 1. Where everything lives (on your PC: `C:\WORK\ROOT`)

| What | Path |
|---|---|
| **The player** (the whole thing — HTML+CSS+JS in one file) | `players\3min-viz.html` |
| **Column-B art** (79 daily-rotating images, 4K JPG) | `images\50-50\` |
| **PSD masters** for that art (local only, gitignored, ~955MB) | `images\50-50\*.psd` |
| **Section design mockups** (your s1–s6 targets) | `images\visualization\3min\s1.png … s6.png` |
| **Intro/outro logo** | `images\clip-art\blue-hair-logo.png` |
| **Art formatter** (PSD/PNG → 4K JPG) | `scripts\format-50-50.py` |
| **Standalone builder** (makes the offline app) | `scripts\build-standalone.py` |
| **Standalone app output** (generated, gitignored, ~70MB) | `standalone-3mv\` |
| **Old original art** (no longer used) | `images\visualization\manifest-skull.jpg` |

The player is **pure HTML/CSS/JS, one file, no build step**. You can open it directly or
serve it. Everything (styles, logic) is inline in `3min-viz.html`.

---

## 2. How to view it (without burning Netlify credits)

- **Local preview server** (source of truth): double-click `vibe-preview.bat`, then open
  `http://127.0.0.1:8080/players/3min-viz.html`
- **Important:** the auto-accent (border color from the art) reads image pixels, which
  browsers **block on `file://`**. So on the local server (http) it works; opening the raw
  file does not (unless it's the standalone build, which pre-bakes the colors).

---

## 3. What the player does (the 9 sections / timeline)

175 seconds total. A timer ticks every 100ms; each section fires at its time.

| Sec | Time (s) | What happens |
|---|---|---|
| 1 Intro | 0–9 | Logo on white inside the pink frame; 3-tone chime; logo fades out at 7; center post + nav circle fade in at 9 |
| 2 Title | 10–19 | "3 MINUTE MANIFEST" badge zoom-in; column-B art un-blurs (sharpens) |
| 3 Goal | 20–29 | "I AM" + your goal text; VO speaks the goal |
| 4 Recall | 30–39 | "Recall a memory that fills you with joy or gratitude" + VO |
| 5 Intensify | 40–49 | "Get ready to intensify…" + open-eye icon in nav circle + VO |
| 6 Close eyes | 50–89 | Column A goes dark; "OK close your eyes…"; 20s countdown in nav circle |
| 7 Creative viz | 90–159 | "While maintaining your heightened state, visualize…"; countdown; bell at zero |
| 8 Release | 160–169 | "Release your intention…"; rocket icon + VO |
| 9 Outro | 170–175 | Frame/art fade; outro logo |

Exact timings are in `CONFIG.t` inside the file. **Tap anywhere** to play/pause.

---

## 4. The layout ("50/50") and the art

- **Column A** (left 50%) = white text panel. **Column B** (right 50%) = artwork. Exactly half each.
- The art is a **full-frame 16:9 image laid across the whole stage**; column A's white panel
  covers the left half, so you see the **right half** of the composition.
- **Frame border + center post** are a pink (auto-colored) mat. Border, post, and the "I AM"
  text are all the **same color** (CSS variable `--pink`).
- **`--artzoom`** controls how much of the art shows: `100` = full-bleed right half (no bands);
  lower (default `85`) shows more of the picture with accent-colored mat bands top/bottom.

### Daily-rotating art
- Column B picks one of the 79 images per day (day-of-year). List is `COLB_IMAGES` in the file.
- Add/remove art: drop files in `images\50-50\`, run the formatter (below), then update the
  `COLB_IMAGES` list in the player (or ask Claude to).

### Auto-accent (border/post color from the art)
- On load, the art image is sampled and the **punchiest, most saturated mid-bright color** is
  chosen for the border/post/"I AM". Scoring = saturation² × brightness × √coverage.
- On the live/hosted site it computes this live from the image. In the **standalone** build the
  colors are **pre-computed** and baked in (so it works offline / `file://`).

---

## 5. Config knobs + URL test params

All defaults are in the `CONFIG = {…}` object near the top of the `<script>`. You can override
many live by adding `?param=value` to the URL (great for testing):

| Param | Does | Example |
|---|---|---|
| `?img=1300` | Force a specific art image (by its number) | `?img=2580` |
| `?artzoom=80` | Art zoom (100 = full-bleed, lower = more shown + bands) | `?artzoom=75` |
| `?g=...` | Set the goal text | `?g=I%20am%20calm` |
| `?accent=%23ff0000` | Force the accent color (overrides auto-pick) | |
| `?bw=2` / `?post=2` | Frame border / center-post width (in cqw) | |
| `?nav=14` | Nav circle size | |
| `?fade=0.4` | Fade speed (seconds) | |
| `?speed=3` | Playback speed multiplier (fast-forward for testing) | |

Key CONFIG defaults right now: `borderWidth:1.6`, `centerPost:1.6`, `iconSize:11.664`,
`artZoom:85`, `fadeSpeed:0.8`, `voice:'shimmer'`, `skullColumn:50`.

---

## 6. Voice-over (VO)

- Lines are in `CONFIG.vo`. The goal line is dynamic (your goal text).
- **Online/hosted:** calls `/api/tts` (Netlify function, OpenAI "shimmer" voice), caches MP3s in localStorage.
- **Offline/standalone:** falls back to the **browser's built-in speech** engine (robotic but
  works with any goal, no internet).
- **Mute** button silences everything (chime, bell, VO) instantly.

---

## 7. Temporary dev tools (remove before "real" launch)

These are in the player for tuning and are clearly marked `TEMP … remove before launch`:
- **Scrubber bar** (bottom) — drag to any second in the 175s timeline
- **Play/Pause** button, **Mute**, **Fullscreen** (top-right)
- **◀ / ▶ art cycler** + image number — flip through all 79 images
- **Accent swatches** (top-right) — click to override the auto-color

The **standalone build hides** all the dev-only ones (keeps mute + fullscreen). To strip them
from the main player for production, remove the `TEMP`-marked blocks (or ask Claude).

---

## 8. The scripts

### `scripts\format-50-50.py` — prep artwork
Drop source art (`.psd .png .jpg .tif …`) into `images\50-50\`, then:
```
python scripts/format-50-50.py
```
Each becomes a web-ready `<name>.jpg`: **3840×2160 (4K, 16:9)**, sRGB, quality 85, optimized.
PSD masters are never touched. Export PSDs at 16:9 so nothing gets cropped.

### `scripts\build-standalone.py` — make the offline app
```
python scripts/build-standalone.py        # -> standalone-3mv\
```
Produces `standalone-3mv\` (index.html + art\ + assets\ + README). It rewrites paths to local
folders, **pre-bakes the accent palettes** (so colors work on `file://`), hides dev tools, and
copies the art + logo. Re-run after editing the player.

---

## 9. The standalone app

```
standalone-3mv\
├── index.html   ← double-click to run, or host the folder anywhere
├── art\         ← 79 images
├── assets\      ← logo
└── README.txt
```
- **No Netlify, no server, no API needed.** Open locally or drop on any static host.
- VO uses the browser speech engine offline (any goal). Set a goal with `?g=...`.
- This folder is **gitignored** (regenerable, ~70MB) — rebuild with the script anytime.

---

## 10. Deploy / git workflow

- **Repo:** `C:\WORK\ROOT`, branch `main`, host = Netlify (auto-deploys on push).
- **Current working mode:** committing locally, **not pushing**, to avoid burning Netlify
  credits while iterating. View changes on `http://127.0.0.1:8080`. Say **"push it live"** to
  deploy the batch of local commits.
- PSDs (`*.psd`) and the standalone build are gitignored to keep the repo lean.

---

## 11. The roadmap context

3MV is the first of ~5 players sharing this 50/50 build: **3-min viz, 10-min viz, quotes,
affirmations, beliefs/stoic principles, life goals (from My Pegboard)**. The plan is to dial in
3MV, then it's "mostly cut and paste" to spin up the others.
