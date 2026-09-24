import { esc, intentions, goalLetter, openMasterDestination } from '../app.js';
import { readNotes, _saveNotes, NOTES_CAP } from './notes.js';
import { linkedGoalId, editorHTML } from './task-notes.js';
import { goalWorkspaceTaskMarkup, wrapGoalAddAction } from './wrapup.js';

let selectedGoalId = null;
let initialSelectionRead = false;

export function goalWorkspaceRecords(goalId, records = readNotes()) {
  const matches = n => String(n.cat === 'task' ? linkedGoalId(n.task || {}, n) : n.goal || '') === String(goalId);
  const linked = records.filter(n => n && n.text && matches(n))
    .sort((a, b) => (b.updatedAt || b.ts || 0) - (a.updatedAt || a.ts || 0));
  return {
    notes: linked.filter(n => n.cat === 'goal-note' || (n.cat === 'task' && n.task)),
    journal: linked.filter(n => n.cat === 'note'),
  };
}

// Writes to the existing note collection: Journal uses its established `note`
// category; independent goal notes are separate from thoughts and task notes.
export function saveGoalWorkspaceRecord({ id, cat, goalId, text }) {
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

function entryForm(cat, note) {
  const journal = cat === 'note';
  const title = journal ? 'Journal entry' : 'Note';
  const stamp = note?.ts ? new Date(note.ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  return `<form class="goal-entry-form" data-cat="${cat}" data-entry-id="${esc(note?.id || '')}" data-goal-id="${esc(selectedGoalId)}" onsubmit="event.preventDefault();goalWorkspaceSaveEntry(this)">
    ${stamp ? `<p class="goal-entry-date">${esc(stamp)}</p>` : ''}
    <label>${note ? title : journal ? 'Add a journal entry' : 'Add a note'}<textarea rows="3" maxlength="10000" placeholder="${journal ? 'Reflect on this goal…' : 'Capture a note for this goal…'}" oninput="goalWorkspaceEntryChanged(this)" ${note ? 'onchange="goalWorkspaceSaveEntry(this.form)"' : ''}>${esc(note?.text || '')}</textarea></label>
    <div class="task-note-footer"><span class="task-note-status" role="status">${note ? 'Saved' : ''}</span><button type="submit">${note ? 'Save changes' : journal ? 'Save journal entry' : 'Save note'}</button></div>
  </form>`;
}

export function goalWorkspaceEntryChanged(input) {
  input.form.dataset.dirty = 'true';
  input.form.querySelector('.task-note-status').textContent = 'Unsaved changes';
}

export function goalWorkspaceSaveEntry(form) {
  const { record, error } = saveGoalWorkspaceRecord({ id: form.dataset.entryId, cat: form.dataset.cat,
    goalId: form.dataset.goalId, text: form.querySelector('textarea').value });
  const status = form.querySelector('.task-note-status');
  if (error) { status.textContent = error; return false; }
  delete form.dataset.dirty;
  status.textContent = 'Saved';
  if (!form.dataset.entryId) {
    form.querySelector('textarea').value = '';
    renderGoalWorkspaceNotes();
  }
  window.renderTaskNotesList?.();
  return !!record;
}

function savePendingEntries() {
  for (const form of document.querySelectorAll('#page-goalworkspace .goal-entry-form[data-dirty="true"]')) {
    if (!goalWorkspaceSaveEntry(form)) return false;
  }
  for (const editor of document.querySelectorAll('#page-goalworkspace .task-note-editor[data-dirty="true"]')) {
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
  const select = document.getElementById('goalWorkspaceSelect');
  if (!initialSelectionRead) {
    initialSelectionRead = true;
    const raw = new URLSearchParams(location.search).get('goal');
    const idx = raw === null ? 0 : Number(raw);
    selectedGoalId = intentions[idx] ? String(intentions[idx].id) : null;
  }
  select.innerHTML = '<option value="">— Choose a goal —</option>' + intentions.map((g, i) =>
    `<option value="${esc(String(g.id))}">${esc(goalLetter(g, i) + ' · ' + (g.title || 'Untitled goal'))}</option>`).join('');
  const goal = selectedGoal();
  select.value = goal ? selectedGoalId : '';
  select.disabled = !intentions.length;
  document.getElementById('goalWorkspaceContent').hidden = !goal;
  const empty = document.getElementById('goalWorkspaceEmpty');
  empty.hidden = !!goal;
  empty.textContent = intentions.length ? 'Choose a goal to see its notes, to-dos, and journal entries.' : 'Your goals will appear here when you are signed in and have added a goal.';
  if (!goal) return;
  document.getElementById('goalWorkspaceGoal').textContent = goal.title || 'Untitled goal';
  document.getElementById('goalWorkspaceNoteComposer').innerHTML = entryForm('goal-note');
  document.getElementById('goalWorkspaceJournalComposer').innerHTML = entryForm('note');
  renderGoalWorkspaceTasks();
  renderGoalWorkspaceNotes();
}

export function renderGoalWorkspaceTasks() {
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
  if (!activeWorkspace() || !selectedGoal()) return;
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

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => { if (activeWorkspace()) savePendingEntries(); });
  window.addEventListener('storage', event => {
    if (event.key === 'ci_notes') renderGoalWorkspaceNotes();
  });
}
