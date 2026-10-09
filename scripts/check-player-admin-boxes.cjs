const {chromium,expect}=require('@playwright/test');const assert=require('node:assert/strict');
async function fixture(page, identity = 'owner') {
  const user = identity === 'anonymous' ? null : {
    id: '00000000-0000-4000-8000-000000000123',
    email: identity === 'owner' ? 'lscottbutler@gmail.com' : 'member@example.test',
    app_metadata: { role: identity === 'owner' ? 'admin' : 'member' },
    user_metadata: { full_name: 'Review account' }, aud: 'authenticated',
  };
  const blocks = new Map([['intro-note-dashboard', '<p>Citadel opening text â€” review fixture.</p>']]);
  const writes = [];
  // Every service request is intercepted; these tests cannot write live data.
  await page.route('**/*.supabase.co/**', async route => {
    const request = route.request(), url = new URL(request.url());
    const json = data => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    if (url.pathname.endsWith('/auth/v1/user')) return json(user);
    if (url.pathname.endsWith('/auth/v1/logout')) return route.fulfill({ status: 204 });
    if (url.pathname.endsWith('/rest/v1/content_blocks')) {
      if (request.method() === 'POST') {
        const row = request.postDataJSON();
        if (identity !== 'owner') return route.fulfill({ status: 403, contentType: 'application/json', body: '{"message":"Forbidden"}' });
        writes.push(row); blocks.set(row.slug, row.body);
        return json(null);
      }
      const slug = url.searchParams.get('slug')?.replace(/^eq\./, '');
      const rows = [...blocks].filter(([key]) => !slug || key === slug).map(([slug, body]) => ({ slug, body }));
      return json(request.headers().accept?.includes('vnd.pgrst.object') ? (rows[0] || null) : rows);
    }
    return json([]);
  });
  if (user) {
    // Match the app's existing IndexedDB auth adapter. Seed only the isolated
    // browser context, before boot, rather than inventing an app preview owner.
    await page.route('**/__ci_auth_fixture', route => route.fulfill({ contentType:'text/html', body:'<!doctype html><title>Isolated auth fixture</title>' }));
    await page.goto('/__ci_auth_fixture');
    await page.evaluate(async user => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = btoa(JSON.stringify({ alg:'HS256', typ:'JWT' })) + '.' + btoa(JSON.stringify({ sub:user.id, exp, aud:'authenticated' })) + '.fixture';
      const session = JSON.stringify({ access_token:token, refresh_token:'fixture', expires_at:exp, expires_in:3600, token_type:'bearer', user });
      await new Promise((resolve, reject) => {
        const request = indexedDB.open('ci-auth-db', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('kv');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result, transaction = db.transaction('kv','readwrite');
          transaction.objectStore('kv').put(session,'ci-auth');
          transaction.oncomplete = () => { db.close(); resolve(); };
          transaction.onerror = () => reject(transaction.error);
        };
      });
    }, user);
  }
  if (process.env.CITADEL_TEMPLATE_PREFLIGHT === '1') {
    const html = restoreCitadelBoxes(readFileSync('dist/players/master-player.html','utf8'));
    await page.route('**/players/master-player.html*', route => route.fulfill({ contentType:'text/html', body:html }));
  }
  if (process.env.CITADEL_BORDER_PREFLIGHT === '1') {
    const html = removeCitadelJoinPadding(readFileSync('dist/players/master-player.html','utf8'));
    await page.route('**/players/master-player.html*', route => route.fulfill({ contentType:'text/html', body:html }));
  }
  if (process.env.CITADEL_CLOSING_PREFLIGHT === '1') {
    const html = removeCitadelClosingCrossbar(readFileSync('dist/players/master-player.html','utf8'));
    await page.route('**/players/master-player.html*', route => route.fulfill({ contentType:'text/html', body:html }));
  }
  if (process.env.TOP_TROUGH_PREFLIGHT === '1') {
    const html = outlineTopTrough(readFileSync('dist/players/master-player.html','utf8'));
    await page.route('**/players/master-player.html*', route => route.fulfill({ contentType:'text/html', body:html }));
  }
  return { blocks, writes };
}



(async()=>{const browser=await chromium.launch({channel:'chrome'});try{for(const width of [1040,390]){const context=await browser.newContext({baseURL:process.env.CI_PREVIEW_URL||'http://127.0.0.1:8084',viewport:{width,height:1000}});const page=await context.newPage();const {writes}=await fixture(page);await page.goto('/standalone/member-design-test.html?feature=meditation');const master=page.frameLocator('#ci-review-frame');const top=master.frameLocator('#citadelNoteFrame'),bottom=master.frameLocator('#citadelBottomNoteFrame');await expect(top.locator('.ci-admin-page-box-edit')).toBeVisible({timeout:20000});await expect(bottom.locator('.ci-admin-page-box-edit')).toBeVisible();await top.locator('.ci-admin-page-box-edit').click();await top.locator('[contenteditable]').fill('Opening meditation test');await top.getByRole('button',{name:'Save',exact:true}).click();await bottom.locator('.ci-admin-page-box-edit').click();await bottom.locator('[contenteditable]').fill('Closing meditation test');await bottom.getByRole('button',{name:'Save',exact:true}).click();await expect.poll(()=>writes.length).toBe(2);assert.equal(writes.at(-2).slug,'intro-note-meditation');assert.equal(writes.at(-1).slug,'page-note-meditation-2');await page.screenshot({path:'C:/WORK/ROOT/node_modules/.cache/player-boxes-'+width+'.png',fullPage:true});for(const [action,id] of Object.entries({home:'dashboard',goals:'setup','daily-habits':'habits','action-plan':'myroadmap',visualization:'vizlibrary',meditation:'meditation',favorites:'dailyfocus',gratitude:'gratitude',journal:'mynotes',thoughts:'notes',wins:'wins','cosmic-library':'cosmiclibrary','entrepreneur-library':'entcard','ent-card':'entcard','task-notes':'tasknotes','goal-workspace':'goalworkspace',proof:'proof','quickie-move':'entcard'})){await page.evaluate(action=>document.getElementById('ci-review-frame').contentWindow.postMessage({type:'ci-lfm-select',action},location.origin),action);await expect(top.locator('[data-block="intro-note-'+id+'"]')).toBeVisible();await expect(bottom.locator('[data-block="page-note-'+id+'-2"]')).toBeVisible();}console.log('PASS',width,'18 routes: top/bottom visible; correct mocked save slugs');await context.close()}const context=await browser.newContext({baseURL:process.env.CI_PREVIEW_URL||'http://127.0.0.1:8084'});const page=await context.newPage();await fixture(page,'member');await page.goto('/players/master-player.html?start=citadel');await expect(page.frameLocator('#citadelNoteFrame').locator('.ci-admin-page-box-content')).toBeVisible();await expect(page.frameLocator('#citadelNoteFrame').locator('.ci-admin-page-box-edit')).toBeHidden();console.log('PASS member: saved text visible, editing hidden');await context.close()}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});

