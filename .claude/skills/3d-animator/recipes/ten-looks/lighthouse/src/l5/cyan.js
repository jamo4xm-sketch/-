// CYANOTYPE. A sun print: the scene's light exposed onto cotton paper coated in iron salts. Dark parts print deep Prussian blue, the light parts stay paper white,
// and the bright things (lantern, beam, surf) bleed a soft white halo into the blue. Paper fibres and an uneven brushed coating show through.
import { look } from '../kit5.js';
export const cyanLook = look({ id: 'cyan',
  T: { sky: ['#000000'], ridge: ['#5a5a5a'], water: ['#6a6a6a'], foam: ['#ffffff'], cliff: ['#8a8a8a', '#b4b4b4'], rock: ['#7a7a7a', '#a4a4a4'], grass: ['#a8a8a8'], stone: ['#b4b4b4'],
    tower: ['#f2f2f2'], red: ['#7a7a7a'], door: ['#4a4a4a'], window: ['#2a2a2a'], iron: ['#3a3a3a'], glass: ['#c4c4c4'], house: ['#eaeaea'], roof: ['#8a8a8a'], hull: ['#6a6a6a'], cabin: ['#eaeaea'], wood: ['#808080'], gull: ['#ffffff'] },
  mat: () => ({ roughness: 0.9, envMapIntensity: 0 }),
  beam: ['#ffffff', 0.55, 1.4], lamp: ['#ffffff', 8],
  color: `{ vec3 c = C0 * (0.85 + 0.3 * fbm3(vOP * 25.0 + LH)); if (isF(F_SKY)) { SKYE = vec3(mix(0.05, 0.0, smoothstep(0.0, 0.7, skyT(vWP)))); c = vec3(0.0); }
    if (isF(F_WATER)) c = C0 * (0.6 + 0.9 * smoothstep(0.004, 0.016, vWP.y)); diffuseColor.rgb = c; }`,
  emis: 'if (isF(F_FOAM) || isF(F_SPRAY)) totalEmissiveRadiance += vec3(0.35);',
  post: { frag: `uniform sampler2D tex; float lum(vec2 uv) { return dot(min(texture(tex, uv).rgb, vec3(6.0)), vec3(0.299, 0.587, 0.114)); }
    void main() { vec2 c = gl_FragCoord.xy, px = 1.0 / vec2(textureSize(tex, 0)); float l = lum(vUv), b = 0.0; float rot = h21(floor(c)) * 6.2832; for (int i = 0; i < 20; i++) { float a = float(i) * 2.39996 + rot, r = 3.0 + float(i) * 1.8 * (0.7 + 0.6 * h21(floor(c) + float(i))); b += lum(vUv + vec2(cos(a), sin(a)) * r * px); } b /= 20.0;
      float e = 1.0 - exp(-2.3 * max(l, 0.0)); e = max(e, (1.0 - exp(-2.3 * b)) * 0.85);
      float fib = 0.5 * fbm(vec2(c.x * 0.8, c.y * 0.05)) + 0.5 * fbm(vec2(c.x * 0.05, c.y * 0.9) + 3.0), coat = fbm(c * vec2(0.0035, 0.012) + 1.7);
      e = clamp(e + 0.10 * (fib - 0.5) + 0.12 * (coat - 0.5), 0.0, 1.0);
      vec3 paper = S(0.95, 0.935, 0.885) * (0.965 + 0.05 * fib), mid = S(0.10, 0.26, 0.52), deep = S(0.03, 0.09, 0.24);
      vec3 blue = mix(deep, mid, smoothstep(0.05, 0.55, e)) * (0.92 + 0.12 * fib); o = vec4(mix(blue, paper, smoothstep(0.42, 0.92, e)), 1.0); }` },
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffffff'); key.intensity = 3.2; fill.color.set('#ffffff'); fill.intensity = 0.25; amb.intensity = 0.10; spot.color.set('#ffffff'); spot.intensity = 5; bloom.strength = 0; grade.graphic.value = 1; grade.ex.value = 1; grade.vig.value = 0.0; } });
