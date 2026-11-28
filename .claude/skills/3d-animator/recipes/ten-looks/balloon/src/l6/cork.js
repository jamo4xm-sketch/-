// CORK. Agglomerated cork board: honey-coloured panels packed with granules of every tone and large, irregular dark pores that catch the low warm side light;
// the balloon alternates honey and toasted cork gores, the roofs are toasted cork, the terraces dark compressed cork, the sky a dusty blue.
import { look } from '../kit6.js';
export const corkLook = look({ id: 'cork', flare: 0.6,
  T: { sky: ['#6f889f', '#b3c3d0'], ground: ['#2e1d12', '#40291a'], terrace: ['#3a2416', '#4c301e'], wall: ['#c99a5c', '#d8ad70'], roof: ['#8a5428', '#9c6232'], chimney: ['#c4955a'], pot: ['#7a4a24'],
    window: ['#24170e'], door: ['#4a2e18'], shutter: ['#6a4020'], env: ['#d2a364', '#8a5226'], tape: ['#5a3a1e'], skirt: ['#3a2414'], rope: ['#e0cfa8'], burner: ['#2a2420'], basket: ['#b88a50'],
    flame: ['#ffb24e'], pennant: ['#8a5226', '#d2a364'], tree: ['#5a6a3a', '#6a7a44'], trunk: ['#4a3020'], stone: ['#c49660'], bird: ['#24170e'] },
  mat: (f) => ({ roughness: 0.93, envMapIntensity: f === 'sky' ? 0 : 0.15 }),
  env: [[['#fff0dc', 1.4, 3, 2, -3, 1.2, 2]], ['#a0b0c0', '#706458', '#201810'], 0.06],
  defs: `vec2 fp(vec3 o, vec3 n) { return abs(n.y) > 0.7 ? o.xz : abs(n.x) > 0.7 ? o.zy : o.xy; }
    // granules (a voronoi of 2.2 mm cells, each its own tone) and pores (dark irregular pits, the big ones about 3 mm)
    float pore(vec2 s) { float a = fbm(s * 120.0 + 3.1), b = vn(s * vec2(260.0, 170.0)); return smoothstep(0.66, 0.74, a * 0.7 + b * 0.45); }
    vec3 gran(vec2 s) { return vor(s * 150.0); }`,
  color: `{ vec3 c = C0; vec2 s = isF(F_ENV) || isF(F_PENNANT) ? vUvL * MET : isF(F_GROUND) || isF(F_TERRACE) ? vWP.xz : fp(vOP, vON) + LH * 3.0;
    if (isF(F_SKY)) { float t = skyT(vWP); c = mix(C1, C0, smoothstep(0.0, 0.9, t)) * (0.96 + 0.06 * fbm(vWP.xy * 0.6)); SKYE = c; c *= 0.0; }
    else if (isF(F_WINDOW) || isF(F_FLAME) || isF(F_ROPE) || isF(F_BURNER)) { }
    else { if (isF(F_ENV)) c = mix(C0, C1, gore()); if (isF(F_PENNANT)) c = mix(C0, C1, step(0.5, fract(LH * 7.0)));
      vec3 g = gran(s); c *= 0.68 + 0.6 * g.z; c *= 0.5 + 0.5 * smoothstep(0.0, 0.09, g.y - g.x); c *= 0.9 + 0.15 * vn(s * 900.0);
      c = mix(c, c * S(0.62, 0.45, 0.32), 0.5 * smoothstep(0.45, 0.7, fbm(s * 35.0 + LH * 9.0)));
      c *= 1.0 - 0.78 * pore(s);
      if (isF(F_WALL) || isF(F_ROOF) || isF(F_STONE)) { vec2 q = abs(fract(s / 0.075) - 0.5) * 0.075; c *= 1.0 - 0.45 * aaLine(0.0375 - max(q.x, q.y), 0.0007); } }
    diffuseColor.rgb = c; }`,
  height: `if (isF(F_SKY) || isF(F_WINDOW) || isF(F_FLAME)) return 0.0; vec2 s = isF(F_ENV) || isF(F_PENNANT) ? uv * MET : isF(F_GROUND) || isF(F_TERRACE) ? w.xz : fp(o, vON) + LH * 3.0;
    vec3 g = gran(s); return 0.0005 * smoothstep(0.0, 0.2, g.y - g.x) + 0.00025 * g.z - 0.0012 * pore(s);`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffd8a8'); key.intensity = 3.4; fill.color.set('#90a8c8'); fill.intensity = 0.45; amb.intensity = 0.18; spot.color.set('#ffb060');
    bloom.strength = 0.04; grade.ex.value = 1.0; grade.vig.value = 0.16; } });
