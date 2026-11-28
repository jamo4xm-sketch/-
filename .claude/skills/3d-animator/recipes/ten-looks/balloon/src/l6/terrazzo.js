// TERRAZZO. Poured and polished terrazzo: large cream, oxblood, grey and black chips set in a tinted matrix, ground flat and finished satin so every rounded edge
// catches a soft highlight. The balloon alternates cream gores with oxblood chips and oxblood gores with cream chips, under a dusty rose sky, on charcoal terrazzo steps.
import { look } from '../kit6.js';
export const terrazzoLook = look({ id: 'terrazzo', physical: true, flare: 0.6,
  T: { sky: ['#b98a8e', '#e3c3bf'], ground: ['#2a2a2c', '#3a3a3e'], terrace: ['#323236', '#424246'], wall: ['#eadfd2', '#f1e7dc'], roof: ['#a24a3c', '#b45a48'], chimney: ['#e6dacb'], pot: ['#7a2a26'],
    window: ['#2a2224'], door: ['#5a2e28'], shutter: ['#6f8a82'], env: ['#efe6d8', '#7a2328'], tape: ['#cdbfae'], skirt: ['#2a2224'], rope: ['#bfae98'], burner: ['#2a2628'], basket: ['#c9a67a'],
    flame: ['#ffb24e'], pennant: ['#7a2328', '#efe6d8'], tree: ['#56705e', '#678270'], trunk: ['#5a4a42'], stone: ['#e2d6c6'], bird: ['#2a2224'] },
  mat: (f) => ({ roughness: f === 'sky' ? 1 : 0.32, clearcoat: f === 'sky' ? 0 : 0.35, clearcoatRoughness: 0.3, envMapIntensity: f === 'sky' ? 0 : 0.7 }),
  env: [[['#fff2e8', 2.2, 3, 2, -3, 1.4, 2], ['#f0d8dc', 1.0, 4, 3, 3, 2, 1]], ['#e0c8c8', '#a08c8c', '#3a3030'], 0.04],
  defs: `vec2 fp(vec3 o, vec3 n) { return abs(n.y) > 0.7 ? o.xz : abs(n.x) > 0.7 ? o.zy : o.xy; }
    vec3 CREAM = vec3(0.0), OX = vec3(0.0);
    // big chips over small chips over the matrix; colour by the chip id
    vec3 chipCol(float id, vec3 mat, bool dark) { vec3 a = dark ? S(0.93, 0.89, 0.82) : S(0.42, 0.10, 0.11), b = S(0.62, 0.60, 0.58), k = S(0.10, 0.10, 0.11), w = dark ? S(0.55, 0.16, 0.16) : S(0.97, 0.94, 0.88);
      return id < 0.55 ? a : id < 0.78 ? b : id < 0.88 ? k : w; }
    // chips are round-ish blobs inside their voronoi cells (about a third of the area), small ones between; they fade to the mean where they would alias
    vec3 terr(vec2 s, vec3 mat, bool dark) { vec3 c = mat * (0.95 + 0.08 * vn(s * 900.0)); float fw = fwidth(s.x) + fwidth(s.y);
      vec3 v2 = vor(s * 140.0 + 13.0); if (h11(v2.z * 3.0) > 0.4 && v2.y - v2.x > 0.30 + 0.2 * h11(v2.z * 7.0)) c = chipCol(v2.z, mat, dark) * (0.9 + 0.15 * h11(v2.z * 31.0));
      vec3 v = vor(s * 36.0); if (h11(v.z * 5.0) > 0.1 && v.y - v.x > 0.10 + 0.22 * h11(v.z * 11.0)) c = chipCol(v.z, mat, dark) * (0.9 + 0.15 * h11(v.z * 17.0)) * (0.94 + 0.08 * vn(s * 600.0));
      vec3 mean = mix(mat, chipCol(0.2, mat, dark), 0.25); return mix(c, mean, smoothstep(0.0025, 0.008, fw)); }`,
  color: `{ vec3 c = C0; vec2 s = isF(F_ENV) || isF(F_PENNANT) ? vUvL * MET : isF(F_GROUND) || isF(F_TERRACE) ? vWP.xz : fp(vOP, vON) + LH * 3.0;
    if (isF(F_SKY)) { float t = skyT(vWP); c = mix(C1, C0, smoothstep(0.0, 0.9, t)) * (0.96 + 0.06 * fbm(vWP.xy * 0.6)); SKYE = c; c *= 0.0; }
    else if (isF(F_WINDOW) || isF(F_FLAME) || isF(F_ROPE) || isF(F_SKIRT) || isF(F_BURNER)) { }
    else { bool dark = false; if (isF(F_ENV)) { dark = gore() > 0.5; c = dark ? C1 : C0; } if (isF(F_PENNANT)) { dark = fract(LH * 7.0) > 0.5; c = dark ? C0 : C1; }
      if (isF(F_ROOF) || isF(F_POT) || isF(F_DOOR) || isF(F_GROUND) || isF(F_TERRACE)) dark = true;
      c = terr(s, c, dark);
      if (isF(F_GROUND) || isF(F_TERRACE)) { vec2 g = abs(fract(vWP.xz / 0.08) - 0.5) * 0.08; c *= 1.0 - 0.5 * aaLine(0.04 - max(g.x, g.y), 0.0008); } }
    diffuseColor.rgb = c; }`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#fff0e2'); key.intensity = 2.8; fill.color.set('#e0b8c0'); fill.intensity = 0.55; amb.intensity = 0.22; spot.color.set('#ffb060');
    bloom.strength = 0.06; grade.ex.value = 1.0; grade.vig.value = 0.14; } });
