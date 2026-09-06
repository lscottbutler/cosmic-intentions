# Cosmic Intentions — Full Project Brief

> Paste this whole file into ChatGPT / Grok when you want a second opinion. It is
> self-contained: it explains the product, the tech, the file layout, how the app
> is structured, how it deploys, the rules the developer works under, and the open
> problems. Last updated: 2026-09-06.

---

## 1. What the product is

**Cosmic Intentions** (cosmicintentions.com) is a personal goals + visualization
web app. A member writes "I AM" intentions (goals), then works on them daily
through visualization, meditation, gratitude, affirmations, habit tracking, and an
AI-generated action plan / roadmap. The tone is calm and empowering ("the portal
to your mental life"). It is a solo-founder product.

- **Founder:** Scott — American, based in Bangkok, ~25 years. **Non-technical
  "vibe coder"** (directs the build in plain English; does not read code fluently).
- **Top priorities:** security & privacy first (repo stays private, minimal PII,
  encrypted backups), and never shipping something claimed "done" that isn't
  actually verified.
- **Business model (planned):** unlimited goals; the paid cap is on the *costly*
  AI drill-downs. Annual pricing around $79 / $149. Roadmap generation on a
  stronger model, drill-downs/videos on a cheaper model.

---

## 2. Tech stack (important: NO build framework, NO server)

- **Frontend:** vanilla HTML + CSS + JavaScript. **No React/Vue.** No TypeScript.
- **Bundler/dev:** Vite (dev server only, for local preview). There is **no
  compile step for logic** — the app is basically one big `index.html` SPA plus
  plain JS modules in `shared/`.
- **Hosting:** Netlify (static hosting + serverless functions in
  `netlify/functions/`). Auto-deploys the `main` branch on push.
- **Auth + database:** Supabase (Postgres + Auth). Row-Level Security (RLS) is on.
- **Extra data source:** Google Sheets (via API / Apps Script) for some content.
- **AI:** OpenAI (there is **no Anthropic key** in prod — every AI function must
  use the OpenAI key or it silently fails). Some voice via ElevenLabs.
- **Error monitoring:** Sentry (`src/sentry.js`, initialized first).

### Why this matters
It's a single-page app: **all "pages" live inside one `index.html`** as
`<div class="page" id="page-...">` sections that get shown/hidden by JS
(`showPage()` / `navTo()`), not separate URLs. `index.html` is ~260KB+.

---

## 3. File map (the parts that matter)

```
index.html            The entire SPA: every page section, the dashboard, nav,
                      Column A/B layout, inline handlers. HUGE file.
app.js                Main app logic: init(), rendering, goals, roadmap,
                      welcome, most feature functions. (imported by src/main.js)
src/main.js           Entry point. Imports every shared module + app.js, then
                      wires inline onclick handlers onto window via a HANDLERS
                      allowlist, then calls app init(). Has a "handler tripwire".
src/styles/main.css   All styling + the theme system (dark / light / kids).
src/sentry.js         Error monitoring init.

shared/*.js           Feature modules (plain ES modules), e.g.:
  api.js              Supabase calls / data access
  habits.js          Daily habits engine (categories, toggles, storage)
  notes.js           "My Thoughts" (affirmations/beliefs/reminders) + edit badges
  card-builder.js    Goal card image generation/backfill
  rings.js           Gamification "3 pillars" rings
  player-launcher.js Opens players in-column (iframe) or as popup; favorites
  wins.js / winspage.js  "Wins" logging
  wrapup.js / today.js / weekly-focus.js / mission-control.js  daily loop pieces
  ent-library.js + ent-library-content.js  Entrepreneur "I AM" fixed library
  quickwin.js, sleeploop.js, encourage.js, quote-frame.js, the-map.js, etc.

players/*.html        Standalone player pages loaded in an <iframe> inside the
                      dashboard's main column: meditation, gratitude-guided,
                      visualization, creative-viz, countdown, recite, 3min-viz,
                      note-card, manifest, art-frame, roadmap, viz-player, etc.

netlify/functions/*.js  Serverless (OpenAI-backed): roadmap-ai, roadmap-drilldown,
                      roadmap-videos, generate-content, iam-generator, map-ai,
                      image-generate, image-search, tts / tts-elevenlabs,
                      wrapup-ai, bbfw, claude.js (uses OpenAI despite the name),
                      viz-config, waitlist-signup, _guard.js (shared guard).

CLAUDE.md             The dev's operating rules (definition of done, deploy
                      reality, output format). Read this to understand the
                      working style constraints.
docs/CI_MASTER_BUILD_LIBRARY.md   Running build log / bible.
```

---

## 4. The pages (SPA sections)

Page IDs inside `index.html` (shown via JS, one "active" at a time):

`dashboard` (the home, called **Citadel**), `notes` (**My Thoughts**),
`mynotes` (**Journal**), `dailyfocus` (**Favorites Autoplay** / "play my day"),
`myroadmap` (**Action Plan**), `wins` (**Wins**), `vizlibrary` (**Visualize**),
`vizgoal`, `entcard` (**Entrepreneur Library** card page), `setup`, `habits`,
`runthroughs` (**Daily Habits**), `meditation` (**Meditate**),
`gratitude` (**Gratitude**), `cosmiclibrary` (**Cosmic Library**),
`proof` (**Proof** — documented real people who credit visualization),
`landing` (logged-out marketing), `admin` (content-block editor).

---

## 5. The dashboard layout — Column A / Column B (this is the core UX debate)

The **Citadel dashboard** is a two-column layout:

- **Column A (main, left):** the member's **Goals / Intentions** cards
  ("I AM …"), an "Add Intention" form, and per-goal actions.
- **Column B (right rail, `.vault-sidebar`):** the **navigation** — a set of
  colored tabs (`COLB_TABS`) that link to every section:

  Cosmic Library, Daily Habits, ♥ Favorites Autoplay, Gratitude, **Citadel**
  (home), Meditate, Journal, Thoughts, Wins, Action Plan, Visualize, Proof.

  Clicking a Column B tab navigates to that section (its content fills the main
  area; Column B is re-injected on every page so the nav is always present).

### Current model (as of 2026-09-06)
- Column A shows **only** the Goals/Intentions cards. A previously-existing grid
  of duplicate buttons in Column A (Quick Win, Quick Thought, Favorites, Daily
  Habits, Visualize, Action Plan, Meditate, Gratitude, Mind Loop) was **removed**
  because it duplicated Column B. Column B is now the single nav.
- **Mobile (<768px):** Column B is hidden and replaced by a **hamburger menu**
  (`#hamMenu`) in the header, so the phone view is effectively single-column.
  Desktop/tablet (≥768px) keeps the Column B rail.
- The **welcome line** at the top of Column A ("Welcome to your dashboard…") is a
  personalized message. It shows with a small **pencil badge**; the actual
  **editor** for it lives on the **My Thoughts** page (clicking the pencil jumps
  there). Storage key: `ci_citadel_welcome` (blank = fall back to admin default).

### The unresolved design tension (what Scott keeps iterating on)
Scott's mental model is that the app should feel like **"The Path"** — a calm,
guided, mostly **single-column** experience where **Column B is the menu and
whatever you click opens in Column A (the content pane)**. There was an earlier
attempt to go fully single-column ("The Path") that **broke too much and was
reverted**. So the live design is: keep the two-column desktop layout, use Column
B as the only nav, keep Column A clean (just goals), and collapse to single-column
+ hamburger on mobile. The open question he's still refining: exactly how much
should live in Column A vs. open as its own page, and how to make Column B feel
like "click here → it opens right there" without a jarring full-page jump.

---

## 6. Key systems / concepts

- **Inline players in a column:** `openPlayerInColumn(src, ev)` drops a player
  page (`players/*.html`) into an `<iframe>` (`#playerColumnFrame`) inside the
  dashboard main column, anchored under whichever button launched it. Falls back
  to a popup if the panel isn't present.
- **Daily Habits:** `shared/habits.js`. Categories = MORNING / DAY / EVENING /
  BEDTIME / HEALTH (labeled Morning / Afternoon / Evening / Before Sleep / After
  Waking). Toggling a habit logs the day's completion in localStorage
  (`ci_habits_<date>`).
- **My Thoughts (notes):** affirmations / beliefs / reminders / inspirations /
  quotes the member writes; they surface randomly around the site. Each editable
  spot has a purple **pencil "edit badge"** (`ciEditThought(dest)`), which routes
  to the My Thoughts page and scrolls to the exact field.
- **Rings / 3 pillars:** a gamification concept (visualize / meditate / gratitude
  style rings) in `shared/rings.js`.
- **Themes:** CSS-variable palettes selected via `data-theme` — `dark`, `light`
  (the dashboard is the **white/light** theme), and `kids`. New UI must use the
  CSS var tokens (not hardcoded colors) and be checked in all three themes.
- **AI roadmap / action plan:** a goal can generate a ~10-step AI roadmap
  (`roadmap-ai.js`), with drill-downs and optional videos. Roadmaps can be shared
  as read-only, URL-encoded links (zero storage / no PII).
- **Content blocks:** admin-editable copy blocks (`data-block="..."`) edited on
  the `admin` page; hidden until filled.

---

## 7. State & data

- **Supabase:** auth + Postgres, RLS enabled. Check existing schema before adding
  tables. Supabase project ref: `wbqzwbubbeorcknevips`.
- **localStorage** holds a lot of per-user UI state, e.g. `ci_citadel_welcome`,
  `ci_habits_<date>`, `ci_favorites`, habit list, etc.
- **Google Sheets** for some content sourcing.
- **No server code beyond Netlify functions.** All app logic is client-side.

---

## 8. Deploy reality + how changes are verified (critical working rules)

1. **The live site is NOT the source of truth.** It caches, and deploys can
   silently fail. **Local is truth.**
2. **Preview mode (no auth):** run `npm run dev` (Vite, port 5173), then open
   `http://localhost:5173/?preview=1&page=<id>` to see any member page with a
   seeded logged-in state and NO auth. IDs: `dashboard`, `notes`, `mynotes`,
   `dailyfocus`, `myroadmap`, `wins`, `vizlibrary`, `entcard`, `setup`, `habits`.
   Add `&theme=light` etc.
3. **Proof, not vibes.** A change is only "done" when it's been rendered/measured
   — screenshot with headless Edge, or measure exact positions with Playwright
   driving installed Edge (`chromium.launch({channel:'msedge'})` and read
   `getBoundingClientRect()`). "The CSS looks right" is NOT proof.
4. **After pushing, confirm the deploy.** Netlify's newest deploy state must be
   `ready`. If it's `error` / `skipped` (e.g. account credit cap), the change is
   NOT live.
5. **One change → verify → report** with real numbers. Never batch hopeful
   commits.
6. **Push is gated** (to protect Netlify build credits): commits happen locally by
   default; pushing to deploy is a deliberate, separate step.

### Handler allowlist gotcha
Because inline `onclick="fn()"` is still used, every such function must be added
to the `HANDLERS` array in `src/main.js`, or it silently doesn't exist in prod. A
"tripwire" logs any handler that failed to wire.

---

## 9. Constraints / how the developer must work (from CLAUDE.md)

- **Simplicity first, surgical changes.** Minimum code to solve the task; don't
  refactor or "improve" adjacent code; don't rename/reformat bystanders.
- **Don't mass-convert colors to tokens** — colors are intentional. No big-bang
  refactors (the app is auth-gated and hard to screenshot wholesale).
- **Security/privacy is #1**, non-negotiable. Repo stays private. Minimize PII.
- **No PRs / no feature branches** — commits go straight to `main` (vibe-coder
  workflow). Push only when explicitly told to deploy.
- **Spell out acronyms** on first use (Scott is learning the business/tech terms).
- **Dead-simple external steps:** when a step is in Supabase/Netlify/GitHub, give
  ONE path with a direct deep link and exact clicks — no "menu-hunting" options.

---

## 10. Recent work (last ~15 commits, newest first)

```
fd5095c move(welcome): Citadel welcome EDITOR back to My Thoughts page
a7201a8 declutter(citadel): remove duplicate nav-button grid from Column A
87908e9 fix(mobile): lower Column-B hide breakpoint 900->767px
e167a60 rename: home page "My Goals" -> "Citadel"
d086e02 (dashboard menu relabeled Home)
7267938 REVERT of the single-column "The Path" experiment back to the
        multi-column build (Column B restored)
494ead4 path(phase 1): single-column dashboard — retire Column B rail (later reverted)
1c31429 path(phase 0): add Proof to global UFO menu
aafe547 rename: "Inner Citadel" -> "My Goals" across user-facing labels
8f087e8 chore(action-plan): remove reminder/inspiration cards + Share Roadmap
51a8eb2 feat: Proof tab, Journal rename, roadmap number badges use goal color
```

The single-column "The Path" experiment (`494ead4`) was reverted at `7267938`
because it broke too much. The current direction rebuilds "Path feel" *on top of*
the safe two-column base: Column B = nav, Column A = clean goals, single-column +
hamburger on mobile.

---

## 11. Open problems / where a second opinion would help

1. **Column A vs Column B information architecture.** What is the cleanest,
   least-jarring way to make "click a Column B tab → it opens in the Column A
   content pane" feel like one calm surface, on a vanilla HTML/CSS/JS SPA with no
   router, without a full-page flash? Should some sections open *inline in Column
   A* vs. as their own page? Which ones?
2. **Removed features need a home.** Removing the Column A button grid orphaned
   **Quick Win, Mind Loop, and Quick Thought** (they have no Column B tab). Where
   should those live?
3. **Mobile experience.** Below 768px it collapses to single column + hamburger.
   Is that the right breakpoint and the right pattern, or should mobile get a
   bottom tab bar?
4. **Onboarding / first-run.** How to guide a brand-new member from zero goals to
   their first "I AM" + first visualization without overwhelming them.
5. **Performance / maintainability.** `index.html` is enormous (one file, all
   pages, lots of inline styles + inline onclick). What's the safest incremental
   path to tame it *without* a big-bang refactor (the constraint) and without
   breaking the auth-gated flows that are hard to screenshot?
6. **Gamification depth.** The "3 pillars / rings" and a daily loop / wrap-up are
   partly designed but not fully built. What's the minimum lovable version?

---

## 12. TL;DR for an outside AI

> It's a **vanilla HTML/CSS/JS single-page app** (no React, no build step for
> logic) on **Netlify + Supabase**, that helps people work on personal goals via
> visualization/meditation/gratitude/habits and an **AI roadmap**. The home
> ("**Citadel**") is a two-column dashboard: **Column A = the member's goal
> cards, Column B = the navigation rail** that opens each section. On mobile it
> collapses to one column with a hamburger. The founder is **non-technical** and
> wants a **calm, guided, "single-surface" feel** while keeping the safe
> two-column base. Constraints: security/privacy first, surgical changes only, no
> big refactors, prove every change with a real screenshot/measurement, deploy is
> gated. Help wanted mainly on **information architecture (Column A vs B), mobile
> pattern, onboarding, and safely taming a giant index.html**.
