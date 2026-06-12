# PROJECT BRIEF — Cosmic Intentions
Upload this file at the start of every Gemini chat.

---

## What It Is
A personal goals and visualization web app. Users set intentions, then launch guided sessions — countdowns, meditations, visualizations, gratitude exercises.

## Tech Stack
| Tool | Role |
|------|------|
| Netlify | Static hosting. No server-side code. |
| Supabase | Auth + Postgres database |
| Google Sheets | Data source |
| HTML / CSS / JS | Everything. No framework. No bundler. |

## Key Files
- `index.html` — main dashboard (large file, 277KB)
- `arsenal.html` — alternate dashboard (gallery-white aesthetic)
- `players/` — individual session pages (countdown, meditation, gratitude, viz, video)
- `shared/player-core.js` — shared utilities used by all players

## Current State
App is built and working. We are in the polish and feature-add phase.
Players launch in a popup window from the dashboard.
Each player gets a daily rotating background image.
Countdown timer buttons (60 / 30 / 15 sec) use circular icon images.

## What's Already Solved — Don't Re-Suggest
- Auth and login flow (Supabase)
- Image compression and daily rotation per player
- Eye icon fade on countdown VO timing
- All three countdown buttons wired to circular PNG icons

## How I Want You to Respond
- Step-by-step. Name the exact app, menu, button, or field.
- No intro sentences. No "Great question!" Just the answer.
- Code: full block only, never partial.
- End each response: one line — what changed, what's next.

---
*One chat = one task. When done, start a new chat.*
