// MARQUETRY. The picture is inlaid in wood veneer: every part is its own fitted piece with its own species and grain direction, hairline joints between pieces,
// each piece scorched darker along its edges (sand shading), the ground cut into a patchwork of walnut, olive, oak and green-dyed veneers, a pale maple sky.
import * as THREE from 'three';
import { shared, quad, gbMat, meshes, passes, seedQuad, jfa } from './gbuf4.js';
import { fam } from './kit4.js';
// family -> veneer colour; flag: 0 piece, 1 sky, 2 patchwork, 3 lamp
const W = { body: '#3f7a52', dark: '#2a1f19', coal: '#3a2c23', red: '#a8442a', brass: '#d6ad5c', steel: '#9ba5a6', glass: '#4f6d88', lamp: '#f3ead2', cream: '#efe5cc', coach: '#9c4a2c',
  smoke: '#efe6cf', sky: '#ead6aa', ridge: '#8b8e76', ground: '#7f6a3e', water: '#93a6ae', rock: '#a28b63', pine: '#2f5a3a', trunk: '#5f3e27', stone: '#d4bd90', arch: '#efe4c8', ballast: '#5d4b3c', sleeper: '#4f3424' };
const SP = { sky: 0.02, ridge: 0.016, ground: 0.008 };
export function marquetryLook({ scene, key, fill, amb, spot, bloom, grade, size: [Wd, Ht] }) {
  const S = shared(Wd, Ht), m = meshes(scene), seed = seedQuad(1.0, 1.0);
  const U = { col: { value: S.gb.textures[0] }, id: { value: S.gb.textures[1] }, tex: { value: S.gb.textures[2] }, tone: { value: S.tone.texture }, jf: { value: null } };
  const fin = quad(`uniform sampler2D col, id, tex, tone, jf;
    vec3 grain(vec3 base, vec2 s, float id) { vec2 g = h11(id * 7.31) < 0.5 ? s : s.yx; g = mat2(0.96, 0.28, -0.28, 0.96) * g * (h11(id * 3.1) < 0.5 ? 1.0 : -1.0);
      float warp = fbm(g * vec2(0.05, 0.4) + id * 1.7) * 3.2 + 0.6 * sin(g.x * 0.09 + id); float r = fract(g.y * 1.25 + warp); float band = smoothstep(0.0, 0.2, r) * smoothstep(1.0, 0.6, r);
      float pores = smoothstep(0.62, 0.9, vn(vec2(g.x * 0.25, g.y * 11.0))); float fig = fbm(g * 0.04 + id) - 0.5;
      return base * (0.78 + 0.34 * band - 0.12 * pores + 0.16 * fig); }
    void main() { vec2 c = gl_FragCoord.xy; ivec2 p = ivec2(c); vec4 C = texelFetch(col, p, 0), I = texelFetch(id, p, 0), X = texelFetch(tex, p, 0), J = texelFetch(jf, p, 0); float t = clamp(dot(texelFetch(tone, p, 0).rgb, vec3(0.333)), 0.0, 1.2);
      float jd = J.w > 0.5 ? length(J.xy - c) : 99.0; vec3 base = C.rgb; float pid = I.y; vec2 s = X.xy;
      if (C.a > 1.5 && C.a < 2.5) { vec2 q = s / 9.0, i = floor(q), f = fract(q); float d1 = 9.0, d2 = 9.0; vec2 cid = vec2(0.0); for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(x, y), o = g + 0.15 + 0.7 * h22(i + g) - f; float d = dot(o, o); if (d < d1) { d2 = d1; d1 = d; cid = i + g; } else if (d < d2) d2 = d; }
        float e = (sqrt(d2) - sqrt(d1)) * 9.0 / max(length(X.zw), 1e-3); float k = h21(cid); base = k < 0.25 ? S(0.42, 0.28, 0.17) : k < 0.5 ? S(0.55, 0.49, 0.30) : k < 0.75 ? S(0.36, 0.48, 0.29) : S(0.60, 0.47, 0.29); pid = 50.0 + k * 40.0;
        jd = min(jd, e * 0.5); }
      vec3 r = grain(base, s, pid);
      if (C.a > 0.5 && C.a < 1.5) r = grain(base, vec2(s.y, s.x) * 0.6, 3.0);
      r *= mix(0.74, 1.08, smoothstep(0.05, 0.95, t));
      r *= 1.0 - 0.28 * exp(-jd / 3.2) - 0.14 * exp(-jd / 10.0);
      r = mix(r, S(0.13, 0.09, 0.07), smoothstep(1.0, 0.3, jd) * 0.6);
      r *= 1.0 + 0.05 * (vn(c * 0.004) - 0.5); o = vec4(r, 1.0); }`, U);
  return { shutter: 0, on() { for (const o of m) { const d = o.userData, f = fam(o); o.material = d.mMq ??= gbMat(o, { c0: d.layer === 'r2' ? '#b2b4a6' : W[f] ?? d.col, spacing: SP[f] ?? 0.004, lw: 1, flag: f === 'sky' ? 1 : f === 'ground' ? 2 : f === 'lamp' ? 3 : 0, id: f === 'smoke' || f === 'pine' || f === 'trunk' ? d.layer : o.uuid }); }
      key.intensity = 2.6; fill.intensity = 0.6; amb.intensity = 0.2; bloom.strength = 0; grade.graphic.value = 1; grade.vig.value = 0.10; },
    render(r, sc, cam) { passes(r, sc, cam); U.jf.value = jfa(r, seed, [8, 4, 2, 1]); r.setRenderTarget(S.out); fin.render(r); return S.out.texture; } };
}
