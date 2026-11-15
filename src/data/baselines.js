// Baseline tables used by the baseline review and My account.
// DISCLAIMER: Synthetic demonstration data. Not real astronaut medical data.
import { ctx } from './env.js';
import { LONG } from './longterm.js';

/* ---------- baselines ---------- */
/* All baseline values are SIMULATED. The re-set rules are product assumptions. */
const BASE = [
  {
    id: 'sleep',
    n: 'Sleep',
    pre: '7.4 h',
    tr: '6.8 h',
    su: '7.2 h',
    diff: '0.2 h less',
    diffZ: '0.6 h less',
    chk: 'Within the expected range',
  },
  {
    id: 'cardio',
    n: 'Resting heart rate',
    pre: '54 bpm',
    tr: '56 bpm',
    su: '58 bpm',
    diff: '4 bpm higher',
    diffZ: '2 bpm higher',
    chk: 'Within the expected range',
  },
  {
    id: 'bp',
    n: 'Blood pressure',
    pre: '122/78',
    tr: '112/72',
    su: '118/76',
    diff: '4/2 mmHg lower',
    diffZ: '10/6 mmHg lower',
    chk: 'Within the expected range',
  },
  {
    id: 'spo2',
    n: 'SpO₂',
    pre: '98%',
    tr: '97%',
    su: '97%',
    diff: '1 point lower',
    diffZ: '1 point lower',
    chk: 'Expected on a reduced-pressure cabin',
  },
  {
    id: 'cog',
    n: 'Reaction time (PVT-B)',
    pre: '258 ms',
    tr: '270 ms',
    su: '265 ms',
    diff: '7 ms slower',
    diffZ: '12 ms slower',
    chk: 'Within the expected range',
  },
  {
    id: 'bal',
    n: 'Balance sway area',
    pre: '2.9 cm²',
    tr: 'Not testable in 0 g',
    su: '3.8 cm²',
    diff: '31% more sway',
    diffZ: '',
    chk: 'Outside the expected range',
    flag: true,
  },
];
export const baseRows = () => BASE.filter((b) => !(ctx().zero && b.id === 'bal'));
export const nowCol = (b) => (ctx().zero ? b.tr : b.su);
export const fixedRows = () => LONG.map((L) => [L.name, L.sum]);
export const HRW = {
  pre: [54, 55, 54, 53, 54, 54, 53, 54],
  tr: [58, 57, 56, 56, 55, 56, 56, 57, 56, 55, 56, 56, 57, 56, 56, 55, 56, 57, 56, 56, 56, 57, 56, 55, 56, 56],
  su: [62, 60, 58, 58, 57, 58, 59, 58, 60],
  z: [58, 57, 56, 56, 55, 56, 56, 57, 56, 57, 58, 60, 61],
};
