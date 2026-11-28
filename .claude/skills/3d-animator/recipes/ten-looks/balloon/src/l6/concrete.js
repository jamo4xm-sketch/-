// CAST CONCRETE. Board-formed concrete everywhere: a low raking sun from the left picks out the formwork seams, the wood grain the boards left behind,
// the rows of tie holes and the pitted bug holes; the balloon is cast in two pigments (oxide red and bone), the paving is black aggregate, the sky a cold grey.
import { look } from '../kit6.js';
export const concreteLook = look({ id: 'concrete', flare: 0.5,
  T: { sky: ['#8e98a2', '#c3c9ce'], ground: ['#232427', '#36373b'], terrace: ['#8a8781', '#9d9a93'], wall: ['#b2aea5', '#c2beb5'], roof: ['#7b7873', '#8c8983'], chimney: ['#a39f97'], pot: ['#94503a'],
    window: ['#232427'], door: ['#3a3a3c'], shutter: ['#8f8b84'], env: ['#9a4430', '#d8d1c3'], tape: ['#7a766f'], skirt: ['#3c3b3a'], rope: ['#5a5650'], burner: ['#38383a'], basket: ['#8c8881'],
    flame: ['#ffb24e'], pennant: ['#9a4430', '#d8d1c3'], tree: ['#6b6964', '#7a7873'], trunk: ['#55534e'], stone: ['#a8a49c'], bird: ['#36363a'] },
  mat: (f) => ({ roughness: f === 'sky' ? 1 : 0.88, envMapIntensity: f === 'sky' ? 0 : 0.35 }),
  env: [[['#ffe0c0', 1.6, 3, 2, -3, 1.2, 2], ['#c8d4e0', 0.9, 4, 3, 3, 2, 1]], ['#a0a8b0', '#808488', '#404040'], 0.05],
  defs: `vec2 fp(vec3 o, vec3 n) { return abs(n.y) > 0.7 ? o.xz : abs(n.x) > 0.7 ? o.zy : o.xy; }
    // board formwork: boards 0.016 tall; each board its own tone and grain; tie holes on a 0.06 x 0.048 grid; bug holes
    float board(vec2 s) { return floor(s.y / 0.016); }
    float seam(vec2 s) { return aaLine(abs(fract(s.y / 0.016 + 0.5) - 0.5) * 0.016, 0.0005); }
    float tie(vec2 s) { vec2 g = vec2(0.06, 0.048), q = (fract(s / g + vec2(0.5, 0.25)) - 0.5) * g; return 1.0 - smoothstep(0.0016, 0.0024, length(q)); }
    float bug(vec2 s) { vec2 w = wor(s * 260.0); return 1.0 - smoothstep(0.03, 0.09, w.x); }
    float pit(vec2 s) { vec2 q = s * 95.0, w = wor(q); return (1.0 - smoothstep(0.07, 0.15, w.x)) * step(0.45, h21(floor(q + 0.5))); }`,
  color: `{ vec3 c = C0; vec2 s = isF(F_ENV) ? vec2(vUvL.x * MET.x, vUvL.y * MET.y) : isF(F_GROUND) || isF(F_TERRACE) ? vWP.xz : fp(vOP, vON);
    if (isF(F_SKY)) { float t = skyT(vWP); c = mix(C1, C0, smoothstep(0.0, 0.9, t)) * (0.96 + 0.06 * fbm(vWP.xy * vec2(0.4, 1.5))); SKYE = c * 0.95; c *= 0.0; }
    else if (isF(F_GROUND)) { vec2 w = wor(s * 420.0); c = mix(C0, C1, fbm(s * 30.0)) * (0.7 + 0.6 * step(0.82, h21(floor(s * 420.0)))) ; c = mix(c, S(0.55, 0.53, 0.50), smoothstep(0.88, 0.95, h21(floor(s * 900.0))) * 0.6); }
    else if (isF(F_WINDOW) || isF(F_DOOR) || isF(F_SKIRT) || isF(F_BURNER) || isF(F_FLAME)) { }
    else { if (isF(F_ENV) || isF(F_PENNANT)) c = mix(C0, C1, isF(F_ENV) ? gore() : step(0.5, fract(LH * 7.0)));
      float b = board(s), g = fbm(vec2(s.x * 90.0 + h11(b) * 40.0, s.y * 900.0));
      c *= (0.90 + 0.14 * h11(b + LH * 13.0)) * (0.93 + 0.10 * g) * (0.94 + 0.08 * fbm(s * 25.0 + LH * 5.0));
      c *= 1.0 - 0.35 * seam(s) - 0.55 * tie(s) - 0.25 * bug(s) - 0.6 * pit(s); }
    diffuseColor.rgb = c; }`,
  height: `vec2 s = isF(F_ENV) ? uv * MET : isF(F_GROUND) || isF(F_TERRACE) ? w.xz : fp(o, vON); float h = 0.0;
    if (isF(F_GROUND)) return 0.0002 * fbm(s * 300.0);
    if (isF(F_SKY) || isF(F_WINDOW) || isF(F_FLAME)) return 0.0;
    float b = board(s); h += 0.00006 * fbm(vec2(s.x * 90.0 + h11(b) * 40.0, s.y * 900.0)) + 0.00012 * (h11(b + 3.0) - 0.5);
    h -= 0.00045 * seam(s) + 0.0011 * tie(s) + 0.0003 * bug(s) + 0.0012 * pit(s); return h;`,
  rough: `if (!isF(F_SKY)) roughnessFactor = 0.82 + 0.12 * fbm(vWP.xz * 40.0);`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffd8b0'); key.intensity = 3.6; fill.color.set('#a8b8d0'); fill.intensity = 0.45; amb.intensity = 0.16; spot.color.set('#ffb060');
    bloom.strength = 0.05; grade.ex.value = 1.0; grade.vig.value = 0.16; } });
