// MOSS. Plush sunlit moss grows over every top: it crowns the envelope and runs down alternate gores, thickens on the roof ridges and chimney tops,
// while the walls and paving are damp black stone; a deep forest-green sky behind gives the silhouette its weight.
import { look } from '../kit6.js';
export const mossLook = look({ id: 'moss', physical: true, flare: 0.7,
  T: { sky: ['#06150d', '#1b3622'], ground: ['#0f1110', '#1b1e1c'], terrace: ['#151816', '#202422'], wall: ['#1c1f1d', '#262a27'], roof: ['#1a1d1b', '#232724'], chimney: ['#1e2220'], pot: ['#24282a'],
    window: ['#0a0c0b'], door: ['#2a2018'], shutter: ['#202421'], env: ['#5f8a22', '#1b1e1c'], tape: ['#121412'], skirt: ['#121412'], rope: ['#6a5a40'], burner: ['#1a1a1a'], basket: ['#5a4630'],
    flame: ['#ffb24e'], pennant: ['#6a9a28', '#1b1e1c'], tree: ['#3e6a1c', '#5f8a22'], trunk: ['#1a1610'], stone: ['#1e2220'], bird: ['#0a0c0b'] },
  mat: (f) => ({ roughness: 0.35, sheen: f === 'sky' ? 0 : 1.0, sheenRoughness: 0.45, sheenColor: '#d8f080', envMapIntensity: f === 'sky' ? 0 : 0.6, clearcoat: f === 'sky' ? 0 : 0.6, clearcoatRoughness: 0.25 }),
  env: [[['#fff0d8', 2.0, 3, 2, -3, 1.4, 2], ['#a8d0a0', 0.7, 4, 3, 3, 2, 1]], ['#2a4a30', '#18261a', '#060806'], 0.04],
  defs: `vec2 fp(vec3 o, vec3 n) { return abs(n.y) > 0.7 ? o.xz : abs(n.x) > 0.7 ? o.zy : o.xy; }
    float MOSS = 0.0;
    float clump(vec3 p) { return 0.55 * fbm3(p * 140.0) + 0.3 * vn3(p * 520.0) + 0.15 * vn3(p * 1600.0); }
    float mossOn(vec3 p, vec3 n, vec2 uv) { float e = 0.15 * (fbm3(p * 40.0) - 0.5);
      if (isF(F_ENV)) return max(smoothstep(0.50, 0.58, uv.y + e), gore() > 0.5 ? smoothstep(0.0, 0.08, uv.y + e) * (1.0 - smoothstep(0.42, 0.5, abs(fract(uv.x * 16.0) - 0.5) * 2.0 + e)) : 0.0);
      if (isF(F_TREE) || isF(F_PENNANT)) return 1.0;
      if (isF(F_ROOF)) return smoothstep(0.15, 0.45, n.y + e + 0.25 * fbm3(p * 25.0));
      return smoothstep(0.55, 0.8, n.y + e); }`,
  color: `{ vec3 c = C0; vec3 p = isF(F_ENV) ? vOP : vWP; vec3 n = normalize(vWN);
    if (isF(F_SKY)) { float t = skyT(vWP); c = mix(C1, C0, smoothstep(0.0, 0.9, t)) * (0.94 + 0.08 * fbm(vWP.xy * 0.7)); SKYE = c; c *= 0.0; }
    else if (isF(F_WINDOW) || isF(F_FLAME) || isF(F_BURNER) || isF(F_ROPE) || isF(F_BASKET) || isF(F_TRUNK)) { }
    else { vec2 s = isF(F_ENV) ? vUvL * MET : fp(vOP, vON); vec3 st = (isF(F_ENV) ? C1 : C0) * (0.75 + 0.5 * fbm(s * 40.0 + LH * 7.0)) * (0.85 + 0.3 * vn(s * 300.0));
      if (isF(F_WALL) || isF(F_STONE)) { vec2 b = vec2(s.x / 0.05 + 0.5 * mod(floor(s.y / 0.028), 2.0), s.y / 0.028); st *= 1.0 - 0.6 * max(aaLine(abs(fract(b.x) - 0.5) * 0.05, 0.0012) * 0.0 + aaLine((0.5 - abs(fract(b.y) - 0.5)) * 0.028, 0.0012), aaLine((0.5 - abs(fract(b.x) - 0.5)) * 0.05, 0.0012)); }
      MOSS = mossOn(p, n, vUvL); float cl = clump(p); vec3 mc = mix(S(0.16, 0.28, 0.05), S(0.55, 0.70, 0.16), smoothstep(0.3, 0.8, cl)) * (0.8 + 0.4 * h11(floor(cl * 6.0) + LH));
      c = mix(st, mc, MOSS); }
    diffuseColor.rgb = c; }`,
  height: `if (isF(F_SKY) || isF(F_WINDOW) || isF(F_FLAME)) return 0.0; vec3 p = isF(F_ENV) ? o : w; float m = mossOn(p, normalize(vWN), uv); return m * (0.0016 * clump(p) + 0.0006) + (1.0 - m) * 0.0002 * fbm3(p * 200.0);`,
  rough: `roughnessFactor = mix(0.28, 0.95, MOSS);`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#fff0c8'); key.intensity = 3.4; fill.color.set('#6a9a70'); fill.intensity = 0.4; amb.intensity = 0.14; spot.color.set('#ffb060');
    bloom.strength = 0.06; grade.ex.value = 1.1; grade.vig.value = 0.25; } });
