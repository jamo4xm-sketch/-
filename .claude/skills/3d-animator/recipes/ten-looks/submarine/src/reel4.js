// The submarine list reel: one continuous dive, the new look sweeps in from below or from the side. No instant cut anywhere, also not into the end card. Everything is a function of t.
import { makeSheet } from './sheet.js';
import { makeDive } from './dive.js';
const $ = (s, r = document) => r.querySelector(s), el = (c, p, html = '') => { const d = document.createElement('div'); d.className = c; d.innerHTML = html; p.appendChild(d); return d; };
// --- the words (all of them, in one place)
export const NAMES = [['wool', 'Knitted Wool'], ['glass', 'Stained Glass'], ['bronze', 'Bronze'], ['ink', 'Ink Wash'], ['foil', 'Foil Balloon'], ['woodcut', 'Woodcut'], ['ice', 'Ice'], ['oil', 'Oil Paint'], ['lowpoly', 'Low Poly'], ['points', 'Point Cloud']];
const F = 1 / 60, STEP = 1.25, LEN = 18, HALF = LEN / 2 * F, END = 12.45, TOTAL = 15, W = 1008, H = 1788, INK = '#0c0d12', PLUM = '#702C65', OFF = 0.35;
const DIR = NAMES.map((_, i) => (i % 2 ? 'up' : 'left'));   // 1 up, 2 left, 3 up ...
const bez = ([x1, y1, x2, y2], x) => { if (x <= 0) return 0; if (x >= 1) return 1; const b = (a, c, u) => 3 * a * u * (1 - u) ** 2 + 3 * c * u * u * (1 - u) + u ** 3; let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (b(x1, x2, m) < x) lo = m; else hi = m; } return b(y1, y2, (lo + hi) / 2); };
const cl = (x) => Math.min(1, Math.max(0, x)), ramp = (a, b, x) => cl((x - a) / (b - a)), mix = (a, b, k) => a + (b - a) * k;
const bg = makeSheet($('#bg')), gl = document.createElement('canvas'); gl.width = W; gl.height = H; const dv = makeDive(gl, W, H);
const A = $('#ca').getContext('2d'), tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const T = tmp.getContext('2d');
const rows = NAMES.map(([, n], i) => { const r = el('row', $('#list')); r.style.top = `${i * 102}px`; el('num', r, String(i + 1).padStart(2, '0')); r._n = el('name', r, n); return r; });
// --- end card: slot 1 is the big card itself; the other five come in after it. f = [first, last] frame after END, from = where it starts
const SIX = ['wool', 'points', 'woodcut', 'foil', 'lowpoly', 'glass'], IN = [[13, 31, -420, 0], null, [18, 36, 420, 0], [11, 30, 0, 760], [13, 32, 0, 760], [15, 34, 0, 760]];
const minis = SIX.map((k, i) => { if (i === 1) return null; const d = el('mini', $('#end')); d.style.left = `${[54, 391, 728][i % 3]}px`; d.style.top = `${i < 3 ? 168 : 1222}px`; const c = document.createElement('canvas'); c.width = 596; c.height = 1058; d.appendChild(c); d._x = c.getContext('2d'); return d; });
const N = +(new URLSearchParams(location.search).get('n') || 8), card = $('#card'), SH = [[22, 54, .20, 6, 16, .16], [22, 50, .26, 5, 14, .18]];
window.total = TOTAL;
const shot = (k, x, t, n = N, w = W, h = H) => { dv.draw(t, k, n, 0, true); x.globalCompositeOperation = 'copy'; x.drawImage(gl, 0, 0, w, h); x.globalCompositeOperation = 'source-over'; };
window.renderAt = (t) => {
  bg.draw(t, 0, cl((t - END) / 0.5)); const fe = (t - END) / F;   // frames since the end card began
  // which look, or which two
  let i = 0, next = -1, p = 0; for (let j = 1; j < NAMES.length; j++) { const a = j * STEP - HALF; if (t >= a - 1e-6) { if (t < a + 2 * HALF - 1e-6) { i = j - 1; next = j; p = (t - a) / (2 * HALF); } else i = j; } }
  shot(NAMES[i][0], A, t + OFF);
  if (next > 0) { shot(NAMES[next][0], T, t + OFF); const e = bez([.35, 0, .65, 1], p), up = DIR[next] === 'up', L = up ? H : W, f = 6, at = (1 - e) * (L + f) - f / 2, g = up ? T.createLinearGradient(0, at - f / 2, 0, at + f / 2) : T.createLinearGradient(at - f / 2, 0, at + f / 2, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#000'); T.globalCompositeOperation = 'destination-in'; T.fillStyle = g; T.fillRect(0, 0, W, H); T.globalCompositeOperation = 'source-over'; A.drawImage(tmp, 0, 0); }
  // the card: opens, stays, then travels into its place on the end card
  const s = t < 0.27 ? 0.72 + 0.28 * (1 - (1 - t / 0.27) ** 3) : 1, k = bez([.4, 0, .2, 1], ramp(6, 30, fe)); Object.assign(card.style, { left: `${mix(506, 391, k)}px`, top: `${mix(574, 168, k)}px`, width: `${mix(520, 298, k)}px`, height: `${mix(922, 530, k)}px`, borderRadius: `${mix(34, 24, k)}px`, transform: s < 1 ? `scale(${s})` : 'none' });
  const q = SH[0].map((a, z) => mix(a, SH[1][z], k)); card.style.boxShadow = `0 ${q[0]}px ${q[1]}px rgba(18,22,40,${q[2]}), 0 ${q[3]}px ${q[4]}px rgba(18,22,40,${q[5]})`;
  // names: each one appears while its look sweeps in, plum for now, black for done
  rows.forEach((r, j) => { const a = j * STEP - HALF + 9 * F, o = j ? ramp(a, a + 6 * F, t) : 1, nx = j + 1 < NAMES.length ? (j + 1) * STEP - HALF + 9 * F : 99; r._n.style.opacity = o; r._n.style.transform = `translateY(${(1 - o) * 4}px)`; r._n.style.color = t >= nx - 1e-6 ? INK : PLUM; });
  const ot = bez([.4, 0, 1, 1], ramp(0, 9, fe)), ol = bez([.4, 0, 1, 1], ramp(0, 13, fe)); Object.assign($('#title').style, { opacity: 1 - ot, transform: `translateY(${-24 * ot}px)` }); Object.assign($('#list').style, { opacity: 1 - ol, transform: `translateX(${-32 * ol}px)` });
  const on = fe >= 0; $('#end').style.visibility = on ? 'visible' : 'hidden'; const ak = bez([.22, .75, .3, 1], ramp(34, 46, fe)); Object.assign($('#ask').style, { opacity: on ? ak : 0, transform: `translateY(${16 * (1 - ak)}px)` });
  SIX.forEach((n, j) => { if (j === 1) return; if (!on) { minis[j].style.visibility = 'hidden'; return; } const [a, b, x, y] = IN[j], m = bez([.22, .75, .3, 1], ramp(a, b, fe)), d = minis[j]; d.style.transform = `translate(${x * (1 - m)}px, ${y * (1 - m)}px)`; d.style.visibility = fe >= a ? 'visible' : 'hidden'; if (fe >= a) shot(n, d._x, t + OFF + (j + 1) * 0.61, Math.max(2, N >> 1), 596, 1058); });
};
await document.fonts.load('700 100px "Space Grotesk"'); await document.fonts.load('500 40px "Plex"'); await document.fonts.ready;
window.renderAt(0); window.__ready = true;
