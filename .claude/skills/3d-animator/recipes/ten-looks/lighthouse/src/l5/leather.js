// TOOLED LEATHER. Vegetable-tanned leather carved with a swivel knife: bevelled borders on the stripes, a basketweave stamp on the tower and walls,
// carved ledges on the saddle-brown cliffs, carved wave lines on the dark indigo sea, a smoked umber sky. Pebbled grain everywhere, darker where the tool pressed.
import { look } from '../kit5.js';
export const leatherLook = look({ id: 'leath', physical: true,
  T: { sky: ['#0b0603', '#2c190b'], ridge: ['#2a1c12', '#3a2818'], water: ['#1d2a55', '#2a3a70'], foam: ['#e2cfae', '#efdfc2'], cliff: ['#5a3216', '#7a4420'], rock: ['#663818', '#86491f'], grass: ['#4d4a1e', '#5e5a26'], stone: ['#7a5a3a', '#8a6a46'],
    tower: ['#b47c45', '#d39a5c'], red: ['#58160f', '#701f16'], door: ['#3a2214', '#4a2c1a'], window: ['#140c08'], iron: ['#2a1a10', '#3a2416'], glass: ['#140e0a'], house: ['#b07842', '#cc955a'], roof: ['#4a2a16', '#5e3820'],
    hull: ['#1c2442', '#283358'], cabin: ['#c28a50', '#d6a060'], wood: ['#5a3418'], gull: ['#e2cfae'] },
  mat: (f) => ({ roughness: 0.55, sheen: f === 'sky' ? 0 : 0.4, sheenRoughness: 0.4, envMapIntensity: f === 'sky' ? 0 : 0.6 }),
  env: [[['#ffe2c0', 4, 3.0, 1.0, -2.6, 2.6, 2.6], ['#fff0d8', 2, 0.6, 3.0, 3.0, 1.2, 2.4]], ['#2a1c12', '#3a2818', '#120c08'], 0.03],
  beam: ['#ffd9a0', 0.3, 1.5], lamp: ['#ffd890', 4],
  defs: `float grain(vec2 s) { vec2 a = wor(s * 520.0); return a.y - a.x; }
    float stitch(vec2 s, float e) { float x = s.x + (e - 0.0095) * 0.7; return step(fract(x / 0.0085), 0.6) * (1.0 - smoothstep(0.0009, 0.0015, abs(e - 0.0095))); }
    float toolH(vec3 o, vec2 uv, vec3 w) { vec2 s = uv * MET; float h = 0.0;
      if ((isF(F_TOWER) || isF(F_HOUSE) || isF(F_CABIN)) && BAND < 0.5) { vec2 g = s / 0.026, id = floor(g), f = fract(g); bool hz = mod(id.x + id.y, 2.0) < 0.5; float q = hz ? f.y : f.x, r = hz ? f.x : f.y, l = abs(fract(q * 3.0) - 0.5);
        h = -0.00030 * (1.0 - smoothstep(0.06, 0.16, l)) * smoothstep(0.03, 0.14, r) * smoothstep(0.97, 0.86, r) - 0.0004 * (1.0 - smoothstep(0.0, 0.05, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)))); }
      if (BAND > 0.5) { float e = min(s.y, MET.y - s.y); h = 0.0008 * bev(e - 0.0045) + 0.0003 * stitch(s, e); }
      if (isF(F_CLIFF) || isF(F_ROCK) || isF(F_STONE)) { float y = w.y / 0.032 + 0.35 * fbm(w.xz * 8.0); h = 0.0010 * bev(fract(y) * 0.032 - 0.002); }
      if (isF(F_WATER)) { float y = (w.z + 0.012 * sin(w.x * 22.0 + 2.0 * sin(w.z * 9.0))) / 0.04; h = 0.0007 * bev(fract(y) * 0.04 - 0.003); }
      if (isF(F_ROOF)) { h = 0.0005 * bev(fract(s.x / 0.012) * 0.012 - 0.0015); }
      return h; }`,
  color: `{ vec2 s = vUvL * MET; float h = toolH(vOP, vUvL, vWP), gr = grain(isF(F_SKY) ? vWP.xy * 0.2 : isF(F_WATER) || isF(F_CLIFF) ? vWP.xz : s);
    vec3 c = mix(C0, C1, 0.55 * fbm(s * 25.0 + LH * 7.0)) * (0.88 + 0.14 * gr); c *= 1.0 - 0.5 * smoothstep(0.0, -0.0007, h); c *= 0.62 + 0.38 * pow(abs(dot(normalize(vWN), normalize(cameraPosition - vWP))), 0.6);
    if (BAND > 0.5) { vec2 m = vUvL * MET; c = mix(c, S(0.86, 0.80, 0.66), stitch(m, min(m.y, MET.y - m.y))); }
    if (isF(F_SKY)) { vec3 k = mix(C1, C0, smoothstep(0.0, 0.85, skyT(vWP))) * (0.86 + 0.22 * fbm(vWP.xy * vec2(1.5, 4.0))) * (0.92 + 0.1 * gr); SKYE = k * 0.6; c = k * 0.2; }
    diffuseColor.rgb = c; }`,
  rough: 'roughnessFactor = isF(F_SKY) ? 1.0 : isF(F_GLASS) || isF(F_WINDOW) ? 0.25 : 0.58 - 0.18 * smoothstep(0.0, -0.0007, toolH(vOP, vUvL, vWP));',
  height: `vec2 s = isF(F_WATER) || isF(F_CLIFF) ? w.xz : isF(F_SKY) ? w.xy * 0.2 : uv * MET; return toolH(o, uv, w) - 0.00005 * grain(s);`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffcf98'); key.intensity = 3.1; fill.color.set('#7080a0'); fill.intensity = 0.28; amb.intensity = 0.12; spot.color.set('#ffd8a0'); spot.intensity = 4; bloom.strength = 0.12; grade.ex.value = 1.05; grade.vig.value = 0.2; } });
