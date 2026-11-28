// The looks of the dive. setStyle(name, ctx) dresses every mesh of the scene; a look that needs its own passes returns { render(renderer, scene, camera) -> texture }.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { glassLook } from './glass.js';
import { woolLook } from './wool.js';
import { woodcutLook } from './woodcut.js';
import { inkLook } from './inkwash.js';
import { pointsLook } from './points.js';
import { lowpolyLook } from './lowpoly.js';
import { bronzeLook } from './bronze.js';
import { iceLook } from './ice.js';
import { foilLook } from './foil.js';
import { oilLook } from './oil.js';
export const SKY = { time: { value: 0 }, focus: { value: new THREE.Vector3() }, lamp: { value: new THREE.Vector3() }, target: { value: new THREE.Vector3() } };
const made = {}, saved = {};
export function setStyle(name, ctx) {
  const { scene, key, fill, amb, spot, bloom, grade } = ctx;
  if (!saved.key) Object.assign(saved, { key: key.intensity, keyC: key.color.clone(), fill: fill.intensity, fillC: fill.color.clone(), amb: amb.intensity, bg: scene.background.clone() });
  key.intensity = saved.key; key.color.copy(saved.keyC); fill.intensity = saved.fill; fill.color.copy(saved.fillC); scene.background.copy(saved.bg); amb.intensity = saved.amb; spot.intensity = 0; spot.angle = 0.26; spot.penumbra = 0.55; spot.color.set('#ffe2a0'); bloom.strength = 0.05; bloom.threshold = 0.9; bloom.radius = 0.45; grade.graphic.value = 0; grade.ex.value = 1; grade.vig.value = 0.12;
  scene.traverse((o) => { if (!o.isMesh) return; if (o.userData.styleAux) { o.visible = false; return; } o.userData.lit ??= o.material; o.material = o.userData.lit; o.visible = o.userData.kind !== 'beam'; });
  scene.traverse((o) => { if (o.userData.styleAux) o.visible = false; });
  const make = { glass: glassLook, wool: woolLook, woodcut: woodcutLook, ink: inkLook, points: pointsLook, lowpoly: lowpolyLook, bronze: bronzeLook, ice: iceLook, foil: foilLook, oil: oilLook }[name]; if (!make) { spot.intensity = 4; return {}; }
  made[name] ??= make({ ...ctx, SKY }); made[name].on?.(); return made[name];
}
