import { esc, toast, intentions, goalLetter } from '../app.js';

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
  { key: 'note',        label: 'Notes',        icon: '📝', ph: 'A note…' },
];
const CAT_LABEL = Object.fromEntries(NOTE_CATS.map(c => [c.key, c.label]));

/* Photo set for the affirmation split-cards (images/50-50/). Cycled by index. */
const AFF_IMAGES = ["[000] 1010.jpg","[000] 1020.jpg","[000] 1030.jpg","[000] 1040.jpg","[000] 1060.jpg","[000] 1070.jpg","[000] 1080.jpg","[000] 1090.jpg","[000] 1100.jpg","[000] 1160.jpg","[000] 1170.jpg","[000] 1180.jpg","[000] 1200.jpg","[000] 1210.jpg","[000] 1230.jpg","[000] 1270.jpg","[000] 1280.jpg","[000] 1290.jpg","[000] 1300.jpg","[000] 1330.jpg","[000] 1340.jpg","[000] 1350.jpg","[000] 1370.jpg","[000] 1380.jpg","[000] 1390.jpg","[000] 1410.jpg","[000] 1420.jpg","[000] 1450.jpg","[000] 1460.jpg","[000] 1500.jpg","[000] 1510.jpg","[000] 1550.jpg","[000] 1560.jpg","[000] 1570.jpg","[000] 1660.jpg","[000] 1670.jpg","[000] 1690.jpg","[000] 1710.jpg","[000] 1720.jpg","[000] 1730.jpg","[000] 1740.jpg","[000] 1750.jpg","[000] 1760.jpg","[000] 1770.jpg","[000] 1880.jpg","[000] 1940.jpg","[000] 1950.jpg","[000] 1980.jpg","[000] 1990.jpg","[000] 2000.jpg","[000] 2010.jpg","[000] 2040.jpg","[000] 2170.jpg","[000] 2230.jpg","[000] 2260.jpg","[000] 2300.jpg","[000] 2330.jpg","[000] 2340.jpg","[000] 2490.jpg","[000] 2500.jpg","[000] 2510.jpg","[000] 2560.jpg","[000] 2580.jpg","[000] 480.jpg","[000] 570.jpg","[000] 580.jpg","[000] 670.jpg","[000] 690.jpg","[000] 700.jpg","[000] 710.jpg","[000] 720.jpg","[000] 740.jpg","[000] 810.jpg","[000] 830.jpg","[000] 840.jpg","[000] 940.jpg","[000] 950.jpg","[000] 970.jpg","[000] 990.jpg"];

/* Affirmation split-card: "I AM" + editable text on the left, a 50-50 image on
   the right, maroon frame. Text stays editable (same save/delete as other notes). */
function _affCard(n, i, ph) {
  const img = 'images/50-50/' + encodeURIComponent(AFF_IMAGES[i % AFF_IMAGES.length]);
  return `<div class="aff-card">
    <button class="aff-card__x" onclick="notesDelete('${n.id}')" title="Delete">&times;</button>
    <div class="aff-card__text">
      <div class="aff-card__iam">I AM</div>
      <textarea class="aff-card__body" data-id="${n.id}" onchange="notesSaveField(this)" oninput="notesAutoGrow(this)" placeholder="${esc(ph)}">${esc(n.text || '')}</textarea>
    </div>
    <div class="aff-card__img" style="background-image:url('${img}')"></div>
  </div>`;
}

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

/* Pick a random note (optionally within a category) — returns a note
   object or null. Kept for ad-hoc callers; the on-page surfacing uses the
   daily-stable dailyNote() below instead. */
export function randomNote(cat) {
  const pool = readNotes().filter(n => n && n.text && (!cat || n.cat === cat));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* Cheap deterministic string hash + a per-day key. Together they let a slot
   show the SAME thought all day and a DIFFERENT one tomorrow (or when the
   pool changes), without any storage. */
function _hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function _todayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

/* Daily-stable pick: the same (cat, slotKey) resolves to one thought for the
   whole day, rotating tomorrow. Different slots get different thoughts because
   slotKey feeds the seed. Returns a note object or null. */
export function dailyNote(cat, slotKey) {
  const pool = readNotes().filter(n => n && n.text && (!cat || n.cat === cat));
  if (!pool.length) return null;
  const idx = _hash(_todayKey() + '|' + (cat || '') + '|' + (slotKey || '')) % pool.length;
  return pool[idx];
}

/* Small black circle with a white "C" — an edit button that surfaces on any
   thought displayed around the site. Tapping it jumps to where that thought is
   edited (the My Thoughts page). dest: 'welcome' → the My Citadel Welcome
   editor; a category key (affirmation/belief/…) → that section. The host element
   MUST be position:relative for the absolute badge to anchor to its corner. */
export function editBadge(dest) {
  return `<button onclick="ciEditThought('${dest || ''}');event.stopPropagation();return false;" title="Edit this on My Thoughts" aria-label="Edit this thought" class="ci-edit-badge">C</button>`;
}
export function ciEditThought(dest) {
  try { const go = window.navTo || window.showPage; if (go) go('notes'); } catch (e) {}
  // Let the My Thoughts page render, then scroll to + highlight the exact edit spot.
  setTimeout(() => {
    let target = null;
    if (dest === 'welcome') target = document.getElementById('citadelWelcomeInput');
    else if (dest) target = document.getElementById('notesec-' + dest);
    if (!target) target = document.getElementById('notesSections');
    if (!target) return;
    try { target.scrollIntoView({ behavior: 'smooth', block: dest === 'welcome' ? 'center' : 'start' }); } catch (e) {}
    if (dest === 'welcome' && typeof target.focus === 'function') { try { target.focus(); } catch (e) {} }
    _flashEditing(target);
  }, 160);
}
/* Thick yellow border on the thought section (or welcome field) being edited,
   so it's obvious what you're editing. Clears any previous highlight first. */
function _flashEditing(el) {
  document.querySelectorAll('.ci-editing-highlight').forEach(x => x.classList.remove('ci-editing-highlight'));
  void el.offsetWidth;   // reflow so the pulse restarts if the same target is re-picked
  el.classList.add('ci-editing-highlight');
}

/* Fill every [data-random-note] slot on the page with a thought that stays
   fixed for the day (see dailyNote). The attribute value optionally restricts
   to a category (''=any); data-note-key gives the slot a stable identity so
   two slots don't show the same thought. Empty slots (no matching thoughts)
   hide themselves. Called on each page nav so the right thoughts appear as the
   user moves around the site. */
/* Owned image set the thought cards rotate through (images/50-50/). Swap this
   folder/list to point at the full ~300-image library when it's in the repo. */
const CARD_IMG_DIR = 'images/50-50/';
const CAT_LABELS = { affirmation: 'AFFIRMATION', belief: 'BELIEF', reminder: 'REMINDER', inspiration: 'INSPIRATION', quote: 'QUOTE', note: 'NOTE' };
function _thoughtImg(seed) {
  return CARD_IMG_DIR + encodeURIComponent(AFF_IMAGES[Math.abs(seed) % AFF_IMAGES.length]);
}
/* Dominant color of an image — ported from players/art-frame.html: downscale to
   canvas, bucket colors (skip near white/black), average the most-populous. */
function _dominantRGB(img) {
  const c = document.createElement('canvas'), W = c.width = 80, H = c.height = 80, ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data, buckets = {};
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
    if (a < 200) continue;
    if (r > 235 && g > 235 && b > 235) continue;   // skip near-white
    if (r < 22 && g < 22 && b < 22) continue;       // skip near-black
    const k = (r >> 4) + '-' + (g >> 4) + '-' + (b >> 4);
    (buckets[k] || (buckets[k] = { n: 0, r: 0, g: 0, b: 0 }));
    const o = buckets[k]; o.n++; o.r += r; o.g += g; o.b += b;
  }
  let best = null; for (const k in buckets) { if (!best || buckets[k].n > best.n) best = buckets[k]; }
  if (!best) return null;
  return { r: Math.round(best.r / best.n), g: Math.round(best.g / best.n), b: Math.round(best.b / best.n) };
}
/* Set the card border to a darker VARIANT of the image's primary color. */
function _applyDominantBorder(cardEl, url) {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = _dominantRGB(img);
        if (!c) return;
        const f = 0.78;   // darken ~22% so the frame reads as a deep variant of the primary
        cardEl.style.borderColor = `rgb(${Math.round(c.r * f)},${Math.round(c.g * f)},${Math.round(c.b * f)})`;
      } catch (e) {}
    };
    img.src = url;
  } catch (e) {}
}
function _thoughtCard(n, cat, imgUrl) {
  const label = CAT_LABELS[cat] || 'THOUGHT';
  return `<div class="thought-card">
    <div class="thought-card__text">
      <div class="thought-card__label">${esc(label)}</div>
      <div class="thought-card__body">${esc(n.text)}</div>
    </div>
    <div class="thought-card__img" style="background-image:url('${imgUrl}')"></div>
    ${editBadge(cat || '')}
  </div>`;
}

export function sprinkleNotes() {
  const slots = document.querySelectorAll('[data-random-note]');
  // Scattered surfacing stays OFF; only explicitly-placed home blocks
  // (data-home-thought) show a rotating thought — now as a photo card.
  slots.forEach((el, i) => {
    if (!el.hasAttribute('data-home-thought')) { el.style.display = 'none'; return; }
    const cat = el.getAttribute('data-random-note') || '';
    const key = el.getAttribute('data-note-key') || String(i);
    const n = dailyNote(cat, key);
    if (!n) { el.style.display = 'none'; return; }
    const thoughtCat = n.cat || cat || '';
    el.style.display = '';
    el.classList.remove('redblob-note');
    // The card carries its own frame — clear the slot's own chrome.
    el.style.background = 'none';
    el.style.border = 'none';
    el.style.padding = '0';
    el.style.minHeight = '0';
    el.style.position = 'relative';
    const imgUrl = _thoughtImg(_hash(key + '|' + (n.text || '')));
    el.innerHTML = _thoughtCard(n, thoughtCat, imgUrl);
    const card = el.querySelector('.thought-card');
    if (card) _applyDominantBorder(card, imgUrl);
  });
}

/* ── page render ─────────────────────────────────────────────── */
export function renderNotesPage(cats, hostId, capId) {
  const host = document.getElementById(hostId || 'notesSections');
  if (!host) return;
  const catList = cats || NOTE_CATS.filter(c => c.key !== 'note');   // My Thoughts = everything except Notes (its own page now)
  const notes = readNotes();
  const total = notes.length;

  // Section-header colors, borrowed from the goal-card palette.
  const NOTE_HDR = {
    affirmation:{ bg:'#E8B923', fg:'#1a1a1a', add:'#8a6d16' },  // yellow → dark mustard/brown
    belief:     { bg:'#2B6CB0', fg:'#ffffff', add:'#1c4a7d' },  // blue
    reminder:   { bg:'#4C9A2A', fg:'#ffffff', add:'#356c1d' },  // green
    inspiration:{ bg:'#E8743B', fg:'#ffffff', add:'#a84e22' },  // orange
    quote:      { bg:'#E0102B', fg:'#ffffff', add:'#960b1d' },  // red
    note:       { bg:'#141414', fg:'#ffffff', add:'#000000' },  // dark grey
  };

  host.innerHTML = `<div style="display:grid;grid-template-columns:1fr;gap:14px;">` + catList.map(c => {
    const mine = notes.filter(n => n.cat === c.key)
      .sort((a, b) => (a.text || '').localeCompare(b.text || '', undefined, { sensitivity: 'base' }));
    const singular = esc(c.label.replace(/s$/, ''));   // "Reminders" → "Reminder"
    // NOTES entries can be linked to one of the user's goals; that note then
    // surfaces on the goal's Visualize page. Other thought types are unchanged.
    const isNoteCat = c.key === 'note';
    const hd = NOTE_HDR[c.key] || { bg:'#1f1f1f', fg:'#ffffff' };
    const rows = c.key === 'affirmation'
      ? `<div class="aff-grid">${mine.map((n, i) => _affCard(n, i, c.ph)).join('')}</div>`
      : mine.map(n => {
      const goalSel = isNoteCat ? `
        <select onchange="notesSaveGoal('${n.id}',this.value)" title="Associate this note with a goal"
          style="width:100%;box-sizing:border-box;margin-top:6px;padding:9px 11px;border:none;border-radius:9px;font-size:13px;color:#1a1a1a;background:#fff;cursor:pointer;">
          <option value="">— Link to a goal —</option>
          ${intentions.map((g, i) => `<option value="${g.id}"${n.goal === g.id ? ' selected' : ''}>${esc(goalLetter(g, i) + ' · ' + (g.title || '').replace(/^i am\s+/i, ''))}</option>`).join('')}
        </select>` : '';
      return `
      <div style="margin-bottom:${isNoteCat ? '14' : '10'}px;position:relative;">
        <textarea data-id="${n.id}" onchange="notesSaveField(this)" oninput="notesAutoGrow(this)" placeholder="${esc(c.ph)}"
          style="width:100%;box-sizing:border-box;padding:13px 48px 13px 15px;border:1px solid #e3e7ec;border-radius:10px;font-size:14px;line-height:1.55;color:#26364b;background:#f4f6f8;min-height:44px;overflow:hidden;resize:none;">${esc(n.text || '')}</textarea>
        <button onclick="notesDelete('${n.id}')" title="Delete"
          style="position:absolute;top:8px;right:8px;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:#000;border:none;cursor:pointer;font-size:15px;line-height:1;padding:0;color:#fff;">✕</button>
        ${goalSel}
      </div>`;
    }).join('');

    // Hidden until the user taps "＋ Add …" in the banner.
    const addBox = total < NOTES_CAP ? `
      <textarea id="notesadd-${c.key}" data-add="${c.key}" onchange="notesSaveField(this)" oninput="notesAutoGrow(this)" placeholder="＋"
        style="display:none;width:100%;box-sizing:border-box;padding:12px 14px;border:4px solid #000;border-radius:10px;font-size:18px;font-weight:800;line-height:1.4;color:#1a1a1a;background:#fff;min-height:46px;overflow:hidden;resize:none;"></textarea>` : '';

    return `
      <div id="notesec-${c.key}"><button onclick="notesToggleSection('notesec-${c.key}')"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;background:${hd.bg};border:1px solid rgba(0,0,0,.25);border-radius:10px;padding:14px 18px;cursor:pointer;margin-bottom:10px;">
        <span style="font-weight:800;font-size:15px;letter-spacing:.5px;color:${hd.fg};text-transform:uppercase;">${esc(c.label)}</span>
        <span style="display:flex;align-items:center;gap:12px;">
          ${total < NOTES_CAP ? `<span onclick="event.stopPropagation();notesShowAdd('${c.key}')" title="Add a ${singular.toLowerCase()}" style="flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:${hd.add};color:#fff;font-size:17px;font-weight:800;line-height:1;cursor:pointer;">＋</span>` : ''}
          <span style="font-family:var(--vault-mono,monospace);font-size:11px;color:${hd.fg};opacity:.75;">${mine.length}</span>
          <span id="notesec-${c.key}-arr" style="color:${hd.fg};opacity:.85;font-size:13px;transition:transform .2s ease;transform:rotate(0deg);">▼</span>
        </span>
      </button>
      <div id="notesec-${c.key}-body" style="display:block;margin-bottom:16px;">
        ${rows}${addBox}
      </div></div>`;
  }).join('') + `</div>`;

  const cap = document.getElementById(capId || 'notesCapLine');
  if (cap) cap.textContent = `${total} / ${NOTES_CAP} thoughts`;

  // Grow every textarea to fit its full text so nothing is ever clipped. Re-run
  // after webfonts load + a short delay, since the text reflows taller once the
  // real font swaps in (otherwise multi-line notes get clipped).
  const _grow = () => host.querySelectorAll('textarea').forEach(notesAutoGrow);
  _grow();
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) document.fonts.ready.then(_grow);
  setTimeout(_grow, 300);
}

/* My Notes — the standalone page for just the Notes category (goal-linkable). */
export function renderMyNotesPage() {
  renderNotesPage(NOTE_CATS.filter(c => c.key === 'note'), 'myNotesSections', 'myNotesCap');
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

/* Quick-add panel at the top of My Thoughts: one input per category (A-Z),
   toggled by the "＋ ADD A THOUGHT" button, so you can add to any bucket fast. */
export function notesToggleQuickAdd(targetId) {
  const box = document.getElementById(typeof targetId === 'string' ? targetId : 'notesQuickAdd');
  if (!box) return;
  if (box.style.display !== 'none') { box.style.display = 'none'; return; }   // hide if open
  if (box.dataset.built !== '1') {
    const cats = [...NOTE_CATS].sort((a, b) => a.label.localeCompare(b.label));   // A–Z
    box.innerHTML =
      `<div style="background:#1f1f1f;border:1px solid var(--border,#333);border-radius:10px;padding:14px 16px;margin:0 0 18px;">` +
        `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;">` +
          `<span style="font-weight:800;font-size:13px;letter-spacing:.5px;color:#fff;text-transform:uppercase;">Quick add a thought</span>` +
          `<button onclick="navTo('notes')" title="Open My Thoughts" style="flex-shrink:0;background:#e0102b;border:none;color:#fff;font-weight:800;font-size:11px;letter-spacing:.3px;padding:7px 12px;border-radius:7px;cursor:pointer;white-space:nowrap;">My Thoughts &rarr;</button>` +
        `</div>` +
        cats.map(c => `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="width:118px;flex-shrink:0;font-weight:800;font-size:12px;text-transform:uppercase;color:#fff;letter-spacing:.5px;">${esc(c.label)}</span>
            <input type="text" data-add="${c.key}" placeholder="${esc(c.ph)}" onkeydown="if(event.key==='Enter'){event.preventDefault();notesQuickAddSave(this);}"
              style="flex:1;min-width:0;box-sizing:border-box;padding:9px 11px;border:none;border-radius:7px;font-size:14px;color:#1a1a1a;background:#fff;">
            <button onclick="notesQuickAddSave(this.parentElement.querySelector('input'))" style="flex-shrink:0;background:#e0102b;border:none;border-radius:7px;color:#fff;font-weight:800;font-size:12px;padding:9px 16px;cursor:pointer;">Add</button>
          </div>`).join('') +
      `</div>`;
    box.dataset.built = '1';
  }
  box.style.display = '';
  const first = box.querySelector('input'); if (first) first.focus();
}

/* Add from a quick-add input (its data-add carries the category), then clear +
   refocus so you can rattle off several in a row. */
export function notesQuickAddSave(el) {
  if (!el || !(el.value || '').trim()) return;
  notesSaveField(el);   // data-add present → pushes the note + re-renders #notesSections
  el.value = '';
  el.focus();
}

/* Link (or unlink) a note to a goal. Stored on the note; the goal's Visualize
   page reads it back to show "Notes for this goal". No re-render needed —
   the <select> already reflects the new value. */
export function notesSaveGoal(id, goalId) {
  const notes = readNotes();
  const n = notes.find(x => x.id === id);
  if (!n) return;
  if (goalId) n.goal = goalId; else delete n.goal;
  _saveNotes(notes);
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
  if (at >= 0) { favs.splice(at, 1); pinned = false; if (typeof toast === 'function') toast('Removed from My Favorites Autoplay', 'info'); }
  else { favs.push({ type: 'note', id, cat: note.cat, title: note.text, text: note.text }); pinned = true; if (typeof toast === 'function') toast('Pinned to My Favorites Autoplay ♥', 'success'); }
  _saveFavs(favs);
  // Update JUST this heart in place — re-rendering would collapse the open section.
  const btn = document.getElementById(`notefav-${id}`);
  if (btn) {
    btn.textContent = pinned ? '♥' : '♡';
    btn.style.opacity = pinned ? '1' : '0.4';
    btn.title = pinned ? 'Unpin from My Favorites Autoplay' : 'Pin to My Favorites Autoplay';
  }
  if (typeof window !== 'undefined' && typeof window.renderFavorites === 'function') window.renderFavorites();
}
