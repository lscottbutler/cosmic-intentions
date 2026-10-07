import { intentions, goalLetter } from '../app.js';
import { readNotes, _saveNotes, NOTES_CAP } from './notes.js';
import { taskNoteKey } from './task-notes.js';
import { saveGoalWorkspaceRecord } from './goal-workspace.js';
import { wrapSubToggle, wrapToggleAction, wrapGoalAddAction, wrapAddAction } from './wrapup.js';
import { toggleRoadmapTaskDone, toggleRoadmapUserTaskDone } from './card-builder.js';

// An adapter for Scott's private comparison wrapper, never a production UI.
function allowed() {
  try {
    const wrapper = new URL(window.parent.parent.location.href);
    return (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      || /^deploy-preview-\d+--gilded-profiterole-47a2eb\.netlify\.app$/.test(location.hostname))
      && wrapper.origin === location.origin && wrapper.pathname === '/standalone/member-design-test.html';
  } catch (_) { return false; }
}

function snapshot() {
  const tasks = [];
  intentions.forEach((goal, idx) => {
    const rai = goal.roadmapAI || {};
    const letter = goalLetter(goal, idx);
    function walk(nodes, path = [], prefix = '') {
      (Array.isArray(nodes) ? nodes : []).forEach((task, i) => {
        const parts = [...path, i];
        const code = prefix ? `${prefix}.${task.code ?? i + 1}` : `${letter}${task.code ?? i + 1}`;
        const context = { goalId: String(goal.id), goalTitle: goal.title || '', kind: 'my',
          taskId: String(task.id ?? code), code, taskText: String(task.text || '') };
        if (context.taskText.trim()) tasks.push({ key: taskNoteKey(context), context, idx,
          path: parts.join('.'), id: task.id, text: context.taskText, goalId: String(goal.id),
          goalTitle: goal.title || '', kind: 'my', done: !!task.done });
        walk(task.children, parts, code);
      });
    }
    walk(rai.userTasks);
    if (!rai.intention || String(rai.intention).trim() === String(goal.title || '').trim()) {
      (Array.isArray(rai.tasks) ? rai.tasks : []).forEach((text, i) => {
        const context = { goalId: String(goal.id), goalTitle: goal.title || '', kind: 'roadmap',
          taskId: JSON.stringify([rai.codes?.[i] ?? i + 1, text]), code: `${letter}${rai.codes?.[i] ?? i + 1}`, taskText: String(text) };
        if (context.taskText.trim()) tasks.push({ key: taskNoteKey(context), context, idx, index: i,
          text: context.taskText, goalId: String(goal.id), goalTitle: goal.title || '', kind: 'roadmap', done: !!rai.done?.[i] });
      });
    }
  });
  const personal = JSON.parse(localStorage.getItem('ci_wrapup_actions') || '[]');
  if (Array.isArray(personal)) personal.forEach(task => {
    if (task && typeof task.text === 'string' && task.text.trim()) tasks.push({ key: `personal:${task.id}`,
      id: task.id, text: task.text, goalId: '', goalTitle: '', kind: 'personal', done: !!task.done });
  });
  return { goals: intentions.map(goal => ({ id: String(goal.id), title: goal.title || '' })),
    tasks, entries: readNotes().filter(note => note && ['goal-note', 'task', 'note'].includes(note.cat) && note.text?.trim()) };
}

function toggle(key) {
  const task = snapshot().tasks.find(item => item.key === key);
  if (!task) return { error: 'This task changed. Reopen the list.' };
  if (task.kind === 'personal') wrapToggleAction(task.id);
  else if (task.kind === 'roadmap') toggleRoadmapTaskDone(task.idx, task.index);
  else if (task.path.includes('.')) wrapSubToggle(task.idx, task.path);
  else toggleRoadmapUserTaskDone(task.idx, task.id);
  return snapshot();
}

function addTask(text, goalId) {
  text = String(text || '').trim().slice(0, 160);
  if (!text) return { error: 'Write a to-do before adding it.' };
  const input = document.createElement('input');
  input.value = text;
  if (goalId) {
    const idx = intentions.findIndex(goal => String(goal.id) === goalId);
    if (idx < 0) return { error: 'This goal is no longer available.' };
    if ((intentions[idx].roadmapAI?.userTasks || []).length >= 25) return { error: 'This goal already has 25 personal actions.' };
    wrapGoalAddAction(idx, input);
  } else {
    const before = snapshot().tasks.filter(task => task.kind === 'personal').length;
    wrapAddAction(input);
    if (snapshot().tasks.filter(task => task.kind === 'personal').length === before)
      return { error: 'Could not save this to-do. Keep your text and try again.' };
  }
  return snapshot();
}

function addEntry({ text, kind, goalId, taskKey }) {
  text = String(text || '').trim();
  if (!text || text.length > 10000) return { error: 'Write between 1 and 10,000 characters.' };
  const cat = kind === 'journal' ? 'note' : 'goal-note';
  if (goalId) {
    const result = saveGoalWorkspaceRecord({ cat, goalId, text, taskKey: taskKey || '' });
    if (result.error) return result;
  } else {
    const records = readNotes();
    if (cat === 'note' && records.filter(note => !['task', 'goal-note'].includes(note.cat)).length >= NOTES_CAP)
      return { error: 'Your Journal and thoughts entry limit has been reached.' };
    records.push({ id: 'citadel-' + crypto.randomUUID(), cat, goal: '', text, ts: Date.now() });
    if (!_saveNotes(records)) return { error: 'Could not save. Keep your text and try again.' };
  }
  window.renderTaskNotesList?.();
  window.renderMyNotesPage?.();
  return snapshot();
}

if (allowed()) window.ciCitadelDashboardReview = { snapshot, toggle, addTask, addEntry };
