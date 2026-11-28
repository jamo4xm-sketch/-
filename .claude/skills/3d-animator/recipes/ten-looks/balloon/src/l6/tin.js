// PUNCHED TIN. A Mexican tin-lantern town at blue dusk: the balloon is tin and copper gores punched through in chains of lozenges and dots, and every burner flare
// shines out through the holes; the walls are punched tin panels lit from inside, the roofs corrugated galvanised sheet, the paving riveted plate.
import { look } from '../kit6.js';
const METAL = new Set(['wall', 'roof', 'chimney', 'pot', 'env', 'pennant', 'stone', 'ground', 'terrace', 'tape', 'skirt', 'burner', 'shutter']);
export const tinLook = look({ id: 'tin', flare: 0.25, burn: 1.4,
  T: { sky: ['#0d1730', '#34476e'], ground: ['#33363b', '#43474d'], terrace: ['#545960', '#636870'], wall: ['#b4b9bf', '#c6cacf'], roof: ['#8f969e', '#a3a9b0'], chimney: ['#a0a6ac'], pot: ['#b8784a'],
    window: ['#ffb060'], door: ['#4a3a2c'], shutter: ['#7a8894'], env: ['#cdd1d6', '#c47a46'], tape: ['#8a6a4a'], skirt: ['#3a3c40'], rope: ['#8a8a8a'], burner: ['#2a2a2e'], basket: ['#9a7448'],
    flame: ['#ffb24e'], pennant: ['#c47a46', '#cdd1d6'], tree: ['#2e3d36', '#3c4c42'], trunk: ['#3a3028'], stone: ['#a0a6ac'], bird: ['#161922'] },
  mat: (f) => (f === 'sky' ? { roughness: 1, envMapIntensity: 0 } : METAL.has(f) ? { metalness: 1.0, roughness: f === 'roof' ? 0.42 : 0.3, envMapIntensity: 1.0 } : { roughness: 0.8, envMapIntensity: 0.3 }),
  env: [[['#ffe6c8', 2.4, 3, 2, -3, 1.2, 2], ['#7d9ad0', 1.3, 6, 3, 2.5, 3, 1], ['#ffb070', 0.8, 2, 4, 0, 0.5, -4]], ['#4a6090', '#26324e', '#0c1018'], 0.03],
  defs: `vec2 fp(vec3 o, vec3 n) { return abs(n.y) > 0.7 ? o.xz : abs(n.x) > 0.7 ? o.zy : o.xy; }
    float HOLE = 0.0, RIM = 0.0;
    // punch a lattice of round holes (spacing sp, radius rd) wherever the motif distance m(p) at the lattice point is under half a step
    float mGore(vec2 p, float gw) { float fy = fract(p.y / 0.05) - 0.5; vec2 l = vec2(p.x / (gw * 0.5), fy * 2.0);
      float loz = abs(abs(l.x) + abs(l.y) - 0.62) * 0.022, ctr = length(vec2(p.x, fy * 0.05)), edge = abs(gw * 0.5 - abs(p.x) - 0.006); return min(min(loz, ctr), edge); }
    float mWall(vec2 p) { vec2 q = (fract(p / 0.06) - 0.5) * 0.06; float loz = abs(abs(q.x) + abs(q.y) - 0.022), ctr = length(q), frm = 0.03 - max(abs(q.x), abs(q.y)); return min(min(loz, ctr), abs(frm - 0.004)); }
    void punch(vec2 q, float sp, float rd, float m) { vec2 p = (floor(q / sp) + 0.5) * sp; float d = length(q - p), on = step(m, sp * 0.5);
      HOLE = on * (1.0 - smoothstep(rd * 0.8, rd, d)); RIM = on * (1.0 - smoothstep(0.0, rd * 0.5, abs(d - rd * 1.1))); }
    void holes(vec2 uv, vec3 o, vec3 n) { HOLE = 0.0; RIM = 0.0;
      if (isF(F_ENV)) { float gw = MET.x / 16.0 * sin(3.14159 * clamp(uv.y * 0.98 + 0.05, 0.0, 1.0)) + 0.01; vec2 q = vec2((fract(uv.x * 16.0) - 0.5) * gw, uv.y * MET.y);
        vec2 p = (floor(q / 0.0062) + 0.5) * 0.0062; punch(q, 0.0062, 0.0021, mGore(p, gw)); }
      else if (isF(F_WALL) || isF(F_CHIMNEY) || isF(F_STONE)) { vec2 q = fp(o, n) + LH * 0.3; vec2 p = (floor(q / 0.0055) + 0.5) * 0.0055; punch(q, 0.0055, 0.0018, mWall(p)); } }`,
  color: `{ vec3 c = C0;
    if (isF(F_SKY)) { float t = skyT(vWP); c = mix(C1, C0, smoothstep(0.0, 0.85, t)) * (0.96 + 0.06 * fbm(vWP.xy * 0.6)); SKYE = c; c *= 0.0; }
    else if (isF(F_WINDOW) || isF(F_FLAME) || isF(F_ROPE) || isF(F_BURNER) || isF(F_BASKET) || isF(F_TREE) || isF(F_TRUNK) || isF(F_DOOR)) { }
    else { if (isF(F_ENV)) c = mix(C0, C1, gore()); if (isF(F_PENNANT)) c = mix(C0, C1, step(0.5, fract(LH * 7.0)));
      vec2 s = isF(F_GROUND) || isF(F_TERRACE) ? vWP.xz : fp(vOP, vON); c *= 0.9 + 0.14 * fbm(s * 40.0 + LH * 7.0) + 0.05 * vn(s * 600.0);
      if (isF(F_GROUND) || isF(F_TERRACE)) { vec2 g = (fract(s / vec2(0.08, 0.05)) - 0.5) * vec2(0.08, 0.05); c *= 1.0 - 0.5 * aaLine(min(0.04 - abs(g.x), 0.025 - abs(g.y)), 0.0008);
        vec2 rv = abs(g) - vec2(0.034, 0.019); c = mix(c, c * 1.5, 1.0 - smoothstep(0.0015, 0.0022, length(rv))); }
      holes(vUvL, vOP, vON); c *= 1.0 + 0.25 * RIM; c *= 1.0 - HOLE; }
    diffuseColor.rgb = c; }`,
  height: `if (isF(F_SKY) || isF(F_WINDOW) || isF(F_FLAME)) return 0.0;
    if (isF(F_ROOF)) return 0.0006 * sin(abs(o.x) / 0.011 * 6.2832);
    holes(uv, o, vON); return -0.0007 * HOLE + 0.00035 * RIM;`,
  emis: `if (!isF(F_SKY) && !isF(F_WINDOW)) { holes(vUvL, vOP, vON); float k = isF(F_ENV) ? (FLW > 0.5 ? 0.3 + 2.6 * FLARE : 0.7) : 1.1; totalEmissiveRadiance += vec3(1.0, 0.6, 0.26) * HOLE * k; }
    if (isF(F_WINDOW)) totalEmissiveRadiance += C0 * 0.8;`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffd8b0'); key.intensity = 2.2; fill.color.set('#6a88c0'); fill.intensity = 0.6; amb.intensity = 0.1; spot.color.set('#ffb060');
    bloom.strength = 0.28; bloom.threshold = 0.85; bloom.radius = 0.45; grade.ex.value = 1.05; grade.vig.value = 0.24; } });
