// Registers every lighthouse look with the style switch. 'beamtest' = the plain lit scene with the beams on (for judging the scene, not in the reel).
import { MAKE } from './styles5.js';
import { beamMat } from './dress.js';
import { beamsOf } from './kit5.js';
import { goldLook } from './l5/gold.js';
import { feltLook } from './l5/felt.js';
import { rustLook } from './l5/rust.js';
import { cyanLook } from './l5/cyan.js';
import { leatherLook } from './l5/leather.js';
import { beadLook } from './l5/bead.js';
import { lacquerLook } from './l5/lacquer.js';
import { sandLook } from './l5/sand.js';
import { wickerLook } from './l5/wicker.js';
import { gouacheLook } from './l5/gouache.js';
MAKE.beamtest = ({ scene, spot, bloom }) => { const bm = beamMat('#ffe9b8', 0.55, 1.4), B = beamsOf(scene);
  return { on() { for (const o of B) { o.visible = true; o.material = bm; } spot.intensity = 6; bloom.strength = 0.25; bloom.threshold = 1.0; } }; };
Object.assign(MAKE, { gold: goldLook, felt: feltLook, rust: rustLook, cyan: cyanLook, leather: leatherLook, bead: beadLook, lacquer: lacquerLook, sand: sandLook, wicker: wickerLook, gouache: gouacheLook });
