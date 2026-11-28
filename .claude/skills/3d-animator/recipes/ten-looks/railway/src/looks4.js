// Registers every railway look with the style switch.
import { MAKE } from './styles4.js';
import { mosaicLook } from './mosaic.js';
import { stitchLook } from './stitch.js';
MAKE.mosaic = mosaicLook;
MAKE.stitch = stitchLook;
import { topoLook } from './topo.js';
import { lavaLook } from './lava.js';
import { porcelainLook } from './porcelain.js';
import { jadeLook } from './jade.js';
import { origamiLook } from './origami.js';
MAKE.topo = topoLook; MAKE.lava = lavaLook; MAKE.porcelain = porcelainLook; MAKE.jade = jadeLook; MAKE.origami = origamiLook;
import { marquetryLook } from './marquetry.js';
import { risoLook } from './riso.js';
import { charcoalLook } from './charcoal.js';
MAKE.marquetry = marquetryLook; MAKE.riso = risoLook; MAKE.charcoal = charcoalLook;
