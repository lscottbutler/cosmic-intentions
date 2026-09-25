import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Frame approved by Scott on 2026-09-24. Review revision 2026-09-25 implements
// his requested teacher references, Entrepreneur menu, half-size regular timer,
// stationary page title cards without a fade, and uncropped 16:9 card scaling.
// Do not update these hashes for unrelated changes.
// Earlier geometry checkpoint: 9b56b51fffbd208445be3eb8270be87a8a0e55ad.
const lockedFiles = {
  "players/master-player.html": "5b9f66d7042900705e46d117956926da5891333c",
  "players/meditation.html": "074cf51d930fbb1d34d11f485be277f39835523e"
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
