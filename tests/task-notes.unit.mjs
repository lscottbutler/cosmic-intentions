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
const goals = [{ id: 'goal-1', title: 'Sample goal' }, { id: 'goal-2', title: 'I am building a garden' }];
const exports = { esc: escape, toast() {}, intentions: goals, goalLetter: (_g, i) => String.fromCharCode(65 + i),
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
  const select = { value: ctx.goalId, innerHTML: '' };
  const el = {
    dataset: { taskContext: JSON.stringify(ctx), taskKey: task.taskNoteKey(ctx), dirty: 'true' },
    querySelector: selector => selector === 'textarea' ? textarea : selector === '.task-note-goal' ? select : status,
    closest: selector => selector === '.task-note-editor' ? el : null,
  };
  textarea.closest = () => el;
  editors.push(el);
  return { el, textarea, select, status };
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

const originalId = notes.namespace.readNotes()[0].id;
const duplicate = editor(mine, 'Updated task note');
delete duplicate.el.dataset.dirty;
first.select.value = 'goal-2';
fresh.taskNoteChanged(first.textarea);
assert.equal(fresh.taskNoteSave(first.el), true);
const linked = notes.namespace.readNotes()[0];
assert.equal(linked.id, originalId, 'relinking must update the original note');
assert.equal(linked.goal, 'goal-2');
assert.equal(linked.task.goalId, 'goal-1', 'source task identity must not move when the linked goal changes');
assert.equal(notes.namespace.readNotes().length, 3, 'relinking must not create a duplicate');
assert.match(duplicate.select.innerHTML, /value="goal-2" selected/);
const reopened = await loadTaskNotes();
assert.match(reopened.taskNotePanel(mine), /value="goal-2" selected>B · building a garden/);
assert.match(host.innerHTML, /class="master-task-note-goal">I am building a garden/);
first.select.value = '';
assert.equal(reopened.taskNoteSave(first.el), true);
assert.equal(notes.namespace.readNotes()[0].goal, '');
assert.match(reopened.taskNotePanel(mine), /value="" selected>— Link to a goal —/);
assert.match(host.innerHTML, /No goal linked/);
// A legacy note without the new field inherits the originating goal.
const legacy = notes.namespace.readNotes();
delete legacy[0].goal;
delete legacy[0].goalTitle;
storage.set('ci_notes', JSON.stringify(legacy));
assert.match(reopened.taskNotePanel(mine), /value="goal-1" selected>A · Sample goal/);
goals.splice(0, 1);
assert.match(reopened.taskNotePanel(mine), /Sample goal \(unavailable\)/);
assert.equal(syncs, 6);
console.log('PASS: persistence, task isolation, master list, safe rendering, storage failure, panel toggle, goal relinking, unlinking, legacy notes, and removed goals.');
