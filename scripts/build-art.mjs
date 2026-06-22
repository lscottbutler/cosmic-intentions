// Auto-rebuild the Art Frame rotation.
// Scans /art/ for images, makes web-optimised copies in images/art/, and
// regenerates images/art/list.json. Run via rebuild-art.bat (which then
// commits + pushes so it goes live).
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const SRC = 'art', OUT = 'images/art', MAX = 1200;

// locate ffmpeg: PATH first, else search the WinGet install
function findFfmpeg() {
  for (const cand of ['ffmpeg']) {
    try { execFileSync(cand, ['-version'], { stdio: 'ignore' }); return cand; } catch (e) {}
  }
  try {
    const base = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
    const stack = [base];
    while (stack.length) {
      const dir = stack.pop();
      for (const e of execFileSync('cmd', ['/c', 'dir', '/b', dir]).toString().split(/\r?\n/).filter(Boolean)) {
        const full = path.join(dir, e);
        if (e.toLowerCase() === 'ffmpeg.exe') return full;
        try { execFileSync('cmd', ['/c', 'dir', '/ad', '/b', full], { stdio: 'ignore' }); stack.push(full); } catch (x) {}
      }
    }
  } catch (e) {}
  return 'ffmpeg';
}

const FFMPEG = findFfmpeg();
await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).sort();
if (!files.length) { console.log('No images found in /art/. Drop some square images in there first.'); process.exit(0); }

const out = [];
for (const f of files) {
  const ext = path.extname(f).toLowerCase();
  const args = ['-y', '-i', path.join(SRC, f), '-vf', `scale='min(${MAX},iw)':-2`];
  if (ext === '.jpg' || ext === '.jpeg') args.push('-q:v', '4');
  args.push(path.join(OUT, f));
  try { execFileSync(FFMPEG, args, { stdio: 'ignore' }); out.push(f); console.log('  ok   ' + f); }
  catch (e) { console.error('  FAIL ' + f + ' (' + e.message + ')'); }
}
await writeFile(path.join(OUT, 'list.json'), JSON.stringify(out));
console.log(`\n${out.length} art piece(s) ready in ${OUT}/  ·  list.json updated`);
