import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { restoreCitadelBoxes } from '../scripts/citadel-template-update.mjs';
import { removeCitadelJoinPadding } from '../scripts/citadel-note-spacing.mjs';
import { removeCitadelClosingCrossbar } from '../scripts/citadel-closing-crossbar.mjs';
import { outlineTopTrough } from '../scripts/top-trough-outline.mjs';

async function fixture(page, identity = 'owner') {
  const user = identity === 'anonymous' ? null : {
    id: '00000000-0000-4000-8000-000000000123',
    email: identity === 'owner' ? 'lscottbutler@gmail.com' : 'member@example.test',
    app_metadata: { role: identity === 'owner' ? 'admin' : 'member' },
    user_metadata: { full_name: 'Review account' }, aud: 'authenticated',
  };
  const blocks = new Map([['intro-note-dashboard', '<p>Citadel opening text — review fixture.</p>']]);
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

for (const viewport of [{ name:'desktop', width:1440, height:1000 }, { name:'mobile', width:390, height:844 }]) {
  test(`Citadel admin boxes edit and return from Admin — ${viewport.name}`, async ({ page }, testInfo) => {
    test.setTimeout(60000);
    const { writes } = await fixture(page);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto('/players/master-player.html?start=citadel', { waitUntil:'domcontentloaded' });
    const top = page.frameLocator('#citadelNoteFrame'), bottom = page.frameLocator('#citadelBottomNoteFrame');
    await expect(top.locator('[data-block="intro-note-dashboard"]')).toContainText('review fixture', { timeout:15000 });
    await expect(bottom.getByRole('button', { name:'Edit CITADEL Box 2' })).toBeVisible();
    await expect(bottom.locator('[data-block="page-note-dashboard-2"]')).toContainText('Empty');
    await page.screenshot({ path:testInfo.outputPath(`citadel-${viewport.name}.png`), fullPage:true });
    const layout = await page.evaluate(() => {
      const b = id => document.getElementById(id).getBoundingClientRect();
      const shell = document.querySelector('.shell');
      const border = parseFloat(getComputedStyle(shell).getPropertyValue('--frame-border'));
      const cap = getComputedStyle(document.querySelector('.cap'),'::before');
      return {
        top:b('citadelNote').bottom, stageTop:b('stage').top, stageBottom:b('stage').bottom,
        bottom:b('citadelBottomNote').top, ratio:b('homeView').width/b('homeView').height,
        side:b('citadelNoteFrame').left - shell.getBoundingClientRect().left,
        topJoin:b('stage').top + border - b('citadelNoteFrame').bottom,
        bottomJoin:b('citadelBottomNoteFrame').top - (b('stage').bottom - border),
        topOuterGap:b('citadelNoteFrame').top - b('citadelNote').top,
        bottomOuterGap:b('citadelBottomNote').bottom - b('citadelBottomNoteFrame').bottom,
        troughJoin:document.querySelector('.deck').getBoundingClientRect().top - b('citadelBottomNoteFrame').bottom,
        troughFill:getComputedStyle(document.querySelector('.deck'),'::before').backgroundColor,
        topTroughBorders:[cap.borderTopWidth,cap.borderRightWidth,cap.borderBottomWidth,cap.borderLeftWidth],
        topTroughBorderColor:cap.borderTopColor,
        topTroughFill:cap.backgroundColor,
      };
    });
    expect(layout.top).toBeLessThanOrEqual(layout.stageTop);
    expect(layout.bottom).toBeGreaterThanOrEqual(layout.stageBottom);
    expect(layout.ratio).toBeCloseTo(16/9,2);
    expect(layout.topJoin).toBeCloseTo(layout.side,1);
    expect(layout.bottomJoin).toBeCloseTo(layout.side,1);
    expect(layout.topOuterGap).toBeCloseTo(12,1);
    expect(layout.bottomOuterGap).toBeCloseTo(0,1);
    expect(layout.troughJoin).toBeCloseTo(0,1);
    expect(layout.topTroughBorders).toEqual(['3px','3px','3px','3px']);
    expect(layout.topTroughBorderColor).toBe('rgb(237, 237, 237)');
    expect(layout.topTroughFill).toBe('rgb(116, 116, 116)');
    await expect(bottom.locator('.ci-admin-page-box')).toHaveCSS('background-color',layout.troughFill);
    await expect(bottom.locator('.ci-admin-page-box-placeholder')).toHaveCSS('color','rgb(255, 255, 255)');
    await expect(top.locator('.ci-admin-page-box')).toHaveCSS('background-color','rgb(242, 242, 242)');
    for (const frame of [top, bottom]) {
      const inset = await frame.locator('.ci-admin-page-box').evaluate(box => {
        const content = box.querySelector('.ci-admin-page-box-content');
        const pen = box.querySelector('.ci-admin-page-box-edit-slot button');
        const shell = box.getBoundingClientRect(), copy = content.getBoundingClientRect(), edit = pen.getBoundingClientRect();
        const mount = box.parentElement.getBoundingClientRect();
        const style = getComputedStyle(box), contentStyle = getComputedStyle(content);
        return {
          outerInset: [shell.top - mount.top, mount.right - shell.right, mount.bottom - shell.bottom, shell.left - mount.left],
          padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
          contentPadding: [contentStyle.paddingTop, contentStyle.paddingRight, contentStyle.paddingBottom, contentStyle.paddingLeft],
          copyLeft: copy.left - shell.left - parseFloat(style.borderLeftWidth),
          copyTop: copy.top - shell.top - parseFloat(style.borderTopWidth),
          penGap: edit.top - copy.bottom,
          penRight: shell.right - parseFloat(style.borderRightWidth) - edit.right,
          penBottom: shell.bottom - parseFloat(style.borderBottomWidth) - edit.bottom,
        };
      });
      expect(inset.outerInset).toEqual([20,20,20,20]);
      expect(inset.padding).toEqual(['20px','20px','20px','20px']);
      for (const side of ['top','right','bottom','left']) {
        await expect(frame.locator('.ci-admin-page-box')).toHaveCSS(`border-${side}-color`,'rgb(173, 20, 87)');
        await expect(frame.locator('.ci-admin-page-box')).toHaveCSS(`border-${side}-width`,'3px');
      }
      expect(inset.contentPadding).toEqual(['0px','0px','0px','0px']);
      expect(inset.copyLeft).toBeCloseTo(20,1);
      expect(inset.copyTop).toBeCloseTo(20,1);
      expect(inset.penGap).toBeGreaterThanOrEqual(12);
      expect(inset.penRight).toBeGreaterThanOrEqual(19.5);
      expect(inset.penBottom).toBeGreaterThanOrEqual(19.5);
    }
    await testInfo.attach('citadel-frame-measurements', { body:JSON.stringify(layout,null,2), contentType:'application/json' });
    await top.getByRole('button', { name:'Edit CITADEL Box 1' }).click();
    await expect(top.getByRole('button', { name:'Edit CITADEL Box 1' })).toBeHidden();
    await top.getByRole('textbox', { name:'Edit administrator text' }).fill('Discard this draft');
    await top.getByRole('button', { name:'Cancel', exact:true }).click();
    expect(writes).toHaveLength(0);
    await expect(top.locator('[data-block="intro-note-dashboard"]')).toContainText('review fixture');
    await bottom.getByRole('button', { name:'Edit CITADEL Box 2' }).click();
    await bottom.getByRole('textbox', { name:'Edit administrator text' }).fill('Saved closing text');
    await bottom.getByRole('button', { name:'Save', exact:true }).click();
    await expect(bottom.locator('[data-block="page-note-dashboard-2"]')).toHaveText('Saved closing text');
    await expect(bottom.getByRole('textbox')).toHaveCount(0);
    expect(writes).toHaveLength(1);
    expect(writes[0].slug).toBe('page-note-dashboard-2');
    await page.getByRole('button', { name:'Open site menu', exact:true }).click();
    await page.getByRole('button', { name:'Admin', exact:true }).click();
    const admin = page.frameLocator('#experienceFrame');
    await expect(admin.locator('#page-admin')).toBeVisible({ timeout:15000 });
    await expect(admin.getByRole('heading', { name:'ADMIN BOXES', exact:true })).toBeVisible();
    await expect(admin.getByText('PAGE TEMPLATE BOXES', { exact:true })).toHaveCount(0);
    await expect(admin.locator('.ci-admin-page-group')).toHaveCount(18);
    await expect(admin.locator('.ci-page-box-admin-entry')).toHaveCount(36);
    await expect(admin.locator('#adminBlock-intro-note-dashboard .admin-block-num')).toHaveText('01.1');
    await expect(admin.locator('#adminBlock-page-note-dashboard-2 .admin-block-num')).toHaveText('01.2');
    await expect(admin.locator('#adminBlock-intro-note-habits .admin-block-num')).toHaveText('03.1');
    await expect(admin.locator('#admin-editor-intro-note-dashboard')).toHaveCSS('background-color','rgb(255, 255, 255)');
    await expect(admin.locator('.ci-admin-ai-controls')).toHaveCSS('background-color','rgb(245, 247, 250)');
    await admin.getByLabel('Find a page', { exact:true }).selectOption('habits');
    await expect(admin.locator('#adminPageHeading-habits')).toBeFocused();
    await admin.getByRole('textbox', { name:'HABITS Box 2', exact:true }).fill('Unsaved navigation draft');
    await admin.getByLabel('Find a page', { exact:true }).selectOption('dashboard');
    await expect(admin.locator('#adminPageHeading-dashboard')).toBeFocused();
    await admin.getByLabel('Find a page', { exact:true }).selectOption('habits');
    await expect(admin.getByRole('textbox', { name:'HABITS Box 2', exact:true })).toHaveText('Unsaved navigation draft');
    expect(writes).toHaveLength(1);
    await admin.locator('#adminPageGroup-habits').screenshot({ path:testInfo.outputPath(`admin-page-pair-${viewport.name}.png`) });
    await admin.getByLabel('Find a page', { exact:true }).selectOption('dashboard');
    const adminFit = await admin.locator('#page-admin').evaluate(el => ({ width:el.clientWidth, scroll:el.scrollWidth }));
    expect(adminFit.scroll).toBeLessThanOrEqual(adminFit.width + 1);
    const adminNote = admin.getByRole('region', { name:'Admin text box', exact:true });
    await expect(adminNote).toContainText('Empty');
    await adminNote.getByRole('button', { name:'Edit admin text box' }).click();
    await adminNote.getByRole('textbox').fill('Discard administrator draft');
    await adminNote.getByRole('button', { name:'Cancel', exact:true }).click();
    expect(writes).toHaveLength(1);
    await adminNote.getByRole('button', { name:'Edit admin text box' }).click();
    await adminNote.getByRole('textbox').fill('Administrator instructions — review fixture.');
    await adminNote.getByRole('button', { name:'Save', exact:true }).click();
    await expect(adminNote.locator('[data-block]')).toHaveText('Administrator instructions — review fixture.');
    expect(writes).toHaveLength(2);
    expect(writes[1].slug).toBe('intro-note-admin-boxes');
    await page.goto('/players/master-player.html?start=admin', { waitUntil:'domcontentloaded' });
    await expect(adminNote.locator('[data-block]')).toHaveText('Administrator instructions — review fixture.', { timeout:15000 });
    await adminNote.screenshot({ path:testInfo.outputPath(`admin-text-box-${viewport.name}.png`) });
    await adminNote.scrollIntoViewIfNeeded();
    await page.screenshot({ path:testInfo.outputPath(`admin-boxes-section-${viewport.name}.png`), fullPage:false });
    await expect(page.locator('#citadelNote')).toBeHidden();
    await expect(page.locator('#citadelBottomNote')).toBeHidden();
    await expect(admin.locator('#admin-editor-intro-note-dashboard')).toContainText('review fixture');
    await expect(admin.locator('#admin-editor-page-note-dashboard-2')).toHaveText('Saved closing text');
    await admin.locator('#admin-editor-page-note-dashboard-2').fill('Updated from Admin');
    await admin.locator('#admin-save-page-note-dashboard-2').click();
    await expect(admin.locator('#admin-status-page-note-dashboard-2')).toContainText('Saved');
    await admin.locator('#adminBlock-intro-note-dashboard').scrollIntoViewIfNeeded();
    await page.screenshot({ path:testInfo.outputPath(`admin-${viewport.name}.png`), fullPage:false });
    await page.getByRole('button', { name:'Open site menu', exact:true }).click();
    await page.getByRole('button', { name:'Citadel', exact:true }).click();
    await expect(bottom.locator('[data-block="page-note-dashboard-2"]')).toHaveText('Updated from Admin', { timeout:15000 });
    expect(writes).toHaveLength(3);
    // The regular workspace boxes share the same border as Citadel's frames.
    await page.getByRole('button', { name:'Open site menu', exact:true }).click();
    await page.getByRole('button', { name:'Habits', exact:true }).click();
    const habitBoxes = page.frameLocator('#experienceFrame').locator('#page-habits .ci-admin-page-box');
    await expect(habitBoxes).toHaveCount(2);
    for (const box of await habitBoxes.all()) {
      await expect(box).toBeVisible();
      await expect(box).toHaveCSS('border-color','rgb(173, 20, 87)');
      await expect(box).toHaveCSS('border-width','3px');
    }
    await habitBoxes.first().screenshot({ path:testInfo.outputPath(`admin-box-habits-${viewport.name}.png`) });
    expect(errors).toEqual([]);
  });
}

for (const identity of ['anonymous','member']) {
  test(`Citadel admin keeps ${identity} access read-only`, async ({ page }) => {
    const { writes } = await fixture(page, identity);
    await page.goto('/players/master-player.html?start=citadel', { waitUntil:'domcontentloaded' });
    const top = page.frameLocator('#citadelNoteFrame');
    await expect(top.locator('[data-block="intro-note-dashboard"]')).toContainText('review fixture', { timeout:15000 });
    await expect(top.getByRole('button', { name:'Edit CITADEL Box 1' })).toBeHidden();
    await expect(page.locator('#citadelBottomNote')).toBeHidden();
    await page.getByRole('button', { name:'Open site menu', exact:true }).click();
    await page.getByRole('button', { name:'Admin', exact:true }).click();
    const admin = page.frameLocator('#experienceFrame');
    await expect(admin.locator('#page-admin')).not.toHaveClass(/active/);
    await expect(admin.getByRole('region', { name:'Admin text box', exact:true })).toHaveCount(0);
    if (identity === 'anonymous') {
      await expect(admin.locator('#authModal.open')).toBeVisible({ timeout:15000 });
      await expect(admin.locator('#btn-signin')).toBeVisible();
      await expect.poll(async () => {
        const frame = await page.locator('#experienceFrame').boundingBox();
        const button = await admin.locator('#btn-signin').boundingBox();
        return !!frame && !!button && button.y + button.height <= frame.y + frame.height;
      }).toBe(true);
    } else {
      await expect(admin.locator('#page-admin-access')).toContainText('does not have administrator access', { timeout:15000 });
    }
    expect(writes).toEqual([]);
  });
}

for (const viewport of [{ name:'desktop', width:1440, height:1000 }, { name:'mobile', width:390, height:844 }]) {
  for (const identity of ['anonymous', 'owner', 'member']) {
    test(`Admin review restores real ${identity} access - ${viewport.name}`, async ({ page }, testInfo) => {
      const { writes } = await fixture(page, identity);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize(viewport);
      await page.goto('/standalone/member-design-test.html');
      await page.locator('#review-menu-trigger').click();
      await page.locator('#review-menu').getByRole('button', { name:'Admin', exact:true }).click();
      const admin = page.frameLocator('#ci-review-frame').frameLocator('#experienceFrame');
      if (identity === 'owner') {
        await expect(admin.getByRole('heading', { name:'ADMIN BOXES', exact:true })).toBeVisible({ timeout:15000 });
      } else if (identity === 'anonymous') {
        await expect(admin.locator('#authModal.open')).toBeVisible({ timeout:15000 });
        await expect(admin.locator('#btn-signin')).toBeVisible();
        await expect.poll(async () => {
          const frame = await page.frameLocator('#ci-review-frame').locator('#experienceFrame').boundingBox();
          const button = await admin.locator('#btn-signin').boundingBox();
          return !!frame && !!button && button.y + button.height <= frame.y + frame.height;
        }).toBe(true);
      } else {
        await expect(admin.locator('#page-admin-access')).toContainText('does not have administrator access', { timeout:15000 });
        await expect(admin.locator('#page-admin')).not.toHaveClass(/active/);
      }
      await expect(page.locator('#feature-title')).toHaveText('Admin');
      await expect(page.locator('.review-note')).toContainText('real sign-in');
      if (identity === 'member') {
        await admin.getByRole('button', {name:'Sign in with the owner account',exact:true}).click();
        await expect(admin.locator('#authModal.open')).toBeVisible();
        await expect(admin.locator('#btn-signin')).toBeVisible();
      }
      if (identity !== 'owner') {
        await expect.poll(async () => {
          const frame=await page.frameLocator('#ci-review-frame').locator('#experienceFrame').boundingBox();
          const button=await admin.locator('#btn-signin').boundingBox();
          return !!frame && !!button && button.y+button.height<=frame.y+frame.height;
        }).toBe(true);
      }
      await page.screenshot({ path:testInfo.outputPath(`admin-${identity}-${viewport.name}.png`), fullPage:true });
      expect(errors).toEqual([]);
      expect(writes).toEqual([]);
    });
  }
}

for (const width of [1440,390]) {
  test(`Admin denied account can sign in as owner ${width}`, async ({ page }) => {
    await fixture(page, 'member');
    await page.setViewportSize({width,height:900});
    await page.goto('/standalone/member-design-test.html?feature=admin');
    const admin=page.frameLocator('#ci-review-frame').frameLocator('#experienceFrame');
    await admin.getByRole('button',{name:'Sign in with the owner account',exact:true}).click();
    const user={id:'00000000-0000-4000-8000-000000000456',email:'lscottbutler@gmail.com',aud:'authenticated',app_metadata:{role:'admin'},user_metadata:{}};
    const exp=Math.floor(Date.now()/1000)+3600;
    const token=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp,aud:'authenticated'})).toString('base64url')+'.fixture';
    await page.route('**/auth/v1/token*', route=>route.fulfill({contentType:'application/json',body:JSON.stringify({access_token:token,refresh_token:'fixture',expires_in:3600,expires_at:exp,token_type:'bearer',user})}));
    await page.route('**/auth/v1/user', route=>route.fulfill({contentType:'application/json',body:JSON.stringify(user)}));
    await admin.locator('#si-email').fill(user.email);
    await admin.locator('#si-pass').fill('synthetic-test-password');
    await admin.locator('#btn-signin').click();
    await expect(admin.getByRole('heading',{name:'ADMIN BOXES',exact:true})).toBeVisible();
    await expect(admin.locator('#authModal')).not.toHaveClass(/open/);
  });
}
