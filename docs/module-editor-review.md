# Module editor — first review

Scope: one editable sample relaxation module. Shared Master Player and Meditation source files are unchanged. Runtime preview inserts editable content into the existing frame, hides the unrelated meditation timer in the preview only, and uses editor playback controls.

Route: /standalone/module-editor.html

Includes card image/text/narration upload, separate spoken text, ordering, fixed duration or measured narration plus silence, fades, pause/resume/stop/replay, sound-off full spoken text, reduced motion, local drafts and previous version, JSON import/export. No halfway gong. No third-party upload, API keys, tracking, database writes, public publishing, or automatic voice generation. Sample content is proposed, not approved final script. Narration upload is recorded against the current spoken text; editor blocks stale narration until replaced. It cannot verify what an uploaded voice actually says.

Storage: local browser origin only. Assets are embedded in draft/export; large drafts may exceed browser storage. Save errors are shown and backup download remains available. Exports contain the images, text, and narration, so keep backups private. Save does not publish or synchronize between devices. A single previous saved version is retained; download separate backups for longer history. Full cloud drafts and admin authorization require a separate scoped implementation before any production editor release.

Verification: node syntax check and jsdom DOM-level behavioral checks passed (editing, save/history, add/delete, sound-off advance, pause/resume, completion/replay, missing narration, invalid duration). Local cloud browser access was blocked by client; rendered desktop/mobile and real audio checks remain pending. Previous Netlify preview is password protected. Do not claim final verification based on source checks.

Recovery: additive standalone files only. Previous branch checkpoint 9a505a5b00447bff7562c2df109def113bb251ac. Production, Supabase and access controls untouched. Bible start-of-day backup exists; this checkpoint has not yet been written to the Bible.
