# Cosmic Intentions Canonical Page and Player Map

**Status:** Approved working structure  
**Canonical shell:** `players/master-player.html`  
**Rule:** The Citadel Master Player owns the title trough, 16:9 stage, icon trough, crossfade, responsive frame, and player navigation. No feature page may create a second competing shell.

## Names we use

| Member-facing name | Internal page ID | Master action | Working content source |
|---|---|---|---|
| Citadel | `dashboard` | `home` / `citadel` | `#page-dashboard` |
| Goals | `setup` | `goals` | `#page-setup` |
| Habits | `habits` | `daily-habits` | `#page-habits` |
| Roadmap | `myroadmap` | `action-plan` | `#page-myroadmap` |
| Visualize | `vizlibrary` | `visualization` | `#page-vizlibrary` |
| Meditate | `meditation` | `meditation` | Master controls + Meditation engine |
| Favorites | `dailyfocus` | `favorites` | `#page-dailyfocus` |
| Gratitude | `gratitude` | `gratitude` | `#page-gratitude` |
| Thoughts | `notes` | `thoughts` | `#page-notes` |
| Journal | `mynotes` | `journal` | `#page-mynotes` |
| Wins | `wins` | `wins` | `#page-wins` |
| Cosmic Library | `cosmiclibrary` | `cosmic-library` | `#page-cosmiclibrary` |
| Entrepreneur Library | `entcard` | `quickie-move` | `#page-entcard` |
| Proof | `proof` | `proof` | `#page-proof` |
| Admin | `admin` | `admin` | `#page-admin` |

## Player architecture

### 1. Master shell

`players/master-player.html` is the only approved player shell.

It owns:

- dark-gray outer frame;
- gray title and icon troughs;
- the 16:9 media stage;
- Back, Menu, and Next behavior;
- shared trough icons;
- calm crossfades;
- responsive height reporting;
- direct startup modes such as `?start=meditation`.

### 2. Active content engines

These files provide a specific experience inside the master or an approved inline launcher. They are not alternate shells:

| Engine | Purpose |
|---|---|
| `players/meditation.html` | Meditation timer/audio surface |
| `players/3min-viz.html` | Three-minute goal visualization |
| `players/visualization.html` | Timed visualization |
| `players/creative-viz.html` | Creative visualization |
| `players/dvb.html` | Digital Vision Board |
| `players/ass-template.html` | Audio slideshow |
| `players/recite.html` | Affirmation/belief/quote recitation |
| `players/gratitude-guided.html` | Guided gratitude and silent reflection |
| `players/gratitude.html` | Gratitude experience launcher |
| `players/note-card.html` | Saved-note playback |
| `players/roadmap.html` | Roadmap playback |
| `players/art-frame.html` | Automatic art-frame visualization |
| `players/quote-reveal.html` | Admin review/reference utility |

### 3. Archived legacy players

Unreferenced prototypes and superseded templates live in `archive/legacy-players/`. They are excluded from the active player vocabulary and must not be linked from member pages.

## Permanent rules

1. A visible member player must use the Master Player shell.
2. A specialized engine may supply content, but it must not redefine the master chrome.
3. A correction to the master shell is global unless explicitly marked page-only.
4. Member navigation uses the member-facing names in the table above.
5. Internal page IDs and master actions are implementation details and must not become competing product names.
6. Before adding another player file, decide whether it is a shell, engine, or temporary prototype. Only engines belong in `players/`.
7. Temporary prototypes belong in `standalone/`; retired player prototypes belong in `archive/legacy-players/`.
