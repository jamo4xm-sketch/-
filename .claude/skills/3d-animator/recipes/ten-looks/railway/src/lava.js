// LAVA. Everything is cooling basalt: a dark crust broken into plates whose cracks still glow, cool blue highlights on the crust, molten brass and red-hot wheels,
// ash smoke lit from below, a molten creek, glowing rivulets down black ridges and a soot sky with a burning horizon. The undersides of the arches catch the ravine's glow.
import * as THREE from 'three';
import { meshes } from './gbuf.js';
import { dressed, studio } from './dress.js';
import { fam } from './kit4.js';
// family -> [crust, hot colour, plate scale (per object metre), crack width, glow, base glow (whole surface), rough]; mode via MODE uniform
const HOT = '#ff6a1c';
const T = { body: ['#3a3230', HOT, 50, 0.035, 2.6, 0, 0.38], dark: ['#171415', HOT, 55, 0.03, 2.0, 0, 0.5], coal: ['#141212', '#ff7a2a', 200, 0.08, 2.6, 0.03, 0.8], red: ['#3a1a12', '#ff3e12', 120, 0.05, 1.8, 0.40, 0.5],
  brass: ['#ffb43c', '#ffd27a', 1, 0, 0, 1.6, 0.3], steel: ['#34383d', HOT, 90, 0.025, 1.0, 0, 0.3], glass: ['#ff9a3a', '#ffb860', 1, 0, 0, 1.2, 0.2], lamp: ['#fff0c0', '#fff0c0', 1, 0, 0, 2.6, 0.2],
  cream: ['#ff8a2c', '#ffb050', 1, 0, 0, 1.3, 0.4], coach: ['#2e1c18', HOT, 60, 0.035, 2.2, 0, 0.45], smoke: ['#3a3431', '#ff7a2a', 2.2, 0, 1.0, 0, 0.9],
  sky: ['#0c0909', '#3a160c', 1, 0, 0, 0, 1], ridge: ['#1a1617', '#ff5a18', 6, 0, 1.6, 0, 0.7], ground: ['#1e1918', HOT, 13, 0.035, 2.4, 0, 0.6], water: ['#ff7a1c', '#ffd070', 30, 0.10, 0, 2.6, 0.3],
  rock: ['#26211f', HOT, 40, 0.03, 1.6, 0, 0.5], pine: ['#120f0f', '#ff6018', 90, 0.035, 1.8, 0, 0.8], trunk: ['#0f0c0c', HOT, 1, 0, 0, 0, 0.9],
  stone: ['#2b2624', HOT, 26, 0.03, 1.4, 0, 0.5], arch: ['#3a3330', HOT, 34, 0.025, 1.1, 0, 0.45], ballast: ['#201c1b', HOT, 140, 0.03, 0.8, 0, 0.8], sleeper: ['#120f0e', HOT, 1, 0, 0, 0, 0.8] };
const MODE = { sky: 1, water: 2, ridge: 3, smoke: 4 };
const DEFS = `uniform float MODE, SCL, CR, GLW, BASE, RG; uniform vec3 C0, HC; float CK, EM;`;
export function lavaLook({ scene, key, fill, amb, spot, bloom, grade, renderer }) {
  const env = studio(renderer, [['#9fc2ff', 2.4, 3.0, 1.2, -2.6, 3.4, 2.6], ['#c8dcff', 1.4, 4.0, 0.4, 2.4, 2.6, 3.6], ['#ff7a30', 1.6, 6.0, 1.0, 0, -3.4, 1.4]], ['#0b0c10', '#0d0b0b', '#2a1208'], 0.03);
  const ms = meshes(scene);
  const mk = (o) => { const d = o.userData, f = fam(o), [c0, hc, scl, cr, glw, base, rg] = T[f] ?? T.body, r2 = d.layer === 'r2';
    const m = new THREE.MeshStandardMaterial({ roughness: rg, metalness: f === 'steel' ? 0.6 : 0, envMap: env, envMapIntensity: f === 'sky' ? 0 : 1.0, side: d.two ? THREE.DoubleSide : THREE.FrontSide });
    const U = { MODE: { value: MODE[f] ?? 0 }, SCL: { value: scl }, CR: { value: cr }, GLW: { value: r2 ? glw * 0.5 : glw }, BASE: { value: base }, RG: { value: rg }, C0: { value: new THREE.Color(c0) }, HC: { value: new THREE.Color(hc) } };
    return dressed(m, { id: cr > 0 ? 'lavaH' : 'lava', uniforms: U, defs: DEFS,
      height: cr > 0 ? 'vec2 wv = wor3(o * SCL); return smoothstep(0.0, CR * 2.5, wv.y - wv.x) * 0.25 / SCL;' : '',
      color: `{ CK = 0.0; EM = BASE; vec3 c = C0; vec3 p = vOP * SCL;
        if (CR > 0.0) { vec2 w = wor3(p); float e = w.y - w.x, fw = max(fwidth(e), 1e-4); CK = 1.0 - smoothstep(CR * 0.5, CR * 0.5 + fw * 1.5, e); float halo = 1.0 - smoothstep(0.0, CR * 3.0, e);
          c *= 0.72 + 0.55 * fbm3(p * 2.7); c = mix(c, c * 1.8 + 0.04, 0.3 * smoothstep(0.62, 0.85, vn3(p * 6.0))); EM = max(EM, (CK + 0.06 * halo) * 1.5 * smoothstep(0.30, 0.78, vn3(p * 0.33 + 3.0))); }
        if (MODE > 0.5 && MODE < 1.5) { float g = smoothstep(0.9, -1.4, vWP.y); c = mix(C0, HC, g * g) ; EM = 0.0; }
        if (MODE > 1.5 && MODE < 2.5) { float fl = fbm3(vec3(vOP.x * 30.0 - 0.0, vOP.z * 60.0, 0.0)); c = mix(C0, HC, smoothstep(0.4, 0.75, fl)); float crust = smoothstep(0.62, 0.70, vn3(vOP * 40.0)); c = mix(c, S(0.10, 0.08, 0.08), crust * 0.9); EM = BASE * (1.0 - crust * 0.92); }
        if (MODE > 2.5 && MODE < 3.5) { float r = abs(fract(vOP.x * 5.0 + 0.8 * fbm3(vec3(vOP.x * 3.0, vOP.y * 6.0, 1.0))) - 0.5); float riv = (1.0 - smoothstep(0.0, 0.035, r)) * smoothstep(-0.2, -0.9, vWP.y + 0.4 * fbm3(vOP * 4.0)); EM = max(EM * 0.3, riv); c = mix(C0, HC, riv); }
        if (MODE > 3.5) { float under = smoothstep(0.3, -0.8, vON.y); EM = 0.55 * under * under + CK * 0.6; c *= 0.85 + 0.3 * fbm3(vOP * 3.0); }
        diffuseColor.rgb = MODE > 0.5 && MODE < 1.5 ? vec3(0.0) : mix(c, c * 0.3, min(CK, 1.0)); }`,
      rough: 'roughnessFactor = mix(RG, 1.0, CK);',
      emis: `{ vec3 hot = HC * GLW * EM; if (BASE > 0.0) hot = C0 * EM * 1.0 + HC * GLW * CK; if (MODE > 0.5 && MODE < 1.5) { float g = smoothstep(0.9, -1.4, vWP.y); hot = mix(C0, HC, g * g) * (0.9 + 0.2 * vn(gl_FragCoord.xy * 0.01)); }
        if (MODE > 1.5 && MODE < 2.5) hot = diffuseColor.rgb * EM; if (MODE > 2.5 && MODE < 3.5) hot = HC * EM * 1.6; if (MODE > 3.5) hot = HC * EM;
        float under = max(0.0, -vWN.y) * smoothstep(0.0, -0.6, vWP.y); hot += HC * 0.55 * under * under * step(MODE, 0.5); totalEmissiveRadiance += hot; }` }); };
  return { on() { for (const o of ms) o.material = o.userData.mLava ??= mk(o); key.intensity = 2.3; key.color.set('#aac4ff'); fill.intensity = 0.25; fill.color.set('#ff9a60'); amb.intensity = 0.06; amb.color.set('#ffb080');
      bloom.strength = 0.28; bloom.threshold = 1.1; bloom.radius = 0.35; grade.ex.value = 0.95; grade.vig.value = 0.22; } };
}
