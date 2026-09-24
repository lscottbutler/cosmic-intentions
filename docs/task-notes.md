# Task notes — review implementation, 2026-09-24

Scott requested a black pencil button beside each task, a sliding note editor,
and a Notes button on the Citadel home page opening the master list.

The shared task renderer supplies the same editor in My Actions, Roadmap, the
combined view, nested actions, and the all-tasks list. Saving or leaving the
field updates one note. Opening the pencil again reads the latest saved text.
The master list shows the task code, list, goal, task text, and editable note.

Storage reuses `ci_notes` and the existing signed-in `profiles.notes` JSONB
sync. Task notes use category `task`, separate from journal entries and personal
thoughts. They are excluded from random thought display and the thoughts cap.
No schema, policy, authentication, provider, or production setting changes.
The note text and goal/task labels are private member content; they are not
added to AI prompts, URLs, analytics, or logs. Existing account storage and
retention apply. Editing the note is available from its task or the Notes list.

Task identity includes the goal ID, list kind, and stable task identity. My
Actions use their persistent ID (stable code as fallback); Roadmap uses its
stable number and text so replacing a generated task cannot inherit another
task's note. Notes remain in the master list if their originating task is removed.

Verification: `node --experimental-vm-modules tests/task-notes.unit.mjs` checks
creation, updates, reopening, isolation between goals and lists, master-list
rendering, escaped input, storage failure, thought isolation, editor expansion,
and calls to the existing cloud-sync adapter. Live account cloud synchronization
requires a signed-in session and is not asserted by the isolated test.

The review checkpoint before this feature is
`af616bd5684501d931a91fde252a934fc65e662a`. Only the requested Notes home control
and route extend the canonical player. Existing player geometry is preserved;
the template integrity gate remains enabled with the updated Master file hash.
