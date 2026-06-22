// Reads a published Google Sheet (CSV) describing a full visualization player —
// one row per cue (text/image/vo/sfx/music/fade/hold/bell) with start/end, plus
// @-prefixed settings rows. Returns JSON for players/viz-player.html.
// Set env VIZ_PLAYER_SHEET_CSV to the sheet's "Publish to web → CSV" URL.
// Columns: type,start,end,text,image,audio,voice,fade_in,fade_out,volume,loop,section,notes

const DEFAULTS = {
  settings: { voice: 'shimmer', border: '#1c1c1c' },
  cues: [
    { type:'text',  start:0,   end:3,   text:'3 MINUTE MANIFEST', fadeIn:0.5, fadeOut:0.5 },
    { type:'text',  start:6,   end:13,  text:'{GOAL}', voice:'shimmer', fadeIn:0.5, fadeOut:0.5 },
    { type:'vo',    start:6,   end:12,  text:'{GOAL}', voice:'shimmer' },
    { type:'text',  start:16,  end:23,  text:'Recall a memory that fills you with joy or gratitude.', fadeIn:0.5, fadeOut:0.5 },
    { type:'text',  start:33,  end:37,  text:'OK. Close your eyes and begin.', fadeIn:0.5, fadeOut:0.5 },
    { type:'hold',  start:37,  end:67,  section:'Visualize' },
    { type:'text',  start:70,  end:79,  text:'While maintaining that feeling, visualize your life once your goal is achieved.', fadeIn:0.5, fadeOut:0.5 },
    { type:'hold',  start:81,  end:111 },
    { type:'text',  start:113, end:122, text:'Release your intention. Believe it has been granted and is now on its way.', fadeIn:0.5, fadeOut:0.5 },
    { type:'bell',  start:122, end:123 },
    { type:'text',  start:124, end:132, text:'Awesome effort today. Carry this feeling with you.', fadeIn:0.5, fadeOut:0.5 },
  ],
};

function parseCSV(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
function toSec(v) {                       // "1:07" | "67" | "1:02:03" -> seconds
  v = (v || '').trim(); if (!v) return 0;
  if (v.indexOf(':') < 0) return Number(v) || 0;
  return v.split(':').reduce((a, p) => a * 60 + (Number(p) || 0), 0);
}

exports.handler = async () => {
  const headers = { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'public, max-age=60' };
  const url = process.env.VIZ_PLAYER_SHEET_CSV;
  if (!url) return { statusCode:200, headers, body: JSON.stringify({ source:'default', ...DEFAULTS }) };
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('sheet ' + res.status);
    const rows = parseCSV(await res.text()).filter(r => r.some(c => (c || '').trim()));
    if (rows.length < 2) throw new Error('empty');
    const H = rows[0].map(h => (h || '').trim().toLowerCase());
    const col = (n) => H.indexOf(n);
    const c = { type:col('type'), start:col('start'), end:col('end'), text:col('text'), image:col('image'),
                audio:col('audio'), voice:col('voice'), fi:col('fade_in'), fo:col('fade_out'), vol:col('volume'),
                loop:col('loop'), section:col('section') };
    if (c.type < 0) throw new Error('missing type column');
    const settings = { ...DEFAULTS.settings };
    const cues = [];
    const get = (row, i) => (i >= 0 ? (row[i] || '').trim() : '');
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const type = get(row, c.type).toLowerCase();
      if (!type) continue;
      if (type[0] === '@') {                            // settings row → value in text/voice/audio cell
        settings[type.slice(1)] = get(row, c.text) || get(row, c.voice) || get(row, c.audio);
        continue;
      }
      const cue = { type, start: toSec(get(row, c.start)), end: toSec(get(row, c.end)) };
      const text = get(row, c.text); if (text) cue.text = text;
      const image = get(row, c.image); if (image) cue.image = image;
      const audio = get(row, c.audio); if (audio) cue.audio = audio;
      const voice = get(row, c.voice); if (voice) cue.voice = voice;
      const fi = get(row, c.fi); if (fi) cue.fadeIn = Number(fi) || 0;
      const fo = get(row, c.fo); if (fo) cue.fadeOut = Number(fo) || 0;
      const vol = get(row, c.vol); if (vol) cue.volume = Number(vol);
      if (/^y/i.test(get(row, c.loop))) cue.loop = true;
      const section = get(row, c.section); if (section) cue.section = section;
      cues.push(cue);
    }
    if (!cues.length) throw new Error('no cues');
    cues.sort((a, b) => a.start - b.start);
    return { statusCode:200, headers, body: JSON.stringify({ source:'sheet', settings, cues }) };
  } catch (e) {
    return { statusCode:200, headers, body: JSON.stringify({ source:'default', error:String(e.message), ...DEFAULTS }) };
  }
};
