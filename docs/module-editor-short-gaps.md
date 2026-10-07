# Instruction timing and narration cut repair

Scott rejected long silent gaps and reported the narration scissor did not work. Root cause: narration pointer movement still mapped against full-session duration while the timeline showed three slides. Corrected to visible-window time and added immediate narration block and paired-edge movement during drag.

Instruction timing now follows recorded passages: one-second fade before narration and one-second fade after (rounded to a tenth), retaining final five-second bell. Total runtime derives from slide durations instead of requiring 600 seconds. Original audio source passage offsets remain i*60; recorded words are preserved. Older editor drafts migrate once to close gaps while preserving text, images and opening silence; previous browser saved draft remains untouched until Save draft. Remove long gaps provides an explicit reset to this sequence. The separate ten-minute meditation player is untouched.

Validation passed: syntax, short gaps, dynamic duration, three-slide visibility, actual pointer handler drag with visible-window coordinates, save validation, original source audio mapping, restart. Rendered browser/audio verification remains pending behind private preview authentication. Production, Supabase, and Netlify settings unchanged. Bible update pending.
