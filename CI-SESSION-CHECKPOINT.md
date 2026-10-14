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


## Slightly guided editor — 2026-10-14 in progress

Scott paused Command Center work and approved loading the slightly guided ten-minute session in the same module editor. Guided training is preserved at the original URL/storage key. The new version uses ?module=lightly-guided and a separate draft key. Three Working Master reminders are placed at 00:05, 03:00 and 07:00, with long blank quiet stretches and only opening/closing bells. New VO remains pending; the editor labels its missing recordings. Original assets and locked player files remain untouched.

Implementation is prepared, but rendered verification is blocked: the cached local Chromium binary is truncated and crashes; the official replacement download returns an HTML network-denial page; the cloud browser cannot reach this runtime's local preview. Do not claim the 21 browser tests passed: they failed before opening the page. Syntax checks pass. Need private Deploy Preview browser verification before merge/publication, as required by root AGENTS.md. Today's Bible backup was copied and text-verified before work.

Private Netlify preview for PR68 is ready at the slightly guided entry route, source caae33dfef9c1dae77e315c82bb4a23af0fdd7a9. Preview is password protected. Secure browser authentication was attempted; the rendered page reported Wrong password, please try again. Authentication success is not established. Manual secure browser handoff is the next action. Production is unchanged. Do not merge PR68 before rendered verification; once access is available, verify mode switching, separate autosave/reload, three cue times, silent intervals and original bell playback. Reminder VO remains pending.


## Gratitude-style slightly guided revision — 2026-10-14 13:03 ICT

Scott explicitly requested the gratitude narrow-box expansion, five images/text, selectable 1–5 minutes of black-screen quiet countdown, then the bell icon. Prepared in the same PR68 integration branch, not a new competing branch. The default slightly guided route now uses a separate mini-session storage key; earlier ten-minute slightly guided remains selectable with session=10m and its existing key. Guided training is untouched. Five existing test-module-1 image assets are loaded as editable reference images, with upload replacement controls and existing Working Master reminders. Quiet practice begins after the image sequence (default 45 seconds), runs the entire selected interval, then five seconds for the original closing-bell excerpt. Reminder VO remains pending. The member player is not wired to this editor-only revision yet.

Three model/backup unit checks pass (all five minute settings, malformed backups and media restrictions, preserved ten-minute model), and JS syntax checks pass. Rendered desktop/mobile, pause/resume/restart and audible bell checks remain blocked by protected preview access and the unavailable local browser. Do not claim this is fully verified or merge/publish yet. Production, Supabase, protected player files and privacy settings remain unchanged. Bible morning backup verified; this later revision is recorded here and needs final Bible synchronization after verification.


### 13:26 ICT clarification — expanded-banner script stage

Scott confirmed 1–5 minutes applies ONLY to black-screen countdown after images. Updated mini presentation to opening title/expansion complete at 0:04, three individual breath-instruction cards in expanded white banner, then five existing editable images with separate breath-caption cards, then selected quiet countdown and closing bell. Default instruction plus image prelude is 66 seconds, independent of selected quiet minutes. Each text card has its own uploadable narration slot and editable duration; actual matching VO is still pending, so recorded dialogue synchronization is not certified. Existing mini drafts receive added instruction cards while retaining user text/media, and normal previous-draft storage preserves their earlier serialization. Source syntax and four timing/backup tests pass; rendered verification remains blocked by password access. No production/member-player or Supabase change.
