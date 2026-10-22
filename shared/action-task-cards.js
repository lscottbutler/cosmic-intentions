import './action-task-cards.css';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Additive card metadata: existing saved notes/actions retain their original store.
export function mountActionTaskCards(root, { storageKey, canSave, status, getGoal }) {
  const key = `${storageKey}:task-details`;
  let state = {}, readFailed = false;
  try {
    state = JSON.parse(localStorage.getItem(key) || '{}');
    if (!state || typeof state !== 'object' || Array.isArray(state)) throw new Error('Invalid task details');
  } catch (_) { readFailed = true; state = {}; }
  const drafts = new Map();
  function save(task, patch) {
    if (!canSave()) { status('Your account changed. Reopen this card before saving.', 'action'); return false; }
    if (readFailed) { status('Existing task details could not be read. They were left untouched.', 'action'); return false; }
    const next = { ...state, [task]: { ...state[task], ...patch } };
    try { localStorage.setItem(key, JSON.stringify(next)); state = next; return true; }
    catch (_) { status('Could not save on this device. Your text is still here.', 'action'); return false; }
  }
  function linked(task, kind) {
    const text = state[task]?.[kind] || '';
    const draftKey = JSON.stringify([task, kind]);
    const editing = drafts.has(draftKey);
    return `<section class="action-linked action-linked-${kind}" data-linked-kind="${kind}"><button type="button" class="action-linked-heading" data-edit-linked aria-expanded="${editing}" aria-label="Edit ${kind}">${kind.toUpperCase()}</button><p ${editing ? 'hidden' : ''}>${esc(text || (kind === 'note' ? 'No note yet.' : 'No journal entry yet.'))}</p><div class="action-linked-editor" ${editing ? '' : 'hidden'}><textarea maxlength="4000" aria-label="${kind === 'note' ? 'Note' : 'Journal'} for this action">${esc(editing ? drafts.get(draftKey) : text)}</textarea><div><button type="button" class="ent-button" data-save-linked>Save ${kind}</button><button type="button" class="ent-button ent-button-secondary" data-cancel-linked>Cancel</button></div></div></section>`;
  }
  function markup(task, text, number, record = null) {
    const meta = state[task] || {};
    const done = record ? record.done : meta.done;
    return `<li class="action-task-card ${done ? 'action-task-done' : ''}" data-task-key="${esc(task)}" ${record ? `data-record-id="${esc(record.id)}"` : ''}>
      <div class="action-task-top"><input type="checkbox" aria-label="Complete action: ${esc(text)}" ${record ? `data-complete-action="${esc(record.id)}"` : 'data-complete-step'} ${done ? 'checked' : ''}><span class="action-task-text">${esc(text)}</span><div class="action-task-tools"><button type="button" class="action-priority" data-task-priority aria-pressed="${!!meta.priority}" aria-label="Priority for this action">P</button><button type="button" class="action-delete" ${record ? `data-remove="${esc(record.id)}"` : 'data-remove-step'} aria-label="${record ? 'Remove saved action' : 'Hide suggested action'}">×</button><div class="action-task-code"><span>${esc(number)}</span>${record ? `<button type="button" data-edit-record="${esc(record.id)}" aria-label="Edit action">…</button>` : '<span class="action-suggested-label" title="Suggested action">TO DO</span>'}</div></div></div>
      ${record?.goal ? `<p class="action-task-goal">${esc(record.goal)}</p>` : ''}${linked(task, 'note')}${linked(task, 'journal')}</li>`;
  }
  let roadmap = [], actions = [];
  function render(steps = roadmap, records = actions) {
    roadmap = steps; actions = records;
    const goal = String(getGoal() || '');
    const suggested = steps.map((text, i) => ({ text, number: String(i + 1).padStart(2, '0'), task: JSON.stringify(['step', goal, text]) }));
    root.querySelector('.ent-steps').innerHTML = suggested.filter(s => !state[s.task]?.hidden).map(s => markup(s.task, s.text, s.number)).join('');
    root.querySelector('[data-restore-steps]').hidden = !suggested.some(s => state[s.task]?.hidden);
    root.querySelector('.ent-action-list').innerHTML = records.map((r, i) => markup(JSON.stringify(['action', r.id]), r.text, `MY ${i + 1}`, r)).join('');
  }
  function onInput(e) {
    const section = e.target.closest('.action-linked');
    if (section && e.target.matches('textarea')) drafts.set(JSON.stringify([section.closest('[data-task-key]').dataset.taskKey, section.dataset.linkedKind]), e.target.value);
  }
  function onChange(e) {
    if (!e.target.matches('[data-complete-step]')) return;
    const task = e.target.closest('[data-task-key]').dataset.taskKey;
    if (save(task, { done: e.target.checked })) { e.target.closest('li').classList.toggle('action-task-done', e.target.checked); status(e.target.checked ? 'Action completed.' : 'Action reopened.', 'action'); }
    else e.target.checked = !!state[task]?.done;
  }
  function onClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-restore-steps')) {
      const goal = String(getGoal() || '');
      for (const text of roadmap) { const task = JSON.stringify(['step', goal, text]); if (state[task]?.hidden && !save(task, { hidden: false })) return; }
      render(); return;
    }
    const card = b.closest('[data-task-key]');
    if (!card) return;
    const task = card.dataset.taskKey;
    if (b.hasAttribute('data-task-priority') && save(task, { priority: !state[task]?.priority })) b.setAttribute('aria-pressed', String(!!state[task]?.priority));
    if (b.hasAttribute('data-remove-step') && save(task, { hidden: true })) render();
    const section = b.closest('.action-linked');
    if (!section) return;
    const kind = section.dataset.linkedKind, draftKey = JSON.stringify([task, kind]);
    const editor = section.querySelector('.action-linked-editor'), field = section.querySelector('textarea');
    function close() { drafts.delete(draftKey); editor.hidden = true; section.querySelector('p').hidden = false; section.querySelector('[data-edit-linked]').setAttribute('aria-expanded', 'false'); section.querySelector('[data-edit-linked]').focus(); }
    if (b.hasAttribute('data-edit-linked')) {
      editor.hidden = false; section.querySelector('p').hidden = true; b.setAttribute('aria-expanded', 'true'); drafts.set(draftKey, field.value); field.focus();
    }
    if (b.hasAttribute('data-cancel-linked')) { field.value = state[task]?.[kind] || ''; close(); }
    if (b.hasAttribute('data-save-linked') && save(task, { [kind]: field.value.trim() })) {
      field.value = state[task][kind]; section.querySelector('p').textContent = field.value || (kind === 'note' ? 'No note yet.' : 'No journal entry yet.'); close(); status(`${kind === 'note' ? 'Note' : 'Journal'} saved on this device.`, 'action');
    }
  }
  root.addEventListener('input', onInput); root.addEventListener('change', onChange); root.addEventListener('click', onClick);
  return { render, dispose() { root.removeEventListener('input', onInput); root.removeEventListener('change', onChange); root.removeEventListener('click', onClick); } };
}
