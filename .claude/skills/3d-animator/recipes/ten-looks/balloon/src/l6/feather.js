// FEATHERWORK. Everything is clad in overlapping feathers laid like shingles, tips down: wine-red and dusty rose feathers on the balloon gores, wine-red roofs,
// pale blush walls, each feather with a raised light quill and fine barbs catching a soft sheen, under a charcoal-violet sky, on a ground of dark layered vanes.
import { look } from '../kit6.js';
export const featherLook = look({ id: 'feather', physical: true, flare: 0.6,
  T: { sky: ['#17121f', '#3a2f48'], ground: ['#1c1820', '#2c2632'], terrace: ['#241e2a', '#342c3c'], wall: ['#c98f92', '#dba6a6'], roof: ['#6e1626', '#86202f'], chimney: ['#dcbab4'], pot: ['#6e1626'],
    window: ['#1a1218'], door: ['#3a1a22'], shutter: ['#4a2a3a'], env: ['#7a1628', '#d99aa0'], tape: ['#2a1418'], skirt: ['#2a1418'], rope: ['#c9a27a'], burner: ['#2a2024'], basket: ['#9a7448'],
    flame: ['#ffb24e'], pennant: ['#7a1628', '#d99aa0'], tree: ['#2a3a2a', '#3a4c34'], trunk: ['#3a2a22'], stone: ['#dcbcb6'], bird: ['#1a1218'] },
  mat: (f, d, c0, c1) => ({ roughness: 0.7, sheen: f === 'sky' ? 0 : 1.0, sheenRoughness: 0.35, sheenColor: '#ffd8e0', envMapIntensity: f === 'sky' ? 0 : 0.35 }),
  env: [[['#fff0e8', 1.6, 3, 2, -3, 1.2, 2]], ['#5a4a6a', '#3a3046', '#141018'], 0.05],
  defs: `vec2 fp(vec3 o, vec3 n) { return abs(n.y) > 0.7 ? o.xz : abs(n.x) > 0.7 ? o.zy : o.xy; }
    // shingled feathers, tips down: rows R tall, W wide, alternate rows offset by half; returns (u across -1..1, t 0 tip..1 root, id, 1 = in a gap)
    float FSH = 0.0;   // shadow the feather above casts just below its outline
    float hwOf(float t) { return 0.62 * pow(clamp(t, 0.0, 1.0), 0.62) * (1.0 - 0.28 * t * t); }
    vec4 fea(vec2 s, float W, float R) { float r0 = floor(s.y / R); FSH = 0.0;
      for (int k = 1; k >= 0; k--) { float r = r0 + float(k), off = mod(r, 2.0) * 0.5, cx = floor(s.x / W + off), u = s.x / W + off - cx - 0.5, v = s.y / R - r, t = (v + 0.85) / 1.85;
        float hw = hwOf(t); if (t >= 0.0 && t <= 1.0 && abs(u) < hw) return vec4(u / hw, t, h21(vec2(r, cx)), 0.0);
        if (k == 1) { float dd = max(abs(u) - hwOf(max(t, 0.0)), -t * 1.85 * R / W); FSH = max(FSH, 1.0 - smoothstep(0.0, 0.16, dd)); } }
      return vec4(0.0, 0.5, 0.0, 1.0); }
    vec2 FS() { return isF(F_ENV) ? vec2(0.034, 0.040) : isF(F_ROOF) ? vec2(0.028, 0.033) : vec2(0.022, 0.026); }
    vec2 sOf(vec2 uv, vec3 o, vec3 w) { return isF(F_ENV) || isF(F_PENNANT) ? uv * MET : isF(F_GROUND) || isF(F_TERRACE) ? vec2(w.x, -w.z) : fp(o, vON); }`,
  color: `{ vec3 c = C0;
    if (isF(F_SKY)) { float t = skyT(vWP); c = mix(C1, C0, smoothstep(0.0, 0.9, t)) * (0.94 + 0.08 * fbm(vWP.xy * 0.7)); SKYE = c; c *= 0.0; }
    else if (isF(F_WINDOW) || isF(F_FLAME) || isF(F_BURNER) || isF(F_ROPE) || isF(F_BASKET) || isF(F_TRUNK)) { }
    else { if (isF(F_ENV)) c = mix(C0, C1, gore()); if (isF(F_PENNANT)) c = mix(C0, C1, step(0.5, fract(LH * 7.0)));
      vec2 fs = FS(), s = sOf(vUvL, vOP, vWP); vec4 f = fea(s, fs.x, fs.y);
      if (f.w > 0.5) c *= 0.25; else {
        c *= 0.75 + 0.45 * f.z; float barb = 0.5 + 0.5 * sin((f.y * 22.0 - abs(f.x) * 3.2) * 6.2832);
        c *= (0.68 + 0.32 * barb) * (0.45 + 0.55 * smoothstep(1.0, 0.5, f.y));
        c = mix(c, c * 1.5 + 0.04, smoothstep(0.7, 0.95, abs(f.x)) * smoothstep(0.0, 0.5, f.y));   // the soft light fringe
        c = mix(c, vec3(1.0, 0.92, 0.86), 0.85 * aaLine(abs(f.x) * fs.x * 0.5, 0.0009) * step(0.06, f.y)); c *= 1.0 - 0.55 * FSH; } }
    diffuseColor.rgb = c; }`,
  height: `if (isF(F_SKY) || isF(F_WINDOW) || isF(F_FLAME)) return 0.0; vec2 fs = FS(); vec4 f = fea(sOf(uv, o, w), fs.x, fs.y);
    if (f.w > 0.5) return -0.0006; return -0.0005 * FSH + 0.0014 * (1.0 - f.y) * (1.0 - f.x * f.x) + 0.00025 * (1.0 - smoothstep(0.0, 0.1, abs(f.x))) + 0.00005 * sin((f.y * 22.0 - abs(f.x) * 3.2) * 6.2832);`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffe6d8'); key.intensity = 2.8; fill.color.set('#9a88c0'); fill.intensity = 0.5; amb.intensity = 0.2; spot.color.set('#ffb060');
    bloom.strength = 0.06; grade.ex.value = 1.05; grade.vig.value = 0.22; } });
