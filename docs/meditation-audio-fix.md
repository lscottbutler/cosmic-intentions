# Meditation review correction

User screenshot showed countdown and no labeled Play, plus audio load failure. Root cause: audio/ was not copied by Vite static-copy. Move the audio into players/audio/, already included in build; no build configuration changes. Add visible labeled PLAY/PAUSE/RESUME/REPLAY control before the existing lower controls, only for guided 10 minutes. Explicit button starts audio inside user click before toggling timer; countdown remains in existing circle. No canonical template edits.

Syntax verified. Netlify preview deployment and authenticated browser playback verification pending. GitHub runner jobs previously failed before running test steps. Source original files and MP3 review master retained. Morning Bible backup unchanged. Production, Supabase, privacy and Netlify configuration untouched. Recovery: a61fa0cf693ef3ee760db45a1db0ad134b5a10f2.
