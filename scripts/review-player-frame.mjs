import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';

const preflight = process.env.FRAME_COLOR_PREFLIGHT === '1';
const output = 'test-results/player-frame-review';
mkdirSync(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const servers = [false, true].map((modified, i) => createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = resolve('dist', '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(resolve('dist') + '/') || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  let body = readFileSync(file);
  if (preflight && modified && ['/players/master-player.html', '/players/meditation.html'].includes(pathname)) {
    body = Buffer.from(body.toString().replaceAll('#1e90ff', '#292929'));
  }
  res.setHeader('Content-Type', mime[extname(file).toLowerCase()] || 'application/octet-stream');
  res.end(body);
}).listen(8126 + i, '127.0.0.1'));

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const results = [];
  for (const viewport of [{ name: 'desktop', width: 1440, height: 1100 }, { name: 'mobile', width: 390, height: 844 }]) {
    for (const start of ['', 'meditation']) {
      const snapshots = [];
      for (const kind of preflight ? ['before', 'after'] : ['after']) {
        const page = await browser.newPage({ viewport });
        // This review covers frame geometry/color; external services are not needed.
        await page.route('**/*', route => {
          const url = new URL(route.request().url());
          if (url.hostname !== '127.0.0.1') return route.abort();
          return route.continue();
        });
        await page.goto('http://127.0.0.1:' + (kind === 'before' ? 8126 : 8127) + '/players/master-player.html?card=3&preview=1' + (start ? '&start=' + start : ''), { waitUntil: 'networkidle' });
        if (start === 'meditation') await page.frameLocator('#experienceFrame').locator('.ccb-curve rect').waitFor();
        else await page.locator('#inspirationCard').evaluate(el => el.decode());
        const state = await page.evaluate(() => {
          const shell = document.querySelector('.shell'), cap = document.querySelector('.cap'), deck = document.querySelector('.deck'), stage = document.querySelector('.stage');
          const shape = el => ({ box: el.getBoundingClientRect().toJSON(), radius: getComputedStyle(el).borderRadius, padding: getComputedStyle(el).padding, border: getComputedStyle(el).borderWidth });
          return { geometry: [shell, cap, deck, stage].map(shape), frame: getComputedStyle(shell).getPropertyValue('--frame').trim(), header: getComputedStyle(cap).backgroundColor, trough: getComputedStyle(cap, '::before').backgroundColor, deck: getComputedStyle(deck).backgroundColor, meditationStroke: document.querySelector('#experienceFrame').contentDocument?.querySelector('.ccb-curve rect')?.getAttribute('stroke') };
        });
        if (kind === 'after') {
          assert.equal(state.frame, '#292929');
          assert.equal(state.header, 'rgb(41, 41, 41)');
          assert.equal(state.trough, 'rgb(116, 116, 116)');
          if (start === 'meditation') assert.equal(state.meditationStroke, '#292929');
        }
        snapshots.push(state);
        await page.screenshot({ path: output + '/' + (start || 'citadel') + '-' + viewport.name + '-' + kind + '.png', fullPage: true });
        await page.close();
      }
      if (preflight) assert.deepEqual(snapshots[0].geometry, snapshots[1].geometry);
      results.push({ viewport: viewport.name, route: start || 'citadel', preflight, geometryUnchanged: preflight ? true : undefined, state: snapshots.at(-1) });
    }
  }
  writeFileSync(output + '/frame-review.json', JSON.stringify(results, null, 2));
  console.log('Verified charcoal frame on Citadel and Meditation at desktop/mobile sizes' + (preflight ? '; before/after geometry is identical.' : '.'));
} finally {
  await browser?.close();
  servers.forEach(server => server.close());
}
