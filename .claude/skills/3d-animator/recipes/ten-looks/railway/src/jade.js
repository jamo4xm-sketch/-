// JADE. Every part is carved from polished jade: imperial green for the engine, russet jade wheels, honey jade brass, white mutton-fat jade for the viaduct with green veins,
// cloudy inclusions and dark specks inside every stone, and light glowing through the thin edges. A pale fog bank stands behind, the ravine is deep green.
import * as THREE from 'three';
import { meshes } from './gbuf.js';
import { dressed, studio } from './dress.js';
import { fam } from './kit4.js';
// family -> [jade, cloud colour, inclusion scale (per object metre), glow through]; modes: 1 fog sky, 2 far ridge (fogged)
const T = { body: ['#0d7044', '#72c696', 70, 0.55], dark: ['#173426', '#4b7a5d', 60, 0.35], coal: ['#0b1611', '#2d4a3a', 200, 0.2], red: ['#9c3f24', '#e3a072', 90, 0.55], brass: ['#d2a83f', '#f6e6a6', 120, 0.6],
  steel: ['#8fae9a', '#dfeee2', 140, 0.5], glass: ['#0a2a1d', '#25543d', 80, 0.3], lamp: ['#fff6d0', '#ffffff', 1, 2.5], cream: ['#e9ead6', '#ffffff', 160, 0.7], coach: ['#6d2a1f', '#c47552', 60, 0.5],
  smoke: ['#eef1ea', '#ffffff', 2.0, 0.85], sky: ['#e9efea', '#c3d4ca', 1, 0], ridge: ['#b9d0c1', '#eef4f0', 6, 0.7], ground: ['#245238', '#5f9a72', 20, 0.4], water: ['#7cc3ad', '#d6f1e6', 30, 0.7],
  rock: ['#5f7a6a', '#a9c2b2', 50, 0.4], pine: ['#123d26', '#3d7a52', 90, 0.45], trunk: ['#4e3d2b', '#8b7252', 120, 0.3], stone: ['#3f8a5a', '#a9d6b4', 24, 0.32], arch: ['#5fa576', '#d8efdc', 40, 0.45],
  ballast: ['#6f8476', '#b5c7ba', 200, 0.3], sleeper: ['#4a3a2a', '#86704f', 150, 0.3] };
const DEFS = `uniform float MODE, SCL, GLO; uniform vec3 C0, C1; vec3 JC;`;
export function jadeLook({ scene, key, fill, amb, spot, bloom, grade, renderer }) {
  const env = studio(renderer, [['#ffffff', 5, 3.0, 1.2, -2.6, 3.4, 2.6], ['#eefff4', 3, 0.8, 4.0, 3.2, 1.2, 2.8], ['#ffffff', 2, 5.0, 0.6, 0.0, 4.0, -1.6]], ['#e6eee8', '#9fb3a6', '#3c4a40'], 0.02);
  const ms = meshes(scene);
  const mk = (o) => { const d = o.userData, f = fam(o), [c0, c1, scl, glo] = T[f] ?? T.body, mode = f === 'sky' ? 1 : f === 'ridge' ? 2 : 0, r2 = d.layer === 'r2';
    const m = new THREE.MeshStandardMaterial({ roughness: mode ? 1 : 0.14, metalness: 0, envMap: env, envMapIntensity: mode ? 0.15 : 0.9, side: d.two ? THREE.DoubleSide : THREE.FrontSide });
    const U = { MODE: { value: mode }, SCL: { value: scl }, GLO: { value: r2 ? glo * 1.2 : glo }, C0: { value: new THREE.Color(r2 ? '#c4d6cb' : c0) }, C1: { value: new THREE.Color(c1) } };
    return dressed(m, { id: 'jade', uniforms: U, defs: DEFS,
      color: `{ vec3 p = vOP * SCL; float cl = fbm3(p), vein = 1.0 - smoothstep(0.0, 0.04, abs(fbm3(p * 0.55 + 7.0) - 0.5)), sp = smoothstep(0.80, 0.87, vn3(p * 5.0));
        vec3 c = mix(C0 * 0.8, C1, smoothstep(0.38, 0.88, cl) * 0.9); c = mix(c, C1 * 1.15, vein * 0.7); c *= 1.0 - 0.22 * sp;
        if (MODE > 0.5 && MODE < 1.5) c = mix(C0, C1, smoothstep(0.7, -0.5, vWP.y)) * (0.97 + 0.06 * fbm(gl_FragCoord.xy * 0.004));
        if (MODE > 1.5) c = mix(c, S(0.91, 0.94, 0.92), 0.35 + 0.35 * smoothstep(0.6, 0.0, vUvL.y));
        JC = c; diffuseColor.rgb = MODE > 0.5 && MODE < 1.5 ? vec3(0.0) : c * 0.6; }`,
      emis: `{ vec3 Vd = normalize(vViewPosition); float fr = 1.0 - abs(dot(normal, Vd)); vec3 g = JC * GLO * (0.40 + 1.9 * pow(fr, 1.6)); if (MODE > 0.5 && MODE < 1.5) g = JC; totalEmissiveRadiance += g; }` }); };
  return { on() { for (const o of ms) o.material = o.userData.mJade ??= mk(o); key.intensity = 2.6; key.color.set('#fffaf0'); fill.intensity = 0.5; amb.intensity = 0.2; bloom.strength = 0.18; bloom.threshold = 1.0; bloom.radius = 0.6; grade.ex.value = 1.0; grade.vig.value = 0.10; } };
}
