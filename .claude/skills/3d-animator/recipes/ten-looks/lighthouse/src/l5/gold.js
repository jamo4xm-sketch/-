// GOLD LEAF. Built things gilded in square leaves that overlap at the seams, tilt a little each and crack to the red bole underneath; the stripes and roofs are bare bole.
// Ink-black sky, slate cliffs and rocks, black water carrying a narrow gold reflection, silver leaf for the surf and the gulls.
import { look } from '../kit5.js';
export const goldLook = look({ id: 'gold',
  T: { sky: ['#000000'], ridge: ['#0b0d12', '#141821'], water: ['#020305'], foam: ['#b9bcc0', '#e4e6e9', 2], cliff: ['#22272e', '#3a424c'], rock: ['#1d2127', '#3b434d'], grass: ['#1f2418', '#2f3624'], stone: ['#2a2f36', '#454d57'],
    tower: ['#c99a35', '#f1cf78', 1], red: ['#5c150d', '#7a2014'], door: ['#3a0f09'], window: ['#050505'], iron: ['#2c2116', '#3e2f1e'], glass: ['#0a0a0a'], house: ['#c49433', '#ecc870', 1], roof: ['#5c150d', '#7a2014'],
    hull: ['#c99a35', '#f1cf78', 1], cabin: ['#c99a35', '#f1cf78', 1], wood: ['#2c2116'], gull: ['#b9bcc0', '#e4e6e9', 2] },
  mat: (f) => (f === 'water' ? { envMapIntensity: 0.7 } : {}),
  env: [[['#ffd08a', 7, 3.0, 0.9, -2.6, 2.6, 2.6], ['#fff0c8', 3.5, 0.5, 3.0, 3.0, 1.2, 2.4], ['#ffb048', 3.2, 0.22, 1.6, -0.03, 0.55, -4.0], ['#ffc870', 2.2, 4.0, 3.0, 0.0, 0.8, 4.0], ['#ffe2a8', 2, 2.0, 2.0, 0.5, 4.0, 0.5]], ['#0c0906', '#1a120a', '#050403'], 0.02],
  beam: ['#ffcf70', 0.42, 1.6], lamp: ['#ffdc96', 5],
  defs: `float GB, GT; vec2 sOf(vec2 uv, vec3 w) { return isF(F_WATER) ? w.xz : uv * MET; }
    vec3 leaf(vec2 s) { vec2 g = s / 0.034; g.x += 0.37 * floor(g.y); vec2 id = floor(g), f = fract(g), e = min(f, 1.0 - f); float m = min(e.x, e.y);
      float seam = 1.0 - smoothstep(0.0, 0.06, m), cr = abs(fbm(s * 70.0 + id * 3.1) - 0.5);
      float bole = (1.0 - smoothstep(0.004, 0.022, cr)) * smoothstep(0.45, 0.95, h21(id + 4.0)) + (1.0 - smoothstep(0.0, 0.03, m)) * step(0.72, h21(id + 9.0));
      return vec3(seam, clamp(bole, 0.0, 1.0), h21(id)); }`,
  color: `{ vec2 s = sOf(vUvL, vWP); vec3 c = C0; GB = 0.0; GT = 0.5;
    if (KK > 0.5) { vec3 L = leaf(s); GT = L.z; vec3 a = KK > 1.5 ? C0 : C0, b = C1; c = mix(a, b, L.z * 0.75 + 0.25 * fbm(s * 40.0)) * (1.0 - 0.3 * L.x); GB = L.y; c = mix(c, S(0.40, 0.11, 0.06), GB); }
    else if (isF(F_SKY)) { SKYE = mix(S(0.075, 0.048, 0.028), S(0.006, 0.007, 0.011), smoothstep(0.0, 0.6, skyT(vWP))); c = vec3(0.0); }
    else if (isF(F_CLIFF) || isF(F_ROCK) || isF(F_STONE)) c = mix(C0, C1, fbm(vec2(vWP.x * 7.0 + vWP.z * 5.0, vWP.y * 55.0))) * (0.8 + 0.3 * vn(vOP.xz * 300.0));
    else c = mix(C0, C1, fbm(vOP.xz * 30.0));
    diffuseColor.rgb = c; }`,
  metal: 'metalnessFactor = KK > 0.5 ? 1.0 - GB : 0.0;',
  rough: 'roughnessFactor = KK > 0.5 ? mix(0.16 + 0.16 * GT, 0.75, GB) : isF(F_WATER) ? 0.07 : isF(F_SKY) ? 1.0 : isF(F_GLASS) || isF(F_WINDOW) ? 0.1 : 0.62;',
  height: `if (KK > 0.5) { vec2 s = uv * MET, g = s / 0.034; g.x += 0.37 * floor(g.y); vec2 id = floor(g), f = fract(g) - 0.5; float m = min(0.5 - abs(f.x), 0.5 - abs(f.y));
      return dot(f, h22(id) - 0.5) * 0.0011 + 0.00009 * fbm(s * 260.0) + 0.00016 * (1.0 - smoothstep(0.0, 0.07, m)); }
    if (isF(F_CLIFF) || isF(F_ROCK)) return 0.0007 * fbm(vec2(w.x * 7.0 + w.z * 5.0, w.y * 55.0)); return 0.0;`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffcf8f'); key.intensity = 1.7; fill.color.set('#5a6890'); fill.intensity = 0.14; amb.intensity = 0.04; spot.color.set('#ffd890'); spot.intensity = 6; bloom.strength = 0.32; bloom.threshold = 0.95; bloom.radius = 0.5; grade.ex.value = 1.1; grade.vig.value = 0.22; } });
