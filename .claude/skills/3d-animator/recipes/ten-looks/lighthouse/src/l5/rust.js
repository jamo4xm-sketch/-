// RUST. Weathered painted steel: white and red paint peeling off pitted rust, rust streaks running down from every chip, bare rusted railings and mast.
// Smoke-grey sky, wet black rock with iron stains at the tide line, dark water stained orange in the pools.
import { look } from '../kit5.js';
export const rustLook = look({ id: 'rust',
  T: { sky: ['#000000'], ridge: ['#3c3d40', '#4a4b4e'], water: ['#141b1a', '#1d2624'], foam: ['#d8d2c2', '#e8e2d2'], cliff: ['#121212', '#1e1c1a'], rock: ['#0e0e0e', '#1c1a18'], grass: ['#4a4a2a', '#5e5a34'], stone: ['#6a6660', '#7a756c'],
    tower: ['#d8d2c4', '#d8d2c4', 1], red: ['#962a1e', '#962a1e', 1], door: ['#2f4a3a', '#2f4a3a', 1], window: ['#141616'], iron: ['#000000', '#000000', -1], glass: ['#1a1d1c'], house: ['#d4cebe', '#d4cebe', 1], roof: ['#6e2a1c', '#6e2a1c', 1],
    hull: ['#20406a', '#20406a', 1], cabin: ['#d8d2c4', '#d8d2c4', 1], wood: ['#000000', '#000000', -1], gull: ['#e6e2d8'] },
  env: [[['#ffffff', 2, 4, 1.5, -2, 3, 2], ['#ffe8d0', 1.2, 0.6, 3.0, 3.0, 1.0, 2.0]], ['#9a9894', '#6a6866', '#2a2826'], 0.04],
  beam: ['#f3ead8', 0.28, 1.5], lamp: ['#ffe6b0', 3.5],
  defs: `float RM; float pmask(vec3 o, vec3 w) { float n = fbm3(o * 38.0 + LH * 5.0) * 0.75 + 0.25 * fbm(vec2(w.x * 120.0 + w.z * 90.0, w.y * 7.0)); return smoothstep(0.52, 0.55, n + 0.20 * smoothstep(0.40, 0.0, w.y)); }
    vec3 rustC(vec3 o, vec3 w) { return mix(S(0.30, 0.12, 0.05), S(0.60, 0.29, 0.10), fbm3(o * 160.0)) * (0.72 + 0.4 * vn(vec2(w.x * 400.0 + w.z * 300.0, w.y * 30.0))); }`,
  color: `{ vec3 c = C0; RM = 0.0;
    if (KK > 0.5) { RM = pmask(vOP, vWP); float streak = smoothstep(0.55, 0.85, fbm(vec2(vWP.x * 220.0 + vWP.z * 160.0, vWP.y * 5.0 + 3.0))) * (1.0 - RM);
      vec3 paint = C0 * (0.9 + 0.1 * vn(vOP.xy * 500.0)); paint = mix(paint, S(0.42, 0.20, 0.09), streak * 0.65); c = mix(paint, rustC(vOP, vWP), RM); }
    else if (KK < -0.5) { c = rustC(vOP, vWP); RM = 1.0; }
    else if (isF(F_SKY)) { SKYE = mix(S(0.56, 0.54, 0.51), S(0.25, 0.26, 0.28), smoothstep(0.0, 0.9, skyT(vWP))) * (0.94 + 0.1 * fbm(vWP.xy * vec2(1.2, 3.0))); c = vec3(0.0); }
    else if (isF(F_ROCK) || isF(F_CLIFF) || isF(F_STONE)) { c = C0 * (0.7 + 0.6 * fbm3(vOP * 30.0)); float st = smoothstep(0.10, 0.0, vWP.y) * smoothstep(0.35, 0.65, fbm(vWP.xz * 40.0 + vWP.y * 30.0)); c = mix(c, S(0.40, 0.17, 0.06), st * 0.85); }
    else if (isF(F_WATER)) { float st = smoothstep(0.55, 0.8, fbm(vWP.xz * 3.0)) * smoothstep(-1.0, 0.0, vWP.z); c = mix(C0, S(0.22, 0.09, 0.03), st * 0.75); }
    diffuseColor.rgb = c; }`,
  rough: 'roughnessFactor = KK > 0.5 ? mix(0.42, 0.92, RM) : KK < -0.5 ? 0.9 : isF(F_ROCK) || isF(F_CLIFF) ? 0.18 + 0.35 * fbm3(vOP * 20.0) : isF(F_WATER) ? 0.05 : isF(F_SKY) ? 1.0 : 0.6;',
  height: `if (KK > 0.5) { float m = pmask(o, w); return (1.0 - m) * 0.00045 - m * 0.0003 * fbm3(o * 300.0); }
    if (KK < -0.5) return -0.00035 * fbm3(o * 300.0); if (isF(F_ROCK) || isF(F_CLIFF)) return 0.0009 * fbm3(o * 40.0); return 0.0;`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffe2c4'); key.intensity = 3.2; fill.color.set('#a0a8b8'); fill.intensity = 0.35; amb.intensity = 0.12; spot.color.set('#fff0d8'); spot.intensity = 3.5; bloom.strength = 0.12; grade.ex.value = 1.0; grade.vig.value = 0.18; } });
