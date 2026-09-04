/* ── FROZEN CODE REGISTRY (Phase 2) ───────────────────────────────────────
   Journal-safe codes must be STABLE: the code on a goal/task must never change
   when things are reordered or deleted. We store assignments in an ISOLATED
   localStorage key ("ci_codes"), keyed by each entity's stable id. We do NOT
   mutate the goal/roadmap data itself — so if this registry is ever wrong or
   wiped, fresh codes are simply re-derived and NO user data is at risk.

   Scope this pass:
     • goals       → a stable slot 0..25 → letter A..Z (25 goals = A..Y)
     • My-Actions  → a stable number within their sibling list (they carry ids)
   AI roadmap steps stay position-based for now (they're strings, reordered /
   regenerated often, and their done/locks are index-keyed) — a later pass.

   The assignment ALGORITHM lives in the pure helpers below (no I/O) so it can
   be unit-tested in isolation; the exported functions just add load/save. */

import { LS } from '../app.js';

const KEY = 'ci_codes';
let _reg = null;
function _load() { if (!_reg) _reg = LS.get(KEY) || { goals: {}, tasks: {} }; return _reg; }
function _save() { if (_reg) LS.set(KEY, _reg); }

/* ── pure algorithm (no storage) ─────────────────────────────────────────── */

// Lowest unused non-negative integer among `used` — fills gaps so a deleted
// goal frees its letter for reuse (there are only 25 letter slots).
export function lowestFree(used) {
  const taken = new Set(used);
  let n = 0; while (taken.has(n)) n++;
  return n;
}

// Assign `goalId` a slot in `reg.goals` if it has none. Only slots still held by
// a LIVING goal (in liveIds) count as taken, so deleted goals' letters recycle.
export function assignGoalSlot(reg, goalId, liveIds) {
  const key = String(goalId);
  if (reg.goals[key] != null) return reg.goals[key];
  const live = new Set((liveIds || []).map(String));
  const used = Object.entries(reg.goals).filter(([id]) => live.has(id)).map(([, s]) => s);
  const slot = lowestFree(used);
  reg.goals[key] = slot;
  return slot;
}

// Assign `taskId` the next number within its sibling group if it has none.
// Numbers never recycle (gaps are fine + unlimited) so a written code is
// permanent: max sibling number + 1.
export function assignTaskNum(reg, taskId, siblingIds) {
  const key = String(taskId);
  if (reg.tasks[key] != null) return reg.tasks[key];
  const nums = (siblingIds || []).map(id => reg.tasks[String(id)]).filter(n => n != null);
  const num = (nums.length ? Math.max(...nums) : 0) + 1;
  reg.tasks[key] = num;
  return num;
}

/* ── public API (loads + persists) ───────────────────────────────────────── */

// 0-based stable slot for a goal id (→ letter via 65 + slot). liveIds = ids of
// goals that currently exist, so deleted goals free their slot.
export function goalSlot(goalId, liveIds) {
  if (goalId == null) return null;
  const reg = _load();
  const had = reg.goals[String(goalId)] != null;
  const slot = assignGoalSlot(reg, goalId, liveIds);
  if (!had) _save();
  return slot;
}

// 1-based stable number for a task within its sibling list. siblingIds = ids of
// the current siblings (used to compute the next number).
export function taskNum(taskId, siblingIds) {
  if (taskId == null) return null;
  const reg = _load();
  const had = reg.tasks[String(taskId)] != null;
  const num = assignTaskNum(reg, taskId, siblingIds);
  if (!had) _save();
  return num;
}
