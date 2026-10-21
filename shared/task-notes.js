import { esc, intentions, goalLetter } from '../app.js';
import { readNotes, _saveNotes } from './notes.js';

// Task notes share the existing private notes library. They are not thoughts
// for random display, journal entries, or input to roadmap generation.
export const TASK_NOTE_PENCIL = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m14 5 5 5"/></svg>';

export function taskNoteContext(goal, kind, taskId, code, taskText) {
  return { goalId: String(goal.id), goalTitle: goal.title || '', kind,
    taskId: String(taskId), code, taskText: String(taskText || '') };
}

export function taskNoteKey(context) {
  return JSON.stringify([context.goalId, context.kind, context.taskId]);
}

export function taskLinkedRecords(context, records = readNotes()) {
  const key = taskNoteKey(context);
  return records.filter(n => n && typeof n.text === 'string' && n.text.trim() && n.taskKey === key &&
    (n.cat === 'task' || (['goal-note', 'note'].includes(n.cat) && String(n.goal) === context.goalId)))
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
}

export function taskLinkedEntriesHTML(context, records = readNotes()) {
  return taskLinkedRecords(context, records).map(n => `<section class="goal-action-entry">
    <h4>${n.cat === 'note' ? 'Journal entry' : 'Note'}</h4>
    <p>${esc(n.text)}</p>
  </section>`).join('');
}

function savedTaskNote(context) {
  const key = taskNoteKey(context);
  return readNotes().find(n => n && n.cat === 'task' && n.taskKey === key);
}

export function linkedGoalId(context, note) {
  // Older task notes inherit their source goal. Keep an explicit empty choice
  // distinct from that fallback so unlinking survives closing and reopening.
  return String(note && Object.hasOwn(note, 'goal') ? note.goal || '' : context.goalId);
}

function linkedGoalTitle(context, note) {
  const id = linkedGoalId(context, note);
  if (!id) return 'No goal linked';
  return intentions.find(g => String(g.id) === id)?.title || note?.goalTitle ||
    (id === context.goalId ? context.goalTitle : '') || 'Unavailable goal';
}

function goalOptions(context, note) {
  const selected = linkedGoalId(context, note);
  const unavailable = selected && !intentions.some(g => String(g.id) === selected);
  return `<option value=""${!selected ? ' selected' : ''}>— Link to a goal —</option>` +
    (unavailable ? `<option value="${esc(selected)}" selected>${esc(linkedGoalTitle(context, note))} (unavailable)</option>` : '') +
    intentions.map((g, i) => `<option value="${esc(String(g.id))}"${String(g.id) === selected ? ' selected' : ''}>${esc(goalLetter(g, i) + ' · ' + (g.title || '').replace(/^i am\s+/i, ''))}</option>`).join('');
}

export function taskNoteButton(context) {
  if (!context) return '';
  return `<button type="button" class="task-note-pencil" onclick="taskNoteToggle(this)" aria-label="Notes for ${esc(context.code)}" title="Task notes" aria-expanded="false">${TASK_NOTE_PENCIL}</button>`;
}

export function editorHTML(context, note) {
  return `<div class="task-note-editor" data-task-context="${esc(JSON.stringify(context))}" data-task-key="${esc(taskNoteKey(context))}">
    <label class="task-note-label">Your note<textarea rows="3" maxlength="10000" placeholder="Write a note about this task…" oninput="taskNoteChanged(this)" onchange="taskNoteSave(this)">${esc(note?.text || '')}</textarea></label>
    <label class="task-note-goal-label">Linked goal<select class="task-note-goal" title="Associate this note with a goal" onchange="taskNoteChanged(this);taskNoteSave(this)">${goalOptions(context, note)}</select></label>
    <div class="task-note-footer"><span class="task-note-status" role="status">${note ? 'Saved' : ''}</span><button type="button" onclick="taskNoteSave(this)">Save note</button></div>
  </div>`;
}

export function taskNotePanel(context) {
  if (!context) return '';
  return `<div class="task-note-panel" aria-hidden="true" inert><div class="task-note-panel-inner">${editorHTML(context, savedTaskNote(context))}</div></div>`;
}

export function taskNoteToggle(button) {
  const panel = button.closest('.wcard')?.querySelector('.task-note-panel');
  if (!panel) return;
  const editor = panel.querySelector('.task-note-editor');
  const open = !panel.classList.contains('is-open');
  if (!open && editor.dataset.dirty === 'true' && !taskNoteSave(editor)) return;
  if (open && editor.dataset.dirty !== 'true') {
    const context = JSON.parse(editor.dataset.taskContext);
    const note = savedTaskNote(context);
    editor.querySelector('textarea').value = note?.text || '';
    editor.querySelector('.task-note-goal').innerHTML = goalOptions(context, note);
    editor.querySelector('.task-note-status').textContent = note ? 'Saved' : '';
  }
  panel.classList.toggle('is-open', open);
  panel.inert = !open;
  panel.setAttribute('aria-hidden', String(!open));
  button.setAttribute('aria-expanded', String(open));
  if (open) editor.querySelector('textarea').focus({ preventScroll: true });
}

export function taskNoteChanged(input) {
  const editor = input.closest('.task-note-editor');
  editor.dataset.dirty = 'true';
  editor.querySelector('.task-note-status').textContent = 'Unsaved changes';
}

export function taskNoteSave(source) {
  const editor = source.closest('.task-note-editor');
  if (!editor) return false;
  const status = editor.querySelector('.task-note-status');
  const text = editor.querySelector('textarea').value.trim();
  const context = JSON.parse(editor.dataset.taskContext);
  const goal = editor.querySelector('.task-note-goal').value;
  const key = taskNoteKey(context);
  const notes = readNotes();
  const existing = notes.find(n => n && n.cat === 'task' && n.taskKey === key);
  if (!text) {
    status.textContent = existing ? 'Enter a note before saving.' : '';
    if (!existing) delete editor.dataset.dirty;
    return !existing;
  }
  const now = Date.now();
  const goalTitle = linkedGoalTitle(context, { goal,
    goalTitle: existing && linkedGoalId(context, existing) === goal ? existing.goalTitle : '' });
  if (existing) Object.assign(existing, { text, task: context, goal, goalTitle, updatedAt: now });
  else notes.push({ id: 'task-' + crypto.randomUUID(), cat: 'task', taskKey: key,
    task: context, text, goal, goalTitle, ts: now, updatedAt: now });
  if (!_saveNotes(notes)) {
    status.textContent = 'Could not save. Keep this box open and try again.';
    return false;
  }
  delete editor.dataset.dirty;
  status.textContent = 'Saved';
  // The same task appears in My Actions, Both, and the all-tasks list. Refresh
  // its other editors without overwriting a note that is still being typed.
  document.querySelectorAll('.task-note-editor').forEach(other => {
    if (other === editor || other.dataset.taskKey !== key || other.dataset.dirty === 'true') return;
    other.querySelector('textarea').value = text;
    other.querySelector('.task-note-goal').innerHTML = goalOptions(context, { goal, goalTitle });
    other.querySelector('.task-note-status').textContent = 'Saved';
  });
  const goalHeading = editor.closest('.master-task-note')?.querySelector('.master-task-note-goal');
  if (goalHeading) goalHeading.textContent = goalTitle;
  if (!editor.closest('#taskNotesList')) renderTaskNotesList();
  if (typeof window.renderGoalWorkspaceNotes === 'function') window.renderGoalWorkspaceNotes(editor);
  return true;
}

export function renderTaskNotesList() {
  const host = document.getElementById('taskNotesList');
  if (!host) return;
  const notes = readNotes().filter(n => n && n.text && ((n.cat === 'task' && n.task) || n.cat === 'goal-note'))
    .sort((a, b) => (b.updatedAt || b.ts || 0) - (a.updatedAt || a.ts || 0));
  host.innerHTML = notes.length ? notes.map(note => note.cat === 'goal-note' ? `<article class="master-task-note">
    <div class="master-task-note-source"><strong>Note</strong></div>
    <p class="master-task-note-goal">${esc(intentions.find(g => String(g.id) === String(note.goal))?.title || note.goalTitle || (note.goal ? 'Unavailable goal' : 'General note'))}</p>
    <p class="goal-note-text">${esc(note.text)}</p>
    ${note.goal ? `<button type="button" class="goal-workspace-link" data-goal-id="${esc(String(note.goal))}" onclick="openGoalWorkspace(this.dataset.goalId)">Open MY TO DO LIST</button>` : ''}
  </article>` : `<article class="master-task-note">
    <div class="master-task-note-source"><strong>${esc(note.task.code)}</strong><span>${note.task.kind === 'roadmap' ? 'Roadmap' : 'My Actions'}</span></div>
    <p class="master-task-note-goal">${esc(linkedGoalTitle(note.task, note))}</p>
    <h2>${esc(note.task.taskText)}</h2>${editorHTML(note.task, note)}
  </article>`).join('') : '<p class="task-notes-empty">No task notes yet. Tap the pencil beside any task to add one.</p>';
  const count = document.getElementById('taskNotesCount');
  if (count) count.textContent = `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    document.querySelectorAll('.task-note-editor[data-dirty="true"]').forEach(taskNoteSave);
  });
  window.addEventListener('storage', event => {
    if (event.key === 'ci_notes' && !document.querySelector('#taskNotesList [data-dirty="true"]')) renderTaskNotesList();
  });
}
