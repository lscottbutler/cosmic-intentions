/* ── ARCHIVE (Scott 21 Nov 2026) ──────────────────────────────────────────────
   ARCHIVE on a goal moves it off every page (Goals, My Thoughts, MY FOCUS, To Do,
   Visualization) into the member's Archive. Nothing is lost: the full goal row is
   saved first, and only then removed from the live goal list.
   The Archive page lists everything archived: RESTORE puts a goal back exactly as it
   was; DELETE FOREVER removes it for good (two taps, so it can't happen by accident).
   Storage: player_personal_notes, page 'archive', body = {"goals":[{archivedAt,title,row}]}
   (per member, protected by the same row-level security as personal notes). */
import { sb, currentUser, intentions, saveIntentions, toast, esc, renderDashboard } from '../app.js';
import { renderThoughtGoalEditors, renderPBIntentionList } from './card-builder.js';
import { readNotes, _saveNotes } from './notes.js';

/* Scott 22 Nov 2026: a goal's notes and journal entries travel with it — archived together,
   restored together, deleted together. (Its to-dos live inside the goal itself.) */
function noteGoalId(n) {
  if (!n) return '';
  if (Object.hasOwn(n, 'goal')) return String(n.goal || '');
  if (n.task && n.task.goalId != null) return String(n.task.goalId);
  try { const k = JSON.parse(n.taskKey || '[]'); return k[0] != null ? String(k[0]) : ''; } catch (_) { return ''; }
}
function takeNotesFor(goalId) {
  if (!goalId) return [];
  const all = readNotes(), keep = [], take = [];
  all.forEach(n => (noteGoalId(n) === String(goalId) ? take : keep).push(n));
  if (take.length) _saveNotes(keep);
  return take;
}
// Goals archived before this change: pull their leftover notes into the archive too.
let _swept = false;
async function sweepArchivedGoalNotes() {
  if (_swept || !currentUser) return; _swept = true;
  try {
    const arc = await readArchive(); let moved = 0;
    arc.goals.forEach(g => { const id = g.row?.id || g.local?.id; const t = takeNotesFor(id); if (t.length) { g.notes = (g.notes || []).concat(t); moved += t.length; } });
    if (moved) await writeArchive(arc);
  } catch (e) { _swept = false; console.error('[archive sweep]', e); }
}

const PAGE = 'archive';

async function readArchive() {
  if (!currentUser) return { goals: [] };
  const { data, error } = await sb.from('player_personal_notes').select('body')
    .eq('user_id', currentUser.id).eq('page_id', PAGE).maybeSingle();
  if (error) throw error;
  try { const v = JSON.parse(data?.body || '{}'); return { goals: Array.isArray(v.goals) ? v.goals : [] }; }
  catch (_) { return { goals: [] }; }
}

async function writeArchive(arc) {
  const { error } = await sb.from('player_personal_notes').upsert({
    user_id: currentUser.id, page_id: PAGE, title: 'ARCHIVE',
    body: JSON.stringify(arc), updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,page_id' });
  if (error) throw error;
}

function refreshGoalViews() {
  try { renderThoughtGoalEditors(); } catch (_) {}   // also refreshes the archive list
  try { renderPBIntentionList(); } catch (_) {}
  try { renderDashboard(); } catch (_) {}
}

export async function archiveGoal(idx) {
  const goal = intentions[idx];
  if (!goal) return;
  if (!currentUser) { toast('Sign in to archive goals.', ''); return; }
  try {
    // 1. Save a full copy first.
    let row = null;
    if (goal.id) {
      const { data, error } = await sb.from('intentions').select('*').eq('id', goal.id).eq('user_id', currentUser.id).maybeSingle();
      if (error) throw error;
      row = data;
    }
    const arc = await readArchive();
    const notes = takeNotesFor(goal.id);
    arc.goals.unshift({ archivedAt: new Date().toISOString(), title: goal.title || '', row, local: row ? null : goal, notes });
    await writeArchive(arc);
    // 2. Only now take it off the live list.
    intentions.splice(idx, 1);
    await saveIntentions();
    if (goal.id) {
      const { error } = await sb.from('intentions').delete().eq('id', goal.id).eq('user_id', currentUser.id);
      if (error) throw error;
    }
    refreshGoalViews();
    toast('Goal archived. It is in ARCHIVE at the bottom of My Goals.', 'success');
  } catch (e) {
    console.error('[archive]', e);
    toast('Could not archive this goal. Nothing was removed.', '');
  }
}

export async function renderArchivePage() {
  const el = document.getElementById('archiveList');
  if (!el) return;
  if (!currentUser) { el.innerHTML = '<p>Sign in to see your archive.</p>'; return; }
  el.innerHTML = '<p style="color:#777">Loading…</p>';
  await sweepArchivedGoalNotes();
  let arc;
  try { arc = await readArchive(); } catch (_) { el.innerHTML = '<p>Could not load your archive. Please refresh.</p>'; return; }
  if (!arc.goals.length) { el.innerHTML = '<p style="color:#555">Nothing archived yet. Tap ARCHIVE on a goal above to move it here.</p>'; return; }
  const btn = 'border:0;border-radius:6px;padding:8px 12px;font:700 11px/1 Arial,sans-serif;letter-spacing:.08em;cursor:pointer;white-space:nowrap';
  el.innerHTML = '<h3 style="margin:0 0 10px;font:800 14px/1.3 Arial,sans-serif;letter-spacing:.1em">ARCHIVED GOALS</h3>' + arc.goals.map((g, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 0;border-top:1px solid #e3e3e3">
      <div style="flex:1 1 280px;min-width:0"><div style="font-weight:700">${esc(g.title || '(untitled goal)')}</div>
        <div style="font-size:12px;color:#777">${g.notes?.length ? g.notes.length + ' note' + (g.notes.length === 1 ? '' : 's') + '/journal entr' + (g.notes.length === 1 ? 'y' : 'ies') + ' archived with it · ' : ''}Archived ${esc(new Date(g.archivedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }))}</div></div>
      <span style="display:flex;gap:8px">
        <button type="button" onclick="ciRestoreArchivedGoal(${i})" style="${btn};background:#000;color:#fff">RESTORE</button>
        <button type="button" data-del="${i}" onclick="ciDeleteArchivedGoal(${i}, this)" style="${btn};background:#8b1a1a;color:#fff">DELETE FOREVER</button>
      </span>
    </div>`).join('');
}

export async function restoreArchivedGoal(i) {
  try {
    const arc = await readArchive();
    const g = arc.goals[i]; if (!g) return;
    if (g.row) {
      const row = { ...g.row, user_id: currentUser.id, position: intentions.length };
      const { error } = await sb.from('intentions').upsert(row, { onConflict: 'id' });
      if (error) throw error;
    } else if (g.local) {
      intentions.push(g.local);
      await saveIntentions();
    }
    if (Array.isArray(g.notes) && g.notes.length) { const ids = new Set(readNotes().map(n => n.id)); _saveNotes(readNotes().concat(g.notes.filter(n => !ids.has(n.id)))); }
    arc.goals.splice(i, 1);
    await writeArchive(arc);
    toast('Goal restored.', 'success');
    setTimeout(() => location.reload(), 600);   // reload so every page picks the goal up again
  } catch (e) {
    console.error('[archive restore]', e);
    toast('Could not restore this goal. It is still in the archive.', '');
  }
}

export async function deleteArchivedGoal(i, btn) {
  // Two taps: the first turns the button into a confirmation.
  if (btn && btn.dataset.armed !== '1') {
    btn.dataset.armed = '1'; btn.textContent = 'TAP AGAIN TO DELETE';
    setTimeout(() => { if (btn.isConnected) { btn.dataset.armed = ''; btn.textContent = 'DELETE FOREVER'; } }, 4000);
    return;
  }
  try {
    const arc = await readArchive();
    if (!arc.goals[i]) return;
    arc.goals.splice(i, 1);
    await writeArchive(arc);
    toast('Deleted for good.', '');
    renderArchivePage();
  } catch (e) {
    console.error('[archive delete]', e);
    toast('Could not delete. Nothing changed.', '');
  }
}

if (typeof window !== 'undefined') {
  window.ciArchiveGoal = archiveGoal;
  window.ciRestoreArchivedGoal = restoreArchivedGoal;
  window.ciDeleteArchivedGoal = deleteArchivedGoal;
  window.renderArchivePage = renderArchivePage;
  // Run the leftover-notes sweep once per visit, on any page, after sign-in has had a moment.
  let tries = 0; const t = setInterval(() => { tries++; if (_swept || tries > 40) return clearInterval(t); sweepArchivedGoalNotes(); }, 3000);
}
