# Player edit scope and protected meditation border

Follow the repository root AGENTS.md. These instructions record Scott's direction on 2026-09-24 to preserve the corrected border during future changes elsewhere.

## Keep each edit focused

- Change only the component Scott names and the code necessary for that change.
- Use the active review branch and existing preview. Do not restart a site audit or search old history for a small visual edit when current source and the supplied reference are sufficient.
- Verify the requested visible result. Code values alone do not prove visual agreement.
- Preserve unrelated user work. Never restore an entire older master-player.html to fix one component.

## Protected meditation frame

Reference checkpoint: `9b56b51fffbd208445be3eb8270be87a8a0e55ad` in `players/master-player.html` and `players/meditation.html`.

Preserve all of the following unless Scott explicitly requests changing that feature:

1. The lower left and right blue borders visually align with the upper meditation player. The upper SVG uses a 35-unit stroke on a 1920-unit canvas; the lower sides follow `experienceFrame.clientWidth * 35 / 1920` through `--meditation-side-border`. Do not replace this with a fixed 35 CSS pixels.
2. The controls area remains white with its curved inner bottom edge.
3. The outer bottom edge is straight and the outer bottom corners are square, filled in Dodger Blue `#1e90ff`. The bottom-only background fill on `.shell.meditation-player-mode` preserves the white curve and does not square off the upper title.
4. Preserve the existing bottom-border thickness, controls and spacing during tasks targeting something else.

For unrelated edits, leave these geometry rules and the side-width calculation untouched. If an authorized change to shared styling could affect this frame, compare just this affected border region with the reference before handoff. Do not claim that this instruction file is an automated regression test or a technical write lock.

## Approved template integrity gate

Scott explicitly locked the complete approved template on 2026-09-24. `players/check-template-lock.mjs` protects `players/master-player.html` and `players/meditation.html` using their approved Git blob identities. It runs before builds and as an early CI step. The approved version remains recoverable at commit `9b56b51fffbd208445be3eb8270be87a8a0e55ad`.

Do not remove, skip or weaken the guard, replace its hashes, or change these protected files to complete unrelated revisions. A failed check means stop the affected change and preserve the approved template. Scott's explicit request to change a protected template feature authorizes only that requested feature; visually verify it before recording a new approved baseline. Other player engines and page content remain editable within the user's stated scope.
