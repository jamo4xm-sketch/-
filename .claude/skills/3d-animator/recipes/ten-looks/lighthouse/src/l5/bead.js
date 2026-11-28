// BEADWORK. Long glass bugle beads sewn in rows that run round the tower and along the swell, glossy so each one catches a highlight; round pebble seed beads
// clustered on the rocks and cliffs, pearl seed beads for the surf, a matte midnight-blue beaded sky. Dark backing cloth shows between the beads.
import { look } from '../kit5.js';
export const beadLook = look({ id: 'bead', physical: true,
  T: { sky: ['#0a1030', '#1a2a5c'], ridge: ['#141c3c', '#22305a'], water: ['#0c2f55', '#22629a'], foam: ['#e8eef2', '#ffffff'], cliff: ['#262628', '#4c4844'], rock: ['#222226', '#55504a'], grass: ['#2e5a2a', '#4f8038'], stone: ['#6a6a6a', '#8a8a8a'],
    tower: ['#e6e3dc', '#ffffff'], red: ['#a01818', '#cf2f25'], door: ['#3a2a1a', '#50381e'], window: ['#0e1a2a'], iron: ['#101010', '#262626'], glass: ['#2a3a4a', '#4a6a86'], house: ['#e0d8c8', '#f6eee2'], roof: ['#6a2416', '#8e3220'],
    hull: ['#123a7a', '#2052a4'], cabin: ['#e6e3dc', '#ffffff'], wood: ['#6a4a2a', '#7a5832'], gull: ['#f0f0f0', '#ffffff'] },
  mat: (f) => ({ roughness: 0.2, clearcoat: f === 'sky' || f === 'ridge' ? 0 : 0.7, clearcoatRoughness: 0.1, envMapIntensity: f === 'sky' ? 0 : 1.0 }),
  env: [[['#ffffff', 6, 3.0, 1.2, -2.6, 2.8, 2.6], ['#fff6e8', 3, 0.6, 3.6, 3.0, 1.2, 2.4], ['#ffffff', 2, 5.0, 0.5, 0.0, 4.0, -1.5]], ['#20242c', '#3a3e48', '#0c0c10'], 0.02],
  beam: ['#fff0c8', 0.32, 1.5], lamp: ['#ffd77a', 4],
  defs: `float BI;
    vec3 bugle(vec2 s, float RH, float BL) { float row = floor(s.y / RH), x = s.x / BL + h11(row) * 3.0, id = floor(x) + row * 131.0; float fx = (fract(x) - 0.5) * BL, fy = (fract(s.y / RH) - 0.5) * RH, r = RH * 0.43;
      float d = length(vec2(max(abs(fx) - (BL * 0.5 - r - RH * 0.07), 0.0), fy)); return vec3(sqrt(max(r * r - d * d, 0.0)), 1.0 - smoothstep(r * 0.9, r, d), h11(id)); }
    vec3 seedB(vec2 s, float D) { vec2 g = s / D; g.x += 0.5 * mod(floor(g.y), 2.0); vec2 id = floor(g), f = fract(g) - 0.5; float r = 0.45 * (0.78 + 0.25 * h21(id + 1.7)), d = length(f); return vec3(sqrt(max(r * r - d * d, 0.0)) * D, 1.0 - smoothstep(r * 0.88, r, d), h21(id)); }
    vec3 beadAt(vec3 o, vec2 uv, vec3 w) {
      if (isF(F_SKY) || isF(F_RIDGE)) return bugle(w.xy * 0.22, 0.0075, 0.03);
      if (isF(F_WATER)) return bugle(vec2(w.x, w.z + 0.02 * sin(w.x * 11.0 + 1.7 * sin(w.z * 5.0))), 0.009, 0.03);
      if (isF(F_CLIFF) || isF(F_GRASS)) return seedB(abs(vWN.y) > 0.6 ? w.xz : vec2(w.x + w.z, w.y), 0.011);
      if (isF(F_ROCK) || isF(F_FOAM) || isF(F_SPRAY) || isF(F_GULL) || isF(F_IRON) || isF(F_STONE)) return seedB(tri(o, vON), 0.009);
      return bugle(uv * MET, 0.0085, 0.026); }`,
  color: `{ vec3 b = beadAt(vOP, vUvL, vWP); BI = b.y; vec3 c = mix(C0, C1, b.z) * (0.85 + 0.25 * b.y); c = mix(S(0.03, 0.03, 0.05), c, b.y);
    if (isF(F_SKY)) { c *= mix(1.15, 0.7, skyT(vWP)); SKYE = c * 0.5; c *= 0.5; } diffuseColor.rgb = c; }`,
  rough: 'roughnessFactor = isF(F_SKY) || isF(F_RIDGE) ? 0.8 : mix(0.9, 0.14, BI);',
  height: 'return beadAt(o, uv, w).x;',
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#fff0dc'); key.intensity = 2.4; fill.color.set('#9fb0e0'); fill.intensity = 0.4; amb.intensity = 0.22; spot.color.set('#fff0c8'); spot.intensity = 4; bloom.strength = 0.15; bloom.threshold = 1.0; grade.ex.value = 1.0; grade.vig.value = 0.16; } });
