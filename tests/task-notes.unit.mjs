import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

const storage = new Map();
let failSave = false;
let syncs = 0;
const editors = [];
const host = { innerHTML: '' };
const count = { textContent: '' };
const escape = s => String(s || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const context = vm.createContext({
  console, crypto: webcrypto, setTimeout,
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => { if (failSave) throw Error('full'); storage.set(key, value); },
  },
  window: { addEventListener() {} },
  document: {
    querySelectorAll: () => editors,
    getElementById: id => id === 'taskNotesList' ? host : id === 'taskNotesCount' ? count : null,
  },
});
const exports = { esc: escape, toast() {}, intentions: [], goalLetter: () => 'A',
  syncNotesToSupabase: () => { syncs++; }, syncFavoritesToSupabase() {} };
const app = new vm.SyntheticModule(Object.keys(exports), function () {
  Object.entries(exports).forEach(([key, value]) => this.setExport(key, value));
}, { context });
const notes = new vm.SourceTextModule(await readFile('shared/notes.js', 'utf8'), { context });
await notes.link(() => app);
await notes.evaluate();
async function loadTaskNotes() {
  const m = new vm.SourceTextModule(await readFile('shared/task-notes.js', 'utf8'), { context });
  await m.link(spec => spec.includes('notes.js') ? notes : app);
  await m.evaluate();
  return m.namespace;
}
const task = await loadTaskNotes();
function editor(ctx, text) {
  const status = { textContent: '' };
  const textarea = { value: text, focus() {} };
  const el = {
    dataset: { taskContext: JSON.stringify(ctx), taskKey: task.taskNoteKey(ctx), dirty: 'true' },
    querySelector: selector => selector === 'textarea' ? textarea : status,
    closest: selector => selector === '.task-note-editor' ? el : null,
  };
  textarea.closest = () => el;
  editors.push(el);
  return { el, textarea, status };
}
const goal = { id: 'goal-1', title: 'Sample goal' };
const mine = task.taskNoteContext(goal, 'my', 'task-1', 'A1', 'My action');
const road = task.taskNoteContext(goal, 'roadmap', '[1,"Roadmap task"]', 'A1', 'Roadmap task');
const first = editor(mine, 'First task note');
assert.equal(task.taskNoteSave(first.el), true);
assert.equal(first.status.textContent, 'Saved');
assert.equal(count.textContent, '1 note');
first.textarea.value = 'Updated task note';
assert.equal(task.taskNoteSave(first.el), true);
assert.equal(notes.namespace.readNotes().length, 1, 'editing must update the existing note');
assert.equal(task.taskNoteSave(editor(road, 'Roadmap note').el), true);
assert.equal(task.taskNoteSave(editor(task.taskNoteContext({ ...goal, id: 'goal-2' }, 'my', 'task-1', 'A1', 'Another task'), 'Second goal note').el), true);
assert.equal(notes.namespace.readNotes().length, 3, 'goals and task kinds must stay separate');
assert.equal(task.taskNoteKey(mine), task.taskNoteKey({ ...mine, code: 'A9', taskText: 'Edited task' }), 'stable task identity survives task edits and reordering');
const fresh = await loadTaskNotes();
assert.match(fresh.taskNotePanel(mine), /Updated task note/, 'note survives reopening the module');
fresh.renderTaskNotesList();
assert.match(host.innerHTML, /Updated task note/);
assert.match(host.innerHTML, /Roadmap note/);
assert.match(host.innerHTML, /Second goal note/);
assert.equal(count.textContent, '3 notes');
assert.equal(notes.namespace.randomNote(), null, 'task notes never appear as random thoughts');
assert.equal(notes.namespace.dailyNote(), null);
assert.match(fresh.taskNotePanel({ ...mine, taskText: '<img src=x onerror=alert(1)>' }), /&lt;img/);
const existingSnapshot = storage.get('ci_notes');
failSave = true;
first.textarea.value = 'Must remain unsaved';
assert.equal(fresh.taskNoteSave(first.el), false);
assert.match(first.status.textContent, /Could not save/);
assert.equal(storage.get('ci_notes'), existingSnapshot, 'failed save preserves existing records');
failSave = false;
const classes = new Set();
const panel = { inert: true, attributes: {}, classList: {
  contains: name => classes.has(name), toggle: (name, value) => value ? classes.add(name) : classes.delete(name),
}, querySelector: () => first.el, setAttribute(name, value) { this.attributes[name] = value; } };
const button = { attributes: {}, closest: () => ({ querySelector: () => panel }), setAttribute(name, value) { this.attributes[name] = value; } };
delete first.el.dataset.dirty;
fresh.taskNoteToggle(button);
assert.equal(panel.inert, false);
assert.equal(button.attributes['aria-expanded'], 'true');
assert.equal(first.textarea.value, 'Updated task note');
fresh.taskNoteToggle(button);
assert.equal(panel.inert, true);
assert.equal(button.attributes['aria-expanded'], 'false');
assert.equal(syncs, 4, 'each successful save reaches the existing sync adapter');
console.log('PASS: create, update, reload, goal/task isolation, master list, escaping, save failure, thought isolation, and editor toggle.');
