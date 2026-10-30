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
// Scott explicitly requested publishing the ten-minute narration in the actual
// Meditation player, 2026-10-07. Only audio synchronization was added; HTML/CSS
// frame, controls and geometry are unchanged. State/seek/replay checks passed.
// Recovery: 4c0d2fed5f5b2b2cf414970d98f036f321e10c30.
// 2026-10-07: Scott explicitly instructed immediate live publication after the
// missing Meditation text cards were reported and the visual-check blocker disclosed.
// Baseline records only that scoped text-card change; visual verification is pending.
// Recovery: fd8307cf4ce53b2759d0ffb72bba7d3bddff0ae5.
// Scott requested rough Unguided and Lightly Guided builds on 2026-10-07.
// Review baseline only: three mode choices, ten-minute bells and readable reminders.
// Mock state/cue checks passed; rendered/browser verification and short VO remain pending.
// This baseline is not production approval. Existing Guided passages are preserved.
// Scott requested all three modes at 1/2/3/5/10/15/30/45/60 minutes.
// Scoped scripts and controls verified in Chrome at 1040/390px; 27 lifecycle checks pass.
// Frame CSS is byte-equivalent after newline normalization. Recovery: 75e883f.
// New narration uses labelled browser-voice drafts; recorded Guided 10m retained.
// Scott requested restoration of both admin boxes across player pages.
// Chrome owner save/readback tests and 16-route placement checks pass at 1040/390px.
// Existing saved slugs and owner editing retained; recovery 4ce3b48.
// 2026-10-09: Authorized Citadel-only frame removal, dark circles, white controls,
// and 40px artwork padding. Desktop/mobile rendered checks passed; Meditation unchanged.
// Recovery: 2480dc5.
// 2026-10-18: Scott explicitly approved removal of the outer35px border on all pages.
// Meditation now hides only the rectangular frame; image fills its existing stage.
// Shared outer borders removed via external appearance CSS; master source unchanged.
// Isolated desktop/phone all-page geometry and Meditation rendering reviewed.
// Recovery: 3bad304868c32d9ccb311f556025830e9db5f9b8.
// 2026-10-18: Scott explicitly requested applying the approved NEW GRATITUDE
// design to Meditation. Scoped teal curved cards, linked menus, circle/countdown,
// quiet-stage rail and 75/25 layout verified visually at1440/390px.
// All54 mode/duration lifecycles, all10 recorded text cards, real audio playback,
// keyboard seeking and reduced motion pass. Engine scripts/timing unchanged.
// Recovery: f6a9d9da9f73fa050153d0cffcc447f4576c2e59.
// 2026-10-20 Scott authorized a quiet selectable relaxation lead-in (30s–30m),
// followed automatically by the existing Meditation session. Scoped engine timing
// only; desktop/phone phase, silence, pause/replay and natural-boundary checks pass.
// Existing frame preserved. Recovery:2bd59aad6cd5fdc234a1c48f9c95196d7bb1bdc0.
// 2026-10-20: Scott authorized temporary relaxation voice. Desktop/phone renders,
// 27 session lifecycles and243 relaxation configurations passed; geometry unchanged.
// 2026-10-20: Scott requested closing bell at zero. Desktop/phone natural-zero
// checks across three modes and full playback regression pass; geometry unchanged.
// 2026-10-21: Scott requested spoken eye-opening sequence and immediate75%dim.
// Desktop/phone eye states rendered/reviewed; frame geometry unchanged.
// 2026-10-21: Scott requested1s delay,3s dim, dotfade, eyes then voice/closedeye.
// Desktop/phone ordered opening rendered and inspected; frame geometry unchanged.
// 2026-10-21: Scott requested a slow title-card fade before the opening routine.
// Title fade rendered and inspected; frame geometry unchanged.
// Scott locked the21October Meditation master, recoverable at23df2a2.
// Scott requested the Action Plan icon become his solid foot artwork (foot-icon) on 2026-10-30.
// Icon path only; frame, controls and geometry unchanged. Recovery: 0647b92.
// 2026-10-30: Scott requested the Library icon become his books artwork (small-library). Icon only. Recovery: 728133b.
// 2026-10-30: Scott requested a Gratitude button (Citadel row only, before Action Plan). One nav button added. Recovery: 089e265.
// 2026-10-30: Scott requested 'Entrepreneur Skill Cards' renamed 'Entrepreneur Cards'. Label text only.
const lockedFiles = {
  "players/meditation-sessions.js": "4ec40c3ed6b18598f0c968bbcf0be7f2bf8a15d5",
  "players/meditation-design.css": "076f9556a28f4d26c53e4d0e7583d0f08fc74d5e",
  "players/meditation-design.js": "3dcddbf5b09b46ae74150208537c9ab697a72fcd",
  "players/meditation-stage.css": "741b504a86756065c141aa3dc0bc01238dbb894e",
  "players/meditation-stage.js": "2fbd561d002ff24f1340691ac7d45365fea66afd",
  "players/master-player.html": "09ed033fdfdbc258627ea261d36f5d4ca55236da",
  "players/meditation.html": "b995df66bc25b4d6ea97b6997b4843d7b571e278"
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


