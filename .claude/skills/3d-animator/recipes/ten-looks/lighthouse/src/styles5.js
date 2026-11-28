// The looks of the lighthouse. setStyle(name, ctx) dresses every mesh of the scene (the beams stay hidden unless a look shows them); a look that needs its own passes returns { render(renderer, scene, camera) -> texture }.
import * as THREE from 'three';
export const SKY = { time: { value: 0 }, focus: { value: new THREE.Vector3() }, lamp: { value: new THREE.Vector3() }, target: { value: new THREE.Vector3() } };
export const MAKE = {};   // name -> look factory, filled by looks5.js
const made = {}, saved = {};
export function setStyle(name, ctx) {
  const { scene, key, fill, amb, spot, bloom, grade } = ctx;
  if (!saved.key) Object.assign(saved, { key: key.intensity, keyC: key.color.clone(), fill: fill.intensity, fillC: fill.color.clone(), amb: amb.intensity, ambC: amb.color.clone(), bg: scene.background.clone() });
  key.intensity = saved.key; key.color.copy(saved.keyC); fill.intensity = saved.fill; fill.color.copy(saved.fillC); scene.background.copy(saved.bg); amb.intensity = saved.amb; amb.color.copy(saved.ambC); spot.intensity = 0; bloom.strength = 0.05; bloom.threshold = 0.9; bloom.radius = 0.45; grade.graphic.value = 0; grade.ex.value = 1; grade.vig.value = 0.12;
  scene.traverse((o) => { if (!o.isMesh) return; if (o.userData.styleAux) { o.visible = false; return; } o.userData.lit ??= o.material; o.material = o.userData.lit; o.visible = o.userData.kind !== 'beam'; });
  const make = MAKE[name]; if (!make) return {};
  made[name] ??= make({ ...ctx, SKY }); made[name].on?.(); return made[name];
}
