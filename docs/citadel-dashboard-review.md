# Citadel quick-entry dashboard — In Review

Scott approved building the discussed Citadel dashboard for review. Recovery: PR47 checkpoint `6b485962191e22bd5f4a3924277b858b205a4bb8`.

The prominent pale-gold TO DO button opens all existing My Actions, current Roadmap tasks and personal actions in one click. Open tasks are highlighted, completed tasks are optionally shown, and linked goals remain visible. Notes and Journal open directly alongside it; task-level entry shortcuts preselect the existing goal/action connection. Open Goals remains available.

The adapter reads the app's current intentions and existing `ci_wrapup_actions`/`ci_notes` stores. It delegates goal action entry/completion to the established handlers and goal/action entry linking to the existing Goal Workspace saver. General notes and journal entries can remain unlinked. No new database, due-date field, user tracking, AI processing or cloud destination. Local entry-save wording does not claim verified cloud persistence. This adapter is exposed only inside the explicit member-design comparison wrapper on localhost or this site's protected deploy previews. The canonical Master Player and integrity baseline remain unchanged.

Draft text stays in memory per Notes/Journal view during this visit. Blank/error saves keep text visible. All user content is rendered with textContent. Review tests block backend calls and use fictional examples; live authenticated account/cloud behavior requires separate verification. No privacy or production settings changed.

Tests cover desktop/phone one-click list visibility, existing general and goal tasks, completed filtering, reversible completion, adding goal/personal actions, task-linked notes/journal entries, general notes, injection escaping, reopen retention and responsive screenshots. Existing member-flow tests follow the new direct entry interface. The broad Quality job's budget increases from 15 to 25 minutes because the previous run timed out after 103 passing checks; coverage is retained.

This branch inherits earlier PR42–47 review dependencies and is not approved for direct merge or production publication. Final verification and checkpoint are recorded in the PR and Bible.

## Goal-first Roadmap revision — In Review

Scott's next revision: each goal is the top line, with its chevron revealing TO DO, then Notes, then Journal. The attached reference identifies the My Roadmap goal row. Existing My Actions / combined / Roadmap tabs move inside the TO DO section; the separate workspace shortcut is replaced here by inline goal-linked entry sections. Existing task check-offs, task pencils, action creation, task-linked entry options, other goals, artwork and player shell remain intact. Standalone Goal Workspace remains available.

Entry sections reuse the existing `ci_notes` collection and goal/action save handler. They do not create a new data model or sync destination. Drafts remain separated by goal/type/entry in memory and survive task-list rerenders; failed saves retain the draft and error. Notes and Journal membership follows existing linked goal IDs, including relinked task notes. Recovery: PR48 checkpoint `342b616e2894a4b089cfc08f50dcab70e313b113`. Morning native Bible backup preserved before changes.

Desktop/phone review tests cover header-first order, chevron collapse/expand, hidden controls while collapsed, action tab switching, task check-off with an unsaved entry, goal/action linkage, saved-entry reopening, isolation between goals, blocked-save recovery and horizontal fit. Source unit tests and canonical-template integrity passed locally; final rendered checks and screenshots are recorded in PR48/Bible after CI.

## Citadel goal grouping — In Review

Scott's annotated reference identifies the repeated goal label under each Citadel to-do. The dashboard now groups tasks by their existing goal ID and displays the goal once above them in a native chevron summary. Each summary expands/collapses only that goal's tasks; personal tasks have a separate Personal to-dos group. Groups start open for one-click task review and keep their collapsed state through filtering, check-offs and entry-tab rerenders during the visit. Task checkboxes, linked Add note/Journal buttons, saved entries and highlighting remain intact. No task data or associations change. Recovery: af92aece806c0c6d3f68362d61bade391af2d3fa. Tests extend the existing desktop/phone dashboard flow to verify single headers, grouping, independent collapse, completed-filter state and new-task placement.
