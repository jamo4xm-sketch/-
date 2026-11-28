// The railway: a steam train crossing a tall stone viaduct along a mountain gorge. The train stays put and the world slides past it
// (one continuous run, never a loop), so a wipe always shows the same moment in two looks. Pure function of t.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { V, hash, surf, ball, ringG, rbox, turn, blade, cushion } from './shapes3.js';
import { setStyle, SKY } from './styles4.js';
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
const mod = (a, b) => ((a % b) + b) % b, TAU = Math.PI * 2, ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
export const LOOKS = ['lit'];
export const C = { boiler: '#2d6a4b', black: '#25272c', red: '#b8382c', brass: '#dca744', roof: '#34363b', steel: '#9aa1a8', coal: '#202125', coach: '#7d2e2c', cream: '#f0e2c3', glass: '#2b3f4e', lamp: '#ffe9a6',
  stone: '#b9a98f', stone2: '#a39279', arch: '#c7b89c', ballast: '#7f786e', sleeper: '#5c4634', rail: '#8f959c', ground: '#7f9558', rock: '#8c8478', creek: '#5ea3c2', pine: '#2c5a3c', pine2: '#3b6e47', trunk: '#5c402c', ridge1: '#7f9aab', ridge2: '#a9bfcd', sky: '#cfe3ef', smoke: '#f1f2f3' };
// the line runs towards the camera's left: local +x = forward, local -z = the side the camera sees
const DIR = V(-0.574, 0, 0.819).normalize(), PHI = Math.atan2(-DIR.z, DIR.x), SPD = 0.062;
export const TRK = { DIR, PHI, SPD };
// the gorge in the track's own frame (x along the line, z across it; the creek runs on the camera's side)
export const groundY = (x, z) => -0.60 + 0.06 * Math.sin(x * 1.3 + 0.5) + 0.50 * ss(0.14, 1.8, z) - 0.12 * ss(2.0, 3.0, z) + 0.55 * ss(-0.42, -1.10, z) - 0.06 * Math.exp(-(((z + 0.30) / 0.07) ** 2))
  + 0.030 * Math.sin(x * 7.1 + z * 3.3) + 0.022 * Math.sin(x * 3.7 - z * 8.9 + 1.3) + 0.012 * Math.sin(x * 15.0 + z * 11.0) + 0.05 * ss(0.3, 1.2, z) * Math.sin(x * 2.3 + z * 4.1);
export function makeRail(canvas, W, H) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }), accum = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
  const scene = new THREE.Scene(); scene.background = new THREE.Color(C.sky);
  const mats = new Map(), M = (c, rough = 0.6, side = THREE.FrontSide) => { const id = c + rough + side; if (!mats.has(id)) mats.set(id, new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0, side })); return mats.get(id); };
  // tags: part = its role (the looks dress by part), layer = parts that share an outline
  const add = (g, col, par, d = {}) => { const o = new THREE.Mesh(g, M(col, d.rough ?? 0.6, d.two ? THREE.DoubleSide : THREE.FrontSide)); o.castShadow = o.receiveShadow = true; Object.assign(o.userData, { kind: 'obj', col, ...d }); par.add(o); return o; };
  const grp = (par, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(rx, ry, rz); par.add(g); return g; };
  const line = (a, b, n = 3) => Array.from({ length: n }, (_, i) => a.clone().lerp(b, i / (n - 1)));
  // a long bar along x with a rounded-square section (open ends, they are never seen)
  const bar = (len, h, d, p = 8, nv = 120) => surf((u, v, o) => { const a = u * TAU, sa = Math.sin(a), ca = Math.cos(a); return o.set((v - 0.5) * len, h / 2 * Math.sign(sa) * Math.abs(sa) ** (2 / p), d / 2 * Math.sign(ca) * Math.abs(ca) ** (2 / p)); }, 28, nv, { closed: true });

  // ---------- sky and the far ridges (they slide slower than the gorge)
  const sky = add(surf((u, v, o) => o.set((u - 0.5) * 7.0, 2.4 - v * 5.2, 0), 2, 2, { closed: false, flip: true }), C.sky, scene, { kind: 'back', part: 'sky' }); sky.position.z = -7.5; sky.castShadow = sky.receiveShadow = false;
  const far = grp(scene), world = grp(scene), trk = grp(world, 0, 0, 0, 0, PHI, 0);
  const ridge = (zc, base, top, seed, col, lay) => { const pk = (x) => top + 0.16 * Math.sin(x * 1.7 + seed) + 0.10 * Math.sin(x * 3.9 + seed * 2) + 0.05 * Math.sin(x * 9.3 + seed * 3) + 0.16 * Math.exp(-(((x - 0.9 + seed * 0.1) / 0.5) ** 2));
    const o = add(surf((u, v, q) => { const x = -4.2 + 8.4 * u; return q.set(x, base + (pk(x) - base) * v, zc - 0.9 * v * v); }, 160, 14, { closed: false, flip: false }), col, far, { kind: 'back', part: 'ridge', layer: lay }); o.castShadow = false; return o; };
  ridge(-5.6, -1.2, 0.30, 2.0, C.ridge2, 'r2'); ridge(-4.0, -1.2, -0.02, 5.0, C.ridge1, 'r1');

  // ---------- the gorge: ground, creek, rocks, pines (all on the track's frame)
  const XL = -3.4, XR = 2.6;
  const ground = add(surf((u, v, o) => { const x = XL + (XR - XL) * u, z = -1.55 + 4.6 * v; return o.set(x, groundY(x, z), z); }, 170, 130, { closed: false, flip: true }), C.ground, trk, { kind: 'back', part: 'ground' }); ground.castShadow = false;
  { const o = add(surf((u, v, q) => { const x = XL + (XR - XL) * u, z = -0.30 + (v - 0.5) * 0.075; return q.set(x, groundY(x, -0.30) + 0.012 + 0.004 * Math.sin(x * 9.0), z); }, 120, 4, { closed: false, flip: true }), C.creek, trk, { part: 'creek', rough: 0.15 }); o.castShadow = false; }
  const rock = (x, z, r, seed) => { const o = add(surf((u, v, q) => { const th = v * Math.PI, ph = u * TAU, s = Math.sin(th), k = r * (1 + 0.16 * Math.sin(3 * ph + seed) * s + 0.12 * Math.sin(2 * th + 5 * ph + seed * 2) * s + 0.07 * Math.sin(7 * ph - 3 * th + seed)); return q.set(k * s * Math.sin(ph), k * 0.66 * Math.cos(th), k * s * Math.cos(ph)); }, 30, 20), C.rock, trk, { part: 'rock' }); o.position.set(x, groundY(x, z) + r * 0.15, z); o.rotation.y = seed; };
  for (let i = 0; i < 26; i++) { const x = XL + 0.2 + (XR - XL - 0.4) * hash(i * 3.1 + 1), z = -0.22 - 0.16 * hash(i * 5.7 + 2) + (i % 3 === 0 ? -0.18 : 0); rock(x, z, 0.018 + 0.030 * hash(i * 7.3 + 3), i * 1.7); }
  const pines = []; const pine = (x, z, h, seed, par = trk) => { const g = grp(par, x, groundY(x, z) - 0.012 * h / 0.15, z, 0, seed, 0), lay = 'p' + pines.length; add(blade(line(V(0, 0, 0), V(0, h * 0.45, 0)), h * 0.028, h * 0.028, { nu: 10, nv: 6, cap: 0.05, up: V(1, 0, 0) }), C.trunk, g, { part: 'trunk', layer: lay });
    for (let k = 0; k < 4; k++) { const y0 = h * (0.16 + 0.205 * k), th = h * 0.40 * (1 - 0.13 * k), w = h * 0.31 * (1 - 0.21 * k), sd = seed * 7 + k;
      const o = add(surf((u, v, q) => { const a = u * TAU, j = 0.80 + 0.20 * Math.abs(Math.sin(4.5 * a + sd)) + 0.06 * Math.sin(11 * a + sd * 3), r = w * Math.pow(1 - v, 1.15) * j; return q.set(r * Math.sin(a), y0 + v * th - 0.16 * th * (1 - v) * (1 - v) * j, r * Math.cos(a)); }, 44, 10, { closed: false, flip: true }), k % 2 ? C.pine2 : C.pine, g, { part: 'pine', layer: lay, two: true }); o.castShadow = true; }
    pines.push(g); return g; };
  // the far bank is a forest, the near bank has a few, two big ones frame the bottom corners
  for (let i = 0; i < 70; i++) { const x = XL + 0.1 + (XR - XL - 0.2) * hash(i * 1.37 + 11), z = 0.20 + 1.35 * Math.pow(hash(i * 2.91 + 5), 0.8); pine(x, z, 0.10 + 0.11 * hash(i * 4.4 + 9), i * 2.3); }
  for (let i = 0; i < 26; i++) { const x = XL + 0.1 + (XR - XL - 0.2) * hash(i * 6.1 + 41), z = -0.50 - 0.75 * hash(i * 3.3 + 17); pine(x, z, 0.12 + 0.10 * hash(i * 8.1 + 2), i * 3.1 + 1); }

  // ---------- the viaduct: tall piers, round arches, a deck with parapets, ballast, sleepers and two rails
  const PS = 0.24, PW = 0.058, SPR = -0.20, AR = (PS - PW) / 2, DECK = -0.026, HW = 0.082, X0 = -3.36, NS = 25;
  const archY = (x, m) => { const d = Math.abs(x - m); return d < AR ? SPR + Math.sqrt(AR * AR - d * d) : SPR; };
  for (let k = 0; k <= NS; k++) { const a = X0 + k * PS, fl = Math.min(groundY(a, -HW), groundY(a, HW), groundY(a, 0)) - 0.04, h = SPR - fl;
    const p = add(rbox(PW, h, HW * 2 + 0.02, 9, 24, 20), k % 2 ? C.stone : C.stone2, trk, { part: 'stone', pier: true }); p.position.set(a, fl + h / 2, 0);
    const cap = add(rbox(PW + 0.016, 0.012, HW * 2 + 0.032, 6, 20, 12), C.arch, trk, { part: 'arch' }); cap.position.set(a, SPR + 0.004, 0);
    if (k === NS) break; const m = a + PS / 2;
    for (const s of [-1, 1]) { const f = add(surf((u, v, o) => { const x = a + PS * u; return o.set(x, archY(x, m) + (DECK - archY(x, m)) * v, s * HW); }, 48, 6, { closed: false, flip: s < 0 }), C.stone, trk, { part: 'stone', face: s }); f.castShadow = s > 0;
      const ring = []; for (let i = 0; i <= 16; i++) { const th = Math.PI * i / 16; ring.push(V(m + (AR + 0.009) * Math.cos(th), SPR + (AR + 0.009) * Math.sin(th), s * (HW + 0.004))); } add(blade(ring, 0.010, 0.006, { nu: 12, nv: 40, cap: 0.0, up: V(0, 0, 1) }), C.arch, trk, { part: 'arch' }); }
    add(surf((u, v, o) => { const th = Math.PI * (1 - u); return o.set(m + AR * Math.cos(th), SPR + AR * Math.sin(th), (v - 0.5) * 2 * HW); }, 24, 4, { closed: false, flip: false }), C.stone2, trk, { part: 'stone', two: true }); }
  const XA = X0 - 0.03, XB = X0 + NS * PS + 0.03;
  for (const s of [-1, 1]) { add(bar(XB - XA, 0.016, 0.014), C.arch, trk, { part: 'arch' }).position.set((XA + XB) / 2, DECK - 0.006, s * (HW + 0.006)); add(bar(XB - XA, 0.022, 0.014), C.stone, trk, { part: 'parapet' }).position.set((XA + XB) / 2, DECK + 0.010, s * (HW - 0.004)); }
  add(bar(XB - XA, 0.024, 0.118, 5), C.ballast, trk, { part: 'ballast' }).position.set((XA + XB) / 2, DECK - 0.004, 0);
  { const gs = []; for (let x = XA + 0.02; x < XB - 0.02; x += 0.032) { const g = rbox(0.013, 0.007, 0.096, 5, 10, 6); g.translate(x, -0.0135, 0); gs.push(g); } const o = add(mergeGeometries(gs), C.sleeper, trk, { part: 'sleeper' }); }
  for (const s of [-1, 1]) add(blade(line(V(XA, -0.0055, s * 0.032), V(XB, -0.0055, s * 0.032), 5), 0.0055, 0.0035, { nu: 10, nv: 8, cap: 0, up: V(0, 0, 1) }), C.rail, trk, { part: 'rail', rough: 0.3 });

  // ---------- the train: local +x forward, rails at y = 0, gauge 0.064
  const train = grp(scene, -0.075, 0, 0.20, 0, PHI, 0), T = (g, c, d = {}, par = train) => add(g, c, par, { layer: 'T', ...d });
  const wheels = [], WR = 0.036;
  const wheel = (x, r, z, spokes, par = train, c = C.red) => { const g = grp(par, x, r, z); const s = z < 0 ? -1 : 1;
    T(turn([[0.0, -0.0045], [r * 0.93, -0.0045], [r, -0.0025], [r, 0.0025], [r * 0.93, 0.0045], [0.0, 0.0045]].map(([a, b]) => [a, b]), 36, 10), c, { part: 'wheel' }, g).rotation.x = Math.PI / 2;
    if (spokes) { const sp = []; for (let i = 0; i < spokes; i++) { const a = i / spokes * TAU, b = blade([V(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22, 0), V(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, 0), V(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, 0)], 0.0028, 0.0022, { nu: 8, nv: 6, cap: 0, up: V(0, 0, 1) }); sp.push(b); } const o = T(mergeGeometries(sp), c, { part: 'spoke' }, g); o.position.z = s * 0.0050; }
    const hub = T(ball(r * 0.26, r * 0.26, 0.004, 18, 10), C.steel, { part: 'hub', rough: 0.35 }, g); hub.position.z = s * 0.0062;
    T(ringG(r * 0.93, 0.0032, 10, 44), C.steel, { part: 'tyre', rough: 0.35 }, g).position.z = s * 0.0048; wheels.push({ g, r }); return g; };
  // drivers (three a side), pony wheels, cylinders, frame, running board
  const DX = [-0.112, -0.188, -0.264];
  for (const z of [-0.034, 0.034]) { DX.forEach((x) => wheel(x, WR, z, 12)); wheel(-0.038, 0.021, z, 8); }
  T(rbox(0.30, 0.040, 0.050, 8, 30, 16), C.black, { part: 'frame' }).position.set(-0.16, 0.050, 0);
  T(rbox(0.335, 0.006, 0.142, 8, 34, 16), C.black, { part: 'frame' }).position.set(-0.178, 0.0775, 0);
  for (const z of [-1, 1]) { T(blade(line(V(-0.066, 0.044, z * 0.060), V(-0.012, 0.044, z * 0.060)), 0.0150, 0.0150, { nu: 24, nv: 10, cap: 0.08, up: V(0, 1, 0) }), C.boiler, { part: 'cylinder' });
    for (const x of [-0.062, -0.016]) T(ringG(0.0152, 0.0022, 8, 30), C.brass, { part: 'trim' }).position.set(x, 0.044, z * 0.060), train.children[train.children.length - 1].rotation.y = Math.PI / 2;
  }
  // buffer beam, buffers, coupling
  T(rbox(0.013, 0.030, 0.150, 8, 10, 24), C.red, { part: 'beam' }).position.set(-0.004, 0.058, 0);
  for (const z of [-0.048, 0.048]) { T(blade(line(V(0.002, 0.058, z), V(0.020, 0.058, z)), 0.0062, 0.0062, { nu: 14, nv: 6, cap: 0.05, up: V(0, 1, 0) }), C.black, { part: 'buffer' }); const hd = T(ball(0.0035, 0.0115, 0.0115, 18, 12), C.steel, { part: 'buffer', rough: 0.3 }); hd.position.set(0.022, 0.058, z); }
  // boiler, smokebox and its door, bands, chimney, dome, safety valve, handrails
  T(blade(line(V(-0.272, 0.104, 0), V(-0.076, 0.104, 0)), 0.0385, 0.0385, { nu: 40, nv: 20, cap: 0.01, up: V(0, 1, 0) }), C.boiler, { part: 'boiler' });
  T(blade(line(V(-0.080, 0.104, 0), V(-0.012, 0.104, 0)), 0.0405, 0.0405, { nu: 40, nv: 10, cap: 0.03, up: V(0, 1, 0) }), C.black, { part: 'smokebox' });
  { const d = T(cushion(() => 0.034, 0.0065, 44, 12), C.black, { part: 'smokebox' }); d.position.set(-0.012, 0.104, 0); d.rotation.y = Math.PI / 2; const hd = T(blade(line(V(-0.004, 0.104, -0.012), V(-0.004, 0.104, 0.012)), 0.0018, 0.0018, { nu: 8, nv: 6, cap: 0.2 }), C.brass, { part: 'trim' }); }
  { const nb = T(ringG(0.0345, 0.0024, 8, 40), C.steel, { part: 'trim', rough: 0.3 }); nb.position.set(-0.008, 0.104, 0); nb.rotation.y = Math.PI / 2; }
  for (const x of [-0.124, -0.198, -0.262]) { const b = T(ringG(0.0392, 0.0022, 8, 48), C.brass, { part: 'trim', rough: 0.3 }); b.position.set(x, 0.104, 0); b.rotation.y = Math.PI / 2; }
  T(turn([[0.0128, 0.0], [0.0122, 0.030], [0.0142, 0.040], [0.0168, 0.050], [0.0162, 0.055], [0.0090, 0.0555], [0.0, 0.0555]], 30, 16), C.black, { part: 'chimney' }).position.set(-0.042, 0.130, 0);
  { const r = T(ringG(0.0162, 0.0024, 8, 30), C.brass, { part: 'trim', rough: 0.3 }); r.position.set(-0.042, 0.183, 0); r.rotation.x = Math.PI / 2; }
  T(turn([[0.0215, 0.0], [0.0205, 0.012], [0.0165, 0.022], [0.0080, 0.0285], [0.0, 0.0295]], 30, 14), C.brass, { part: 'dome', rough: 0.3 }).position.set(-0.165, 0.134, 0);
  T(turn([[0.0085, 0.0], [0.0075, 0.012], [0.0090, 0.020], [0.0, 0.022]], 20, 10), C.brass, { part: 'dome', rough: 0.3 }).position.set(-0.236, 0.137, 0);
  for (const z of [-1, 1]) T(blade(line(V(-0.262, 0.124, z * 0.044), V(-0.020, 0.124, z * 0.044)), 0.0017, 0.0017, { nu: 8, nv: 12, cap: 0.01 }), C.steel, { part: 'trim' });
  // headlamps: one on the smokebox, two on the beam
  const lampAt = [[-0.004, 0.150, 0], [0.003, 0.080, -0.040], [0.003, 0.080, 0.040]]; for (const [x, y, z] of lampAt) { const g = grp(train, x, y, z); T(rbox(0.014, 0.016, 0.016, 6, 18, 12), C.black, { part: 'lampbox' }, g); const l = T(ball(0.0025, 0.0058, 0.0058, 14, 10), C.lamp, { part: 'lamp', rough: 0.2 }, g); l.position.x = 0.007; }
  // cab: sides, round front windows, side windows, roof
  T(rbox(0.088, 0.096, 0.128, 9, 30, 24), C.boiler, { part: 'cab' }).position.set(-0.318, 0.127, 0);
  T(rbox(0.012, 0.060, 0.126, 7, 12, 16), C.black, { part: 'cab' }).position.set(-0.362, 0.110, 0);
  for (const z of [-0.032, 0.032]) { const w = T(ball(0.0022, 0.0118, 0.0118, 14, 10), C.glass, { part: 'window', rough: 0.15 }); w.position.set(-0.2735, 0.152, z); const r = T(ringG(0.0118, 0.0018, 8, 26), C.brass, { part: 'trim', rough: 0.3 }); r.position.set(-0.2735, 0.152, z); r.rotation.y = Math.PI / 2; }
  for (const z of [-1, 1]) { const w = T(rbox(0.040, 0.034, 0.003, 6, 14, 8), C.glass, { part: 'window', rough: 0.15 }); w.position.set(-0.322, 0.150, z * 0.0645); const ln = T(rbox(0.074, 0.004, 0.003, 6, 14, 6), C.cream, { part: 'lining' }); ln.position.set(-0.318, 0.110, z * 0.0645); }
  T(rbox(0.104, 0.010, 0.142, 6, 30, 14), C.roof, { part: 'roof' }).position.set(-0.318, 0.179, 0);
  // tender: tank, coal, wheels
  T(rbox(0.205, 0.080, 0.136, 9, 40, 24), C.boiler, { part: 'tender' }).position.set(-0.490, 0.108, 0);
  for (const z of [-1, 1]) T(rbox(0.190, 0.004, 0.003, 6, 30, 6), C.cream, { part: 'lining' }).position.set(-0.490, 0.090, z * 0.0682);
  T(surf((u, v, o) => { const x = -0.40 - 0.17 * u, z = (v - 0.5) * 0.118, e = Math.sin(Math.PI * u) * Math.sin(Math.PI * v); return o.set(x, 0.146 + 0.020 * Math.pow(e, 0.6) + 0.004 * Math.sin(u * 37 + v * 23) * e + 0.003 * Math.sin(u * 71 - v * 53), z); }, 40, 20, { closed: false, flip: false }), C.coal, { part: 'coal' });
  T(rbox(0.205, 0.022, 0.050, 6, 30, 10), C.black, { part: 'frame' }).position.set(-0.490, 0.050, 0);
  for (const z of [-0.034, 0.034]) for (const x of [-0.418, -0.490, -0.562]) wheel(x, 0.024, z, 10);
  // two coaches, maroon and cream, a band of windows
  for (let i = 0; i < 2; i++) { const x0 = -0.612 - i * 0.400, xc = x0 - 0.185;
    T(rbox(0.370, 0.064, 0.128, 9, 50, 20), C.coach, { part: 'coach' }).position.set(xc, 0.082, 0);
    T(rbox(0.370, 0.044, 0.124, 9, 50, 16), C.cream, { part: 'panel' }).position.set(xc, 0.134, 0);
    T(rbox(0.382, 0.012, 0.134, 5, 50, 14), C.roof, { part: 'roof' }).position.set(xc, 0.160, 0);
    for (const z of [-1, 1]) for (let j = 0; j < 7; j++) { const w = T(rbox(0.034, 0.028, 0.003, 6, 12, 6), C.glass, { part: 'window', rough: 0.15 }); w.position.set(x0 - 0.034 - j * 0.051, 0.136, z * 0.0625); }
    for (const z of [-0.034, 0.034]) for (const x of [x0 - 0.050, x0 - 0.100, x0 - 0.270, x0 - 0.320]) wheel(x, 0.019, z, 0, train, C.black);
    T(rbox(0.36, 0.018, 0.06, 6, 30, 10), C.black, { part: 'frame' }).position.set(xc, 0.036, 0); }
  // rods: coupling rods ride on the crank pins, connecting rod from the crosshead, piston rod into the cylinder
  const RC = 0.019, rods = [];
  for (const z of [-1, 1]) { const cp = grp(train, 0, 0, z * 0.046); T(blade(line(V(DX[0] - 0.005, WR, 0), V(DX[2] + 0.005, WR, 0)), 0.0042, 0.0018, { nu: 10, nv: 18, cap: 0.08, up: V(0, 1, 0) }), C.steel, { part: 'rod', rough: 0.3 }, cp);
    for (const x of DX) { const pn = T(ball(0.0045, 0.0045, 0.0030, 12, 8), C.steel, { part: 'rod', rough: 0.3 }, cp); pn.position.set(x, WR, 0.003 * z); }
    const cr = grp(train, 0, 0, z * 0.052); const L = 0.105; T(blade(line(V(0, 0, 0), V(L, 0, 0)), (v) => 0.0048 - 0.0012 * v, 0.0018, { nu: 10, nv: 14, cap: 0.08, up: V(0, 1, 0) }), C.steel, { part: 'rod', rough: 0.3 }, cr);
    const xh = T(rbox(0.014, 0.010, 0.006, 6, 12, 8), C.steel, { part: 'rod', rough: 0.3 }); const pr = T(blade(line(V(0, 0, 0), V(0.045, 0, 0)), 0.0020, 0.0020, { nu: 8, nv: 6, cap: 0.05, up: V(0, 1, 0) }), C.steel, { part: 'rod', rough: 0.3 });
    rods.push({ z, cp, cr, xh, pr, L, ph: z < 0 ? 0 : Math.PI / 2 }); }

  // ---------- smoke: puffs leave the chimney, swell, drift back over the train and fade by shrinking
  const PUFFS = 13, LIFE = 3.4, puffs = [];
  for (let i = 0; i < PUFFS; i++) { const g = grp(train), b = []; for (let k = 0; k < 5; k++) { const o = T(ball(1, 0.86, 1, 22, 14), C.smoke, { part: 'smoke', layer: 's' + i, rough: 0.9 }, g); o.castShadow = false; b.push(o); } puffs.push({ g, b, i }); }

  // ---------- light
  const KEY = V(1.6, 2.6, 1.2), sun = new THREE.DirectionalLight(0xfff2de, 3.0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -1.1, right: 1.1, top: 1.1, bottom: -1.1, near: 0.3, far: 8 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.003; scene.add(sun, sun.target);
  const fillL = new THREE.DirectionalLight(0xc8dcf0, 0.9); fillL.castShadow = true; fillL.shadow.mapSize.set(1024, 1024); Object.assign(fillL.shadow.camera, { left: -1.1, right: 1.1, top: 1.1, bottom: -1.1, near: 0.3, far: 8 }); fillL.shadow.bias = -0.0008; fillL.shadow.normalBias = 0.005; scene.add(fillL, fillL.target);
  const amb = new THREE.AmbientLight(0xffffff, 0.40); scene.add(amb); const spot = new THREE.SpotLight(0xffe2a0, 0, 1.6, 0.26, 0.55, 1.2); scene.add(spot, spot.target);

  // ---------- pose: everything from t
  const LW = V(), tmp = V();
  function pose(t) {
    SKY.time.value = t; const s = SPD * t; world.position.copy(DIR).multiplyScalar(-s); far.position.copy(DIR).multiplyScalar(-s * 0.22);
    const ang = -s / WR * 1.0; for (const w of wheels) w.g.rotation.z = ang * WR / w.r;
    for (const r of rods) { const a = ang + r.ph, px = Math.cos(a) * RC, py = Math.sin(a) * RC; r.cp.position.set(px, py, r.z * 0.046); const pin = V(DX[1] + px, WR + py, 0), cy = 0.044, xhx = pin.x + Math.sqrt(r.L * r.L - (pin.y - cy) ** 2);
      r.cr.position.set(xhx, cy, r.z * 0.052); r.cr.rotation.z = Math.atan2(pin.y - cy, pin.x - xhx); r.xh.position.set(xhx, cy, r.z * 0.056); r.pr.position.set(xhx, cy, r.z * 0.060); }
    for (const p of puffs) { const q = mod(t / LIFE + p.i / PUFFS + 0.031, 1), h = hash(p.i * 3.7 + Math.floor(t / LIFE + p.i / PUFFS + 0.031) * 1.3), r = 0.010 + 0.052 * Math.pow(q, 0.62), grow = ss(0.0, 0.06, q) * (1 - ss(0.80, 1.0, q));
      p.g.position.set(-0.042 - 0.34 * q - 0.10 * q * q, 0.188 + 0.15 * Math.pow(q, 0.75) + 0.05 * q * q, 0.02 * Math.sin(q * 5 + h * 6) + 0.05 * q * (h - 0.5));
      p.b.forEach((o, k) => { const a = k / 5 * TAU + h * 4, e = k === 0 ? 0 : 0.62; o.position.set(Math.cos(a) * r * e, Math.sin(a) * r * e * 0.7 + (k === 0 ? 0 : 0.15 * r), Math.sin(a * 1.7) * r * e * 0.6); o.scale.setScalar(r * (k === 0 ? 1.0 : 0.62 + 0.18 * hash(k + p.i * 5)) * grow); }); }
    train.updateMatrixWorld(true); SKY.lamp.value.set(-0.004 + 0.007, 0.150, 0).applyMatrix4(train.matrixWorld); SKY.target.value.copy(SKY.lamp.value).addScaledVector(DIR, 0.6).setY(0); SKY.focus.value.set(0, 0.1, 0).applyMatrix4(train.matrixWorld);
  }
  const camera = new THREE.PerspectiveCamera(27, W / H, 0.05, 30); camera.position.set(0, 0.40, 2.30); camera.lookAt(0, -0.10, 0); const pe = camera.projectionMatrix.clone();
  function shoot(k, n) { camera.projectionMatrix.copy(pe); if (n > 1) { camera.projectionMatrix.elements[8] += 2 * (halton(k + 1, 5) - 0.5) / W; camera.projectionMatrix.elements[9] += 2 * (halton(k + 1, 7) - 0.5) / H; } camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert(); const s = n > 1 ? 0.16 : 0; sun.position.set(KEY.x + (halton(k + 1, 11) - 0.5) * s, KEY.y + (halton(k + 1, 13) - 0.5) * s, KEY.z + (halton(k + 1, 17) - 0.5) * s); const h1 = n > 1 ? halton(k + 1, 19) : 0.5, h2 = n > 1 ? halton(k + 1, 23) : 0.3, phi = h2 * TAU, r = Math.sqrt(1 - h1); fillL.position.set(Math.cos(phi) * r * 3 + 1.0, Math.abs(Math.sin(phi)) * r * 3 + 0.6, Math.sqrt(h1) * 3 + 0.4); }

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
