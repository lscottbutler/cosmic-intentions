import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Approved by Scott on 2026-09-24. Do not update these hashes without
// his explicit instruction to change the locked template.
// Earlier geometry checkpoint: 9b56b51fffbd208445be3eb8270be87a8a0e55ad.
const lockedFiles = {
  "players/master-player.html": "a88db164d1dbfe16f7b3e3f7a90881302f6ab986",
  "players/meditation.html": "bd2382e679595927bc525f9c81871794c07c89ea"
};
const root = new URL('../', import.meta.url);
const changed = [];

for (const [path, expected] of Object.entries(lockedFiles)) {
  try {
    const content = Buffer.from(readFileSync(new URL(path, root), 'utf8').replace(/\r\n/g, '\n'));
    const actual = createHash('sha1')
      .update('blob ' + content.length + '\0')
      .update(content)
      .digest('hex');
    if (actual !== expected) changed.push(path);
  } catch {
    changed.push(path);
  }
}

if (changed.length) {
  console.error('LOCKED TEMPLATE CHANGED: ' + changed.join(', '));
  console.error('Restore unrelated edits. Only update the baseline after Scott explicitly requests and approves the template change.');
  process.exitCode = 1;
} else {
  console.log('Approved Master Player and meditation frame are unchanged.');
}
