/* ── compress-gratitude.js ────────────────────────────────────────────────
   Compress + web-safe the gratitude slideshow images.

   Reads every  images/gratitude/gratitude-Episode <N>/   (your curated folders)
   and writes optimized copies to  images/gratitude/episode-<N>/  :
     • resized to fit 1280×1280 (plenty for a phone slideshow)
     • JPEG quality 80 (mozjpeg) — typically a ~95–99% size cut
     • filenames slugified to lowercase-hyphen (web-safe on Netlify)
   NON-DESTRUCTIVE: your originals in "gratitude-Episode N" are left untouched.

   Run:  node scripts/compress-gratitude.js
   The player reads the filename as the gratitude line (see naming guide).
────────────────────────────────────────────────────────────────────────── */
const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', 'images', 'gratitude');
const MAX = 1280;        // longest edge
const QUALITY = 80;

// Turn any filename into a web-safe slug: strip a leading "[000] " marker,
// lowercase, collapse anything non a–z/0–9 into single hyphens.
function slug(name) {
  return name
    .replace(/\.[^.]+$/, '')             // drop extension
    .replace(/^\[\d+\]\s*/, '')          // strip the "[000] " prefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')         // everything else → hyphen
    .replace(/^-+|-+$/g, '')             // trim hyphens
    || 'image';
}

function mb(bytes) { return (bytes / 1048576).toFixed(2) + ' MB'; }
function kb(bytes) { return (bytes / 1024).toFixed(0) + ' KB'; }

async function run() {
  if (!fs.existsSync(ROOT)) { console.error('No images/gratitude folder.'); process.exit(1); }
  const srcDirs = fs.readdirSync(ROOT)
    .filter(d => /gratitude-Episode\s*\d+/i.test(d))
    .filter(d => fs.statSync(path.join(ROOT, d)).isDirectory());

  if (!srcDirs.length) { console.error('No "gratitude-Episode N" folders found.'); process.exit(1); }

  let totalIn = 0, totalOut = 0, count = 0;
  for (const dir of srcDirs) {
    const n = (dir.match(/(\d+)/) || [])[1];
    const outDir = path.join(ROOT, `episode-${n}`);
    fs.mkdirSync(outDir, { recursive: true });
    const files = fs.readdirSync(path.join(ROOT, dir)).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
    if (!files.length) { console.log(`episode-${n}: (no images)`); continue; }
    console.log(`\n■ ${dir}  →  episode-${n}  (${files.length} images)`);
    for (const f of files) {
      const inPath  = path.join(ROOT, dir, f);
      const outName = slug(f) + '.jpg';
      const outPath = path.join(outDir, outName);
      const inSize  = fs.statSync(inPath).size;
      try {
        await sharp(inPath)
          .rotate()                                                  // honor EXIF orientation
          .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: QUALITY, mozjpeg: true })
          .toFile(outPath);
        const outSize = fs.statSync(outPath).size;
        totalIn += inSize; totalOut += outSize; count++;
        console.log(`   ${f}\n      → ${outName}   ${mb(inSize)} → ${kb(outSize)}`);
      } catch (e) {
        console.error(`   ✗ FAILED ${f}: ${e.message}`);
      }
    }
  }
  console.log(`\n✔ ${count} images compressed.  ${mb(totalIn)} → ${mb(totalOut)}  ` +
    (totalIn ? `(${(100 - totalOut / totalIn * 100).toFixed(1)}% smaller)` : ''));
  console.log(`Output: images/gratitude/episode-<N>/  — safe to commit.`);
}
run();
