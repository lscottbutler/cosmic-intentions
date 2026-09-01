# My Roadmap — Page Cheat Sheet

A plain-English map of everything on the **My Roadmap** page and what I (Claude) call it in the code. Use the "Say this to me" column so we're always talking about the same thing.

_Page file: `index.html` (block `id="page-myroadmap"`) · Action Plan built by `shared/wrapup.js` · styles in `src/styles/main.css`_

---

## 1. Page frame & title (top of Column A)

| What you see | Say this to me | Code name |
|---|---|---|
| The whole page | "the Roadmap page" | `#page-myroadmap` |
| Outer colored frame + white screen | "the frame" / "the screen" | `.pg-frame` › `.pg-bezel` › `.pg-screen` |
| The big **MY ROADMAP** title | "the page title" | `.pg-hdr` (now black) |
| The round **ⓘ** button by the title | "the info button" | `.title-info-btn` (popover: `.title-info-pop`) |

## 2. Intro area

| What you see | Say this to me | Code name |
|---|---|---|
| Blue-bordered **Lorem ipsum** box with bullets | "the intro card" | `.page-intro-card` (auto-inserted by `injectPageIntro`) |
| Paragraph "This is the plan for your most important goal…" | "the intro paragraph" | plain `<p>` inside `.pg-screen` |

## 3. Action Plan (the core of the page)

Everything here is built by `shared/wrapup.js` into one container: **`#todayWillWidget`**.

| What you see | Say this to me | Code name |
|---|---|---|
| Whole Action Plan block | "the Action Plan widget" | `#todayWillWidget` |
| Navy **ACTION PLAN** bar with the `0/8` circle | "the Action Plan header" | `<details class="rm-drop">` summary, bg `#1D3557` |
| The `0/8` count circle | "the done/total counter" | count chip (turns green at 100%) |
| The little ▾ caret on the right | "the caret" | `.rm-caret` |
| Each goal row — **A**, **B**, **C** | "goal row A / B / C" | one `<details class="rm-drop">` per goal, toggled by `wrapupGoalToggle` |
| The round letter badge (A/B/C) | "the goal badge" | goal-colored letter circle |
| The ▶ circle on a closed goal row | "the goal caret" | `.rm-caret2` |

### Inside an open goal row

| What you see | Say this to me | Code name |
|---|---|---|
| The 3-button tab strip | "the tabs" | `.wtabs` |
| Black **MY ACTIONS** tab | "the My Actions tab" | `#wtab-my-<n>` (`.wtab`) |
| The middle round chain/link icon | "the connect button" | `#wtab-both-<n>` (links My Actions + Roadmap into one view) |
| Grey **ROADMAP** tab | "the Roadmap tab" | `#wtab-roadmap-<n>` |
| A single action row ("Draft the launch announcement") | "an action card" | code-card (rail + checkbox + code chip + ⋯ menu) |
| The little **A1** tag on a card | "the code chip" | goal-letter + number badge |
| The **⋯** button on a card | "the card menu" | overflow menu (edit / lock / delete etc.) |
| "Add your own action…" field + **+ ADD** | "the add-action box" | input `#wrapGoalInput-<n>` → `wrapGoalAddAction` |
| **✦ REGENERATE ROADMAP FROM MY ACTIONS** button | "the regenerate button" | `#wrapRegenBtn-<n>` → `wrapRegenRoadmap` |

_(`<n>` = the goal's index, e.g. goal A = 0, B = 1, C = 2.)_

## 4. Thought cards (below the Action Plan)

These are your own saved thoughts, surfaced one per day by `sprinkleNotes`.

| What you see | Say this to me | Code name |
|---|---|---|
| Pink card ("Return to your breath Scott.") | "the reminder card" | `data-random-note="reminder"` · key `myroadmap` |
| Gold/framed quote card | "the inspiration card" | `data-random-note="inspiration"` · key `myroadmap-insp` |
| The little ✎ pencil on a card | "the edit pencil" | thought-card edit button |

## 5. Bottom of Column A

| What you see | Say this to me | Code name |
|---|---|---|
| **🔗 SHARE THIS ROADMAP (READ-ONLY LINK)** button | "the share button" | `onclick="shareRoadmap()"` |
| STEPS / DONE / LEFT number chips | "the monitor chips" | `.pg-chips` (`#rmStepCount`, `#rmDoneCount`, `#rmLeftCount`) |

## 6. Column B (the right-hand column)

| What you see | Say this to me | Code name |
|---|---|---|
| The whole right column | "Column B" | `.pg-2col-side` / `.pg-side` |
| The 3 round buttons at top (◀ ☰ ▶) | "the nav circles" | `.colb-nav` › `.colb-nav-btn` (menu = `.colb-nav-menu`) |
| The colored page tabs (COSMIC LIBRARY … VIZ LIBRARY) | "the Column B tabs" | `.colb-tab` |
| The dark link buttons (COSMIC LIBRARY / ENTREPRENEUR COURSE / 50 THINGS…) | "the Column B links" | `.colb-link` |
| **ADMIN** dropdown | "the Admin dropdown" | `.colb-links-hd--drop` (toggled by `colbDrop`) |
| **◆ THE BIG 3** panel (Points / Streak / Pillars / Progress) | "the Big 3 widget" | rendered by `shared/rings.js` / wrap-up |

---

### How to use this with me
Point at anything by its **"Say this to me"** name and tell me what to change — e.g.
- "Make **the Action Plan header** taller"
- "Change **the regenerate button** text"
- "Hide **the inspiration card** on the Roadmap page"
- "Recolor **the goal badge** on goal A"

I'll know exactly which element you mean.
