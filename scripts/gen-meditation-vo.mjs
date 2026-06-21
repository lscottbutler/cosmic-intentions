// One-off generator for the meditation player's voice-over cues.
// Calls the deployed OpenAI TTS function (key lives in Netlify env) and writes
// four static MP3s the player plays at fixed points in the session.
// Re-run to regenerate after editing LINES or VOICE:
//   node scripts/gen-meditation-vo.mjs
import { writeFile, mkdir } from 'node:fs/promises';

const ENDPOINT = 'https://gilded-profiterole-47a2eb.netlify.app/api/tts';
const VOICE = 'shimmer';                 // soft/gentle OpenAI tts-1 voice
const OUT = 'images/meditation/vo';

// Each line must stay under the function's 150-char cap.
const LINES = {
  'cue-start':  'Find a comfortable position and gently close your eyes. Let your breath settle into its own natural rhythm.',
  'cue-half':   "You're halfway there. If your mind has wandered, simply notice, and gently return to your breath.",
  'cue-near':   'Begin to bring soft awareness back to your body, and to the space around you.',
  'cue-end':    "When you're ready, slowly open your eyes, and carry this calm with you.",
};

await mkdir(OUT, { recursive: true });

for (const [name, text] of Object.entries(LINES)) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: VOICE }),
  });
  if (!res.ok) {
    console.error(`FAIL ${name}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const { audio } = await res.json();
  const buf = Buffer.from(audio, 'base64');
  await writeFile(`${OUT}/${name}.mp3`, buf);
  console.log(`ok  ${name}.mp3  (${buf.length} bytes)`);
}
console.log('done');
