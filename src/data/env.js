// Mission environments (station, vehicle, base, rover), time formats and cabin readings.
import { hm, pad3 } from '../lib/util.js';
import { S } from '../state.js';

/* ---------- data ---------- */
export const CO2_MEAN = [2.45, 2.6, 2.51, 2.66, 2.29, 2.54, 2.57],
  CO2_PEAK = [2.76, 3.12, 2.78, 3.07, 2.75, 2.93, 2.85],
  CO2_AVG7 = 2.52;
export const TEMP = [22.6, 22.4, 22.3, 22.6, 22.7, 22.8, 22.8],
  RH = [42.0, 40.5, 44.1, 41.0, 41.3, 39.9, 40.4];
/* REAL (NASA open data): Inspiration4 crew member C003, comprehensive metabolic panel, OSDR OSD-575. */
export const LAB = {
  xs: ['L-92', 'L-44', 'L-3', 'R+1', 'R+45', 'R+82', 'R+194'],
  vals: [3.7, 3.5, 3.3, 3.0, 4.4, 3.7, 3.8],
};
/* REAL (NASA open data): Inspiration4 crew average (n=4) serum IL-6, OSDR OSD-575 immune panel. */
export const I4 = {
  xs: ['L-92', 'L-44', 'L-3', 'R+1', 'R+45', 'R+82', 'R+194'],
  il6: [3.7, 3.1, 4.2, 6.6, 4.7, 4.0, 3.7],
};
/* Everything below is SIMULATED and is not NASA data. */
// ---------- environments ----------
export const BODIES = {
  mars: {
    name: 'Mars',
    g: '3/8 g',
    day: 'Sol',
    n: 61,
    delay: 'up to about 20 min',
    reply: '28+ min',
    transit: 180,
    nextAt: 90,
    md: 243,
    utcOff: 332,
  },
  moon: {
    name: 'Moon',
    g: '1/6 g',
    day: 'Mission Day',
    n: 12,
    delay: 'about 1.3 s',
    reply: 'a few seconds',
    transit: 3,
    nextAt: 14,
    md: 12,
    utcOff: 0,
  },
};
export function ctx() {
  const b = BODIES[S.body],
    rem = `One-way delay ${b.delay}. A flight surgeon reply takes ${b.reply}.`;
  const E = {
    station: {
      id: 'station',
      name: 'Space station',
      zero: true,
      g: '0 g',
      day: 'Mission Day',
      n: 14,
      tz: 'GMT',
      spe: false,
      reply: 'live',
      md: 14,
      utcOff: 0,
      loc: 'Station / Medical Bay',
      evaLoc: 'Outside / Worksite A',
      link: 'Near real time. Mission control answers live, so most questions can wait for a call.',
      ladder3: 'Ask mission control: a live video call, with your records on screen',
      main: 'EVA-04 spacewalk',
      mainShort: 'EVA-04',
      mainType: 'EVA',
      next: { name: 'Return to Earth', type: 'Gravity transition', at: 180, trans: '0 g → 1 g' },
    },
    vehicle: {
      id: 'vehicle',
      name: 'Deep-space vehicle',
      zero: true,
      g: '0 g',
      day: 'Mission Day',
      n: 118,
      tz: 'ship time',
      spe: true,
      reply: '28+ min',
      md: 118,
      utcOff: 0,
      loc: 'Vehicle / Medical Bay',
      evaLoc: null,
      link: 'One-way delay grows with distance, up to about 20 minutes. A flight surgeon reply takes 28+ minutes.',
      ladder3: 'Ask the flight surgeon: I package your records and send them by message',
      main: 'Vehicle operations shift',
      mainShort: 'Ops shift',
      mainType: 'Operations',
      next: { name: 'Arrival and landing', type: 'Gravity transition', at: 180, trans: '0 g → surface gravity' },
    },
    base: {
      id: 'base',
      name: b.name + ' base',
      zero: false,
      g: b.g,
      day: b.day,
      n: b.n,
      tz: 'habitat time',
      spe: true,
      reply: b.reply,
      link: rem,
      md: b.md,
      sol: S.body === 'mars',
      utcOff: b.utcOff,
      loc: 'Habitat / Medical Bay',
      evaLoc: 'Surface / Site A',
      ladder3: 'Ask the flight surgeon: I package your records and send them by message',
      main: 'EVA-04 surface traverse',
      mainShort: 'EVA-04',
      mainType: 'EVA',
      next: { name: 'Ascent to orbit', type: 'Gravity transition', at: b.nextAt, trans: b.g + ' → 0 g' },
    },
    rover: {
      id: 'rover',
      name: 'Pressurised rover',
      zero: false,
      g: b.g,
      day: b.day,
      n: b.n,
      tz: 'habitat time',
      spe: true,
      reply: b.reply,
      link: rem + ' The CMO stays at the base.',
      md: b.md,
      sol: S.body === 'mars',
      utcOff: b.utcOff,
      loc: 'Rover / Cabin',
      evaLoc: 'Surface / Ridge B',
      ladder3: 'Ask the flight surgeon through the base relay: I package your records and send them',
      noShelter: true,
      main: 'Rover traverse to the ridge',
      mainShort: 'Traverse',
      mainType: 'EVA',
      next: null,
    },
  };
  return E[S.env];
}
export const SIM_ID = 'SIM-0412';
export function timeInfo() {
  const c = ctx(),
    t = S.clock,
    utc = hm((((t + c.utcOff) % 1440) + 1440) % 1440);
  const o = {
    utc: utc + ' UTC',
    md: 'Mission Day ' + pad3(c.md),
    met: `MET ${pad3(c.md)}:${hm(t)}:00`,
    loc: c.loc,
    evaLoc: c.evaLoc,
  };
  if (c.sol) {
    o.sol = 'Sol ' + pad3(c.n);
    o.lmst = `Sol ${pad3(c.n)} · ${hm(t)} LMST`;
  }
  if (c.evaLoc && S.evaCleared && t >= 960 && t < 1200) o.eva = `EVA +${hm(t - 960)}`;
  return o;
}
export const dayLab = (d = 0) => {
  const c = ctx();
  return c.day + ' ' + (c.n + d);
};
