import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { restoreCitadelBoxes } from '../scripts/citadel-template-update.mjs';

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
      return { top:b('citadelNote').bottom, stageTop:b('stage').top, stageBottom:b('stage').bottom, bottom:b('citadelBottomNote').top, ratio:b('homeView').width/b('homeView').height };
    });
    expect(layout.top).toBeLessThanOrEqual(layout.stageTop);
    expect(layout.bottom).toBeGreaterThanOrEqual(layout.stageBottom);
    expect(layout.ratio).toBeCloseTo(16/9,2);
    await top.getByRole('button', { name:'Edit CITADEL Box 1' }).click();
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
    await expect(page.locator('#citadelNote')).toBeHidden();
    await expect(page.locator('#citadelBottomNote')).toBeHidden();
    await expect(admin.locator('#admin-editor-intro-note-dashboard')).toContainText('review fixture');
    await expect(admin.locator('#admin-editor-page-note-dashboard-2')).toHaveText('Saved closing text');
    await admin.locator('#admin-editor-page-note-dashboard-2').fill('Updated from Admin');
    await admin.locator('#admin-save-page-note-dashboard-2').click();
    await expect(admin.locator('#admin-status-page-note-dashboard-2')).toContainText('Saved');
    await admin.locator('#adminBlock-intro-note-dashboard').scrollIntoViewIfNeeded();
    await page.screenshot({ path:testInfo.outputPath(`admin-${viewport.name}.png`), fullPage:true });
    await page.getByRole('button', { name:'Open site menu', exact:true }).click();
    await page.getByRole('button', { name:'Citadel', exact:true }).click();
    await expect(bottom.locator('[data-block="page-note-dashboard-2"]')).toHaveText('Updated from Admin', { timeout:15000 });
    expect(writes).toHaveLength(2);
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
