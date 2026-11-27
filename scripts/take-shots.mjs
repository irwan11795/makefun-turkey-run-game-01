// take-shots.mjs — render the game's four deterministic ?shot= scenes in
// headless Chromium and save them as 1280x800 JPEGs in screenshots/.
// Real renders of the game's own code, never edited or composited.
// Usage: node scripts/take-shots.mjs  (serves game/ on 127.0.0.1:8091)
import { chromium } from '/home/hatch/workspace/goals/make-fun-bounty-entries/hidden_files/makefun-frontend-01/work/dryrun/node_modules/playwright-core/index.mjs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const ROOT = resolve(fileURLToPath(new URL('../game', import.meta.url)));
const OUT = resolve(fileURLToPath(new URL('../screenshots', import.meta.url)));
const EXE = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
const PORT = 8091;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const path = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const file = resolve(join(ROOT, path));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const SHOTS = [
  { name: '1-play.jpg', shot: 'play' },
  { name: '2-title.jpg', shot: 'start' },
  { name: '3-kitchen.jpg', shot: 'kitchen' },
  { name: '4-end.jpg', shot: 'end' },
];

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

let failed = false;
for (const s of SHOTS) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  const failedReqs = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });
  page.on('requestfailed', (r) => failedReqs.push(r.url() + ' ' + (r.failure()?.errorText || '')));
  const url = `http://127.0.0.1:${PORT}/index.html?shot=${s.shot}&seed=1`;
  await page.goto(url, { waitUntil: 'load', timeout: 15000 });
  await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 5000 });
  await page.waitForTimeout(150);
  const state = await page.evaluate(() => ({
    title: document.title,
    gameError: window.__gameError || null,
  }));
  const path = OUT + '/' + s.name;
  await page.screenshot({ path, type: 'jpeg', quality: 80 });
  const size = fs.statSync(path).size;
  console.log(s.name, size, 'bytes', JSON.stringify(state), 'errors:', JSON.stringify(errors), 'failedReqs:', JSON.stringify(failedReqs));
  if (errors.length || failedReqs.length || state.gameError) failed = true;
  await page.close();
}

await browser.close();
server.close();
if (failed) {
  console.error('SHOT CHECK FAILED: console/page errors or failed requests above');
  process.exit(1);
}
console.log('all shots ok');
