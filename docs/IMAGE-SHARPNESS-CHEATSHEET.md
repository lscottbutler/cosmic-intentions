# 📺 Image Sharpness Cheatsheet — "Crisp on the TV"

The player UI (text, dome, borders, icons, badge) is **vector** — it's razor-sharp on
ANY screen, no settings needed. The **only** thing that can look soft on a big TV is a
**raster image** (photo/PNG) that's smaller than the space it fills. This sheet tells
you the size each image needs.

---

## The one rule
> **A source image must have AT LEAST as many pixels as the screen area it fills.**
> Target the biggest screen anyone will use = a **4K TV (3840 × 2160)**.
> Extra headroom never hurts — when in doubt, **send the original**.

---

## Target sizes per image slot (for a 4K TV)
The player is 16:9 and fills the screen. Here's how big each slot is at 4K, and the
**minimum source size** to look sharp:

| Image slot | Fills (on a 4K TV) | ✅ Minimum source | 👍 Recommended |
|---|---|---|---|
| **Skull / right column** | 1536 × 2160 | 1536 × 2160 | **2000 × 2700** (or original) |
| **Logo** (intro/outro) | ~1620 × 1770 | 1620 × 1770 | **≥ 1800 px wide** (yours = 2389 ✅) |
| **Full-frame slide** (manifest deck) | 3840 × 2160 | 3840 × 2160 | **export at 3840 × 2160** |
| **Square art** (art frame) | ~1860 × 1860 | 1860 × 1860 | **≥ 2000 × 2000** |
| **Goal / vision image** (right column) | 1536 × 2160 | 1536 × 2160 | **≥ 2000 px tall** |

> Rule of thumb if you don't want to do math: **≥ 2000 px on the long side = safe for 4K.**

---

## How to CHECK a file's resolution (Windows)
1. Right-click the image → **Properties** → **Details** tab.
2. Read **Dimensions** (e.g., `3024 × 4032`).
3. Compare to the table above. Bigger than the "minimum" = good.

(Quick gut check: anything **under ~1500 px** on its long side will look soft on a 4K TV.)

---

## The real test — ON THE TV
1. Open the player **full-screen** on the actual TV (cast it or open in the TV browser).
2. **Pause** on each image (tap to pause).
3. Stand at normal viewing distance and look for **softness, blur, or jagged edges**.
4. Also try **browser zoom to 200%** on a monitor — if an image turns mushy, its source
   is too small; if it stays crisp, you're 4K-ready.

---

## Export tips
- **Format:** photos → **JPG** (smaller); logos / text / transparency → **PNG**.
- **Google Slides full-frame slides:** the default PNG export is only ~1600 px wide
  (NOT 4K). For true 4K slides, set a **custom slide size in pixels** (File → Page setup
  → Custom → e.g. 38.4 × 21.6 cm at high DPI) or export the deck as **PDF** and let me
  rasterize each page at 3840 × 2160.
- **Don't pre-shrink originals.** Send me the biggest version you have — **I optimize
  each one down to its target size + compress it** so the site stays fast *and* the TV
  stays sharp. (e.g. a 6 MB original skull → a sharp ~1.5 MB 4K-ready file.)

---

## What to hand me
Drop the **originals** in `C:\WORK\ROOT\art\` (or tell me the folder), say which slot
each is for, and I'll size + compress them to these targets and wire them in. Then run
the **on-TV test** above to confirm.

| You provide | I deliver |
|---|---|
| Hi-res originals (≥ 2000 px long side) | Right-sized, compressed, 4K-crisp web images |
