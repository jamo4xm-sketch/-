// PORCELAIN. Glossy ivory glaze over cobalt brushwork: flower sprigs in a lattice on the engine and coaches, solid cobalt on the smokebox and roof, gold lustre on the brass,
// painted masonry on the viaduct, layered washes on the ridges, short grass strokes on the ground, waves in the creek and scrolls on the smoke.
// The cobalt pools darker at the edge of every stroke.
import * as THREE from 'three';
import { meshes } from './gbuf.js';
import { dressed, studio } from './dress.js';
import { fam } from './kit4.js';
// modes: 0 white, 1 sprigs, 2 solid cobalt, 3 gold, 4 masonry, 5 ridge wash, 6 grass, 7 smoke scrolls, 8 waves, 9 boughs, 11 sky, 12 lamp, 13 beads, 14 dots
const MODE = { body: 15, coach: 1, dark: 2, coal: 2, glass: 2, red: 2, brass: 3, steel: 0, lamp: 12, cream: 0, smoke: 7, sky: 11, ridge: 5, ground: 6, water: 8, rock: 4, pine: 9, trunk: 2, stone: 4, arch: 13, ballast: 14, sleeper: 2 };
const PART = { spoke: 2, tyre: 3, hub: 3, rail: 3, parapet: 13, panel: 1 };
const DEFS = `uniform float MODE, R2; uniform vec3 CB; float PA;
  vec2 p2() { return abs(vON.y) > 0.7 ? vOP.xz : abs(vON.x) > 0.7 ? vOP.zy : vOP.xy; }
  float paint(float sd, float w) { float fw = max(fwidth(sd), 1e-6); float a = 1.0 - smoothstep(-fw, fw, sd); return a * (0.66 + 0.34 * smoothstep(-w, 0.0, sd)); }
  float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }`;
const COL = `{ PA = 0.0; vec2 q = p2(); float wob = (vn(q * 900.0) - 0.5) * 0.0006;
  if ((MODE > 0.5 && MODE < 1.5) || MODE > 14.5) { float cs = 0.026; vec2 g = q / cs; float row = floor(g.y); g.x += 0.5 * mod(row, 2.0); vec2 id = floor(g), f = fract(g) - 0.5; float r = length(f), th = atan(f.y, f.x) + h21(id) * 6.28;
    float fl = (r - 0.26 * (0.45 + 0.55 * abs(cos(2.5 * th)))) * cs + wob, cen = (r - 0.07) * cs, cor = (length(abs(f) - 0.5) - 0.06) * cs; PA = max(max(paint(fl, 0.004), paint(cen, 0.002) * 1.1), paint(cor, 0.002)); if (cen < 0.0) PA = 1.0; if (MODE > 14.5) PA = cen < 0.0 ? 0.9 : 1.0 - 0.92 * max(paint(fl, 0.004), paint(cor, 0.002)); }
  else if (MODE > 1.5 && MODE < 2.5) PA = 0.86 + 0.14 * vn(q * vec2(500.0, 60.0)) + 0.08 * (vn(q * 120.0) - 0.5);
  else if (MODE > 3.5 && MODE < 4.5) { vec2 b = vec2(0.034, 0.017), g = q / b; float row = floor(g.y); g.x += 0.5 * mod(row, 2.0) + 0.2 * h11(row); vec2 id = floor(g), f = fract(g); float d = min(min(f.x, 1.0 - f.x) * b.x, min(f.y, 1.0 - f.y) * b.y) + wob;
    PA = max(paint(d - 0.0013, 0.0012), 0.28 * step(0.72, h21(id)) * (0.8 + 0.4 * vn(q * 200.0))); }
  else if (MODE > 4.5 && MODE < 5.5) { float v = vUvL.y; PA = (0.18 + 0.55 * smoothstep(0.0, 1.0, v) + 0.12 * vn(vec2(vOP.x * 9.0, v * 30.0))) * (R2 > 0.5 ? 0.55 : 1.0); PA = max(PA, paint(0.012 - (1.0 - v), 0.006) * (R2 > 0.5 ? 0.6 : 1.0)); }
  else if (MODE > 5.5 && MODE < 6.5) { float cs = 0.018; vec2 g = vOP.xz / cs, id = floor(g), f = fract(g); float a = h21(id) * 6.28, l = 0.32; vec2 c = vec2(0.5) + (h22(id) - 0.5) * 0.4, dd = vec2(cos(a), sin(a)) * l; float s = (seg(f, c - dd, c + dd) - 0.07) * cs;
    PA = step(0.45, h21(id + 7.0)) * paint(s, 0.002) + 0.16 * smoothstep(0.45, 0.75, fbm(vOP.xz * 9.0)); }
  else if (MODE > 6.5 && MODE < 7.5) { vec2 p = vOP.xy - vec2(0.12, -0.10); float r = length(p); float s = (abs(fract(r * 3.0) - 0.5) / 3.0 - 0.032) * 0.05; PA = paint(s, 0.0015) * smoothstep(0.98, 0.85, r) * smoothstep(-0.3, 0.2, vOP.z); }
  else if (MODE > 7.5 && MODE < 8.5) { vec2 g = vOP.xz / vec2(0.016, 0.010); float row = floor(g.y); float x = fract(g.x + 0.5 * mod(row, 2.0)) - 0.5, y = fract(g.y); float s = (abs(length(vec2(x, y)) - 0.42) - 0.07) * 0.012; PA = 1.0 - 0.9 * paint(s, 0.001); }
  else if (MODE > 8.5 && MODE < 9.5) PA = 0.78 + 0.22 * vn(vUvL * vec2(40.0, 6.0));
  else if (MODE > 12.5 && MODE < 13.5) { vec2 g = q / 0.010, f = fract(g) - 0.5; PA = 1.0 - 0.95 * paint((length(f) - 0.2) * 0.010, 0.001); }
  else if (MODE > 13.5 && MODE < 14.5) { vec2 g = q / 0.007, f = fract(g) - 0.5; PA = paint((length(f) - 0.18 - 0.1 * h21(floor(g))) * 0.007, 0.001) * 0.8; }
  vec3 ivory = S(0.965, 0.955, 0.925); if (MODE > 10.5 && MODE < 11.5) ivory = mix(S(0.97, 0.965, 0.95), S(0.86, 0.90, 0.94), smoothstep(-0.4, 0.8, vWP.y));
  diffuseColor.rgb = MODE > 2.5 && MODE < 3.5 ? S(0.90, 0.72, 0.36) : MODE > 11.5 && MODE < 12.5 ? S(1.0, 0.95, 0.80) : mix(ivory, CB * (1.15 - 0.45 * PA), clamp(PA, 0.0, 1.0)); }`;
export function porcelainLook({ scene, key, fill, amb, spot, bloom, grade, renderer }) {
  const env = studio(renderer, [['#ffffff', 7, 3.6, 1.0, -2.8, 3.2, 3.0], ['#ffffff', 4, 0.6, 4.0, 3.4, 1.4, 2.6], ['#fff4e6', 3, 5.0, 0.5, 0.4, 3.8, -2.0], ['#dfe8ff', 2, 4.0, 2.0, 0, -3.0, 3.0]], ['#f2f2f0', '#c9c9c6', '#8d8b87'], 0.015);
  const ms = meshes(scene);
  const mk = (o) => { const d = o.userData, f = fam(o), mode = PART[d.part] ?? MODE[f] ?? 1, sky = mode === 11;
    const m = new THREE.MeshPhysicalMaterial({ roughness: sky ? 1 : 0.2, metalness: 0, clearcoat: sky ? 0 : 1, clearcoatRoughness: 0.04, envMap: env, envMapIntensity: sky ? 0 : 1.0, side: d.two ? THREE.DoubleSide : THREE.FrontSide });
    return dressed(m, { id: 'porc', uniforms: { MODE: { value: mode }, R2: { value: d.layer === 'r2' ? 1 : 0 }, CB: { value: new THREE.Color('#1d3f9a') } }, defs: DEFS, color: COL,
      metal: 'metalnessFactor = MODE > 2.5 && MODE < 3.5 ? 1.0 : 0.0;', rough: 'roughnessFactor = MODE > 2.5 && MODE < 3.5 ? 0.22 : roughnessFactor;',
      emis: 'if (MODE > 11.5 && MODE < 12.5) totalEmissiveRadiance += S(1.0, 0.86, 0.55) * 2.0; if (MODE > 10.5 && MODE < 11.5) totalEmissiveRadiance += diffuseColor.rgb * 0.55;' }); };
  return { on() { for (const o of ms) o.material = o.userData.mPorc ??= mk(o); key.intensity = 2.4; key.color.set('#fff6ea'); fill.intensity = 0.55; amb.intensity = 0.45; bloom.strength = 0.05; bloom.threshold = 1.4; grade.ex.value = 1.0; grade.vig.value = 0.08; } };
}
