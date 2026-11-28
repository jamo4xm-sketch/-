// TOPOGRAPHIC MAP. The scene is printed as a relief map: brown contour lines every centimetre of height (every fifth one bold), layer tints that step from valley green
// through tan and rock to snow, blue water lines in the creek, hatched masonry on the viaduct, the train in flat map inks with its own contours, the track as the
// black-and-white railway symbol, and the sky as the map's margin with its grid.
import * as THREE from 'three';
import { meshes } from './gbuf.js';
import { dressed } from './dress.js';
import { fam } from './kit4.js';
// family -> [mode, colour, contour interval (m), line colour]; modes: 0 layer tints, 1 flat ink, 2 water, 3 hatched masonry, 4 railway symbol, 5 margin
const BR = '#8a5a2e';
const T = { body: [7, '#2f8a57', 0.0055], dark: [7, '#26272c', 0.0055], coal: [7, '#26272c', 0.0055], red: [7, '#d03a26', 0.0055], brass: [7, '#c8901c', 0.0055], steel: [7, '#6f777e', 0.0055], glass: [7, '#2f6aa8', 0.0055],
  lamp: [1, '#fbefb5', 0.010], cream: [7, '#b89a5a', 0.0055], coach: [7, '#a8452f', 0.0055], smoke: [1, '#fbf8f0', 0.16, '#9aa0a6'],
  sky: [5, '#f1e9d6', 1, '#b9c4c9'], ridge: [0, '', 0.035, BR], ground: [0, '', 0.012, BR], water: [2, '#8fc3dc', 0.012, '#3f86ad'], rock: [0, '', 0.012, BR], pine: [1, '#7fae6e', 0.012, '#3d6a3a'], trunk: [1, '#8a6a48', 0.012],
  stone: [3, '#e3cbbb', 0.045, BR], arch: [3, '#efdccd', 0.045, BR], ballast: [4, '#f6f1e4', 0.012, '#1d1c1e'], sleeper: [1, '#1d1c1e', 0.012], rail: [1, '#1d1c1e', 0.012] };
const DEFS = `uniform float MODE, CI, USEO; uniform vec3 C0, LC;
  float tri(float x) { return abs(fract(x) - 0.5); }
  vec3 hyp(float h) { float s = floor(h / 0.05) + 0.5; vec3 c[8] = vec3[8](S(0.55, 0.70, 0.47), S(0.66, 0.78, 0.53), S(0.78, 0.84, 0.59), S(0.88, 0.87, 0.64), S(0.92, 0.83, 0.62), S(0.87, 0.71, 0.52), S(0.77, 0.61, 0.47), S(0.95, 0.94, 0.91));
    float k = clamp((s * 0.05 + 0.62) / 0.12, 0.0, 7.0); int i = int(k); return c[min(i, 7)]; }
  // coverage of a contour line: z in intervals, width in px
  float cl(float z, float wpx) { float fw = max(fwidth(z), 1e-3); float d = abs(fract(z + 0.5) - 0.5) / fw; return 1.0 - smoothstep(wpx * 0.5 - 0.5, wpx * 0.5 + 0.6, d); }`;
export function topoLook({ scene, key, fill, amb, spot, bloom, grade }) {
  const ms = meshes(scene);
  const mk = (o) => { const d = o.userData, f = d.part === 'rail' ? 'rail' : fam(o), [mode, col, ci, lc] = T[f] ?? T.body, r2 = d.layer === 'r2';
    const c0 = new THREE.Color(col || '#ffffff'), L = lc ? new THREE.Color(lc) : c0.clone().multiplyScalar(0.42);
    const m = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, side: d.two ? THREE.DoubleSide : THREE.FrontSide });
    const U = { MODE: { value: mode }, CI: { value: r2 ? 0.05 : ci }, USEO: { value: f === 'smoke' ? 1 : 0 }, C0: { value: c0 }, LC: { value: L } };
    return dressed(m, { id: 'topo', uniforms: U, defs: DEFS,
      color: `{ float h = USEO > 0.5 ? vOP.y : vWP.y; vec3 c = MODE < 0.5 ? hyp(h) : C0; vec2 sc = gl_FragCoord.xy; float pap = 0.965 + 0.05 * vn(sc * 0.6) * vn(sc * 0.07 + 3.0);
        if (MODE > 1.5 && MODE < 2.5) { float w = cl(vOP.z / 0.0055, 1.3); c = mix(c, LC, 0.75 * w); }
        if (MODE > 6.5) c = mix(S(0.97, 0.95, 0.90), C0, 0.38);
        if (MODE > 3.5 && MODE < 4.5) { float dash = step(0.5, fract(vOP.x / 0.05)); c = mix(c, S(0.11, 0.11, 0.12), dash); }
        if (MODE > 4.5 && MODE < 5.5) { float g = max(cl(vOP.x / 0.22, 1.0), cl(vOP.y / 0.22, 1.0)); c = mix(c, LC, 0.6 * g); }
        else { float z = h / CI, idx = step(abs(mod(floor(z + 0.5), 5.0)), 0.5); float w = cl(z, mix(MODE > 6.5 ? 2.0 : 2.0, MODE > 6.5 ? 3.4 : 3.8, idx)); c = mix(c, MODE > 6.5 ? C0 * 0.7 : LC, w * (MODE < 0.5 || MODE > 2.5 ? 1.0 : 0.8)); }
        diffuseColor.rgb = c * pap; }` }); };
  return { on() { for (const o of ms) o.material = o.userData.mTopo ??= mk(o); key.intensity = 2.0; key.color.set('#fffaf0'); fill.intensity = 0.55; amb.intensity = 0.75; amb.color.set('#ffffff'); bloom.strength = 0; grade.ex.value = 1.02; grade.vig.value = 0.05; } };
}
