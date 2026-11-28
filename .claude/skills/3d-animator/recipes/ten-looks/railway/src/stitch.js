// CROSS STITCH. The picture is stitched on open aida cloth: one X per square of the grid (about 6 px on the card), three shades of floss per colour by the light,
// the top leg catching light and throwing a small shadow on the leg under it. Dark backstitch runs hole to hole round the train, the arches and the smoke. The sky is bare cloth.
import * as THREE from 'three';
import { shared, quad, gbMat, meshes, passes } from './gbuf4.js';
import { fam, TRAIN } from './kit4.js';
const FL = { body: '#2f7f57', dark: '#2c2e34', coal: '#222327', red: '#c8322c', brass: '#e2aa3a', steel: '#9ca5ac', glass: '#36608e', lamp: '#ffe470', cream: '#f1e4c2', coach: '#8b302d', smoke: '#f2f2f0',
  sky: '#e9e2d3', ridge: '#8ba7bc', ground: '#8aa97b', water: '#4aa8cb', rock: '#8f8a80', pine: '#2f5f40', trunk: '#6b4a32', stone: '#b9a283', arch: '#dccaa6', ballast: '#7a746b', sleeper: '#5d4533' };
const ID = (o, f) => (TRAIN.has(f) ? 't-' + f : f === 'stone' || f === 'ballast' || f === 'sleeper' ? 'via' : f === 'arch' ? 'arch' : f === 'smoke' ? 'smoke' : f === 'ridge' ? 'ridge-' + o.userData.layer : f === 'sky' ? 'sky' : f === 'pine' || f === 'trunk' ? o.userData.layer : f);
const LW = { body: 1, dark: 1, coal: 1, red: 1, brass: 1, steel: 1, glass: 1, lamp: 1, cream: 1, coach: 1, smoke: 1, arch: 1, stone: 1, ballast: 1, sleeper: 1, rail: 1 };
export function stitchLook({ scene, key, fill, amb, spot, bloom, grade, size: [W, H] }) {
  const S = shared(W, H), m = meshes(scene);
  const U = { col: { value: S.gb.textures[0] }, id: { value: S.gb.textures[1] }, tone: { value: S.tone.texture }, CS: { value: 18.0 } };
  const fin = quad(`uniform sampler2D col, id, tone; uniform float CS;
    vec4 at(vec2 ci, out vec4 I, out float L) { ivec2 sz = textureSize(col, 0); ivec2 pc = clamp(ivec2((ci + 0.5) * CS), ivec2(0), sz - 1); I = texelFetch(id, pc, 0); L = dot(texelFetch(tone, pc, 0).rgb, vec3(0.333)); return texelFetch(col, pc, 0); }
    // one thread: across = signed distance from its middle, along = 0..1 hole to hole; returns (cover, shade)
    vec2 leg(float across, float along, float W, vec2 acrossDir, vec3 Ld) { float w = W * (0.60 + 0.40 * smoothstep(0.0, 0.24, min(along, 1.0 - along))); float n = clamp(across / w, -1.0, 1.0); float cov = smoothstep(w + 0.035, w - 0.035, abs(across));
      vec3 N = normalize(vec3(acrossDir * n, sqrt(max(0.0, 1.0 - n * n)) + 0.15)); float tw = 0.86 + 0.14 * sin(along * CS * 1.414 * 1.55 + n * 2.2); float sp = pow(max(dot(reflect(-Ld, N), vec3(0.0, 0.0, 1.0)), 0.0), 10.0);
      return vec2(cov, (0.50 + 0.62 * max(dot(N, Ld), 0.0)) * tw + 0.22 * sp); }
    void main() { vec2 c = gl_FragCoord.xy, q = c / CS, ci = floor(q), f = fract(q); vec4 I; float L; vec4 C = at(ci, I, L); vec3 Ld = normalize(vec3(-0.45, 0.55, 0.72));
      // the cloth: woven blocks, a hole at every corner of the grid
      vec2 hc = f - floor(f + 0.5); float hole = smoothstep(0.15, 0.10, length(hc)); float wv = 0.5 + 0.5 * sin(q.x * 3.14159 * 4.0) * sin(q.y * 3.14159 * 4.0); vec3 cloth = S(0.925, 0.895, 0.835) * (0.93 + 0.05 * wv + 0.04 * vn(c * 0.35)) * (1.0 - 0.10 * smoothstep(0.25, 0.5, length(f - 0.5)));
      cloth = mix(cloth, S(0.52, 0.48, 0.42), hole * 0.85); vec3 r = cloth;
      bool bare = C.a > 0.5 && C.a < 1.5;
      if (!bare) { float lv = C.a > 2.5 ? 2.0 : L < 0.22 ? 0.0 : L < 0.55 ? 1.0 : 2.0; vec3 th = C.rgb * (lv < 0.5 ? 0.50 : lv < 1.5 ? 0.80 : 1.06); if (C.a > 2.5) th = C.rgb;
        float dA = (f.y - f.x) * 0.7071, sA = (f.x + f.y) * 0.5, dB = (f.x + f.y - 1.0) * 0.7071, sB = (f.x - f.y + 1.0) * 0.5;
        vec2 A = leg(dA, sA, 0.27, vec2(-0.7071, 0.7071), Ld), B = leg(dB, sB, 0.27, vec2(0.7071, 0.7071), Ld);
        float shB = smoothstep(0.27 + 0.12, 0.27, abs(dB + 0.06)) * (1.0 - B.x);   // the top leg's shadow on the cloth and the leg under it
        r = mix(r, r * 0.72, shB * 0.8); r = mix(r, th * A.y * (1.0 - 0.28 * shB), A.x); r = mix(r, th * B.y, B.x); }
      // backstitch: a dark thread along a grid edge wherever two different things meet
      vec2 dirs[4] = vec2[4](vec2(1.0, 0.0), vec2(-1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, -1.0)); float bs = 0.0, bsh = 1.0;
      for (int k = 0; k < 4; k++) { vec2 dv = dirs[k]; float ed = dv.x > 0.5 ? 1.0 - f.x : dv.x < -0.5 ? f.x : dv.y > 0.5 ? 1.0 - f.y : f.y, al = abs(dv.x) > 0.5 ? f.y : f.x; if (ed > 0.16) continue;
        vec4 I2; float L2; vec4 C2 = at(ci + dv, I2, L2); bool diff = abs(I2.y - I.y) > 0.5; bool want = I.w > 0.5 || I2.w > 0.5; if (!(diff && want)) continue;
        float w = 0.115 * (0.62 + 0.38 * smoothstep(0.0, 0.2, min(al, 1.0 - al))), n = clamp(ed / w, 0.0, 1.0); float cov = smoothstep(w + 0.03, w - 0.03, ed); if (cov > bs) { bs = cov; vec3 N = normalize(vec3(-dv * n, sqrt(1.0 - n * n) + 0.2)); bsh = 0.45 + 0.75 * max(dot(N, Ld), 0.0); } }
      r = mix(r, S(0.17, 0.14, 0.13) * bsh, bs); o = vec4(r, 1.0); }`, U);
  return { shutter: 0, on() { for (const o of m) { const d = o.userData, f = fam(o); o.material = d.mSt ??= gbMat(o, { c0: d.layer === 'r2' ? '#b4c6d3' : FL[f] ?? d.col, lw: LW[f] ?? (d.part === 'rail' ? 1 : 0), flag: f === 'sky' ? 1 : f === 'lamp' ? 3 : 0, id: ID(o, f) }); }
      key.intensity = 2.8; fill.intensity = 0.6; amb.intensity = 0.12; bloom.strength = 0; grade.graphic.value = 1; grade.vig.value = 0.04; },
    render(r, sc, cam) { passes(r, sc, cam); r.setRenderTarget(S.out); fin.render(r); return S.out.texture; } };
}
