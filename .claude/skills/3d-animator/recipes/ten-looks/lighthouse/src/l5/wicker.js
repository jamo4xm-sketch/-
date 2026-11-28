// WICKER. A woven basket world: reed weavers going over and under the stakes round the tower, cottage and boat, red-dyed reed for the stripes,
// the rocks and cliffs built from chunky coils of rope, dark blue-dyed weave for the water, a storm-blue sky.
import { look } from '../kit5.js';
export const wickerLook = look({ id: 'wick',
  T: { sky: ['#1e2a3a', '#56687d'], ridge: ['#2a3444', '#36404e'], water: ['#16222e', '#243446'], foam: ['#e6dcc2', '#f2ead4'], cliff: ['#5a4a36', '#76624a'], rock: ['#544432', '#6e5a42'], grass: ['#5e6a32', '#76843e'], stone: ['#7a6a52'],
    tower: ['#c4985a', '#dcb276'], red: ['#8a2a1c', '#a43624'], door: ['#4a3420', '#5a4028'], window: ['#1a140e'], iron: ['#3a2c1e', '#4a3826'], glass: ['#2a2218'], house: ['#c09458', '#d8ae72'], roof: ['#6a4a2a', '#7e5a34'],
    hull: ['#2c4462', '#3a5678'], cabin: ['#c8a064', '#dcb67a'], wood: ['#7a5a34'], gull: ['#ece4d2'] },
  mat: (f) => ({ roughness: 0.72, envMapIntensity: f === 'sky' ? 0 : 0.4 }),
  env: [[['#ffe8cc', 3, 3.0, 1.0, -2.6, 2.6, 2.6], ['#d8e4ff', 1.5, 0.6, 3.0, 3.0, 1.2, 2.4]], ['#56687d', '#36404e', '#14181e'], 0.04],
  beam: ['#fff0cc', 0.3, 1.5], lamp: ['#ffd890', 4],
  defs: `float WP; vec3 WC;
    vec4 weave(vec2 s, float W) { float SP = W * 2.4, row = floor(s.y / W), fy = fract(s.y / W), x = s.x / SP + 0.5 * mod(row, 2.0), col = floor(x), fx = fract(x);
      bool front = mod(col + row, 2.0) < 0.5; float sx = abs(fx - 0.5) * SP, sw = W * 0.36;   // the stake: upright, sw wide, in front on every other crossing
      float wp = sqrt(max(0.0, 1.0 - pow(2.0 * fy - 1.0, 2.0) * 1.06)), bul = front ? 0.55 + 0.45 * smoothstep(sw, SP * 0.5, sx) : 1.0;
      if (front && sx < sw) { float sp = sqrt(max(0.0, 1.0 - pow(sx / sw, 2.0))); return vec4(sp * W * 0.5, sp, h11(col * 2.7 + 50.0) * 0.6, 0.8 + 0.2 * vn(vec2(sx / W * 4.0, s.y / W * 3.0))); }
      return vec4(wp * bul * W * 0.42, wp * bul, h11(row * 1.3), 0.82 + 0.28 * vn(vec2(s.x / W * 7.0, fy * 5.0 + row))); }
    vec4 rope(float y, float x, float P) { float g = y / P, id = floor(g), f = fract(g); float prof = sqrt(max(0.0, 1.0 - pow(2.0 * f - 1.0, 2.0))); float tw = fract(x / P * 1.4 + f * 1.1);
      float st = 0.7 + 0.3 * smoothstep(0.0, 0.25, tw) * smoothstep(1.0, 0.75, tw); return vec4(prof * st * P * 0.42, prof * st, h11(id), 0.85 + 0.2 * vn(vec2(x / P * 6.0, f * 4.0))); }
    vec4 wk(vec3 o, vec2 uv, vec3 w) {
      if (isF(F_ROCK) || isF(F_STONE)) return rope(o.y, atan(o.z, o.x) * length(o.xz), 0.0085);
      if (isF(F_CLIFF)) return rope(w.y + 0.004 * sin(w.x * 30.0), w.x + w.z, 0.012);
      if (isF(F_WATER)) return weave(w.xz, 0.03);
      if (isF(F_SKY) || isF(F_RIDGE)) return vec4(0.0, 1.0, 0.5, 1.0);
      if (isF(F_GRASS)) return weave(w.xz, 0.014);
      if (isF(F_FOAM) || isF(F_SPRAY) || isF(F_GULL)) return rope(o.y, atan(o.z, o.x), 0.004);
      return weave(uv * MET, 0.0135); }`,
  color: `{ vec4 k = wk(vOP, vUvL, vWP); vec3 c = mix(C0, C1, k.z) * k.w; c *= 0.3 + 0.7 * smoothstep(0.0, 0.45, k.y);
    if (isF(F_SKY)) { c = mix(C1, C0, smoothstep(0.0, 0.85, skyT(vWP))) * (0.9 + 0.16 * fbm(vWP.xy * vec2(0.8, 2.5))); SKYE = c * 0.7; c *= 0.3; }
    diffuseColor.rgb = c; }`,
  height: 'return wk(o, uv, w).x;',
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffe2b8'); key.intensity = 2.9; fill.color.set('#6a7a9a'); fill.intensity = 0.35; amb.intensity = 0.15; spot.color.set('#fff0cc'); spot.intensity = 3.5; bloom.strength = 0.1; grade.ex.value = 1.0; grade.vig.value = 0.18; } });
