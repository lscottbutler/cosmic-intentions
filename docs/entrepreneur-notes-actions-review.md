# Entrepreneur Player notes and actions — in review

Scott requested the existing note box be incorporated into ACTION, using his Strong Work Ethic screenshot on 2026-09-29. This revision adds a shared NOTES / TO-DO composer in ACTION and MY NOTES. Members can save/edit/remove notes, turn a note into an action, save a next step directly, and complete/reopen an action. One record appears in both panels; conversion preserves its ID and original goal/habit association. Unsaved text follows the composer between tabs.

## Data and preservation

- Uses the existing device-local, account-and-card-scoped `ci_ent_player_v1` store. Adds `kind: note` and action `done` state. Existing actions without `done` remain open. No backend, cloud synchronization, analytics, AI processing or additional third-party requests.
- Stored content: member-written text, existing card/account key, optional selected goal/habit ID and label, item ID/type/completion. Purpose: personal notes and follow-through. Access: this browser profile, scoped in the UI to the active account and card. Browser storage is not encrypted account storage and is not a cloud backup.
- Members explicitly save, edit, remove, convert and check off items. Items remain until removed or browser data is cleared. Failed writes retain drafts and prior saved state. An account change or unreadable store blocks writes under the existing guard.
- Earlier `ci_ent_notes` records are preserved in EARLIER CARD NOTES. This older store is device-wide. No automatic migration or inferred ownership. Explicit Add to actions copies one earlier note into the current account/card store while preserving the original; repeated clicks do not duplicate the copy.
- Policy coverage for device-local personal notes, retention/deletion and earlier device-wide notes still needs comparison with the actual policies before launch. No policy publication or claim of legal clearance. Existing media remains selected for review, not newly licensed or cleared.

## Review and recovery

Branch: `review/entrepreneur-player-2026-09-29`, draft PR #43. Recovery before this revision: `3daf5daa7ad46026b7cd19372556ddd276c18f10`. Review URL remains the protected PR #43 Strong Work Ethic player. The approved Master Player shell is unchanged. Production main remains `116525cae867405337935df1d39ca232e4e8a0a9`; Supabase and Netlify settings are unchanged.

Focused browser checks cover desktop/mobile note editing, goal preservation during conversion, shared panels, completion persistence/reopening, removal, card/account isolation, earlier-note preservation/idempotent conversion, failed storage and retained drafts. Synthetic test content only. Screenshots cover ACTION, MY NOTES, the enclosing player, and earlier notes on mobile. Existing Habits round trips and the full Master Player/31-card suite remain required gates in separate CI jobs. Final run IDs, visual review and checkpoint are recorded in the PR and current private Bible.
