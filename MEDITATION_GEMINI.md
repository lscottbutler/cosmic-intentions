# MEDITATION PLAYER — Gemini Build Brief
Output modified code only. Do not return the full file. Do not rebuild unchanged sections.

---

## TASK
Rebuild `players/meditation.html` as a single player that handles 4 durations:
**5 min, 15 min, 30 min, 60 min**

Duration is passed via localStorage key `meditation_duration` (value in seconds: 300, 900, 1800, 3600).
If no localStorage value, default to 300 (5 min).

---

## LAYOUT DNA — copy from visual-countdown player

Same card structure:
- `.player-container` — white border, square corners, dark background, centered on black body
- `.image-wrap` — daily rotating background image, crossbar bar at bottom
- `.countdown-circle` (IC) — white fill, grey border, shows MM:SS countdown number
- `.iam-statement` — shows session label e.g. "5 Minute Meditation"
- `.btn-row` — 3 buttons: Pause | Home | Restart

Reuse these exact CSS classes and structure from visual-countdown.html.

---

## BELL LOGIC
- **1 bell** at the halfway point (e.g. 2:30 remaining for 5 min)
- **2 bells** when 5 minutes remaining (skip for 5 min session — use 1 bell at 2:30 instead)
- **Bell on complete**

For 5 min session: 1 bell at 2:30, 1 bell at complete
For 15 min session: 1 bell at 7:30, 2 bells at 5:00, 1 bell at complete
For 30 min session: 1 bell at 15:00, 2 bells at 5:00, 1 bell at complete
For 60 min session: 1 bell at 30:00, 2 bells at 5:00, 1 bell at complete

---

## COUNTDOWN DISPLAY
- Show MM:SS format (e.g. "14:59", "5:00", "0:30")
- Displayed inside the IC countdown circle
- IC turns gold + pulses when under 60 seconds remaining

---

## BUTTONS (same as visual-countdown)
- **Pause** — pauses/resumes the interval
- **Home** — calls `returnToApp()`
- **Restart** — reloads the page

---

## SHARED UTILITIES (already exist in player-core.js — do not redefine)
- `getDailyImage(offset)` — returns daily rotating image URL
- `playBell()` — plays one bell
- `returnToApp()` — closes player, returns to dashboard
- `PLAYER_OFFSETS['meditation']` — image offset for this player

---

## EXISTING FILE FOR REFERENCE
Current `players/meditation.html` has working countdown logic and formatTime() helper — reuse those.
The layout needs to be replaced with the IC card structure from visual-countdown.html.

---

## LAUNCH (already exists in index.html — do not change)
```js
function launchMeditation(duration = 300) {
  localStorage.setItem('meditation_duration', duration);
  launchPlayer('meditation');
}
```
