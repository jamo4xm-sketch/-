// LACQUER. Urushi: an oxblood tower and cottage under a deep clear coat, black lacquer stripes, dome, rocks and water, thin gold maki-e lines along the stripes,
// sparse gold dust on the black rock, mother-of-pearl inlay for the surf and the gulls. Long thin studio lights draw sharp lines along every curve.
import { look } from '../kit5.js';
export const lacquerLook = look({ id: 'lacq', physical: true,
  T: { sky: ['#020101', '#1a0705'], ridge: ['#0a0505', '#120808'], water: ['#020203'], foam: ['#e8eef0', '#ffffff', 2], cliff: ['#050505', '#0c0a09'], rock: ['#040404', '#0a0908'], grass: ['#05100a', '#081a0e'], stone: ['#060606'],
    tower: ['#6a130d', '#7e1a12'], red: ['#030303'], door: ['#030303'], window: ['#020202'], iron: ['#040404'], glass: ['#050505'], house: ['#64120c', '#741810'], roof: ['#030303'],
    hull: ['#030303'], cabin: ['#6a130d', '#7e1a12'], wood: ['#040404'], gull: ['#e8eef0', '#ffffff', 2] },
  mat: (f) => ({ roughness: 0.32, clearcoat: f === 'sky' ? 0 : 1, clearcoatRoughness: 0.025, envMapIntensity: f === 'sky' ? 0 : 1.0 }),
  env: [[['#ffffff', 14, 8.0, 0.05, -2.5, 2.0, 3.0], ['#ffffff', 10, 0.05, 6.0, 3.0, 1.5, 2.0], ['#fff2e0', 9, 10.0, 0.035, 0.0, 0.10, -4.0], ['#ffffff', 3, 2.0, 0.4, 1.0, 4.0, 1.0], ['#ffe8d0', 6, 0.05, 5.0, -3.2, 1.0, -1.0]], ['#040404', '#070606', '#020202'], 0.0],
  beam: ['#fff0d8', 0.34, 1.6], lamp: ['#ffdca0', 5],
  defs: `float GOLD;`,
  color: `{ vec3 c = mix(C0, C1, fbm3(vOP * 12.0)); GOLD = 0.0;
    if (BAND > 0.5) { vec2 m = vUvL * MET; float e = min(m.y, MET.y - m.y); GOLD = 1.0 - smoothstep(0.0008, 0.0014, abs(e - 0.0035)); }
    if (isF(F_CLIFF) || isF(F_ROCK)) { vec2 q = isF(F_CLIFF) ? vWP.xy + vWP.zz : tri(vOP, vON); GOLD = step(0.965, h21(floor(q / 0.0028))) * smoothstep(0.3, 0.7, fbm(q * 18.0)); }
    if (KK > 1.5) { vec2 a = wor(tri(vOP, vON) * 260.0); float fr = 1.0 - abs(dot(normalize(vWN), normalize(cameraPosition - vWP))); vec3 iri = 0.55 + 0.45 * cos(6.2832 * (fr * 1.3 + h21(floor(tri(vOP, vON) * 260.0)) * 0.6 + vec3(0.0, 0.33, 0.67)));
      c = mix(vec3(0.85), iri, 0.55) * (0.75 + 0.25 * smoothstep(0.02, 0.12, a.y - a.x)); }
    if (isF(F_SKY)) { SKYE = mix(C1, C0, smoothstep(0.0, 0.55, skyT(vWP))); c = vec3(0.0); }
    c = mix(c, S(0.86, 0.66, 0.28), GOLD); diffuseColor.rgb = c; }`,
  metal: 'metalnessFactor = GOLD;', rough: 'roughnessFactor = GOLD > 0.5 ? 0.25 : roughnessFactor;',
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#fff0e0'); key.intensity = 1.5; fill.color.set('#ffffff'); fill.intensity = 0.1; amb.intensity = 0.03; spot.color.set('#fff0d8'); spot.intensity = 4; bloom.strength = 0.2; bloom.threshold = 1.0; grade.ex.value = 1.1; grade.vig.value = 0.15; } });
