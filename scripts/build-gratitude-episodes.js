/* ── build-gratitude-episodes.js ──────────────────────────────────────────
   Canonical builder for the Guided Gratitude slideshow.

   The image→line pairing lives HERE (explicit), not in filenames. Each source
   image (from the curated pool folders images/gratitude/gratitude-Episode N/)
   is compressed to images/gratitude/episode-<N>/<slug>.jpg, and manifest.json
   is written with the exact spoken line.

   NON-DESTRUCTIVE: pool folders ("gratitude-Episode N") are only READ.
   Clean rebuild: wipes existing episode-<N>/ outputs + manifest, then regenerates.

   Run:  node scripts/build-gratitude-episodes.js
──────────────────────────────────────────────────────────────────────────── */
const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', 'images', 'gratitude');
const MANIFEST = path.join(ROOT, 'manifest.json');
const MAX = 1280, QUALITY = 80;

// slug from the spoken line → web-safe filename stem
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'image';
const mb = b => (b / 1048576).toFixed(2) + ' MB', kb = b => (b / 1024).toFixed(0) + ' KB';
// src paths are relative to images/gratitude/
const S = p => path.join(ROOT, p);

const EPISODES = [
  { n: 1, title: 'Love & Connection', images: [
    { src: 'gratitude-Episode 5/shutterstock_184844336.jpg',        line: 'I am grateful for a loving partner to share my life with' },
    { src: 'gratitude-Episode 5/[000] shutterstock_315931391.jpg',  line: 'I am grateful for sweet moments with someone I love' },
    { src: 'gratitude-Episode 5/[000] shutterstock_531828817.jpg',  line: 'I am grateful for the tender love between two people' },
    { src: 'gratitude-Episode 5/shutterstock_295907705.jpg',        line: 'I am grateful for a carefree drive with someone I love' },
    { src: 'gratitude-Episode 5/shutterstock_352166354.jpg',        line: 'I am grateful for walking hand in hand along the beach at sunset' },
    { src: 'gratitude-Episode 4/[000] shutterstock_735369109.jpg',  line: 'I am grateful for love and tender moments together' },
    { src: 'gratitude-Episode 4/[000] shutterstock_564132445.jpg',  line: 'I am grateful for lasting love and growing old together' },
    { src: 'gratitude-Episode 5/FRIENDS.jpg',                       line: 'I am grateful for good friends' },
    { src: 'gratitude-Episode 2/[000] shutterstock_780298633.jpg',  line: 'I am grateful for celebrating good times with friends' },
    { src: 'gratitude-Episode 5/shutterstock_1937340616.jpg',       line: 'I am grateful for laughing with a good friend on a sunny day' },
    { src: 'gratitude-Episode 5/[000] shutterstock_380396212.jpg',  line: 'I am grateful for old friends who still laugh together' },
    { src: 'gratitude-Episode 5/[000] shutterstock_480240571.jpg',  line: 'I am grateful for good friends and shared laughter' },
    { src: 'gratitude-Episode 5/[000] shutterstock_1741110137.jpg', line: 'I am grateful for good friends and shared meals' },
  ]},
  { n: 2, title: 'Family & Home', images: [
    { src: 'gratitude-Episode 5/[000] GOOD MOTHER.jpg',             line: 'I am grateful for a good mother' },
    { src: 'gratitude-Episode 5/[000] shutterstock_1149690656.jpg', line: 'I am grateful for the loving bond between my children' },
    { src: 'gratitude-Episode 5/[000] shutterstock_1231591507.jpg', line: 'I am grateful for a grandmother sharing secrets with her granddaughter' },
    { src: 'gratitude-Episode 5/[000] shutterstock_765765574.jpg',  line: 'I am grateful for a home filled with family and love' },
    { src: 'gratitude-Episode 5/[000] shutterstock_1738136735.jpg', line: 'I am grateful for the joy and friendship of children' },
    { src: 'gratitude-Episode 22/stock-photo-happy-family-mother-and-daughter-playing-at-home-in-a-tent-562342009.jpg', line: 'I am grateful for playing together as a family' },
    { src: 'gratitude-Episode 5/[000] shutterstock_1361660567.jpg', line: 'I am grateful for the care and healing of beloved pets' },
    { src: 'gratitude-Episode 5/[000] shutterstock_341284742.jpg',  line: 'I am grateful for the loyal companionship of pets' },
    { src: 'gratitude-Episode 5/[000] shutterstock_1323996323.jpg', line: 'I am grateful for a warm and restful bedroom' },
    { src: 'gratitude-Episode 22/shutterstock_1193355994.jpg',      line: 'I am grateful for a beautiful open loft with a view' },
    { src: 'gratitude-Episode 5/[000] A COMFY BED.jpg',             line: 'I am grateful for a comfy bed' },
    { src: 'gratitude-Episode 5/[000] AIR CONDITIONING.jpg',        line: 'I am grateful for air conditioning' },
    { src: 'gratitude-Episode 5/[000] DREAM APARTMENT.jpg',         line: 'I am grateful for my dream apartment' },
    { src: 'gratitude-Episode 5/POTTERY MAKING.jpg',               line: 'I am grateful for pottery making' },
  ]},
  { n: 3, title: 'Food & Treats', images: [
    { src: 'gratitude-Episode 2/5-a-great-burger.jpg',              line: 'I am grateful for a great burger' },
    { src: 'gratitude-Episode 1/shutterstock_1625940874.jpg',       line: 'I am grateful for comfort food like mac and cheese' },
    { src: 'gratitude-Episode 5/[000] shutterstock_586694285.jpg',  line: 'I am grateful for fresh baked cookies' },
    { src: 'gratitude-Episode 5/shutterstock_1831802821.jpg',       line: 'I am grateful for a beautiful weekend brunch' },
    { src: 'gratitude-Episode 22/shutterstock_1284393808.jpg',      line: 'I am grateful for good wine and a delicious meal' },
    { src: 'gratitude-Episode 5/shutterstock_302106245.jpg',        line: 'I am grateful for fresh pizza at the table' },
    { src: 'gratitude-Episode 5/[000] CHOCOLATE.jpg',               line: 'I am grateful for chocolate' },
    { src: 'gratitude-Episode 5/GREAT COOK.jpg',                    line: 'I am grateful for being a great cook' },
    { src: 'gratitude-Episode 5/NICE RESTAURANTS.jpg',              line: 'I am grateful for nice restaurants' },
    { src: 'gratitude-Episode 5/[000] indian-food-curry-butter-chicken-600w-1304901667.webp', line: 'I am grateful for delicious Indian food' },
  ]},
  { n: 4, title: 'Nature, Body & Wellbeing', images: [
    { src: 'gratitude-Episode 4/[000] shutterstock_719498581.jpg',  line: 'I am grateful for a heart full of quiet gratitude' },
    { src: 'gratitude-Episode 5/[000] shutterstock_382697113.jpg',  line: 'I am grateful for good health and wholesome food' },
    { src: 'gratitude-Episode 22/[000] shutterstock_679440010.jpg', line: 'I am grateful for a strong and healthy heart' },
    { src: 'gratitude-Episode 5/shutterstock_102543755.jpg',        line: 'I am grateful for fresh healthy food to nourish me' },
    { src: 'gratitude-Episode 5/shutterstock_1221827803.jpg',       line: 'I am grateful for a strong body and energy to train' },
    { src: 'gratitude-Episode 5/[000] shutterstock_401353588.jpg',  line: 'I am grateful for taking good care of my body' },
    { src: 'gratitude-Episode 5/MEDITATION PRACTICE.jpg',           line: 'I am grateful for my meditation practice' },
    { src: 'gratitude-Episode 1/[000] A WALK IN NATURE.jpg',        line: 'I am grateful for a walk in nature' },
    { src: 'gratitude-Episode 1/[000] EXOTIC BEACH VACATION.jpg',   line: 'I am grateful for an exotic beach vacation' },
    { src: 'gratitude-Episode 5/shutterstock_1202980390.jpg',       line: 'I am grateful for camping beside a calm mountain lake' },
    { src: 'gratitude-Episode 5/shutterstock_174553253.jpg',        line: 'I am grateful for leaping into a golden sunset' },
    { src: 'gratitude-Episode 5/[000] shutterstock_151906466.jpg',  line: 'I am grateful for a peaceful walk through fresh snow' },
    { src: 'gratitude-Episode 5/[000] shutterstock_1312832759.jpg', line: 'I am grateful for lazy sunny days by the pool' },
    { src: 'gratitude-Episode 5/shutterstock_701095666.jpg',        line: 'I am grateful for beautiful sunsets over the city' },
  ]},
  { n: 5, title: 'Everyday Joys & Abundance', images: [
    { src: 'gratitude-Episode 5/shutterstock_1169927068.jpg',       line: 'I am grateful for a fresh cup of coffee to start my day' },
    { src: 'gratitude-Episode 22/[000] shutterstock_1144762331.jpg', line: 'I am grateful for a peaceful cup of coffee in the morning' },
    { src: 'gratitude-Episode 22/[000] shutterstock_1022620153.jpg', line: 'I am grateful for waking up rested to a bright new morning' },
    { src: 'gratitude-Episode 22/[000] shutterstock_1205313667.jpg', line: 'I am grateful for warm socks and cozy moments at home' },
    { src: 'gratitude-Episode 5/GOOD BOOK.jpg',                     line: 'I am grateful for a good book' },
    { src: 'gratitude-Episode 5/shutterstock_97871969.jpg',         line: 'I am grateful for abundance and financial security' },
    { src: 'gratitude-Episode 5/shutterstock_593385893.jpg',        line: 'I am grateful for meaningful work and creative freedom' },
    { src: 'gratitude-Episode 5/[000] shutterstock_628131992.jpg',  line: 'I am grateful for good colleagues and meaningful work' },
    { src: 'gratitude-Episode 5/[000] shutterstock_515912791.jpg',  line: 'I am grateful for technology that keeps me connected' },
    { src: 'gratitude-Episode 5/graphic-style-cartoon-night-city-450w-150327899.jpg', line: 'I am grateful for the freedom of the open road' },
  ]},
];

async function run() {
  // wipe stale episode-<N> outputs + manifest for a clean rebuild (pool folders untouched)
  for (const d of fs.readdirSync(ROOT)) {
    if (/^episode-\d+$/.test(d)) fs.rmSync(path.join(ROOT, d), { recursive: true, force: true });
  }

  const manifest = {};
  let totalIn = 0, totalOut = 0, count = 0, missing = [];

  for (const ep of EPISODES) {
    const outDir = path.join(ROOT, `episode-${ep.n}`);
    fs.mkdirSync(outDir, { recursive: true });
    console.log(`\n■ Episode ${ep.n} — ${ep.title}  (${ep.images.length} images)`);
    const entries = [];
    const seen = new Set();
    for (const it of ep.images) {
      const inPath = S(it.src);
      if (!fs.existsSync(inPath)) { missing.push(it.src); console.error(`   ✗ MISSING: ${it.src}`); continue; }
      let stem = slug(it.line.replace(/^i am grateful for /i, '')), name = stem + '.jpg', i = 2;
      while (seen.has(name)) name = `${stem}-${i++}.jpg`;
      seen.add(name);
      const outPath = path.join(outDir, name);
      const inSize = fs.statSync(inPath).size;
      await sharp(inPath).rotate().resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true }).toFile(outPath);
      const outSize = fs.statSync(outPath).size;
      totalIn += inSize; totalOut += outSize; count++;
      entries.push({ file: name, line: it.line });
      console.log(`   ${name}  (${kb(inSize)} → ${kb(outSize)})  “${it.line}”`);
    }
    manifest[ep.n] = entries;
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\n✔ ${count} images across ${EPISODES.length} episodes.  ${mb(totalIn)} → ${mb(totalOut)}` +
    (totalIn ? `  (${(100 - totalOut / totalIn * 100).toFixed(1)}% smaller)` : ''));
  if (missing.length) { console.error(`\n⚠ ${missing.length} missing source files — see above.`); process.exit(1); }
}
run();
