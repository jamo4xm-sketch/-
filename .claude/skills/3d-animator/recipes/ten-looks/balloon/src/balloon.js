// The balloon: a striped hot-air balloon rising past the terracotta roofs of a terraced hill town on a clear morning, low sun from the left.
// Near: cropped roofs, chimney pots and a string of bunting from the lower left. Middle: the balloon just right of centre; once every 1.25 s the burner
// flares (peak at 0.975 + k*1.25, the middle of a look, never inside a wipe) and the balloon surges up. Far: pale row houses on terraces climbing the
// opposite slope, a bell tower, cypresses, a second balloon far off. The camera is locked. Pure function of t; every motion lives in geometry and
// transforms (never in a material), because every look swaps the materials. The flare reaches the looks through SKY.flare (one shared uniform).
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { V, hash, surf, ball, rbox, blade } from './shapes3.js';
import { setStyle, SKY } from './styles6.js';
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
const TAU = Math.PI * 2, ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
export const LOOKS = ['lit'];
export const C = { sky: '#9fbfdc', hill: '#8796ab', hill2: '#a3b0c2', ground: '#a39a72', terrace: '#cdbb9c', wall: '#efe4d0', wall2: '#ead3b4', wall3: '#f3ebdc', wall4: '#e9c9a6',
  roof: '#b65a3b', roof2: '#a44c33', chimney: '#dccbb2', pot: '#a85a3a', window: '#2b333e', door: '#5a3e2c', shutter: '#5d7a66', shutter2: '#7a4c3a', env: '#c63f2e', env2: '#efe6d2',
  skirt: '#3b3633', rope: '#6b5a48', basket: '#9a7448', burner: '#34343a', flame: '#ffb24e', pennant: '#d14b3a', string: '#5a5048', tree: '#55703f', cypress: '#34482c', trunk: '#5a4636', stone: '#cdbd9f', bird: '#2a2a2e' };

// ---------- the ground. The far side climbs away in terraces to a crest that is high on the left and low on the right; plateau i runs from z = -1.05 - 0.5 i
// back to -1.5 - 0.5 i, its front edge is a retaining wall from P(i - 1) up to P(i). Our side (z > -0.3) is a gentle rise under the mid houses.
const crestY = (x) => 0.72 - 0.48 * x;
const sl = (z) => { const u = Math.min(1, Math.max(0, (-0.9 - z) / 5.3)); return 1 - Math.pow(1 - u, 1.6); };
export const P = (i, x) => (i < 0 ? 0.05 : 0.05 + (Math.max(0.12, crestY(x)) - 0.05) * sl(-1.25 - 0.5 * i));
const farStep = (x, z) => { if (z < -6.05) return P(9, x) - 1.2 * (-6.05 - z); const f = -(z + 1.0) / 0.5, i = Math.floor(f), fr = f - i; return i < 0 ? 0.05 : P(i - 1, x) + (P(i, x) - P(i - 1, x)) * ss(0.0, 0.1, fr); };
const ourY = (z) => 0.30 + 0.30 * ss(0.0, 3.0, z);
export const gY = (x, z) => { const k = ss(-0.62, -0.22, z); return farStep(x, z) * (1 - k) + ourY(z) * k + 0.010 * Math.sin(x * 3.1 + z * 2.3) * k; };
export const rowZ = (i) => -1.32 - 0.5 * i;
// ---------- the burner: flare(t) peaks at 0.975 + k*1.25; the rise is continuous, slow, and surges for 0.7 s after each flare
const TF = 0.975, WIN = 1.25;
export const flare = (t) => { const q = (((t - TF + 0.3) % WIN) + WIN) % WIN - 0.3; return ss(-0.13, -0.02, q) * (1 - ss(0.05, 0.48, q)); };
const lift = (t) => { const u = (t - TF) / WIN, a = 0.6; return (1 - a) * u + a * (Math.floor(u) + ss(0, 0.55, u - Math.floor(u))); };
const BX = 0.10, BZ = 0.62, M0 = 0.82, KR = 0.034;   // at t = 0.35 the basket hides behind the ridge in front; it clears it within a few flares
export const mouthY = (t) => M0 + KR * (lift(t) - lift(0.35));

export function makeBalloon(canvas, W, H) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }), accum = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
  const scene = new THREE.Scene(); scene.background = new THREE.Color(C.sky);
  const mats = new Map(), M = (c, rough = 0.6, side = THREE.FrontSide, glow = 0) => { const id = c + rough + side + glow; if (!mats.has(id)) mats.set(id, new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0, side, emissive: glow ? c : '#000000', emissiveIntensity: glow })); return mats.get(id); };
  // tags: part = its role (the looks dress by part), layer = parts that share an outline
  const add = (g, col, par, d = {}) => { const o = new THREE.Mesh(g, M(col, d.rough ?? 0.6, d.two ? THREE.DoubleSide : THREE.FrontSide, d.glow ?? 0)); o.castShadow = o.receiveShadow = true; Object.assign(o.userData, { kind: 'obj', col, ...d }); par.add(o); return o; };
  const grp = (par, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(rx, ry, rz); par.add(g); return g; };
  const lumpy = (r, seed, sq = 0.9) => surf((u, v, q) => { const th = v * Math.PI, ph = u * TAU, s = Math.sin(th), k = r * (1 + 0.14 * Math.sin(3 * ph + seed) * s + 0.10 * Math.sin(2 * th + 5 * ph + seed * 2) * s + 0.06 * Math.sin(7 * ph - 3 * th + seed) + 0.03 * Math.sin(13 * ph + 7 * th + seed * 3) * s); return q.set(k * s * Math.sin(ph), k * sq * Math.cos(th), k * s * Math.cos(ph)); }, 28, 18);
  // camera: locked
  const camera = new THREE.PerspectiveCamera(27, W / H, 0.05, 60), CAM = V(0, 1.30, 4.2), LOOK = V(0.05, 1.15, 0); camera.position.copy(CAM); camera.lookAt(LOOK); camera.updateMatrixWorld(true);
  const inView = (x, y, z, m = 0.12) => { const p = V(x, y, z).project(camera); return Math.abs(p.x) < 1 + m && Math.abs(p.y) < 1 + m && p.z < 1; };

  // ---------- sky and one hazy distant ridge (behind the low right end of the crest)
  const sky = add(surf((u, v, o) => o.set((u - 0.5) * 44.0, 16.0 - v * 22.0, 0), 2, 2, { closed: false, flip: true }), C.sky, scene, { kind: 'back', part: 'sky' }); sky.position.z = -22.0; sky.castShadow = sky.receiveShadow = false;

  // ---------- the ground and the retaining walls of the far terraces
  const land = add(surf((u, v, o) => { const x = -4.0 + 8.0 * u, z = -8.0 + 11.4 * v; return o.set(x, gY(x, z), z); }, 200, 460, { closed: false, flip: true }), C.ground, scene, { part: 'ground' });
  land.castShadow = false;
  for (let i = 0; i <= 9; i++) { const z = -1.0 - 0.5 * i + 0.003; add(surf((u, v, o) => { const x = -3.5 + 7.0 * u, y0 = P(i - 1, x) - 0.05, y1 = P(i, x) + 0.008; return o.set(x, y0 + (y1 - y0) * v, z); }, 140, 2, { closed: false }), C.terrace, scene, { part: 'terrace', two: true }).castShadow = false; }

  // ---------- houses. A walled house = gable walls (an extruded pentagon, the ridge along x, the long walls facing +-z) + two roof slabs; a row house = a box + a roof prism.
  const WALLS = [C.wall, C.wall2, C.wall3, C.wall4], ROOFS = [C.roof, C.roof2];
  const winG = [], shutG = [];   // far windows are merged into one mesh per family
  function gable(par, len, dep, h, rh, col, rcol, { chim = 0, pot = true, door = false, wins = 2, shut = false, floors = 1, ovh = 0.014 } = {}) {
    const s = new THREE.Shape(); s.moveTo(-dep / 2, 0); s.lineTo(dep / 2, 0); s.lineTo(dep / 2, h); s.lineTo(0, h + rh); s.lineTo(-dep / 2, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 2 }); g.translate(0, 0, -len / 2); g.rotateY(Math.PI / 2);
    add(g, col, par, { part: 'wall' });
    const ang = Math.atan2(rh, dep / 2), L = Math.hypot(dep / 2, rh) + ovh;
    for (const sgn of [-1, 1]) { const o = add(rbox(len + 2 * ovh, 0.012, L, 12, 72, 40), rcol, par, { part: 'roof' }); o.position.set(0, h + rh / 2 + 0.004 - ovh * Math.sin(ang) * 0.5, sgn * (dep / 4 + ovh * Math.cos(ang) * 0.5)); o.rotation.x = sgn * ang; }
    add(blade([V(-len / 2 - ovh, h + rh + 0.006, 0), V(len / 2 + ovh, h + rh + 0.006, 0)], 0.0075, 0.0075, { nu: 10, nv: 16, cap: 0.0, up: V(0, 1, 0) }), rcol, par, { part: 'roof' });
    if (chim) { const cx = chim * len * 0.3, cz = -dep * 0.16, ch = add(rbox(0.030, rh + 0.07, 0.030, 12, 32, 20), C.chimney, par, { part: 'chimney' }); ch.position.set(cx, h + rh * 0.55 + 0.035, cz);
      if (pot) { const p = add(surf((u, v, o) => { const a = u * TAU, r = 0.0085 - 0.0022 * v + 0.0015 * Math.sin(v * Math.PI); return o.set(r * Math.sin(a), v * 0.026, r * Math.cos(a)); }, 16, 6, { closed: false, flip: false }), C.pot, par, { part: 'pot', two: true }); p.position.set(cx, h + rh * 0.55 + 0.035 + (rh + 0.07) / 2, cz); } }
    const dz = dep / 2 + 0.0025, ww = 0.022, wh = 0.030;
    for (let f = 0; f < floors; f++) for (let k = 0; k < wins; k++) { const x = (k - (wins - 1) / 2) * (len / wins), y = h * (f + 0.6) / floors; if (door && f === 0 && k === 0) continue;
      const o = add(rbox(ww, wh, 0.006, 8, 10, 8), C.window, par, { part: 'window' }); o.position.set(x, y, dz);
      if (shut) for (const sx of [-1, 1]) { const q = add(rbox(ww * 0.55, wh * 1.04, 0.004, 8, 8, 8), shut === 2 ? C.shutter2 : C.shutter, par, { part: 'shutter' }); q.position.set(x + sx * ww * 0.85, y, dz + 0.0015); } }
    if (door) { const o = add(rbox(0.026, 0.046, 0.006, 8, 10, 8), C.door, par, { part: 'door' }); o.position.set(-(wins - 1) / 2 * (len / wins), 0.023, dz); }
  }
  function rowHouse(x, z, w, h, rh, col, rcol, seed) { const y = gY(x, z) - 0.07, g = grp(scene, x, y, z), H = h + 0.07;
    add(rbox(w, H, 0.15, 12, 16, 12), col, g, { part: 'wall' }).position.y = H / 2;
    const s = new THREE.Shape(); s.moveTo(-0.085, 0); s.lineTo(0.085, 0); s.lineTo(0, rh); s.closePath();
    const rg = new THREE.ExtrudeGeometry(s, { depth: w + 0.012, bevelEnabled: false }); rg.translate(0, 0, -(w + 0.012) / 2); rg.rotateY(Math.PI / 2); add(rg, rcol, g, { part: 'roof' }).position.y = H;
    const fl = h > 0.15 ? 2 : 1, n = Math.max(1, Math.round(w / 0.06));
    for (let f = 0; f < fl; f++) for (let k = 0; k < n; k++) { if (hash(seed + f * 7 + k * 3) < 0.15) continue; const wx = x + (k - (n - 1) / 2) * (w / n), wy = y + 0.07 + h * (f + 0.58) / fl;
      const q = rbox(0.016, 0.022, 0.004, 6, 6, 6); q.translate(wx, wy, z + 0.077); winG.push(q);
      if (hash(seed * 1.3 + k) < 0.45) for (const sx of [-1, 1]) { const r = rbox(0.008, 0.023, 0.003, 6, 6, 6); r.translate(wx + sx * 0.013, wy, z + 0.078); shutG.push(r); } }
  }
  // far rows: fill each terrace with row houses where the camera sees them; gaps hold trees
  const trees = [];
  for (let i = 0; i <= 9; i++) { const z = rowZ(i) + 0.05 * (hash(i * 3.1) - 0.5), hw = 0.14 * (4.2 - z) + 0.3; let x = -hw;
    while (x < hw) { const w = 0.11 + 0.09 * hash(x * 13.1 + i), gap = hash(x * 7.7 + i * 2.3) < 0.22 ? 0.05 + 0.08 * hash(x + i) : 0.004, xc = x + w / 2, h = 0.11 + 0.08 * hash(x * 3.3 + i * 1.7);
      if (inView(xc, gY(xc, z) + h, z, 0.15) || inView(xc, gY(xc, z), z, 0.15)) rowHouse(xc, z, w, h, 0.045 + 0.02 * hash(x * 5.1 + i), WALLS[Math.floor(hash(x * 9.7 + i * 4.1) * 4)], ROOFS[Math.floor(hash(x * 2.9 + i) * 2)], x * 31 + i * 7);
      if (gap > 0.03) trees.push([x + w + gap / 2, z - 0.02, hash(x * 4.4 + i) < 0.6 ? 'cypress' : 'round', 0.8 + 0.4 * hash(x + i * 9)]);
      x += w + gap; } }
  // the bell tower near the top of the slope, left
  { const tx = -0.78, tz = rowZ(7) - 0.12, ty = gY(tx, tz) - 0.05, g = grp(scene, tx, ty, tz, 0, 0.12, 0), TW = 0.10, TH = 0.52;
    add(rbox(TW, TH, TW, 12, 16, 16), C.stone, g, { part: 'stone' }).position.y = TH / 2;
    add(rbox(TW + 0.014, 0.014, TW + 0.014, 8, 16, 12), C.stone, g, { part: 'stone' }).position.y = TH - 0.11;
    for (const a of [0, 1, 2, 3]) { const o = add(rbox(0.030, 0.056, 0.010, 8, 8, 8), C.window, g, { part: 'window' }); const r = TW / 2 + 0.001; o.position.set(Math.sin(a * Math.PI / 2) * r, TH - 0.055, Math.cos(a * Math.PI / 2) * r); o.rotation.y = a * Math.PI / 2; }
    const rf = add(surf((u, v, o) => { const a = u * TAU, k = 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))), r = (TW / 2 + 0.010) * (1 - v) * k; return o.set(r * Math.sin(a), v * 0.12, r * Math.cos(a)); }, 32, 6, { closed: false, flip: false }), C.roof, g, { part: 'roof', two: true }); rf.position.y = TH; }
  if (winG.length) add(mergeGeometries(winG), C.window, scene, { part: 'window' }).castShadow = false;
  if (shutG.length) add(mergeGeometries(shutG), C.shutter, scene, { part: 'shutter' }).castShadow = false;

  // ---------- our side: a back row behind the balloon and a front row whose ridge (x ~ 0.1, z = 1.0) the basket rises past
  const MID = [ // x, z, len, dep, h, rh, ry, opts
    [-0.30, 0.15, 0.24, 0.20, 0.28, 0.09, 0.03, { chim: 1, wins: 3, shut: 1, floors: 2 }], [-0.04, 0.10, 0.22, 0.19, 0.26, 0.085, -0.02, { chim: -1, wins: 2, shut: 2, floors: 2 }],
    [0.24, 0.18, 0.24, 0.20, 0.29, 0.09, 0.02, { chim: 1, wins: 3, shut: 1, floors: 2 }], [0.52, 0.12, 0.22, 0.20, 0.27, 0.09, -0.03, { chim: -1, wins: 2, shut: 2, floors: 2 }], [0.80, 0.16, 0.24, 0.20, 0.28, 0.09, 0.0, { chim: 1, wins: 3, floors: 2 }],
    [-0.20, 1.02, 0.26, 0.22, 0.26, 0.10, 0.02, { chim: 1, wins: 3, shut: 2, floors: 2 }], [0.09, 1.00, 0.28, 0.22, 0.25, 0.10, 0.0, { chim: -1, wins: 3, shut: 1, floors: 2, door: true }],
    [0.40, 1.05, 0.26, 0.22, 0.24, 0.10, -0.02, { chim: 1, wins: 3, shut: 2, floors: 2 }], [0.68, 0.98, 0.26, 0.22, 0.27, 0.10, 0.03, { chim: 1, wins: 3, shut: 1, floors: 2 }] ];
  MID.forEach(([x, z, len, dep, h, rh, ry, o], k) => { const g = grp(scene, x, gY(x, z) - 0.04, z, 0, ry, 0); gable(g, len, dep, h + 0.04, rh, WALLS[k % 4], ROOFS[k % 2], o); });
  // round trees and cypresses: in the gaps of the far rows and a few between our rows
  trees.push([0.38, 0.55, 'round', 1.3], [-0.12, 0.50, 'cypress', 1.5], [0.86, 0.60, 'cypress', 1.5]);
  for (const [x, z, kind, s] of trees) { if (!inView(x, gY(x, z) + 0.1, z, 0.2)) continue; const g = grp(scene, x, gY(x, z) - 0.01, z), seed = x * 17 + z * 5;
    if (kind === 'cypress') { add(surf((u, v, o) => { const a = u * TAU, r = 0.030 * s * Math.pow(Math.sin(Math.PI * Math.min(1, v * 0.97 + 0.02)), 0.75) * (1 - 0.35 * v) * (1 + 0.08 * Math.sin(a * 5 + v * 9 + seed)); return o.set(r * Math.sin(a), v * 0.22 * s, r * Math.cos(a)); }, 20, 18), C.cypress, g, { part: 'tree' }); }
    else { add(blade([V(0, 0, 0), V(0, 0.05 * s, 0)], 0.006, 0.006, { nu: 8, nv: 4, cap: 0 }), C.trunk, g, { part: 'trunk' }); const c = add(lumpy(0.050 * s, seed, 0.85), C.tree, g, { part: 'tree' }); c.position.y = 0.085 * s; }
    trees.k ??= []; trees.k.push({ g, ph: hash(seed) * 6 }); }

  // ---------- the near roofs (cropped, lower left, seen from a little above) with chimney pots and a string of bunting between the two chimneys
  const NEAR = [ // x, z, len, dep, base, h, rh, ry, chim
    [-0.21, 2.60, 0.30, 0.30, 0.56, 0.30, 0.12, 0.42, -1], [-0.11, 2.15, 0.26, 0.28, 0.53, 0.32, 0.12, 0.30, 1] ];
  const nearG = NEAR.map(([x, z, len, dep, base, h, rh, ry, chim], k) => { const g = grp(scene, x, base, z, 0, ry, 0); gable(g, len, dep, h, rh, WALLS[(k + 1) % 4], ROOFS[k % 2], { chim, wins: 2, shut: k + 1, floors: 2 }); return g; });
  scene.updateMatrixWorld(true);
  const potTop = (k) => { const [, , len, dep, , h, rh, , chim] = NEAR[k]; return nearG[k].localToWorld(V(chim * len * 0.3, h + rh * 0.55 + 0.035 + (rh + 0.07) / 2 + 0.020, -dep * 0.16)); };
  const A0 = potTop(0), B0 = potTop(1), sag = (u) => A0.clone().lerp(B0, u).add(V(0, -0.06 * Math.sin(Math.PI * u), 0));
  add(blade(Array.from({ length: 16 }, (_, i) => sag(i / 15)), 0.0011, 0.0011, { nu: 6, nv: 60, cap: 0 }), C.string, scene, { part: 'string' });
  const flags = [], NF = 12;
  for (let i = 0; i < NF; i++) { const u = (i + 0.5) / NF, p = sag(u), tq = sag(Math.min(1, u + 0.01)).sub(sag(Math.max(0, u - 0.01))).normalize(), g = grp(scene); g.position.copy(p);
    g.quaternion.setFromUnitVectors(V(1, 0, 0), tq); const o = add(surf((a, b, q) => q.set((a - 0.5) * 0.026 * (1 - b), -b * 0.034, 0.0006 * Math.sin(b * 3 + a)), 6, 6, { closed: false }), i % 2 ? C.env2 : C.pennant, g, { part: 'pennant', two: true });
    flags.push({ g, o, i }); }

  // ---------- the balloon. Envelope: 16 gores bulging between load tapes, mouth at y = 0, crown at y = 0.445; a skirt, 8 ropes, the burner frame, the basket.
  const PRO = new THREE.CatmullRomCurve3([[0.056, 0], [0.092, 0.045], [0.140, 0.120], [0.168, 0.205], [0.174, 0.265], [0.164, 0.330], [0.132, 0.390], [0.078, 0.430], [0.022, 0.4445], [0.0, 0.445]].map(([r, y]) => V(r, y, 0)), false, 'centripetal'); PRO.arcLengthDivisions = 400;
  function makeBal(par, sc, lay) { const b = grp(par), env = grp(b), hang = grp(b); b.scale.setScalar(sc); const q = V();
    const e = add(surf((u, v, o) => { PRO.getPointAt(Math.min(1, Math.max(0, v)), q); const a = u * TAU, gf = (u * 16) % 1, r = q.x * (1 + 0.022 * Math.pow(Math.sin(Math.PI * gf), 0.7) * Math.sin(Math.PI * Math.min(1, v * 1.15))); return o.set(r * Math.sin(a), q.y, r * Math.cos(a)); }, 192, 64), C.env, env, { part: 'env', layer: lay });
    e.userData.met = [TAU * 0.17, 0.62];
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; add(blade(Array.from({ length: 12 }, (_, i) => { PRO.getPointAt(i / 11 * 0.985, q); return V((q.x + 0.0012) * Math.sin(a), q.y, (q.x + 0.0012) * Math.cos(a)); }), 0.0016, 0.0009, { nu: 5, nv: 40, cap: 0, up: V(Math.sin(a), 0, Math.cos(a)) }), C.rope, env, { part: 'tape', layer: lay }); }
    add(surf((u, v, o) => { const a = u * TAU, r = 0.056 - 0.005 * v; return o.set(r * Math.sin(a), -0.036 * v, r * Math.cos(a)); }, 32, 4, { closed: false, flip: false }), C.skirt, hang, { part: 'skirt', two: true, layer: lay });
    const BY = -0.13, BW = 0.070, BH = 0.056;
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * TAU, c = [[1, 1], [-1, 1], [-1, -1], [1, -1]][Math.floor(k / 2)]; add(blade([V(0.054 * Math.sin(a), 0.0, 0.054 * Math.cos(a)), V(c[0] * BW * 0.46, BY + BH / 2 + 0.004, c[1] * BW * 0.46)], 0.0010, 0.0010, { nu: 5, nv: 6, cap: 0 }), C.rope, hang, { part: 'rope', layer: lay }); }
    const fr = add(rbox(0.050, 0.008, 0.050, 6, 12, 8), C.burner, hang, { part: 'burner', layer: lay }); fr.position.y = -0.088;
    for (const s of [-1, 1]) { const c = add(rbox(0.016, 0.022, 0.016, 5, 10, 8), C.burner, hang, { part: 'burner', layer: lay }); c.position.set(s * 0.011, -0.076, 0); }
    for (const [x, z] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) add(blade([V(x * 0.024, -0.088, z * 0.024), V(x * BW * 0.44, BY + BH / 2, z * BW * 0.44)], 0.0016, 0.0016, { nu: 5, nv: 4, cap: 0 }), C.burner, hang, { part: 'burner', layer: lay });
    const bk = add(rbox(BW, BH, BW, 9, 28, 16), C.basket, hang, { part: 'basket', layer: lay }); bk.position.y = BY;
    const rim = add(rbox(BW + 0.008, 0.010, BW + 0.008, 6, 28, 10), C.skirt, hang, { part: 'rim', layer: lay }); rim.position.y = BY + BH / 2;
    const fl = add(surf((u, v, o) => { const a = u * TAU, r = 0.011 * Math.pow(Math.sin(Math.PI * Math.min(1, v * 0.9 + 0.1)), 0.8) * (1 - 0.55 * v); return o.set(r * Math.sin(a), v, r * Math.cos(a)); }, 16, 10), C.flame, hang, { part: 'flame', glow: 3.0, layer: lay });
    fl.position.y = -0.080; fl.castShadow = false;
    return { b, env, hang, fl, e }; }
  const bal = makeBal(scene, 1.0, 'bal'), far = makeBal(scene, 0.42, 'bal2');
  const burn = new THREE.PointLight(0xffb060, 0, 0.9, 2.0); burn.castShadow = false; scene.add(burn);

  // ---------- three swifts gliding over the far roofs
  const birds = [];
  for (let i = 0; i < 3; i++) { const g = grp(scene), w = [-1, 1].map((s) => { const q = grp(g); add(blade([V(0, 0, 0), V(s * 0.016, 0.002, -0.004), V(s * 0.030, -0.002, -0.012)], (v) => 0.0055 * (1 - 0.8 * v), 0.0012, { nu: 6, nv: 8, cap: 0.05, up: V(0, 1, 0) }), C.bird, q, { part: 'bird', layer: 'b' + i }); return q; });
    add(ball(0.0045, 0.0035, 0.012, 10, 8), C.bird, g, { part: 'bird', layer: 'b' + i }); birds.push({ g, w, i }); }

  // ---------- light: low morning sun from the left, cool sky fill from the right, the burner's own light
  const CEN = V(0.0, 0.7, -1.4), KEY = V(-2.7, 1.25, 1.1), sun = new THREE.DirectionalLight(0xffe2bf, 3.2); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -5.0, right: 5.0, top: 4.0, bottom: -4.0, near: 0.3, far: 14 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.004; sun.target.position.copy(CEN); scene.add(sun, sun.target);
  const fillL = new THREE.DirectionalLight(0xa8c0e8, 0.7); fillL.castShadow = false; fillL.target.position.copy(CEN); scene.add(fillL, fillL.target);
  const amb = new THREE.AmbientLight(0xffffff, 0.32); scene.add(amb);
  let burnBase = 1.2;

  // ---------- pose: everything from t
  function pose(t) {
    const F = flare(t); SKY.time.value = t; SKY.flare.value = F;
    { const y = mouthY(t), sw = 0.022 * Math.sin(t * 1.10 + 0.4), sx = 0.012 * Math.sin(t * 0.83 + 1.2); bal.b.position.set(BX, y, BZ); bal.b.rotation.set(sx, 0.3 + 0.05 * Math.sin(t * 0.31), sw);
      bal.hang.rotation.set(0.6 * sx, 0, 0.7 * sw + 0.010 * Math.sin(t * 1.9)); bal.fl.scale.set(1.0 + 0.8 * F, 0.008 + 0.11 * F * (0.9 + 0.1 * Math.sin(t * 37.0)), 1.0 + 0.8 * F);
      burn.position.set(BX, y - 0.03, BZ); burn.intensity = burnBase * F; }
    { const F2 = flare(t + 0.61), y = 1.78 + 0.010 * t + 0.006 * Math.sin(t * 0.9); far.b.position.set(-0.62, y, -6.6); far.b.rotation.set(0, 1.1, 0.02 * Math.sin(t * 0.9)); far.fl.scale.set(1, 0.006 + 0.08 * F2, 1); }
    for (const f of flags) { const a = 0.38 * Math.sin(t * 6.3 + f.i * 0.9) + 0.18 * Math.sin(t * 11.1 + f.i * 2.3) + 0.25; f.o.rotation.set(a, 0.25 * Math.sin(t * 5.1 + f.i), 0); }
    for (const k of trees.k ?? []) k.g.rotation.z = 0.012 * Math.sin(t * 1.3 + k.ph);
    for (const b of birds) { const a = t * (0.42 + 0.07 * b.i) + b.i * 2.1, R = 0.55 + 0.15 * b.i; b.g.position.set(-0.45 + Math.cos(a) * R, 1.62 + 0.12 * b.i + 0.05 * Math.sin(t * 1.7 + b.i), -2.6 + Math.sin(a) * R * 0.5); b.g.rotation.set(0, -a, 0.3);
      const fl = (b.i === 1 ? 0.15 : 0.55) * Math.sin(t * 9.0 + b.i * 2.0); b.w[0].rotation.z = -fl; b.w[1].rotation.z = fl; }
    SKY.focus.value.set(BX, bal.b.position.y + 0.22, BZ); SKY.lamp.value.set(BX, bal.b.position.y - 0.03, BZ);
  }
  const P0 = camera.projectionMatrix.clone();
  function shoot(k, n) { camera.projectionMatrix.copy(P0); if (n > 1) { camera.projectionMatrix.elements[8] += 2 * (halton(k + 1, 5) - 0.5) / W; camera.projectionMatrix.elements[9] += 2 * (halton(k + 1, 7) - 0.5) / H; } camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    const s = n > 1 ? 0.20 : 0; sun.position.set(CEN.x + KEY.x + (halton(k + 1, 11) - 0.5) * s, CEN.y + KEY.y + (halton(k + 1, 13) - 0.5) * s, CEN.z + KEY.z + (halton(k + 1, 17) - 0.5) * s);
    const h1 = n > 1 ? halton(k + 1, 19) : 0.5, h2 = n > 1 ? halton(k + 1, 23) : 0.3, phi = h2 * TAU, r = Math.sqrt(1 - h1); fillL.position.set(CEN.x + 2.2 + Math.cos(phi) * r, CEN.y + 2.5 + Math.abs(Math.sin(phi)) * r, CEN.z + 2.5 + Math.sqrt(h1)); }

  // ---------- post
  const vert = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const addPass = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, w: { value: 1 } }, vertexShader: vert, fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main() { gl_FragColor = vec4(min(texture2D(tex, vUv).rgb, vec3(16.0)) * w, 1.0); }', blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false, transparent: true }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.2, 0.45, 0.9);
  const grade = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: accum.texture }, graphic: { value: 0 }, ex: { value: 1 }, vig: { value: 0.12 } }, vertexShader: vert, fragmentShader: `uniform sampler2D tex; uniform float graphic, ex, vig; varying vec2 vUv;
    vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); } vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    void main() { vec3 c = texture2D(tex, vUv).rgb * ex; c = mix(aces(c), c / max(1.0, max(c.r, max(c.g, c.b))), graphic); vec2 d = vUv - 0.5; c *= 1.0 - vig * smoothstep(0.3, 0.75, length(d)); gl_FragColor = vec4(srgb(c), 1.0); }`, depthTest: false, depthWrite: false }));
  let now = '', st = null;
  return { LOOKS, scene, camera, draw(t, name, n = 8) {
    if (name !== now) { now = name; pose(t); scene.updateMatrixWorld(true); st = setStyle(name, { scene, key: sun, fill: fillL, amb, spot: burn, bloom, renderer, grade: grade.material.uniforms, size: [W, H] }); burnBase = burn.intensity > 0 ? burn.intensity : 1.2; }
    renderer.setRenderTarget(accum); renderer.setClearColor(0, 1); renderer.clear();
    for (let k = 0; k < n; k++) { const d = n === 1 ? 0 : ((k + 0.5) / n - 0.5) * ((st?.shutter ?? 0.5) / 60); pose(t + d); shoot(k, n); let tex; if (st?.render) tex = st.render(renderer, scene, camera, k); else { renderer.setRenderTarget(rt); renderer.render(scene, camera); tex = rt.texture; }
      addPass.material.uniforms.tex.value = tex; addPass.material.uniforms.w.value = 1 / n; renderer.setRenderTarget(accum); renderer.autoClear = false; addPass.render(renderer); renderer.autoClear = true; }
    if (bloom.strength > 0.001) bloom.render(renderer, accum, accum, 0, false); renderer.setRenderTarget(null); grade.render(renderer); } };
}
