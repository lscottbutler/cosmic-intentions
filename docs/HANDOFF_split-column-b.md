# HANDOFF — Split Column B into its individual parts

Paste this at the top of a new Claude CoWork / Claude Code session, **after** the
Master Brief (`docs/CLAUDE_MASTER_BRIEF.txt`). It is a task-specific brief for one
job: breaking Column B of the dashboard into independent, individually-movable parts.

Last updated: 2026-06-10 · Repo: `C:\WORK\ROOT` · Branch: `main`

---

## THE GOAL (what the user wants)

Column B today has only **two** top-level movable blocks (Cosmic Library, My Roadmap).
Everything else — THIS WEEK, Danger Zones, Mindset Audit, This Month, The Terrain,
the practice feed — is **nested deep inside My Roadmap**, so it can't be moved or
arranged independently.

The user wants to **split Column B into its individual parts** so each part is its own
standalone, reorderable section (the same way Cosmic Library and My Roadmap can already
be moved up/down with ▲▼ arrows).

Decide WITH the user, before coding, how far "individual parts" goes:
- **Option 1 (shallow):** keep the two existing blocks, just confirm the ▲▼ reorder is
  what they want and stop there. (Probably already done — don't re-do.)
- **Option 2 (medium):** promote the **tabs** (The Map / Backbone) and the player groups
  into separate movable sections.
- **Option 3 (deep):** promote each Map sub-section (THIS WEEK, Danger Zones, Mindset,
  This Month, The Terrain, Practice Feed) into its own top-level movable Column B section.

Ask which one. Do not assume. This changes the amount of work by an order of magnitude.

---

## CURRENT COLUMN B ARCHITECTURE (as built)

Container: `#vaultMain` (`index.html:5891`). Children, in render order:

1. `#vaultDateLine` — date bar, static (`index.html` ~5894)
2. `#dailySidebarQuote` — daily quote, JS-injected `afterend` of the date line
3. **Section blocks**, ordered by saved array `ci_colb_order` (localStorage),
   default `['cosmicLibrary','myRoadmap']`:
   - `#actionPanel` = **Cosmic Library** — static HTML (`index.html:5941`). Contains all the
     player accordions (Take Action, Affirmations, etc.). Shown only when a goal is selected.
   - `#vaultBuildSheet` = **My Roadmap** — **JS-rendered** by `buildBuildSheet()`
     (`index.html:9520`); innerHTML is rebuilt every time a goal is selected.
4. `#vaultWelcome` — standalone empty-state, shown when no goal is selected (`index.html:5897`)
5. `#addIntentionForm` — hidden add form
6. `#alchemyModal` — hidden modal

### The two triangle sections (the movable units)
Both use the same pattern: a `.ts-header` bar + a `<key>-body` container + a `<key>-arr`
arrow. Toggling is one shared function:

- `toggleColBSection(key)` — **`shared/player-launcher.js:250`**. Shows/hides
  `document.getElementById(key + '-body')` and rotates `key + '-arr'` (`.ts-arrow.open`).
- Cosmic Library header: `index.html:5941`+ (`onclick="toggleColBSection('cosmicLibrary')"`)
- My Roadmap header: `index.html:9531` (inside the `buildBuildSheet` template string)

### The reorder mechanism (▲▼ up/down, persisted) — THIS IS THE MODEL TO EXTEND
All in `index.html`, just below `closeVaultBuildSheet()`:
- `COLB_SECTIONS = { cosmicLibrary:'actionPanel', myRoadmap:'vaultBuildSheet' }` — `index.html:9453`
  maps a section key → the **top-level block id** it lives in.
- `getColBOrder()` — reads/sanitizes `ci_colb_order` from localStorage.
- `applyColBOrder()` — `index.html:9464`. Re-stacks the section blocks below the
  date/quote header lines in saved order, and disables the first ▲ / last ▼.
- `moveColBSection(key, dir)` — `index.html:9484`. Swaps order, saves, re-applies.
- ▲▼ buttons live in each `.ts-header` (`.ts-move` / `.ts-move-btn`, CSS near `.ts-arrow`).
  They call `event.stopPropagation()` so they don't trigger the collapse toggle.

**To add a new movable section you must:** (a) give it a top-level block in `#vaultMain`,
(b) add `key → blockId` to `COLB_SECTIONS`, (c) add the key to the default order array,
(d) render a `.ts-header` with ▲▼ buttons + a `<key>-body`. Then `applyColBOrder()` handles it.

---

## WHAT'S INSIDE MY ROADMAP (the part the user wants to break apart)

`buildBuildSheet()` (`index.html:9520`) renders:
- My Roadmap `.ts-header` (`index.html:9531`)
- `.bs-tabs` (`index.html:9552`): **The Map** | **Backbone**
- The Map panel ← `buildBSTheMapPanel(intent, idx)` in **`shared/the-map.js:326`**
- Backbone panel ← `buildBBFWPanel(intent, idx)` (`index.html:9587`)

`buildBSTheMapPanel` (`shared/the-map.js:326`) stacks these sub-sections, all currently
**nested inside the My Roadmap block**:

| Sub-section | Render fn (`shared/the-map.js`) | Collapsible? | Default |
|---|---|---|---|
| THIS WEEK | `_renderCheckSection` (:45) | yes (triangle) | open |
| Danger Zones | `_renderDangerZones` (:155) | yes (triangle) | collapsed |
| Mindset Audit | `_renderMindset` (:244) | yes (triangle) | collapsed |
| └ Daily Recitations | sub-block inside `_renderMindset` | yes (triangle) | collapsed |
| This Month | `_renderCheckSection` (:45) | yes (triangle) | collapsed |
| The Terrain | `_renderCheckSection` (:45) | yes (triangle) | collapsed |
| Practice Feed | `_renderPracticeFeed` (:295) | no | — |

All collapsible sub-sections reuse `toggleColBSection` with keys like
`mapsec-<idx>-<sectionKey>`, `mindset-<idx>`, `recsec-<idx>`, `dz-section-<idx>`.

Data comes from `intentions[idx].theMap` (`thisWeek`, `dangerZones`, `mindset`,
`thisMonth`, `terrain`, `practice`). Generated via `bsGenerateTheMap()` → `/api/map-ai`.

---

## KEY CHALLENGES (read before designing)

1. **My Roadmap is rebuilt from scratch on every goal-select.** `showVaultBuildSheet()`
   sets `#vaultBuildSheet.innerHTML = buildBuildSheet(...)`. Any sub-section promoted to a
   top-level Column B block must survive (or be re-applied after) that rebuild —
   `showVaultBuildSheet` already calls `applyColBOrder()` right after the innerHTML set.
2. **Sub-sections are goal-specific** (keyed by `idx`); the two current top-level blocks are
   singletons. If you promote sub-sections to top level, decide: one set per selected goal,
   or one shared set re-pointed at the active goal. Singleton-per-active-goal is simpler.
3. **`<idx>` in element ids** — promoting sub-sections means their ids/keys must stay unique
   and the reorder map (`COLB_SECTIONS`) must handle dynamic, goal-scoped blocks, not just
   the two static ones.
4. **Don't break the recitation animation** — `_initMapRecitations(idx)` runs after the
   build sheet renders and targets `rec-<idx>-wrap/-text/-inner/-dots`. Keep those ids.
5. **`ci_colb_order` migration** — if you add new section keys, `getColBOrder()` already
   appends any missing default keys, so old saved orders won't break. Keep that behavior.

---

## HARD CONSTRAINTS (from CLAUDE.md — non-negotiable)

- **VERIFY BEFORE RELEASING.** Don't claim it works without proof.
- **Screenshots time out on `index.html`** (277KB + many images). `preview_screenshot`
  reliably fails. Use `preview_eval` + `preview_inspect` to assert DOM order, `display`,
  and `.classList` instead. That is an accepted substitute per CLAUDE.md step 4.
- To render Column B in preview without auth: force the page active and seed a goal:
  ```js
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-dashboard').classList.add('active');
  intentions.length = 0;
  intentions.push({ title:'I AM the owner of a Rolex Submariner', theMap:{ /* see below */ }});
  renderVaultSidebar(); selectVaultIntention(0);
  ```
  A full `theMap` shape for seeding (thisWeek/dangerZones/mindset/thisMonth/terrain) is in
  this session's transcript — minimal example:
  ```js
  theMap:{ thisWeek:[{text:'x'}], dangerZones:[{title:'t',pitfall:'p',warning:'w',ifTrigger:'if',thenAction:'then'}],
    mindset:{currentAttitudes:['a'],toInstall:['b'],recitations:['r1','r2'],prayer:'p'},
    thisMonth:[{text:'m'}], terrain:[{text:'t'}] }
  ```
- **Surgical changes only.** No refactoring bystanders. No reformatting.
- **Always commit + push together:** `git commit -m "..." && git push origin main`. No PRs, no branches.
- **Karpathy:** state assumptions first; if ambiguous, present two interpretations and ask.

---

## SUGGESTED FIRST STEP (not a mandate)

1. Confirm with the user which Option (1/2/3 above) they mean by "individual parts."
2. If Option 3: generalize the reorder system so `COLB_SECTIONS` can hold goal-scoped,
   dynamically-created blocks; move each `_render*` sub-section out of the single
   My Roadmap container into its own top-level `#vaultMain` block with a `.ts-header` +
   ▲▼ controls; have `buildBuildSheet`/`showVaultBuildSheet` populate those blocks and then
   call `applyColBOrder()`.
3. Verify via `preview_eval`: correct DOM order, each section independently collapsible,
   ▲▼ reorder persists across reload, no console errors, recitation animation intact.

---

## RELEVANT RECENT COMMITS (this is the lineage you're continuing)

```
4d9086f The Map: default-collapse Danger Zones, Mindset, Recitations, This Month, Terrain
5651af5 The Map: make check-section banners collapsible triangle buttons
36deecc Column B: make triangle sections independently reorderable with up/down arrows
c3a4ad5 Fix Column B going blank on goal-box close: give vaultWelcome standalone content
95a1c62 Column A: move category filters above intention list for cleaner hierarchy
38c5d74 Move TODAY to top of Column A; convert Cosmic Library + My Roadmap into triangle menus
f06294a Move action panel to absolute first position in Column B via DOM insertBefore
5ee941c Split Column B into two sections: COSMIC LIBRARY banner + MY ROADMAP banner
```

---

## FILE MAP (the only files this task touches)

- `index.html` — Column B markup, `buildBuildSheet`, reorder system (`COLB_SECTIONS`,
  `applyColBOrder`, `moveColBSection`), `showVaultBuildSheet`, `.ts-*` CSS. LARGE — use offset/limit.
- `shared/the-map.js` — all The Map sub-section renderers (`buildBSTheMapPanel`,
  `_renderCheckSection`, `_renderDangerZones`, `_renderMindset`, `_renderPracticeFeed`).
- `shared/player-launcher.js` — `toggleColBSection` (the shared collapse toggle).
