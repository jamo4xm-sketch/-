// The lighthouse: a striped tower and a keeper's cottage on a rocky headland at dusk, a fishing boat rocking on the swell, surf on a diagonal shelf of rocks,
// spray, two gulls, slow clouds and two beams turning in the lantern. The camera drifts in a little. Pure function of t, so a wipe shows the same moment in two looks.
// All motion lives in geometry and transforms (never in a material), because every look swaps the materials.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { V, hash, surf, ball, ringG, rbox, turn, blade } from './shapes3.js';
import { setStyle, SKY } from './styles5.js';
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
const TAU = Math.PI * 2, ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
export const LOOKS = ['lit'];
export const C = { sky: '#d9a989', cloud: '#efc3a2', ridge1: '#5f6c84', ridge2: '#7f879c', sea: '#2c5873', foam: '#f2f4f2', rock: '#5b5752', rock2: '#6c655e', grass: '#6b8547', tower: '#f0ebe1', band: '#c0392f',
  iron: '#2a2c30', glass: '#bcd8e2', lamp: '#ffe7a3', dome: '#b3342b', stone: '#a39b8d', house: '#ebe2cf', roof: '#7a3b2e', window: '#26343f', door: '#4d3a2b', hull: '#2b4e7b', cabin: '#efe9dd', mast: '#8a6a48', gull: '#f6f6f3', beam: '#fff1c8' };
// ---------- the sea (y = 0 is calm water). Swell runs towards the shore (+z); the fine ripples fade with distance so the far grid never aliases.
export const seaY = (x, z, t) => { const far = ss(-0.8, -5.0, z);
  return 0.012 * Math.sin(9.0 * z + 0.6 * x - 2.2 * t) + 0.006 * Math.sin(17.0 * z + 7.0 * x - 3.4 * t + 1.3)
    + (1 - far) * (0.004 * Math.sin(31.0 * (0.8 * z - 0.6 * x) - 4.6 * t + 2.0) + 0.002 * Math.sin(53.0 * (0.3 * z + 0.95 * x) - 6.0 * t)); };
// ---------- the headland: a plateau that runs off the left edge, a cliff, a lower rocky step, then under the water
const HC = V(-0.34, 0, -1.36), RX = 0.30, RZ = 0.36;
const hd = (x, z) => Math.hypot(Math.max(0, x - HC.x) / RX, (z - HC.z) / RZ);
export const hY = (x, z) => { const d = hd(x, z), cliff = ss(0.55, 0.9, d) * (1 - ss(1.3, 1.6, d)) + 0.15;
  const n = 0.022 * Math.sin(x * 13.0 + z * 7.0) + 0.016 * Math.sin(x * 29.0 - z * 17.0 + 1.0) + 0.009 * Math.sin(x * 61.0 + z * 43.0 + 2.0) + 0.012 * Math.sin(x * 5.0 - z * 3.0);
  return Math.max(0.22 * (1 - ss(0.74, 0.98, d)), 0.08 * (1 - ss(1.0, 1.32, d))) - 0.09 * ss(1.25, 1.55, d) + n * cliff * 0.8; };
// the beam: two lenses back to back, half a turn every 1.25 s. In scene time a beam crosses the boat in the middle of each look (reel time i * 1.25 + 0.625, scene = reel + 0.35)
const W0 = Math.PI / 1.25, T0 = 0.975, AZ0 = 45 * Math.PI / 180, DIP = 6 * Math.PI / 180, SDIP = 44 * Math.PI / 180;
export const beamAz = (t) => AZ0 + W0 * (t - T0);
export function makeLight(canvas, W, H) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }), accum = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
  const scene = new THREE.Scene(); scene.background = new THREE.Color(C.sky);
  const mats = new Map(), M = (c, rough = 0.6, side = THREE.FrontSide, glow = 0) => { const id = c + rough + side + glow; if (!mats.has(id)) mats.set(id, new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0, side, emissive: glow ? c : '#000000', emissiveIntensity: glow })); return mats.get(id); };
  // tags: part = its role (the looks dress by part), layer = parts that share an outline
  const add = (g, col, par, d = {}) => { const o = new THREE.Mesh(g, M(col, d.rough ?? 0.6, d.two ? THREE.DoubleSide : THREE.FrontSide, d.glow ?? 0)); o.castShadow = o.receiveShadow = true; Object.assign(o.userData, { kind: 'obj', col, ...d }); par.add(o); return o; };
  const grp = (par, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(rx, ry, rz); par.add(g); return g; };
  const line = (a, b, n = 3) => Array.from({ length: n }, (_, i) => a.clone().lerp(b, i / (n - 1)));
  const lumpy = (r, seed, sq = 0.66) => surf((u, v, q) => { const th = v * Math.PI, ph = u * TAU, s = Math.sin(th), k = r * (1 + 0.16 * Math.sin(3 * ph + seed) * s + 0.12 * Math.sin(2 * th + 5 * ph + seed * 2) * s + 0.07 * Math.sin(7 * ph - 3 * th + seed) + 0.035 * Math.sin(13 * ph + 7 * th + seed * 3) * s); return q.set(k * s * Math.sin(ph), k * sq * Math.cos(th), k * s * Math.cos(ph)); }, 30, 20);

  // ---------- sky, clouds and the far land on the horizon
  const sky = add(surf((u, v, o) => o.set((u - 0.5) * 14.0, 5.0 - v * 6.5, 0), 2, 2, { closed: false, flip: true }), C.sky, scene, { kind: 'back', part: 'sky' }); sky.position.z = -8.0; sky.castShadow = sky.receiveShadow = false;
  const clouds = [];
  const CL = [];   // open dusk sky: the beam is the only thing up there (saucer clouds were tried and dropped)
  for (let i = 0; i < CL.length; i++) { const g = grp(scene, ...CL[i]), lay = 'c' + i, n = 4 + (i % 3);
    for (let k = 0; k < n; k++) { const r = 0.16 + 0.14 * hash(i * 11 + k * 3.1); const o = add(ball(r * 2.6, r * 0.34, r * 0.9, 26, 16), C.cloud, g, { part: 'cloud', layer: lay, rough: 0.95 }); o.position.set((k - n / 2) * 0.30 + 0.08 * hash(k + i), 0.05 * hash(k * 2.3 + i) - (k === 0 || k === n - 1 ? 0.03 : 0), 0.06 * hash(k * 5.1 + i)); o.castShadow = o.receiveShadow = false; }
    clouds.push({ g, x0: g.position.x, v: 0.010 + 0.006 * hash(i * 9.1) }); }
  const ridge = (zc, x0, x1, top, seed, col, lay) => { const pk = (x) => { const e = ss(x0, x0 + 0.6, x) * (1 - ss(x1 - 0.9, x1, x)); return top * e * (0.75 + 0.18 * Math.sin(x * 2.3 + seed) + 0.08 * Math.sin(x * 7.1 + seed * 2)); };
    const o = add(surf((u, v, q) => { const x = x0 + (x1 - x0) * u; return q.set(x, -0.03 + (pk(x) + 0.03) * v, zc - 0.4 * v * v); }, 120, 8, { closed: false, flip: false }), col, scene, { kind: 'back', part: 'ridge', layer: lay }); o.castShadow = false; o.receiveShadow = false; return o; };
  ridge(-5.4, 0.25, 4.2, 0.20, 1.0, C.ridge1, 'r1'); ridge(-6.6, -4.5, -0.6, 0.12, 4.0, C.ridge2, 'r2');

  // ---------- the sea: denser towards the camera; its heights are rewritten every pose
  const sea = add(surf((u, v, o) => o.set(-5.0 + 10.0 * u, 0, -7.0 + 8.8 * Math.pow(v, 0.62)), 200, 170, { closed: false, flip: true }), C.sea, scene, { kind: 'back', part: 'sea', rough: 0.18 }); sea.castShadow = false;
  const seaP = sea.geometry.attributes.position, seaX = Float32Array.from({ length: seaP.count }, (_, i) => seaP.getX(i)), seaZ = Float32Array.from({ length: seaP.count }, (_, i) => seaP.getZ(i));

  // ---------- the headland, its grass cap, boulders on the lower step
  const land = add(surf((u, v, o) => { const x = -2.6 + 3.6 * u, z = -2.7 + 2.5 * v; return o.set(x, hY(x, z), z); }, 220, 150, { closed: false, flip: true }), C.rock, scene, { part: 'cliff' }); land.castShadow = true;
  const grass = add(surf((u, v, o) => { const x = -2.6 + 2.80 * u, z = -1.66 + 0.60 * v; return o.set(x, hY(x, z) + 0.004 - 0.07 * ss(0.60, 0.76, hd(x, z)), z); }, 160, 60, { closed: false, flip: true }), C.grass, scene, { part: 'grass' });
  const boulders = [];
  for (let i = 0; i < 16; i++) { const a = -0.35 + 1.9 * hash(i * 2.7 + 5), d = 1.02 + 0.22 * hash(i * 4.1 + 1), x = HC.x + Math.cos(a) * d * RX, z = HC.z + Math.sin(a) * d * RZ; if (x < -0.80) continue; const r = 0.022 + 0.030 * hash(i * 6.3 + 2);
    const o = add(lumpy(r, i * 1.9), i % 2 ? C.rock : C.rock2, scene, { part: 'rock' }); o.position.set(x, Math.max(hY(x, z), -0.02) + r * 0.2, z); o.rotation.y = i * 1.3; boulders.push(o); }

  // ---------- the near shelf: a diagonal of big rocks from the bottom left, foam round each, spray when a swell hits
  const SHELF = [[-0.215, 0.46, 0.125], [-0.10, 0.40, 0.060], [-0.17, 0.25, 0.085], [-0.27, -0.02, 0.080], [-0.14, 0.06, 0.068], [-0.11, -0.12, 0.055], [-0.06, -0.31, 0.046], [-0.005, -0.42, 0.034], [-0.21, 0.13, 0.048], [-0.03, -0.20, 0.028], [0.035, -0.52, 0.026], [-0.07, 0.20, 0.034], [-0.19, -0.16, 0.040]];
  const foams = [];
  SHELF.forEach(([x, z, r], i) => { const o = add(lumpy(r, i * 2.3 + 0.7, 0.85), i % 2 ? C.rock2 : C.rock, scene, { part: 'rock' }); o.position.set(x, r * 0.30, z); o.rotation.y = i * 2.1;
    const f = add(ringG(r * 1.02, r * 0.16, 10, 48), C.foam, scene, { part: 'foam', rough: 0.9, layer: 'f' + i }); f.rotation.x = Math.PI / 2; f.scale.set(1, 1, 0.25); f.castShadow = false; foams.push({ f, x, z, r, i }); });
  // foam along the foot of the headland
  for (let i = 0; i < 22; i++) { const a = -0.30 + 1.75 * (i / 21), x = HC.x + Math.cos(a) * 1.30 * RX, z = HC.z + Math.sin(a) * 1.30 * RZ; if (x < -0.80) continue; const r = 0.022 + 0.014 * hash(i * 3.9);
    const f = add(ball(r * 1.6, r * 0.16, r, 22, 10), C.foam, scene, { part: 'foam', rough: 0.9, layer: 'fh' }); f.castShadow = false; foams.push({ f, x, z, r, i: 20 + i, flat: true }); }
  const SPRAY = [[-0.14, 0.06, 0.0], [-0.06, -0.31, 0.42], [-0.17, 0.27, 0.77], [0.02, -1.02, 0.25], [-0.10, -0.92, 0.62]], sprays = [];
  SPRAY.forEach(([x, z, ph], i) => { const g = grp(scene, x, 0, z), b = []; for (let k = 0; k < 7; k++) { const o = add(ball(1, 0.8, 1, 16, 10), C.foam, g, { part: 'spray', layer: 's' + i, rough: 0.9 }); o.castShadow = false; b.push(o); } sprays.push({ g, b, ph, i }); });

  // ---------- the lighthouse: granite plinth, tapered white tower with two red bands, door, windows, gallery and railing, lantern with mullions, lamp, red dome, ventilator
  const TX = -0.24, TZ = -1.32, TB = hY(TX, TZ) - 0.01, TH = 0.60, rT = (y) => 0.082 - 0.024 * (y / TH);
  const tower = grp(scene, TX, TB, TZ);
  add(turn([[0.104, -0.03], [0.104, 0.025], [0.096, 0.040], [0.0, 0.041]], 48, 10), C.stone, tower, { part: 'stone' });
  add(turn([[rT(0), 0.03], [rT(TH / 2), TH / 2], [rT(TH), TH]], 64, 40), C.tower, tower, { part: 'tower', layer: 'tw' });
  for (const [a, b] of [[0.17, 0.27], [0.40, 0.50]]) add(turn([[rT(a) + 0.0016, a], [rT((a + b) / 2) + 0.0016, (a + b) / 2], [rT(b) + 0.0016, b]], 64, 10), C.band, tower, { part: 'band', layer: 'tw' });
  const face = (y, w, h, col, part, dz = 0.002, ang = 0.18) => { const r = rT(y) + dz, o = add(rbox(w, h, 0.010, 6, 14, 10), col, tower, { part }); o.position.set(Math.sin(ang) * r, y, Math.cos(ang) * r); o.rotation.y = ang; return o; };
  face(0.075, 0.040, 0.070, C.door, 'door', 0.001); face(0.075, 0.050, 0.080, C.iron, 'iron', -0.003);
  for (const [y, a] of [[0.21, 0.55], [0.335, -0.10], [0.455, 0.40]]) { face(y, 0.020, 0.032, C.window, 'window', 0.001, a); face(y, 0.027, 0.039, C.iron, 'iron', -0.002, a); }
  // gallery deck, corbel ring, railing
  add(turn([[rT(TH) - 0.004, TH - 0.028], [0.088, TH - 0.004], [0.092, TH], [0.092, TH + 0.010], [0.0, TH + 0.011]], 56, 12), C.iron, tower, { part: 'iron' });
  { const r = add(ringG(0.090, 0.0028, 8, 72), C.iron, tower, { part: 'iron' }); r.position.y = TH + 0.050; r.rotation.x = Math.PI / 2; const r2 = add(ringG(0.090, 0.0018, 8, 72), C.iron, tower, { part: 'iron' }); r2.position.y = TH + 0.030; r2.rotation.x = Math.PI / 2;
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; add(blade(line(V(Math.sin(a) * 0.090, TH + 0.010, Math.cos(a) * 0.090), V(Math.sin(a) * 0.090, TH + 0.050, Math.cos(a) * 0.090)), 0.0018, 0.0018, { nu: 8, nv: 4, cap: 0.05 }), C.iron, tower, { part: 'iron' }); } }
  // lantern: glass, mullions, lamp, dome, ventilator ball, rod
  const LY0 = TH + 0.011, LY1 = TH + 0.105;
  add(turn([[0.054, LY0], [0.054, (LY0 + LY1) / 2], [0.054, LY1]], 48, 6), C.glass, tower, { part: 'glass', rough: 0.08, two: true }).castShadow = false;
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; add(blade(line(V(Math.sin(a) * 0.055, LY0, Math.cos(a) * 0.055), V(Math.sin(a) * 0.055, LY1, Math.cos(a) * 0.055)), 0.0022, 0.0022, { nu: 8, nv: 4, cap: 0.05 }), C.iron, tower, { part: 'iron' }); }
  for (const y of [LY0 + 0.004, LY1]) { const r = add(ringG(0.055, 0.0035, 8, 56), C.iron, tower, { part: 'iron' }); r.position.y = y; r.rotation.x = Math.PI / 2; }
  const lamp = add(ball(0.022, 0.026, 0.022, 24, 16), C.lamp, tower, { part: 'lamp', glow: 2.5, rough: 0.3 }); lamp.position.y = (LY0 + LY1) / 2; lamp.castShadow = false;
  add(turn([[0.066, LY1], [0.062, LY1 + 0.012], [0.046, LY1 + 0.040], [0.020, LY1 + 0.062], [0.0, LY1 + 0.068]], 48, 16), C.dome, tower, { part: 'dome', rough: 0.4 });
  { const b = add(ball(0.011, 0.011, 0.011, 16, 10), C.iron, tower, { part: 'iron' }); b.position.y = LY1 + 0.078; add(blade(line(V(0, LY1 + 0.08, 0), V(0, LY1 + 0.125, 0)), 0.0015, 0.0015, { nu: 6, nv: 4, cap: 0.1 }), C.iron, tower, { part: 'iron' }); }
  const LAMP = V(TX, TB + lamp.position.y, TZ);

  // ---------- the keeper's cottage behind and left of the tower: walls with a gable, two roof slabs, chimney, windows, door
  const HX = -0.50, HZ = -1.44, HB = hY(HX, HZ) - 0.01, cot = grp(scene, HX, HB, HZ, 0, 0.35, 0);
  { const s = new THREE.Shape(); s.moveTo(-0.060, 0); s.lineTo(0.060, 0); s.lineTo(0.060, 0.070); s.lineTo(0, 0.112); s.lineTo(-0.060, 0.070); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.17, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 4 }); g.translate(0, 0, -0.085); g.rotateY(Math.PI / 2); add(g, C.house, cot, { part: 'house' }); }
  for (const s of [-1, 1]) { const o = add(rbox(0.205, 0.010, 0.082, 6, 24, 12), C.roof, cot, { part: 'roof' }); o.position.set(0, 0.093, s * 0.034); o.rotation.x = s * 0.61; }
  { const ch = add(rbox(0.022, 0.060, 0.022, 6, 10, 10), C.stone, cot, { part: 'stone' }); ch.position.set(0.060, 0.118, -0.015); }
  for (const x of [-0.040, 0.035]) { const w = add(rbox(0.026, 0.030, 0.006, 6, 12, 8), C.window, cot, { part: 'window', glow: 0.9 }); w.position.set(x, 0.040, 0.0635); const f = add(rbox(0.032, 0.036, 0.004, 6, 12, 8), C.iron, cot, { part: 'iron' }); f.position.set(x, 0.040, 0.0618); }
  { const d = add(rbox(0.006, 0.050, 0.024, 6, 10, 8), C.door, cot, { part: 'door' }); d.position.set(0.0905, 0.026, 0.020); }

  // ---------- the boat: a lens-shaped hull with a red sheer stripe, a white cabin aft, a mast with a lamp
  const BX = 0.19, BZ = -0.80, boat = grp(scene, BX, 0, BZ, 0, 0.55, 0), BL = 0.20, BW = 0.034, BD = 0.030;
  add(surf((u, v, o) => { const a = u * TAU, k = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, v * 0.94 + 0.03))), 0.55) * (v < 0.5 ? 1 : 1 - 0.25 * (v - 0.5)), c = Math.cos(a); return o.set((v - 0.5) * BL, (c > 0 ? c * 0.18 : c) * BD + 0.016 * (2 * v - 1) ** 2, Math.sin(a) * BW * k); }, 40, 40), C.hull, boat, { part: 'hull' });
  for (const s of [-1, 1]) add(blade(Array.from({ length: 9 }, (_, i) => { const v = 0.05 + 0.9 * i / 8, k = Math.pow(Math.sin(Math.PI * (v * 0.94 + 0.03)), 0.55) * (v < 0.5 ? 1 : 1 - 0.25 * (v - 0.5)); return V((v - 0.5) * BL, 0.004 + 0.016 * (2 * v - 1) ** 2, s * (BW * k * 0.99 + 0.0012)); }), 0.0026, 0.0010, { nu: 6, nv: 30, cap: 0.0, up: V(0, 0, 1) }), C.band, boat, { part: 'band' });
  { const c = add(rbox(0.052, 0.034, 0.040, 7, 16, 12), C.cabin, boat, { part: 'cabin' }); c.position.set(-0.035, 0.022, 0); const rf = add(rbox(0.060, 0.006, 0.046, 6, 16, 10), C.roof, boat, { part: 'roof' }); rf.position.set(-0.035, 0.041, 0);
    for (const s of [-1, 1]) { const w = add(rbox(0.012, 0.010, 0.003, 6, 8, 6), C.window, boat, { part: 'window' }); w.position.set(-0.030, 0.026, s * 0.0205); } }
  add(blade(line(V(0.030, 0.0, 0), V(0.030, 0.150, 0)), 0.0022, 0.0022, { nu: 8, nv: 6, cap: 0.1 }), C.mast, boat, { part: 'mast' });
  add(blade(line(V(0.030, 0.105, 0), V(0.085, 0.020, 0)), 0.0009, 0.0009, { nu: 6, nv: 4, cap: 0.1 }), C.iron, boat, { part: 'iron' });
  { const l = add(ball(0.0055, 0.0055, 0.0055, 12, 8), C.lamp, boat, { part: 'lamp', glow: 2.0 }); l.position.set(0.030, 0.155, 0); l.castShadow = false; }
  const bfoam = add(ringG(0.085, 0.012, 8, 48), C.foam, scene, { part: 'foam', rough: 0.9, layer: 'fb' }); bfoam.rotation.x = Math.PI / 2; bfoam.scale.set(1.25, 0.42, 0.2); bfoam.castShadow = false;

  // ---------- two gulls circling the lantern
  const gulls = [];
  for (let i = 0; i < 2; i++) { const g = grp(scene), lay = 'g' + i; add(ball(0.012, 0.009, 0.026, 16, 10), C.gull, g, { part: 'gull', layer: lay });
    const wings = [-1, 1].map((s) => { const w = grp(g); add(blade([V(0, 0, 0), V(s * 0.030, 0.004, -0.002), V(s * 0.058, -0.002, -0.010)], (v) => 0.011 * (1 - 0.75 * v), 0.0018, { nu: 8, nv: 10, cap: 0.05, up: V(0, 1, 0) }), C.gull, w, { part: 'gull', layer: lay }); return w; });
    gulls.push({ g, wings, i }); }

  // ---------- the beams: a cone from the lamp along +x, oriented each pose. Hidden unless a look shows them.
  const beams = [0, 1].map(() => { const g = grp(scene); const o = add(surf((u, v, q) => { const a = u * TAU, r = 0.024 + 0.30 * v; return q.set(3.2 * v, r * Math.cos(a), r * Math.sin(a)); }, 40, 16), C.beam, g, { kind: 'beam', part: 'beam', layer: 'beam' }); o.castShadow = o.receiveShadow = false; return g; });

  // ---------- light: low warm sun from the right, cool fill, the beam's own spots
  const CEN = V(-0.10, 0.30, -0.60), KEY = V(2.1, 1.35, 1.7), sun = new THREE.DirectionalLight(0xffdcb8, 3.0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -1.8, right: 1.8, top: 1.8, bottom: -1.8, near: 0.3, far: 9 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.003; sun.target.position.copy(CEN); scene.add(sun, sun.target);
  const fillL = new THREE.DirectionalLight(0x9fb4e0, 0.8); fillL.castShadow = true; fillL.shadow.mapSize.set(1024, 1024); Object.assign(fillL.shadow.camera, { left: -1.8, right: 1.8, top: 1.8, bottom: -1.8, near: 0.3, far: 9 }); fillL.shadow.bias = -0.0008; fillL.shadow.normalBias = 0.005; fillL.target.position.copy(CEN); scene.add(fillL, fillL.target);
  const amb = new THREE.AmbientLight(0xffffff, 0.35); scene.add(amb);
  const spot = new THREE.SpotLight(0xffe6b0, 0, 3.0, 0.40, 0.6, 1.2), spot2 = new THREE.SpotLight(0xffe6b0, 0, 3.0, 0.40, 0.6, 1.2); scene.add(spot, spot.target, spot2, spot2.target);

  // ---------- pose: everything from t
  const camera = new THREE.PerspectiveCamera(27, W / H, 0.05, 40), LOOK = V(-0.05, 0.54, -1.0), dir = V(), tmp = V();
  const camAt = (t) => { const k = Math.min(1, Math.max(0, t / 16)); camera.position.set(0.21 - 0.08 * k, 0.36 + 0.02 * k, 2.46 - 0.16 * k); camera.lookAt(LOOK); camera.updateMatrixWorld(true); };
  function pose(t) {
    SKY.time.value = t; camAt(t);
    for (let i = 0; i < seaP.count; i++) seaP.setY(i, seaY(seaX[i], seaZ[i], t)); seaP.needsUpdate = true; sea.geometry.computeVertexNormals();
    for (const c of clouds) c.g.position.x = c.x0 + c.v * t;
    for (const f of foams) { const b = 0.5 + 0.5 * Math.sin(t * 2.3 + f.i * 1.7), y = seaY(f.x, f.z, t); f.f.position.set(f.x, y + 0.002, f.z); const s = f.flat ? 0.85 + 0.3 * b : 1.0 + 0.22 * b; f.f.scale.set(s, s, f.flat ? 1 : 0.25 + 0.2 * b); }
    for (const p of sprays) { const q = ((t / 2.5 + p.ph) % 1 + 1) % 1, h = hash(p.i * 3.7 + Math.floor(t / 2.5 + p.ph) * 1.3), grow = ss(0.0, 0.10, q) * (1 - ss(0.45, 0.85, q)), up = 0.10 * Math.pow(q, 0.6);
      p.b.forEach((o, k) => { const a = k / 7 * TAU + h * 4, sp = 0.010 + 0.055 * Math.pow(q, 0.55) * (0.6 + 0.6 * hash(k * 3.1 + p.i)), lift = (0.05 + 0.10 * hash(k * 1.7 + p.i)) * Math.sin(Math.PI * Math.min(1, q * 1.25)), r = (0.0035 + 0.0065 * hash(k * 5.3 + p.i)) * (0.5 + Math.pow(q, 0.4));
        o.position.set(Math.cos(a) * sp, 0.008 + lift, Math.sin(a) * sp * 0.7); o.scale.setScalar(r * grow + 1e-4); }); }
    // boat: rides the swell, tilts with its slope, rocks a little more
    { const y = seaY(BX, BZ, t), dx = (seaY(BX + 0.05, BZ, t) - seaY(BX - 0.05, BZ, t)) / 0.1, dz = (seaY(BX, BZ + 0.05, t) - seaY(BX, BZ - 0.05, t)) / 0.1;
      boat.position.set(BX, y + 0.012, BZ); boat.rotation.set(Math.atan(dz) * 0.8 + 0.035 * Math.sin(t * 2.6 + 1.0), 0.55 + 0.03 * Math.sin(t * 0.7), -Math.atan(dx) * 0.8 + 0.07 * Math.sin(t * 1.9)); bfoam.position.set(BX, y + 0.002, BZ); bfoam.rotation.z = -0.55; }
    for (const g of gulls) { const a = t * (0.55 + 0.1 * g.i) + g.i * 2.6, R = 0.34 + 0.08 * g.i; g.g.position.set(TX + Math.cos(a) * R, TB + 1.02 + 0.07 * g.i + 0.03 * Math.sin(t * 1.3 + g.i), TZ + Math.sin(a) * R * 0.7); g.g.rotation.set(0, -a, 0.25);
      const fl = Math.sin(t * 7.5 + g.i * 2.0) * 0.55; g.wings[0].rotation.z = -fl; g.wings[1].rotation.z = fl; }
    // beams: dir = (cos az, -sin dip, sin az) with az from +x towards the camera (+z)
    const az = beamAz(t); beams.forEach((g, k) => { const a = az + k * Math.PI; dir.set(Math.cos(a) * Math.cos(DIP), -Math.sin(DIP), Math.sin(a) * Math.cos(DIP)); g.position.copy(LAMP); g.quaternion.setFromUnitVectors(V(1, 0, 0), dir); });
    [spot, spot2].forEach((s, k) => { const a = az + k * Math.PI; s.position.copy(LAMP); s.target.position.set(LAMP.x + Math.cos(a) * Math.cos(SDIP) * 2, LAMP.y - Math.sin(SDIP) * 2, LAMP.z + Math.sin(a) * Math.cos(SDIP) * 2); s.target.updateMatrixWorld(); });
    spot2.intensity = spot.intensity; spot2.color.copy(spot.color);
    SKY.lamp.value.copy(LAMP); SKY.target.value.set(LAMP.x + Math.cos(az) * 1.6, LAMP.y - 1.6 * Math.tan(DIP), LAMP.z + Math.sin(az) * 1.6); SKY.focus.value.set(TX, TB + 0.35, TZ);
  }
  const P0 = camera.projectionMatrix.clone();   // the camera moves, its lens never changes
  function shoot(k, n) { camera.projectionMatrix.copy(P0); if (n > 1) { camera.projectionMatrix.elements[8] += 2 * (halton(k + 1, 5) - 0.5) / W; camera.projectionMatrix.elements[9] += 2 * (halton(k + 1, 7) - 0.5) / H; } camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    const s = n > 1 ? 0.16 : 0; sun.position.set(CEN.x + KEY.x + (halton(k + 1, 11) - 0.5) * s, CEN.y + KEY.y + (halton(k + 1, 13) - 0.5) * s, CEN.z + KEY.z + (halton(k + 1, 17) - 0.5) * s);
    const h1 = n > 1 ? halton(k + 1, 19) : 0.5, h2 = n > 1 ? halton(k + 1, 23) : 0.3, phi = h2 * TAU, r = Math.sqrt(1 - h1); fillL.position.set(CEN.x + Math.cos(phi) * r * 3 - 1.6, CEN.y + Math.abs(Math.sin(phi)) * r * 3 + 0.8, CEN.z + Math.sqrt(h1) * 3 + 0.6); }

  // ---------- post
  const vert = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const addPass = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, w: { value: 1 } }, vertexShader: vert, fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main() { gl_FragColor = vec4(min(texture2D(tex, vUv).rgb, vec3(16.0)) * w, 1.0); }', blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false, transparent: true }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.2, 0.45, 0.9);
  const grade = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: accum.texture }, graphic: { value: 0 }, ex: { value: 1 }, vig: { value: 0.12 } }, vertexShader: vert, fragmentShader: `uniform sampler2D tex; uniform float graphic, ex, vig; varying vec2 vUv;
    vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); } vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    void main() { vec3 c = texture2D(tex, vUv).rgb * ex; c = mix(aces(c), c / max(1.0, max(c.r, max(c.g, c.b))), graphic); vec2 d = vUv - 0.5; c *= 1.0 - vig * smoothstep(0.3, 0.75, length(d)); gl_FragColor = vec4(srgb(c), 1.0); }`, depthTest: false, depthWrite: false }));
  let now = '', st = null;
  return { LOOKS, scene, camera, draw(t, name, n = 8) {
    if (name !== now) { now = name; pose(t); scene.updateMatrixWorld(true); st = setStyle(name, { scene, key: sun, fill: fillL, amb, spot, bloom, renderer, grade: grade.material.uniforms, size: [W, H] }); }
    renderer.setRenderTarget(accum); renderer.setClearColor(0, 1); renderer.clear();
    for (let k = 0; k < n; k++) { const d = n === 1 ? 0 : ((k + 0.5) / n - 0.5) * ((st?.shutter ?? 0.5) / 60); pose(t + d); shoot(k, n); let tex; if (st?.render) tex = st.render(renderer, scene, camera, k); else { renderer.setRenderTarget(rt); renderer.render(scene, camera); tex = rt.texture; }
      addPass.material.uniforms.tex.value = tex; addPass.material.uniforms.w.value = 1 / n; renderer.setRenderTarget(accum); renderer.autoClear = false; addPass.render(renderer); renderer.autoClear = true; }
    if (bloom.strength > 0.001) bloom.render(renderer, accum, accum, 0, false); renderer.setRenderTarget(null); grade.render(renderer); } };
}
