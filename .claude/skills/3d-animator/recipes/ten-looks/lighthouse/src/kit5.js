// Shared by the lighthouse looks: the part -> family table of the lighthouse scene, and one factory for a look.
// A look = a table of family colours + GLSL for colour / bumps / roughness / metal / glow, a reflection studio, lights, the beam, and an optional post pass.
import * as THREE from 'three';
import { hash } from './shapes3.js';
import { meshes, quad } from './gbuf4.js';
import { dressed, studio, beamMat } from './dress.js';
import { metric } from './kit4.js';
export { metric };
export const FAM = { sky: 'sky', cloud: 'cloud', ridge: 'ridge', sea: 'water', foam: 'foam', spray: 'spray', cliff: 'cliff', rock: 'rock', grass: 'grass',
  stone: 'stone', tower: 'tower', band: 'red', door: 'door', window: 'window', iron: 'iron', glass: 'glass', lamp: 'lamp', dome: 'red', house: 'house', roof: 'roof',
  hull: 'hull', cabin: 'cabin', mast: 'wood', gull: 'gull', beam: 'beam' };
export const fam = (o) => FAM[o.userData.part] ?? 'tower';
export const BUILT = new Set(['stone', 'tower', 'red', 'door', 'window', 'iron', 'glass', 'lamp', 'house', 'roof', 'hull', 'cabin', 'wood']);
const FID = { sky: 1, cloud: 2, ridge: 3, water: 4, foam: 5, spray: 6, cliff: 7, rock: 8, grass: 9, stone: 10, tower: 11, red: 12, door: 13, window: 14, iron: 15, glass: 16, lamp: 17, house: 18, roof: 19, hull: 20, cabin: 21, wood: 22, gull: 23 };
// GLSL every look gets: the family (FM), two colours, a number (KK), the surface size in metres (MET), a per-object random (LH), BAND = a stripe of the tower
export const GL = `uniform float FM, KK, LH, BAND; uniform vec3 C0, C1; uniform vec2 MET; vec3 SKYE = vec3(0.0);
  ${Object.entries(FID).map(([k, v]) => `#define F_${k.toUpperCase()} ${v.toFixed(1)}`).join('\n')}
  bool isF(float k) { return abs(FM - k) < 0.5; }
  float skyT(vec3 w) { return clamp(w.y / 3.2, 0.0, 1.0); }
  vec2 tri(vec3 p, vec3 n) { return abs(n.y) > 0.7 ? p.xz : abs(n.x) > 0.7 ? p.zy : p.xy; }
  float bev(float d) { return d >= 0.0 ? -(1.0 - smoothstep(0.0, 0.0022, d)) : -smoothstep(-0.0004, 0.0, d); }`;
export const beamsOf = (scene) => { const b = []; scene.traverse((o) => { if (o.userData.kind === 'beam') b.push(o); }); return b; };
// spec: { id, T: {family: [c0, c1?, kk?]}, physical, mat(f, d, c0, c1) -> material options, env: [cards, walls, blur], beam: [c, k, p, solid], lamp: [colour, strength],
//         defs, color, height, rough, metal, emis, last, on(ctx), post: { frag, U } }
export function look(spec) {
  return (ctx) => {
    const { scene, renderer, size: [W, H] } = ctx, env = spec.env ? studio(renderer, ...spec.env) : null, ms = meshes(scene), B = beamsOf(scene), bm = spec.beam ? beamMat(...spec.beam) : null;
    const LC = new THREE.Color(spec.lamp?.[0] ?? '#ffe6a8').multiplyScalar(spec.lamp?.[1] ?? 4);
    const mk = (o) => { const d = o.userData, f = fam(o), t = spec.T[f] ?? (f === 'spray' ? spec.T.foam : null) ?? spec.T.tower, c0 = t[0], c1 = t[1] ?? t[0], kk = t[2] ?? 0, sky = f === 'sky';
      const M = new (spec.physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({ roughness: sky ? 1 : 0.5, metalness: 0, envMap: env, envMapIntensity: sky ? 0 : 1, side: d.two ? THREE.DoubleSide : THREE.FrontSide, ...(spec.mat?.(f, d, c0, c1) ?? {}) });
      const met = metric(o) ?? [1, 1];
      return dressed(M, { id: spec.id, uniforms: { FM: { value: FID[f] ?? 11 }, KK: { value: kk }, LH: { value: hash(o.id * 1.37 + 0.5) }, BAND: { value: d.part === 'band' ? 1 : 0 }, C0: { value: new THREE.Color(c0) }, C1: { value: new THREE.Color(c1) }, MET: { value: new THREE.Vector2(...met) }, LAMPC: { value: LC } },
        defs: GL + 'uniform vec3 LAMPC;\n' + (spec.defs ?? ''), color: spec.color ?? '', height: spec.height ?? '', rough: spec.rough ?? '', metal: spec.metal ?? '', last: spec.last ?? '',
        emis: `${spec.emis ?? ''}\n totalEmissiveRadiance += SKYE; if (isF(F_LAMP)) totalEmissiveRadiance += LAMPC;` }); };
    let render; if (spec.post) { const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }), out = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false }), q = quad(spec.post.frag, { tex: { value: rt.texture }, ...(spec.post.U ?? {}) });
      render = (r, sc, cam) => { r.setRenderTarget(rt); r.setClearColor(0, 1); r.clear(); r.render(sc, cam); r.setRenderTarget(out); q.render(r); return out.texture; }; }
    return { shutter: spec.shutter, render, on() { for (const o of ms) o.material = o.userData['m_' + spec.id] ??= mk(o); for (const b of B) { b.visible = !!bm; if (bm) b.material = bm; } spec.on?.(ctx); } };
  };
}
