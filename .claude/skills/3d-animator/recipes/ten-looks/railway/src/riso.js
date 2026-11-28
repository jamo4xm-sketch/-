// RISO PRINT. Two inks on warm paper: rust and plum, each printed from its own drum, so the plum sits a few pixels off the rust and a third colour appears where they overlap.
// Solid shapes for the dark parts, coarse halftone dots for the middle tones, grainy uneven coverage and the odd speck of missing ink.
import * as THREE from 'three';
import { shared, quad, gbMat, meshes, passes } from './gbuf4.js';
import { fam } from './kit4.js';
// family -> [rust, plum] density
const D = { body: [0, 0.8], dark: [0.92, 0.92], coal: [0.92, 0.92], red: [0.95, 0], brass: [0.5, 0], steel: [0.15, 0.38], glass: [0.3, 0.92], lamp: [0, 0], cream: [0.06, 0], coach: [0.88, 0.32],
  smoke: [0, 0], sky: [0.1, 0], ridge: [0, 0.44], ground: [0.36, 0.34], water: [0.05, 0.55], rock: [0.22, 0.3], pine: [0.12, 0.88], trunk: [0.7, 0.45], stone: [0.0, 0.03], arch: [0.0, 0.02], ballast: [0.4, 0.5], sleeper: [0.7, 0.6] };
export function risoLook({ scene, key, fill, amb, spot, bloom, grade, size: [W, H] }) {
  const S = shared(W, H), m = meshes(scene);
  const U = { col: { value: S.gb.textures[0] }, tone: { value: S.tone.texture } };
  const fin = quad(`uniform sampler2D col, tone;
    vec2 dens(vec2 c) { ivec2 sz = textureSize(col, 0); ivec2 p = clamp(ivec2(c), ivec2(0), sz - 1); vec4 C = texelFetch(col, p, 0); float t = clamp(dot(texelFetch(tone, p, 0).rgb, vec3(0.333)), 0.0, 1.0); float sh = 1.0 - t;
      vec2 d = C.rg; if (C.a > 0.5 && C.a < 1.5) d.x *= smoothstep(0.0, 0.9, c.y / float(sz.y)); d.y += sh * sh * 0.85 * step(0.01, d.x + d.y + (C.a > 1.5 ? 1.0 : 0.0)); d.x += sh * 0.18 * step(0.01, d.x); d *= 0.82 + 0.3 * sh; return clamp(d, 0.0, 1.0); }
    float screen(vec2 c, float d, float ang, float cell) { if (d < 0.07) return 0.0; if (d > 0.74) return 1.0; vec2 q = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * c / cell; vec2 f = fract(q) - 0.5; float r = sqrt(d / 3.1416) * 1.08; return smoothstep(r + 0.07, r - 0.07, length(f)); }
    void main() { vec2 c = gl_FragCoord.xy; vec2 dA = dens(c), dB = dens(c - vec2(10.0, -7.0));
      float a = screen(c, dA.x, 0.26, 9.0), b = screen(c + vec2(2.0, 1.0), dB.y, 1.31, 9.0);
      float grA = 0.80 + 0.22 * vn(c * 0.9) * vn(c * 0.21 + 4.0) + 0.08 * (vn(vec2(c.x * 0.004, c.y * 0.3)) - 0.5), grB = 0.80 + 0.22 * vn(c * 0.85 + 9.0) * vn(c * 0.19 + 2.0) + 0.08 * (vn(vec2(c.x * 0.003, c.y * 0.28) + 5.0) - 0.5);
      a *= grA * (1.0 - step(0.985, h21(floor(c * 0.5)))); b *= grB * (1.0 - step(0.985, h21(floor(c * 0.5) + 3.3)));
      vec3 paper = S(0.965, 0.935, 0.87) * (0.96 + 0.05 * vn(c * 0.45)); vec3 inkA = S(0.83, 0.33, 0.20), inkB = S(0.44, 0.25, 0.53);
      vec3 r = paper * mix(vec3(1.0), inkA, clamp(a, 0.0, 1.0)) * mix(vec3(1.0), inkB, clamp(b, 0.0, 1.0)); o = vec4(r, 1.0); }`, U);
  return { shutter: 0, on() { for (const o of m) { const d = o.userData, f = fam(o), [da, db] = d.layer === 'r2' ? [0, 0.24] : D[f] ?? [0.3, 0.3]; o.material = d.mRiso ??= gbMat(o, { c0: new THREE.Color().setRGB(da, db, 0), flag: f === 'sky' ? 1 : f === 'smoke' ? 2 : 0 }); }
      key.intensity = 2.8; fill.intensity = 0.5; amb.intensity = 0.15; bloom.strength = 0; grade.graphic.value = 1; grade.vig.value = 0.0; },
    render(r, sc, cam) { passes(r, sc, cam); r.setRenderTarget(S.out); fin.render(r); return S.out.texture; } };
}
