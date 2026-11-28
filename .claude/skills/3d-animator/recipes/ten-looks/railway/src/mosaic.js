// GLAZED MOSAIC. Every surface is laid in opaque glazed tiles set in pale grout: small square tiles in rows round the train, chipped irregular tesserae on the stone and the ground,
// broad matte tiles in the sky. Each tile sits at its own small tilt, so the raking light and the studio catch them one by one.
import * as THREE from 'three';
import { meshes } from './gbuf.js';
import { dressed, studio } from './dress.js';
import { metric, fam } from './kit4.js';
// family -> [three glazes], tile size in metres, mode (0 rows on the surface, 1 tesserae on the surface, 2 tesserae in object space), glaze roughness, grout
const G = '#d3ccbf', GD = '#6e675d';
const T = { body: [['#1c5c59', '#237068', '#164a48'], 0.0092, 0], dark: [['#1d2125', '#2a3034', '#121518'], 0.0090, 0], coal: [['#18191c', '#25272b', '#0e0f11'], 0.0060, 1], red: [['#c63b2a', '#dc522f', '#a82e24'], 0.0062, 0],
  brass: [['#dca43a', '#ecc35c', '#bf8a28'], 0.0055, 0], steel: [['#8e979d', '#a9b1b6', '#737c83'], 0.0055, 0], glass: [['#1d3f7a', '#2b58a4', '#163262'], 0.0060, 0], lamp: [['#fff1b8', '#ffe590', '#fff8d8'], 0.0050, 1],
  cream: [['#f2e7cc', '#e7d7b3', '#f8f0de'], 0.0055, 0], coach: [['#7e2b2a', '#943733', '#6a2323'], 0.0100, 0], smoke: [['#f5f5f2', '#e3e6e9', '#ffffff'], 0.20, 1, 0.3],
  sky: [['#a9c9de', '#b7d3e5', '#9dc0d8'], 0.060, 1, 0.62], ridge: [['#6f8ea6', '#7d9bb2', '#62819a'], 0.045, 1, 0.5], ground: [['#6d8a4a', '#839c56', '#a19c5c'], 0.024, 1, 0.4, GD], water: [['#3c9db6', '#5bb4c7', '#2c88a4'], 0.016, 1, 0.1],
  rock: [['#8f897e', '#a39c8f', '#78736b'], 0.013, 1, 0.3, GD], pine: [['#235439', '#2f6845', '#1b452f'], 0.010, 1, 0.25], trunk: [['#6b4b34', '#5a3d2a', '#7a5a3e'], 0.008, 0],
  stone: [['#b7a385', '#c7b596', '#a18e72'], 0.0165, 1, 0.3, GD], arch: [['#dccbaa', '#e8dabb', '#cdb995'], 0.0115, 0, 0.25], ballast: [['#7f796f', '#938c81', '#6b665e'], 0.0070, 2, 0.4, GD], sleeper: [['#5e4836', '#6e5442', '#4f3b2c'], 0.0070, 2, 0.35] };
const RIDGE2 = [['#9fb6c8', '#adc2d2', '#93abbe'], 0.05, 1, 0.55];
const DEFS = `uniform vec2 SC; uniform float MODE, TS, GL, GLOW; uniform vec3 C1, C2, C3, GR; float MG;
  vec4 tl(vec2 uv, vec3 o, out vec2 lc) { vec2 q = MODE > 1.5 ? vec2(o.x + 0.61 * o.z, o.y + 0.37 * o.z) / TS : uv * SC;
    if (MODE < 0.5) { float r = floor(q.y); q.x += 0.5 * mod(r, 2.0) + 0.23 * h11(r); vec2 i = floor(q), f = fract(q); lc = f - 0.5; float e = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)) + 0.045 * (vn(q * 5.0) - 0.5); return vec4(e, h21(i + vec2(0.0, r)), h21(i + 3.7), h21(i + 9.2)); }
    vec2 i = floor(q), f = fract(q); float d1 = 9.0, d2 = 9.0; vec2 id = vec2(0.0), m1 = vec2(0.0);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(x, y), c = g + 0.18 + 0.64 * h22(i + g), r = c - f; float d = dot(r, r); if (d < d1) { d2 = d1; d1 = d; id = i + g; m1 = r; } else if (d < d2) d2 = d; }
    lc = -m1; return vec4((sqrt(d2) - sqrt(d1)) * 0.55 + 0.05 * (vn(q * 5.0) - 0.5), h21(id), h21(id + 3.7), h21(id + 9.2)); }`;
export function mosaicLook({ scene, key, fill, amb, spot, bloom, grade, renderer }) {
  const env = studio(renderer, [['#fff6e6', 9, 2.6, 1.4, -3.4, 4.0, 2.4], ['#ffffff', 5, 4.0, 0.4, 0.6, 2.4, 5.0], ['#dfeeff', 3.5, 1.0, 4.5, 4.8, 1.0, 1.8], ['#ffe2b8', 2.0, 5.0, 1.6, 0, -3.6, 2.6], ['#000000', 1, 1.0, 5, -2.2, 0.4, 5.4]], ['#dfe6ea', '#9aa4a8', '#5d625f'], 0.01);
  const ms = meshes(scene);
  const mk = (o) => { const d = o.userData, f = fam(o), [cols, ts, mode, gl = 0.14, grout = G] = d.layer === 'r2' ? RIDGE2 : T[f] ?? T.body, met = metric(o), md = met ? mode : 2;
    const m = new THREE.MeshStandardMaterial({ roughness: gl, metalness: 0, envMap: env, envMapIntensity: f === 'sky' ? 0.25 : f === 'ridge' ? 0.4 : 1.0, side: d.two ? THREE.DoubleSide : THREE.FrontSide });
    const U = { SC: { value: new THREE.Vector2(...(met ?? [1, 1])).divideScalar(ts) }, MODE: { value: md }, TS: { value: ts }, GL: { value: gl }, GLOW: { value: f === 'lamp' ? 2.2 : 0 }, C1: { value: new THREE.Color(cols[0]) }, C2: { value: new THREE.Color(cols[1]) }, C3: { value: new THREE.Color(cols[2]) }, GR: { value: new THREE.Color(grout) } };
    const mt = f === 'smoke' ? 0.55 : ts;   // the smoke is a unit ball, scaled
    U.TS.value = mt; if (met) U.SC.value.set(met[0], met[1]).divideScalar(mt);
    return dressed(m, { id: 'mz', uniforms: U, defs: DEFS,
      height: 'vec2 lc; vec4 T = tl(uv, o, lc); float pl = smoothstep(0.035, 0.12, T.x); vec2 tilt = vec2(T.z, T.w) - 0.5; return TS * pl * (0.10 + 0.34 * dot(lc, tilt) + 0.05 * (1.0 - 4.0 * dot(lc, lc))) * (MODE > 1.5 ? 1.0 : 1.0);',
      color: '{ vec2 lc; vec4 T = tl(vUvL, vOP, lc); float pl = smoothstep(0.035, 0.075, T.x); vec3 c = T.y < 0.42 ? C1 : T.y < 0.80 ? C2 : C3; c *= 0.86 + 0.26 * T.z; float spk = vn(vUvL * 900.0 + T.w * 40.0); c *= 0.97 + 0.06 * spk; MG = pl; diffuseColor.rgb = mix(GR * (0.9 + 0.2 * vn(vUvL * 700.0)), c, pl); }',
      rough: 'roughnessFactor = mix(0.92, GL, MG);', emis: 'totalEmissiveRadiance += diffuseColor.rgb * GLOW * MG;' }); };
  return { on() { for (const o of ms) o.material = o.userData.mMz ??= mk(o); key.intensity = 3.4; key.color.set('#fff0dc'); fill.intensity = 0.7; amb.intensity = 0.28; bloom.strength = 0.06; bloom.threshold = 1.2; grade.ex.value = 1.04; grade.vig.value = 0.10; } };
}
