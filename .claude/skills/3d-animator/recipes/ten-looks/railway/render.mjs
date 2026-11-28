// node render.mjs --page=bg.html --stills=0,1,2 --out=qa/x    |   --video --from=0 --to=4 --fps=60 --out=out/x.mp4
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process'; import puppeteer from 'puppeteer-core';
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const s = a.replace(/^--/, ''), i = s.indexOf('='); return i < 0 ? [s, true] : [s.slice(0, i), s.slice(i + 1)]; }));
const ROOT = path.resolve('.'), MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
const port = server.address().port;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', protocolTimeout: 3600000,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--run-all-compositor-stages-before-draw'] });
const page = await browser.newPage(); await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
page.on('console', (m) => { if (['error', 'warning', 'warn'].includes(m.type())) console.log('[page]', m.text()); }); page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('favicon')) console.log('[404]', r.url()); });
await page.goto(`http://localhost:${port}/${args.page || 'index.html'}?render=1${args.query ? '&' + args.query : ''}`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', { timeout: 120000 }); const total = await page.evaluate('window.total');
const grab = async (t, type = 'png') => { await page.evaluate(async (tt) => { await window.renderAt(tt); await new Promise((r) => requestAnimationFrame(() => r())); }, t);
  return await page.screenshot({ type, optimizeForSpeed: true, captureBeyondViewport: false, ...(type === 'jpeg' ? { quality: 97 } : {}) }); };
if (args.stills) { const out = args.out || 'qa/stills'; fs.mkdirSync(out, { recursive: true }); for (const s of String(args.stills).split(',')) { const t = parseFloat(s); fs.writeFileSync(`${out}/t${t.toFixed(3).padStart(6, '0')}.png`, await grab(t)); } console.log('stills ->', out); }
else { const fps = +(args.fps || 60), from = +(args.from || 0), to = +(args.to || total), n = Math.round((to - from) * fps), outFile = args.out || 'out/video.mp4'; fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709', '-c:v', 'libx264', '-preset', args.preset || 'medium', '-crf', String(args.crf || 14), '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now(); for (let i = 0; i < n; i++) { const b = await grab(from + i / fps); if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r)); if (i % 60 === 0) console.log(`frame ${i}/${n} ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r)); console.log('video ->', outFile, n, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's'); }
await browser.close(); server.close();
