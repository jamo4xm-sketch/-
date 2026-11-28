# Ten looks: the "One scene. Ten looks." list reels

Five complete projects, one per reel. Each one is a 15 s vertical reel (1080×1920, 60 fps, silent) with a white
moving page, a numbered list of ten looks on the left, and the same scene re-dressed in each look on a card.
That makes 50 looks, all written in three.js shaders. There are no textures or image files: every grain, stitch,
tile and brush stroke is computed.

| folder | scene | the ten looks (id = name) |
| --- | --- | --- |
| `rocket/` | a rocket leaving a canyon launch site | chrome = Liquid Chrome, paper = Paper Cutout, neon = Neon Sign, clay = Soft Clay, thermal = Heat Map, blueprint = Blueprint, shadow = Shadow Puppet, voxel = Voxel Blocks, synth = Synthwave, toon = Cartoon Ink |
| `submarine/` | a small submarine coming out of a sunken ship's ribs | wool = Knitted Wool, glass = Stained Glass, bronze = Bronze, ink = Ink Wash, foil = Foil Balloon, woodcut = Woodcut, ice = Ice, oil = Oil Paint, lowpoly = Low Poly, points = Point Cloud |
| `railway/` | a steam train crossing a stone viaduct in a gorge | mosaic = Glazed Mosaic, origami = Origami, topo = Topographic Map, stitch = Cross Stitch, lava = Lava, porcelain = Porcelain, marquetry = Marquetry, riso = Riso Print, jade = Jade, charcoal = Charcoal |
| `lighthouse/` | a lighthouse on a headland at dusk, two beams turning, surf and a rocking boat | gold = Gold Leaf, felt = Felt, rust = Rust, cyan = Cyanotype, leather = Tooled Leather, bead = Beadwork, lacquer = Lacquer, sand = Sand Sculpture, wicker = Wicker, gouache = Gouache |
| `balloon/` | a hot-air balloon rising over a terraced hill town, the burner flaring once per look | lantern = Paper Lantern, feather = Featherwork, terrazzo = Terrazzo, denim = Denim, cork = Cork, marble = Marble, moss = Moss, concrete = Cast Concrete, tin = Punched Tin, sgraffito = Sgraffito (plus glass = Smoked Glass, an extra that is not in the reel) |

The first comment line of each look file (`src/<look>.js`) says exactly what the look does. Read it before you change one.

## Setup (once per folder)

Needs Node 18+, ffmpeg and Google Chrome.

```bash
cd recipes/ten-looks/railway        # or rocket / submarine / lighthouse / balloon
npm install                         # three 0.185.1, gsap, puppeteer-core
```

`render.mjs` uses the macOS Chrome path. On Windows or Linux, set `CHROME=/path/to/chrome` first.

## 1. Look at the looks (stills)

`looks.html` shows the scene full-card, one look after another, 1.25 s each. Look *i* starts at t = 1.25·i, and its
best frame is at t = 0.625 + 1.25·i.

```bash
node render.mjs --page=looks.html --query="looks=lava,jade,origami&n=8" --stills=0.625,1.875,3.125 --out=stills
```

`n` is the number of jittered samples per frame (anti-aliasing). Use 4 for quick checks and 8 for finals.

In a browser: run `npx http-server .` (or any static server) and open `looks.html?looks=lava`.

## 2. Render the whole reel

```bash
node render.mjs --query="n=8" --video --fps=60 --out=out/reel.mp4
```

The output is silent. Add your own music (one bar per look works well) with ffmpeg. Rendering takes minutes, not
seconds, because every frame averages `n` renders. Use `--from=0 --to=3` for a quick part.

## 3. Make your own

- **Another look on the same scene.** Copy the look file closest to what you want, rename it, change the colours
  and the pattern, and register it:
  - railway: in `src/looks4.js`;
  - lighthouse: in `src/looks5.js` (every look is one `look({...})` call, see `src/kit5.js`);
  - balloon: in `src/looks6.js` (the same factory, `src/kit6.js`);
  - submarine: in `src/styles3.js`;
  - rocket: in the `LOOK` table of `src/styles2.js`.
  
  Then put its id in `NAMES` in the reel file (`src/rail-reel.js`, `src/light-reel.js`, `src/balloon-reel.js`, `src/reel4.js` or `src/reel2.js`). Check stills
  before a video.
- **Your own scene in these looks.** Start from `railway/`: it is the cleanest engine for this, because its looks
  never name a train part directly. They key off two things:
  - each mesh's `userData.part`, mapped to a family by the `FAM` table in `src/kit4.js`;
  - the surface's own u and v in metres, for meshes built with `surf()` from `src/shapes3.js`.

  Replace the scene file `src/rail.js` with yours, keeping its `makeRail(canvas, W, H)` → `{ draw(t, look, n) }`
  shape. Build your parts with `surf()` and give every mesh a `part` that maps to an existing family (`body`,
  `dark`, `brass`, `steel`, `glass`, `stone`, `ground`, `sky`...). The ten looks then dress your scene with no
  change to the look files. Add a family only if a part really needs its own treatment. The lighthouse and balloon
  scenes use the same idea with their own family tables (`src/kit5.js`, `src/kit6.js`), and their looks are the
  shortest to read: a colour per family plus a few lines of GLSL. The submarine and rocket looks name their scene's
  parts directly, so treat them as examples to copy from, not drop-in engines.
- **Your own words.** The title, list and end card are plain HTML in `index.html` and the reel file.

## Rules that make these look good

- Every frame is a pure function of t, so a still at t = 4.2 equals frame 252 of the video. Never use `Date.now()` or
  `Math.random()` without a seed.
- Colours hard-coded in GLSL are linear, not sRGB. Convert hex values (c ≤ 0.04045 ? c/12.92 :
  ((c+0.055)/1.055)^2.4), or they render far too pale.
- Inside a loop over cells with branches, `fwidth()` draws the cell grid. Take one pixel width before the loop and
  use it inside.
- A shader with an error still renders, just wrong. After every change, read the log for `Shader Error` and
  `[pageerror]`.
- Judge every look at phone size: a look that only reads at full resolution doesn't read.

The fonts in `fonts/` (Space Grotesk, IBM Plex Mono) are under the SIL Open Font License.
