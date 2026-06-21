// Reads a published Google Sheet (CSV) describing the visualization player's
// VO blocks + settings and returns JSON. Set env var VIZ_SHEET_CSV to the
// sheet's "Publish to web → CSV" URL. Falls back to built-in defaults if the
// env var is missing or the fetch fails, so the player always works.
//
// Sheet columns (header row, lowercase): key | phase | at_3 | at_10 | text
//   - rows whose key starts with "@" are settings (e.g. @voice, @image)
//   - {GOAL} inside any text is replaced by the player with the user's goal

const DEFAULTS = {
  settings: { voice: 'shimmer', image: '' },
  blocks: [
    { key:'hook',        phase:'Hook',          at:{ '3':0,   '10':0   }, text:'Close your eyes. For the next few minutes, your only job is to see what you want as if it is already yours.' },
    { key:'descent',     phase:'Descent',       at:{ '3':8,   '10':8   }, text:'Take a slow breath in... and let it go. With each breath, let your body soften and sink down.' },
    { key:'lungs',       phase:'Lungs',         at:{ '3':20,  '10':20  }, text:'One more deep breath in. And out. Feel yourself dropping into a calm, focused state.' },
    { key:'core_enter',  phase:'Core · Enter',  at:{ '3':34,  '10':34  }, text:'Picture it now, already real. {GOAL}.' },
    { key:'core_deepen', phase:'Core · Deepen', at:{ '3':76,  '10':219 }, text:'Step inside the picture. Feel it on your skin, hear the sounds around you. Notice how good it feels to be here.' },
    { key:'core_embody', phase:'Core · Embody', at:{ '3':118, '10':404 }, text:'This is yours. Feel the gratitude of already having it. Say silently to yourself: this is who I am.' },
    { key:'exit',        phase:'Exit',          at:{ '3':158, '10':578 }, text:'Hold that feeling. Slowly begin to return. When you are ready, open your eyes, and carry it with you.' },
  ],
};

// Minimal CSV parser (handles quoted fields + escaped quotes + CRLF).
function parseCSV(text) {
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

exports.handler = async () => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' };
  const url = process.env.VIZ_SHEET_CSV;
  if (!url) return { statusCode: 200, headers, body: JSON.stringify({ source: 'default', ...DEFAULTS }) };
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('sheet ' + res.status);
    const rows = parseCSV(await res.text()).filter(r => r.some(c => (c || '').trim()));
    if (rows.length < 2) throw new Error('empty sheet');
    const head = rows[0].map(h => (h || '').trim().toLowerCase());
    const col = (n) => head.indexOf(n);
    const ci = { key: col('key'), phase: col('phase'), at3: col('at_3'), at10: col('at_10'), text: col('text') };
    if (ci.key < 0 || ci.text < 0) throw new Error('missing key/text columns');
    const settings = { ...DEFAULTS.settings };
    const blocks = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const key = (row[ci.key] || '').trim();
      if (!key) continue;
      const text = (row[ci.text] || '').trim();
      if (key.startsWith('@')) { settings[key.slice(1).toLowerCase()] = text; continue; }
      blocks.push({
        key, phase: (row[ci.phase] || '').trim() || key,
        at: { '3': Number(row[ci.at3]) || 0, '10': Number(row[ci.at10]) || 0 },
        text,
      });
    }
    if (!blocks.length) throw new Error('no block rows');
    return { statusCode: 200, headers, body: JSON.stringify({ source: 'sheet', settings, blocks }) };
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify({ source: 'default', error: String(e.message), ...DEFAULTS }) };
  }
};
