import { esc, intentions, goalLetter, openMasterDestination } from '../app.js';
import { readNotes, _saveNotes, NOTES_CAP } from './notes.js';
import { linkedGoalId, editorHTML, taskNoteKey, taskLinkedEntriesHTML } from './task-notes.js';
import { masterPriorityTaskMarkup, goalWorkspaceTaskMarkup, goalWorkspaceTaskContexts, wrapGoalAddAction } from './wrapup.js';

let selectedGoalId = null;
let initialSelectionRead = false;
// Visit-only drafts survive task check-offs and action-list rerenders. They
// remain separate for each goal, entry type and saved entry.
const roadmapDrafts = new Map();

export function goalWorkspaceRecords(goalId, records = readNotes()) {
  const matches = n => String(n.cat === 'task' ? linkedGoalId(n.task || {}, n) : n.goal || '') === String(goalId);
  const linked = records.filter(n => n && typeof n.text === 'string' && n.text.trim() && matches(n))
    .sort((a, b) => (b.updatedAt || b.ts || 0) - (a.updatedAt || a.ts || 0));
  return {
    notes: linked.filter(n => n.cat === 'goal-note' || (n.cat === 'task' && n.task)),
    journal: linked.filter(n => n.cat === 'note'),
  };
}

export function goalWorkspaceGoals(records = readNotes()) {
  return intentions.map((goal, index) => ({ goal, index })).filter(({ goal }) => {
    const linked = goalWorkspaceRecords(goal.id, records);
    return linked.notes.length > 0 || linked.journal.length > 0;
  });
}

// Writes to the existing note collection: Journal uses its established `note`
// category; independent goal notes are separate from thoughts and task notes.
export function saveGoalWorkspaceRecord({ id, cat, goalId, text, taskKey }) {
  const goal = intentions.find(g => String(g.id) === String(goalId));
  if (!goal) return { error: 'This goal is no longer available.' };
  if (!['goal-note', 'note'].includes(cat)) return { error: 'This entry cannot be saved here.' };
  text = String(text || '').trim();
  if (!text) return { error: 'Write something before saving.' };
  const records = readNotes();
  const existing = id ? records.find(n => n.id === id && n.cat === cat && String(n.goal) === String(goal.id)) : null;
  if (id && !existing) return { error: 'This entry has changed. Reopen the workspace before editing it.' };
  if (!existing && cat === 'note' && records.filter(n => n && !['task', 'goal-note'].includes(n.cat)).length >= NOTES_CAP) {
    return { error: `You've reached the ${NOTES_CAP}-entry Journal and thoughts limit.` };
  }
  const now = Date.now();
  const record = existing || { id: 'goal-entry-' + crypto.randomUUID(), cat, goal: goal.id, ts: now };
  if (taskKey !== undefined) {
    const action = taskKey ? goalWorkspaceTaskContexts(intentions.indexOf(goal)).find(task => taskNoteKey(task) === taskKey) : null;
    if (taskKey && !action && existing?.taskKey !== taskKey) return { error: 'This action is no longer available. Choose another action.' };
    if (action) Object.assign(record, { taskKey, task: action });
    else if (!taskKey) { delete record.taskKey; delete record.task; }
  }
  Object.assign(record, { text, goalTitle: goal.title || '', updatedAt: now });
  if (!existing) records.push(record);
  if (!_saveNotes(records)) return { error: 'Could not save. Your text is still here; please try again.' };
  return { record };
}

export function openGoalWorkspace(goalId) {
  const idx = intentions.findIndex(g => String(g.id) === String(goalId));
  if (goalId != null && idx < 0) return;
  if (window.self !== window.top) {
    window.parent.postMessage({ type: 'ci-open-goal-workspace', goalIndex: idx >= 0 ? idx : null }, location.origin);
  } else openMasterDestination('goal-workspace', idx >= 0 ? idx : null);
}

function selectedGoal() { return intentions.find(g => String(g.id) === selectedGoalId); }
function activeWorkspace() { return document.getElementById('page-goalworkspace')?.classList.contains('active'); }

function actionOptions(note, goalId = selectedGoalId) {
  const actions = goalWorkspaceTaskContexts(intentions.findIndex(g => String(g.id) === String(goalId)));
  const key = note?.taskKey || '';
  const missing = key && !actions.some(task => taskNoteKey(task) === key);
  return `<option value=""${!key ? ' selected' : ''}>Whole goal — no specific action</option>` +
    (missing ? `<option value="${esc(key)}" selected>${esc(note.task?.code || 'Saved action')} (no longer available)</option>` : '') +
    actions.map(task => `<option value="${esc(taskNoteKey(task))}"${taskNoteKey(task) === key ? ' selected' : ''}>${esc((task.kind === 'my' ? 'My Actions' : 'Roadmap') + ' · ' + task.code + ' · ' + task.taskText)}</option>`).join('');
}

function entryForm(cat, note, goalId = selectedGoalId, roadmap = false) {
  const journal = cat === 'note';
  const title = journal ? 'Journal entry' : 'Note';
  const draft = roadmap ? roadmapDrafts.get(JSON.stringify([String(goalId), cat, note?.id || ''])) : null;
  const stamp = note?.ts ? new Date(note.ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  return `<form class="goal-entry-form" data-cat="${cat}" data-entry-id="${esc(note?.id || '')}" data-goal-id="${esc(String(goalId))}"${draft ? ' data-dirty="true"' : ''} onsubmit="event.preventDefault();goalWorkspaceSaveEntry(this)">
    ${stamp ? `<p class="goal-entry-date">${esc(stamp)}</p>` : ''}
    <label>${note ? title : journal ? 'Add a journal entry' : 'Add a note'}<textarea rows="3" maxlength="10000" placeholder="${journal ? 'Reflect on this goal…' : 'Capture a note for this goal…'}" oninput="goalWorkspaceEntryChanged(this)" ${note ? 'onchange="goalWorkspaceSaveEntry(this.form)"' : ''}>${esc(draft?.text ?? note?.text ?? '')}</textarea></label>
    <label class="goal-entry-action-label">Related action<select class="goal-entry-action" onchange="goalWorkspaceEntryChanged(this);${note ? 'goalWorkspaceSaveEntry(this.form)' : ''}">${actionOptions(draft ? { ...note, taskKey: draft.taskKey } : note, goalId)}</select></label>
    <div class="task-note-footer"><span class="task-note-status" role="status">${esc(draft?.status || (note ? 'Saved' : ''))}</span><button type="submit">${note ? 'Save changes' : journal ? 'Save journal entry' : 'Save note'}</button></div>
  </form>`;
}

export function captureRoadmapGoalDrafts() {
  document.querySelectorAll('#page-myroadmap .roadmap-goal-entries .goal-entry-form').forEach(form => {
    const key = JSON.stringify([form.dataset.goalId, form.dataset.cat, form.dataset.entryId || '']);
    if (form.dataset.dirty !== 'true') { roadmapDrafts.delete(key); return; }
    roadmapDrafts.set(key, { text: form.querySelector('textarea').value,
      taskKey: form.querySelector('.goal-entry-action').value,
      status: form.querySelector('.task-note-status').textContent });
  });
}

function roadmapRecordMarkup(record, goalId) {
  return record.cat === 'task' ? `<article class="master-task-note">
    <div class="master-task-note-source"><strong>${esc(record.task.code)}</strong><span>${record.task.kind === 'roadmap' ? 'Roadmap' : 'My Actions'}</span></div>
    <h3>${esc(record.task.taskText)}</h3>${editorHTML(record.task, record)}</article>` : entryForm(record.cat, record, goalId, true);
}

export function roadmapGoalEntriesHTML(goalId) {
  const records = goalWorkspaceRecords(goalId);
  return `<div class="roadmap-goal-entries" data-goal-id="${esc(String(goalId))}">
    <section class="roadmap-goal-section" data-goal-section="notes">
      <h3>Notes <span class="roadmap-entry-count">${records.notes.length}</span></h3>
      <div class="roadmap-goal-records" data-entry-type="notes">${records.notes.map(n => roadmapRecordMarkup(n, goalId)).join('') || '<p class="goal-workspace-empty">No notes for this goal yet.</p>'}</div>
      ${entryForm('goal-note', null, goalId, true)}
    </section>
    <section class="roadmap-goal-section" data-goal-section="journal">
      <h3>Journal <span class="roadmap-entry-count">${records.journal.length}</span></h3>
      <div class="roadmap-goal-records" data-entry-type="journal">${records.journal.map(n => roadmapRecordMarkup(n, goalId)).join('') || '<p class="goal-workspace-empty">No journal entries for this goal yet.</p>'}</div>
      ${entryForm('note', null, goalId, true)}
    </section>
  </div>`;
}

export function refreshRoadmapGoalEntries(source) {
  document.querySelectorAll('#page-myroadmap .roadmap-goal-entries').forEach(goal => {
    const records = goalWorkspaceRecords(goal.dataset.goalId);
    for (const type of ['notes', 'journal']) {
      const section = goal.querySelector(`[data-goal-section="${type}"]`);
      section.querySelector('.roadmap-entry-count').textContent = String(records[type].length);
      const host = section.querySelector('.roadmap-goal-records');
      if (host.contains(source) || host.querySelector('[data-dirty="true"]')) continue;
      host.innerHTML = records[type].map(n => roadmapRecordMarkup(n, goal.dataset.goalId)).join('') ||
        `<p class="goal-workspace-empty">No ${type === 'notes' ? 'notes' : 'journal entries'} for this goal yet.</p>`;
    }
  });
}

export function goalWorkspaceEntryChanged(input) {
  input.form.dataset.dirty = 'true';
  input.form.querySelector('.task-note-status').textContent = 'Unsaved changes';
}

export function goalWorkspaceSaveEntry(form) {
  const { record, error } = saveGoalWorkspaceRecord({ id: form.dataset.entryId, cat: form.dataset.cat,
    goalId: form.dataset.goalId, text: form.querySelector('textarea').value,
    taskKey: form.querySelector('.goal-entry-action').value });
  const status = form.querySelector('.task-note-status');
  if (error) { status.textContent = error; return false; }
  delete form.dataset.dirty;
  roadmapDrafts.delete(JSON.stringify([form.dataset.goalId, form.dataset.cat, form.dataset.entryId || '']));
  status.textContent = 'Saved';
  if (!form.dataset.entryId) {
    form.querySelector('textarea').value = '';
    form.querySelector('.goal-entry-action').value = '';
    renderGoalWorkspaceNotes();
  }
  refreshGoalActionEntries();
  refreshRoadmapGoalEntries();
  window.renderTaskNotesList?.();
  return !!record;
}

function savePendingEntries(root = '#page-goalworkspace') {
  for (const form of document.querySelectorAll(`${root} .goal-entry-form[data-dirty="true"]`)) {
    if (!goalWorkspaceSaveEntry(form)) return false;
  }
  for (const editor of document.querySelectorAll(`${root} .task-note-editor[data-dirty="true"]`)) {
    if (!window.taskNoteSave(editor)) return false;
  }
  return true;
}

export function goalWorkspaceSelect(select) {
  if (!savePendingEntries()) { select.value = selectedGoalId || ''; return; }
  selectedGoalId = select.value;
  renderGoalWorkspace();
}

export function renderGoalWorkspace() {
  if (!activeWorkspace()) return;
  renderMasterPriorities();
}

function renderMasterPriorities() {
  if (!activeWorkspace()) return;
  let host = document.getElementById('masterPriorityTasks');
  if (!host) {
    host = document.createElement('section'); host.id = 'masterPriorityTasks';
    host.className = 'goal-workspace-section';
    const selector = document.querySelector('.goal-workspace-selector');
    selector.before(host);
    const other = document.createElement('section');
    other.id = 'otherTodoTasks'; other.className = 'goal-workspace-section';
    host.after(other);
    selector.hidden = true;
    document.getElementById('goalWorkspaceEmpty').style.display = 'none';
    document.getElementById('goalWorkspaceContent').style.display = 'none';
  }
  const rows = masterPriorityTaskMarkup();
  document.getElementById('otherTodoTasks').innerHTML = '<h2 style="justify-content:center;text-align:center">TO-DO</h2>' + (masterPriorityTaskMarkup(false) || '<p class="goal-workspace-empty">No other unfinished tasks.</p>');
  host.innerHTML = '<h2 style="background:#000;color:white;justify-content:center;text-align:center;width:max-content;min-width:33.333%;max-width:100%;margin-inline:auto;padding-inline:20px;box-sizing:border-box">PRIORITY TO DO LIST</h2>' + (rows || '<p class="goal-workspace-empty">No priority tasks yet. Mark a task with the purple P to get started.</p>');
  document.querySelectorAll('#masterPriorityTasks .task-note-pencil, #otherTodoTasks .task-note-pencil').forEach(button => button.remove());
}

export function renderGoalWorkspaceTasks() {
  renderMasterPriorities();
  if (!activeWorkspace() || !selectedGoal()) return;
  const idx = intentions.findIndex(g => String(g.id) === selectedGoalId);
  const tasks = goalWorkspaceTaskMarkup(idx);
  document.getElementById('goalWorkspaceMyTasks').innerHTML = tasks.my || '<p class="goal-workspace-empty">No to-dos yet. Add your first action below.</p>';
  document.getElementById('goalWorkspaceRoadmapTasks').innerHTML = tasks.roadmap || '<p class="goal-workspace-empty">No Roadmap tasks for this goal yet.</p>';
  document.getElementById('goalWorkspaceTaskCount').textContent = `${tasks.done}/${tasks.total} done`;
}

export function goalWorkspaceAddTask(form) {
  if (!selectedGoal()) return;
  const input = form.querySelector('input');
  const idx = intentions.findIndex(g => String(g.id) === selectedGoalId);
  wrapGoalAddAction(idx, input);
}

export function renderGoalWorkspaceNotes(source) {
  refreshRoadmapGoalEntries(source);
  if (!activeWorkspace()) return;
  refreshGoalActionEntries();
  const eligibleGoals = goalWorkspaceGoals();
  const select = document.getElementById('goalWorkspaceSelect');
  // Refresh membership after relinking/deleting a note, while retaining any
  // unsaved text until the member saves it or changes their selection.
  select.innerHTML = '<option value="">— Choose a goal —</option>' + eligibleGoals.map(({ goal: g, index }) =>
    `<option value="${esc(String(g.id))}">${esc(goalLetter(g, index) + ' · ' + (g.title || 'Untitled goal'))}</option>`).join('');
  select.disabled = !eligibleGoals.length;
  select.value = eligibleGoals.some(({ goal }) => String(goal.id) === selectedGoalId) ? selectedGoalId : '';
  if (!select.value && !document.querySelector('#page-goalworkspace [data-dirty="true"]')) {
    selectedGoalId = null;
    renderGoalWorkspace();
    return;
  }
  if (!selectedGoal()) return;
  const records = goalWorkspaceRecords(selectedGoalId);
  const host = document.getElementById('goalWorkspaceNotes');
  // Keep an editor stable while it is being edited. If its goal changes,
  // remove only that card, preserving other notes still being typed.
  if (source?.closest('#goalWorkspaceNotes') && !records.notes.some(n => n.taskKey === source.dataset.taskKey)) {
    source.closest('.master-task-note')?.remove();
    if (!records.notes.length) host.innerHTML = '<p class="goal-workspace-empty">No notes linked to this goal yet.</p>';
  }
  if (!source?.closest('#goalWorkspaceNotes') && !host.querySelector('[data-dirty="true"]')) {
    host.innerHTML = records.notes.length ? records.notes.map(n => n.cat === 'task' ? `<article class="master-task-note">
      <div class="master-task-note-source"><strong>${esc(n.task.code)}</strong><span>${n.task.kind === 'roadmap' ? 'Roadmap' : 'My Actions'}</span></div>
      <h3>${esc(n.task.taskText)}</h3>${editorHTML(n.task, n)}</article>` : entryForm('goal-note', n)).join('') : '<p class="goal-workspace-empty">No notes linked to this goal yet.</p>';
  }
  const journal = document.getElementById('goalWorkspaceJournal');
  if (!journal.querySelector('[data-dirty="true"]')) {
    journal.innerHTML = records.journal.length ? records.journal.map(n => entryForm('note', n)).join('') : '<p class="goal-workspace-empty">No journal entries linked to this goal yet.</p>';
  }
  document.getElementById('goalWorkspaceNoteCount').textContent = String(records.notes.length);
  document.getElementById('goalWorkspaceJournalCount').textContent = String(records.journal.length);
}

function refreshGoalActionEntries() {
  const records = readNotes();
  document.querySelectorAll('#page-goalworkspace .goal-action-records').forEach(host => {
    host.innerHTML = taskLinkedEntriesHTML(JSON.parse(host.dataset.taskContext), records);
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (activeWorkspace()) savePendingEntries();
    else if (document.getElementById('page-myroadmap')?.classList.contains('active')) savePendingEntries('#page-myroadmap');
  });
  window.addEventListener('storage', event => {
    if (event.key === 'ci_notes') renderGoalWorkspaceNotes();
  });
}
