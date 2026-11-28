// DENIM. The town is sewn from denim: broad indigo panels in a coarse visible twill, raised double rows of ochre topstitching on every seam, faded fold lines
// and pale worn edges, copper rivets at the panel corners; the balloon alternates rinse and stone-wash panels, under an ink-blue sky, on dark twill terraces.
import { look } from '../kit6.js';
export const denimLook = look({ id: 'denim', physical: true, flare: 0.7,
  T: { sky: ['#08112a', '#1d2d58'], ground: ['#131a2e', '#1f2944'], terrace: ['#1b2442', '#29365e'], wall: ['#7f9bc6', '#a3badc'], roof: ['#1f3268', '#2c4382'], chimney: ['#6a87b4'], pot: ['#9a6434'],
    window: ['#0d1326'], door: ['#6a4426'], shutter: ['#26386e'], env: ['#132456', '#b2c6e2'], tape: ['#d29a34'], skirt: ['#5e3c20'], rope: ['#d29a34'], burner: ['#7a4a2a'], basket: ['#8a5a30', '#a06c3a'],
    flame: ['#ffb24e'], pennant: ['#d29a34', '#1c3170'], tree: ['#1e3a3c', '#2a4c4c'], trunk: ['#5e3c20'], stone: ['#7590bd'], bird: ['#0d1326'] },
  mat: (f, d, c0, c1) => ({ roughness: 0.92, sheen: f === 'sky' ? 0 : 0.6, sheenRoughness: 0.6, sheenColor: '#b8c8e8', envMapIntensity: f === 'sky' ? 0 : 0.25 }),
  env: [[['#fff0dc', 1.8, 3, 2, -3, 1.2, 2]], ['#3a4a70', '#24304c', '#101420'], 0.05],
  defs: `vec2 fp(vec3 o, vec3 n) { return abs(n.y) > 0.7 ? o.xz : abs(n.x) > 0.7 ? o.zy : o.xy; }
    vec2 PS = vec2(0.13, 0.085);   // panel size
    vec2 dS(vec2 s) { vec2 q = abs(fract(s / PS) - 0.5) * PS; return 0.5 * PS - q; }   // distance to the panel seams in x and y
    float twill(vec2 s) { return smoothstep(0.32, 0.68, 0.5 + 0.5 * sin((s.x * 0.55 + s.y) * 6.2832 / 0.0105 + 0.6 * vn(s * vec2(60.0, 700.0)))); }
    float stitch(float d, float along) { float row = aaLine(abs(d - 0.0045), 0.0007) + aaLine(abs(d - 0.0075), 0.0007); return row * step(0.35, fract(along / 0.0042)); }
    float fold(vec2 s) { return smoothstep(0.62, 0.8, fbm(vec2(s.x * 18.0 + s.y * 4.0, s.y * 3.0))); }`,
  color: `{ vec3 c = C0; vec2 s = isF(F_ENV) ? vUvL * MET : isF(F_GROUND) || isF(F_TERRACE) ? vWP.xz : fp(vOP, vON);
    if (isF(F_SKY)) { float t = skyT(vWP); c = mix(C1, C0, smoothstep(0.0, 0.85, t)) * (0.94 + 0.08 * fbm(vWP.xy * 0.7)); SKYE = c; c *= 0.0; }
    else if (isF(F_WINDOW) || isF(F_FLAME) || isF(F_BURNER)) { }
    else if (isF(F_TAPE) || isF(F_ROPE)) { c *= 0.85 + 0.3 * step(0.5, fract(vUvL.y * 300.0)); }
    else if (isF(F_SKIRT) || isF(F_BASKET) || isF(F_DOOR) || isF(F_POT) || isF(F_TRUNK)) { c *= 0.85 + 0.2 * fbm(s * 200.0); }   // leather
    else { if (isF(F_ENV)) c = mix(C0, C1, gore()); if (isF(F_WALL)) c = mix(C0, C1, LH); if (isF(F_PENNANT)) c = mix(C0, C1, step(0.5, fract(LH * 7.0)));
      vec2 d = dS(s); float dm = isF(F_ENV) ? goreSeam() : d.x, along = s.y;
      float tw = twill(s), slub = fbm(vec2(s.x * 40.0, s.y * 900.0));
      c = mix(c * 0.55, c * 1.45 + 0.09, tw) * (0.9 + 0.2 * slub); c = mix(c, vec3(0.85, 0.88, 0.95), 0.25 * step(0.86, vn(s * vec2(900.0, 260.0))) * (1.0 - tw));
      c = mix(c, c * 1.55 + 0.06, 0.55 * fold(s + LH));   // faded folds
      c = mix(c, c * 1.6 + 0.08, 0.6 * (1.0 - smoothstep(0.0, 0.006, dm)));   // worn at the seams
      c = mix(c, C1 * 0.25, aaLine(dm, 0.0009));
      c = mix(c, S(0.82, 0.58, 0.18), stitch(dm, along));
      float rv = 1.0 - smoothstep(0.0022, 0.003, length(d - 0.009)); }
    diffuseColor.rgb = c; }`,
  height: `vec2 s = isF(F_ENV) ? uv * MET : isF(F_GROUND) || isF(F_TERRACE) ? w.xz : fp(o, vON);
    if (isF(F_SKY) || isF(F_WINDOW) || isF(F_FLAME) || isF(F_TAPE) || isF(F_ROPE)) return 0.0;
    vec2 d = dS(s); float dm = isF(F_ENV) ? goreSeam() : d.x, along = s.y;
    float h = 0.00016 * twill(s) - 0.0005 * aaLine(dm, 0.0012) + 0.00035 * smoothstep(0.0, 0.004, dm) * (1.0 - smoothstep(0.006, 0.012, dm)) + 0.00012 * stitch(dm, along);
    return h;`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffe6c8'); key.intensity = 3.0; fill.color.set('#6a80c0'); fill.intensity = 0.5; amb.intensity = 0.2; spot.color.set('#ffb060');
    bloom.strength = 0.06; grade.ex.value = 1.05; grade.vig.value = 0.2; } });
