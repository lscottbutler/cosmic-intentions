import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

const storage = new Map();
let failSave = false, syncs = 0, taskSaves = 0;
const intentions = [
  { id: 'g1', title: 'Build a garden', roadmapAI: { intention: 'Build a garden', userTasks: [{ id: 1, text: 'Find seeds', done: false, code: 1, children: [{ id: 2, text: 'Compare seeds', done: true, code: 1 }] }], tasks: ['Prepare soil'], done: { 0: true }, codes: { 0: 1 }, _myV2: true, _rmV2: true } },
  { id: 'g2', title: 'Learn guitar', roadmapAI: { userTasks: [], tasks: [] } },
];
const context = vm.createContext({ console, crypto: webcrypto, URLSearchParams, setTimeout, clearTimeout,
  location: { search: '?masterInline=goal-workspace&goal=1', origin: 'https://example.test' },
  localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => { if (failSave) throw Error('full'); storage.set(k, v); } },
  window: { addEventListener() {} },
  document: { getElementById: () => null, querySelectorAll: () => [], addEventListener() {} },
});
function synthetic(exports) {
  return new vm.SyntheticModule(Object.keys(exports), function () { for (const [k, v] of Object.entries(exports)) this.setExport(k, v); }, { context });
}
const app = synthetic({
  intentions, currentUser: null, esc: s => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'),
  goalLetter: (_g, i) => String.fromCharCode(65 + i), openMasterDestination() {}, toast() {}, buildContext() {}, getPB: () => ({}),
  goalBadge: () => '', goalCase: s => s, GREY_SHADES: [{ bg: '#eee', text: '#111' }], GOAL_COLORS: [{ bg: '#f00', text: '#fff' }],
  saveIntentions: () => { taskSaves++; }, dayKey: () => '2026-09-24',
  LS: { get: k => JSON.parse(storage.get(k) || 'null'), set: (k, v) => storage.set(k, JSON.stringify(v)), remove: k => storage.delete(k) },
  syncNotesToSupabase: () => { syncs++; }, syncFavoritesToSupabase() {},
});
const modules = new Map([['app.js', app], ['rings.js', synthetic({ ringsSummary() {}, ringsWeekSummary() {}, currentTier() {} })],
  ['card-builder.js', synthetic({ renderPBIntentionList() {} })], ['wins.js', synthetic({ setTaskWin() {} })]]);
for (const file of ['notes.js', 'task-notes.js', 'wrapup.js', 'goal-workspace.js']) {
  modules.set(file, new vm.SourceTextModule(await readFile('shared/' + file, 'utf8'), { context }));
}
const module = modules.get('goal-workspace.js');
await module.link(spec => modules.get(spec.split('/').at(-1)));
await module.evaluate();
const workspace = module.namespace;
const notes = modules.get('notes.js').namespace;
const wrap = modules.get('wrapup.js').namespace;
const seed = [
  { id: 'legacy', cat: 'task', task: { goalId: 'g1' }, text: 'Legacy task note' },
  { id: 'relinked', cat: 'task', task: { goalId: 'g1' }, goal: 'g2', text: 'Relinked note' },
  { id: 'unlinked', cat: 'task', task: { goalId: 'g1' }, goal: '', text: 'Unlinked note' },
  { id: 'journal1', cat: 'note', goal: 'g1', text: 'Garden reflection', ts: 1 },
  { id: 'journal2', cat: 'note', goal: 'g2', text: 'Guitar reflection', ts: 2 },
  { id: 'affirmation', cat: 'affirmation', goal: 'g1', text: 'A thought' },
];
storage.set('ci_notes', JSON.stringify(seed));
assert.deepEqual(Array.from(workspace.goalWorkspaceRecords('g1').notes, n => n.id), ['legacy']);
assert.deepEqual(Array.from(workspace.goalWorkspaceRecords('g1').journal, n => n.id), ['journal1']);
assert.deepEqual(Array.from(workspace.goalWorkspaceRecords('g2').notes, n => n.id), ['relinked']);
const added = workspace.saveGoalWorkspaceRecord({ cat: 'goal-note', goalId: 'g1', text: 'Buy a watering can' });
assert.ok(added.record.id);
assert.equal(added.record.goal, 'g1');
assert.equal(workspace.goalWorkspaceRecords('g1').notes.length, 2);
const journal = workspace.saveGoalWorkspaceRecord({ cat: 'note', goalId: 'g1', text: 'Today I planted seeds.' });
assert.equal(journal.record.cat, 'note', 'new Journal entries use the existing Journal category');
const beforeEdit = notes.readNotes().length;
workspace.saveGoalWorkspaceRecord({ id: 'journal1', cat: 'note', goalId: 'g1', text: 'Updated reflection' });
assert.equal(notes.readNotes().length, beforeEdit, 'editing must update one shared record');
assert.equal(notes.readNotes().find(n => n.id === 'journal1').text, 'Updated reflection');
assert.ok(workspace.saveGoalWorkspaceRecord({ id: 'journal1', cat: 'note', goalId: 'g2', text: 'Wrong goal' }).error);
assert.ok(workspace.saveGoalWorkspaceRecord({ cat: 'goal-note', goalId: 'missing', text: 'Missing goal' }).error);
assert.ok(workspace.saveGoalWorkspaceRecord({ cat: 'task', goalId: 'g1', text: 'Wrong category' }).error);
const snapshot = storage.get('ci_notes');
failSave = true;
assert.ok(workspace.saveGoalWorkspaceRecord({ id: 'journal1', cat: 'note', goalId: 'g1', text: 'Failed save' }).error);
assert.equal(storage.get('ci_notes'), snapshot);
failSave = false;
assert.equal(syncs, 3, 'only successful saves invoke the existing cloud adapter');

const taskMarkup = wrap.goalWorkspaceTaskMarkup(0);
assert.equal(taskMarkup.total, 3);
assert.equal(taskMarkup.done, 2, 'counts include nested tasks and Roadmap completion');
assert.match(taskMarkup.my, /Find seeds/);
assert.match(taskMarkup.my, /Compare seeds/);
assert.match(taskMarkup.roadmap, /Prepare soil/);
assert.match(taskMarkup.my, /toggleRoadmapUserTaskDone\(0,1\)/);
assert.match(taskMarkup.roadmap, /toggleRoadmapTaskDone\(0,0\)/);
assert.match(taskMarkup.my, /Notes for A1/);
const beforeTasks = intentions[0].roadmapAI.userTasks.length;
const input = { value: 'Water the seeds', focus() {} };
wrap.wrapGoalAddAction(0, input);
assert.equal(intentions[0].roadmapAI.userTasks.length, beforeTasks + 1);
assert.equal(intentions[0].roadmapAI.userTasks.at(-1).text, 'Water the seeds');
assert.equal(input.value, '');
assert.ok(taskSaves > 0);
assert.equal(wrap.goalWorkspaceTaskMarkup(1).total, 0, 'tasks must never leak across goals');
intentions[0].roadmapAI.intention = 'Different goal';
assert.equal(wrap.goalWorkspaceTaskMarkup(0).roadmap, '', 'preserve the stale-roadmap guard');

storage.set('ci_notes', JSON.stringify([added.record, seed[0]]));
assert.equal(notes.randomNote(), null, 'private goal notes never surface as random thoughts');
assert.equal(notes.dailyNote(), null);
console.log('PASS: linked-goal isolation, shared Journal records, edit/reload persistence, save failure, task creation/counts, shared toggle wiring, and private-note isolation.');
