// Generator for the visualization player's STATIC voice-over blocks.
// (The Core "enter" block speaks the user's goal and is generated at runtime
// in the player via /api/tts — it is intentionally not produced here.)
// Re-run after editing LINES or VOICE:  node scripts/gen-visualization-vo.mjs
import { writeFile, mkdir } from 'node:fs/promises';

const ENDPOINT = 'https://gilded-profiterole-47a2eb.netlify.app/api/tts';
const VOICE = 'shimmer';
const OUT = 'images/visualization/vo';

// Keep each line under the function's 150-char cap. Keys match BLOCKS .src in the player.
const LINES = {
  'vo-hook':    'Close your eyes. For the next few minutes, your only job is to see what you want as if it is already yours.',
  'vo-descent': 'Take a slow breath in... and let it go. With each breath, let your body soften and sink down.',
  'vo-lungs':   'One more deep breath in. And out. Feel yourself dropping into a calm, focused state.',
  'vo-deepen':  'Step inside the picture. Feel it on your skin, hear the sounds around you. Notice how good it feels to be here.',
  'vo-embody':  'This is yours. Feel the gratitude of already having it. Say silently to yourself: this is who I am.',
  'vo-exit':    'Hold that feeling. Slowly begin to return. When you are ready, open your eyes, and carry it with you.',
};

await mkdir(OUT, { recursive: true });
for (const [name, text] of Object.entries(LINES)) {
  const res = await fetch(ENDPOINT, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: VOICE }),
  });
  if (!res.ok) { console.error(`FAIL ${name}: ${res.status} ${await res.text()}`); process.exit(1); }
  const { audio } = await res.json();
  const buf = Buffer.from(audio, 'base64');
  await writeFile(`${OUT}/${name}.mp3`, buf);
  console.log(`ok  ${name}.mp3  (${buf.length} bytes)`);
}
console.log('done');
