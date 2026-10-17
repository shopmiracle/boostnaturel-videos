// Rendu image par image de scene.html (Chromium sans écran) vers MP4 via ffmpeg.
// Usage : node render.mjs <sortie.mp4> <cfg> [frames séparées par des virgules pour un test JPG]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire('/home/claude/.npm-global/lib/node_modules/');
const { chromium } = require('playwright');

const WWW = path.join(path.dirname(new URL(import.meta.url).pathname), 'www');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(WWW, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(WWW) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(8765);

const out = process.argv[2], test = process.argv[4];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('http://127.0.0.1:8765/scene.html?cfg=' + process.argv[3]);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
const N = await page.evaluate(() => window.__N);
fs.writeFileSync(out.replace(/\.[^.]+$/, '') + '.bounces.json', JSON.stringify(await page.evaluate(() => window.__bounces)));

if (test) {
  for (const f of test.split(',').map(Number)) {
    const t0 = Date.now();
    const url = await page.evaluate(i => window.renderFrame(i, 0.9), f);
    fs.writeFileSync(`${out}.f${f}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
    console.log('frame', f, Date.now() - t0, 'ms');
  }
} else {
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < N; f++) {
    const url = await page.evaluate(i => window.renderFrame(i), f);
    if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`frame ${f}/${N} ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close(); server.close();
