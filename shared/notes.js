import { esc, toast } from '../app.js';

/* ── MY NOTES ──────────────────────────────────────────────────
   A Pegboard-style personal library: the user types their own
   affirmations, beliefs, reminders, inspirations and quotes. Notes
   are stored locally (ci_notes), surface randomly around the site,
   and can be pinned with ♥ so they show in Daily Focus / Play My Day
   as on-screen cards. Up to NOTES_CAP total. */

export const NOTES_CAP = 50;

export const NOTE_CATS = [
  { key: 'affirmation', label: 'Affirmations', icon: '✦', ph: 'I am…' },
  { key: 'belief',      label: 'Beliefs',      icon: '◈', ph: 'I believe…' },
  { key: 'reminder',    label: 'Reminders',    icon: '⏰', ph: 'Remember to…' },
  { key: 'inspiration', label: 'Inspirations', icon: '✧', ph: 'What inspires me…' },
  { key: 'quote',       label: 'Quotes',       icon: '❝', ph: 'A quote I love…' },
];
const CAT_LABEL = Object.fromEntries(NOTE_CATS.map(c => [c.key, c.label]));

/* ── storage ─────────────────────────────────────────────────── */
export function readNotes() {
  try { const a = JSON.parse(localStorage.getItem('ci_notes') || '[]'); return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}
function _saveNotes(a) {
  try { localStorage.setItem('ci_notes', JSON.stringify(a)); } catch (e) {}
}
function _readFavs() {
  try { const a = JSON.parse(localStorage.getItem('ci_favorites') || '[]'); return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}
function _saveFavs(a) {
  try { localStorage.setItem('ci_favorites', JSON.stringify(a)); } catch (e) {}
}
function _noteIsPinned(id) { return _readFavs().some(f => f && f.type === 'note' && f.id === id); }
function _id() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

/* Pick a random note (optionally within a category) — used for the
   random surfacing around the site. Returns a note object or null. */
export function randomNote(cat) {
  const pool = readNotes().filter(n => n && n.text && (!cat || n.cat === cat));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* Fill every [data-random-note] slot on the page with a random note.
   The attribute value optionally restricts to a category (''=any).
   Empty slots (no matching notes) hide themselves. Call on each page nav
   so the surfaced notes rotate as the user moves around the site. */
export function sprinkleNotes() {
  const slots = document.querySelectorAll('[data-random-note]');
  slots.forEach(el => {
    const n = randomNote(el.getAttribute('data-random-note') || '');
    if (!n) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.innerHTML =
      `<span style="flex-shrink:0;color:#e0102b;font-size:15px;">✦</span>` +
      `<span style="flex:1;min-width:0;font-size:14px;font-style:italic;color:var(--text,#eee);line-height:1.5;">${esc(n.text)}</span>`;
  });
}

/* ── page render ─────────────────────────────────────────────── */
export function renderNotesPage() {
  const host = document.getElementById('notesSections');
  if (!host) return;
  const notes = readNotes();
  const total = notes.length;

  host.innerHTML = NOTE_CATS.map(c => {
    const mine = notes.filter(n => n.cat === c.key);
    const singular = esc(c.label.replace(/s$/, ''));   // "Reminders" → "Reminder"
    const rows = mine.map(n => {
      const pinned = _noteIsPinned(n.id);
      return `
      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;">
        <textarea data-id="${n.id}" onchange="notesSaveField(this)" oninput="notesAutoGrow(this)" placeholder="${esc(c.ph)}"
          style="flex:1;min-width:0;box-sizing:border-box;padding:11px 13px;border:none;border-radius:9px;font-size:14px;line-height:1.5;color:#1a1a1a;background:#fff;min-height:44px;overflow:hidden;resize:none;">${esc(n.text || '')}</textarea>
        <button id="notefav-${n.id}" onclick="notesToggleFav('${n.id}')" title="${pinned ? 'Unpin from Daily Focus' : 'Pin to Daily Focus'}"
          style="flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#fff;border:1px solid #000;cursor:pointer;font-size:24px;line-height:1;padding:0;color:#e0102b;opacity:${pinned ? '1' : '0.4'};">${pinned ? '♥' : '♡'}</button>
        <button onclick="notesDelete('${n.id}')" title="Delete"
          style="flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:#000;border:none;cursor:pointer;font-size:15px;line-height:1;padding:0;color:#fff;">✕</button>
      </div>`;
    }).join('');

    // Hidden until the user taps "＋ Add …" in the banner.
    const addBox = total < NOTES_CAP ? `
      <textarea id="notesadd-${c.key}" data-add="${c.key}" onchange="notesSaveField(this)" oninput="notesAutoGrow(this)" placeholder="＋ Add ${singular.toLowerCase()}…"
        style="display:none;width:100%;box-sizing:border-box;padding:11px 13px;border:1px dashed #5E5E5E;border-radius:9px;font-size:14px;line-height:1.5;color:#1a1a1a;background:#f4f4f4;min-height:44px;overflow:hidden;resize:none;"></textarea>` : '';

    return `
      <button onclick="notesToggleSection('notesec-${c.key}')"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;background:#1f1f1f;border:1px solid var(--border,#333);border-radius:10px;padding:14px 18px;cursor:pointer;margin-bottom:10px;">
        <span style="font-weight:800;font-size:15px;letter-spacing:.5px;color:#fff;text-transform:uppercase;">${c.icon} ${esc(c.label)}</span>
        <span style="display:flex;align-items:center;gap:12px;">
          ${total < NOTES_CAP ? `<span onclick="event.stopPropagation();notesShowAdd('${c.key}')" title="Add a ${singular.toLowerCase()}" style="color:#fff;font-size:12px;font-weight:700;letter-spacing:.3px;cursor:pointer;white-space:nowrap;">＋ Add ${singular.toLowerCase()}</span>` : ''}
          <span style="font-family:var(--vault-mono,monospace);font-size:11px;color:var(--mid,#9a9a9a);">${mine.length}</span>
          <span id="notesec-${c.key}-arr" style="color:var(--mid,#9a9a9a);font-size:13px;transition:transform .2s ease;transform:rotate(-90deg);">▼</span>
        </span>
      </button>
      <div id="notesec-${c.key}-body" style="display:none;margin-bottom:16px;">
        ${rows}${addBox}
      </div>`;
  }).join('');

  const cap = document.getElementById('notesCapLine');
  if (cap) cap.textContent = `${total} / ${NOTES_CAP} thoughts`;

  // Grow every textarea to fit its full text so nothing is ever clipped.
  host.querySelectorAll('textarea').forEach(notesAutoGrow);
}

/* "＋ Add …" in a section banner → open the section, reveal + focus its add box. */
export function notesShowAdd(cat) {
  const body = document.getElementById(`notesec-${cat}-body`);
  const arr  = document.getElementById(`notesec-${cat}-arr`);
  if (body && body.style.display === 'none') {
    body.style.display = '';
    if (arr) arr.style.transform = 'rotate(0deg)';
    body.querySelectorAll('textarea').forEach(el => { if (el.style.display !== 'none') notesAutoGrow(el); });
  }
  const add = document.getElementById(`notesadd-${cat}`);
  if (add) { add.style.display = ''; notesAutoGrow(add); add.focus(); }
}

/* Auto-size a textarea to its content height (no scrollbar, no clipping). */
export function notesAutoGrow(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

export function notesToggleSection(key) {
  const body = document.getElementById(key + '-body');
  const arr  = document.getElementById(key + '-arr');
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : '';
  if (arr) arr.style.transform = open ? 'rotate(-90deg)' : 'rotate(0deg)';
  // Now visible → size the textareas (scrollHeight is 0 while hidden).
  if (!open) body.querySelectorAll('textarea').forEach(notesAutoGrow);
}

/* onchange for both existing notes (data-id) and the add box (data-add). */
export function notesSaveField(el) {
  if (!el) return;
  const v = (el.value || '').trim();
  const id = el.getAttribute('data-id');
  const addCat = el.getAttribute('data-add');
  const notes = readNotes();

  if (id) {
    const n = notes.find(x => x.id === id);
    if (n) { n.text = v; _saveNotes(notes); }
    return;   // no re-render needed; text already in the box
  }
  if (addCat) {
    if (!v) return;
    if (notes.length >= NOTES_CAP) { if (typeof toast === 'function') toast(`You've hit the ${NOTES_CAP}-note limit.`, 'info'); return; }
    notes.push({ id: _id(), cat: addCat, text: v, ts: Date.now() });
    _saveNotes(notes);
    // Keep this section open across the re-render.
    const body = document.getElementById(`notesec-${addCat}-body`);
    const wasOpen = body && body.style.display !== 'none';
    renderNotesPage();
    if (wasOpen) { const b = document.getElementById(`notesec-${addCat}-body`), a = document.getElementById(`notesec-${addCat}-arr`); if (b) { b.style.display = ''; b.querySelectorAll('textarea').forEach(notesAutoGrow); } if (a) a.style.transform = 'rotate(0deg)'; }
  }
}

export function notesDelete(id) {
  const notes = readNotes().filter(n => n.id !== id);
  _saveNotes(notes);
  // Also drop it from Daily Focus if it was pinned.
  _saveFavs(_readFavs().filter(f => !(f && f.type === 'note' && f.id === id)));
  renderNotesPage();
  if (typeof window !== 'undefined' && typeof window.renderFavorites === 'function') window.renderFavorites();
}

export function notesToggleFav(id) {
  const note = readNotes().find(n => n.id === id);
  if (!note) return;
  const favs = _readFavs();
  const at = favs.findIndex(f => f && f.type === 'note' && f.id === id);
  let pinned;
  if (at >= 0) { favs.splice(at, 1); pinned = false; if (typeof toast === 'function') toast('Removed from Daily Focus', 'info'); }
  else { favs.push({ type: 'note', id, cat: note.cat, title: note.text, text: note.text }); pinned = true; if (typeof toast === 'function') toast('Pinned to Daily Focus ♥', 'success'); }
  _saveFavs(favs);
  // Update JUST this heart in place — re-rendering would collapse the open section.
  const btn = document.getElementById(`notefav-${id}`);
  if (btn) {
    btn.textContent = pinned ? '♥' : '♡';
    btn.style.opacity = pinned ? '1' : '0.4';
    btn.title = pinned ? 'Unpin from Daily Focus' : 'Pin to Daily Focus';
  }
  if (typeof window !== 'undefined' && typeof window.renderFavorites === 'function') window.renderFavorites();
}
