import { test, expect } from '@playwright/test';

async function offline(page) {
  await page.addInitScript(() => {
    const query=new Proxy({}, {get:(_,name)=>name==='then'?resolve=>Promise.resolve({data:[],error:null}).then(resolve):()=>query});
    window.supabase={createClient:()=>({from:()=>query,auth:{getUser:async()=>({data:{user:null}}),getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},channel:()=>query,removeChannel(){},storage:{from:()=>query}})};
  });
  await page.route('**/*.supabase.co/**', r=>r.fulfill({contentType:'application/json',body:'[]'}));
  await page.route('**/*', r=>{
    const req=r.request(),u=new URL(req.url());
    if(req.resourceType()==='document'&&['127.0.0.1','localhost'].includes(u.hostname)&&!u.searchParams.has('ent'))return r.fulfill({contentType:'text/html',body:'<!doctype html><body></body>'});
    return r.fallback();
  });
}
for(const width of [1440,390])test(`Action cards keep notes/journal, goals and existing actions — ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  await offline(page);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url='/players/master-player.html?start=ent-card&ent=STRONG%20WORK%20ETHIC&preview=1';
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const f=page.frameLocator('#experienceFrame');
  const tabs=f.getByRole('tablist',{name:'Entrepreneur learning sections',exact:true});
  await tabs.getByRole('tab',{name:'ACTION',exact:true}).click();
  const first=f.locator('.ent-steps .action-task-card').first();
  await expect(f.locator('.ent-steps .action-task-card')).toHaveCount(6);
  await first.getByRole('button',{name:'Edit note',exact:true}).click();
  await first.getByRole('textbox',{name:'Note for this action',exact:true}).fill('Prepare a quiet workspace.');
  await first.getByRole('button',{name:'Save note',exact:true}).click();
  await first.getByRole('button',{name:'Edit journal',exact:true}).click();
  await first.getByRole('textbox',{name:'Journal for this action',exact:true}).fill('Starting felt easier today.');
  await first.getByRole('button',{name:'Save journal',exact:true}).click();
  await first.locator('input[type=checkbox]').check();
  await first.getByRole('button',{name:'Priority for this action'}).click();
  await f.locator('[data-goal]').selectOption('pv1');
  await expect(first).toContainText('No note yet.');
  await expect(first.locator('input[type=checkbox]')).not.toBeChecked();
  await f.locator('[data-goal]').selectOption('');
  await expect(first).toContainText('Prepare a quiet workspace.');
  await expect(first).toContainText('Starting felt easier today.');
  await expect(first.locator('input[type=checkbox]')).toBeChecked();
  await expect(first.getByRole('button',{name:'Priority for this action'})).toHaveAttribute('aria-pressed','true');
  await f.locator('#ent-action-note').fill('Protect my first work session.');
  await f.getByRole('button',{name:'Save my next step',exact:true}).click();
  const custom=f.locator('.ent-action-list .action-task-card').first();
  await custom.getByRole('button',{name:'Edit note',exact:true}).click();
  await custom.getByRole('textbox',{name:'Note for this action',exact:true}).fill('Bring a notebook.');
  await custom.getByRole('button',{name:'Save note',exact:true}).click();
  await custom.locator('[data-complete-action]').check();
  await page.reload({waitUntil:'domcontentloaded'});
  await tabs.getByRole('tab',{name:'ACTION',exact:true}).click();
  await expect(first).toContainText('Starting felt easier today.');
  await expect(custom).toContainText('Bring a notebook.');
  await expect(custom.locator('[data-complete-action]')).toBeChecked();
  await first.getByRole('button',{name:'Hide suggested action'}).click();
  await expect(f.locator('.ent-steps .action-task-card')).toHaveCount(5);
  await f.getByRole('button',{name:'Restore hidden suggestions'}).click();
  await expect(f.locator('.ent-steps .action-task-card')).toHaveCount(6);
  // A blocked write keeps the draft and the earlier saved text.
  await f.locator('#entExperience').evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.endsWith(':task-details'))throw Error('blocked');return original.call(this,k,v);};});
  await first.getByRole('button',{name:'Edit note',exact:true}).click();
  await first.getByRole('textbox',{name:'Note for this action',exact:true}).fill('Keep this unsaved draft.');
  await first.getByRole('button',{name:'Save note',exact:true}).click();
  await expect(first.getByRole('textbox',{name:'Note for this action',exact:true})).toHaveValue('Keep this unsaved draft.');
  await expect(f.locator('[data-status=action]')).toContainText('Could not save');
  await first.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(first).toContainText('Prepare a quiet workspace.');
  expect(await f.locator('#entExperience').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
  await f.locator('#ent-panel-action').screenshot({path:`/tmp/ci-action-cards-${width}.png`});
  await tabs.getByRole('tab',{name:'MY NOTES',exact:true}).click();
  await expect(f.locator('.ent-saved-list')).toContainText('Protect my first work session.');
  expect(errors).toEqual([]);
});
