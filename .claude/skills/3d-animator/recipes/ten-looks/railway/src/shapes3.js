// Parametric surfaces for the dive scene. Every part is P(u, v): u runs round it, v along it. Looks that lay things ON a surface (stitches, tiles, panes) walk the same u and v.
import * as THREE from 'three';
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const E = 1e-3, A = V(), B = V(), C = V(), D = V();
export function normalAt(f, u, v, out, flip) {
  for (const vv of [v, v < 0.5 ? v + 0.02 : v - 0.02, v < 0.5 ? v + 0.06 : v - 0.06]) { f(u + E, vv, A); f(u - E, vv, B); f(u, vv + E, C); f(u, vv - E, D); A.sub(B); C.sub(D); out.crossVectors(A, C); if (out.lengthSq() > 1e-16) break; }
  out.normalize(); return flip ? out.negate() : out;
}
// f(u, v, target). Returns a geometry that remembers its own function.
export function surf(f, nu = 40, nv = 28, { flip = false, closed = true } = {}) {
  if (closed) { let sum = 0; const c = V(), p = V(), n = V(), M = 14; for (let j = 1; j < 10; j++) { c.set(0, 0, 0); for (let i = 0; i < M; i++) c.add(f(i / M, j / 10, p)); c.divideScalar(M); for (let i = 0; i < M; i++) { f(i / M, j / 10, p); normalAt(f, i / M, j / 10, n, false); sum += n.dot(p.clone().sub(c)); } } flip = sum < 0; }
  const P = new Float32Array((nu + 1) * (nv + 1) * 3), N = new Float32Array(P.length), T = new Float32Array((nu + 1) * (nv + 1) * 2), I = [], p = V(), n = V(); let k = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++, k++) { const u = i / nu, v = j / nv; f(u, v, p); P.set([p.x, p.y, p.z], k * 3); normalAt(f, u, v, n, flip); N.set([n.x, n.y, n.z], k * 3); T.set([u, v], k * 2); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; flip ? I.push(a, c, b, b, c, d) : I.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.BufferAttribute(T, 2)); g.setIndex(I); g.userData.surf = { f, flip, closed }; return g;
}
export const ball = (a, b = a, c = a, nu = 40, nv = 26) => surf((u, v, o) => { const th = v * Math.PI, ph = u * 2 * Math.PI, s = Math.sin(th); return o.set(a * s * Math.sin(ph), b * Math.cos(th), c * s * Math.cos(ph)); }, nu, nv, { flip: true });
export const ringG = (R, r, nu = 18, nv = 64) => surf((u, v, o) => { const a = u * 2 * Math.PI, b = v * 2 * Math.PI, q = R + r * Math.cos(a); return o.set(q * Math.cos(b), q * Math.sin(b), r * Math.sin(a)); }, nu, nv, { flip: true });
// a box with soft edges: a sphere pushed out to a p-norm
export const rbox = (w, h, d, p = 7, nu = 48, nv = 30) => surf((u, v, o) => { const th = v * Math.PI, ph = u * 2 * Math.PI, s = Math.sin(th), x = s * Math.sin(ph), y = Math.cos(th), z = s * Math.cos(ph), k = Math.pow(Math.abs(x) ** p + Math.abs(y) ** p + Math.abs(z) ** p, -1 / p); return o.set(x * k * w / 2, y * k * h / 2, z * k * d / 2); }, nu, nv, { flip: true });
// turned on a lathe round y (pts bottom to top as [r, y])
export function turn(pts, nu = 48, nv = 40) { const c = new THREE.CatmullRomCurve3(pts.map(([r, y]) => V(r, y, 0)), false, 'centripetal'); c.arcLengthDivisions = 400; const q = V(); return surf((u, v, o) => { c.getPointAt(Math.min(1, Math.max(0, v)), q); const a = u * 2 * Math.PI, r = Math.max(0, q.x); return o.set(r * Math.sin(a), q.y, r * Math.cos(a)); }, nu, nv); }
// a tube or blade along a path: rx across, rz through (functions of v), rounded ends
export function blade(path, rx, rz = rx, { nu = 22, nv = 48, up = V(0, 0, 1), cap = 0.06, twist = null } = {}) {
  const c = new THREE.CatmullRomCurve3(path, false, 'centripetal'); c.arcLengthDivisions = 300; const M = 160, fr = [], t = V(), n = up.clone(), b = V();
  for (let i = 0; i <= M; i++) { c.getTangentAt(i / M, t); n.addScaledVector(t, -n.dot(t)).normalize(); b.crossVectors(t, n).normalize(); fr.push([n.clone(), b.clone()]); }
  const q = V(), n2 = V(), b2 = V(), fx = typeof rx === 'function' ? rx : () => rx, fz = typeof rz === 'function' ? rz : () => rz;
  const f = (u, v, o) => { const w = Math.min(1, Math.max(0, v)), k = w * M, i = Math.min(M - 1, Math.floor(k)), m = k - i; c.getPointAt(w, q); n2.copy(fr[i][0]).lerp(fr[i + 1][0], m).normalize(); b2.copy(fr[i][1]).lerp(fr[i + 1][1], m).normalize();
    let e = 1; if (cap > 0) { const d = Math.min(w, 1 - w); if (d < cap) e = Math.sqrt(Math.max(0, 1 - ((cap - d) / cap) ** 2)); } const a = u * 2 * Math.PI + (twist ? twist(w) : 0); return o.copy(q).addScaledVector(b2, Math.cos(a) * fx(w) * e).addScaledVector(n2, Math.sin(a) * fz(w) * e); };
  return surf(f, nu, nv, { flip: true });
}
// a star-shaped outline blown up like a cushion: out(a) -> radius, for a turn a in radians
export const cushion = (out, th, nu = 64, nv = 22) => surf((u, v, o) => { const a = u * 2 * Math.PI, r = out(a), s = Math.sin(Math.PI * v); return o.set(Math.cos(a) * r * s, Math.sin(a) * r * s, th * Math.cos(Math.PI * v)); }, nu, nv);
