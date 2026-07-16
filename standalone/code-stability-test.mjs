/* Phase 2 — STABLE CODES harness.
 * Mirrors _ensureCodes() + the code-building rule from shared/wrapup.js and
 * asserts a code, once assigned, never shifts on Move / Delete / Break-down /
 * Add. Run: node standalone/code-stability-test.mjs
 * (Kept in lockstep with shared/wrapup.js — if the algorithm there changes,
 *  update this mirror.) */

// ── mirror of _ensureCodes(it) ────────────────────────────────────────────
function ensureCodes(rai) {
  if (!rai || !Array.isArray(rai.userTasks)) return false;
  let changed = false;
  if (typeof rai._codeSeq !== 'number') rai._codeSeq = 0;
  const walk = (node) => {
    const kids = Array.isArray(node.children) ? node.children : null;
    if (!kids || !kids.length) return;
    if (typeof node._childSeq !== 'number') node._childSeq = 0;
    kids.forEach(c => {
      if (typeof c.code !== 'number') { c.code = ++node._childSeq; changed = true; }
      walk(c);
    });
  };
  rai.userTasks.forEach(u => {
    if (typeof u.code !== 'number') { u.code = ++rai._codeSeq; changed = true; }
    walk(u);
  });
  return changed;
}

// ── mirror of the code string the tree builds (letter + stable nums) ───────
function codeOf(letter, task, prefix) {
  const num = (typeof task.code === 'number') ? task.code : '?';
  return prefix ? `${prefix}.${num}` : `${letter}${num}`;
}
// map a top-level task -> its displayed code, plus its children's codes
function codesFor(letter, rai) {
  const out = {};
  const walk = (list, prefix) => list.forEach(t => {
    const c = codeOf(letter, t, prefix);
    out[t.id] = c;
    if (Array.isArray(t.children)) walk(t.children, c);
  });
  walk(rai.userTasks, null);
  return out;
}

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
  ok ? pass++ : fail++;
};

const L = 'D';
const rai = { userTasks: [ {id:'A',text:'A'}, {id:'B',text:'B'}, {id:'C',text:'C'} ] };

// 1) first assignment → D1,D2,D3 in current order
ensureCodes(rai);
eq('initial codes A,B,C = D1,D2,D3', codesFor(L, rai), {A:'D1', B:'D2', C:'D3'});

// 2) MOVE B down (swap B & C positions) — codes ride the objects
[rai.userTasks[1], rai.userTasks[2]] = [rai.userTasks[2], rai.userTasks[1]];
ensureCodes(rai);
eq('after Move B down: B still D2, C still D3', codesFor(L, rai), {A:'D1', C:'D3', B:'D2'});

// 3) DELETE A — remaining keep their codes, counter stays at high-water 3
rai.userTasks = rai.userTasks.filter(t => t.id !== 'A');
ensureCodes(rai);
eq('after Delete A: C=D3, B=D2 (no renumber)', codesFor(L, rai), {C:'D3', B:'D2'});
eq('counter stays at high-water mark 3', rai._codeSeq, 3);

// 4) ADD E — gets the NEXT number (D4), never reuses deleted 1
rai.userTasks.push({id:'E', text:'E'});
ensureCodes(rai);
eq('after Add E: E=D4 (fresh, not reused 1)', codesFor(L, rai)['E'], 'D4');

// 5) BREAK DOWN B → two children D2.1, D2.2
const B = rai.userTasks.find(t => t.id === 'B');
B.children = [ {id:'B1',text:'s1'}, {id:'B2',text:'s2'} ];
ensureCodes(rai);
eq('break down B: children = D2.1, D2.2', [codesFor(L,rai)['B1'], codesFor(L,rai)['B2']], ['D2.1','D2.2']);

// 6) DELETE child B.1, then ADD a child → new child is D2.3 (not reused .1)
B.children = B.children.filter(c => c.id !== 'B1');
B.children.push({id:'B3', text:'s3'});
ensureCodes(rai);
eq('after child delete+add: B2 still D2.2, new B3 = D2.3', [codesFor(L,rai)['B2'], codesFor(L,rai)['B3']], ['D2.2','D2.3']);

// 7) ROADMAP base never collides with stable My-Action codes
const roadmapBase = Math.max(rai.userTasks.length, rai._codeSeq || 0);
const myCodes = Object.values(codesFor(L, rai)).filter(c => !c.includes('.')).map(c => +c.slice(1));
const firstRoadmap = roadmapBase + 1;
eq('roadmap first code is above every My-Action code', firstRoadmap > Math.max(...myCodes), true);

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
