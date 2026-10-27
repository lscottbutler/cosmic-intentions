import { test, expect } from '@playwright/test';

// Fictional identities and intercepted services only. No production account writes.
const A='00000000-0000-4000-8000-000000000101';
const B='00000000-0000-4000-8000-000000000202';
const origin='http://localhost:8090';
function backend() {
  return { records:new Map([[`${A}:dashboard`,{title:null,body:'Existing private text.'}]]), writes:[], fail:null, delay:0 };
}
async function fixture(browser, db, width=540, actor=A, legacyTitle=null) {
  const context=await browser.newContext({viewport:{width,height:900},baseURL:origin});
  await context.route('**/*',route=>{
    const host=new URL(route.request().url()).hostname;
    return ['localhost','127.0.0.1'].includes(host)?route.continue():route.abort();
  });
  await context.exposeBinding('__ciNotesQuery',async(_source,q)=>{
    if(q.table==='content_blocks'){
      const slug=q.filters.slug;
      const rows=slug?.startsWith('page-instructions-')?[{slug,body:'<p>Existing administrator instructions remain separate.</p>'}]:[];
      return {data:q.one?(rows[0]||null):rows,error:null};
    }
    if(q.table!=='player_personal_notes')return {data:q.one?null:[],error:null};
    if(q.method==='upsert'){
      if(db.delay)await new Promise(resolve=>setTimeout(resolve,db.delay));
      if(db.fail==='throw')throw new Error('Synthetic connection failure');
      if(db.fail)return {data:null,error:{message:'Synthetic save failure'}};
      if(!q.actor || q.row.user_id!==q.actor)return {data:null,error:{message:'Forbidden'}};
      const key=q.row.user_id+':'+q.row.page_id;
      const row={...db.records.get(key),...q.row};
      db.records.set(key,row);db.writes.push({...q.row});
      return {data:row,error:null};
    }
    if(!q.actor || q.filters.user_id!==q.actor)return {data:null,error:null};
    return {data:db.records.get(q.actor+':'+q.filters.page_id)||null,error:null};
  });
  await context.addInitScript(({actor,legacyTitle})=>{
    let user=actor?{id:actor,email:'fixture-member@example.test',aud:'authenticated',app_metadata:{role:'member'},user_metadata:{}}:null;
    const listeners=new Set();
    const session=()=>user?{user,access_token:'synthetic-only',refresh_token:'synthetic-only',expires_at:4102444800}:null;
    if(legacyTitle){try{localStorage.setItem('ci-personal-e-title:'+actor+':dashboard',legacyTitle);}catch(_){}}
    window.__ciSignOutFixture=()=>{user=null;for(const fn of listeners)fn('SIGNED_OUT',null);};
    function query(table){
      const q={table,actor:user?.id||null,method:'select',filters:{},one:false};
      const run=()=>window.__ciNotesQuery({...q});
      const b={
        select(){return b;},eq(k,v){q.filters[k]=v;return b;},in(){return b;},is(){return b;},
        order(){return b;},limit(){return b;},range(){return b;},neq(){return b;},gte(){return b;},
        upsert(row){q.method='upsert';q.row=row;return b;},
        maybeSingle(){q.one=true;return run();},single(){q.one=true;return run();},
        then(resolve,reject){return run().then(resolve,reject);}
      };return b;
    }
    window.supabase={createClient:()=>({
      auth:{
        getUser:async()=>({data:{user},error:null}),
        getSession:async()=>({data:{session:session()},error:null}),
        onAuthStateChange(fn){listeners.add(fn);return {data:{subscription:{unsubscribe(){listeners.delete(fn);}}}};},
        signOut:async()=>{window.__ciSignOutFixture();return {error:null};}
      },from:query,rpc:async()=>({data:[],error:null}),
      storage:{from:()=>({getPublicUrl:()=>({data:{publicUrl:''}})})}
    })};
  },{actor,legacyTitle});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?masterInline=citadel-note&notePage=dashboard',{waitUntil:'domcontentloaded'});
  if(actor)await expect(page.locator('.ci-player-personal-e-box')).toBeVisible({timeout:20000});
  return {context,page,errors};
}
const card=page=>page.locator('.ci-player-personal-e-box');
const title=page=>page.getByRole('textbox',{name:'Personal note title',exact:true});
const body=page=>page.getByRole('textbox',{name:'Your private notes',exact:true});
async function edit(page){await card(page).getByRole('button',{name:/personal notes|private notes/i}).click();await expect(title(page)).toBeVisible();}
async function save(page){await card(page).getByRole('button',{name:'SAVE',exact:true}).click();await expect(title(page)).toHaveCount(0);}

for(const width of [540,351,280])test(`title and note complete lifecycle at ${width}px`,async({browser},info)=>{
  test.setTimeout(90000);
  const db=backend();const first=await fixture(browser,db,width,A,'Previously chosen title');
  const {page}=first;
  await expect(card(page)).toContainText('Existing private text.');
  await expect(card(page)).toContainText('Previously chosen title');
  await edit(page);
  await title(page).fill('My focus for today');
  await body(page).fill('Keep the note visible after saving.\nA second line.');
  await page.screenshot({path:info.outputPath(`editing-${width}.png`),fullPage:true});
  await save(page);
  await expect(card(page)).toContainText('My focus for today');
  await expect(card(page)).toContainText('Keep the note visible after saving.');
  expect(db.writes).toHaveLength(1);
  expect(db.writes[0].title).toBe('My focus for today');
  await expect(page.locator('.ci-player-owner-instructions')).toContainText('Existing administrator instructions');
  expect(await page.evaluate(()=>localStorage.getItem('ci-personal-e-title:'+ '00000000-0000-4000-8000-000000000101'+':dashboard'))).toBeNull();
  await page.reload();await expect(card(page)).toContainText('My focus for today');
  await edit(page);await title(page).fill('Discarded title');await body(page).fill('Discarded body');
  await card(page).getByRole('button',{name:'CANCEL',exact:true}).click();
  await expect(card(page)).toContainText('My focus for today');expect(db.writes).toHaveLength(1);
  await edit(page);await title(page).fill('Hidden unsaved title');
  await card(page).getByRole('button',{name:'Hide private notes and show only the small blue E',exact:true}).click();
  await expect(card(page)).toHaveClass(/ci-personal-e-collapsed/);
  expect(db.writes).toHaveLength(1);
  await page.screenshot({path:info.outputPath(`hidden-${width}.png`),fullPage:true});
  await page.reload();await expect(card(page)).toHaveClass(/ci-personal-e-collapsed/);
  await edit(page);await expect(title(page)).toHaveValue('My focus for today');
  await expect(body(page)).toHaveValue('Keep the note visible after saving.\nA second line.');
  await save(page);await expect(card(page)).not.toHaveClass(/ci-personal-e-collapsed/);
  await page.screenshot({path:info.outputPath(`saved-${width}.png`),fullPage:true});
  const geometry=await card(page).evaluate(el=>{
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    return {left:r.left,right:r.right,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,background:s.backgroundColor};
  });
  expect(geometry.left).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(geometry.width+1);
  expect(geometry.overflow).toBe(false);expect(geometry.background).toBe('rgb(242, 242, 242)');
  // Second independent browser profile: no shared localStorage, same cloud record.
  const second=await fixture(browser,db,width,A);
  await expect(card(second.page)).toContainText('My focus for today');
  await expect(card(second.page)).toContainText('Keep the note visible after saving.');
  expect(await second.page.evaluate(()=>localStorage.getItem('ci-personal-e-title:00000000-0000-4000-8000-000000000101:dashboard'))).toBeNull();
  expect(first.errors).toEqual([]);expect(second.errors).toEqual([]);
  await first.context.close();await second.context.close();
});

test('failed saves preserve drafts; empty/default, long and unsafe text are safe',async({browser},info)=>{
  test.setTimeout(90000);
  const db=backend();const {context,page,errors}=await fixture(browser,db,351);
  await edit(page);await title(page).fill('Unsent title');await body(page).fill('Unsent body');
  for(const failure of ['error','throw']){
    db.fail=failure;await card(page).getByRole('button',{name:'SAVE',exact:true}).click();
    await expect(card(page).getByRole('status')).toContainText('Could not save');
    await expect(title(page)).toHaveValue('Unsent title');await expect(body(page)).toHaveValue('Unsent body');
    await expect(card(page).getByRole('button',{name:'SAVE',exact:true})).toBeEnabled();
    expect(db.writes).toHaveLength(0);
  }
  db.fail=null;await save(page);await expect(card(page)).toContainText('Unsent title');
  await edit(page);await title(page).fill('');await save(page);await expect(card(page)).toContainText('MY PERSONAL NOTES');
  await edit(page);await title(page).fill('A'.repeat(80));await body(page).fill('<script>window.unwanted=true</script>\n'+'LONG'.repeat(120));await save(page);
  await expect(card(page)).toContainText('A'.repeat(80));
  expect(await page.evaluate(()=>window.unwanted)).toBeUndefined();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('long-title-mobile.png'),fullPage:true});
  expect(errors).toEqual([]);await context.close();
});

test('member/page isolation and logout clear private text',async({browser})=>{
  test.setTimeout(90000);
  const db=backend();db.records.set(`${A}:dashboard`,{title:'Member A private title',body:'Member A private note'});
  const a=await fixture(browser,db,540,A);await expect(card(a.page)).toContainText('Member A private title');
  await a.page.evaluate(()=>window.ciSetCitadelNotePage('habits'));
  await expect(card(a.page)).toContainText('MY PERSONAL NOTES');await expect(card(a.page)).not.toContainText('Member A');
  await edit(a.page);await title(a.page).fill('Habits title');await body(a.page).fill('Habits note');await save(a.page);
  expect(db.records.get(`${A}:dashboard`).title).toBe('Member A private title');
  const b=await fixture(browser,db,540,B);await expect(card(b.page)).not.toContainText('Member A');await expect(card(b.page)).not.toContainText('Habits note');
  await a.page.evaluate(()=>window.__ciSignOutFixture());
  await expect(card(a.page)).toBeHidden();await expect(a.page.getByText('Habits note',{exact:true})).toHaveCount(0);
  const guest=await fixture(browser,db,540,null);await expect(card(guest.page)).toHaveCount(0);
  await a.context.close();await b.context.close();await guest.context.close();
});

test('late save cannot replace another page and cloud storage works when local writes fail',async({browser})=>{
  test.setTimeout(90000);const db=backend();const {context,page,errors}=await fixture(browser,db,351);
  await edit(page);await title(page).fill('Cloud title');await body(page).fill('Cloud body');
  await page.evaluate(()=>{Storage.prototype.removeItem=()=>{throw new Error('Local storage blocked');};});
  await save(page);await expect(card(page)).toContainText('Cloud title');
  await edit(page);await title(page).fill('Saving original page');db.delay=500;
  await card(page).getByRole('button',{name:'SAVE',exact:true}).click();
  await expect(title(page)).toBeDisabled();
  await page.evaluate(()=>window.ciSetCitadelNotePage('habits'));
  await expect(card(page)).not.toContainText('Saving original page');
  await page.waitForTimeout(800);
  await expect(card(page)).not.toContainText('Saving original page');
  expect(db.records.get(`${A}:dashboard`).title).toBe('Saving original page');
  expect(errors).toEqual([]);await context.close();
});

for(const width of [1440,390])test(`real member wrapper integrates title editor at ${width}px`,async({browser},info)=>{
  test.setTimeout(90000);const db=backend();db.records.set(`${A}:dashboard`,{title:'My user-set heading',body:'A calm plan for today.'});
  const {context,page,errors}=await fixture(browser,db,width);
  await page.goto('/standalone/member-design-test.html?feature=home',{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#header-admin-note-frame');
  const note=frame.locator('.ci-player-personal-e-box');
  await expect(note).toContainText('My user-set heading',{timeout:30000});
  await note.getByRole('button',{name:/Edit personal notes/i}).click();
  await expect(frame.getByRole('textbox',{name:'Personal note title'})).toBeVisible();
  await frame.getByRole('textbox',{name:'Personal note title'}).fill('My renamed heading');
  await note.getByRole('button',{name:'SAVE',exact:true}).click();
  await expect(note).toContainText('My renamed heading');
  await expect(frame.getByRole('textbox',{name:'Personal note title'})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:info.outputPath(`member-wrapper-${width}.png`),fullPage:true});
  expect(errors).toEqual([]);await context.close();
});
