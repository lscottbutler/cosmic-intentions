# Member-page revisions — 2026-09-25

Status: In review on `review/goal-workspace-note-save`, PR42. Production remains at `116525cae867405337935df1d39ca232e4e8a0a9`.

## Scott's requested changes

- Goal Workspace inline notes have an explicit Save note button and Saved / Unsaved changes status. Local storage success is confirmed; the existing asynchronous account sync remains unchanged.
- Unsaved inline note drafts survive a task-list refresh when another action is completed or added.
- Habits opens the existing daily checklist. Edit habits opens the existing editor; Back to daily checklist returns to checkmarks. Existing habit IDs, daily keys, and persistence adapters are reused. Old runthroughs navigation returns to this canonical destination.
- Each goal card is a native collapsed disclosure on a fresh load. Cards opened during the session retain their state across renderer updates by stable goal ID. AI and removal remain separate controls.
- Goal removal is a white × on a black circle. Habit move up, move down, and delete controls are black circles with white symbols, including their disabled boundary states.
- The two existing owner-authored boxes are the first and last children of each member page's content. Existing block IDs and owner visibility rules are preserved. Both boxes are light purple (`#ac8dcc`) with white text.
- Page references follow the supplied Autoplay example: topic introduction, named teacher, linked source, paraphrased perspective, and practical application tips. Existing Favorites Autoplay reference remains. New references cover the other member pages, including the standalone Meditation and Citadel player views. Multi-perspective pages rotate at UTC midnight on load and offer Another perspective.
- Entrepreneur is restored as a named navigation destination, using its existing skills, resources, notes, roadmap, affirmations, beliefs, and learning material. The page presents information within the canonical Master Player; the old duplicate monitor is removed from the content renderer. Legacy Quickie Move master links resolve to Entrepreneur.
- Both Meditation countdown numbers use half their former font size and regular weight. White text, stacked minutes/seconds, and all rail/frame geometry remain unchanged.
- Page title cards appear at full opacity when their two artwork layers load. Their three-second image fade and page-navigation fade are removed; the colored backgrounds, word collage, and curved text box remain. Playback surfaces keep their existing transition.

## Source and recovery

Teacher summaries and source URLs live together in `players/page-reference.js`. Sources were checked on 2026-09-25: James Clear (goal setting, habit stacking, tracking), Gabriele Oettingen (WOOP), Sharon Salzberg (Just Sit), Robert Emmons (gratitude), David Allen (GTD), Émile Coué (historical autosuggestion text), Steve Blank (Customer Development). Application tips are CI suggestions, not quotations or author endorsements. No new AI calls or personal-data processing are involved.

Pre-revision checkpoint: `c13752a12c66479dc1c12eefa5a95db72953c4fb` contains the Save note change alone. `4bf8e60df57a2b01860695d821be77cdf2038cf7` adds Habits, collapsed goals, control colors, and admin box styling/placement. Main is unchanged. Restore individual changed files from these checkpoints to roll back a component; do not reset the entire player for unrelated changes.

The template integrity gate remains enabled. Its review baseline changes only for the explicitly requested reference integration, Entrepreneur navigation, and timer typography. The earlier approved player frame remains recoverable on production and the above commits.

## Verification

- Goal/task-note unit checks pass, including separate action identity, linked goals, save failure, and unchanged note classification.
- Browser: a temporary review goal loaded collapsed; opening and toggling AI retained its disclosure state. The goal × rendered white on black.
- Browser: daily Habits and its editor are both reachable; checkmarks can be set and undone. Habit up/down/delete rendered black and white.
- Reference mappings and source links checked for every configured page. JavaScript syntax and template integrity checks pass.
- Browser: the smaller countdown rendered at regular weight with white stacked minutes and seconds; play and pause worked. Meditation's Another perspective control switched the displayed teacher.
- Browser after owner sign-in: Entrepreneur opens from the site menu, displays its information, and changing the selected skill updates resources and the roadmap. Its heading contrast correction was verified as dark text on the white player surface.
- Browser: both owner admin boxes rendered light purple with white text; the top and bottom stacks were the first and last children of the Entrepreneur page. The Goal Workspace also displayed both boxes and its reference section.
- Browser limitation: the available signed-in Goal Workspace had no eligible saved notes or Journal entries, so its empty state was verified. Populated inline note saving is covered by the focused tests; an account-backed saved-note edit and cross-device synchronization remain unverified. No real member notes or goals were changed for verification.
- The existing broad browser suite is not being claimed as passing; this revision used focused checks. Mobile redesign remains deferred at Scott's request.
- Browser: Thoughts initial load and navigation between Thoughts and Habits display the title container at full opacity. Loaded artwork is fully opaque with a zero-second transition. The title-card change is checkpoint `5ae6e92c207cb681f0d79ada29c5cc477e4d6a9a`; its exact Netlify preview build succeeded.
- No Supabase schema, Netlify settings, site privacy, or production changes.

## Follow-up: Habits readability, card scaling, Roadmap and Favorites

- Habits names were present but inherited white text on the white checklist surface. Checkpoint `eddefed46f2ecabdcf5dc451d6284e568b1b302e` scopes dark text and readable muted/border colors to this workspace. Browser inspection and the rendered page confirmed visible names and instruction text; existing habit records and completion state were not changed.
- Checkpoint `182ce00bca8c5163c757662c283b02e7ef9010d4` places the blue title-card frame outside a true 16:9 media area. The former inset overlay covered artwork edges. Both image layers now match the media rectangle. Current frame width and trough geometry are preserved, and the integrity baseline records this specifically requested scaling change.
- Browser measurements: standalone media 1313 × 738.5625; Citadel media 1252 × 704.25. Both are exactly 16:9 and the image dimensions match. The Favorites title card was visually checked. Browser zoom/mobile behavior was not separately verified; the requested mobile redesign remains deferred.
- Roadmap opened from the site menu with saved goals, My Actions, Roadmap tabs, and populated counts. The reported persistent missing-task state was not reproduced after loading; no new Roadmap data or authentication change was made. Slow initial content appearance remains an observation, not a claimed fix.
- My Favorites Autoplay opens from the top site menu and directly at `https://deploy-preview-42--gilded-profiterole-47a2eb.netlify.app/players/master-player.html?start=favorites`. Its title card, reference section and administrator boxes rendered. The signed-in preview currently reports no pinned sessions; a populated saved-favorites queue is unverified. No favorites were created, deleted or replaced for testing.
- Both code checkpoints have successful Netlify preview builds. Production remains at the previously recorded commit; no production release, Supabase change, Netlify setting change or privacy change was made.

## Follow-up: startup recovery and all-menu-page audit

Scott subsequently supplied a Favorites screenshot with only the static introduction and an empty reference container, and reported Goals, Habits and Autoplay missing. This differs from a fully rendered empty Favorites list. He then explicitly requested verification of all pages.

- Reproduced a startup defect with the real `init()` orchestration: a profile-sync timeout discarded an already restored member session and skipped the independent goals request. The original source fails the regression assertion; the corrected source passes. Unrelated dashboard/setup renderer errors could also prevent destination routing.
- Checkpoint `37583f36ffd89cb0fbd492902511e35b5f4cfccf` retains a valid session, loads the account's cached goals, handles independent profile/goals requests separately, isolates secondary renderer failures, and resumes the requested inline destination. Auth-listener network work is deferred until after the callback to avoid the Supabase auth lock. Roadmap explicitly renders on entry. The public Favorites reference does not wait for sign-in.
- Checkpoint `6a73334086bdb4f6db3c82d03544792afe81e738` keeps the embedded sign-in dialog hidden when closed and visible when needed; it was formerly suppressed even when open. Both exact preview builds succeeded. Existing Master Player/meditation geometry and the template-integrity baseline are unchanged.
- These are confirmed code defects and focused regression results. They explain a possible blank-shell failure; the precise failure in Scott's own browser is not claimed to have been remotely observed.

### Browser audit on the private PR42 preview

All 19 menu destinations were opened. “Loaded” below means the rendered content was inspected, not that every save, generated response, long-running session or payment flow was tested.

| Page | Observed result |
| --- | --- |
| Citadel | Title artwork, navigation controls and reference loaded. |
| Goals | 12 saved goal cards rendered; collapsed cards and white removal icons visible. |
| Habits | Categorized daily checklist and readable habit names loaded; Edit habits and Back to daily checklist worked. |
| My Favorites Autoplay | Full reference and both admin boxes rendered, with an explicit no-pinned-sessions message. A populated queue and autoplay remain unverified. |
| My Thoughts | Entry controls, editable fields, reference and both admin boxes loaded. |
| My Journal | Journal header, reference and both admin boxes loaded; the add control opened the blank editor without creating an entry. No saved Journal entries were available in this browser. |
| Roadmap | Saved goals, tasks and real progress counts loaded. Roadmap tab became selected and displayed its tasks; the plus button became selected and displayed both My Actions and Roadmap groups. No tasks were completed or edited. |
| Visualization Library | Goal-based visualization launch controls, reference and both admin boxes loaded. A full visualization session was not run. |
| Meditation | Correct title and forest loaded; selecting one minute updated the start control. Start and Pause changed the player to running and then Resume states. No completion/replay claim. |
| Gratitude | Page content, reference and both admin boxes loaded; Start Gratitude opened the existing player. Begin and Next were activated and the player advanced from 1 of 10 to 3 of 10; playback was then closed. |
| Cosmic Library | Catalogue section headings loaded; expanding Leg Work revealed eight existing card images and launch buttons. |
| Entrepreneur | Existing information and resources loaded; choosing a different skill changed the selected skill. Reference and both admin boxes present. |
| My Wins | Saved wins, counts, entry controls, goal selector, reference and both admin boxes loaded. No wins edited. |
| Notes | Existing local review note, explicit Save note, Saved status, linked-goal selector and both admin boxes loaded. No note was saved during this audit. |
| Goal Workspace | Correct no-eligible-linked-records state, goal selector, reference and both admin boxes loaded. Populated account-backed content is not verified. |
| Landing Page 1 | Authored hero, features, pricing and links rendered. No signup/payment submitted. |
| Landing Page 2 | Authored hero, body and calls to action rendered. |
| Landing Page 3 | Authored hero, feature cards and calls to action rendered. |
| About Us | Authored heading and body rendered. |

The additional `/how-it-works` destination linked by Landing Page 3 also loaded its authored content. The final Favorites screenshot showed its full reference text and explicit empty state, not the blank container in Scott's report. No captured `[init]` or `[boot]` errors were returned in the final preview log check. Browser pointer actions occasionally timed out; affected controls were checked against settled state, including keyboard activation for Roadmap tabs.

### Confirmed account-sync blocker — not an empty-account claim

Read-only schema inspection of the existing Cosmic Intentions Supabase project `wbqzwbubbeorcknevips` confirmed that `public.profiles` has neither a `favorites` column nor a `notes` column. The existing client sync functions attempt to write those fields and only warn when they fail. Habits/wins fields exist. No private row content was retrieved for this inspection and no database change was made.

Consequently, Favorites, Journal and task notes cannot currently sync through those adapters. The empty lists in this browser do **not** prove that Scott's lists are absent from his original browser. Existing browser storage must be preserved. Adding empty records or resetting storage would not recover the missing lists.

The production-connected schema repair is **Proposed, not applied**: preserve the existing schema/data/policies; add nullable JSONB `notes` and `favorites` fields to the verified profiles table; retain owner-only access; first verify account-scoped migration/merge behavior against existing local lists and the preview's review-only fixtures. Test authorized/unauthorized access and sync outside production before proposing application. Do not enable the existing unscoped local-cache adapters against production without that preservation check. No production database approval is implied by this page audit.

### Gates and remaining limits

- Pass: member startup failure regressions, goal-workspace tests, task-note tests, JavaScript syntax and template integrity.
- Confirmed review branch: `review/goal-workspace-note-save`, draft PR42. Main remains `116525cae867405337935df1d39ca232e4e8a0a9`.
- No production release, Supabase mutation, Netlify configuration change, or privacy change. Preview code changed only through the review branch.
- Mobile redesign remains deferred. This is a desktop page-load and selected-control audit, not a claim of exhaustive browser, mobile, full-session, payment, AI-generation or cross-device verification.
- Daily Bible backups already exist for this workday; append this finding to the current Bible without replacing the earlier observations.
