// Shared by the railway looks: the size of a surface in metres (round u, along v), and the part -> family table.
import { V } from './shapes3.js';
const P = V(0, 0, 0), Q = V(0, 0, 0);
// [metres round u, metres along v] of a surf() mesh, or null for merged / plain geometry
export function metric(o) { const d = o.userData; if (d.met !== undefined) return d.met; const sf = o.geometry.userData.surf; if (!sf) return (d.met = null);
  let circ = 0; for (const v of [0.2, 0.5, 0.8]) { let s = 0; sf.f(0, v, P); for (let i = 1; i <= 40; i++) { sf.f(i / 40, v, Q); s += P.distanceTo(Q); P.copy(Q); } circ = Math.max(circ, s); }
  let len = 0; for (const u of [0.1, 0.35, 0.6]) { let s = 0; sf.f(u, 0, P); for (let i = 1; i <= 40; i++) { sf.f(u, i / 40, Q); s += P.distanceTo(Q); P.copy(Q); } len = Math.max(len, s); } return (d.met = [Math.max(circ, 1e-3), Math.max(len, 1e-3)]); }
// families: what a look needs to know about a part
export const FAM = { boiler: 'body', cab: 'body', tender: 'body', cylinder: 'body', smokebox: 'dark', chimney: 'dark', frame: 'dark', roof: 'dark', lampbox: 'dark', coal: 'coal', wheel: 'red', spoke: 'red', beam: 'red',
  trim: 'brass', dome: 'brass', tyre: 'steel', hub: 'steel', rod: 'steel', buffer: 'steel', rail: 'steel', window: 'glass', lamp: 'lamp', lining: 'cream', panel: 'cream', coach: 'coach',
  smoke: 'smoke', sky: 'sky', ridge: 'ridge', ground: 'ground', creek: 'water', rock: 'rock', pine: 'pine', trunk: 'trunk', stone: 'stone', arch: 'arch', parapet: 'arch', ballast: 'ballast', sleeper: 'sleeper' };
export const fam = (o) => FAM[o.userData.part] ?? 'body';
export const TRAIN = new Set(['body', 'dark', 'coal', 'red', 'brass', 'steel', 'glass', 'lamp', 'cream', 'coach']);
