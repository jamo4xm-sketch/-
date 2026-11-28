// The moving page, calm version: two long folds in a white sheet, drifting. Each fold is a trochoid (round on one side, a crease on the other) sliding along itself by exactly one wave per loop, so t and t+LOOP are the same picture. The printed dots are pulled towards the folds.
import * as THREE from 'three';
export const BG = { loop: 3.75, pitch: 43, dot: 2.6, dotInk: 0.070, page: [0.987, 0.987, 0.986], fold: 0.061, soft: 25, hard: 18, pull: 9, bend: 7 };
const K = 100, TAU = Math.PI * 2;
// o = a point on the fold's axis, dir = where it drifts (degrees, y down), wave = px per fold, amp = half width, lap = 0..1 how far it folds over, from/to = how many waves are drawn
export const FOLDS = [
  { o: [300, 120], dir: 116, wave: 640, amp: 118, lap: 0.78, from: -2.0, to: 1.0, ph: 0.15, win: [-400, 1, 360, 610] },
  { o: [760, 1660], dir: 110, wave: 700, amp: 138, lap: 0.78, from: -2.0, to: 1.0, ph: 0.62, win: [1330, 1560, 2300, 2301] },
];
export function makeSheet(canvas, W = 1080, H = 1920) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(W, H, false); r.outputColorSpace = THREE.LinearSRGBColorSpace;   // values below are already display values
  const pts = FOLDS.map(() => Array.from({ length: K }, () => new THREE.Vector3()));
  const u = { uT: { value: 0 }, uPitch: { value: BG.pitch }, uDot: { value: BG.dot }, uInk: { value: BG.dotInk }, uPage: { value: new THREE.Vector3(...BG.page) }, uFold: { value: BG.fold }, uSoft: { value: BG.soft }, uHard: { value: BG.hard }, uPull: { value: BG.pull }, uBend: { value: BG.bend }, uBoost: { value: 0 }, uOpen: { value: 0 },
    uA: { value: pts[0] }, uB: { value: pts[1] } };
  const mat = new THREE.ShaderMaterial({ uniforms: u, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 p; void main(){ p = uv * vec2(1080.0, 1920.0); gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `precision highp float; varying vec2 p; const float TAU = 6.28318530718; const int K = ${K};
    uniform float uT, uPitch, uDot, uInk, uFold, uSoft, uHard, uPull, uBend, uBoost, uOpen; uniform vec3 uPage, uA[K], uB[K];
    // one fold: the strongest of its pieces. xyz = shade, pull direction
    vec3 fold(vec2 q, vec3 P[K]) { float s = 0.0, best = 1e9; vec2 dv = vec2(0.0); float ba = 0.0;
      for (int i = 0; i < K - 1; i++) { vec2 a = P[i].xy, d = P[i + 1].xy - a; float h = clamp(dot(q - a, d) / max(dot(d, d), 1e-4), 0.0, 1.0); vec2 e = q - a - d * h; float L = length(e), al = mix(P[i].z, P[i + 1].z, h);
        float w = mix(uHard, uSoft, smoothstep(-1.0, 1.0, (d.x * e.y - d.y * e.x) / max(L * length(d), 1e-4)));                    // a touch softer on one side of the crease
        s = max(s, al * exp(-pow(L / w, 2.0) * 0.72)); if (L < best) { best = L; dv = e; ba = al; } }
      return vec3(s, -dv / max(best, 1.0) * ba * best / 60.0 * exp(-pow(best / 95.0, 2.0))); }
    vec2 ride(vec2 q){ vec2 s = q / 1080.0; float a = uT * TAU;                                     // and the whole sheet breathes a little
      return uBend * vec2( sin(TAU*(1.05*s.y + 0.30*s.x) - a) + 0.5*sin(TAU*(1.7*s.x - 0.8*s.y) + a + 1.7), sin(TAU*(1.15*s.x - 0.30*s.y) + a + 0.9) + 0.5*sin(TAU*(1.6*s.y + 0.7*s.x) - a + 3.1)); }
    void main(){
      vec2 q = vec2(p.x, 1920.0 - p.y); vec3 A = fold(q, uA), B = fold(q, uB);
      float shade = 1.0 - (1.0 - A.x) * (1.0 - B.x);
      vec2 w = q + ride(q) - uPull * 1.9 * (A.yz + B.yz);
      vec2 c = (fract(w / uPitch) - 0.5) * uPitch; float m = length(c) - uDot; float dotA = 1.0 - smoothstep(-0.9, 0.9, m);
      vec3 col = uPage - vec3(uFold) * shade * vec3(1.0, 0.985, 0.955);
      col = mix(col, col * (1.0 - uInk), dotA);
      if (uBoost > 0.5) col = clamp((col - vec3(0.843)) * 6.2, 0.0, 1.0);
      float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
      gl_FragColor = vec4(col + dither, 1.0);
    }` });
  const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const bend = (f, P, t, open) => { const rad = f.dir * Math.PI / 180, dx = Math.cos(rad), dy = Math.sin(rad), nx = -dy, ny = dx, B = f.lap * f.wave / TAU;
    for (let i = 0; i < K; i++) { const th0 = (f.from + (f.to - f.from) * i / (K - 1)) * TAU, th = th0 + f.ph * TAU, along = f.wave * (th0 / TAU + t) - B * Math.sin(th), side = -f.amp * Math.cos(th);   // slides one wave per loop
      const x = f.o[0] + dx * along + nx * side, y = f.o[1] + dy * along + ny * side, [y0, y1, y2, y3] = f.win, wave = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(th - 0.35)), win = ss(y0, y1, y) * (1 - ss(y2, y3, y));   // faded by place on the page, never by index: that is what makes the loop seamless
      P[i].set(x, y, wave * Math.max(win, open * 0.75)); } };
  const scene = new THREE.Scene(), cam = new THREE.Camera(); scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  return { u, draw(t, boost = 0, open = 0) { const k = (t / BG.loop) % 1; u.uT.value = k; u.uBoost.value = boost; FOLDS.forEach((f, i) => bend(f, pts[i], k, open)); r.render(scene, cam); } };
}
