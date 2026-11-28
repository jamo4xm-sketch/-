// ORIGAMI. Every part is folded from one sheet of coloured paper: the boiler and coaches pleated in rings, the viaduct and the ground in zigzag Miura folds,
// wheels, pines and smoke folded into rosettes, the pale ridges in a few broad mountain-and-valley folds against a grey paper sky. Each fold carries its own shadow.
import * as THREE from 'three';
import { meshes } from './gbuf.js';
import { dressed } from './dress.js';
import { metric, fam } from './kit4.js';
// family -> [paper, mode, pleat width (m), depth as a share of the width]; modes 0 rings, 1 Miura, 2 broad folds, 3 rosette about y, 4 rosette about z, 5 flat, 6 sky
const T = { body: ['#4f8f69', 0, 0.010, 0.3], dark: ['#3b3d43', 0, 0.010, 0.3], coal: ['#2c2d31', 1, 0.008, 0.35], red: ['#cb503c', 3, 16, 0.12], brass: ['#d8b45c', 5, 1, 0], steel: ['#b9bdc1', 5, 1, 0],
  glass: ['#5d7fa3', 5, 1, 0], lamp: ['#fff2c4', 5, 1, 0], cream: ['#f1e9d7', 5, 1, 0], coach: ['#9e4737', 0, 0.012, 0.3], smoke: ['#f7f5f0', 4, 9, 0.006],
  sky: ['#cfd1d3', 6, 1.4, 0.05], ridge: ['#ecebe6', 2, 0.30, 0.32], ground: ['#8fb07b', 1, 0.07, 0.26], water: ['#80b4ca', 1, 0.03, 0.2], rock: ['#b7b2a7', 1, 0.02, 0.3],
  pine: ['#3f7b56', 3, 9, 0.28], trunk: ['#8b6b4d', 5, 1, 0], stone: ['#e2dbcb', 2, 0.11, 0.3], arch: ['#f3eee3', 0, 0.008, 0.3], ballast: ['#aaa59c', 5, 1, 0], sleeper: ['#7a5f49', 5, 1, 0] };
const DEFS = `uniform float MODE, P, A; uniform vec2 SC; uniform vec3 C0; float tri(float x) { return abs(fract(x) - 0.5) * 2.0; }`;
const H = `vec2 q = SC.x > 0.0 ? uv * SC : (abs(vON.y) > 0.7 ? o.xz : abs(vON.x) > 0.7 ? o.zy : o.xy);
  if (MODE < 0.5) return A * P * tri(q.y / P);
  if (MODE < 1.5) return A * P * tri(q.x / P + 0.5 * tri(q.y / (P * 1.7)));
  if (MODE < 2.5) return A * P * tri(o.x / P + 0.35 * tri(o.y / (P * 1.5)));
  if (MODE < 3.5) { float r = length(o.xz); return A * r * tri(atan(o.z, o.x) * P / 6.28318); }
  if (MODE < 4.5) { float r = length(o.xy); return A * r * tri(atan(o.y, o.x) * P / 6.28318); }
  if (MODE < 5.5) return 0.0;
  return A * P * tri((o.x + 0.45 * o.y) / P);`;
export function origamiLook({ scene, key, fill, amb, spot, bloom, grade }) {
  const ms = meshes(scene);
  const mk = (o) => { const d = o.userData, f = fam(o), [col, mode, p, a] = T[f] ?? T.body, met = metric(o), r2 = d.layer === 'r2';
    const useUV = mode === 0 && met;   // rings follow the surface; everything else folds in object space
    const m = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, side: d.two ? THREE.DoubleSide : THREE.FrontSide });
    const U = { MODE: { value: mode }, P: { value: p }, A: { value: a }, SC: { value: useUV ? new THREE.Vector2(met[0], met[1]) : new THREE.Vector2(0, 0) }, C0: { value: new THREE.Color(r2 ? '#dddfdf' : col) } };
    return dressed(m, { id: 'ori', uniforms: U, defs: DEFS, height: H,
      color: `diffuseColor.rgb = C0 * (0.95 + 0.07 * vn(vUvL * 900.0) * vn(vUvL * 90.0 + 3.0));` }); };
  return { on() { for (const o of ms) o.material = o.userData.mOri ??= mk(o); key.intensity = 3.4; key.color.set('#fff8ee'); fill.intensity = 0.55; amb.intensity = 0.35; bloom.strength = 0; grade.ex.value = 1.02; grade.vig.value = 0.08; } };
}
