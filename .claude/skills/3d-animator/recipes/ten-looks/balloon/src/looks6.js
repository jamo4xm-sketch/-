// Registers every balloon look with the style switch. 'lit' = the plain scene through the look factory (for judging the scene and the flare, not in the reel).
import { MAKE } from './styles6.js';
import { look } from './kit6.js';
import { C } from './balloon.js';
import { lanternLook } from './l6/lantern.js';
import { concreteLook } from './l6/concrete.js';
import { denimLook } from './l6/denim.js';
import { marbleLook } from './l6/marble.js';
import { featherLook } from './l6/feather.js';
import { terrazzoLook } from './l6/terrazzo.js';
import { mossLook } from './l6/moss.js';
import { corkLook } from './l6/cork.js';
import { glassLook } from './l6/glass.js';
import { sgraffitoLook } from './l6/sgraffito.js';
import { tinLook } from './l6/tin.js';
MAKE.lit = look({ id: 'lit', T: { sky: [C.sky], hill: [C.hill], ground: [C.ground], terrace: [C.terrace], wall: [C.wall], roof: [C.roof], chimney: [C.chimney], pot: [C.pot], window: [C.window], door: [C.door], shutter: [C.shutter],
  env: [C.env], tape: [C.rope], skirt: [C.skirt], rope: [C.rope], burner: [C.burner], basket: [C.basket], flame: [C.flame], pennant: [C.pennant], tree: [C.tree], trunk: [C.trunk], stone: [C.stone], bird: [C.bird] },
  mat: (f) => (f === 'sky' ? { emissive: C.sky, emissiveIntensity: 1.0, color: '#000000' } : f === 'hill' ? { roughness: 0.9 } : {}),
  // the envelope: alternating gore colours (red / cream), 16 gores
  defs: 'float gore(vec3 o) { return step(0.5, fract(atan(o.x, o.z) / 6.2831853 * 8.0 + 0.5)); }',
  color: 'diffuseColor.rgb = C0; if (isF(F_ENV)) diffuseColor.rgb = mix(C0, vec3(0.93, 0.89, 0.80), gore(vOP));' });
Object.assign(MAKE, { lantern: lanternLook, concrete: concreteLook, denim: denimLook, marble: marbleLook, feather: featherLook, terrazzo: terrazzoLook, moss: mossLook, cork: corkLook, glass: glassLook, sgraffito: sgraffitoLook, tin: tinLook });
