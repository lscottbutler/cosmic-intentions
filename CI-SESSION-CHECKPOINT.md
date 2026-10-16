# CI session checkpoint

Updated: 2026-10-12, UTC / Asia-Bangkok (UTC+7). Owner: Scott.
Read this first. It replaces stale current-state entries; prior records remain in Git history and the Bible.

## Standing delivery rule

Scott explicitly authorized publishing all current branch work on October 11 and making future requested revisions permanent on October 12. Finish requested changes by verifying, merging and deploying to the existing private production site. Do not leave the result only on a branch or ask him to repeat routine release approval. A later explicit preview-only instruction takes precedence. Keep password protection. Preserve the locked Master Player and meditation template.

Use one current integration branch until release, not a growing list of competing revisions. Explain results in plain language and supply the current playable link. Scott should not have to coordinate terminals, GitHub or multiple preview links.

## Current audited release

- Detailed request-to-result mapping, evidence, infrastructure findings and remaining work: `docs/AUDIT-2026-10-12.md`.
- Existing PR58 / `review/consolidated-ci-20261011` consolidates PR55 persistent instructions, PR56 second admin box removal, PR57 card insertion, plus the October 12 audit fixes. Use this release, not older prototypes.
- Fixed: title/ordinary card insertion and deletion; editor autosave with recoverable failure; title visibility when muted; timeline card tracking; fixed ten-minute insertion workflow; signed-in root entry into current member UI; stale navigation heading; readable phone search.
- Canonical files `players/master-player.html` and `players/meditation.html` remain unchanged and pass the integrity guard.
- Build, lint (zero errors), three unit suites, desktop/phone card and member tests, owner/member/guest fixtures and 27 mocked meditation lifecycle combinations passed. See audit for limits. Remote page remains behind the password gate in this browser; do not claim live signed-in/audio verification.
- Production at audit start: `651208fc2080161bb55cf78f2fee7b6fb403b68b`, deploy `6ac8bc08cc18f20007a6fe22`. This is a historical recovery point, not a claim it remains latest after release.
- Recovery branch: `backup/pre-publication-20261011-2010-ict` at that SHA.
- For live status, compare current `main`, PR58 merge result and Netlify's published deploy commit. The current Bible records the final release result. Do not infer deployment from this file or a ready preview.

Stable member address: https://cosmicintentions.com/standalone/member-design-test.html
Stable editor address: https://cosmicintentions.com/standalone/module-editor.html
Site id: `bf7cacf8-3b22-42be-b187-baf4ab0ebe9c`.

## Save and content limitations

Editor drafts autosave on the same browser, device and site address. They do not automatically transfer from an old numbered preview to production or publish content to all members. Download/Open backup transfers drafts. Never overwrite an unreadable draft automatically or claim unsaved browser data was recovered.

Script variants: https://docs.google.com/document/d/13OwayiVoCv7jEokcb9F_UTunwdJeasCjUP1M98p1tf0/edit . Ten Guided and ten Lightly Guided versions, original text preserved, colors and sentence formatting applied. Scott's selection and new production recordings remain pending. Preserve the existing ten-minute recording and identify browser-speech versions as drafts.

## Preservation and open blockers

Current Bible: https://docs.google.com/document/d/1JiDXWfSGVXqM0ZdmHXpBK6CVUBFYRsbRYRMAuIk0BLE/edit
Native pre-audit backup: https://docs.google.com/document/d/1l8zz6fMjONJCd73hnpKYRRoXld1ED-c_O0lWzZGnOI4/edit

Recent GitHub quality, hourly offsite, Supabase backup and Bible jobs fail before steps run. Root cause unknown; no logs available. Do not call these successful backups. Verified Bible copy and Git recovery point do not constitute full database backup or restore testing.

Supabase `wbqzwbubbeorcknevips`: read-only audit, active/healthy, 12 public tables with RLS enabled. No schema/data/settings changes. Remaining advisor findings are documented; do not loosen policies blindly.

No public launch, real-account cloud-sync, payment, AI-service or full audio certification was completed in this audit. Remote browser access remains password-gated; keep it private.

Older PR2/5/7/11/34 are prototypes or superseded work; do not merge wholesale. Close redundant PR55/56/57 only after verified consolidation. Preserve unmerged branches and history. The separate Windows checkout and its old uncommitted work remain unverified and must not be claimed backed up or updated.

## Next-session rule

Start from the actual current `main` and published commit, read this checkpoint and the latest Bible checkpoint, then address Scott's next requested revision. Update this file and the Bible with the real result, evidence, recovery point and open issues. Never restart from an old preview or claim unfinished voice-over/backups are complete.

## 2026-10-16 — Rotating trough artwork in CI.com admin boxes

Scott supplied troughs.zip (38 PSD designs) and authorized web optimization plus different artwork per player/page, refreshed on return. Source baseline: main 57912dcdb85e38dda1370c5688d583b78fc2496c. Netlify site bf7cacf8-3b22-42be-b187-baf4ab0ebe9c remains password protected. This targets CI.com, separately from the Sites Gratitude V2 editor.

Added 640px/1280px WebP variants (76 files, 3,723,128 bytes), preserving the complete 1280×720 composition. docs/trough-assets.json records original names. Original uploaded ZIP is unchanged; no PSDs added to Git. Artwork is user supplied; independent ownership/license verification was not performed.

The shared app.js Box 1 renderer displays artwork above existing editable text. Assignments persist locally, avoid each page's previous image and other pages' assigned designs. Editing/rehydration does not rotate artwork. Auth, owner-only editing, archived Box 2, Supabase, API and locked player shells are unchanged.

Validation: production build and player integrity gate pass; two rotation tests cover 18 unique assignments, 100 returns, reload persistence and storage errors. Actual Chromium rendering inspected at 1440×1000 and 390×844: images load, pages differ, return visits rotate, owner text saves without removing art, members see art without edit controls, anonymous empty boxes remain hidden. Service calls used isolated mocks and made no live writes. Verify Netlify's merged commit before reporting live. Main parent preserves recovery; native pre-update Bible copy saved 2026-10-16. Original protected source files unchanged.


## 2026-10-16 — Additional admin box above artwork
Scott requested another admin box directly above the rotating-trough box. Added an independent text-only Box 3 (page-note-<page>-3) to both the shared page stack and inline player frame; existing artwork/text remains Box 1. Both have owner-only pens and separate saved content; empty upper boxes remain hidden to members. Admin library includes the new above-artwork editor; archived Box 2 remains unchanged. Production build/integrity gate and rotation tests pass. Chromium desktop/mobile verified placement, owner saves and reload persistence for both independent boxes, member permissions and anonymous empty hiding. Parent main 29f1c59c3d58fb80bf129151638d6dcd5053e685 is recovery point. No database migration or protected player edits.

## 2026-10-16 — The Carousel replaces the artwork admin box
Scott renamed the lower artwork area The Carousel: remove its red border, placeholder and editing, retain the separate editable admin box above. The Carousel is now a read-only 16:9 region with no editable block, pen or surrounding red border. Original Box 1 saved text remains in storage, not displayed; its live Admin editor is removed. Upper Box 3 stays editable.

Curated shared/carousel-feed.json contains the existing 38 trough designs and supports typed affirmation/belief/other image or plain-text cards. No new affirmation/belief wording invented. Default 12-second automatic rotation with one-second crossfade after successful image load; revisit uniqueness remains. Hidden/inactive pages pause; removed elements stop timers. No paid API or scheduled content generation. See docs/carousel.md for feed format.

Build/integrity and rotation tests pass. Actual Chromium desktop/mobile inspected; no red carousel border, placeholder or edit controls, upper text saves, automatic rotation occurs, revisit works and no browser page errors. Source baseline/recovery main 63e22182888aeb223118379e453569363c28d2bf; protected player shells, Supabase schema/data and API unchanged. Browser service requests used isolated mocks only.
