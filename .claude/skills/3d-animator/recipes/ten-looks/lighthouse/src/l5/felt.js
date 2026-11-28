// FELT. Thick wool felt with a soft sheen and fuzz: a dusty lilac felt sky, the cliffs built from stacked sheets of moss and sage felt with their cut edges showing,
// teal wool water in combed rows, a cream tower with red felt stripes held on by running stitches.
import { look } from '../kit5.js';
import * as THREE from 'three';
export const feltLook = look({ id: 'felt', physical: true,
  T: { sky: ['#9a85a8', '#c9b5cf'], ridge: ['#7d6f92', '#958aa8'], water: ['#1d6b6c', '#2e8a86'], foam: ['#f2efe8', '#ffffff'], cliff: ['#4d6a38', '#7f9a55'], rock: ['#4f6b3a', '#6f8a4a'], grass: ['#7ba04a', '#94b85a'], stone: ['#9a948a', '#b0aa9e'],
    tower: ['#efe5cf', '#f8f0de'], red: ['#b8342a', '#c94436'], door: ['#5a3a26', '#6a4630'], window: ['#2b3550'], iron: ['#3a3a40', '#4a4a52'], glass: ['#b9d6e0', '#d2e8ee'], house: ['#efe2c8', '#f6ecd8'], roof: ['#9a4430', '#b05238'],
    hull: ['#244a86', '#2f5ca0'], cabin: ['#f2ead8'], wood: ['#8a6a48'], gull: ['#ffffff'] },
  mat: (f, d, c0, c1) => ({ roughness: 0.95, sheen: f === 'sky' ? 0.0 : 1.0, sheenRoughness: 0.55, sheenColor: new THREE.Color(c1).lerp(new THREE.Color('#ffffff'), 0.35), envMapIntensity: f === 'sky' ? 0 : 0.35 }),
  env: [[['#fff4e8', 2.5, 4, 2, -2.5, 3, 2.5], ['#e8eeff', 1.2, 2, 3, 3, 1, 2]], ['#d8d0e0', '#9a90a0', '#504858'], 0.05],
  beam: ['#fff3c8', 0.26, 1.3], lamp: ['#ffe9a0', 2.6],
  defs: `float fuzz(vec2 s) { return fbm(s * 700.0) * 0.6 + vn(s * 1900.0) * 0.4; }
    vec2 sOf(vec2 uv, vec3 w) { return isF(F_WATER) || isF(F_CLIFF) || isF(F_GRASS) ? w.xz : uv * MET; }
    float layer(vec3 w) { return w.y / 0.026 + 0.5 * fbm(w.xz * 6.0); }`,
  color: `{ vec2 s = sOf(vUvL, vWP); vec3 c = mix(C0, C1, 0.35 * fbm(s * 50.0 + LH * 9.0)) * (0.9 + 0.16 * fuzz(s));
    if (isF(F_SKY)) { c = mix(C1, C0, smoothstep(0.0, 0.8, skyT(vWP))) * (0.94 + 0.09 * fbm(vWP.xy * 3.0)) * (0.96 + 0.06 * vn(vWP.xy * 300.0)); SKYE = c * 0.62; c *= 0.25; }
    if (isF(F_CLIFF) || isF(F_ROCK)) { float y = layer(vWP), id = floor(y), fy = fract(y); c = mix(C0, C1, h11(id + LH * 3.0)) * (0.80 + 0.26 * smoothstep(0.0, 0.3, fy)) * (0.9 + 0.16 * fuzz(s)); }
    if (isF(F_WATER)) { float r = (vWP.z + 0.03 * sin(vWP.x * 7.0 + 1.3 * sin(vWP.z * 3.0))) / 0.022; c = mix(C0, C1, 0.5 + 0.5 * sin(r * 6.2832)) * (0.92 + 0.14 * fuzz(s)); }
    if (BAND > 0.5) { vec2 m = vUvL * MET; float e = min(m.y, MET.y - m.y); float st = step(0.42, fract(m.x / 0.011)) * (1.0 - smoothstep(0.0011, 0.002, abs(e - 0.0055))); c = mix(c, S(0.97, 0.94, 0.86), st); }
    diffuseColor.rgb = c; }`,
  height: `vec2 s = sOf(uv, w); float h = 0.00011 * fuzz(s);
    if (isF(F_CLIFF) || isF(F_ROCK)) h += 0.0011 * smoothstep(0.0, 0.28, fract(layer(w)));
    if (BAND > 0.5) { vec2 m = uv * MET; float e = min(m.y, MET.y - m.y); h -= 0.00025 * step(0.42, fract(m.x / 0.011)) * (1.0 - smoothstep(0.0011, 0.002, abs(e - 0.0055))); }
    return h;`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#fff0dc'); key.intensity = 2.3; fill.color.set('#c8c8ff'); fill.intensity = 0.5; amb.intensity = 0.35; spot.color.set('#fff0c0'); spot.intensity = 3; bloom.strength = 0.08; grade.ex.value = 1.0; grade.vig.value = 0.12; } });
