import { makeSheet } from './sheet2.js';
import { makeRocket } from './rocket2.js';
const { gsap } = window, $ = (s, r = document) => r.querySelector(s), el = (c, p, html = '') => { const d = document.createElement('div'); d.className = c; d.innerHTML = html; p.appendChild(d); return d; };
// --- the words (all of them, in one place)
export const NAMES = [['chrome', 'Liquid Chrome'], ['paper', 'Paper Cutout'], ['neon', 'Neon Sign'], ['clay', 'Soft Clay'], ['thermal', 'Heat Map'], ['blueprint', 'Blueprint'], ['shadow', 'Shadow Puppet'], ['voxel', 'Voxel Blocks'], ['synth', 'Synthwave'], ['toon', 'Cartoon Ink']];
const STEP = 1.25, F = 1 / 60, SWAP = NAMES.map((_, i) => i * STEP), END = NAMES.length * STEP + 0.15, TOTAL = 15;
const INK = '#0c0d12', BLUE = '#2457D6';
const stage = $('#stage'), bg = makeSheet($('#bg')), rk = makeRocket($('#rk'), 1008, 1788);
const rows = NAMES.map(([, n], i) => { const r = el('row', $('#list')); r.style.top = `${i * 102}px`; el('num', r, String(i + 1).padStart(2, '0')); return el('name', r, n); });
// --- GSAP owns every DOM move; nothing plays, renderAt seeks
const tl = gsap.timeline({ paused: true });
tl.fromTo('#card', { scale: 0.72 }, { scale: 1, duration: 0.27, ease: 'power3.out' }, 0);
gsap.set(rows, { opacity: 0, color: BLUE });
SWAP.forEach((s, i) => {
  if (i) { tl.to('#card', { scale: 0.91, duration: 7 * F, ease: 'power2.in' }, s - 7 * F); tl.to('#card', { scale: 1, duration: 8 * F, ease: 'power2.out' }, s); }
  tl.fromTo(rows[i], { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.16, ease: 'power2.out', immediateRender: false }, i ? s + 0.07 : 0);
  if (i < NAMES.length) tl.set(rows[i], { color: INK }, (SWAP[i + 1] ?? END) - 2 * F);
});
// --- end card: six of the looks keep flying, the ask in the middle
const SIX = ['neon', 'voxel', 'thermal', 'synth', 'toon', 'paper'], endCv = SIX.map((k, i) => { const d = el('mini', $('#end')); d.style.left = `${[54, 391, 728][i % 3]}px`; d.style.top = `${i < 3 ? 168 : 1222}px`; const c = document.createElement('canvas'); c.width = 596; c.height = 1058; d.appendChild(c); return c; });
gsap.set('.mini', { scale: 0.86 }); gsap.set('#ask', { scale: 0.9, opacity: 0 });   // at rest before their turn, so nothing shows at full size first
tl.set('#main', { autoAlpha: 0 }, END).set('#end', { autoAlpha: 1 }, END);
tl.to('.mini', { scale: 1, duration: 0.3, ease: 'power3.out', stagger: 0.03 }, END).to('#ask', { scale: 1, opacity: 1, duration: 0.26, ease: 'power3.out' }, END);
const Q = new URLSearchParams(location.search), N = +(Q.get('n') || 8);
window.total = TOTAL; window.SWAP = SWAP;
window.renderAt = (t) => {
  tl.seek(Math.min(t, TOTAL), false); bg.draw(t, 0, Math.min(1, Math.max(0, (t - END) / 0.5)));
  if (t < END) { let i = 0; while (i + 1 < SWAP.length && t >= SWAP[i + 1] - 1e-6) i++; rk.draw(t + 0.35, NAMES[i][0], N, 0.12 + t - SWAP[i]); }
  else SIX.forEach((k, i) => { rk.draw(t + 0.35 + i * 0.61, k, Math.max(2, N >> 1), 0.12 + (t - END)); endCv[i].getContext('2d').drawImage($('#rk'), 0, 0, 596, 1058); });
};
await document.fonts.load('700 100px "Space Grotesk"'); await document.fonts.load('500 40px "Plex"'); await document.fonts.ready;
window.renderAt(0); window.__ready = true;
