"""Build images/countdown-banner.png from a piece of art, matching the
meditation banner (art background + white title plaque) and auto-deriving the
border/accent color from the artwork's most vibrant dominant color."""
import colorsys
from PIL import Image, ImageDraw, ImageFont

SRC   = r"C:\WORK\ROOT\images\50-50\[000] 1010.jpg"
OUT   = r"C:\WORK\ROOT\images\countdown-banner.png"
TITLE = "COUNTDOWN"
W, H  = 1920, 1080

def vibrant_color(im):
    """Most vibrant dominant color: quantize, score each by saturation*value*freq."""
    small = im.convert("RGB").resize((160, 90))
    q = small.quantize(colors=16, method=Image.MEDIANCUT)
    pal = q.getpalette()
    counts = q.getcolors()  # [(count, index), ...]
    best, best_score = (40, 90, 150), -1
    for count, idx in counts:
        r, g, b = pal[idx*3], pal[idx*3+1], pal[idx*3+2]
        h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
        # favor saturated, mid-bright, reasonably frequent colors
        score = s * (0.4 + 0.6*v) * (count ** 0.5)
        if score > best_score:
            best_score, best = score, (r, g, b)
    return best

def punch(rgb):
    """Saturate + contrast the chosen color so the frame reads boldly."""
    r, g, b = rgb
    h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
    s = min(1, s*1.35); v = min(1, max(.45, v))
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return (int(r*255), int(g*255), int(b*255))

# load art, cover-crop to 16:9
art = Image.open(SRC).convert("RGB")
ar = art.width/art.height
if ar > W/H:
    nw = int(art.height*W/H); art = art.crop(((art.width-nw)//2, 0, (art.width-nw)//2+nw, art.height))
else:
    nh = int(art.width*H/W); art = art.crop((0, (art.height-nh)//2, art.width, (art.height-nh)//2+nh))
art = art.resize((W, H), Image.LANCZOS)

accent = punch(vibrant_color(art))
hexc = "#%02x%02x%02x" % accent

# white title plaque
draw = ImageDraw.Draw(art, "RGBA")
pw, ph = int(W*0.78), int(H*0.60)
px, py = (W-pw)//2, (H-ph)//2
rad, bw = 46, 16
draw.rounded_rectangle([px-bw, py-bw, px+pw+bw, py+ph+bw], radius=rad+bw, fill=accent)
draw.rounded_rectangle([px, py, px+pw, py+ph], radius=rad, fill=(255,255,255,255))

# title, dark grey, letter-spaced
font = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 150)
spacing = 26
widths = [draw.textbbox((0,0), ch, font=font)[2] for ch in TITLE]
total = sum(widths) + spacing*(len(TITLE)-1)
x = (W-total)//2
asc, desc = font.getmetrics()
y = (H-(asc+desc))//2
for ch, w in zip(TITLE, widths):
    draw.text((x, y), ch, font=font, fill=(51,51,51))
    x += w + spacing

art.save(OUT)
print("SAVED", OUT)
print("ACCENT", hexc)
