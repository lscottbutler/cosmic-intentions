import test from 'node:test';import assert from 'node:assert/strict';import {createTroughPicker,TROUGH_IDS,attachTrough,visitTroughPage} from '../shared/trough-rotation.js';
test('different pages get different art and revisits never repeat the previous image',()=>{const values=new Map();const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};let n=0;const pick=createTroughPicker(TROUGH_IDS,storage,()=>((n++*17)%100)/100);const pages=Array.from({length:18},(_,i)=>'page'+i);const assigned=new Map(pages.map(p=>[p,pick(p)]));assert.equal(new Set(assigned.values()).size,18);for(let turn=0;turn<100;turn++){const p=pages[turn%18],old=assigned.get(p);assigned.set(p,pick(p));assert.notEqual(assigned.get(p),old);assert.equal(new Set(assigned.values()).size,18);}const again=createTroughPicker(TROUGH_IDS,storage,()=>0);assert.notEqual(again('page0'),assigned.get('page0'));});
test('storage errors and malformed data do not break picking',()=>{const pick=createTroughPicker(TROUGH_IDS,{getItem(){throw Error('blocked')},setItem(){throw Error('full')}},()=>0);assert.notEqual(pick('meditation'),pick('meditation'));assert(TROUGH_IDS.includes(createTroughPicker(TROUGH_IDS,{getItem:()=>'{broken'},()=>0)('gratitude')));});

test('page changes reuse the artwork layer and dissolve for five seconds',()=>{
 const originals={document:globalThis.document,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval,setTimeout:globalThis.setTimeout};
 const timers=[],removed=[],animations=[];let interval=0;
 function element(tag){return {tag,dataset:{},children:[],isConnected:true,classList:{add(){}},setAttribute(){},addEventListener(){},complete:true,appendChild(child){child.parent=this;this.children.push(child)},querySelector(sel){return sel==='img'?this.children.find(c=>c.tag==='img'):null},closest(){return null},get firstElementChild(){return this.children[0]},animate(frames,options){animations.push(options)},remove(){removed.push(this);if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this)}}}
 try{
  globalThis.document={hidden:false,createElement:element};globalThis.setInterval=()=>++interval;globalThis.clearInterval=id=>removed.push(id);globalThis.setTimeout=(callback,ms)=>{timers.push({callback,ms});return timers.length};
  const shell=element('section');visitTroughPage('fade-a');attachTrough(shell,'fade-a');const previous=shell.firstElementChild;
  visitTroughPage('fade-b');attachTrough(shell,'fade-b');assert.equal(shell.children.length,2);assert.equal(shell.children[0],previous);assert.equal(animations.at(-1).duration,5000);assert.equal(timers.at(-1).ms,5000);assert.ok(removed.includes(1),'previous page interval disposed');
  timers.at(-1).callback();assert.equal(shell.children.length,1);shell.ciCarouselDispose();
 }finally{Object.assign(globalThis,originals)}
});
