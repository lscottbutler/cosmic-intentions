import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const wrapper=await readFile('standalone/member-design-test.js','utf8');
const app=await readFile('app.js','utf8');
const transition=wrapper.slice(wrapper.indexOf(" const contentCard=document.querySelector('.member-player-columns');"),wrapper.indexOf(' function navigateFeature(action){'));
for(const reduced of [false,true]){
 const navigated=[],animations=[];
 const card={style:{opacity:1},inert:false,attrs:{},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},animate(frames,opts){animations.push({frames,opts});return {finished:Promise.resolve(),cancel(){}}}};
 let page='goals';
 const doc={readyState:'complete',URL:'https://example.test/players/master-player.html',getElementById(){return {contentDocument:{querySelector(sel){return sel===`#page-${page}.active`?{}:null}}}}};
 const ctx=vm.createContext({document:{querySelector:()=>card},frame:{contentDocument:doc},features:{goals:[],journal:[]},inlinePages:{goals:'goals',journal:'journal'},navigateFeature:a=>{navigated.push(a);page=a},getComputedStyle:()=>({opacity:card.style.opacity}),matchMedia:()=>({matches:reduced}),URL,performance,setTimeout});
 vm.runInContext(transition+';globalThis.open=openFeature;',ctx);
 await ctx.open('goals');assert.equal(card.style.opacity,1);assert.equal(card.inert,false);assert.equal(card.attrs['aria-busy'],undefined);
 await Promise.all([ctx.open('goals'),ctx.open('journal')]);assert.equal(navigated.at(-1),'journal');assert.equal(card.style.opacity,1);assert.equal(card.inert,false);
 if(reduced)assert.equal(animations.length,0);else assert.ok(animations.some(a=>a.opts.duration===180)&&animations.some(a=>a.opts.duration===300));
}
console.log('PASS lower-card fade, rapid navigation cancellation, ready state and reduced motion');
let children=[],pending=[],writes=0;
function element(){return {style:{},dataset:{},setAttribute(){},appendChild(el){(this.children??=[]).push(el)},getBoundingClientRect:()=>({height:220}),querySelector:()=>({style:{}})}}
const body={style:{},replaceChildren(...els){children=els},appendChild(el){if(!children.includes(el))children.push(el)}};
const document={body,documentElement:{style:{}},querySelector:()=>children.find(el=>'citadelHeaderMount' in (el.dataset||{})),getElementById:id=>children.find(el=>el.id===id),createElement:element};
const query=()=>({select(){return this},eq(){return this},maybeSingle(){return new Promise(resolve=>pending.push(resolve))}});
const ctx=vm.createContext({document,location:{search:'?notePage=dashboard',origin:'https://example.test'},URLSearchParams,ADMIN_PAGE_BOXES:{dashboard:{},setup:{},journal:{}},_adminPageBoxSlug:(p,n)=>p+n,visitTroughPage(){},ensureAdminPageBoxStyles(){},sb:{from:query,auth:{getUser:async()=>({data:{user:null}})}},window:{parent:{postMessage(){}},ResizeObserver:class{observe(){}disconnect(){}}},ResizeObserver:class{observe(){}disconnect(){}},_blockCache:{},currentUser:null,_buildLiveAdminPageBox:(page,cfg,n)=>Object.assign(element(),{page,number:n}),_previewActive:()=>false,console});
const start=app.indexOf('let citadelNoteRenderVersion =');const end=app.indexOf('\nexport async function init()',start);
vm.runInContext(app.slice(start,end)+';globalThis.render=initCitadelNoteFrame;',ctx);
const flush=()=>{const list=pending;pending=[];for(const done of list)done({data:{body:'fixture'},error:null})};
const initial=ctx.render();flush();await initial;const old=children[0];assert.equal(old.children[0].page,'dashboard');
const first=ctx.render('setup');assert.equal(children[0],old,'old header remains while reads are pending');const earlier=pending;pending=[];
const second=ctx.render('journal');flush();await second;assert.equal(children[0].children[0].page,'journal');
for(const done of earlier)done({data:{body:'older'},error:null});await first;assert.equal(children[0].children[0].page,'journal','stale response cannot replace latest page');assert.equal(typeof ctx.window.ciSetCitadelNotePage,'function');
assert.equal(writes,0);
console.log('PASS header stays mounted during queries, page-scoped replacement, newest response wins; no writes');
