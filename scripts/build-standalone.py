#!/usr/bin/env python3
"""
build-standalone.py — assemble a self-contained 3-Minute-Viz app you can open
locally (double-click index.html) or drop on any static host. No Netlify, no API.

    python scripts/build-standalone.py            # -> standalone-3mv/

What it does:
  - copies players/3min-viz.html, rewrites image paths to local ./art and ./assets
  - pre-computes each art image's accent palette (same algo as the player's canvas
    extraction) and inlines it as window.ACCENTS, so the auto-border works on file://
    (canvas pixel-reading is blocked there)
  - hides the dev-only tools (scrubber, swatches, image cycler); keeps mute + fullscreen
  - copies the 79 art JPGs + the intro logo into the folder
Voice-over: the player falls back to the browser's speech engine offline (any goal),
and still uses the nicer /api/tts voice when hosted somewhere that has it.
"""
import os, sys, json, math, shutil, colorsys
from PIL import Image

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC    = os.path.join(ROOT, 'players', '3min-viz.html')
ART    = os.path.join(ROOT, 'images', '50-50')
LOGO   = os.path.join(ROOT, 'images', 'clip-art', 'blue-hair-logo.png')
OUT    = os.path.join(ROOT, 'standalone-3mv')

def palette(path, topn=6):
    """Top vibrant colors — mirrors the player's saturation^2 x brightness x sqrt(coverage)."""
    im = Image.open(path).convert('RGB')
    w = 72; h = max(1, round(72 * im.height / im.width))
    px = im.resize((w, h)).load()
    B = {}
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            _, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
            if l < 0.22 or l > 0.85 or s < 0.35:   # drop dark / pale / muddy
                continue
            k = (r >> 4, g >> 4, b >> 4)
            o = B.setdefault(k, [0, 0, 0, 0])
            o[0] += r; o[1] += g; o[2] += b; o[3] += 1
    scored = []
    for o in B.values():
        n = o[3]; r = o[0]/n; g = o[1]/n; b = o[2]/n
        _, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
        lf = max(0.0, 1 - abs(l - 0.55) / 0.4)
        sc = s * s * lf * math.sqrt(n)
        scored.append((sc, '#%02x%02x%02x' % (round(r), round(g), round(b))))
    return [hx for sc, hx in sorted(scored, key=lambda t: -t[0]) if sc > 0][:topn]

def main():
    if not os.path.isfile(SRC):
        print('!! player not found:', SRC); sys.exit(1)
    arts = sorted(f for f in os.listdir(ART) if f.lower().endswith('.jpg'))
    if not arts:
        print('!! no art in', ART); sys.exit(1)

    print(f'pre-computing palettes for {len(arts)} images ...')
    accents = {f: palette(os.path.join(ART, f)) for f in arts}

    html = open(SRC, encoding='utf-8').read()
    html = html.replace('../images/50-50/', 'art/')
    html = html.replace('../images/clip-art/blue-hair-logo.png', 'assets/blue-hair-logo.png')

    inline = '<script>window.ACCENTS=' + json.dumps(accents, ensure_ascii=False) + ';</script>\n  '
    html = html.replace('<body>', '<body>\n  ' + inline, 1)

    overrides = ('<style id="standalone-overrides">'
                 '#scrub,#palette,#previmg,#imglabel,#nextimg{display:none!important}'
                 '.stagewrap{width:min(96vw,92vh*16/9)!important}'
                 '</style>\n</head>')
    html = html.replace('</head>', overrides, 1)

    # assemble folder
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, 'art'))
    os.makedirs(os.path.join(OUT, 'assets'))
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
    for f in arts:
        shutil.copy2(os.path.join(ART, f), os.path.join(OUT, 'art', f))
    if os.path.isfile(LOGO):
        shutil.copy2(LOGO, os.path.join(OUT, 'assets', 'blue-hair-logo.png'))
    open(os.path.join(OUT, 'README.txt'), 'w', encoding='utf-8').write(
        '3-Minute Visualization — standalone\n\n'
        'Open index.html in a browser (double-click), or host this folder anywhere.\n'
        'Tap the screen to play/pause. Top-right: mute + fullscreen.\n'
        'Set your goal with ?g=... e.g. index.html?g=I%20am%20calm%20and%20focused\n'
        'Voice-over uses your browser\'s speech engine (works offline, any goal).\n'
        'Re-run scripts/build-standalone.py to rebuild after editing the player.\n')

    total = sum(os.path.getsize(os.path.join(dp, f))
                for dp, _, fs in os.walk(OUT) for f in fs)
    print(f'built {OUT}  ({len(arts)} images, {total/1e6:.0f} MB)')
    print('open:', os.path.join(OUT, 'index.html'))

if __name__ == '__main__':
    main()
