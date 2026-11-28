// MARBLE. Carved and honed marble: thick burgundy veins run through the stone in three dimensions, so they wrap the cream envelope and turn the corners
// of the carved walls; the balloon alternates cream and rosso gores, the shutters are verde antico, the paving honed wine-red stone, the sky a soft lilac.
import { look } from '../kit6.js';
export const marbleLook = look({ id: 'marble', physical: true, flare: 0.8,
  T: { sky: ['#a995c0', '#e0d2ea'], ground: ['#561c24', '#74303a'], terrace: ['#64242c', '#82383f'], wall: ['#efe7da', '#f7f1e8'], roof: ['#e3d6c6', '#ece1d2'], chimney: ['#e9e1d3'], pot: ['#62202a'],
    window: ['#221418'], door: ['#3a1c22'], shutter: ['#3c6a5a'], env: ['#efe7da', '#8a2830'], tape: ['#d9cbb2'], skirt: ['#221418'], rope: ['#cdbd9c'], burner: ['#2a2024'], basket: ['#d9cbb2'],
    flame: ['#ffb24e'], pennant: ['#8a2830', '#efe7da'], tree: ['#3c6a5a', '#4c7c6a'], trunk: ['#5a4a42'], stone: ['#e6ded0'], bird: ['#221418'] },
  mat: (f) => ({ roughness: f === 'ground' || f === 'terrace' ? 0.42 : 0.22, clearcoat: f === 'sky' ? 0 : 1.0, clearcoatRoughness: 0.06, envMapIntensity: f === 'sky' ? 0 : 0.9 }),
  env: [[['#fff2e4', 2.4, 3, 2, -3, 1.4, 2], ['#e8dcf4', 1.2, 4, 3, 3, 2, 1]], ['#d8cce4', '#a898b4', '#4a3a40'], 0.03],
  defs: `// veins: a turbulent sine through 3D noise; thick primaries and thin secondaries. p in object metres.
    float vd(vec3 p, float sc, float per) { float t = p.x * 0.8 + p.y * 1.3 + p.z * 0.5 + 0.16 * fbm3(p * sc * 0.6) + 0.012 * fbm3(p * sc * 3.1); return abs(fract(t / per) - 0.5) * per; }
    // a thick soft-edged primary vein with a stained halo, and a thin secondary network
    float veins(vec3 p) { float d = vd(p, 8.0, 0.17), w = 0.0035 + 0.006 * fbm3(p * 22.0) * fbm3(p * 9.0 + 4.0); float core = aaLine(d, w) * (0.6 + 0.4 * fbm3(p * 60.0)), halo = (1.0 - smoothstep(0.0, w + 0.035, d)) * 0.42 * smoothstep(0.3, 0.7, fbm3(p * 18.0 + 1.0));
      float d2 = vd(p.zxy * 1.6 + 3.1, 9.0, 0.13), d3 = vd(p * 1.1 + 0.07, 8.0, 0.17); return max(max(core, halo), max(0.35 * aaLine(d2, 0.0012), 0.45 * aaLine(abs(d3 - 0.012), 0.0010))); }
    float clouds(vec3 p) { return fbm3(p * 22.0); }`,
  color: `{ vec3 c = C0; vec3 p = (isF(F_GROUND) || isF(F_TERRACE)) ? vWP : vOP + LH * 3.7;
    if (isF(F_SKY)) { float t = skyT(vWP); c = mix(C1, C0, smoothstep(0.0, 0.9, t)) * (0.96 + 0.06 * fbm(vWP.xy * 0.6)); SKYE = c; c *= 0.0; }
    else if (isF(F_WINDOW) || isF(F_FLAME)) { }
    else { bool dark = false; if (isF(F_ENV)) { dark = gore() > 0.5; c = dark ? C1 : C0; } if (isF(F_PENNANT)) { dark = fract(LH * 7.0) > 0.5; c = dark ? C0 : C1; }
      if (isF(F_GROUND) || isF(F_TERRACE) || isF(F_POT)) dark = true;
      vec3 vc = dark ? S(0.93, 0.88, 0.84) : S(0.44, 0.09, 0.16);
      c *= 0.86 + 0.2 * clouds(p) * clouds(p * 0.37 + 1.7); float v = veins(p); c = mix(c, vc, v * (dark ? 0.7 : 0.9));
      if (isF(F_GROUND) || isF(F_TERRACE)) { vec2 g = abs(fract(vWP.xz / vec2(0.09, 0.06)) - 0.5) * vec2(0.09, 0.06); c *= 1.0 - 0.4 * aaLine(min(0.045 - g.x, 0.03 - g.y), 0.0006); } }
    diffuseColor.rgb = c; }`,
  emis: `if (isF(F_WALL) || isF(F_STONE) || isF(F_CHIMNEY) || (isF(F_ENV) && gore() < 0.5)) totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.85, 0.75) * 0.05;`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#fff0e0'); key.intensity = 2.9; fill.color.set('#c0b0e0'); fill.intensity = 0.6; amb.intensity = 0.22; spot.color.set('#ffb060');
    bloom.strength = 0.08; bloom.threshold = 0.95; grade.ex.value = 1.0; grade.vig.value = 0.14; } });
