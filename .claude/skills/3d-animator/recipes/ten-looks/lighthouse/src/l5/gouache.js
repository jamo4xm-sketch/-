// GOUACHE. Opaque matte paint: flat shapes laid in with a loaded brush (a Kuwahara filter keeps every edge and flattens each area into strokes),
// dry-brush streaks breaking up on the rocks, horizontal strokes in the sea, a bruised violet sky, grey-green surf, warm paper grain under it all.
import { look } from '../kit5.js';
export const gouacheLook = look({ id: 'gouache',
  T: { sky: ['#3a2a52', '#9a6a88'], ridge: ['#5a4a6e', '#64547a'], water: ['#22404e', '#3a5f68'], foam: ['#a9bba8', '#c8d4c0'], cliff: ['#4a4250', '#6e6068'], rock: ['#3a3440', '#5a5058'], grass: ['#5b6e3c', '#6f8446'], stone: ['#8a8078'],
    tower: ['#efe6d2'], red: ['#c2443a'], door: ['#4a3428'], window: ['#22303c'], iron: ['#2a2a30'], glass: ['#a8c4c8'], house: ['#e8dcc4'], roof: ['#a4523a'], hull: ['#2c4a7a'], cabin: ['#eee4d0'], wood: ['#7a5a3a'], gull: ['#f2f0ea'] },
  mat: () => ({ roughness: 1.0, envMapIntensity: 0 }),
  beam: ['#fff0c8', 0.3, 1.2], lamp: ['#ffe6a8', 3],
  color: `{ vec3 c = C0;
    if (isF(F_SKY)) { float t = skyT(vWP); c = mix(C1, C0, smoothstep(0.0, 0.75, t + 0.08 * (fbm(vWP.xy * vec2(0.6, 2.2)) - 0.5))); SKYE = c * 0.8; c *= 0.15; }
    if (isF(F_ROCK) || isF(F_CLIFF)) { float d = smoothstep(0.48, 0.62, fbm(vec2(vWP.x * 70.0 + vWP.z * 50.0, vWP.y * 9.0 + vWP.z * 4.0))); c = mix(C0, C1 * 1.25, d); }
    if (isF(F_WATER)) c = mix(C0, C1, smoothstep(0.35, 0.65, fbm(vec2(vWP.x * 3.0, vWP.z * 26.0))));
    if (isF(F_GRASS)) c = mix(C0, C1, smoothstep(0.4, 0.6, fbm(vWP.xz * 30.0)));
    diffuseColor.rgb = c; }`,
  post: { frag: `uniform sampler2D tex;
    void main() { vec2 px = 1.0 / vec2(textureSize(tex, 0)), cc = gl_FragCoord.xy; vec2 uv = vUv + (vec2(fbm(cc * 0.045), fbm(cc * 0.045 + 7.3)) - 0.5) * 6.0 * px; const int R = 5; const float STP = 1.7; vec3 mu[4], sq[4]; for (int k = 0; k < 4; k++) { mu[k] = vec3(0.0); sq[k] = vec3(0.0); }
      for (int j = -R; j <= R; j++) for (int i = -R; i <= R; i++) { vec3 c = min(texture(tex, uv + vec2(float(i), float(j)) * px * STP).rgb, vec3(3.0));
        if (i <= 0 && j <= 0) { mu[0] += c; sq[0] += c * c; } if (i >= 0 && j <= 0) { mu[1] += c; sq[1] += c * c; } if (i <= 0 && j >= 0) { mu[2] += c; sq[2] += c * c; } if (i >= 0 && j >= 0) { mu[3] += c; sq[3] += c * c; } }
      float n = float((R + 1) * (R + 1)), bv = 1e9; vec3 best = vec3(0.0); for (int k = 0; k < 4; k++) { vec3 m = mu[k] / n, v = sq[k] / n - m * m; float s = v.r + v.g + v.b; if (s < bv) { bv = s; best = m; } }
      float L = dot(best, vec3(0.3, 0.59, 0.11)), Lq = (floor(L * 5.0) + smoothstep(0.35, 0.65, fract(L * 5.0))) / 5.0; best *= mix(1.0, Lq / max(L, 1e-4), 0.45);
      float st = vn(vec2(cc.x * 0.04 + cc.y * 0.012, cc.y * 0.5)) , pap = fbm(cc * 0.35) * 0.6 + fbm(cc * 0.06) * 0.4; best *= (0.90 + 0.12 * st) * (0.95 + 0.07 * pap); o = vec4(best, 1.0); }` },
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffe0c0'); key.intensity = 2.2; fill.color.set('#8070a0'); fill.intensity = 0.45; amb.intensity = 0.3; spot.color.set('#fff0c8'); spot.intensity = 3; bloom.strength = 0; grade.graphic.value = 1; grade.ex.value = 1.0; grade.vig.value = 0.1; } });
