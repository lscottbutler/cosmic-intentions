# Member-page revisions — 2026-09-25

Status: In review on `review/goal-workspace-note-save`, PR42. Production remains at `116525cae867405337935df1d39ca232e4e8a0a9`.

## Scott's requested changes

- Goal Workspace inline notes have an explicit Save note button and Saved / Unsaved changes status. Local storage success is confirmed; the existing asynchronous account sync remains unchanged.
- Habits opens the existing daily checklist. Edit habits opens the existing editor; Back to daily checklist returns to checkmarks. Existing habit IDs, daily keys, and persistence adapters are reused. Old runthroughs navigation returns to this canonical destination.
- Each goal card is a native collapsed disclosure on a fresh load. Cards opened during the session retain their state across renderer updates by stable goal ID. AI and removal remain separate controls.
- Goal removal is a white × on a black circle. Habit move up, move down, and delete controls are black circles with white symbols, including their disabled boundary states.
- The two existing owner-authored boxes are the first and last children of each member page's content. Existing block IDs and owner visibility rules are preserved. Both boxes are light purple (`#ac8dcc`) with white text.
- Page references follow the supplied Autoplay example: topic introduction, named teacher, linked source, paraphrased perspective, and practical application tips. Existing Favorites Autoplay reference remains. New references cover the other member pages, including the standalone Meditation and Citadel player views. Multi-perspective pages rotate at UTC midnight on load and offer Another perspective.
- Entrepreneur is restored as a named navigation destination, using its existing skills, resources, notes, roadmap, affirmations, beliefs, and learning material. The page presents information within the canonical Master Player; the old duplicate monitor is removed from the content renderer. Legacy Quickie Move master links resolve to Entrepreneur.
- Both Meditation countdown numbers use half their former font size and regular weight. White text, stacked minutes/seconds, and all rail/frame geometry remain unchanged.

## Source and recovery

Teacher summaries and source URLs live together in `players/page-reference.js`. Sources were checked on 2026-09-25: James Clear (goal setting, habit stacking, tracking), Gabriele Oettingen (WOOP), Sharon Salzberg (Just Sit), Robert Emmons (gratitude), David Allen (GTD), Émile Coué (historical autosuggestion text), Steve Blank (Customer Development). Application tips are CI suggestions, not quotations or author endorsements. No new AI calls or personal-data processing are involved.

Pre-revision checkpoint: `c13752a12c66479dc1c12eefa5a95db72953c4fb` contains the Save note change alone. `4bf8e60df57a2b01860695d821be77cdf2038cf7` adds Habits, collapsed goals, control colors, and admin box styling/placement. Main is unchanged. Restore individual changed files from these checkpoints to roll back a component; do not reset the entire player for unrelated changes.

The template integrity gate remains enabled. Its review baseline changes only for the explicitly requested reference integration, Entrepreneur navigation, and timer typography. The earlier approved player frame remains recoverable on production and the above commits.

## Verification

- Goal/task-note unit checks pass, including separate action identity, linked goals, save failure, and unchanged note classification.
- Browser: a temporary review goal loaded collapsed; opening and toggling AI retained its disclosure state. The goal × rendered white on black.
- Browser: daily Habits and its editor are both reachable; checkmarks can be set and undone. Habit up/down/delete rendered black and white.
- Reference mappings and source links checked for every configured page. JavaScript syntax and template integrity checks pass.
- Remaining before final handoff: rendered teacher sections, Entrepreneur navigation, smaller countdown, populated Goal Workspace Save note, and owner-only admin appearance/placement.
- No Supabase schema, Netlify settings, site privacy, or production changes.
