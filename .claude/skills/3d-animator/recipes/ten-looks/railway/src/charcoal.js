// CHARCOAL. Drawn in charcoal and white chalk on grey-brown toned paper: broad dragged strokes model the boiler and the stone, the paper's tooth breaks every mark,
// chalk picks out the lit edges, the smoke and the sky are erased back to light, and packed charcoal makes the ravine floor near black. Thick broken contour lines.
import * as THREE from 'three';
import { shared, quad, gbMat, meshes, passes, seedQuad, jfa } from './gbuf4.js';
import { fam, TRAIN } from './kit4.js';
// flag: 0 drawn, 1 sky, 2 smoke (chalk), 3 ravine (packed), 4 lamp
const V = { body: 0.30, dark: 0.08, coal: 0.05, red: 0.34, brass: 0.78, steel: 0.55, glass: 0.12, lamp: 1.0, cream: 0.92, coach: 0.24, smoke: 0.95, sky: 0.8, ridge: 0.52, ground: 0.22, water: 0.62, rock: 0.5, pine: 0.14, trunk: 0.2, stone: 0.7, arch: 0.85, ballast: 0.3, sleeper: 0.18 };
export function charcoalLook({ scene, key, fill, amb, spot, bloom, grade, size: [W, H] }) {
  const S = shared(W, H), m = meshes(scene), seed = seedQuad(1.8, 3.4);
  const U = { col: { value: S.gb.textures[0] }, id: { value: S.gb.textures[1] }, tone: { value: S.tone.texture }, jf: { value: null } };
  const fin = quad(`uniform sampler2D col, id, tone, jf;
    void main() { vec2 c = gl_FragCoord.xy; vec2 jit = (vec2(vn(c * 0.05), vn(c * 0.05 + 7.0)) - 0.5) * 3.0; ivec2 p = ivec2(c + jit); vec4 C = texelFetch(col, p, 0), I = texelFetch(id, p, 0), J = texelFetch(jf, ivec2(c), 0);
      float t = clamp(dot(texelFetch(tone, p, 0).rgb, vec3(0.333)), 0.0, 1.2); float val = C.r * (0.25 + 0.85 * t); bool sky = C.a > 0.5 && C.a < 1.5, smoke = C.a > 1.5 && C.a < 2.5, rav = C.a > 2.5 && C.a < 3.5;
      if (sky) val = 0.68 + 0.14 * smoothstep(0.0, 1.0, c.y / float(textureSize(col, 0).y)); if (smoke) val = 0.82 + 0.25 * t; if (rav) val *= 0.55;
      float ang = 0.42 + 0.5 * (h11(I.y * 3.7) - 0.5); mat2 R = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)); vec2 q = R * c;
      float tooth = vn(c * 0.95) * 0.55 + vn(c * 0.38 + 3.0) * 0.45, streak = vn(q * vec2(0.03, 0.55)) * 0.6 + vn(q * vec2(0.012, 0.18) + 9.0) * 0.4, drag = fbm(q * vec2(0.0035, 0.025) + I.y);
      float Dk = smoothstep(0.58, 0.0, val + 0.12 * (drag - 0.5)); float ch = smoothstep(1.0 - Dk - 0.18, 1.0 - Dk + 0.18, streak * 0.55 + tooth * 0.45); ch = mix(ch, Dk, 0.12);
      float Wc = smoothstep(0.70, 0.98, val); float chalk = Wc * smoothstep(0.30, 0.62, tooth * 0.55 + streak * 0.45);
      if (sky) { ch *= 0.55 * smoothstep(0.35, 0.75, fbm(vec2(c.x * 0.004, c.y * 0.02))); chalk *= 0.5; }
      vec3 paper = S(0.70, 0.66, 0.60) * (0.93 + 0.10 * tooth); vec3 r = mix(paper, S(0.07, 0.065, 0.065), ch * 0.94); r = mix(r, S(0.96, 0.95, 0.92), chalk * 0.85);
      float dist = J.w > 0.5 ? length(J.xy - c) : 99.0; float w = J.z * (0.55 + 0.9 * smoothstep(0.3, 0.75, fbm(c * 0.012 + 3.0))); float ln = smoothstep(w + 1.4, w - 0.6, dist) * (0.55 + 0.45 * smoothstep(0.25, 0.6, tooth)); r = mix(r, S(0.06, 0.055, 0.055), ln * 0.9);
      r *= 1.0 - 0.10 * smoothstep(0.45, 0.85, fbm(c * 0.003 + 1.0)); o = vec4(r, 1.0); }`, U);
  return { shutter: 0, on() { for (const o of m) { const d = o.userData, f = fam(o), v = d.layer === 'r2' ? 0.66 : V[f] ?? 0.5; o.material = d.mCh ??= gbMat(o, { c0: new THREE.Color().setRGB(v, v, v), lw: f === 'sky' ? 0 : f === 'ridge' ? 0.6 : TRAIN.has(f) || f === 'smoke' ? 1.1 : 0.85, flag: f === 'sky' ? 1 : f === 'smoke' ? 2 : f === 'ground' || f === 'water' || f === 'rock' ? 3 : f === 'lamp' ? 4 : 0, id: TRAIN.has(f) ? 't' + f : f === 'smoke' || f === 'pine' || f === 'trunk' ? d.layer : f + (d.layer ?? '') }); }
      key.intensity = 2.8; fill.intensity = 0.5; amb.intensity = 0.12; bloom.strength = 0; grade.graphic.value = 1; grade.vig.value = 0.12; },
    render(r, sc, cam) { passes(r, sc, cam); U.jf.value = jfa(r, seed, [8, 4, 2, 1]); r.setRenderTarget(S.out); fin.render(r); return S.out.texture; } };
}
