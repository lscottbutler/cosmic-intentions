# Approved Meditation master —21 October2026

Scott locked the current Meditation player at commit23df2a257bc2382f83ca3ac0560ef522cab0baad, with recovery branch checkpoint/meditation-master-20261021. The companion JSON records exact Git blob identities. The build gate now protects the full Meditation presentation and sessions as well as its engine and Master shell. Change these only when Scott explicitly requests it.

## Road ahead

1. Meditation remains the approved design/control reference.
2. Gratitude should reuse as much of this frame, title treatment, progress rail, transport, eye sequence and settings pattern as possible. Its own slideshow, narration and completion behavior remain separate. This is recorded direction; Gratitude has not been changed in this release.
3. Super Viz is an independent copy at /standalone/super-viz.html. It has its own shell, engine, presentation and session scripts; relaxation choices, Guided/Unguided, and time controls. It keeps the approved Meditation look and opening sequence. The shell is copied from the canonical Master structure, not a new visual template.

Super Viz relaxation settings have their own session-storage keys. It does not record Meditation usage. Its current generic visualization guidance is a temporary draft, with its own cues; no Meditation instruction recording is played. Final visualization scripts, personal goal content and imagery remain future work. The approved relaxation intro is reused.

The existing Visualization Library and Gratitude implementations are retained. Do not silently replace their content or data. Future shared-component extraction must retain this locked baseline and separate player behavior.

## Source files

- Entry: standalone/super-viz.html; discoverable from the member menu.
- Shell: players/super-viz-player.html.
- Engine/session cues: players/super-viz.html and players/super-viz-sessions.js.
- Presentation/settings: players/super-viz-stage.js/.css and players/super-viz-design.js/.css.
- Current Meditation editor remains a separate private Sites app. No editor changes are included here.
