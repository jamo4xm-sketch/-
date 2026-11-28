// SAND SCULPTURE. Everything that stands is carved from packed sand: speckled grains, carved ledges stepping down the cliffs, tool scrapes, grooves round the tower's stripes,
// dark windows cut into the walls, damp umber sand along the waterline. Real water, a muted ultramarine sky, hard low sun.
import { look } from '../kit5.js';
export const sandLook = look({ id: 'sand',
  T: { sky: ['#1b2565', '#5d6aa6'], ridge: ['#3a4478', '#4a5488'], water: ['#0f2448', '#173564'], foam: ['#eef2f4', '#ffffff'], cliff: ['#c9a46c', '#dcb880'], rock: ['#c29c64', '#d6b07a'], grass: ['#cba872', '#dab884'], stone: ['#c8a46c', '#d4b078'],
    tower: ['#d6b27a', '#e4c28a'], red: ['#c39a62', '#cfa66c'], door: ['#5a4024'], window: ['#3a2814'], iron: ['#c09a62', '#cca66c'], glass: ['#b8935c', '#c49e66'], house: ['#d2ae76', '#e0bc84'], roof: ['#bc955c', '#c8a066'],
    hull: ['#cba670', '#d8b47c'], cabin: ['#d6b27a', '#e2c088'], wood: ['#bf9860'], gull: ['#f4f2ee'] },
  mat: (f) => ({ roughness: f === 'water' ? 0.06 : 0.96, envMapIntensity: f === 'water' ? 1.0 : f === 'sky' ? 0 : 0.25 }),
  env: [[['#ffe6c8', 3, 4.0, 1.0, -2.6, 2.6, 2.6], ['#c0ccff', 1.5, 6.0, 2.0, 0.0, 3.0, -3.0]], ['#5d6aa6', '#3a4478', '#1a1a20'], 0.03],
  beam: ['#ffe8c0', 0.3, 1.5], lamp: ['#ffd890', 4.5],
  defs: `float SD; bool sandy() { return !(isF(F_SKY) || isF(F_WATER) || isF(F_FOAM) || isF(F_SPRAY) || isF(F_GULL) || isF(F_LAMP) || isF(F_RIDGE)); }
    float ledge(vec3 w) { return w.y / 0.022 + 0.28 * fbm(w.xz * 10.0); }`,
  color: `{ vec2 q = tri(vOP, vON); vec3 c = mix(C0, C1, fbm(q * 30.0 + LH * 5.0));
    if (sandy()) { c *= 0.84 + 0.30 * h21(floor(q * 1100.0)); c *= 0.9 + 0.12 * vn(q * 300.0); SD = smoothstep(0.05, 0.0, vWP.y); c = mix(c, c * S(0.62, 0.48, 0.38) * 0.7, SD);
      if (isF(F_CLIFF) || isF(F_ROCK) || isF(F_STONE)) c *= 0.85 + 0.2 * smoothstep(0.0, 0.2, fract(ledge(vWP))); }
    if (isF(F_SKY)) { SKYE = mix(C1, C0, smoothstep(0.0, 0.85, skyT(vWP))); c = vec3(0.0); }
    if (isF(F_WATER)) c = mix(C0, C1, fbm(vWP.xz * 4.0));
    diffuseColor.rgb = c; }`,
  rough: 'roughnessFactor = isF(F_WATER) ? 0.06 : sandy() ? mix(0.96, 0.6, SD) : roughnessFactor;',
  height: `if (!sandy()) return 0.0; vec2 q = tri(o, vON); float h = 0.00006 * (vn(q * 1600.0) + vn(q * 650.0));
    if (isF(F_CLIFF) || isF(F_ROCK) || isF(F_STONE)) { h -= 0.0012 * (1.0 - fract(ledge(w))); h += 0.00015 * sin(dot(w.xz, vec2(310.0, 170.0)) + w.y * 120.0 + 6.0 * fbm(w.xz * 20.0)); }
    if (BAND > 0.5) { vec2 m = uv * MET; float e = min(m.y, MET.y - m.y); h += 0.0008 * bev(e - 0.002); }
    if (isF(F_TOWER) || isF(F_HOUSE)) h += 0.00012 * sin(uv.y * MET.y * 900.0 + 3.0 * fbm(uv * MET * 40.0));
    return h;`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ffe6c0'); key.intensity = 3.6; fill.color.set('#8090c8'); fill.intensity = 0.25; amb.intensity = 0.12; spot.color.set('#ffe8c0'); spot.intensity = 3; bloom.strength = 0.1; grade.ex.value = 1.0; grade.vig.value = 0.15; } });
