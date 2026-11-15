// The front/back body figure: silhouette, tracked regions, zoom, and the small status thumbnail.
import { ST } from './primitives.js';
import { REG, regSt } from '../data/measures.js';
import { radOk } from '../data/radiation.js';
import { S } from '../state.js';

export function thumb(keys, big) {
  if (!keys || !keys.length) return big ? '' : '<span class="inline-block w-4 shrink-0"></span>';
  const rad = keys.includes('rad'),
    sw = big ? 1 : 5,
    pw = big ? 0.9 : 4;
  let s = `<svg viewBox="${big ? '30 0 140 400' : '40 0 120 400'}" class="${big ? 'mx-auto block h-auto w-full' : 'block h-[52px] w-4 shrink-0'}" aria-hidden="true" focusable="false"><path d="${SILHOUETTE}" style="fill:hsl(0 0% 12%);stroke:${rad ? `hsl(${STC2[regSt('rad')]})` : 'hsl(var(--muted-foreground))'};stroke-opacity:${rad ? 0.9 : 0.45};stroke-width:${sw}"/>`;
  FIG_PARTS.filter((p) => p[0] === 0 && keys.includes(p[1])).forEach(([, k, , d]) => {
    const c = `hsl(${STC2[regSt(k)]})`;
    s += `<path d="${d}" style="fill-rule:evenodd;fill:${c};fill-opacity:.5;stroke:${c};stroke-width:${pw}"/>`;
  });
  return s + '</svg>';
}
/* ---------- body map ---------- */
/* Original figure for ASTRAVIA. One smooth silhouette per face (200 × 440), drawn from a right-half
   point list mirrored to the left and smoothed with Catmull-Rom. Only systems with data get detail. */
const FIG_W = 200,
  FIG_H = 400,
  FULLF = [0, 0, FIG_W, FIG_H];
const HALF = [
  [100, 7],
  [111, 9],
  [118, 18],
  [121, 32],
  [119, 46],
  [114, 57],
  [108, 64],
  [108, 72],
  [120, 77],
  [134, 81],
  [143, 88],
  [148, 99],
  [151, 116],
  [154, 136],
  [157, 154],
  [161, 173],
  [164, 190],
  [168, 199],
  [168, 211],
  [163, 219],
  [157, 215],
  [155, 201],
  [152, 191],
  [146, 172],
  [141, 152],
  [139, 133],
  [136, 114],
  [135, 126],
  [132, 147],
  [129, 165],
  [133, 184],
  [136, 204],
  [137, 229],
  [135, 257],
  [131, 283],
  [133, 306],
  [131, 332],
  [126, 359],
  [125, 371],
  [133, 383],
  [131, 391],
  [113, 391],
  [110, 382],
  [112, 366],
  [112, 340],
  [110, 312],
  [110, 287],
  [108, 257],
  [105, 228],
  [100, 213],
];
function smoothClosed(pts) {
  const n = pts.length,
    P = (i) => pts[(i + n) % n];
  let d = `M${P(0)[0]} ${P(0)[1]}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
      c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d + 'Z';
}
export const SILHOUETTE = smoothClosed(
  HALF.concat(
    HALF.slice(1, -1)
      .reverse()
      .map(([x, y]) => [FIG_W - x, y]),
  ),
);
const mirror = (pts) => pts.map(([x, y]) => [FIG_W - x, y]);
const blob = (pts) => smoothClosed(pts);
/* Region shapes: [face, system, name, path]. */
const LUNG_R = [
  [103, 86],
  [113, 84],
  [121, 92],
  [124, 110],
  [124, 128],
  [118, 136],
  [108, 133],
  [104, 120],
  [104, 100],
];
const QUAD_R = [
  [103, 214],
  [114, 210],
  [126, 214],
  [130, 232],
  [127, 256],
  [121, 272],
  [112, 274],
  [106, 262],
  [103, 238],
];
const HAM_R = [
  [103, 216],
  [115, 212],
  [127, 218],
  [129, 240],
  [125, 262],
  [117, 276],
  [109, 274],
  [104, 256],
  [102, 234],
];
const CALF_R = [
  [107, 294],
  [116, 290],
  [125, 296],
  [128, 314],
  [124, 334],
  [117, 348],
  [111, 344],
  [107, 326],
  [105, 308],
];
const PELVIS =
  'M100 170 C112 166 124 166 129 174 C133 182 130 194 122 200 C116 204 110 202 106 206 C103 209 101 212 100 212 C99 212 97 209 94 206 C90 202 84 204 78 200 C70 194 67 182 71 174 C76 166 88 166 100 170 Z M88 186 C92 182 96 186 94 192 C91 196 86 192 88 186 Z M112 186 C108 182 104 186 106 192 C109 196 114 192 112 186 Z';
const HEART =
  'M100 104 C100 98 108 96 111 101 C114 96 122 98 121 106 C120 114 111 119 108 124 C104 119 100 112 100 104 Z';
const VERT = Array.from({ length: 15 }, (_, i) => {
  const y = 72 + i * 8.6,
    w = 5 + Math.min(i, 10) * 0.25;
  return `M${(100 - w / 2).toFixed(2)} ${y.toFixed(1)}h${w.toFixed(2)}a1.6 1.6 0 0 1 1.6 1.6v3.4a1.6 1.6 0 0 1 -1.6 1.6h-${w.toFixed(2)}a1.6 1.6 0 0 1 -1.6 -1.6v-3.4a1.6 1.6 0 0 1 1.6 -1.6z`;
}).join('');
const FIG_PARTS = [
  [0, 'head', 'Head', 'M100 11 C112 11 119 22 119 35 C119 48 111 59 100 59 C89 59 81 48 81 35 C81 22 88 11 100 11 Z'],
  [
    0,
    'eyes',
    'Eyes',
    'M89 34 C91 32 95 32 97 34 C95 36 91 36 89 34 Z M103 34 C105 32 109 32 111 34 C109 36 105 36 103 34 Z',
  ],
  [0, 'heart', 'Right lung', blob(mirror(LUNG_R))],
  [0, 'heart', 'Left lung', blob(LUNG_R)],
  [0, 'heart', 'Heart', HEART],
  [0, 'bones', 'Pelvis', PELVIS],
  [0, 'muscles', 'Right thigh (front)', blob(mirror(QUAD_R))],
  [0, 'muscles', 'Left thigh (front)', blob(QUAD_R)],
  [1, 'head', 'Head', 'M100 11 C112 11 119 22 119 35 C119 48 111 59 100 59 C89 59 81 48 81 35 C81 22 88 11 100 11 Z'],
  [1, 'bones', 'Spine', VERT],
  [1, 'muscles', 'Left hamstring', blob(mirror(HAM_R))],
  [1, 'muscles', 'Right hamstring', blob(HAM_R)],
  [1, 'muscles', 'Left calf', blob(mirror(CALF_R))],
  [1, 'muscles', 'Right calf', blob(CALF_R)],
];
let vbF = [FULLF.slice(), FULLF.slice()];
export function resetFigure() {
  vbF = [FULLF.slice(), FULLF.slice()];
}
const FACE_SPINE_HIT = 'M93 70 H107 V204 H93 Z';
export function faceSvg(face) {
  const sel = S.region,
    isRad = sel === 'rad';
  const sil = isRad ? (radOk() ? 'hsl(8 30% 13%)' : 'hsl(8 60% 17%)') : 'hsl(0 0% 12%)';
  const edge = isRad ? 'hsl(var(--alert))' : 'hsl(var(--muted-foreground))';
  let s = `<svg data-face="${face}" viewBox="${vbF[face].join(' ')}" class="block h-auto w-full" role="img" aria-label="${face ? 'Back' : 'Front'} view of the body">
    <defs><pattern id="hatch${face}" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6 L6 0" style="stroke:hsl(var(--muted-foreground));stroke-opacity:.08;stroke-width:.6"/></pattern></defs>
    <path d="${SILHOUETTE}" aria-hidden="true" style="pointer-events:none;fill:${sil};stroke:${edge};stroke-opacity:${isRad ? 0.9 : 0.45};stroke-width:1${isRad ? ';filter:drop-shadow(0 0 6px hsl(var(--alert)))' : ''}"/>
    <path d="${SILHOUETTE}" aria-hidden="true" style="pointer-events:none;fill:url(#hatch${face})"/>
    <line x1="100" y1="66" x2="100" y2="${face ? 68 : 205}" aria-hidden="true" style="stroke:hsl(var(--muted-foreground));stroke-opacity:.18;stroke-width:.6;stroke-dasharray:2 3"/>`;
  FIG_PARTS.filter((p) => p[0] === face).forEach(([, k, name, d]) => {
    const c = `hsl(${STC2[regSt(k)]})`,
      on = sel === k,
      dim = (sel && !on) || isRad;
    const tip = `${name} · ${REG[k].name} · ${(ST[regSt(k)] || [''])[0]}`;
    s += `<path d="${d}" data-act="part" data-v="${k}" data-sys="${k}" data-tip="${tip}" style="cursor:pointer;fill-rule:evenodd;fill:${c};fill-opacity:${on ? 0.5 : dim ? 0.08 : 0.26};stroke:${c};stroke-opacity:${dim ? 0.35 : 1};stroke-width:${on ? 1.4 : 0.9}${on ? ';filter:drop-shadow(0 0 4px ' + c + ')' : ''}"/>`;
    if (name === 'Eyes')
      s += `<path d="M85 29 H115 V40 H85 Z" data-act="part" data-v="eyes" data-sys="eyes" data-tip="${tip}" style="cursor:pointer;fill:transparent"/>`;
    if (name === 'Spine')
      s += `<path d="${FACE_SPINE_HIT}" data-act="part" data-v="bones" data-sys="bones" data-tip="${tip}" style="cursor:pointer;fill:transparent"/>`;
  });
  return s + '</svg>';
}
const zoomBoxCache = {};
function sysBox(svg, k) {
  const els = [...svg.querySelectorAll(`[data-sys="${k}"]`)];
  if (!els.length) return null;
  const bs = els.map((e) => e.getBBox());
  const x0 = Math.min(...bs.map((b) => b.x)),
    y0 = Math.min(...bs.map((b) => b.y)),
    x1 = Math.max(...bs.map((b) => b.x + b.width)),
    y1 = Math.max(...bs.map((b) => b.y + b.height));
  return [x0, y0, x1 - x0, y1 - y0];
}
function zoomTarget(face, svg) {
  const k = S.region;
  if (!k || k === 'rad') return FULLF;
  let bx = sysBox(svg, k);
  if (bx) zoomBoxCache[k] = bx;
  else bx = zoomBoxCache[k];
  if (!bx) return FULLF;
  const A = FIG_W / FIG_H;
  let W = Math.max(bx[2] * 1.6, bx[3] * 1.4 * A, 56),
    H = W / A;
  return [bx[0] + bx[2] / 2 - W / 2, bx[1] + bx[3] / 2 - H / 2, W, H];
}
export const STC2 = {
  ok: 'var(--ok)',
  watch: 'var(--warn)',
  alert: 'var(--alert)',
  nodata: 'var(--muted-foreground)',
  info: 'var(--info)',
};
export function bodyZoom() {
  const D = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 520,
    ease = (t) => 1 - Math.pow(1 - t, 3);
  [0, 1].forEach((fc) => {
    const svg = document.querySelector(`svg[data-face="${fc}"]`);
    if (!svg) return;
    const to = zoomTarget(fc, svg),
      from = vbF[fc].slice(),
      t0 = performance.now();
    const step = (now) => {
      const t = D ? Math.min(1, (now - t0) / D) : 1,
        e = ease(t);
      vbF[fc] = from.map((v, i) => v + (to[i] - v) * e);
      svg.setAttribute('viewBox', vbF[fc].join(' '));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
