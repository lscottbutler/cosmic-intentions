/* ── compress-gratitude.js ────────────────────────────────────────────────
   Compress + web-safe the gratitude slideshow images, AND emit a manifest that
   pairs each image with its spoken line (derived from the filename).

   Reads   images/gratitude/gratitude-Episode <N>/   (your curated folders)
   Writes  images/gratitude/episode-<N>/<slug>.jpg   (1280px, q80 mozjpeg)
   Writes  images/gratitude/manifest.json            (episode → [{file,line}])

   NON-DESTRUCTIVE: originals in "gratitude-Episode N" are untouched.
   Manifest MERGES: running for some episodes won't wipe the others.

   Run all:        node scripts/compress-gratitude.js
   Run some:       node scripts/compress-gratitude.js 1 2
────────────────────────────────────────────────────────────────────────── */
const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', 'images', 'gratitude');
const MANIFEST = path.join(ROOT, 'manifest.json');
const MAX = 1280, QUALITY = 80;

const only = process.argv.slice(2).filter(a => /^\d+$/.test(a)).map(Number);  // episode filter

// filename → web-safe slug (strip "[000] " marker + order prefix kept separate)
function slug(name) {
  return name.replace(/\.[^.]+$/, '').replace(/^\[\d+\]\s*/, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'image';
}
// slug → spoken line. "1-a-walk-in-nature" → "I am grateful for a walk in nature".
// If it already starts with "i am", use it verbatim (your escape hatch).
function lineFrom(s) {
  const words = s.replace(/^\d+-/, '').replace(/-/g, ' ').trim();
  const full = /^i am\b/i.test(words) ? words : `I am grateful for ${words}`;
  return full.charAt(0).toUpperCase() + full.slice(1);
}
// order: numeric prefix first (by number), then alphabetical
function orderKey(s) { const m = s.match(/^(\d+)-/); return m ? +m[1] : 1e6; }
const mb = b => (b / 1048576).toFixed(2) + ' MB', kb = b => (b / 1024).toFixed(0) + ' KB';

async function run() {
  if (!fs.existsSync(ROOT)) { console.error('No images/gratitude folder.'); process.exit(1); }
  let manifest = {};
  try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch (e) {}

  const srcDirs = fs.readdirSync(ROOT)
    .filter(d => /gratitude-Episode\s*\d+/i.test(d) && fs.statSync(path.join(ROOT, d)).isDirectory())
    .filter(d => !only.length || only.includes(+(d.match(/(\d+)/) || [])[1]));
  if (!srcDirs.length) { console.error('No matching "gratitude-Episode N" folders.'); process.exit(1); }

  let totalIn = 0, totalOut = 0, count = 0;
  for (const dir of srcDirs) {
    const n = (dir.match(/(\d+)/) || [])[1];
    const outDir = path.join(ROOT, `episode-${n}`);
    fs.mkdirSync(outDir, { recursive: true });
    const files = fs.readdirSync(path.join(ROOT, dir)).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
    console.log(`\n■ ${dir}  →  episode-${n}  (${files.length} images)`);
    const entries = [];
    for (const f of files) {
      const outName = slug(f) + '.jpg';
      const inPath = path.join(ROOT, dir, f), outPath = path.join(outDir, outName);
      const inSize = fs.statSync(inPath).size;
      try {
        await sharp(inPath).rotate().resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: QUALITY, mozjpeg: true }).toFile(outPath);
        const outSize = fs.statSync(outPath).size;
        totalIn += inSize; totalOut += outSize; count++;
        entries.push({ file: outName, line: lineFrom(slug(f)) });
        console.log(`   ${f}\n      → ${outName}  (${mb(inSize)} → ${kb(outSize)})  “${lineFrom(slug(f))}”`);
      } catch (e) { console.error(`   ✗ ${f}: ${e.message}`); }
    }
    entries.sort((a, b) => orderKey(a.file.replace(/\.jpg$/, '')) - orderKey(b.file.replace(/\.jpg$/, '')) || a.file.localeCompare(b.file));
    manifest[n] = entries;
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\n✔ ${count} images.  ${mb(totalIn)} → ${mb(totalOut)}` + (totalIn ? `  (${(100 - totalOut / totalIn * 100).toFixed(1)}% smaller)` : ''));
  console.log(`Manifest: images/gratitude/manifest.json  ·  Output: episode-<N>/  — safe to commit.`);
}
run();
