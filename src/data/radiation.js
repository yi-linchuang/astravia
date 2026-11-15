// Radiation data: NASA RadLab replay per environment, ISS dose series, alert logic, EVA dose rules.
import { REAL, REAL_S, infoI } from '../components/primitives.js';
import { BODIES, ctx, dayLab } from './env.js';
import { hm, r1 } from '../lib/util.js';
import { S } from '../state.js';

// REAL (NASA open data, replayed): RadLab hourly mean absorbed dose rate. The API returns no unit; the values match published levels in µGy/h.
// mars = Curiosity RAD on the Mars surface, 2024-05-20. moon = LRO CRaTER in lunar orbit, 2024-05-17 (stand-in for the lunar surface). cruise = ExoMars TGO Liulin-MO on its way to Mars, one quiet day in 2016.
const RADENV = {
  mars: [
    3.7, 3.9, 3.8, 4.0, 3.6, 93.9, 275.9, 221.1, 146.4, 93.8, 91.5, 91.0, 80.0, 63.0, 52.4, 45.2, 41.9, 35.8, 32.3,
    29.6, 28.0, 26.4, 24.0, 22.0,
  ],
  moon: [
    103.4, 99.1, 94.7, 109.1, 108.8, 108.6, 62.5, 63.4, 64.3, 74.7, 85.9, 97.2, 77.7, 70.3, 63.0, 50.5, 54.6, 35.5,
    30.4, 22.9, 19.4, 16.6, 16.1, 15.1,
  ],
  cruise: [
    14.9, 15.3, 15.2, 16.3, 15.3, 14.7, 15.1, 14.9, 15.1, 15.1, 15.4, 15.8, 15.0, 14.6, 15.1, 14.8, 16.2, 15.0, 15.3,
    15.1, 15.3, 15.3, 15.6, 15.1,
  ],
  cruiseDay: '2016-04-23',
};
export const ALERT = 50;
const STANDIN = infoI('NASA open data from lunar orbit, used here as a stand-in for the Moon');
export function radSrc() {
  const c = ctx();
  if (c.id === 'station') return null;
  if (c.id === 'vehicle')
    return {
      series: RADENV.cruise,
      usual: 15,
      kind: 'real',
      name: 'ExoMars TGO Liulin-MO, cruise to Mars',
      note: `A quiet day in space between Earth and Mars (${RADENV.cruiseDay}). Real data from an uncrewed spacecraft, with no solar event.`,
    };
  if (S.body === 'moon')
    return {
      series: RADENV.moon,
      usual: 7,
      kind: 'standin',
      name: 'LRO CRaTER, lunar orbit',
      note: 'The tail of the 15 May 2024 solar storm, measured in lunar orbit on 17 May 2024. It stands in for the lunar surface, where I found no instrument.',
    };
  return {
    series: RADENV.mars,
    usual: 4.2,
    kind: 'real',
    name: 'Curiosity RAD, Mars surface',
    note: 'The solar particle event of 20 May 2024, replayed hour for hour as today.',
  };
}
const radSeries = () => {
  const s = radSrc();
  return s ? s.series : null;
};
const radHour = () => Math.min(23, Math.floor(S.clock / 60));
export const radNow = () => {
  const s = radSeries();
  return s ? s[radHour()] : 0;
};
export const radOk = () => {
  const s = radSeries();
  if (!s) return true;
  const h = radHour();
  return s[h] < ALERT && (h === 0 || s[h - 1] < ALERT);
};
export const clearMin = () => {
  const s = radSeries();
  if (!s || Math.max(...s) < ALERT) return 0;
  for (let h = 1; h < 24; h++)
    if (s[h] < ALERT && s[h - 1] < ALERT && s.slice(h).every((v) => v < ALERT)) return h * 60;
  return 0;
};
export const radLabel = () => {
  const s = radSrc();
  return s && s.kind === 'standin' ? 'stand-in data' : 'replay of real data';
};
export const radBadge = () => {
  const s = radSrc();
  return s && s.kind === 'standin' ? STANDIN : REAL;
};
export const radBadgeS = () => {
  const s = radSrc();
  return s && s.kind === 'standin' ? '<span class="badge b-info">Stand-in</span>' : REAL_S;
};
// REAL (NASA open data, replayed): ISS daily radiation, OSDR Environmental Data App, mission RR-6, 2017-12-15 to 2018-02-01. Unit not stated in the file I read; values match typical ISS levels in mGy/day.
export const ISS_RAD = {
  total: [
    0.289, 0.287, 0.271, 0.261, 0.293, 0.306, 0.283, 0.277, 0.295, 0.29, 0.281, 0.273, 0.292, 0.284, 0.278, 0.292,
    0.294, 0.288, 0.285, 0.3, 0.284, 0.268, 0.27, 0.27, 0.298, 0.267, 0.288, 0.272, 0.303, 0.266, 0.28, 0.282, 0.291,
    0.277, 0.279, 0.285, 0.286, 0.271, 0.281, 0.286, 0.284, 0.274, 0.276, 0.282, 0.289, 0.273, 0.279, 0.277, 0.287,
  ],
  gcr: [
    0.165, 0.168, 0.166, 0.167, 0.165, 0.167, 0.166, 0.168, 0.168, 0.166, 0.17, 0.164, 0.164, 0.161, 0.161, 0.161,
    0.162, 0.164, 0.162, 0.168, 0.164, 0.166, 0.167, 0.165, 0.165, 0.164, 0.164, 0.166, 0.163, 0.166, 0.168, 0.17,
    0.168, 0.168, 0.169, 0.171, 0.168, 0.17, 0.168, 0.168, 0.168, 0.168, 0.166, 0.168, 0.165, 0.165, 0.165, 0.165,
    0.157,
  ],
  saa: [
    0.124, 0.119, 0.105, 0.093, 0.128, 0.138, 0.117, 0.109, 0.126, 0.124, 0.112, 0.109, 0.127, 0.123, 0.117, 0.13,
    0.131, 0.124, 0.123, 0.133, 0.12, 0.102, 0.103, 0.105, 0.133, 0.103, 0.123, 0.107, 0.14, 0.1, 0.112, 0.113, 0.123,
    0.109, 0.109, 0.114, 0.119, 0.102, 0.113, 0.118, 0.116, 0.106, 0.11, 0.114, 0.125, 0.108, 0.114, 0.112, 0.13,
  ],
  acc: [
    0.29, 0.58, 0.85, 1.11, 1.4, 1.71, 1.99, 2.27, 2.56, 2.85, 3.13, 3.4, 3.7, 3.98, 4.26, 4.55, 4.84, 5.13, 5.42, 5.72,
    6.0, 6.27, 6.54, 6.81, 7.11, 7.38, 7.66, 7.94, 8.24, 8.5, 8.78, 9.07, 9.36, 9.63, 9.91, 10.2, 10.48, 10.76, 11.04,
    11.32, 11.61, 11.88, 12.16, 12.44, 12.73, 13.0, 13.28, 13.56, 13.85,
  ],
  t0: '2017-12-15',
};
export const speActive = () => ctx().spe && !radOk();
export function speLine() {
  const sr = radSrc();
  return `Dose rate ${r1(radNow())} µGy/h, above the alert level of ${ALERT}. Expected below it after ${hm(clearMin())}.${sr && sr.kind === 'standin' ? ' Stand-in data from lunar orbit.' : ''}`;
}
/* ---------- my data ---------- */
// ---------- mission readiness ----------
export function radTotal() {
  const c = ctx();
  if (c.id === 'station')
    return {
      vals: [0, 4, 9, 13].map((i) => ISS_RAD.acc[i]),
      xs: [0, 4, 9, 13].map((i) => 'Day ' + (i + 1)),
      unit: 'mGy',
      real: true,
      now: ISS_RAD.acc[ctx().n - 1],
      note: 'ISS ACCUMULATED DOSE, REPLAYED',
    };
  const b = BODIES[S.body],
    tr = c.id === 'vehicle' ? c.n : b.transit,
    surf = c.id === 'vehicle' ? 0 : c.n;
  const tot = Math.round(tr * 1.5 + surf * 0.5),
    vals =
      c.id === 'vehicle'
        ? [0, Math.round(tr * 0.5), Math.round(tr), tot].map((v, i) =>
            i === 1 ? Math.round((tr / 3) * 1.5) : i === 2 ? Math.round(((tr * 2) / 3) * 1.5) : v,
          )
        : [0, Math.round(tr * 1.5 * 0.5), Math.round(tr * 1.5), tot];
  const xs =
    c.id === 'vehicle'
      ? ['Launch', 'Day ' + Math.round(c.n / 3), 'Day ' + Math.round((c.n * 2) / 3), 'Day ' + c.n]
      : ['Launch', 'Mid-transit', 'Landing', dayLab()];
  return { vals, xs, unit: 'mSv', now: tot, note: 'SIMULATED · 1.5 mSv/DAY IN TRANSIT, 0.5 ON A SURFACE' };
}
export const envKey = () => (S.env === 'station' ? 'station' : S.env === 'vehicle' ? 'vehicle' : S.body);
export const LONGV = {
  bone: {
    station: [0, -0.2, -0.3, -0.5],
    vehicle: [0, -1.6, -3.3, -4.9],
    mars: [0, -3.8, -7.4, -8.1],
    moon: [0, -0.2, -0.3, -0.6],
  },
  str: { station: [0, -1, -2, -3], vehicle: [0, -4, -7, -9], mars: [0, -6, -11, -10], moon: [0, -1, -1, -2] },
  eye: { station: [0, 2, 3, 4], vehicle: [0, 9, 15, 17], mars: [0, 11, 18, 19], moon: [0, 1, 2, 3] },
};
export const longXs = () => {
  const c = ctx();
  return c.id === 'station'
    ? ['Pre-launch', 'Day 5', 'Day 10', 'Day 14']
    : c.id === 'vehicle'
      ? ['Pre-launch', 'Day 40', 'Day 80', 'Day 118']
      : ['Pre-launch', 'Mid-transit', 'Landing', dayLab()];
};
export const lastOf = (a) => a[a.length - 1];
/* ---------- radiation rule for EVA ---------- */
/* Structure follows NASA-STD-3001 Vol 1 Rev C, Vol 2 Rev D and OCHMO-TB-020 Rev G. NASA publishes no alert value, so ALERT is a product assumption. */
export const mGy = (v) => (v / 1000).toFixed(2);
export const evaDose = () => {
  const s = radSeries();
  return s ? EVA_H.reduce((a, h) => a + s[h], 0) : 0;
};
export const eventDose = () => {
  const s = radSeries();
  return s ? s.slice(0, radHour() + 1).reduce((a, b) => a + b, 0) : 0;
};
export const EVA_H = [16, 17, 18, 19],
  SRC_STD = infoI('Source: NASA-STD-3001 radiation requirements');
