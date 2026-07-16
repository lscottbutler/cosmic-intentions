/* STABLE CODES harness (Phase 2 My Actions + Phase 2b Roadmap).
 * Mirrors _ensureCodes() + the roadmap swap/remap sidecar logic from
 * shared/wrapup.js & shared/card-builder.js and asserts a code, once assigned,
 * never shifts on Move / Delete / Break-down / Add / Regenerate.
 * Run: node standalone/code-stability-test.mjs
 * (Keep in lockstep with the source — if the algorithm changes, update this.) */

// ── mirror of _ensureCodes(rai) (self-healing high-water mark) ─────────────
function ensureCodes(rai) {
  if (!rai || !Array.isArray(rai.userTasks)) return false;
  let changed = false;
  let seq = (typeof rai._codeSeq === 'number') ? rai._codeSeq : 0;
  rai.userTasks.forEach(u => { if (typeof u.code === 'number' && u.code > seq) seq = u.code; });
  if (rai.codes) Object.keys(rai.codes).forEach(k => { const c = rai.codes[k]; if (typeof c === 'number' && c > seq) seq = c; });
  const walk = (node) => {
    const kids = Array.isArray(node.children) ? node.children : null;
    if (!kids || !kids.length) return;
    let cs = (typeof node._childSeq === 'number') ? node._childSeq : 0;
    kids.forEach(c => { if (typeof c.code === 'number' && c.code > cs) cs = c.code; });
    kids.forEach(c => { if (typeof c.code !== 'number') { c.code = ++cs; changed = true; } walk(c); });
    node._childSeq = cs;
  };
  rai.userTasks.forEach(u => { if (typeof u.code !== 'number') { u.code = ++seq; changed = true; } walk(u); });
  if (Array.isArray(rai.tasks) && rai.tasks.length) {
    if (!rai.codes) rai.codes = {};
    for (let i = 0; i < rai.tasks.length; i++) { if (typeof rai.codes[i] !== 'number') { rai.codes[i] = ++seq; changed = true; } }
  }
  rai._codeSeq = seq;
  return changed;
}
// mirror of wrapMoveRoadmapTask's swap + deleteRoadmapTask's remap
function swapIdx(o, i, j) { if (!o) return; const a = o[i], b = o[j];
  if (b === undefined) delete o[i]; else o[i] = b; if (a === undefined) delete o[j]; else o[j] = a; }
function remap(m, i) { const out = {}; Object.keys(m || {}).forEach(key => { const n = Number(key); if (n < i) out[n] = m[key]; else if (n > i) out[n - 1] = m[key]; }); return out; }

// ── code strings ───────────────────────────────────────────────────────────
function codesFor(letter, rai) {
  const out = {};
  const walk = (list, prefix) => list.forEach(t => {
    const c = prefix ? `${prefix}.${t.code}` : `${letter}${t.code}`;
    out[t.id] = c;
    if (Array.isArray(t.children)) walk(t.children, c);
  });
  walk(rai.userTasks, null);
  return out;
}
const roadmapCode = (letter, rai, i) => letter + rai.codes[i];

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
  ok ? pass++ : fail++;
};

const L = 'D';
const rai = {
  userTasks: [ {id:'A',text:'A'}, {id:'B',text:'B'}, {id:'C',text:'C'} ],
  tasks: ['R0','R1','R2'], done: {1:true}, locks: {},
};

// ── My Actions (Phase 2) ────────────────────────────────────────────────────
ensureCodes(rai);
eq('My-Actions A,B,C = D1,D2,D3', codesFor(L, rai), {A:'D1', B:'D2', C:'D3'});
[rai.userTasks[1], rai.userTasks[2]] = [rai.userTasks[2], rai.userTasks[1]];
ensureCodes(rai);
eq('Move B down: B stays D2', codesFor(L, rai)['B'], 'D2');
rai.userTasks = rai.userTasks.filter(t => t.id !== 'A');
ensureCodes(rai);
eq('Delete A: C stays D3', codesFor(L, rai)['C'], 'D3');
rai.userTasks.push({id:'E'}); ensureCodes(rai);
eq('Add E after roadmap present: fresh code, no collision', codesFor(L, rai)['E'], 'D7');

// ── Roadmap (Phase 2b) ───────────────────────────────────────────────────────
eq('roadmap R0,R1,R2 seeded above My-Actions', [roadmapCode(L,rai,0),roadmapCode(L,rai,1),roadmapCode(L,rai,2)], ['D4','D5','D6']);
// MOVE roadmap task 0 <-> 1: codes + done ride along
[rai.tasks[0], rai.tasks[1]] = [rai.tasks[1], rai.tasks[0]];
swapIdx(rai.done,0,1); swapIdx(rai.locks,0,1); swapIdx(rai.codes,0,1);
ensureCodes(rai);
eq('roadmap move: R1 now at index0 still D5', roadmapCode(L,rai,0), 'D5');
eq('roadmap move: R0 now at index1 still D4', roadmapCode(L,rai,1), 'D4');
eq('roadmap move: done rides with R1 (was done)', !!rai.done[0], true);
// DELETE roadmap index0 (R1/D5): remap shifts, survivors keep codes
rai.tasks.splice(0,1); rai.done = remap(rai.done,0); rai.locks = remap(rai.locks,0); rai.codes = remap(rai.codes,0);
ensureCodes(rai);
eq('roadmap delete: R0 still D4, R2 still D6', [roadmapCode(L,rai,0),roadmapCode(L,rai,1)], ['D4','D6']);

// ── Regenerate self-heal (the latent-collision guard) ────────────────────────
// regenerate: roadmapAI replaced {...result, userTasks} — _codeSeq & codes DROPPED,
// coded userTasks kept. Simulate, then add a task → must NOT reuse an owned code.
const kept = rai.userTasks;                       // still carry .code
const rai2 = { intention:'g', userTasks: kept, tasks: ['N0','N1'] };  // no _codeSeq, no codes
ensureCodes(rai2);
const maxUser = Math.max(...kept.map(u => u.code));
eq('regenerate: new roadmap codes start above kept-user high-water', rai2.codes[0] > maxUser, true);
kept.push({id:'Z'}); ensureCodes(rai2);
const all = [...kept.map(u=>u.code), ...Object.values(rai2.codes)];
eq('regenerate: no duplicate codes anywhere', all.length, new Set(all).size);

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
