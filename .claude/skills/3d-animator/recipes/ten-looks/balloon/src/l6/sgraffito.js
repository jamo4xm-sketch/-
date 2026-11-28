// SGRAFFITO. Two coats of lime plaster, red over cream, and the pattern cut through the top coat: ashlar blocks and diamond friezes on the walls,
// a chain of lozenges and dots down every gore of the balloon (alternate gores cream over red), scored dark clay on the roofs and the paving, a muted apricot sky.
import { look } from '../kit6.js';
export const sgraffitoLook = look({ id: 'sgraffito', flare: 0.6,
  T: { sky: ['#c9876a', '#efc3a2'], ground: ['#3a241c', '#d8c4a4'], terrace: ['#a0402e', '#ead8be'], wall: ['#a83a2a', '#ecdcc2'], roof: ['#9a3a24', '#ecdcc2'], chimney: ['#a83a2a', '#ecdcc2'], pot: ['#9a3a24', '#ecdcc2'],
    window: ['#2a1a16'], door: ['#3a2418'], shutter: ['#3a4a3a'], env: ['#b03c2a', '#ecdcc2'], tape: ['#3a2418'], skirt: ['#2a1a16'], rope: ['#c8b08a'], burner: ['#2a2220'], basket: ['#b08a5a'],
    flame: ['#ffb24e'], pennant: ['#b03c2a', '#ecdcc2'], tree: ['#4a5a34', '#5a6a3e'], trunk: ['#3a2a20'], stone: ['#a83a2a', '#ecdcc2'], bird: ['#2a1a16'] },
  mat: (f) => ({ roughness: 0.95, envMapIntensity: f === 'sky' ? 0 : 0.12 }),
  env: [[['#fff0dc', 1.4, 3, 2, -3, 1.2, 2]], ['#e0b8a0', '#806050', '#201410'], 0.06],
  defs: `vec2 fp(vec3 o, vec3 n) { return abs(n.y) > 0.7 ? o.xz : abs(n.x) > 0.7 ? o.zy : o.xy; }
    float CUT = 0.0;
    // the cut pattern (1 = cut through to the under coat), w = line width in metres
    float cutWall(vec2 s) { vec2 b = vec2(s.x / 0.048 + 0.5 * mod(floor(s.y / 0.026), 2.0), s.y / 0.026); vec2 q = (0.5 - abs(fract(b) - 0.5)) * vec2(0.048, 0.026);
      float joint = aaLine(min(q.x, q.y), 0.0026); vec2 l = (fract(b) - 0.5) * vec2(0.048, 0.026); float dia = aaLine(abs(abs(l.x) / 0.024 + abs(l.y) / 0.013 - 0.55) * 0.012, 0.0024);
      return max(joint, dia); }
    float cutGore(vec2 s, float gw) { float y = s.y / 0.05, fy = fract(y) - 0.5, x = s.x; vec2 l = vec2(x / (gw * 0.5), fy * 2.0); float loz = aaLine(abs(abs(l.x) + abs(l.y) - 0.62) * 0.02, 0.0028);
      float dot1 = 1.0 - smoothstep(0.0042, 0.0052, length(vec2(x, (abs(fy) - 0.5) * 0.05))); float edge = aaLine(gw * 0.5 - abs(x), 0.0018); float inner = aaLine(abs(gw * 0.5 - abs(x) - 0.0065), 0.0014);
      return max(max(loz, dot1), max(edge, inner)); }
    float cutOf(vec2 uv, vec3 o, vec3 w) { if (isF(F_ENV) || isF(F_PENNANT)) { float gw = MET.x / 16.0 * sin(3.14159 * clamp(uv.y * 0.98 + 0.05, 0.0, 1.0)) + 0.01; return cutGore(vec2((fract(uv.x * 16.0) - 0.5) * gw, uv.y * MET.y), gw); }
      if (isF(F_ROOF) || isF(F_POT)) return aaLine(abs(fract((abs(o.z) + abs(o.y) * 0.2) / 0.022) - 0.5) * 0.022, 0.0022);
      if (isF(F_GROUND) || isF(F_TERRACE)) { vec2 q = abs(fract(w.xz / vec2(0.06, 0.04)) - 0.5) * vec2(0.06, 0.04); return aaLine(min(0.03 - q.x, 0.02 - q.y), 0.0026); }
      if (isF(F_WALL) || isF(F_STONE) || isF(F_CHIMNEY)) return cutWall(fp(o, vON) + LH * 0.3);
      return 0.0; }`,
  color: `{ vec3 c = C0;
    if (isF(F_SKY)) { float t = skyT(vWP); c = mix(C1, C0, smoothstep(0.0, 0.9, t)) * (0.96 + 0.06 * fbm(vWP.xy * 0.6)); SKYE = c; c *= 0.0; }
    else if (isF(F_WINDOW) || isF(F_FLAME) || isF(F_ROPE) || isF(F_BURNER) || isF(F_SKIRT) || isF(F_BASKET)) { }
    else { vec3 top = C0, und = C1; if (isF(F_ENV) && gore() > 0.5) { top = C1; und = C0; } if (isF(F_PENNANT) && fract(LH * 7.0) > 0.5) { top = C1; und = C0; }
      if (isF(F_GROUND)) und = C1 * 0.8;
      vec2 s = fp(vOP, vON); float lime = 0.9 + 0.12 * fbm(s * 60.0 + LH * 5.0) + 0.05 * vn(s * 500.0);
      CUT = cutOf(vUvL, vOP, vWP); c = mix(top * lime, und * (0.95 + 0.08 * vn(s * 700.0)), CUT); }
    diffuseColor.rgb = c; }`,
  height: `if (isF(F_SKY) || isF(F_WINDOW) || isF(F_FLAME)) return 0.0; return -0.0013 * cutOf(uv, o, w) + 0.00008 * fbm(fp(o, vON) * 90.0);`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffe0c0'); key.intensity = 3.3; fill.color.set('#c8a8a0'); fill.intensity = 0.45; amb.intensity = 0.2; spot.color.set('#ffb060');
    bloom.strength = 0.04; grade.ex.value = 1.0; grade.vig.value = 0.15; } });
