// Shared by the balloon looks: the part -> family table of the balloon scene, and one factory for a look.
// A look = a table of family colours + GLSL for colour / bumps / roughness / metal / glow, a reflection studio, lights, and an optional post pass.
// The burner flare reaches every look through FLARE (one shared uniform, set by pose): the flame glows with LAMPC, the envelope glows from inside near its mouth.
import * as THREE from 'three';
import { hash } from './shapes3.js';
import { meshes, quad } from './gbuf4.js';
import { dressed, studio } from './dress.js';
import { metric } from './kit4.js';
export { metric };
export const FAM = { sky: 'sky', hill: 'hill', ground: 'ground', terrace: 'terrace', wall: 'wall', roof: 'roof', chimney: 'chimney', pot: 'pot', window: 'window', door: 'door', shutter: 'shutter',
  env: 'env', tape: 'tape', skirt: 'skirt', rim: 'skirt', rope: 'rope', string: 'rope', burner: 'burner', basket: 'basket', flame: 'flame', pennant: 'pennant', tree: 'tree', trunk: 'trunk', stone: 'stone', bird: 'bird' };
export const fam = (o) => FAM[o.userData.part] ?? 'wall';
export const BUILT = new Set(['wall', 'roof', 'chimney', 'pot', 'window', 'door', 'shutter', 'stone', 'terrace']);
const FID = { sky: 1, hill: 2, ground: 3, terrace: 4, wall: 5, roof: 6, chimney: 7, pot: 8, window: 9, door: 10, shutter: 11, env: 12, tape: 13, skirt: 14, rope: 15, burner: 16, basket: 17, flame: 18, pennant: 19, tree: 20, trunk: 21, stone: 22, bird: 23 };
// GLSL every look gets: the family (FM), two colours, a number (KK), the surface size in metres (MET), a per-object random (LH), FLARE (0..1, the burner), FLW = 1 on the near balloon
export const GL = `uniform float FM, KK, LH, FLARE, FLW, FLK; uniform vec3 C0, C1; uniform vec2 MET; vec3 SKYE = vec3(0.0);
  ${Object.entries(FID).map(([k, v]) => `#define F_${k.toUpperCase()} ${v.toFixed(1)}`).join('\n')}
  bool isF(float k) { return abs(FM - k) < 0.5; }
  float skyT(vec3 w) { return clamp((w.y - 3.0) / 6.0, 0.0, 1.0); }
  vec2 tri(vec3 p, vec3 n) { return abs(n.y) > 0.7 ? p.xz : abs(n.x) > 0.7 ? p.zy : p.xy; }
  float bev(float d) { return d >= 0.0 ? -(1.0 - smoothstep(0.0, 0.0022, d)) : -smoothstep(-0.0004, 0.0, d); }
  float aaLine(float d, float w) { float f = max(fwidth(d), 1e-6); return 1.0 - smoothstep(w - f, w + f, d); }
  float ribs(float s, float sp, float w) { return aaLine(abs(fract(s / sp + 0.5) - 0.5) * sp, w); }
  vec3 vor(vec2 p) { vec2 i = floor(p), f = fract(p); float a = 9.0, b = 9.0, id = 0.0; for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(x, y), o = h22(i + g); float d = length(g + 0.15 + 0.7 * o - f); if (d < a) { b = a; a = d; id = h21(i + g); } else if (d < b) b = d; } return vec3(a, b, id); }
  float gore() { return mod(floor(vUvL.x * 16.0), 2.0); }
  float goreSeam() { return abs(fract(vUvL.x * 16.0 + 0.5) - 0.5) * MET.x / 16.0; }
  float mouthGlow() { return FLW * FLARE * exp(-max(vOP.y, 0.0) * 5.5); }`;
// spec: { id, T: {family: [c0, c1?, kk?]}, physical, mat(f, d, c0, c1) -> material options, env: [cards, walls, blur], lamp: [colour, strength], flare: envelope glow strength (0.5),
//         burn: the burner point light (1.2), defs, color, height, rough, metal, emis, last, on(ctx), post: { frag, U }, shutter }
export function look(spec) {
  return (ctx) => {
    const { scene, renderer, size: [W, H], SKY } = ctx, env = spec.env ? studio(renderer, ...spec.env) : null, ms = meshes(scene);
    const LC = new THREE.Color(spec.lamp?.[0] ?? '#ffb862').multiplyScalar(spec.lamp?.[1] ?? 5);
    const mk = (o) => { const d = o.userData, f = fam(o), t = spec.T[f] ?? spec.T.wall, c0 = t[0], c1 = t[1] ?? t[0], kk = t[2] ?? 0, sky = f === 'sky';
      const M = new (spec.physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({ roughness: sky ? 1 : 0.5, metalness: 0, envMap: env, envMapIntensity: sky ? 0 : 1, side: d.two ? THREE.DoubleSide : THREE.FrontSide, ...(spec.mat?.(f, d, c0, c1) ?? {}) });
      const met = metric(o) ?? [1, 1];
      return dressed(M, { id: spec.id, uniforms: { FM: { value: FID[f] ?? 5 }, KK: { value: kk }, LH: { value: hash(o.id * 1.37 + 0.5) }, FLARE: SKY.flare, FLW: { value: d.layer === 'bal' ? 1 : 0 }, FLK: { value: spec.flare ?? 1.0 },
          C0: { value: new THREE.Color(c0) }, C1: { value: new THREE.Color(c1) }, MET: { value: new THREE.Vector2(...met) }, LAMPC: { value: LC } },
        defs: GL + 'uniform vec3 LAMPC;\n' + (spec.defs ?? ''), color: spec.color ?? '', height: spec.height ?? '', rough: spec.rough ?? '', metal: spec.metal ?? '', last: spec.last ?? '',
        emis: `${spec.emis ?? ''}\n totalEmissiveRadiance += SKYE; if (isF(F_FLAME)) totalEmissiveRadiance += LAMPC * (0.35 + FLARE);
          if (isF(F_ENV)) totalEmissiveRadiance += (diffuseColor.rgb * vec3(1.0, 0.72, 0.42) + vec3(0.30, 0.13, 0.03)) * FLK * mouthGlow();
          if (isF(F_SKIRT)) totalEmissiveRadiance += vec3(1.0, 0.5, 0.15) * 0.6 * FLK * FLW * FLARE;` }); };
    let render; if (spec.post) { const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }), out = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false }), q = quad(spec.post.frag, { tex: { value: rt.texture }, ...(spec.post.U ?? {}) });
      render = (r, sc, cam) => { r.setRenderTarget(rt); r.setClearColor(0, 1); r.clear(); r.render(sc, cam); r.setRenderTarget(out); q.render(r); return out.texture; }; }
    return { shutter: spec.shutter, render, on() { for (const o of ms) o.material = o.userData['m_' + spec.id] ??= mk(o); ctx.spot.intensity = spec.burn ?? 1.2; spec.on?.(ctx); } };
  };
}
