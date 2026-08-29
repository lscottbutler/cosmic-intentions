# CI MASTER BUILD LIBRARY

> The living source-of-truth for Cosmic Intentions. **Part 1** is the Build Bible (features, every button, all flows). **Part 2** is the dated Session Log (appended when Scott says "SESSION DONE FOR THE DAY").
>
> First authored 2026-08-20 via a full parallel deep-dive of the codebase.

---

# PART 1 — THE BUILD BIBLE

## 1. Overview & Stack
- **What it is:** a personal goals + visualization/manifestation web app. Members set "I AM" goals, generate AI roadmaps, run visualization/meditation/gratitude sessions, track daily pillars, log wins, and keep a library of thoughts.
- **Stack:** Netlify (static hosting + serverless functions) · Supabase (auth + Postgres + Storage) · vanilla HTML/CSS/JS bundled by Vite · Google Sheets (some player configs). **No framework.**
- **Key files:** `index.html` (all page markup, ~280KB) · `app.js` (core: auth, sync, pegboard, admin, storage, dashboard) · `src/main.js` (module loader + `HANDLERS` wiring + `init()` boot) · `shared/*.js` (per-feature render logic) · `netlify/functions/*` (AI + API) · `players/*.html` (session players) · `src/styles/main.css`.
- **Handler wiring:** every inline `onclick` fn is exposed on `window` via the `HANDLERS` array in `src/main.js` (a tripwire logs any unwired handler). New onclick fns MUST be added there.

## 2. Navigation & Page Architecture

### Page inventory (`<div class="page" id="page-XXX">` in index.html)
| Page id | Title | Purpose |
|---|---|---|
| `page-home` | Home | Public landing (logged-out) + member welcome hub (`#homeLoggedIn`) |
| `page-dashboard` | The Inner Citadel | Main member hub — 2 columns (A = main, B = sidebar) |
| `page-notes` | My Thoughts — Words to Live By | Affirmations/Beliefs/Reminders/Inspirations/Quotes + My Citadel Welcome |
| `page-mynotes` | My Notes | The "note" category only; notes link to goals |
| `page-setup` | My Goals (Pegboard) | Identity/mission/values + goals; context that powers all AI |
| `page-habits` | My Habits | Daily habits by time-of-day (Morning/Day/Evening/Bedtime/Health) |
| `page-vizlibrary` | Visualization Library | Goal list → pick one to visualize |
| `page-vizgoal` | Visualize | Single goal hub — image, dissolve/reroll, session launchers |
| `page-myroadmap` | My Roadmap | AI 10-step action plan + drill-down + progress |
| `page-dailyfocus` | My Favorites Autoplay | ♥-pinned sessions + daily guru |
| `page-runthroughs` | Daily Habits | Visualization/Recitations/Meditation session hub |
| `page-wins` | My Wins | Win wall, stats, filters |
| `page-entcard` | Entrepreneur Library | 31 fixed identity cards (frozen, shared) |
| `page-admin` | Admin (owner only) | Content-block + AI-prompt editors |

### Header + hamburger menu (index.html ~46-87)
- Logo "COSMIC INTENTIONS" → `showPage('home')`. Member badge + user email shown when logged in.
- Hamburger (`#hamBtn`) toggles `#hamMenu`. Items → The Inner Citadel (`goMemberDashboard()`), My Favorites Autoplay (`navTo('dailyfocus')`), My Thoughts (`navTo('notes')`), My Notes (`navTo('mynotes')`), Roadmap (`openMyRoadmap()`), Visualization Library (`openVizLibrary()`), Daily Habits (`navTo('runthroughs')`), Entrepreneur Library (`navTo('entcard')`), My Wins (`navTo('wins')`), landing/about (new tab), **Admin** (owner only), Favorite This Page (`favThisPage()`), Step Away (`signOut()`).
- Theme picker: Dark / Light / Kids → `setTheme(...)` (persists `ci_theme`, `?theme=` also applies pre-paint).

### Navigation mechanism (app.js)
- **`navTo(id)`** — main switch; pushes browser history; **auth-gates** protected pages (`auth_required` = dashboard, dailyfocus, notes, setup, habits, wins, vizlibrary, vizgoal, myroadmap, runthroughs, entcard) → opens auth modal if logged out; then `showPage(id)`.
- **`showPage(id)`** — hides all `.page`, activates target, fires the page's render fn (dashboard→`renderDashboard`+`applyUserCitadelWelcome`; notes→`renderNotesPage`; setup→`renderPBIntentionList`; habits→`renderPBHabitList`; wins→`renderWinsPage`; entcard→`renderEntLibrary`; mynotes→`renderMyNotesPage`; admin→`loadAIPrompts`), runs `sprinkleNotes()`, and for dailyfocus/notes/myroadmap/wins calls `ensurePageSideColumn()` (wraps content into `.pg-body-main` + a `.pg-side` clown+stats column). Scrolls to top.
- **`goMemberDashboard()`** — validates Supabase session, syncs profile+intentions, renders, `navTo('dashboard')`.
- Browser Back/Forward synced via `popstate` + internal `_navHistory`; `subnavBack/Forward` delegate to history.
- **Dev/verify tools:** `?preview=1&page=<id>` seeds a logged-in dashboard with NO auth (local verification of member pages — ids: dashboard, notes, mynotes, dailyfocus, myroadmap, wins, vizlibrary, entcard, setup, habits). `?diag=1` prints a green overlay of real rendered widths/positions. `?theme=dark|light|kids`.
- **Column B IS the navigation (2026-08-28 overhaul):** the old top `#tabBar` is **removed** (`display:none`). Nav now lives in every page's Column B as three **single-source injected** components (edit once → every page updates), added by `injectColbLinks()` on each page show, right after the `.colb-nav` circle cluster: **`colbTabsHTML()`** = the 11 colored page tabs (alphabetical, active tab ringed white; data in `window.COLB_TABS`), **`colbLinksHTML()`** = the grouped link list (Mind Work / Goals / Cosmic Library / More), **`colbThoughtsHTML()`** = a peppered "My Thoughts" block (filled by `sprinkleNotes`). Column B background is a flat dark grey `#343A40` with a `#8b9099` border around each tab/link box; link boxes are white with black text. The `#hamMenu` still mirrors every destination as a fallback.

## 3. The Citadel Dashboard (`#page-dashboard`)
Two columns: `.vault-main` (Column A) + `.vault-sidebar` (Column B), matched to the My Thoughts `.pg-body` grid (`minmax(0,3fr) minmax(0,1fr)`, 16px gap).

### Column A (vault-main) — top to bottom
- **Welcome greeting** `#dashGreeting` + **My Citadel Welcome** card (`[data-block="dashboard-note-2"]`) — admin default, overridable per-user; carries the **purple pencil (edit) badge** → jumps to the welcome editor on My Thoughts.
- **`dashboard-inspiration`** content block — renders as a framed photo **B-card** (green pencil badge → admin editor).
- **Task List** `#taskListWidget` (filled by `renderWrapup`) — **organized by goal**: each goal is its own collapsible bar (letter badge + title + task count; single-open accordion via `wrapupTaskGoalToggle`). Task cards have a ⋯ menu (move up/down, lock, favorite, delete). Default open.
- **`#citadelNav`** goal-nav grid (2-col): **Log A Win** (toggles Quick Win panel → `renderQuickWin`, tabs: Habits/Actions/Roadmap, tick to log), **Quick Thought** (`notesToggleQuickAdd('dashQuickAdd')`), **Play My Favorites** (`navTo('dailyfocus')`), **My Daily Habits** (`navTo('runthroughs')`), **Creative Visualization Library** (`openVizLibrary`), **My Roadmap** (`openMyRoadmap`), **Meditation Session** (toggles timer grid → `openPlayerInColumn('players/meditation.html?t=…')` + ♥ `favSession`), **Practice Gratitude** (episode grid → `playGratEp` / `favGratEp`), **Mind Loop** (`renderSleepLoop`), **My Goals** (toggles `#goalsBox`).
- **Goal list** `#vaultList` — cards per intention (letter badge, title, ♥ favorite); tap → `selectVaultIntention(idx)` opens the workspace (goal image with 5-image dissolve `fetchGoalDissolve` / reroll `rerollGoalVisualization`, quick-viz countdowns `launchCountdown`, roadmap tree). Category filter pill (`filterVaultCategory`), **+ Add Intention** (`vaultShowAddForm` → `confirmAddIntention`).
- A daily surfaced **quote** thought card.

### Column B (vault-sidebar) — top to bottom
- **+ ADD A THOUGHT** (red) → `notesToggleQuickAdd('sideQuickAdd')` (quick-add box, 6 category inputs).
- **Date banner** `#vaultDateLine` ("Friday August 21 — Day 233 of 365 — 132 remaining").
- **THE BIG 3** `#ringsWidget` (`renderRings`): 3-line header (◈ THE BIG 3 / pts today / day streak) · TODAY'S STORY toggle (`renderWrapup` evening recap) · **5 anchor blocks** all in the same format (icon + LABEL + `+5` + Daily/Weekly/Monthly/Yearly bars): **Completed Tasks, Visualize, Habits** (pillars) + **Gratitude, Meditate** (bonus). Perfect-Day flag · Momentum bar (score/100) · Rank/tier (Initiate→Aspirant→…) · THIS WEEK 7-day strip.
- **Wins Wall** `#winsWidget` (`renderWins`) — collapsible; input + ADD (`winAdd`), win rows (delete `winDelete`), "See All Wins →" (`navTo('wins')`).
- **MY MISSION** `.pb-loop-card` — mission text + rotating background.

## 4. Member Pages (features + key buttons)
- **My Thoughts** (`page-notes`, `shared/notes.js`) — intro · ← BACK · **My Citadel Welcome** editor + CHANGE (`saveCitadelWelcome`) · **+ ADD A THOUGHT** (`notesToggleQuickAdd`) · category sections **Affirmations/Beliefs/Reminders/Inspirations/Quotes** (collapsible, section-header letter-spacing 2px): add, inline-edit textareas (auto-grow), delete (✕), favorite ♥ (aff/belief), drag-reorder, affirmations as 50-50 photo cards. NOTES_CAP = 50. Surfaced thoughts appear site-wide as **framed photo cards** (blurred image mat + dominant-color outer border + 2nd-color 6px inner border + purple pencil edit badge) via `sprinkleNotes` (2 of each category peppered across home/daily-focus/citadel/viz-goal/my-roadmap).
- **My Notes** (`page-mynotes`) — the "note" category only; each note has a goal `<select>` (`notesSaveGoal`) so it shows on that goal's Visualize page.
- **Visualization Library** (`page-vizlibrary`, `renderVizLibrary`) — goal cards → `openVizGoal(idx)`; side stats (`vizSideStatsHTML`).
- **Visualize** (`page-vizgoal`, `openVizGoal`) — goal image (dissolve/reroll), timed visualization launchers (1–60 min → `launchVisualization`), **SHARPEN WITH SKILLS** (`pbSharpenSkills` → skill chips → Entrepreneur Library), linked notes, back nav.
- **My Roadmap** (`page-myroadmap`, `openMyRoadmap`) — "how it works" details · **ACTION PLAN** `#todayWillWidget` (`renderWrapup`) · progress chips (steps/done/left) · surfaced reminder + inspiration.
- **Daily Focus / My Favorites Autoplay** (`page-dailyfocus`, `renderFavorites` + `renderDailyGuru`) — pinned-session grid (play `openPlayerInColumn`, ♥ `favSession`), Teacher-of-the-day guru (rotates daily), 3-circle nav.
- **My Wins** (`page-wins`, `shared/winspage.js` `renderWinsPage`) — stat cards (total/week/streak/best), add form + goal link (`winPageAdd`), filter chips (`winPageSetFilter`), wins bucketed Today/Week/Month/Year/Earlier.
- **My Habits** (`page-habits`, `shared/habits.js` `renderPBHabitList`) — habits by category; edit name, ▲/▼ reorder (`pbMoveHabit`), category + domain selects, delete, **+ ADD A HABIT** (`pbAddHabit`).
- **My Goals / Pegboard** (`page-setup`, `shared/card-builder.js` `renderPBIntentionList`) — name, Life & Purpose (mission/life-goal/words/quote), **Intentions** (goal cards + Add-a-goal with dates+category → `pbConfirmAddIntention`), embedded My Thoughts, Save (`saveSetup`). This context feeds all AI (`buildContext`).
- **Entrepreneur Library** (`page-entcard`, `shared/ent-library.js` `renderEntLibrary`) — monitor card (title over art), ‹ PREV / NEXT › (`entNav`), sections **Roadmap / Affirmations / Beliefs / Stoic Principles / Winning Attitudes** (last two authored + frozen in `ENT_MINDSET`), per-item ♥ favorites, per-card notes (add/edit/drag/delete), GO DEEPER media, Visualize / Take-Action. 31 cards, content authored ONCE + frozen + shared across all members.

## 5. Players (`players/*.html`)
Launched into a Column-B iframe via `openPlayerInColumn(src, ev)`; each detects the parent frame and `closePlayerColumn()`.
| Player | Experience | Launched by |
|---|---|---|
| `countdown.html` | Timer w/ play/pause/scrub, bell on done | `launchCountdown(idx, secs)` (`?t=`) |
| `visualization.html` / `3min-viz.html` | Image gallery + centered "I AM" text; 3-min = split white card + blurred art, border = image dominant color | `launchVisualization` / `launchViz(3)` (`?g=`) |
| `viz-player.html` | Full-stage timeline driven by Google-Sheet config (text/image/vo/sfx/music cues) | `launchVisualization` (`?g=`) |
| `art-frame.html` | 1:1 frame cycling owned art; **auto dominant-color border** (`dominant()` canvas bucket) | `launchCreativeViz` / direct (`?s=`) |
| `ass-template.html` | Audio slideshow of affirmation/belief/stoic/attitude slides | `launchAffirmations` / `launchMindset` (`?type=`,`?g=`) reads `ci_ass_slides` |
| `recite.html` | Barrel-frame recitation of a list | `launchRecite(type)` reads `ci_recite` |
| `meditation.html` | Framed image + text, timed | meditation grid on dashboard |
| `gratitude.html` / `gratitude-guided.html` | Gratitude slideshow + optional silence reflection timer | `playGratEp` / gratitude grid |
| `creative-viz.html` | Procedural mandala + woven goal content | `launchCreativeViz` reads `ci_creative_scene` |

## 6. Netlify Functions (AI & API)
Called via `ciApi(name, body)` / `ciApiJson` (`shared/api.js`), which attach the Supabase auth token. `_guard.js` gates paid endpoints (origin allow-list → auth → daily/monthly quota; fails **open** on infra error). **All AI runs on OpenAI (`OPEN_AI_KEY`) — there is NO Anthropic key** (the `claude` endpoint is OpenAI despite the name).
| Function | Does | Model/API |
|---|---|---|
| `claude.js` | Structured JSON from system+user prompt (`callClaude`) | OpenAI gpt-4o-mini |
| `roadmap-ai.js` | Goal → 10 deep tasks (admin-tunable prompts) | OpenAI gpt-4o-mini |
| `roadmap-drilldown.js` | One action → 4–6 sub-steps (quota 100/mo) | OpenAI gpt-4o-mini |
| `roadmap-videos.js` | Real learning resources (YouTube/articles/podcasts) | OpenAI + YouTube API |
| `map-ai.js` | Weekly commitments + danger zones (2 parallel calls) | OpenAI gpt-4o-mini |
| `iam-generator.js` | Public: goal → 3 "I AM" statements (no auth) | OpenAI gpt-4o-mini |
| `image-generate.js` | Vision image from intention | OpenAI prompt + DALL·E 3 |
| `image-search.js` | Stock vision image | OpenAI keyword + Pexels |
| `image-multi.js` | Multi-image dissolve set | OpenAI keyword + Unsplash |
| `tts.js` / `tts-elevenlabs.js` | Voice-over (base64 mp3; ElevenLabs→OpenAI fallback; global cache in Supabase Storage) | ElevenLabs / OpenAI TTS |
| `bbfw.js` | 6-block "Breakthrough Friction" strategy | OpenAI gpt-4o-mini |
| `wrapup-ai.js` | Evening recap (3-pass personalization) | OpenAI gpt-4o-mini |
| `viz-config.js` / `viz-player-config.js` | Player configs from Google Sheets (no AI) | CSV |
| `waitlist-signup.js` | Email → Supabase `waitlist` (no auth) | direct DB |

## 7. Data & Backend
- **Auth:** Supabase email/password (`doSignIn/doSignUp/doResetPassword`); token in **IndexedDB** (`ci-auth`) w/ localStorage fallback (fixed the "logged out every refresh" bug). `updateUI` toggles `#homeLoggedIn` vs `#homeLoggedOut`; admin nav shown only for `lscottbutler@gmail.com`. `init()` (`src/main.js`) reclaims storage, checks preview mode, wires the auth listener, restores session, renders.
- **Supabase tables:** `profiles` (per-user: `pb_*` pegboard fields, `wins`, `habits`, `habits_done`, `rings_log`, `is_member`, `openai_voice`), `intentions` (goals: title/words/`mindset`/category/imageUrl/`achievers`), `content_blocks` (slug→body admin copy + AI prompt overrides), `waitlist`, storage buckets `vision-images` + `goal-audio`. **RLS** scopes rows to `user_id`. Sync fns: `syncFromSupabase`, `syncIntentionsFrom/ToSupabase`, `syncProfileToSupabase`, plus fire-and-forget wins/habits/rings syncs.
- **localStorage keys:** essentials never evicted — `ci_intentions`, `ci_pegboard`, `ci_favorites` (LOCAL-ONLY), `ci_wins`, `ci_habit_list`, `ci_spirituality`, `openai_voice`. Per-day: `ci_rings_<date>`, `ci_habits_<date>` (both sync to profiles). Per-user: `ci_citadel_welcome` (LOCAL-ONLY welcome override), `ci_goal_letters`, `ci_notes` (thoughts), `ci_ent_notes`, `ci_theme`. Transient player hand-offs (`ci_ass_slides`, `ci_goal_image/title`) reclaimed by `_reclaimStorage()`. **NOTE for future admin/coach dashboard:** thoughts (`ci_notes`), favorites, streak are currently LOCAL-ONLY — must sync to Supabase to be visible server-side.
- **Admin page:** content-block editors (`admin-editor-<slug>` → `saveContentBlock` upserts `content_blocks`, re-injects live), AI roadmap prompt editors (`savePrompt/resetPrompt/testRoadmapPrompt`), photo upload. Content-block system: `_blockCache` + `injectContentBlocks` + `_blockContentFor`; `CARD_BLOCKS` (`home-welcome`, `home-section-1/2`, `dashboard-inspiration`) render as framed **B-cards**; `dashboard-note-2` = the user-overridable Citadel Welcome (pencil **C**-badge).
- **Security posture:** repo **PRIVATE**; secrets only in GitHub/Netlify env (audited clean — no keys committed, only the public anon key which is safe with RLS); Supabase RLS; `*.psd`/`.env` gitignored. Backups: `.github/workflows/supabase-backup.yml` pg_dumps the DB (+ vision-images) every 6h to an isolated `db-backups` branch. **Planned:** hourly + **encrypted** copies to Google Drive + OneDrive + email; 6am daily brief email.

## 8. Roadmap / Vision (discussed, not built)
- **Admin analytics dashboard** (user inputs + engagement) → with RLS scoping becomes a **coach dashboard** (coach sees only their clients). B2B2C go-to-market (sell to coaches, not individuals).
- **Coach↔client shared dialogue** (async, context-aware, AI-drafted nudges).
- All coaching features must be **toggleable OFF** (solo app for FRED).
- Mobile: `display:contents` + `order` to choreograph individual elements per-element on phones (not just stack Column B under A).

---

# PART 2 — SESSION LOG
_(Newest first. On "SESSION DONE FOR THE DAY," append a dated, plain-English bullet summary of the day's work + where each key area stands.)_

## 2026-08-28
**Focus:** turned Column B into the whole navigation, regrouped the Entrepreneur cards by "force," started pulling the palette back toward "less cartoony," saved the brand color library, and designed (not built) The Path.
- **Column B is now the single navigation surface (big change).** Removed the **top tab bar** entirely (`#tabBar { display:none }`). Everything that was up there now lives in Column B, built from **single-source injected components** so one edit updates every page:
  - `colbTabsHTML()` — the **11 colored page tabs**, alphabetical, sitting right under the nav circles (Cosmic Library, Daily Habits, ♥ Favorites, Gratitude, Inner Citadel, Meditation, My Notes, My Thoughts, My Wins, Roadmap, Viz Library). Driven by `window.COLB_TABS` (`[pageId, onclick, label, bg, textColor]`). The tab for the page you're on is flagged active with a white ring.
  - `colbLinksHTML()` — the grouped **link list** (sections: Mind Work / Goals / Cosmic Library / More).
  - `colbThoughtsHTML()` — a **peppered "My Thoughts"** block injected into any Column B that doesn't already have its own (e.g. the dashboard), filled by `sprinkleNotes()`.
  - `injectColbLinks()` runs on every page show and injects all three after the `.colb-nav` circle cluster. The **ham menu** also gained the two tabs it was missing (Meditation, Gratitude) so it now holds every destination.
- **Column B look (iterated live with Scott):** first the whole column background was tinted the **current page's tab color** (active tab ringed white to stand out) → Scott found it too much (the yellow Inner Citadel page) → reverted to a flat **dark grey `#343A40`** on all pages, with a **`#8b9099` border around every tab and link box** so they read as distinct tiles. Link boxes went **black → white with black text** (headers stay red) — first step of Scott's "reduce the colors, less cartoony" direction. (Open: confirm Scott's exact "dark grey" hex; the teal Play link + purple Landing links were left as functional accents.)
- **Goal circles colored:** every goal **letter circle** now uses the `GOAL_COLORS` spectrum via `_goalCircleStyle()` (vault cards, viz goal lists, quick-win badges, `card-builder`, `wrapup`). The goal-card **favorite heart** is now a **black circle + white outline heart that fills red when favorited**.
- **Cosmic Library — Entrepreneur cards regrouped by force:** the flat 31-card grid is now **grouped under the 4 forces** (LEG WORK / SMART THINKING / DRIVE / GRIT & DETERMINATION), each card followed by a one-sentence **"why this is crucial"** (first sentence of the card's `directive`). Also added **"THE SUCCESSFUL ENTREPRENEUR"** overview as a **collapsible dropdown** above the grid. (`shared/ent-library.js` renderCosmicLibrary + `_ENT_FORCES` + `_firstSentence`.)
- **Meditation page:** replaced the "Start" button with the **times grid** (1–45 min + ♥); added a **stats box** (This Week / Month / Year / Daily Streak) **wired to real data** — completions log to `ci_med_log` via `markPillar('meditate')`, stats computed in `renderMeditationStats()`.
- **My Wins stat boxes** → grey **`#6e6e6e`** with white text (the home-nav grey).
- **Ent Library card:** removed the **green olive frame** around the monitor card.
- **Brand color library saved:** `marketing/00-brand-foundation/color-palettes.md` — 5 palettes (CI GENERAL LOOK spectrum `#F94144`, CI GRAYS `#DEE2E6`, two olive/sage sets, and **Bold Primaries → designated the KIDS theme primary**). Most non-labeled hexes are `≈` estimates pending Scott's exact export. See [[feedback_color_palettes]]. (Folder is gitignored → syncs to Drive, not committed.)
- **The Path (DESIGNED, not built):** a guided "what's next" layer — finish an activity, tap a Path control and it walks you to the next step of the day. Scott chose **personalized from the start**, controlled from **Column B** (a "Your Path" panel + editor pre-filled with a smart default, drag/checkbox to customize; progress "Step 3 of 7," resets daily). Awaiting his blessed default order before building.
- **Where we stand:** Column B is the finished nav spine (dark grey, bordered tiles, colored tabs, white link boxes, peppered thoughts). Palette is mid-shift toward greys/white for chrome (bold colors reserved for kids). **Everything this session is committed LOCALLY only — a stack of unpushed commits awaiting "push it live."** Next candidates: build The Path v1; confirm the exact dark-grey + palette hexes; decide whether the teal/purple accent links also go neutral.

## 2026-08-24
**Focus:** truly locked the Netlify credit gate, shipped the B&W backlog in one deploy, built shareable roadmaps, and tightened the top layout.
- **Credit gate — now actually enforced:** found that the "ask for approval" hook is **ignored under `bypassPermissions`** (tested live — a command with "git push" still ran). Rebuilt the gate to **hard-block `git push` via exit-code-2** (`.claude/hooks/git-push-gate.sh`), with a one-time `.claude/ALLOW_PUSH` marker as the escape hatch for intentional deploys. Confirmed it blocks. See [[feedback_always_push]].
- **First controlled deploy:** pushed the black-&-white backlog live in **ONE build** (5 commits — grayscale goal cards + all page frames unified to the slate + gate/session-log commits). Deploy reached `ready`. (1 build vs the ~18/day that was burning credits.)
- **Shareable Roadmaps (NEW — built):** a member flips **Share** on a goal's roadmap → gets a **read-only link** (`/?r=<encoded>`). The roadmap is encoded INTO the link — **nothing stored server-side, zero PII, zero cost, no moderation surface**. A public viewer renders for anyone (no login) with a "Try Cosmic Intentions" CTA; Share button lives on the My Roadmap page. Tradeoff: no un-share (link lives forever) + longish links; upgrade path = the Supabase version in `docs/SPEC_shareable_roadmaps.md`. (`app.js` shareRoadmap / renderSharedRoadmap)
- **Junk-content fix:** content blocks whose real text is a wall of one repeated character (e.g. "ppppp") now **auto-hide** instead of rendering garbage. (`app.js` _isJunkBlock)
- **Top layout tightened:** tab-bar background set to the slate frame color (was transparent → flashed white on the light theme); **killed the white gap** between the header and the tabs (black `#topNav` background); **slimmed the slate frame border** on all `.pg-frame` pages (padding 20px→6px) so the white content area is much bigger.
- **Where we stand:** deploy discipline is now genuinely enforced (commit-only + hard gate). B&W restyle is LIVE; tabs are still the colored spectrum (open decision). **NOT pushed since the one deploy:** shareable roadmaps, the ppp fix, tab-bar slate, and the layout tightening are committed **locally**, awaiting the next "push it live". My Wins + Cosmic Library use a separate frame class not yet slimmed to match.

## 2026-08-23
**Focus:** Cosmic Library, the black-&-white restyle pass, and a hard fix for Netlify credit burn.
- **Cosmic Library (NEW):** renamed the Entrepreneur Library into a **hub** — a new page (`#page-cosmiclibrary`, copied from the My Wins frame) that indexes multiple libraries/courses. Holds a **3-column grid of all 31 Entrepreneur card images** (each opens its card via `entGoToCard`) and a researched **"50 Things People Want Most"** card set (placeholder art reuses the ENT images for now). The ENT LIB tab + both nav menus now open the hub. (`shared/ent-library.js` renderCosmicLibrary + FIFTY_THINGS)
- **Meditation & Gratitude (NEW in-app pages):** the two tabs used to jump straight into full-screen players; now they're real app pages (`#page-meditation`, `#page-gratitude`) with a "Start" launch button + the right-hand Thoughts column.
- **Right 25% "Column B":** added the surfaced-thoughts column to Cosmic Library, My Notes, Meditation, Gratitude (Daily Habits already had it). Fixed two bugs Scott caught: it looked empty on accounts with no matching thoughts (added an always-visible **+ ADD A THOUGHT** button + hint), and a `@media` breakpoint that **stacked it to the bottom under 900px** (now stays on the right down to 600px). (`.pg-2col` in `main.css`)
- **Thought cards:** now **half-width**, centered in the column, text sized to match surrounding body text (16px), borders halved (outer 4px / inner 3px), bold removed.
- **Nav + frame restyle (black & white in progress):** header bar → **black**; the 11 tabs squished into a **fixed 6-column grid = always two rows (6+5)** and colored with the goal-card spectrum; page frames first matched each tab's color, then **unified so every page uses the same slate frame as My Wins** (`#7888A8`) per Scott going B&W. `updateUI` sets `#tabBar` to `grid`.
- **Goal cards → black & white:** replaced the colored goal-card palette (`CARD_COLORS` + `GREY_SHADES` in `app.js`) with a **grayscale ramp**. This greys everything keyed to a goal (cards, badges, code chips, workspace titles, wrap-up rails, quick-win rows).
- **My Goals dropdown:** now starts **collapsed**.
- **NETLIFY CREDITS — deploy discipline (important):** auto-pushing every change was burning build credits (**18 builds in one day**; repo is ~1.3 GB images + 1.3 GB git history so each build is heavy). Switched to **COMMIT-ONLY** and installed a **PreToolUse hook** (`.claude/hooks/git-push-gate.sh`, wired in `.claude/settings.json`) that forces an approval **prompt on any `git push`** — Claude can no longer auto-deploy. Push only on Scott's "push it live" (+ approve the prompt). Hook needs a one-time `/hooks` reload (or restart) to activate. See memory [[feedback_always_push]].
- **Where we stand:** UI is **mid-transition to black & white** — page frames unified to slate, goal cards grayscale, header black; **tabs are still the colored spectrum** (pending Scott's call on greying them too). Deploy is now enforced commit-only. **NOT PUSHED:** all of today's visual work after the coach-model entry is committed **locally only**, awaiting "push it live" (one build instead of ~18).

## 2026-08-22
**Focus:** top-navigation overhaul, cross-page floating hamburger, Daily Habits 2-column, Citadel cleanup, and the coach / B2B model docs.
- **Header:** top bar set to Dodger blue (#005A9C) site-wide; hamburger horizontally centered.
- **Tab bar (NEW):** a persistent tab banner under the hamburger with 11 tabs (Inner Citadel, My Thoughts, My Notes, Roadmap, Favorites Autoplay [heart], Viz Library, Daily Habits, Meditation, Gratitude, My Wins, Ent Lib). Restyled as full-width black boxes that fill BOTH rows (balanced 7+4 wrap via flex-grow + 150px min-width). Shown for members in `updateUI`. (`index.html` #tabBar; `main.css` .top-tab)
- **Floating hamburger (NEW):** a duplicate menu fixed at the left-center of every member page; opens the full 16-item menu cloned from `#hamMenu` at boot; hidden on the community/home page via `body:has(#page-home.active)`. `toggleHamMenu(btn)` generalized so multiple hamburgers work independently. (`index.html` #midHam; `app.js` updateUI)
- **Daily Habits:** added the right 25% column (generic `.pg-2col` layout) mirroring the Citadel; filled with the user's own thoughts (peppered slots, auto-filled by `sprinkleNotes`, no ID conflicts). (`index.html` #page-runthroughs; `main.css` .pg-2col)
- **Citadel:** moved the Task List to the TOP of Column B (was Column A); removed the `dashboard-inspiration` placeholder card that was showing "====" junk content.
- **Coach / B2B model:** documented the B2B2C coach play. `GLOSSARY.md` gained a "Coach / B2B model" section (B2B2C, seat, revenue share, white-label, design partner, consent gate). New private `marketing/07-pricing-offers/coach-model.md` one-pager (tiers, LTV/CAC math, go-to-market, consent-gate as priority #1).
- **Where we stand:** navigation is now consistent and always-accessible across every member page. Next: decide coach-tier pricing; build the consent gate + seat management. Pending activations unchanged (SQL for `profiles.notes`/`favorites`; Gmail app password for the DBB email; backup secrets for encrypted off-site copies).

## 2026-08-20
**Focus:** thought/content cards, badges, Big 3, task list, dashboard layout, security & backups planning, and authoring this Library.
- **Layout:** rebuilt the Citadel to match the My Thoughts 2-column `.pg-body` (no scroll line); moved the Task List into Column A above the goal nav (open by default) and reorganized it **by goal** (collapsible bars). Added a duplicate **+ ADD A THOUGHT** button to Column B.
- **Thought cards:** surfaced thoughts now render as framed **photo cards** — blurred image mat, border = darker variant of the image's dominant color, 6px inner border = the 2nd-most-prominent color; text centered/bold in the site body font. Peppered 2 of each category (aff/belief/reminder/inspiration/quote) across the site. Compressed the 79 card images 19MB→5MB.
- **Content blocks:** admin blocks now render in the same card template with a **green "B"** badge → opens the block's admin editor; forced full-width + dark text so CMS junk (fixed widths, black highlights) can't break them.
- **Edit badges:** both badges now show a **white pencil on a black circle** (purple was thought / green was block; icon = editable).
- **Big 3:** header split to 3 lines; pillars stacked vertically; **Gratitude + Meditate now render exactly like the pillars** (icon + label + horizon bars).
- **Ent Library:** added authored, frozen **Stoic Principles + Winning Attitudes** per card.
- **Misc:** removed the MINDSET box + a divider + a stray content block from Column A; removed "Copy code" from task menus; section-header letter-spacing widened.
- **Security/backups:** locked in **security + user privacy as the #1 priority** (repo stays PRIVATE). Ran a **clean secrets audit** (no keys committed; only the public anon key). Confirmed DB backups run every 6h to the `db-backups` branch; planned **hourly + encrypted** Drive/OneDrive copies + email.
- **Planning:** discussed admin→coach dashboard (B2B2C), coach↔client shared dialogue, mobile element choreography, and cost model at 500 subscribers (infra ~$30–50/mo fixed; OpenAI the only variable — caps matter; ~2–8% of revenue).
- **Where we stand:** core member app is feature-complete and polished; coaching layer + admin analytics + mobile choreography are the next big builds; backups working (upgrade to hourly+encrypted pending Gmail app password).
