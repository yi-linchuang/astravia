// Long-term change series: bone, strength, eyes, cumulative radiation dose.
// DISCLAIMER: Synthetic demonstration data. Not real astronaut medical data.
import { negTicks, posTicks, radTicks } from '../components/charts.js';
import { ctx } from './env.js';
import { LONGV, envKey, lastOf, longXs, radTotal } from './radiation.js';
import { S } from '../state.js';

const forecast = () => (ctx().id === 'vehicle' || S.body === 'mars' ? 585 : 16);
export const LONG = [
  {
    name: 'Bone (hip density)',
    get sum() {
      return `${Math.abs(lastOf(LONGV.bone[envKey()]))}% lower than before launch, within the expected range`;
    },
    st: 'info',
    badge: 'Expected',
    hz: ['gravity'],
    text: 'Weight-bearing bones lose 1–1.5% a month in weightlessness. Loss in reduced gravity is not yet known, so we keep measuring.',
    get vals() {
      return LONGV.bone[envKey()];
    },
    get ticks() {
      return negTicks(this.vals);
    },
    get xs() {
      return longXs();
    },
    fmt: (v) => v + '%',
    unit: 'CHANGE SINCE LAUNCH',
    next: 'On the next scan',
  },
  {
    name: 'Whole-body strength',
    get sum() {
      return `${Math.abs(lastOf(LONGV.str[envKey()]))}% lower than before launch`;
    },
    st: 'watch',
    badge: 'Declining',
    hz: ['gravity'],
    text: 'On the ISS, strength and aerobic fitness fall 10–12% on average. It affects surface work, where the suit is heavier, and emergency response.',
    get vals() {
      return LONGV.str[envKey()];
    },
    get ticks() {
      return negTicks(this.vals);
    },
    get xs() {
      return longXs();
    },
    fmt: (v) => v + '%',
    unit: 'CHANGE SINCE LAUNCH',
    next: 'On the next strength test',
  },
  {
    name: 'Eyes (optic nerve thickness)',
    get sum() {
      return `Optic nerve ${lastOf(LONGV.eye[envKey()])} µm thicker than before launch. Next OCT scan in about 2 weeks`;
    },
    st: 'watch',
    badge: 'Monitor',
    hz: ['gravity'],
    text: "About 70% of ISS astronauts show some swelling at the back of the eye. You often can't feel it.",
    get vals() {
      return LONGV.eye[envKey()];
    },
    get ticks() {
      return posTicks(this.vals);
    },
    get xs() {
      return longXs();
    },
    fmt: (v) => '+' + v + ' µm',
    unit: 'OCT, CHANGE SINCE LAUNCH',
    next: 'In about 2 weeks',
  },
  {
    name: 'Cumulative radiation dose',
    get sum() {
      const t = radTotal();
      return ctx().id === 'station'
        ? `${t.now} mGy so far, from ISS data`
        : `${t.now} mSv so far, in line with the mission forecast. NASA career limit 600`;
    },
    st: 'ok',
    badge: 'As forecast',
    hz: ['rad'],
    get text() {
      const f = forecast();
      return ctx().id === 'station'
        ? 'Whole-body total from the ISS area monitor, replayed from NASA data. This is absorbed dose in mGy, so comparing it with the 600 mSv career limit is rough. Your own dosimeter total would replace it.'
        : `Whole-body total from your personal dosimeter (simulated). NASA's career limit is 600 mSv. The simulated forecast for the whole mission is about ${f} mSv, ${f <= 600 ? 'inside' : 'above'} that limit${f > 400 ? ' but with little margin' : ''}. It assumes 1.5 mSv a day in transit and 0.5 mSv a day on a surface, the example rates in NASA\'s technical brief OCHMO-TB-020. Earlier flights would count against the same 600 mSv, so margin is a mission-design question, not a daily choice.`;
    },
    get vals() {
      return radTotal().vals;
    },
    get ticks() {
      return radTicks(Math.max(...radTotal().vals));
    },
    get xs() {
      return radTotal().xs;
    },
    get fmt() {
      const u = radTotal().unit;
      return (v) => v + ' ' + u;
    },
    get unit() {
      return radTotal().note;
    },
    next: 'Continuous',
  },
];
