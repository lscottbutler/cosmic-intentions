import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Scott requested static 16:9 images, the left-side hamburger, and the saved Citadel
// opening box, goal-specific fork, and restored Entrepreneur Library/card routes in the player. The stage and meditation geometry remain locked.
// Earlier geometry checkpoint: 9b56b51fffbd208445be3eb8270be87a8a0e55ad.
// Scott explicitly requested the Entrepreneur card lower trough white, without its three buttons.
// Desktop/mobile visual preflight: run 36547855651, artifact 11023316652. Other player styling is unchanged.
// Recovery before this scoped change: 264ef08d62525a3c96119b9f1a103e4376ae08a9.
// Scott authorized Dodger Blue to charcoal #292929 across all players on 2026-09-30.
// Color-only desktop/mobile preflight: run 36663994741, artifact 11076115020;
// screenshots visually inspected and before/after frame geometry is identical.
// Pre-color recovery: dd9db0f3376b0849b68880cb7db488cf0b1b6395.
// Scott requested restoring both Citadel administrator text boxes and Admin access.
// Desktop/mobile owner editing, member blocking and sign-in preflight passed
// in run 36681532333, artifact 11081619937; all four screenshots were inspected.
// Only Citadel note mounting/loading changed in the shell; stage/trough geometry remains.
// Recovery before this restoration: 9c4f773d610b0b296f4aa6c5532e118cd7270960.
// Scott requested matching the two Citadel artwork joins to the standard side borders on 2026-10-01.
// Remove only the 12px note padding facing the artwork; preserve outer spacing and frame geometry.
// Desktop/mobile visual and admin preflight: run 36802313649, artifact 11136437507.
// Both rendered joins match the side border; all four owner/member/anonymous checks passed.
// Recovery before this scoped change: d4e221c1b6ed785dc6ed2d0b6d2306156793930f.
// Scott requested removing the Citadel Box 2-to-trough crossbar on 2026-10-01.
// Only the closing note's bottom padding is removed; existing artwork borders remain.
// Visual desktop/mobile preflight: run 36804135847, artifact 11136807436;
// Box 2 matches trough grey and all four Citadel admin checks passed.
// Recovery: 5a5568facfb7eacd84f3f0ce8bce77de80eb5d9d.
// Scott's queued request adds a 3px pale grey-white (#ededed) outline to the top trough.
// Desktop/mobile visual preflight: run 36804690887, artifact 11136842934;
// curved top, straight lower edge, grey fill and existing controls verified.
// Recovery before this outline: b5f8fc774f54800390a131148cba21d391f609c9.
// Scott requested the circled Entrepreneur Library player heading read COSMIC LIBRARY.
// Heading-only desktop/mobile visual preflight: run 36810697543, artifact 11139093196.
// All 31 cards load; library/card/menu navigation passes. Geometry and controls unchanged.
// Recovery before this title change: 06b98c2f4d599f253ab18fdc69713817f82cefc7.
// Scott explicitly requested upper-trough removal on all players.
// Same master blob rendered on desktop/phone in preflight run 37162290987,
// artifact 11287992723. Citadel and all 14 member destinations/menu checks passed;
// the former title trough collapses and the upper-left hamburger remains.
// Note-save checks are separate from this scoped template visual acceptance.
// Recovery: 99acd1bbd0be57c4f0250f5d2c3004d6e51ca8d9.
const lockedFiles = {
  "players/master-player.html": "b1b1ddc93e2a06e8f0d43659de274aa45bb47921",
  "players/meditation.html": "1479db4d49123a83dc1aa5605762f80fe54e766a"
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


