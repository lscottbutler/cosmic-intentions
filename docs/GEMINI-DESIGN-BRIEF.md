# Cosmic Intentions — Design Brief (for Gemini)

Paste this into Gemini before a design session. Workflow: **Gemini designs →
Claude Code builds.** So designs must be implementable in the stack below and
consistent with the existing look. End every design with the **Handoff** section
filled in (bottom) so Claude Code can build it cleanly.

---

## 1. What you're designing for
**Cosmic Intentions** — a personal goals & visualization web app. Users set
"I AM…" intentions, then engage them through timed players (meditation,
countdown, visualization, gratitude) and an AI-generated roadmap. Solo founder,
preparing to onboard ~1000 users. Tone: **premium, focused, a little spiritual /
"inner game" — calm intensity, not corporate SaaS.**

## 2. Non-negotiable build constraints (design WITHIN these)
- **Vanilla HTML/CSS/JS. No framework, no build step, no bundler.** Anything you
  design must be doable in plain CSS. No Tailwind classes, no React components.
- **Mobile-first.** Design canvas **390 × 844** (iPhone 12/13/14 class). Full-screen
  surfaces fill the phone via `100dvh`. Players cap at **480px** wide; they go
  edge-to-edge on phones and center on desktop.
- **Dark theme.** Near-black backgrounds; light text. Don't propose a light UI.
- Desktop dashboard is **two side-by-side columns**; on phones they **stack**.

## 3. Visual identity (the working palette — use these, not random colors)
**Type**
- Body / UI: **Roboto Condensed** (weights 300–800).
- Romantic accents (hero lines like *"Your Roadmap Awaits"*): **Dancing Script**.
- Labels / tags / section headers: **monospace, UPPERCASE, wide letter-spacing**
  (`Courier New` / `IBM Plex Mono`). This mono-caps label style is a signature.

**Backgrounds:** `#000`, `#111`, `#1A1A1A`, `#252525` · **Borders:** `#383838`
**Text:** `#fff` (primary) · `#C8C8D0` (body) · `#888` (muted) · `#505058` (faint)

**Accent colors (each feature owns one):**
| Use | Hex |
|---|---|
| Primary / "action" amber | `#F5A623` |
| Blue (info / This Month) | `#60A0FF` |
| Green (success / Terrain) | `#4ADE80` |
| Red (danger / pitfalls) | `#C41E3A` / `#F87171` |
| Purple (mindset) | `#8B5CF6` |
| Pink (daily practice) | `#EC4899` |

**Signature motifs**
- **Section banners:** bold full-width colored bars, uppercase mono title + a
  collapse triangle (▶ rotates). Used to group content in the goal workspace.
- **Organic "blob" backgrounds** for My Notes postings — soft hand-drawn blobs
  in **green `#00A578`, red `#C81E0E`, orange `#DA6E0B`** (they cycle). This is a
  newer, friendlier accent — lean into organic shapes where it fits.
- **Goal cards:** dark, colored border, ALL-CAPS title, number badge top-right.

## 4. Layout structure (so designs slot into the real app)
- **Dashboard — Column A (left rail, context):** My Notes box · TODAY + daily
  commitments · stats · Pegboard widget.
- **Dashboard — Column B (right, the workspace):** the selected goal's card +
  **My Roadmap** (banner sections: This Week / Danger Zones / Mindset / This Month
  / The Terrain / Daily Practice / Backbone) · then the goal-box picker · date bar.
- **Players** (separate full-screen pages): countdown, visual-countdown,
  meditation(+timer/select), gratitude, viz-quick, viz-10min, video, roadmap,
  pegboard-loop. Immersive, dark, single-focus.

## 5. Locked — do NOT redesign these
- Dark theme. Two-column dashboard (stacks on mobile). Mono-caps label style.
- Players standardized at 480px / `100dvh` / safe-area insets.
- Goal cards: ALL-CAPS title, number top-right.
- "The Map" is now called **"My Roadmap"** everywhere.

## 6. Handoff — fill this in for Claude Code
For each screen/component you design, provide:
1. **Plain-language description** + where it lives (which column / page).
2. **Exact tokens:** colors (hex), font + weight, sizes (px), spacing/padding,
   border-radius. Reference the palette above.
3. **States:** default / hover / active / empty / loading.
4. **Responsive:** what changes at 390px (mobile) vs desktop.
5. **Reuse note:** does it reuse an existing pattern (banner, goal card, blob note,
   `.cb-display`, `.vault-item`, `.colb-banner`)? Match it rather than inventing.
6. If you can, give a **static HTML+CSS mock** (vanilla, inline styles ok) —
   Claude Code adapts it into the app. No JS frameworks.

> Also worth handing Gemini: 2–4 **screenshots** of the current dashboard, a
> player, and the notes — a text model designs far better with the real look in
> front of it. And `docs/CLAUDE_MASTER_BRIEF.txt` for deeper product context.
