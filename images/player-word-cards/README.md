# Player home word collages

Requested by Scott, 2026-09-24: replace temporary entrepreneur affirmation text with each page name repeated 30 times in different type styles, sizes and orientations. Keep the existing colored artwork and curved white panel.

Each transparent 1600×900 SVG overlays only the white text area. The original entrepreneur-library background image, colored frame and badge remain unchanged. Load both layers before revealing the card to prevent the old affirmation flashing. There are 30 outlined type styles per card; font files and remote font requests are not needed. Accessible text is supplied by the player image alt label.

The 11 existing home cards are Citadel, Habits, Goals, Roadmap, Visualize, Favorites, Gratitude, Journal, Thoughts, Wins and Cosmic Library. Meditation continues to use its existing forest player rather than an entrepreneur card.

Generator: `scripts/generate-player-word-cards.py` (fontTools and local system fonts). Outlines use URW Base35 fonts (URW Software; AGPL-3 with Font exception), Latin Modern fonts (GUST font license), and DejaVu fonts (Bitstream Vera license). The generator records the precise face name in every `data-font` attribute. Original colored artwork remains the existing project asset; this change introduces no replacement background artwork.
