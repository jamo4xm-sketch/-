// PAPER LANTERN. The whole town is lantern paper lit from inside: warm paper walls in dark wooden frames, vermilion paper roofs with ribs along the slope,
// the balloon a pleated vermilion and gold paper lantern on dark ribs that blazes each time the burner fires, under a deep petrol dusk sky, on rough slate terraces.
import { look } from '../kit6.js';
export const lanternLook = look({ id: 'lantern', flare: 0.35, burn: 1.6,
  T: { sky: ['#041a22', '#0f3a44'], ground: ['#24272b', '#353a40'], terrace: ['#2c3035', '#41474e'], wall: ['#f0c27e', '#ffd896'], roof: ['#c2361e', '#d8482a'], chimney: ['#efbd78'], pot: ['#c2361e'],
    window: ['#ffd480'], door: ['#2e1c10'], shutter: ['#26160c'], env: ['#d8321a', '#f0aa3e'], tape: ['#22140a'], skirt: ['#22140a'], rope: ['#22140a'], burner: ['#16110c'], basket: ['#4a2e18', '#64401f'],
    flame: ['#ffb24e'], pennant: ['#d8321a', '#f0aa3e'], tree: ['#071c1a', '#0d2a26'], trunk: ['#140e0a'], stone: ['#ecc283'], bird: ['#06161a'] },
  mat: (f) => ({ roughness: f === 'ground' || f === 'terrace' ? 0.7 : 0.92, envMapIntensity: f === 'ground' || f === 'terrace' ? 0.5 : 0.1 }),
  env: [[['#ffb060', 1.4, 3, 2, 0, 0.3, 3]], ['#08262e', '#0a1e24', '#101010'], 0.05],
  defs: `float paper(vec2 s) { return 0.7 * fbm(s * 80.0) + 0.3 * vn(s * 420.0); }
    float GLOW = 0.0; vec3 GC = vec3(0.0);`,
  color: `{ vec3 c = C0; vec2 f2 = tri(vOP, vON);
    if (isF(F_SKY)) { float t = skyT(vWP); c = mix(C1, C0, smoothstep(0.0, 0.85, t)) * (0.95 + 0.08 * fbm(vWP.xy * 0.8)); SKYE = c; c *= 0.0; }
    else if (isF(F_ENV)) { vec2 m = vUvL * MET; c = mix(C0, C1, gore()); float rib = max(ribs(m.y, 0.030, 0.0013), aaLine(goreSeam(), 0.0011));
      float pan = sin(3.14159 * fract(m.y / 0.030)); GLOW = (0.5 + 0.5 * pan) * (0.85 + 0.3 * paper(m)) * (1.0 - rib) * (FLW > 0.5 ? 0.75 + 1.5 * FLARE : 0.85) * (0.75 + 0.5 * smoothstep(0.55, 0.0, vUvL.y));
      GC = c; c = mix(c * 0.25, S(0.07, 0.04, 0.025), rib); }
    else if (isF(F_WALL) || isF(F_STONE) || isF(F_CHIMNEY)) { float rib = max(ribs(f2.x, 0.07, 0.0022), ribs(f2.y, isF(F_CHIMNEY) ? 0.022 : 0.055, 0.0018));
      GLOW = (0.45 + 0.75 * LH * LH) * (1.0 - rib) * (0.85 + 0.3 * paper(f2)) * (isF(F_CHIMNEY) ? 0.8 : 1.0); GC = mix(C0, C1, LH); c = mix(GC * 0.25, S(0.10, 0.06, 0.035), rib); }
    else if (isF(F_ROOF) || isF(F_POT)) { float rib = ribs(abs(vOP.z) + abs(vOP.y) * 0.2, 0.020, 0.0016); GLOW = 0.30 * (0.7 + 0.5 * LH) * (1.0 - rib) * (0.85 + 0.3 * paper(f2)); GC = mix(C0, C1, LH);
      c = mix(GC * 0.3, S(0.09, 0.03, 0.02), rib); }
    else if (isF(F_WINDOW)) { GLOW = 1.5; GC = C0; c = C0 * 0.2; }
    else if (isF(F_PENNANT)) { GLOW = 0.9; GC = mix(C0, C1, step(0.5, fract(LH * 7.0))); c = GC * 0.3; }
    else if (isF(F_GROUND) || isF(F_TERRACE)) { vec2 w = wor(vWP.xz * 16.0 + vWP.y * 9.0); float e = smoothstep(0.0, 0.06, w.y - w.x); c = mix(C0, C1, h21(floor(vWP.xz * 16.0)) * 0.6 + 0.4 * fbm(vWP.xz * 60.0)) * (0.35 + 0.65 * e); }
    else if (isF(F_BASKET)) { c = mix(C0, C1, step(0.5, fract((vOP.x + vOP.z) * 160.0 + step(0.5, fract(vOP.y * 140.0)) * 0.5))); }
    diffuseColor.rgb = c; }`,
  height: `float h = 0.0;
    if (isF(F_ENV)) { vec2 m = uv * MET; h = 0.0011 * sin(3.14159 * fract(m.y / 0.030)) + 0.00012 * sin(uv.x * 16.0 * 6.2832 * 7.0); }
    if (isF(F_ROOF)) h = 0.0004 * sin(3.14159 * fract((abs(o.z) + abs(o.y) * 0.2) / 0.020));
    if (isF(F_GROUND) || isF(F_TERRACE)) { vec2 q = wor(w.xz * 16.0 + w.y * 9.0); h = 0.0006 * smoothstep(0.0, 0.06, q.y - q.x) + 0.0002 * fbm(w.xz * 90.0); }
    return h;`,
  emis: `totalEmissiveRadiance += GC * GLOW * 1.0;`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffb070'); key.intensity = 0.55; fill.color.set('#2a6a78'); fill.intensity = 0.35; amb.intensity = 0.1; spot.color.set('#ffa040');
    bloom.strength = 0.38; bloom.threshold = 0.85; bloom.radius = 0.5; grade.ex.value = 1.0; grade.vig.value = 0.28; } });
