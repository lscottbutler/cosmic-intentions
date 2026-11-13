// Guard: admin box dashboard-note-2 must never get the member edit pen.
import fs from 'fs';
const s = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
if (/_WELCOME_EDIT_BADGE/.test(s)) { console.error('FAIL: member edit pen re-added to admin box'); process.exit(1); }
console.log('OK: admin box has no member pen');
