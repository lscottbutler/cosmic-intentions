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


2026-10-16 — Scott requested dark dark grey admin box border. Shared 3px border changed from pink #ad1457 to charcoal #303030. Carousel remains borderless; editable admin box retains its existing size, text and pen. Recovery parent main deb795e3c408cb9c25c7e5ee2f441bd4908bb69e.


## 2026-10-17 — Player navigation landing-page flash
Scott reported a brief landing-page flash when selecting players from the hamburger. The embedded destination loads the root document, whose default page-home markup could paint before DOMContentLoaded and destination selection. Added a tiny inline first-paint style before external fonts/scripts in index.html, scoped to masterInline URLs; hides landing markup and duplicate loading/header chrome throughout embedded startup. No auth, content, timing, Carousel, Supabase, or protected player template changes.
Browser regression under delayed JS/CSS reproduced 2–3 landing paints in baseline Goals/Gratitude/Journal on desktop and phone, and zero after the fix. Production build and template guard pass. Native private Bible backup verified 2026-10-17 08:39 ICT. Recovery production/main: 2c8635ed9df05080e6c1ea7fdfb4a99eab8a1e4d. Active branch review/player-first-paint-20261017. Release verification pending; production not yet changed by this task.

Release status: PR73 merged to main a4296327e9c804f903a8ce6dece10b347db66d78. All 14 destinations verified at 1440px and 390px with delayed JS/CSS and zero landing paints. Production still serves 2c8635ed9df05080e6c1ea7fdfb4a99eab8a1e4d; no automatic deploy or workflow observed. Netlify dashboard signed out. Auto-review rejected clicking Log in as not explicitly authorized. Await user approval for sign-in and publication; no production or privacy changes. Bible updated with this verified/blocked status.


2026-10-17 09:58 ICT — Publication resolved. Netlify confirms deploy 6ad2d7f9a0da0424ffcb2e24 published exact reviewed main a4296327e9c804f903a8ce6dece10b347db66d78 at 09:09 Bangkok. Previous pending status superseded. All-deploy password protection retained; no manual deployment/login needed. Local desktop/phone Chromium checks passed; live authenticated navigation not reverified. Bible updated and read back.

2026-10-17 — Gratitude V2 published: PR74 integration + PR75 readable controls merged, final main 66c2a7f50f52f0645a92ae11be1eaf1b2d5282f6 confirmed published in Netlify production deploy 6ad2e626bb8fe7eec559c1d0. One Gratitude menu item; old gratitude/new-gratitude feature links resolve to /standalone/gratitude-v2/index.html?module=gratitude-v2. Exact V46 source/asset snapshot; private editor remains separate. All local desktop/phone stages, lifecycle, navigation verified. Bell play count one and natural Session complete verified. Production private; Supabase untouched. Bible updated and read back. Live authenticated playback not independently repeated. GitHub Actions infrastructure failures remain; no claim those checks passed.

2026-10-17 10:30 ICT — Scott clarified that the old entry named Gratitude must be removed and NEW GRATITUDE retained. Earlier decision to label V2 Gratitude was a misunderstanding and is superseded. PR76 removes menuLabels.gratitude, retains NEW GRATITUDE and uses NEW GRATITUDE as the page heading. Both legacy deep-link identifiers resolve to V2. Desktop/phone rendering tests assert exactly one NEW GRATITUDE button and zero Gratitude buttons; V2 playback and menu navigation pass. Build/integrity pass. Merged main 9daa63c416b4583df99240bdb000b231e9876b7d; recovery 66c2a7f50f52f0645a92ae11be1eaf1b2d5282f6. Publication verification pending; no player/data/privacy changes.

10:33:37 Bangkok — NEW GRATITUDE-only correction published. Netlify deploy 6ad2ebe71b91335e08f77396 serves exact reviewed main 9daa63c416b4583df99240bdb000b231e9876b7d. Pending status superseded. Menu and heading NEW GRATITUDE, old Gratitude entry removed. Bible updated/read back, privacy unchanged.

2026-10-17 — NEW GRATITUDE reference controls: Scott supplied image(20261017-033702).png showing grey curved panel, Modules1–5, central circular Play, times1/2/3/5/10/15/30/45/60. Added that panel to the member V2 renderer, replacing temporary dropdown/editor transport. Module1 resets approved five-slide V2;2–5 disabled because unconnected. All exact countdown durations validate and60-minute playback starts. Central Play/Pause/Resume and return to Meditation verified at1440/390; rendered screenshots compared and inherited style defects corrected. Build/protected-template integrity pass. No V2 sequence/audio/art, editor source, Supabase or privacy changes. PR77 merged main46dccd91f94a8bb07138df342217afcd4b873888; recovery9daa63c416b4583df99240bdb000b231e9876b7d. Publication verification pending. Today's Bible backup preserved.

10:43:01 Bangkok — Controls published: Netlify deploy6ad2ee1e6185276c29967ade confirms exact reviewed main46dccd91f94a8bb07138df342217afcd4b873888. Pending status superseded. NEW GRATITUDE grey curved panel/modules/Play/full time choices verified locally desktop/phone, production commit verified, Bible updated/read back. All-deploy password protection preserved; no Supabase changes.

2026-10-17 — NEW GRATITUDE trough scrubber and timer typography. Scott's image(20261017-045452).png marks the curved trough upper edge in orange. Added draggable orange curved rail/thumb during countdown only, pointer capture, keyboard Home/End/arrows, and countdown value/accessibility updates. Timer font scale0.7→1.05 (exact50% increase), weight500 and italic; baseline recentered. Protected shell, source editor, voices, other stages, controls and privacy unchanged. Actual Chromium1440/390 pointer/keyboard/visibility/font checks and rendered screenshot comparison pass; build/integrity pass. PR78 merged main71858ccdd9100b373a5bc2e6f201eedc2e4feeba; recovery46dccd91f94a8bb07138df342217afcd4b873888. Publication verification pending.

11:58:22 Bangkok — Scrubber/typography published: Netlify deploy6ad3005e9928ad5d2da23832 serves reviewed main71858ccdd9100b373a5bc2e6f201eedc2e4feeba. Pending status superseded. Bible updated/read back. Privacy/Supabase unchanged; exact production commit and local rendered behavior verified.

2026-10-17 — NEW GRATITUDE 250px bottom border. Scott's image(20261017-050506).png marks the lower edge and area below it. Extended only the bottom teal border to250 design pixels, preserving16:9 picture and visible caption, other borders, and moving existing controls downward. Current SVG lower band29 + proportional221 extension=250; same#05728b. Chromium1440/390 geometry/color checks and screenshot comparison pass; build/integrity pass. PR79 merged main50e48a0eeec4e9b63b3740daa99455da195b8af0; recovery71858ccdd9100b373a5bc2e6f201eedc2e4feeba. No timing/audio/data/privacy changes. Publication verification pending.

12:07:43 Bangkok — Bottom250px published: Netlify deploy6ad3028f1061fa01fa581489 serves reviewed main50e48a0eeec4e9b63b3740daa99455da195b8af0. Pending status superseded. Bible updated/read back; private site and Supabase unchanged.


2026-10-17 — NEW GRATITUDE moving navigation panel — IN REVIEW
Scott's image(20261017-052517).png places modules left, times right, central Play in the expanded teal bottom border. Controls now occupy that border, replacing the grey panel below. Play lifts the circle to the trough center (SVG y782), retracts/hides side controls, and contracts total bottom border250→35 design pixels. Picture geometry stays fixed. Pause restores the configuration panel; resume retracts it. The existing eyes/countdown/bell circle replaces the Play overlay during those stages and can be clicked/keyboard activated to pause and reopen controls. Completion restores replay controls. Reduced-motion users get the same states without panel motion.
Review branch review/gratitude-moving-panel-20261017. Recovery main50e48a0eeec4e9b63b3740daa99455da195b8af0. Build/integrity pass; desktop/phone rendering and functional checks in progress. No protected template, Supabase, separate editor project or privacy changes. Today's verified Bible backup retained. Release pending, not yet production.
