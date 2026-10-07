# Habits → Entrepreneur Player

Status: In Review. Scott approved building the discussed six Habits links and individual follow-through entry on September 29, 2026. Review branch: `review/entrepreneur-player-2026-09-29`, PR #43. Recovery: `0f0439d4ab62c4f5b406fb1e59c8de57a70416c2`.

Replace only the Habits generic orientation card with six accessible link rows: Disciplined, Strong Work Ethic, Managing Time Wisely, Determined to Succeed, Organizational Skills, and Living the Brand. Links open the canonical Entrepreneur Player on MINDSET. Individual habit rows also offer “Help me follow through,” opening Disciplined with that habit's context and an editable next-repetition prompt. Saved steps remain in the existing device-local MY NOTES; they do not automatically complete a habit or create a cloud Roadmap task.

Navigation uses the canonical Master Player URL inside the existing parent frame. No protected-shell change. Return to Habits loads the same daily checklist, restores the source link focus/category state, and leaves the existing date-scoped completion store intact. Public routing parameters contain only the card key and entry type. Habits now inherits the already explicit sample-review flag only on the existing localhost/private deploy-preview allowlist; production remains excluded.

## Data and content scope

Optional navigation context contains habit ID/name, card key, local calendar day, closed section identifiers, and a snapshot of checked/unchecked habit IDs in account-scoped sessionStorage. It remains in the current browser tab, expires on a different local day, and is cleared on return. The return restores that same-day snapshot after account hydration, retaining unrelated newly added habit IDs. This protects the last local click against a stale account response; it does not create cross-device conflict resolution. Storage failure leaves generic navigation usable. Explicitly saved notes/actions may include the habit ID/name in the existing account/card-scoped localStorage; the existing remove control and storage-failure/account-change protections remain. No new network, analytics, AI, or database operation is introduced. Existing cloud sync is unchanged. Third-party media loads only after the member selects Play or a chapter; the initial destination is MINDSET.

The Mel Robbins and other preview resources retain their test/review status. This change does not grant commercial-use clearance or publish production. Legal checklist: https://app.notion.com/p/3ea01ada97e881008ecafaad43bd8d81 .

## Verification

New browser coverage follows all six real links and return paths on desktop/mobile, verifies default MINDSET, habit-specific context, saved next-step association, preserved checkmarks after return/reload, category state, focus, editor access, no automatic YouTube requests, and storage-blocked fallback. Synthetic habits and mocked cloud requests prevent production data use. Screenshots and final build/test results are recorded with the checkpoint in the Bible. Existing full CI and protected-template guard remain required.
