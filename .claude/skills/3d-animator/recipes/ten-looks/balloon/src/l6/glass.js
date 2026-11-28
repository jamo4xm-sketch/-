// SMOKED GLASS. Thick plum glass: the balloon is real glass, so the rooflines behind it bend at its edges; the houses are cast smoked glass blocks that hold the sky
// in their faces, every edge catching a narrow copper highlight; a near-black sky over glossy black glass slabs.
import * as THREE from 'three';
import { look } from '../kit6.js';
export const glassLook = look({ id: 'glass', physical: true, flare: 0.35, burn: 1.8,
  T: { sky: ['#050307', '#1b0f1e'], ground: ['#060507', '#0e0b10'], terrace: ['#0d0a0f', '#16111a'], wall: ['#3a1330', '#4a1a3c'], roof: ['#5a1a3c', '#6a2248'], chimney: ['#3e1532'], pot: ['#7a2a40'],
    window: ['#ff9a5a'], door: ['#1a0a14'], shutter: ['#2a0e22'], env: ['#b0407a', '#e8a8c0'], tape: ['#c87a4a'], skirt: ['#1a0a14'], rope: ['#c87a4a'], burner: ['#2a1a1a'], basket: ['#5a2a40'],
    flame: ['#ffb24e'], pennant: ['#9a3a6e', '#c87a4a'], tree: ['#1e0e1c', '#2a1428'], trunk: ['#1a0a14'], stone: ['#3a1330'], bird: ['#0a050a'] },
  mat: (f, d) => (f === 'sky' ? { roughness: 1 } : f === 'tape' || f === 'rope' ? { roughness: 0.38, metalness: 1.0, envMapIntensity: 0.7 } : f === 'env' && d.layer === 'bal'
    ? { roughness: 0.12, specularColor: new THREE.Color('#ff8a40'), specularIntensity: 1.0, envMapIntensity: 0.9 }
    : { roughness: f === 'ground' || f === 'terrace' ? 0.06 : 0.05, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.03, specularColor: new THREE.Color('#ffb080'), specularIntensity: 1.0, envMapIntensity: 1.6 }),
  env: [[['#ff7a28', 2.2, 0.14, 5, -3, 1.2, 1.8], ['#ff6a20', 1.2, 0.12, 4, 2.6, 2.4, 1.0], ['#b070a0', 0.5, 6, 2, 0, -2.5, 2]], ['#140a14', '#0a060a', '#030203'], 0.01],
  color: `{ vec3 c = C0; vec3 V = normalize(cameraPosition - vWP), N = normalize(vWN); float fr = pow(1.0 - abs(dot(N, V)), 2.0);
    if (isF(F_SKY)) { float t = skyT(vWP); c = mix(C1, C0, smoothstep(0.0, 0.8, t)); SKYE = c; c *= 0.0; }
    else if (isF(F_WINDOW)) { c = C0 * 0.4; }
    else if (isF(F_ENV)) { c = mix(C0, C1, gore()) * 0.14; }
    else if (isF(F_GROUND) || isF(F_TERRACE)) { vec2 g = abs(fract(vWP.xz / vec2(0.11, 0.07)) - 0.5) * vec2(0.11, 0.07); c *= 1.0 - 0.6 * aaLine(min(0.055 - g.x, 0.035 - g.y), 0.0006); }
    else { c = mix(c * 0.55, c * 1.8 + S(0.10, 0.02, 0.06), fr); c *= 0.9 + 0.15 * fbm(vOP.xy * 30.0 + LH * 5.0); }
    diffuseColor.rgb = c; }`,
  emis: `if (isF(F_WINDOW)) totalEmissiveRadiance += C0 * 0.9;
    // light seen through thick plum glass (no normal terms here: one seam has a degenerate world normal): a faint body glow, the burner filling it at each flare
    if (isF(F_ENV)) { vec3 tint = mix(C0, C1, gore()); totalEmissiveRadiance += tint * 0.03 + FLW * tint * vec3(1.0, 0.62, 0.40) * FLARE * (0.1 + 0.55 * exp(-max(vOP.y, 0.0) * 3.5)); }`,
  on({ key, fill, amb, spot, bloom, grade }) { key.color.set('#ff7e36'); key.intensity = 0.9; fill.color.set('#ff7a30'); fill.intensity = 0.05; amb.intensity = 0.05; spot.color.set('#ff9a50');
    bloom.strength = 0.1; bloom.threshold = 1.0; bloom.radius = 0.4; grade.ex.value = 1.15; grade.vig.value = 0.22; } });
