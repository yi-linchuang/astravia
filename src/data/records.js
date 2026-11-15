// User entries (typed, tapped, photographed or wearable), sample wearable data, and lookups.
import { DISCLAIMER, SIM_ID, ctx } from './env.js';
import { FLOWS } from './flows.js';
import { judge } from './indicators.js';
import { S } from '../state.js';

export const pvtPass = () => {
  const e = todayE('cog');
  return !!e && judge('cog', e) === 'ok';
};
export const caseActive = () => ['active', 'followup', 'cmo'].includes(S.care.status);
export const caseBlocks = () => caseActive() && FLOWS[S.care.flow] && FLOWS[S.care.flow].blocksEva;
// ---------- recorded health data ----------
// Simulated wearable and self-check readings for the demo astronaut. Synthetic demonstration data. Not real astronaut medical data.
export const SAMPLE_INFO = { id: SIM_ID, disclaimer: DISCLAIMER };
export const SAMPLE = {
  sleep: [7.3, 7.2, 7.1, 7.0, 7.1, 6.9, 6.8, 6.6, 6.2, 5.9, 5.6, 5.5, 5.4, 5.5].map((h, i) => [
    i - 13,
    { h, q: h >= 6.8 ? 'Fairly' : 'Poorly' },
  ]),
  cardio: [56, 57, 56, 57, 58, 57, 58, 59, 58, 60, 62, 62, 63, 63].map((bpm, i) => [i - 13, { bpm }]),
  cog: [262, 268, 264, 263, 266, 264, 270, 281, 292, 301, 305, 308, 310].map((ms, i) => [i - 13, { ms }]),
  bp: [
    [-12, { sys: 116, dia: 75, spo2: 97 }],
    [-6, { sys: 118, dia: 77, spo2: 97 }],
  ],
  bal: [
    [-13, { sway: 3.7 }],
    [-6, { sway: 3.9 }],
  ],
  fit: [
    [-13, { pct: 94 }],
    [-6, { pct: 91 }],
  ],
  temp: [
    [-9, { c: 36.6 }],
    [-3, { c: 36.7 }],
  ],
  glu: [
    [-8, { mg: 88, ctx: 'Fasting' }],
    [-2, { mg: 93, ctx: 'Fasting' }],
  ],
  wt: [
    [-13, { kg: 68.2 }],
    [-6, { kg: 67.9 }],
  ],
};
export function loadSample() {
  Object.keys(SAMPLE).forEach((id) => {
    S.data[id] = S.data[id].filter((e) => e.src !== 'sample');
    SAMPLE[id].forEach(([d, v]) => {
      if (!S.data[id].some((e) => e.d === d)) S.data[id].push({ d, v, src: 'sample' });
    });
  });
  S.demo = true;
}
export function clearSample() {
  Object.keys(S.data).forEach((id) => {
    S.data[id] = S.data[id].filter((e) => e.src !== 'sample');
  });
  S.demo = false;
}
export const anyData = () => Object.values(S.data).some((a) => a.length);
export const sorted = (id) => S.data[id].slice().sort((a, b) => a.d - b.d);
export const latest = (id) => S.data[id].reduce((a, e) => (!a || e.d >= a.d ? e : a), null);
export const todayE = (id) => {
  const e = latest(id);
  return e && e.d === 0 ? e : null;
};
export function addEntry(id, v, multi) {
  if (!multi) S.data[id] = S.data[id].filter((e) => e.d !== 0);
  S.data[id].push({ d: 0, v, src: 'input' });
}
export const dayRel = (d) => (d === 0 ? 'today' : d === -1 ? 'yesterday' : `${-d} days ago`);
export const PHK = () => (ctx().zero ? 'zero' : 'surf');
export const BP_BASE = {
  pre: { sys: 122, dia: 78, spo2: 98 },
  zero: { sys: 112, dia: 72, spo2: 97 },
  surf: { sys: 118, dia: 76, spo2: 97 },
};
