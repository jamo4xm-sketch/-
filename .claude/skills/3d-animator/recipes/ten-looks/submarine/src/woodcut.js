// WOODCUT. Lines are carved along each surface (its own u and v), black widens where the light drops; the colour blocks lie slightly off register under the key block; the lamp leaves bare paper.
import * as THREE from 'three';
import { shared, quad, gbMat, meshes, passes, seedQuad, jfa, toneMat, BEAM, beamU, setBeam, oid } from './gbuf.js';
const P = { paper: '#f3e9d2', red: '#d8402a', ochre: '#e6ab3f', teal: '#2f8a86', blue: '#2a5580', wood: '#cf9255', wood2: '#b87640', green: '#58a266', green2: '#2f7f5c', sand: '#ecd3a0' };
const T = { hull: P.red, tower: P.red, belly: '#f6e6c4', trim: P.ochre, scope: P.ochre, blade: P.ochre, coin: P.ochre, capband: P.ochre, bulb: P.ochre, fin: P.teal, hatch: P.teal, lens: P.teal, lamp: '#fff0b8', pane: P.blue, coat: P.blue, cap: P.blue, visor: '#15181f', hub: '#31465a', rib: P.wood2, keel: P.wood2, plank: P.wood2, splinter: '#e6bf85', wheel: P.wood, chest: P.wood, leaf: P.green, stalk: P.green2, rock: '#a9b0a6', star: P.red, shell: '#f4cfb6', anchor: '#6b8ba0', face: '#f3c39a', beard: P.paper, tash: P.paper, reef: '#4f93ab', sand: P.sand, bubble: '#f6f1e2', wall: '#f3ecd0' };
const LWT = { hull: 1.1, belly: 1.1, tower: 1.05, rib: 0.95, trim: 0.6, leaf: 0.7, stalk: 0.6, coin: 0.5, bulb: 0.5, fish: 0.75, face: 0.5, beard: 0.6, tash: 0.35, cap: 0.5, capband: 0.3, plank: 0.6, reef: 0.8, sand: 0.8, splinter: 0.6 };
export function woodcutLook({ scene, key, fill, amb, spot, bloom, grade, SKY, size: [W, H] }) {
  const S = shared(W, H), m = meshes(scene), seed = seedQuad(2.0, 3.6);
  const U = { col: { value: S.gb.textures[0] }, id: { value: S.gb.textures[1] }, tex: { value: S.gb.textures[2] }, tone: { value: S.tone.texture }, jf: { value: null }, ...beamU(), shipA: { value: 0 } };
  const fin = quad(`uniform sampler2D col, id, tex, tone, jf; ${BEAM}
    float lines(float s, float fw, float k, float soft) { float d = abs(fract(s) - 0.5) * 2.0; float aa = max(fw * 2.0, 0.02); float ink = smoothstep(k + aa, k - aa, d); return mix(ink, k, smoothstep(0.45, 0.9, fw)); }
    void main() { ivec2 p = ivec2(gl_FragCoord.xy); vec2 c = vec2(p) + 0.5; vec4 I = texelFetch(id, p, 0), X = texelFetch(tex, p, 0), J = texelFetch(jf, p, 0); vec4 C = texelFetch(col, p, 0), Cs = texelFetch(col, clamp(p + ivec2(3, 2), ivec2(0), textureSize(col, 0) - 1), 0); float t = clamp(dot(texelFetch(tone, p, 0).rgb, vec3(0.33)) / 1.05, 0.0, 1.0);
      bool bg = C.a > 0.5 && C.a < 1.5, sandA = C.a > 1.5 && C.a < 2.5, lampA = C.a > 2.5; vec3 B = beamAt(c, I.z); float inB = smoothstep(-1.0, 1.0, B.x);
      float fib = vn(c * vec2(0.035, 0.55)) * 0.5 + vn(c * vec2(0.5, 0.05)) * 0.3 + vn(c * 0.9) * 0.2; vec3 paper = S(0.955, 0.918, 0.828) * (0.94 + 0.09 * fib); vec3 ink = S(0.085, 0.072, 0.065);
      // the colour block, a little off register and unevenly rubbed
      vec3 tint = Cs.rgb; if (bg) { float g = X.y; tint = mix(S(0.945, 0.925, 0.80), S(0.62, 0.82, 0.80), smoothstep(0.05, 0.30, g)); tint = mix(tint, S(0.25, 0.56, 0.66), smoothstep(0.25, 0.55, g)); tint = mix(tint, S(0.10, 0.29, 0.45), smoothstep(0.5, 0.95, g)); }
      float rub = 0.80 + 0.28 * fbm(c * 0.03) + 0.10 * (vn(c * 0.6) - 0.5); vec3 pr = mix(paper, tint, clamp(rub, 0.0, 1.0));
      // how much black the cut leaves
      float k = 0.0; if (bg) { float g = X.y; vec2 u = c / vec2(textureSize(col, 0)); float a = atan(u.x - 0.56, 1.25 - u.y); float ray = smoothstep(0.35, 0.75, 0.5 + 0.5 * sin(a * 34.0 + 1.2)) * smoothstep(0.75, 0.35, g); k = mix(0.10, 0.66, smoothstep(0.02, 0.85, g)) * (1.0 - ray); }
      else { float tt = pow(t, 0.80); k = clamp(1.04 - 1.22 * tt, 0.0, 1.0); k = mix(k, k * 0.75, sandA ? 1.0 : 0.0); }
      k *= 0.82 + 0.40 * vn(vec2(X.x * 0.5, X.y * 1.7) + 5.0); if (lampA) k = 0.0; k = mix(k, k * 0.12, inB); float ik = k < 0.06 ? 0.0 : lines(X.x, X.z, k, 0.0); if (!bg) { float k2 = clamp(k * 1.35 - 0.62, 0.0, 1.0); if (k2 > 0.02) ik = max(ik, lines(X.y, X.w, k2 * 0.8, 0.0)); }
      if (k > 0.93) ik = 1.0;
      // beam: rays cut from the lamp
      if (inB > 0.01) { pr = mix(pr, mix(S(1.0, 0.955, 0.72), pr, C.a < 0.5 ? 0.62 : 0.12), inB); }
      float edB = smoothstep(2.2, 0.6, abs(B.x)) * step(0.04, B.y);
      // key block: outlines, with a bare strip of paper on the far side so dark never touches dark
      float dist = J.w > 0.5 ? length(J.xy - c) : 99.0, w = J.z * (0.72 + 0.60 * vn(c * 0.045) + 0.25 * vn(c * 0.2)); bool far = J.w > 0.5 && abs(I.y - (J.w - 1.0)) > 0.5; if (far && dist > w && dist < w + 4.6 * J.z / 3.6) { ik *= smoothstep(w + 3.0 * J.z / 3.6, w + 4.6 * J.z / 3.6, dist); }
      float ln = smoothstep(w + 0.8, w - 0.8, dist); ik = max(ik, ln); ik = max(ik, edB * (far ? 0.0 : 1.0) * 0.9);
      // ink on paper: salt where the paper's grain did not take it, wood grain in the solids
      float salt = smoothstep(0.80, 0.93, vn(c * 0.75) * 0.6 + vn(c * 0.21 + 7.0) * 0.5); float grain = smoothstep(0.74, 0.90, vn(vec2(c.x * 0.02 + 0.6 * sin(c.y * 0.004), c.y * 0.28))); ik *= 1.0 - 0.75 * salt - 0.16 * grain;
      vec3 r = mix(pr, ink, clamp(ik, 0.0, 1.0)); if (C.a > 4.5) r = mix(paper, C.rgb, 0.97); o = vec4(r, 1.0); }`, U);
  return { shutter: 0, on() { for (const o of m) { const d = o.userData, p = d.part; o.material = d.mWood ??= gbMat(o, { c0: d.paint ? (p === 'eye' ? '#15120f' : p === 'rivet' ? '#f6e6c4' : d.col) : T[p] ?? d.col, c1: P.paper, spacing: p === 'rib' || p === 'keel' ? 0.0082 : p === 'hull' || p === 'belly' ? 0.0105 : 0.0074, lw: LWT[p] ?? 0.75, flag: p === 'wall' ? 1 : p === 'sand' ? 2 : p === 'lamp' ? 3 : d.paint ? 5 : 0 }); } key.intensity = 2.6; fill.intensity = 0.5; amb.intensity = 0.10; spot.intensity = 0; bloom.strength = 0; grade.graphic.value = 1; grade.vig.value = 0.05; },
    render(r, sc, cam) { passes(r, sc, cam); U.jf.value = jfa(r, seed, [8, 4, 2, 1]); setBeam(U, SKY, cam, W, H); r.setRenderTarget(S.out); fin.render(r); return S.out.texture; } };
}
