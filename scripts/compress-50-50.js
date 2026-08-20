/* ── compress-50-50.js ────────────────────────────────────────────────────
   Shrink the images/50-50/ web jpgs (used by the thought photo cards + the
   "I AM" aff-cards) so they don't burn Netlify bandwidth. ~500KB masters →
   ~800px, q78 mozjpeg. In-place, buffer-then-write (safe), skips if not smaller.
   PSD masters stay local (gitignored), so this is non-destructive to sources.

   Run: node scripts/compress-50-50.js
────────────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.join(__dirname, '..', 'images', '50-50');
const MAX = 800, QUALITY = 78;
const kb = b => (b / 1024).toFixed(0) + ' KB';
const mb = b => (b / 1048576).toFixed(1) + ' MB';

(async () => {
  const files = fs.readdirSync(DIR).filter(f => /\.jpe?g$/i.test(f));
  let before = 0, after = 0, shrunk = 0;
  for (const f of files) {
    const p = path.join(DIR, f);
    const inBuf = fs.readFileSync(p);
    before += inBuf.length;
    let outBuf;
    try {
      outBuf = await sharp(inBuf)
        .rotate()   // honour EXIF orientation
        .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer();
    } catch (e) { console.log('SKIP (error):', f, e.message); after += inBuf.length; continue; }
    if (outBuf.length < inBuf.length) { fs.writeFileSync(p, outBuf); after += outBuf.length; shrunk++; }
    else { after += inBuf.length; }
    console.log(f.padEnd(20), kb(inBuf.length).padStart(9), '->', kb(outBuf.length).padStart(9));
  }
  console.log(`\nTOTAL ${files.length} imgs: ${mb(before)} -> ${mb(after)}  (${shrunk} shrunk)`);
})();
