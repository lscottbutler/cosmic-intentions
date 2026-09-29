# Entrepreneur Player review

Status: In Review. Scope authorized by Scott on 2026-09-29: integrate the brainstormed player ideas on a branch for visual review.

Base/recovery: `bdfdbc07f86fc858e861bbdb65ed0a5053c70f90` on `review/goal-workspace-note-save`. Review branch: `review/entrepreneur-player-2026-09-29`.

Draft PR #43 targets main only to activate the existing Netlify Deploy Preview integration (which requires an enabled deployment base). Its full PR diff includes the PR #42 dependency; compare feature changes against the recovery commit above. Retargeting the draft does not merge or publish production.

The existing Entrepreneur card destination now mounts a shared learning component inside the canonical Master Player. No frame geometry, protected template, generated Roadmap output, AI model, Supabase data/schema, access control, or production setting changes.

All 31 cards retain their authored practical steps, affirmations, beliefs, stoic principles and winning attitudes. Existing notes and favourites remain accessible. The Self-Confident card is the detailed GO DEEPER example: YouTube chapter navigation, associated takeaways/CI exercises, podcast and article links, local timestamped notes and replay. Other cards explicitly identify resource curation as outstanding. Watching does not complete a roadmap task or log a win.

## Sources and content status

- Mel Robbins, Episode 46, publisher: https://www.melrobbins.com/episode/episode-46/ . Publisher embeds YouTube `kMtNkJcJn3M`; chapter marks selected from the publisher's list (09:21, 20:29, 22:30, 29:22). Checked 2026-09-29. Times need live playback alignment verification before release. This is manual curation, not an implemented automatic transcript/AI chapter extractor.
- James Clear, https://jamesclear.com/self-confidence . Specific article, checked 2026-09-29. Reading time is an estimate. Brief paraphrases only; exercise prompts are CI suggestions. No downloaded/rehosted videos, transcripts, thumbnails or audio.
- YouTube iframe API: https://developers.google.com/youtube/iframe_api_reference . Standard controls preserved; no overlays on video. Embedded playback depends on publisher/platform availability and browser permissions; timestamped external fallback remains visible.
- Resource selection and commercial-use/policy coverage remain In Review before production. No claim of creator endorsement or guaranteed outcomes.

## Data and privacy review

New saved items contain member-written note/action text, card key, optional selected goal ID/title, video ID and seconds. Purpose: retain and replay useful learning moments. Stored only in localStorage under `ci_ent_player_v1:<account-id-or-local-preview>:<card-key>` on this browser; no new server write, analytics or AI request. Account scopes are separate; saving is blocked if account changes. Device-local storage is not an encrypted backup or cross-device sync. Retained until removed or browser storage is cleared; users can inspect/remove each item in MY NOTES. Existing legacy notes store is unchanged. Storage failures retain the visible draft and report failure.

YouTube is loaded only after Play or a chapter click. It receives the standard embed/network information, not note or goal text; the video ID and public timestamp appear in the external source URL. No personal context is put into that URL. Navigating away/format switching pauses video; card replacement destroys the player. Publisher links open only when selected. Consent/policy coverage for this interaction requires review before launch. No privacy-policy publication is included in this prototype.

## Verification and next decisions

### Blank review frame correction — 2026-09-29

Scott reported the Master Player frame appearing with empty content. The original handoff URL did not enable the existing sample preview; a fresh preview origin had no member session, and the embedded-tool CSS hid the sign-in form. Earlier tests replaced the iframe URL with `preview=1`, masking the actual entry path. Corrected tests now use the delivered Master Player URL without rewriting its iframe.

The review URL now explicitly includes `preview=1`. Entrepreneur content inherits this only from the same-origin canonical Master Player on localhost or the existing allowlisted Netlify deploy-preview hostname. Production remains excluded before checking any flag. No authentication requirement, Netlify password protection or Supabase setting is removed. Without sample review, the existing Entrepreneur sign-in form is visible instead of hidden. No protected template file changes.

Review entry: `https://deploy-preview-43--gilded-profiterole-47a2eb.netlify.app/players/master-player.html?start=ent-card&ent=SELF%20CONFIDENT&preview=1`. This displays sample goals; it is not an account-data or live Roadmap review. Verification results belong in the session checkpoint after CI and deployment checks. Live protected-preview inspection still requires browser access.

Focused Playwright coverage: chapter seek and playback highlight with a stubbed API; exact timestamp save/reload/replay/remove; next action capture; resource links; keyboard tabs; blocked video fallback; storage failure; desktop/mobile rendered screenshots using actual card art. Full existing test suite and template guard remain required. Mock API tests do not verify live third-party playback.

Next creative review: approve the hierarchy/flow, then curate remaining cards and connect the working Roadmap AI result to the same learning component through an explicit adapter. This prototype does not replace the working Roadmap AI experience. No merge authorized.

### Entrepreneur Library visibility correction — 2026-09-29

Scott's screenshot showed an unpadded white catalog with faint category text and no visible cards. The shared catalog's CSS selectors only targeted `#page-cosmiclibrary`; the dedicated `#page-entrepreneurlibrary` therefore inherited light text and browser-default layout. All force groups also started collapsed.

Share the existing card/force styles with the dedicated ENT Library, add content padding and keyboard focus indicators, and open its first category on entry. The four categories and all 31 original cards remain intact. The Master Player shell, individual lesson/resource content, account settings and production remain unchanged. Recovery before this focused correction: `574fbfd131cdd56eb89a774b7502e6ade5c79a43`.

Verification now targets the delivered library URL on desktop/mobile, visible grid columns and text colors, all 31 loaded/usable artwork tiles, library-to-card-to-library navigation, and shell-menu entry. The two older library routing tests no longer rewrite the iframe URL. Screenshot evidence and CI/deployment results are recorded in the Bible after verification. Use the same private PR #43 preview with `start=entrepreneur-library&preview=1`; no production merge authorized.
