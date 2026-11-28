// The fuller scene: the rocket leaves a canyon launch site. Every look replays the same climb (tau = seconds since its swap). Pure function of (t, tau).
import * as THREE from 'three';
import { toCreasedNormals, mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { setStyle, LOOK, SCROLL, SKY } from './styles2.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z), hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
const mod = (a, b) => ((a % b) + b) % b;
export const LOOKS = ['chrome', 'paper', 'neon', 'clay', 'thermal', 'blueprint', 'shadow', 'voxel', 'synth', 'toon'];
// --- per-look tuning of the kit for this scene
Object.assign(LOOK, { big: 99 });
Object.assign(LOOK.voxel, { size: 0.026, jitter: 0.10 }); Object.assign(LOOK.blueprint, { cell: 0.12, outline: 0.0022, bloom: 0.18 }); Object.assign(LOOK.synth, { cell: 0.14, outline: 0.0026 });
Object.assign(LOOK.toon, { outline: 0.0042, key: 0.5, fill: 2.0 }); Object.assign(LOOK.paper, { outline: 0.0, grain: 1.4, key: 0.95, fill: 1.2, sat: 0.8 }); Object.assign(LOOK.clay, { bloom: 0.04 });

const C = { sand: '#e9b97f', r1: '#b4543a', r2: '#d97b4e', r3: '#efab70', r4: '#c8663f', grass: '#35935c', pine: '#1f7a4b', pine2: '#2f9258', trunk: '#7a4a2e', steel: '#5b6478', gold: '#e89f1e', cream: '#f3ead9', blue: '#2457D6', sky2: '#2f68dd', dark: '#2a2c3a', smoke: '#fbf4ea', ridgeA: '#c58fae', ridgeB: '#cf7c62', planet: '#ee9436', crater: '#c96a22', ring: '#ffd98f' };
export const WORLD = {
  toon: { wall: '#57c3f2', star: '#fff6c9', cloud: '#ffffff' }, voxel: { wall: '#7fc4e8', star: '#ffffff', cloud: '#ffffff' },
  chrome: { wall: '#3b2f78', star: '#e9e2ff', cloud: '#efeaff' }, paper: { wall: '#1f4a54', star: '#f3e3bd', cloud: '#efe4cf' }, neon: { wall: '#0b0a16', star: '#7d86ff', cloud: '#12101f' },
  clay: { wall: '#f2c4ac', star: '#f4ecdf', cloud: '#fff3e6' }, thermal: { wall: '#140a3a', star: '#3050ff', cloud: '#2a2a9c' }, blueprint: { wall: '#0A2457', star: '#DCEBFF', cloud: '#0B2A66' },
  shadow: { wall: '#d9a050', star: '#fff0c8', cloud: '#0A0709' }, synth: { wall: '#16072D', star: '#ffd1f5', cloud: '#2A1458' } };
export function makeRocket(canvas, W, H) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }), accum = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05040a);
  const M = (c, rough = 0.55) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0 });
  const add = (g, m, parent = scene, kind = 'obj', heat) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = true; o.userData.kind = kind; if (heat != null) o.userData.heat = heat; parent.add(o); return o; };
  const lathe = (pts, n = 72) => new THREE.LatheGeometry([...pts].reverse().map(([x, y]) => new THREE.Vector2(x, y)), n);
  const spline = (pts, n) => new THREE.CatmullRomCurve3(pts.map(([x, y]) => V(x, y, 0)), false, 'centripetal').getPoints(n).map((p) => [Math.max(0, p.x), p.y]);

  const wall = add(new THREE.PlaneGeometry(7, 7), M('#57c3f2', 0.95), scene, 'back'); wall.position.z = -1.7; wall.userData.face = { axis: 'z', floor: false, normal: V(0, 0, 1) }; wall.userData.sky = true; wall.castShadow = false;
  const tag = (o, d) => { Object.assign(o.userData, d); return o; };
  const land = new THREE.Group(); scene.add(land); const far = new THREE.Group(); scene.add(far);
  const GY = -0.47;
  const floor = add(new THREE.CircleGeometry(3.2, 64), M(C.sand, 0.95), land, 'back'); floor.rotation.x = -Math.PI / 2; floor.position.y = GY; floor.userData.face = { axis: 'y', floor: true, normal: V(0, 1, 0) }; floor.userData.ground = true;

  // --- the ringed planet, high and far
  const planet = new THREE.Group(); planet.position.set(0.36, 0.63, -1.45); planet.rotation.z = -0.38; scene.add(planet);
  const pm = tag(add(new THREE.SphereGeometry(0.17, 64, 40), M(C.planet, 0.8), planet, 'obj', 0.30), { neon: '#ffcf3a', vox: 0.034 }); pm.castShadow = false;
  [[-0.06, 0.07, 0.034], [0.07, -0.02, 0.046], [-0.03, -0.08, 0.026], [0.05, 0.11, 0.02]].forEach(([x, y, r]) => { const c = tag(add(new THREE.SphereGeometry(r, 24, 14), M(C.crater, 0.9), planet, 'obj', 0.22), { prio: 2, line: 0.5, neon: '#ffcf3a', vox: 0.034 }); const z = Math.sqrt(Math.max(0, 0.17 * 0.17 - x * x - y * y)); c.position.set(x, y, z - r * 0.15); c.scale.z = 0.35; c.castShadow = false; });
  const ringP = tag(add(new THREE.TorusGeometry(0.265, 0.017, 14, 96), M(C.ring, 0.6), planet, 'obj', 0.36), { prio: 1, neon: '#5df2ff', vox: 0.034 }); ringP.rotation.x = Math.PI / 2 - 0.30; ringP.scale.z = 0.5; ringP.castShadow = false;

  // --- two ridges of mesas
  const mesa = (seed, n, w, base, hi, depth) => { const s = new THREE.Shape(); s.moveTo(-w, base - 0.5); let x = -w; s.lineTo(x, base);
    for (let i = 0; i < n; i++) { const ww = (2 * w / n) * (0.75 + 0.5 * hash(seed + i)), h = hi * (0.25 + 0.75 * hash(seed + i + 50)); s.lineTo(x + ww * 0.16, base + h * 0.55); s.lineTo(x + ww * 0.24, base + h * 0.6); s.lineTo(x + ww * 0.28, base + h); s.lineTo(x + ww * 0.62, base + h); s.lineTo(x + ww * 0.68, base + h * 0.62); s.lineTo(x + ww * 0.84, base + h * 0.5); s.lineTo(x + ww, base + 0.02); x += ww; }
    s.lineTo(x, base - 0.5); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.01, bevelSegments: 2 }); };
  const rA = tag(add(mesa(7, 7, 0.95, GY - 0.10, 0.36, 0.10), M(C.ridgeA, 0.9), far, 'obj', 0.10), { neon: '#6a5cff', vox: 0.05, line: 0.7, layer: 1 }); rA.position.z = -1.35;
  const rB = tag(add(mesa(31, 6, 0.9, GY - 0.08, 0.27, 0.12), M(C.ridgeB, 0.9), far, 'obj', 0.13), { neon: '#b14bff', vox: 0.045, line: 0.8, layer: 2 }); rB.position.z = -0.98; rA.castShadow = rB.castShadow = false;

  // --- canyon cliffs: stacked strata, each ledge a slab
  const slabG = (r, h, seed, s0) => { const s = new THREE.Shape(), N = 64; for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, k = 1 + 0.055 * Math.sin(3 * a + s0) + 0.035 * Math.sin(7 * a + s0 * 2 + seed * 0.4) + 0.02 * Math.sin(13 * a + seed) - 0.075 * Math.pow(Math.max(0, Math.sin(5 * a + s0 * 3)), 10); i ? s.lineTo(Math.cos(a) * r * k, Math.sin(a) * r * k) : s.moveTo(r * k, 0); } s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.004, h - 0.016), bevelEnabled: true, bevelSize: 0.009, bevelThickness: 0.008, bevelSegments: 3, curveSegments: 8 }); g.rotateX(-Math.PI / 2); g.translate(0, 0.008, 0); return g; };
  const matR = [M(C.r1, 0.85), M(C.r2, 0.85), M(C.r3, 0.85), M(C.r4, 0.85)], grassM = M(C.grass, 0.9), tops = {}, slabs = [];
  const cliff = (id, x, z, s0, rows) => { let y = GY - 0.14; const out = []; rows.forEach(([r, h, c, dx = 0, dz = 0], i) => { const g = c === 'g'; const o = tag(add(slabG(r, h, i * 2.3 + s0, s0), g ? grassM : matR[c], land, 'obj', g ? 0.30 : 0.17 + 0.05 * c), { neon: g ? '#39ff9a' : ['#ff5a86', '#ff8a3c', '#ffcf3a', '#ff6a5a'][c], vox: 0.030, layer: id, line: 0.85, prio: g ? 1 : 0 }); o.position.set(x + dx, y, z + dz); y += h; slabs.push(o); out.push({ x: x + dx, z: z + dz, r, y }); }); tops[id] = out; };
  cliff('L', -0.352, -0.30, 0.7, [[0.235, 0.12, 0], [0.222, 0.05, 1], [0.226, 0.028, 'g'], [0.178, 0.07, 3, -0.012], [0.170, 0.045, 2, -0.012], [0.176, 0.026, 1, -0.012], [0.146, 0.085, 0, -0.02, -0.02], [0.140, 0.03, 3, -0.02, -0.02], [0.147, 0.026, 'g', -0.02, -0.02], [0.104, 0.095, 1, -0.030, -0.03], [0.098, 0.045, 2, -0.030, -0.03], [0.104, 0.024, 'g', -0.030, -0.03]]);
  cliff('R', 0.366, -0.34, 2.9, [[0.245, 0.11, 3], [0.230, 0.05, 2], [0.238, 0.03, 'g'], [0.192, 0.075, 1, 0.012], [0.182, 0.035, 0, 0.012], [0.190, 0.026, 'g', 0.012], [0.112, 0.085, 2, 0.055, -0.04], [0.106, 0.045, 3, 0.055, -0.04], [0.112, 0.022, 'g', 0.055, -0.04]]);

  // --- pines
  const pineG = (() => { const gs = [[0.50, 0.34, 0.30], [0.40, 0.32, 0.52], [0.27, 0.32, 0.76]].map(([r, h, y]) => { const g = new THREE.ConeGeometry(r, h * 1.25, 14); g.translate(0, y, 0); return g; }); return mergeGeometries(gs); })(), trunkG = new THREE.CylinderGeometry(0.07, 0.09, 0.22, 10); trunkG.translate(0, 0.09, 0);
  const pineM = [M(C.pine, 0.9), M(C.pine2, 0.9)], trunkM = M(C.trunk, 0.9), pines = [];
  const pine = (x, y, z, h, k = 0, layer = 'T') => { const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(h); g.rotation.y = x * 37; land.add(g); for (const [geo, mat, heat] of [[pineG, pineM[k], 0.34], [trunkG, trunkM, 0.28]]) tag(add(geo, mat, g, 'obj', heat), { neon: '#39ff9a', vox: 0.0175, layer: layer + x, line: 0.6, prio: 3 }); pines.push(g); };
  const on = (id, i, a, k, h, c = 0) => { const s = tops[id][i]; pine(s.x + Math.cos(a) * s.r * k, s.y - 0.004, s.z + Math.sin(a) * s.r * k, h, c); };
  on('L', 2, 1.15, 0.90, 0.085); on('L', 2, 0.62, 0.90, 0.065, 1); on('L', 2, 0.15, 0.9, 0.075); on('L', 8, 1.25, 0.80, 0.072, 1); on('L', 8, 0.55, 0.82, 0.058); on('L', 11, 1.2, 0.35, 0.075); on('L', 11, 0.2, 0.55, 0.055, 1);
  on('R', 2, 1.9, 0.88, 0.085, 1); on('R', 2, 2.45, 0.90, 0.068); on('R', 5, 2.2, 0.82, 0.07, 1); on('R', 8, 1.7, 0.4, 0.075); on('R', 8, 2.9, 0.5, 0.055, 1);
  // foreground corners
  pine(-0.262, GY, 0.30, 0.15, 0); pine(-0.335, GY, 0.22, 0.20, 1); pine(0.275, GY, 0.30, 0.135, 1); pine(0.335, GY, 0.20, 0.19, 0);

  // --- tracking dish on the right ledge
  const steelM = M(C.steel, 0.5), creamM = M(C.cream, 0.45), goldM = M(C.gold, 0.4), blueM = M(C.blue, 0.42), dish = new THREE.Group(), ds = tops.R[5]; dish.position.set(ds.x - 0.092, ds.y, ds.z + 0.120); dish.scale.setScalar(1.12); land.add(dish);
  const part = (g, m, par, d = {}, heat = 0.4) => tag(add(g, m, par, 'obj', heat), { prio: 4, line: 0.65, vox: 0.0145, layer: 'P', ...d });
  { const b = part(new THREE.CylinderGeometry(0.016, 0.028, 0.055, 20), steelM, dish, { neon: '#8aa0ff' }); b.position.y = 0.027; const bowl = new THREE.Group(); bowl.position.y = 0.082; bowl.rotation.set(0.35, -0.55, 0); dish.add(bowl); dish.userData.bowl = bowl;
    const bs = []; for (let i = 0; i <= 14; i++) { const x = i / 14; bs.push(new THREE.Vector2(0.066 * x, 0.030 * x * x)); } for (let i = 14; i >= 0; i--) { const x = i / 14; bs.push(new THREE.Vector2(0.066 * x, 0.030 * x * x - 0.005)); } const bg = new THREE.LatheGeometry(bs.reverse(), 48); bg.rotateX(Math.PI / 2); part(bg, creamM, bowl, { neon: '#5df2ff' }, 0.42).material.side = THREE.DoubleSide;
    const rim = part(new THREE.TorusGeometry(0.066, 0.0045, 10, 48), goldM, bowl, { neon: '#ffcf3a', prio: 5 }); rim.position.z = 0.030; const tip = part(new THREE.SphereGeometry(0.010, 16, 12), goldM, bowl, { neon: '#ffcf3a', prio: 5 }, 0.8); tip.position.z = 0.060;
    for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283, st = part(new THREE.CylinderGeometry(0.0022, 0.0022, 0.063, 6), steelM, bowl, { neon: '#8aa0ff', line: 0.4 }); st.position.set(Math.cos(a) * 0.026, Math.sin(a) * 0.026, 0.039); st.lookAt(bowl.localToWorld(V(0, 0, 0.060))); st.quaternion.setFromUnitVectors(V(0, 1, 0), V(-Math.cos(a) * 0.052, -Math.sin(a) * 0.052, 0.040).normalize()); } }

  // --- launch gantry, bottom left
  const gan = new THREE.Group(); gan.position.set(-0.155, GY, -0.10); gan.rotation.y = 0.35; land.add(gan);
  { const bars = [], B = (a, b, w = 0.0052) => { const d = b.clone().sub(a), g = new THREE.BoxGeometry(w, d.length(), w); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize())); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); bars.push(g); };
    const W = 0.030, HH = 0.235, n = 4; for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(V(sx * W, 0, sz * W), V(sx * W, HH, sz * W), 0.0075);
    for (let i = 0; i < n; i++) { const y0 = HH * i / n, y1 = HH * (i + 1) / n, f = i % 2 ? 1 : -1; for (const s of [-1, 1]) { B(V(-W * f, y0, s * W), V(W * f, y1, s * W)); B(V(s * W, y0, -W * f), V(s * W, y1, W * f)); } for (const [a, b] of [[V(-W, y1, -W), V(W, y1, -W)], [V(-W, y1, W), V(W, y1, W)], [V(-W, y1, -W), V(-W, y1, W)], [V(W, y1, -W), V(W, y1, W)]]) B(a, b, 0.006); }
    part(mergeGeometries(bars), steelM, gan, { neon: '#ff5a86', line: 0.5, vox: 0.011 }, 0.36);
    for (const y of [0.118, HH]) { const p = part(new THREE.BoxGeometry(0.078, 0.009, 0.078), goldM, gan, { neon: '#ffcf3a', prio: 6, vox: 0.011 }, 0.48); p.position.y = y; }
    const arm = part(new THREE.BoxGeometry(0.075, 0.011, 0.016), blueM, gan, { neon: '#4f8dff', prio: 6, vox: 0.011 }, 0.4); arm.position.set(0.062, 0.182, 0.0); const lamp = part(new THREE.SphereGeometry(0.0115, 16, 12), M('#ff4a3a', 0.4), gan, { neon: '#ff3a3a', prio: 7, vox: 0.011 }, 0.9); lamp.position.y = HH + 0.017; }

  // --- pad, tank, rocks
  { const p = part(new THREE.CylinderGeometry(0.152, 0.165, 0.030, 56), steelM, land, { neon: '#8aa0ff', vox: 0.022, line: 0.8 }, 0.5); p.position.set(0, GY + 0.015, 0); const e = part(new THREE.TorusGeometry(0.140, 0.0075, 10, 64), goldM, land, { neon: '#ffcf3a', prio: 5, vox: 0.022 }, 0.6); e.rotation.x = Math.PI / 2; e.position.set(0, GY + 0.031, 0);
    const tank = new THREE.Group(); tank.position.set(0.208, GY, 0.03); land.add(tank); const s = part(new THREE.SphereGeometry(0.042, 32, 22), creamM, tank, { neon: '#5df2ff' }, 0.2); s.position.y = 0.066; const b = part(new THREE.TorusGeometry(0.0425, 0.0042, 10, 40), blueM, tank, { neon: '#4f8dff', prio: 5 }); b.rotation.x = Math.PI / 2; b.position.y = 0.066; for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const l = part(new THREE.CylinderGeometry(0.0045, 0.0045, 0.062, 8), steelM, tank, { neon: '#8aa0ff', line: 0.4 }); l.position.set(x * 0.028, 0.031, z * 0.028); }
    [[-0.215, 0.16, 0.040, 1], [-0.165, 0.22, 0.024, 2], [0.165, 0.24, 0.030, 0], [0.245, 0.17, 0.022, 3]].forEach(([x, z, r, c], i) => { const g = new THREE.IcosahedronGeometry(r, 1), q = g.attributes.position; for (let j = 0; j < q.count; j++) { const k = 0.82 + 0.36 * hash(Math.round(q.getX(j) * 9e3) + Math.round(q.getY(j) * 7e3) * 3 + Math.round(q.getZ(j) * 5e3) * 7 + i); q.setXYZ(j, q.getX(j) * k, q.getY(j) * k * 0.75, q.getZ(j) * k); } g.computeVertexNormals(); const o = part(g, matR[c], land, { neon: '#ff8a3c', vox: 0.02 }, 0.24); o.position.set(x, GY + r * 0.45, z); }); }

  // --- the rocket
  const root = new THREE.Group(); scene.add(root); const ship = new THREE.Group(); root.add(ship);
  const cream = M(C.cream, 0.42), blue = M(C.blue, 0.42), blue2 = M(C.sky2, 0.42), gold = M(C.gold, 0.4), dark = M(C.dark, 0.5), glass = M('#16224a', 0.3), white = M('#ffffff', 0.4);
  const R = (g, m, heat, neon, d = {}) => tag(add(g, m, ship, 'obj', heat), { neon, vox: 0.0112, layer: 'S', line: 1.1, ...d });
  const prof = spline([[0.0, 0.365], [0.028, 0.353], [0.062, 0.318], [0.098, 0.25], [0.122, 0.16], [0.132, 0.06], [0.130, -0.05], [0.116, -0.15], [0.094, -0.225]], 60), radAt = (y) => { for (let i = 1; i < prof.length; i++) if (prof[i][1] <= y) { const a = prof[i - 1], b = prof[i], k = (y - a[1]) / (b[1] - a[1] || 1); return a[0] + (b[0] - a[0]) * k; } return 0.094; };
  const cutY = 0.212, up = prof.filter((p) => p[1] >= cutY), lo = prof.filter((p) => p[1] <= cutY + 0.012);
  R(lathe(lo.concat([[0.0, -0.225]])), cream, 0.34, '#ff5a86'); R(lathe(up.map(([x, y]) => [x * 1.012, y])), blue, 0.26, '#4f8dff', { prio: 1 });
  const tor = (r, w, y, m, heat, neon, d) => { const o = R(new THREE.TorusGeometry(r, w, 14, 64), m, heat, neon, { prio: 3, ...d }); o.rotation.x = Math.PI / 2; o.position.y = y; return o; };
  const band = tor(radAt(cutY) * 1.0 + 0.001, 0.0125, cutY - 0.004, gold, 0.42, '#ffcf3a'), belt = tor(radAt(-0.165) + 0.001, 0.010, -0.165, blue, 0.5, '#4f8dff');
  tor(radAt(0.162) - 0.0012, 0.0035, 0.162, dark, 0.3, '#ff5a86', { line: 0.3, noNeon: true, noVox: true }); tor(radAt(-0.052) - 0.0012, 0.0035, -0.052, dark, 0.3, '#ff5a86', { line: 0.3, noNeon: true, noVox: true });
  // checks round the lower hull
  for (let row = 0; row < 2; row++) for (let i = 0; i < 12; i++) if ((i + row) % 2 === 0) { const y0 = -0.145 + row * 0.044, pts = []; for (let k = 0; k <= 4; k++) { const y = y0 + 0.042 * k / 4; pts.push(new THREE.Vector2(radAt(y) + 0.0035, y)); } const g = new THREE.LatheGeometry(pts, 8, i / 12 * Math.PI * 2, Math.PI / 6); R(g, blue, 0.46, '#4f8dff', { prio: 2, line: 0.35, noNeon: true }).material.side = THREE.DoubleSide; }
  // rivets under the collar
  { const gs = []; for (let i = 0; i < 18; i++) { const a = i / 18 * 6.2832, g = new THREE.SphereGeometry(0.0058, 10, 8); g.translate(Math.cos(a) * (radAt(0.183) + 0.001), 0.183, Math.sin(a) * (radAt(0.183) + 0.001)); gs.push(g); } R(mergeGeometries(gs), dark, 0.4, '#ff5a86', { line: 0.25, prio: 2, noNeon: true, noVox: true }); }
  // porthole with a pilot
  const PY = 0.072, PZ = radAt(PY), port = new THREE.Group(); const lean = Math.atan((radAt(PY + 0.06) - radAt(PY - 0.06)) / 0.12); port.position.set(0, PY, Math.max(PZ, radAt(PY + 0.06) - 0.06 * Math.tan(lean)) + 0.0065); port.rotation.x = lean; ship.add(port);
  const PP = (g, m, heat, neon, d = {}) => { const o = tag(add(g, m, port, 'obj', heat), { neon, vox: 0.0078, layer: 'W', prio: 5, line: 0.7, ...d }); return o; };
  const ring = PP(new THREE.TorusGeometry(0.076, 0.0135, 18, 56), gold, 0.44, '#ffcf3a', { line: 0.55 });
  const pane = PP(new THREE.CylinderGeometry(0.074, 0.074, 0.008, 48), glass, 0.12, '#5df2ff', { prio: 4, line: 0.1 }); pane.rotation.x = Math.PI / 2; pane.position.z = -0.003;
  const pilot = new THREE.Group(); port.add(pilot); const PK = (g, m, heat, neon, d) => { const o = PP(g, m, heat, neon, d); pilot.add(o); return o; };
  const suit = M('#e2560f', 0.6), visorM = M('#1b2a66', 0.15), glint = M('#e8f3ff', 0.2);
  const bodyG = (() => { const s = new THREE.Shape(), P = []; for (let i = 0; i < 72; i++) { const a = i / 72 * 6.28319; let x = 0.056 * Math.cos(a), y = -0.056 + 0.036 * Math.sin(a); const L = Math.hypot(x, y); if (L > 0.0605) { x *= 0.0605 / L; y *= 0.0605 / L; } P.push([x, y]); } P.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelSize: 0.0025, bevelThickness: 0.003, bevelSegments: 3 }); return toCreasedNormals(g, 0.9); })();
  const body = PK(bodyG, suit, 0.66, '#5df2ff', { prio: 6, noNeon: true, line: 0.4, noEdge: true }); body.position.set(0, 0, 0.001); body.receiveShadow = false;
  const helm = PK(new THREE.SphereGeometry(0.045, 32, 24), white, 0.72, '#5df2ff', { prio: 7, line: 0.45 }); helm.scale.set(1, 0.96, 0.36); helm.position.set(0, 0.002, 0.012);
  const face = PK(new THREE.SphereGeometry(0.037, 28, 20), M('#d98c5a', 0.6), 0.95, '#ffcf3a', { prio: 8, line: 0.2 }); face.scale.set(1.0, 0.86, 0.36); face.position.set(0, -0.007, 0.0185);
  for (const s of [-1, 1]) { const l = PK(new THREE.SphereGeometry(0.0135, 20, 14), M('#141b3f', 0.2), 0.75, '#5df2ff', { prio: 10, line: 0.15 }); l.scale.z = 0.45; l.position.set(s * 0.0165, 0.001, 0.0305); const r = PK(new THREE.TorusGeometry(0.0142, 0.0034, 10, 28), gold, 0.8, '#ffcf3a', { prio: 9, line: 0.15, noVox: true }); r.position.set(s * 0.0165, 0.001, 0.0305); const g = PK(new THREE.SphereGeometry(0.004, 12, 8), white, 1.0, '#ffffff', { prio: 11, line: 0, noNeon: true, noVox: true }); g.position.set(s * 0.0165 - 0.004, 0.006, 0.0365); }
  const smile = PK(new THREE.TorusGeometry(0.011, 0.0022, 8, 20, Math.PI), M('#7a2f1c', 0.6), 0.7, '#ff5a86', { prio: 9, line: 0, noNeon: true, noVox: true }); smile.rotation.z = Math.PI; smile.position.set(0, -0.0165, 0.0315);
  // nose spike
  { const s = R(new THREE.ConeGeometry(0.0085, 0.075, 16), gold, 0.3, '#ffcf3a', { prio: 4, line: 0.7 }); s.position.y = 0.392; const b = R(new THREE.SphereGeometry(0.0135, 18, 14), gold, 0.3, '#ffcf3a', { prio: 4, line: 0.7 }); b.position.y = 0.368; }
  // engines
  const bell = (x, z, k) => { const g = lathe([[0.0, -0.222], [0.052, -0.222], [0.058, -0.236], [0.082, -0.286], [0.072, -0.286], [0.048, -0.24], [0.0, -0.24]]); const o = R(g, dark, 0.78, '#ff8a3c', { line: 0.8 }); o.scale.set(k, 1, k); o.position.set(x, 0, z); const t = tor(0.079 * k, 0.0062, -0.285, gold, 0.82, '#ffcf3a', { line: 0.6 }); t.position.x = x; t.position.z = z; };
  bell(0, 0, 0.92); bell(-0.085, 0.03, 0.50); bell(0.085, 0.03, 0.50);
  // fins with an inset and a gold foot
  const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.bezierCurveTo(0.085, -0.02, 0.128, -0.085, 0.134, -0.215); fs.bezierCurveTo(0.10, -0.175, 0.055, -0.168, -0.012, -0.165); fs.lineTo(0, 0);
  const finG = new THREE.ExtrudeGeometry(fs, { depth: 0.022, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.007, bevelSegments: 4, curveSegments: 20 }); finG.translate(0, 0, -0.011);
  const is = new THREE.Shape(); is.moveTo(0.022, -0.030); is.bezierCurveTo(0.075, -0.045, 0.100, -0.090, 0.108, -0.150); is.bezierCurveTo(0.080, -0.140, 0.050, -0.136, 0.022, -0.135); is.lineTo(0.022, -0.030); const insG = new THREE.ExtrudeGeometry(is, { depth: 0.042, bevelEnabled: false, curveSegments: 16 }); insG.translate(0, 0, -0.021);
  for (let i = 0; i < 3; i++) { const g = new THREE.Group(); g.rotation.y = -0.42 + i * (Math.PI * 2 / 3); ship.add(g); const p = (geo, m, heat, neon, d) => { const o = R(geo, m, heat, neon, d); g.add(o); o.position.set(0.106, -0.075, 0); return o; }; p(finG, blue, 0.46, '#4f8dff'); p(insG, blue2, 0.42, '#5df2ff', { prio: 2, line: 0.4, noNeon: true }); const ft = p(new THREE.SphereGeometry(0.0135, 18, 14), gold, 0.5, '#ffcf3a', { prio: 4, line: 0.7 }); ft.position.set(0.106 + 0.134, -0.075 - 0.222, 0); }
  // exhaust
  const fire = new THREE.Group(); fire.position.y = -0.280; ship.add(fire);
  const flameProf = (w, l) => spline([[w * 0.62, 0.0], [w, -l * 0.22], [w * 0.82, -l * 0.48], [w * 0.40, -l * 0.78], [0.0, -l]], 40);
  const fl = [['#ff5a16', 0.084, 0.46, 0.93], ['#ffae1c', 0.058, 0.33, 1.0], ['#fff0b4', 0.033, 0.20, 1.1]].map(([c, w, l, heat], i) => { const m = tag(add(lathe(flameProf(w, l)), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, emissive: c, emissiveIntensity: 0.0, side: THREE.DoubleSide }), fire, 'obj', heat), { vox: 0.0125, layer: 'F' + i, line: 0.9 }); m.castShadow = i === 0; m.receiveShadow = false; m.userData.neon = ['#ff6a2a', '#ffc63a', '#fff1b8'][i]; return m; });
  const sf = [-1, 1].map((s) => { const m = tag(add(lathe(flameProf(0.026, 0.13)), fl[1].material, fire, 'obj', 0.98), { vox: 0.0145, layer: 'G' + s, line: 0.7, neon: '#ffc63a' }); m.position.set(s * 0.085, 0, 0.03); m.receiveShadow = false; return m; });

  // --- smoke: billows on the pad, puffs under the flame, vapour across the front, small clouds behind
  const puff = (seed) => { const R = (k) => 0.88 + 0.24 * hash(seed + k), gs = [[0.0, 0.035, 0.108, 0.0], [-0.112, 0.002, 0.076, 0.012], [0.118, 0.008, 0.082, -0.012], [-0.196, -0.020, 0.048, 0.0], [0.208, -0.018, 0.052, 0.008]].map(([x, y, r, z], i) => { const g = new THREE.IcosahedronGeometry(r * R(i), 12); g.translate(x * (seed % 2 ? -1 : 1), y, z); return g.index ? g.toNonIndexed() : g; });
    const g = mergeGeometries(gs), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < -0.045) p.setY(i, -0.045 - 0.012 * (1 - Math.exp((y + 0.045) / 0.02))); } p.needsUpdate = true; const m = mergeVertices(g, 1e-5); m.computeVertexNormals(); return m; };
  const smokeM = M(C.smoke, 0.9), cloudMat = M('#ffffff', 0.85), G5 = [3, 14, 25, 36, 47].map(puff);
  const billow = []; [[-0.11, 0.10, 0.50, 0], [0.12, 0.09, 0.46, 1], [-0.20, -0.02, 0.62, 2], [0.21, -0.05, 0.58, 3], [0.0, 0.13, 0.42, 4], [-0.06, -0.12, 0.56, 1], [0.09, -0.13, 0.52, 0]].forEach(([x, z, s, k], i) => { const o = tag(add(G5[k], smokeM, land, 'obj', 0.52), { neon: '#8a7dff', vox: 0.026, layer: 'B' + i, line: 0.9, heat: 0.50 }); o.userData.b = { x, z, s, i }; billow.push(o); });
  const trail = []; for (let i = 0; i < 7; i++) { const o = tag(add(G5[i % 5], smokeM, scene, 'obj', 0.60), { neon: '#8a7dff', vox: 0.022, layer: 'Q' + i, line: 0.8 }); o.userData.q = i; trail.push(o); }
  const vap = [[-0.275, 0.20, 0.22, 0.60], [0.285, 0.14, 0.36, 0.52]].map(([x, z, ph, s], i) => { const o = tag(add(G5[i + 1], cloudMat, scene, 'obj', 0.17), { neon: '#6a5cff', vox: 0.026, layer: 'V' + i, line: 0.9 }); o.castShadow = false; o.userData.v = { x, z, ph, s }; return o; });
  const clouds = [[-0.46, 0.50, -1.0, 0.80], [0.50, 0.17, -0.9, 0.62], [-0.50, 0.06, -1.15, 0.66], [-0.10, 0.74, -1.2, 0.58]].map(([x, y, z, s], i) => { const o = tag(add(G5[i], cloudMat, scene, 'obj', 0.17), { neon: '#6a5cff', vox: 0.034, layer: 'C' + i, line: 0.7 }); o.castShadow = false; o.userData.c = { x, y, z, s }; return o; });
  // --- light
  const KEY = V(-1.5, 1.9, 2.6), sun = new THREE.DirectionalLight(0xfff0dc, 3.1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -1.3, right: 1.3, top: 1.3, bottom: -1.3, near: 0.3, far: 8 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.004; scene.add(sun, sun.target);
  const sky = new THREE.DirectionalLight(0xbcd2ff, 0.9); scene.add(sky, sky.target); sky.castShadow = true; sky.shadow.mapSize.set(1024, 1024); Object.assign(sky.shadow.camera, { left: -1.3, right: 1.3, top: 1.3, bottom: -1.3, near: 0.3, far: 8 }); sky.shadow.bias = -0.0008; sky.shadow.normalBias = 0.006;
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const burner = new THREE.PointLight(0xff9a4a, 0, 1.6, 2); ship.add(burner); burner.position.set(0, -0.42, 0.12);


  const rodG = new THREE.Group(); root.add(rodG); rodG.visible = false; for (const [x, z] of [[0.105, -0.30], [-0.105, -0.30]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.0046, 0.0046, 1.5, 10), new THREE.MeshBasicMaterial({ color: '#1a0b04' })); r.userData.styleAux = true; r.position.set(x * 2.1, -0.86, z + 0.18); r.rotation.z = x * 1.5; rodG.add(r); }
  // --- per-look tags: what each part is in the looks that draw with lines, gels or metal
  const all = (g, f) => g.traverse((o) => { if (o.isMesh && !o.userData.styleAux) f(o); });
  all(land, (o) => Object.assign(o.userData, { nw: 0.55, nk: 0.62, bk: 0.55, bw: 0.8, syn: '#c22bff', synk: 0.85, sh: '#2a1408' }));
  for (const [m, d] of [[matR[0], { sh: '#2b1307', chrome: '#7a4a86', keep: 0.8 }], [matR[1], { sh: '#3b1c0a', chrome: '#a8649a', keep: 0.8 }], [matR[2], { sh: '#4d270f', chrome: '#d79ac0', keep: 0.75 }], [matR[3], { sh: '#341808', chrome: '#8f5592', keep: 0.8 }], [grassM, { sh: '#1a0c04', chrome: '#4fb7c4', keep: 0.85, syn: '#ff43db', synk: 1.0, bk: 0.8 }], [pineM[0], { sh: '#120703', chrome: '#2f8f9f', keep: 0.85, syn: '#36EFFF', synk: 0.6, bk: 0.7 }], [pineM[1], { sh: '#180a04', chrome: '#3fb0b0', keep: 0.85, syn: '#36EFFF', synk: 0.6, bk: 0.7 }], [trunkM, { sh: '#120703', chrome: '#5a3f7a', keep: 0.8 }], [steelM, { sh: '#0d0604', chrome: '#5d6aa8', keep: 0.7, syn: '#36EFFF', synk: 0.8, nk: 0.8, bk: 0.9 }], [goldM, { sh: '#6b3a10', chrome: '#ffc14a', keep: 0.75, syn: '#ff9a3c', synk: 1.1, nk: 0.85, bk: 1 }], [creamM, { sh: '#0d0604', syn: '#36EFFF', synk: 0.9, nk: 0.85, bk: 1 }], [blueM, { sh: '#10244f', chrome: '#3f6dff', keep: 0.75, syn: '#36EFFF', synk: 0.9, nk: 0.85, bk: 1 }]]) all(land, (o) => { if (o.material === m) Object.assign(o.userData, d); });
  all(gan, (o) => { o.userData.nw = 0.28; o.userData.nk = 0.6; });
  Object.assign(rA.userData, { sh: '#b06a2c', chrome: '#3a2a70', keep: 0.9, rough: 0.42, syn: '#7a35d8', synk: 0.8, nw: 0.5, nk: 0.45, bk: 0.35, noEdge: true }); Object.assign(rB.userData, { sh: '#7a4116', chrome: '#5a3a8c', keep: 0.9, rough: 0.36, syn: '#a032e0', synk: 0.9, nw: 0.5, nk: 0.55, bk: 0.45, noEdge: true });
  all(planet, (o) => Object.assign(o.userData, { sh: o === pm ? '#c98236' : o === ringP ? '#8a4f1c' : '#a9672a', chrome: o === pm ? '#e6a0d0' : o === ringP ? '#ffd98f' : '#b070b0', keep: 0.6, nw: 0.8, nk: 0.8, bk: 0.7, syn: o === ringP ? '#36EFFF' : '#ff43db', synk: 0.9, noEdge: true, rough: o === ringP ? 0.12 : 0.34, noNeon: o !== pm && o !== ringP, noBlue: o !== pm && o !== ringP }));
  for (const o of clouds) Object.assign(o.userData, { sh: '#a35f22', chrome: '#7a72c8', keep: 0.6, rough: 0.30, nw: 0.55, nk: 0.5, bk: 0.5, syn: '#8a3be0', synk: 0.8, noEdge: true });
  for (const o of vap) Object.assign(o.userData, { sh: '#6a3612', chrome: '#b8b0ee', keep: 0.5, rough: 0.30, nw: 0.8, nk: 0.8, bk: 0.8, syn: '#a24bff', synk: 0.9, noEdge: true });
  for (const o of [...billow, ...trail]) Object.assign(o.userData, { sh: o.userData.b?.z > 0 ? '#4a240c' : '#6d3914', chrome: '#9a8edc', keep: 0.6, rough: 0.30, nw: 0.5, nk: 0.62, bk: 0.5, bw: 0.8, syn: '#ff5ac8', synk: 0.75, noEdge: true });
  all(ship, (o) => { const m = o.material; Object.assign(o.userData, { syn: m === gold ? '#ffb43c' : '#36EFFF', synk: 1.15, sh: m === blue ? '#16306a' : m === gold ? '#c97a1c' : m === cream ? '#1d0d06' : '#0A0709', chrome: m === gold ? '#ffcf6a' : m === blue ? '#5f86ff' : m === blue2 ? '#86a8ff' : m === dark ? '#4a4470' : '#f4f2ff', keep: m === gold ? 0.75 : m === blue || m === blue2 ? 0.62 : m === dark ? 0.8 : 0.2 }); if (m === blue2) Object.assign(o.userData, { sh: '#e8a23c' }); });
  all(ship, (o) => { o.userData.dent = 0.34; }); all(pilot, (o) => { o.userData.dent = 0; }); all(dish, (o) => { o.userData.dent = 0.12; }); all(gan, (o) => { o.userData.dent = 0.10; }); for (const o of [...billow, ...trail]) o.userData.dent = 0.34;
  all(ship, (o) => { if (o.material === blue && o.userData.noNeon) o.userData.sh = '#f0b24a'; });                          // the checks: windows cut through the hide
  all(ship, (o) => { if (o.userData.heat < 0.45 && o !== pane) o.userData.heat = Math.min(0.48, o.userData.heat + 0.055); }); all(land, (o) => { if (!billow.includes(o) && !trail.includes(o) && o.parent !== gan) o.userData.heat *= 0.74; }); all(planet, (o) => { o.userData.heat *= 0.78; });
  Object.assign(pane.userData, { sh: '#ffe2a0', shk: 1.1, chrome: '#2a2460', keep: 0.95 }); Object.assign(ring.userData, { sh: '#0A0709' }); Object.assign(body.userData, { sh: '#7a2c0c', chrome: '#ff9a6a', keep: 0.7 }); Object.assign(helm.userData, { sh: '#0A0709' }); Object.assign(face.userData, { sh: '#e09038', chrome: '#ffc9a0', keep: 0.6 }); all(pilot, (o) => { if (o.userData.sh === undefined || (o !== body && o !== helm && o !== face)) o.userData.sh = '#0A0709'; });
  [['#b8401a', '#ff7a4a'], ['#ee8f2a', '#ffc060'], ['#ffe0a0', '#fff0d0']].forEach(([s, c], i) => Object.assign(fl[i].userData, { sh: s, chrome: c, keep: 0.8, syn: ['#ff4a8a', '#ffb43c', '#fff3c4'][i], synk: 1.2, noEdge: true })); for (const m of sf) Object.assign(m.userData, { sh: '#ee8f2a', chrome: '#ffc060', keep: 0.8, syn: '#ffb43c', synk: 1.1, noEdge: true });

  // --- pose: t drives what loops, tau (seconds since this look came on) drives the climb
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 2);
  function pose(t, tau, look) {
    SKY.time.value = t; grade.material.uniforms.T.value = t; SCROLL.value = tau * 0.09;
    const drop = 0.088 * tau; land.position.y = -drop; far.position.y = -drop * 0.35; land.updateMatrixWorld();
    root.position.set(0.006 * Math.sin(t * 9.1), 0.072 + 0.070 * ease(tau / 1.6) + 0.004 * Math.sin(t * 23), 0); root.rotation.z = -0.055 + 0.02 * Math.sin(t * 2.4); root.scale.setScalar(0.66);
    ship.rotation.y = 0.22 * Math.sin(tau * 1.7 - 0.5); ship.rotation.x = 0.08;
    port.position.z = PZ - 0.006 + (look === 'voxel' ? 0.016 : 0);
    SKY.focus.value.set(0, root.position.y - 0.10, 0);
    const f1 = 1 + 0.09 * Math.sin(tau * 10.05) + 0.05 * Math.sin(t * 53 + 1), f2 = 1 + 0.12 * Math.sin(t * 37 + 2), w1 = 1 + 0.05 * Math.sin(t * 43 + 0.7);
    fl[0].scale.set(w1, f1, w1); fl[1].scale.set(2 - w1, f2, 2 - w1); fl[2].scale.set(w1, f1 * 0.98, w1); sf.forEach((m, i) => m.scale.set(w1, (i ? f2 : 2 - f2), w1)); fl.forEach((m, i) => { m.position.z = 0.05 * i; }); fire.rotation.z = 0.03 * Math.sin(t * 9);
    for (const o of billow) { const b = o.userData.b, g = 0.44 + 0.42 * ease((tau + 0.3) / 2.6), w = 1 + 0.035 * Math.sin(t * 5 + b.i * 2); o.position.set(b.x * (0.75 + 0.5 * g), GY + 0.030 + 0.02 * g, b.z * (0.8 + 0.4 * g)); o.scale.set(b.s * g * w, b.s * g * (2 - w) * 0.95, b.s * g * w); o.rotation.y = 0.5 * Math.sin(b.i * 3) + 0.25 * tau; }
    const tipY = root.position.y - 0.66 * 0.66, padY = GY - drop + 0.06;
    for (const o of trail) { const p = mod(tau * 1.5 + o.userData.q / 7, 1), y = tipY + (padY - tipY) * p, s = 0.11 + 0.27 * p; o.position.set(0.05 * Math.sin(o.userData.q * 4.1) * (0.3 + p), y, -0.05 + 0.03 * Math.cos(o.userData.q * 5)); o.scale.setScalar(s * Math.min(1, p * 6)); o.rotation.y = o.userData.q + tau; o.visible = p > 0.02 && !(o.userData.off && o.userData.q % 2); }
    for (const o of vap) { const v = o.userData.v, span = 1.5, y = 0.75 - mod(tau * 0.26 + v.ph * span, span); o.position.set(v.x, y, v.z); o.scale.setScalar(v.s); }
    for (const o of clouds) { const c = o.userData.c; o.position.set(c.x + 0.02 * Math.sin(t * 0.8 + c.x * 9), c.y - 0.035 * tau, c.z); o.scale.setScalar(c.s); }
    dish.userData.bowl.rotation.x = -0.30 - 0.22 * Math.min(2, tau); dish.userData.bowl.rotation.y = -0.62 + 0.16 * tau;
  }
  const camera = new THREE.PerspectiveCamera(27, W / H, 0.05, 30); camera.position.set(0, 0.10, 2.35); camera.lookAt(0, -0.015, 0);
  const pe = camera.projectionMatrix.clone();
  function shoot(k, n) { camera.projectionMatrix.copy(pe); if (n > 1) { camera.projectionMatrix.elements[8] += 2 * (halton(k + 1, 5) - 0.5) / W; camera.projectionMatrix.elements[9] += 2 * (halton(k + 1, 7) - 0.5) / H; } camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    const s = n > 1 ? 0.16 : 0; sun.position.set(KEY.x + (halton(k + 1, 11) - 0.5) * s, KEY.y + (halton(k + 1, 13) - 0.5) * s, KEY.z + (halton(k + 1, 17) - 0.5) * s);
    const h1 = n > 1 ? halton(k + 1, 19) : 0.5, h2 = n > 1 ? halton(k + 1, 23) : 0.3, phi = h2 * Math.PI * 2, r = Math.sqrt(1 - h1); sky.position.set(Math.cos(phi) * r * 3, Math.sin(phi) * r * 3, Math.sqrt(h1) * 3 + 0.4); }

  // --- post
  const vert = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const addPass = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, w: { value: 1 } }, vertexShader: vert, fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main() { gl_FragColor = vec4(min(texture2D(tex, vUv).rgb, vec3(16.0)) * w, 1.0); }', blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false, transparent: true }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.2, 0.45, 0.9);
  const grade = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: accum.texture }, graphic: { value: 0 }, ex: { value: 1 }, vig: { value: 0.2 }, hud: { value: 0 }, T: { value: 0 } }, vertexShader: vert, fragmentShader: `uniform sampler2D tex; uniform float graphic, ex, vig, hud, T; varying vec2 vUv;
    float seg(vec2 q, vec2 a, vec2 b) { vec2 d = b - a; return length(q - a - d * clamp(dot(q - a, d) / dot(d, d), 0.0, 1.0)); } float ln(float d, float w) { return 1.0 - smoothstep(w - 0.6, w + 0.6, d); } float bx(vec2 q, vec2 c, vec2 h) { vec2 d = abs(q - c) - h; return max(d.x, d.y); }
    vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); } vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    void main() { vec3 c = texture2D(tex, vUv).rgb * ex; c = mix(aces(c), c / max(1.0, max(c.r, max(c.g, c.b))), graphic); vec2 d = vUv - 0.5; c *= 1.0 - vig * smoothstep(0.3, 0.75, length(d)); vec3 o = srgb(c); vec2 q = vUv * vec2(504.0, 894.0);
      if (hud > 0.5 && hud < 1.5) { vec2 m = min(q, vec2(504.0, 894.0) - q); float a = max(step(abs(m.x - 25.0), 1.2) * step(25.0, m.y) * step(m.y, 58.0), step(abs(m.y - 25.0), 1.2) * step(25.0, m.x) * step(m.x, 58.0));
        float by = clamp((q.y - 300.0) / 300.0, 0.0, 1.0), inb = step(bx(q, vec2(474.0, 450.0), vec2(6.0, 150.0)), 0.0), fr = step(abs(bx(q, vec2(474.0, 450.0), vec2(8.5, 152.5))), 1.1); vec3 lc = mix(vec3(0.03, 0.0, 0.13), vec3(0.16, 0.33, 1.0), smoothstep(0.0, 0.28, by)); lc = mix(lc, vec3(0.82, 0.15, 0.81), smoothstep(0.28, 0.5, by)); lc = mix(lc, vec3(1.0, 0.2, 0.22), smoothstep(0.5, 0.66, by)); lc = mix(lc, vec3(1.0, 0.68, 0.09), smoothstep(0.66, 0.82, by)); lc = mix(lc, vec3(1.0, 0.98, 0.75), smoothstep(0.82, 1.0, by)); o = mix(o, lc, inb); a = max(a, fr); a = max(a, step(abs(mod(q.y - 300.0 + 15.0, 30.0) - 15.0), 0.9) * step(456.0, q.x) * step(q.x, 464.0) * step(299.0, q.y) * step(q.y, 601.0)); o = mix(o, vec3(1.0), a * 0.85); }
      if (hud > 1.5) { vec3 L = vec3(0.80, 0.89, 1.0); float a = 0.0; float tick = mod(q.y, 12.0), big = step(mod(q.y + 6.0, 60.0), 12.0); a = max(a, step(abs(tick - 6.0), 0.6) * step(q.x, mix(16.0, 26.0, big)) * step(8.0, q.x)); a = max(a, step(abs(q.x - 8.0), 0.8)); vec2 cc = vec2(252.0, 632.0); float ang = atan(q.y - cc.y, q.x - cc.x) / 6.2832; a = max(a, 0.75 * ln(abs(length(q - cc) - 142.0), 0.8) * step(0.42, fract(ang * 48.0))); a = max(a, 0.6 * step(abs(q.x - 252.0), 0.7) * step(796.0, q.y) * step(0.4, fract(q.y / 14.0)));
        a = max(a, 0.8 * ln(seg(q, vec2(418.0, 330.0), vec2(418.0, 775.0)), 0.8)); for (int i = 0; i < 2; i++) { float yy = i == 0 ? 330.0 : 775.0; a = max(a, 0.8 * ln(seg(q, vec2(404.0, yy), vec2(432.0, yy)), 0.8)); float s = i == 0 ? 1.0 : -1.0; a = max(a, ln(seg(q, vec2(418.0, yy), vec2(413.0, yy + s * 12.0)), 0.9)); a = max(a, ln(seg(q, vec2(418.0, yy), vec2(423.0, yy + s * 12.0)), 0.9)); }
        float tb = bx(q, vec2(428.0, 40.0), vec2(62.0, 28.0)); o = mix(o, vec3(0.035, 0.125, 0.33), 0.92 * step(tb, 0.0)); a = max(a, step(abs(tb), 1.0)); a = max(a, step(tb, 0.0) * max(step(abs(q.y - 48.0), 0.7), step(abs(q.x - 450.0), 0.7))); a = max(a, step(tb, -4.0) * step(abs(q.y - 58.0), 2.2) * step(q.x, 440.0) * step(0.25, fract(q.x / 17.0 + 0.1)) * 0.8); a = max(a, step(tb, -4.0) * step(min(abs(q.y - 38.0), abs(q.y - 26.0)), 1.4) * step(q.x, 436.0) * step(0.35, fract(q.x / 11.0)) * 0.6); a = max(a, ln(abs(length(q - vec2(470.0, 30.0)) - 9.0), 0.9)); o = mix(o, L, a * 0.8); }
      gl_FragColor = vec4(o, 1.0); }`, depthTest: false, depthWrite: false }));
  const neonLine = (hex, k) => new THREE.Color(hex).multiplyScalar(k);
  const tubes = new Map(), TUBE = (h, k) => { const id = h + k; if (!tubes.has(id)) tubes.set(id, new THREE.MeshBasicMaterial({ color: new THREE.Color(h).multiplyScalar(k) })); return tubes.get(id); };
  let now = '';
  function look(name) {
    if (name === now) return; now = name; const w = WORLD[name];
    // cubes are cut on the world grid: cut them with the rocket upright and everything at its starting place
    pose(0, 0.55, name); root.rotation.set(0, 0, 0); ship.rotation.set(0, 0, 0); root.position.x = 0; for (const m of [...fl, ...sf]) m.scale.set(1, 1, 1); fire.rotation.set(0, 0, 0); scene.updateMatrixWorld(true);
    if (!wall.userData.lit) wall.material.color.set(w.wall); cloudMat.color.set(w.cloud);
    setStyle(name, { scene, key: sun, fill: sky, bloom, renderer, grade: grade.material.uniforms, neonAt: V(0, 9, 0) });
    for (const o of [...clouds, ...vap, ...billow, ...trail]) o.receiveShadow = !['clay', 'toon'].includes(name);
    burner.intensity = name === 'toon' ? 0.35 : name === 'voxel' ? 0.12 : 0; bloom.threshold = name === 'neon' ? 0.22 : 0.9; bloom.radius = name === 'neon' ? 0.3 : 0.45;
    grade.material.uniforms.vig.value = { neon: 0.30, shadow: 0.30, paper: 0.16, chrome: 0.14 }[name] ?? 0.10; grade.material.uniforms.ex.value = { clay: 0.92 }[name] ?? 1; grade.material.uniforms.hud.value = name === 'thermal' ? 1 : name === 'blueprint' ? 2 : 0;
    if (name === 'neon') bloom.strength = 0.42; if (name === 'synth') bloom.strength = 0.22; if (name === 'blueprint') bloom.strength = 0.10;
    for (const o of slabs) { o.userData.hard ??= o.geometry; o.userData.soft ??= toCreasedNormals(o.geometry, 0.75); o.geometry = name === 'clay' || name === 'chrome' ? o.userData.soft : o.userData.hard; }
    for (const o of trail) o.userData.off = name === 'blueprint' || name === 'neon'; planet.visible = name !== 'synth'; rodG.visible = name === 'shadow';
  }
  return { LOOKS, draw(t, name, n = 8, tau = 0.6) {
    look(name); renderer.setRenderTarget(accum); renderer.setClearColor(0, 1); renderer.clear();
    for (let k = 0; k < n; k++) { const d = n === 1 ? 0 : ((k + 0.5) / n - 0.5) * (0.5 / 60); pose(t + d, tau + d, name); shoot(k, n); renderer.setRenderTarget(rt); renderer.render(scene, camera);
      addPass.material.uniforms.tex.value = rt.texture; addPass.material.uniforms.w.value = 1 / n; renderer.setRenderTarget(accum); renderer.autoClear = false; addPass.render(renderer); renderer.autoClear = true; }
    if (bloom.strength > 0.001) bloom.render(renderer, accum, accum, 0, false);
    renderer.setRenderTarget(null); grade.render(renderer); } };
}
