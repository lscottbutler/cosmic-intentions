# Goal Workspace — review, 2026-09-24

Scott requested one page for a goal's notes, to-dos, and Journal entries.
The workspace lives in the existing Master Player at `?start=goal-workspace`.
Open it from the site menu, the Notes page, or the button inside a Roadmap goal.
The Roadmap button selects that goal; the page also has a goal selector.

The page shows My Actions and Roadmap tasks, linked notes, then Journal entries.
It uses the existing task cards, completion handlers, task notes, and saves.
Creating a to-do writes to the goal's existing `roadmapAI.userTasks`. Changing
completion uses the same Wins and persistence behavior as Roadmap. Nested
actions and the guard against a roadmap generated for another goal are retained.

Journal entries remain category `note` in the existing `ci_notes` collection;
the workspace and Journal edit the same record. Independent goal notes use
category `goal-note`, appear in the master Notes list, and stay out of the
random thoughts pool and thoughts quota. Task notes follow their selected
linked goal, with legacy notes falling back to their originating goal.
Nothing copies tasks or journal entries into a second collection.

Storage continues through the existing signed-in intentions and `profiles.notes`
adapters. No schema, RLS, authentication, hosting configuration, or production
branch change. Notes and goal titles are not placed in URLs. Navigation passes
only a goal index within the existing same-origin player. The template change
adds this destination and navigation handling; frame CSS is unchanged.

Focused checks: `tests/goal-workspace.unit.mjs` covers goal isolation, updates to
existing Journal records, saving failures, task creation, nested task counts,
existing completion handlers, stale-roadmap filtering, and exclusion of private
notes from random thoughts. `tests/task-notes.unit.mjs` remains the persistence
and relinking check for task notes. These tests do not assert authenticated
cross-device cloud synchronization. A signed-in preview check is still needed
for member-specific populated data.

Recovery checkpoint before this page: `3cad77d43932c5025c04590d0978b5658b09110d`,
on `review/admin-page-boxes-2026-09-21`. Production remains unchanged. This file
records the implementation decision and limits; no new full Drive snapshot or
Bible update is claimed for this focused revision.
