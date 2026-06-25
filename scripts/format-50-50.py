#!/usr/bin/env python3
"""
format-50-50.py — batch-format column-B art for the 50/50 players.

Drop source art (.psd .png .jpg .jpeg .webp .tif .tiff .bmp) into images/50-50/
(or pass a folder), then run:

    python scripts/format-50-50.py
    python scripts/format-50-50.py images/50-50

Each source becomes a web-ready <name>.jpg in the SAME folder:
  - center cover-crop to exactly 3840x2160 (16:9, 4K) -> matches CSS center/cover
  - sRGB, quality 85, progressive, optimized, metadata stripped

Originals (.psd etc.) are never deleted. Re-running re-processes everything.
"""
import sys, os
from PIL import Image, ImageOps, ImageCms
import io

TARGET_W, TARGET_H = 3840, 2160          # 4K, 16:9
QUALITY = 85
SRC_EXT = {'.psd', '.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff', '.bmp'}

def to_srgb(im):
    """Convert any embedded ICC profile to sRGB; otherwise just ensure RGB."""
    icc = im.info.get('icc_profile')
    if icc:
        try:
            src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            dst = ImageCms.createProfile('sRGB')
            im = ImageCms.profileToProfile(im, src, dst, outputMode='RGB')
            return im
        except Exception:
            pass
    return im.convert('RGB')

def process(path):
    folder, fname = os.path.split(path)
    name, _ = os.path.splitext(fname)
    out = os.path.join(folder, name + '.jpg')

    with Image.open(path) as im:
        im.load()                               # PSD: grabs the flattened composite
        im = to_srgb(im)
        # cover-crop centered to exactly 3840x2160
        im = ImageOps.fit(im, (TARGET_W, TARGET_H), method=Image.LANCZOS, centering=(0.5, 0.5))
        im.save(out, 'JPEG', quality=QUALITY, optimize=True, progressive=True)

    return out, os.path.getsize(out)

def main():
    folder = sys.argv[1] if len(sys.argv) > 1 else os.path.join('images', '50-50')
    if not os.path.isdir(folder):
        print(f"!! folder not found: {folder}")
        sys.exit(1)

    srcs = [os.path.join(folder, f) for f in sorted(os.listdir(folder))
            if os.path.splitext(f)[1].lower() in SRC_EXT
            and os.path.isfile(os.path.join(folder, f))]

    if not srcs:
        print(f"no source images found in {folder}")
        return

    print(f"formatting {len(srcs)} file(s) -> {TARGET_W}x{TARGET_H} JPG q{QUALITY}\n")
    for p in srcs:
        try:
            out, size = process(p)
            print(f"  OK  {os.path.basename(p):30s} -> {os.path.basename(out):24s} {size/1024:6.0f} KB")
        except Exception as e:
            print(f"  ERR {os.path.basename(p):30s} {type(e).__name__}: {e}")
    print("\ndone.")

if __name__ == '__main__':
    main()
