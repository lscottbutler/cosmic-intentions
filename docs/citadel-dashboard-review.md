# Citadel quick-entry dashboard — In Review

Scott approved building the discussed Citadel dashboard for review. Recovery: PR47 checkpoint `6b485962191e22bd5f4a3924277b858b205a4bb8`.

The prominent pale-gold TO DO button opens all existing My Actions, current Roadmap tasks and personal actions in one click. Open tasks are highlighted, completed tasks are optionally shown, and linked goals remain visible. Notes and Journal open directly alongside it; task-level entry shortcuts preselect the existing goal/action connection. Open Goals remains available.

The adapter reads the app's current intentions and existing `ci_wrapup_actions`/`ci_notes` stores. It delegates goal action entry/completion to the established handlers and goal/action entry linking to the existing Goal Workspace saver. General notes and journal entries can remain unlinked. No new database, due-date field, user tracking, AI processing or cloud destination. Local entry-save wording does not claim verified cloud persistence. This adapter is exposed only inside the explicit member-design comparison wrapper on localhost or this site's protected deploy previews. The canonical Master Player and integrity baseline remain unchanged.

Draft text stays in memory per Notes/Journal view during this visit. Blank/error saves keep text visible. All user content is rendered with textContent. Review tests block backend calls and use fictional examples; live authenticated account/cloud behavior requires separate verification. No privacy or production settings changed.

Tests cover desktop/phone one-click list visibility, existing general and goal tasks, completed filtering, reversible completion, adding goal/personal actions, task-linked notes/journal entries, general notes, injection escaping, reopen retention and responsive screenshots. Existing member-flow tests follow the new direct entry interface. The broad Quality job's budget increases from 15 to 25 minutes because the previous run timed out after 103 passing checks; coverage is retained.

This branch inherits earlier PR42–47 review dependencies and is not approved for direct merge or production publication. Final verification and checkpoint are recorded in the PR and Bible.
