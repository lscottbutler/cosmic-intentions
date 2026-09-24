"""Build vector word collages for the existing 1600 x 900 player cards.

Only the original white panel's text area is painted over. Backgrounds,
colored curved frames and the lower badge remain in the original artwork.
Font outlines make the 30 type styles consistent without web font requests.
Requires fontTools, Pillow and the Ubuntu fonts-urw-base35, fonts-lmodern,
fonts-dejavu-core packages. Run from the repository root.
"""
from pathlib import Path
from math import sin, cos, radians, ceil
from random import Random
from html import escape
import json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'images/player-word-cards'
OUT.mkdir(parents=True, exist_ok=True)
URW = Path('/usr/share/fonts/opentype/urw-base35')
LM = Path('/usr/share/texmf/fonts/opentype/public/lm')
DJ = Path('/usr/share/fonts/truetype/dejavu')
FONTS = [
    URW/'NimbusSans-Bold.otf', URW/'P052-Bold.otf', URW/'URWGothic-Demi.otf',
    URW/'NimbusRoman-BoldItalic.otf', URW/'NimbusSansNarrow-Bold.otf',
    URW/'URWBookman-Demi.otf', URW/'NimbusMonoPS-Bold.otf', URW/'Z003-MediumItalic.otf',
    DJ/'DejaVuSerif.ttf', URW/'C059-Bold.otf', LM/'lmsansdemicond10-regular.otf',
    URW/'NimbusSans-Italic.otf', LM/'lmromancaps10-regular.otf',
    URW/'P052-Italic.otf', DJ/'DejaVuSansMono.ttf', URW/'URWGothic-BookOblique.otf',
    LM/'lmroman10-italic.otf', URW/'URWBookman-LightItalic.otf',
    LM/'lmmonocaps10-regular.otf', DJ/'DejaVuSans.ttf',
    LM/'lmsansquot8-bold.otf', URW/'NimbusMonoPS-Italic.otf',
    LM/'lmromandunh10-regular.otf', URW/'C059-Italic.otf',
    LM/'lmromandemi10-regular.otf', URW/'NimbusSansNarrow-Oblique.otf',
    LM/'lmmonoltcond10-regular.otf', URW/'NimbusRoman-Regular.otf',
    LM/'lmsans10-boldoblique.otf', LM/'lmmonoproplt10-bold.otf',
]
LABELS = {
    'citadel':'Citadel', 'daily-habits':'Habits', 'goals':'Goals',
    'action-plan':'Roadmap', 'visualization':'Visualize', 'meditation':'Meditate',
    'favorites':'Favorites', 'gratitude':'Gratitude', 'journal':'Journal',
    'thoughts':'Thoughts', 'wins':'Wins', 'proof':'Proof',
    'cosmic-library':'Cosmic Library', 'quickie-move':'Quickie Move', 'admin':'Admin',
}

def outline(word, path):
    font = TTFont(path)
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    svg, bounds = SVGPathPen(glyphs), BoundsPen(glyphs)
    advance = 0
    for char in word:
        glyph = glyphs[cmap[ord(char)]]
        for pen in (svg, bounds):
            glyph.draw(TransformPen(pen, (1,0,0,1,advance,0)))
        advance += glyph.width
    box = bounds.bounds
    result = (svg.getCommands(), box, font['head'].unitsPerEm)
    font.close()
    return result

def allowed(x, y, w, h):
    if x < 225 or x+w > 1375 or y+h > 603: return False
    # Inset from the original upper white curve, including rotated word corners.
    def upper(px):
        t = (px-205)/1190
        return 230-360*t*(1-t)+16
    return y >= max(upper(x), upper(x+w))

def overlaps(box, placed):
    x,y,w,h = box
    return any(x < a+c+7 and x+w+7 > a and y < b+d+7 and y+h+7 > b
               for a,b,c,d in placed)

def build(slug, label):
    rng = Random(1709)
    placed, words, summary = [], [], []
    angles = [0,0,0,-90,0,90,-12,15,0,0,-90,0,12,0,90,-10,0,0,14,0,-90,0,0,-14,0,90,0,10,0,0]
    for i, font_path in enumerate(FONTS):
        word = label.upper() if i%3 == 0 else label.lower() if i%3 == 2 else label
        path, (x0,y0,x1,y1), em = outline(word,font_path)
        uw, uh = x1-x0, y1-y0
        angle = angles[i]
        width_goal = 560 if i == 0 else max(155, 250-i*2.2)
        height_goal = 108 if i == 0 else max(35,57-i*.65)
        scale = min(width_goal/uw, height_goal/uh)
        for attempt in range(16):
            w,h = uw*scale, uh*scale
            a = radians(angle)
            rw = abs(w*cos(a))+abs(h*sin(a))
            rh = abs(w*sin(a))+abs(h*cos(a))
            candidates = [(800-rw/2,394-rh/2)] if i == 0 else []
            candidates += [(rng.uniform(230,1370-rw),rng.uniform(170,602-rh))
                           for _ in range(1600)]
            chosen = next(((x,y,rw,rh) for x,y in candidates
                           if allowed(x,y,rw,rh) and not overlaps((x,y,rw,rh),placed)),None)
            if chosen: break
            scale *= .89
        if not chosen: raise RuntimeError(f'Cannot place {slug} word {i}')
        x,y,rw,rh=chosen
        placed.append(chosen)
        cx,cy=x+rw/2,y+rh/2
        # Glyph paths use an upward y axis; keep every face as its own path group.
        color = ['#292929','#404040','#555555','#363636'][i%4]
        words.append(f'<g data-word="{escape(label)}" data-font="{font_path.stem}" '
                     f'transform="translate({cx:.3f} {cy:.3f}) rotate({angle}) scale({scale:.6f} {-scale:.6f}) translate({-(x0+x1)/2:.3f} {-(y0+y1)/2:.3f})" fill="{color}"><path d="{path}"/></g>')
        summary.append({'font':font_path.stem,'angle':angle,'height':round(h,1),'bounds':[round(n,1) for n in chosen]})
    svg = '\n'.join([
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" role="img" aria-labelledby="title desc">',
        f'<title id="title">{escape(label)} word collage</title>',
        f'<desc id="desc">{escape(label)} repeated 30 times in 30 type styles, varying sizes and orientations.</desc>',
        '<path fill="#fff" d="M205 230 Q800 50 1395 230 V610 H205Z"/>',
        *words, '</svg>', ''
    ])
    (OUT/f'{slug}.svg').write_text(svg)
    return {'label':label,'count':len(words),'fonts':len(set(x['font'] for x in summary)),
            'minHeight':min(x['height'] for x in summary),'maxHeight':max(x['height'] for x in summary),
            'bytes':len(svg.encode()),'words':summary}

if __name__ == '__main__':
    manifest={slug:build(slug,label) for slug,label in LABELS.items()}
    (ROOT/'word-card-layouts.json').write_text(json.dumps(manifest,indent=2))
    print(json.dumps({k:{a:b for a,b in v.items() if a!='words'} for k,v in manifest.items()},indent=2))
