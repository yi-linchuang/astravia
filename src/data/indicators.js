// Health indicator definitions, baselines and bands, and the judgement of a reading against them.
import { ST } from '../components/primitives.js';
import { ctx } from './env.js';
import { worst } from './measures.js';
import { BP_BASE, PHK, dayRel, latest, sorted, todayE } from './records.js';
import { r1 } from '../lib/util.js';

// Baselines, bands and wording are SIMULATED product assumptions. The HRP facts quoted in "expect" come from NASA risk pages.
export const IND = {
  sleep: {
    name: 'Sleep, activity & light',
    short: 'Sleep',
    cad: 'Daily · passive',
    per: 1,
    hz: ['iso'],
    unit: 'h',
    dir: 'low',
    tol: 0.5,
    tol2: 2,
    base: { pre: 7.4, zero: 6.8, surf: 7.2 },
    ticks: [4, 5, 6, 7, 8],
    main: (e) => e.v.h,
    show: (e) => `${e.v.h} h${e.v.q ? ' · ' + e.v.q.toLowerCase() : ''}`,
    src: 'Wrist sensor, or typed in',
    fields: [
      { k: 'h', label: 'Hours slept last night', unit: 'h', min: 0, max: 16, step: 0.1, ph: '7.0' },
      { k: 'q', label: 'How did you sleep?', opts: ['Poorly', 'Fairly', 'Well'] },
    ],
    link: 'Evening light and a heavy schedule both cut sleep.',
    why: 'Short sleep builds fatigue. You react more slowly and make more errors.',
    adv: {
      ok: 'Nothing to change. Keep your sleep window.',
      watch:
        'Dim the lights after 21:30 and protect your sleep window tonight. Retake the reaction test tomorrow morning.',
      alert: 'Protect your sleep window tonight. If you sleep this little again tomorrow, tell your CMO.',
    },
    expect:
      'Crews often sleep less than planned in flight. NASA HRP lists inadequate sleep and irregular schedules as a risk.',
    basis: '"Below baseline" is a product assumption, not a NASA threshold.',
  },
  cardio: {
    name: 'Heart rate & ECG',
    short: 'Resting heart rate',
    cad: 'Daily · passive',
    per: 1,
    hz: ['gravity'],
    unit: 'bpm',
    dir: 'both',
    tol: 3,
    tol2: 8,
    base: { pre: 54, zero: 56, surf: 58 },
    ticks: [50, 55, 60, 65, 70],
    main: (e) => e.v.bpm,
    show: (e) => `${e.v.bpm} bpm`,
    src: 'Chest patch, or typed in',
    fields: [{ k: 'bpm', label: 'Resting heart rate', unit: 'bpm', min: 25, max: 200, step: 1, ph: '58' }],
    link: 'Resting heart rate often rises when you are short on sleep.',
    why: 'When your heart has not recovered, hard exercise and EVA put more load on your body.',
    adv: {
      ok: 'Nothing to change.',
      watch: "Drop today's resistance session one level. Afterwards, check how long your heart rate takes to settle.",
      alert:
        'Rest, drink water, and measure again in 10 minutes. If it stays high, or you feel chest pain or palpitations, tell your CMO now.',
    },
    expect:
      'The heart and blood vessels adapt to each new gravity, so small shifts are expected (NASA HRP, cardiovascular adaptations). A rise that keeps growing is not.',
    basis: 'The band is a product assumption.',
  },
  cog: {
    name: 'Reaction test',
    short: 'Reaction time',
    cad: 'Daily · 3 min',
    per: 1,
    hz: ['iso'],
    unit: 'ms',
    dir: 'high',
    tol: 30,
    tol2: 80,
    base: { pre: 258, zero: 270, surf: 265 },
    ticks: [240, 270, 300, 330, 360],
    main: (e) => e.v.ms,
    show: (e) => `${e.v.ms} ms`,
    src: 'PVT-B reaction test, tapped on this screen',
    test: true,
    link: 'Your reaction time started slowing at the same time your sleep dropped.',
    why: 'Reaction time is the most sensitive sign of sleep loss. Higher numbers mean slower reactions.',
    adv: {
      ok: 'Within range for a high-risk task.',
      watch: 'Retake the test before any high-risk task, after sleep if you can.',
      alert: 'Do not start a high-risk task. Tell your CMO.',
    },
    expect: 'PVT-B is part of NASA Standard Measures. Slowing often goes with short sleep.',
    basis:
      "PVT-B is a NASA Standard Measure. The bands are product assumptions. The demo's 5-tap version uses a relaxed pass mark.",
  },
  bp: {
    name: 'Blood pressure & SpO₂',
    short: 'Blood pressure',
    cad: 'Weekly',
    per: 7,
    hz: ['gravity', 'closed'],
    unit: 'mmHg',
    dir: 'both',
    tol: 8,
    tol2: 22,
    base: { pre: 122, zero: 112, surf: 118 },
    ticks: [100, 110, 120, 130, 140],
    main: (e) => e.v.sys,
    show: (e) => `${e.v.sys}/${e.v.dia} mmHg · SpO₂ ${e.v.spo2}%`,
    src: 'Arm cuff and finger clip, typed in',
    fields: [
      { k: 'sys', label: 'Top number (systolic)', unit: 'mmHg', min: 60, max: 260, step: 1, ph: '118' },
      { k: 'dia', label: 'Bottom number (diastolic)', unit: 'mmHg', min: 30, max: 160, step: 1, ph: '76' },
      { k: 'spo2', label: 'SpO₂', unit: '%', min: 50, max: 100, step: 1, ph: '97' },
    ],
    pre: [
      'Seated and steady, arm relaxed',
      'At least 30 minutes since exercise',
      'Cuff on the upper arm, level with your heart',
    ],
    link: 'Blood pressure shifts as fluids move with gravity.',
    why: 'It shows how your heart is coping with your current gravity. SpO₂ is your check against mild hypoxia.',
    adv: {
      ok: 'Done for this week.',
      watch:
        'Sit for 5 minutes, arm level with your heart, and measure again. Drink water. If it is still outside your range tomorrow, tell your CMO.',
      alert:
        'Sit or lie down and measure again after 5 minutes. If it is still this far off, or SpO₂ is under 90%, tell your CMO now. Do not wait for the ground.',
    },
    expect:
      'Fluids move toward the head in weightlessness and shift back in gravity, so blood pressure changes are expected (NASA HRP). Some spacecraft cabins run at reduced pressure, so SpO₂ matters too.',
    basis: 'Steps follow ground blood-pressure guidelines. The bands and weekly timing are product assumptions.',
  },
  bal: {
    name: 'Balance',
    short: 'Balance sway',
    cad: 'Weekly',
    per: 7,
    hz: ['gravity'],
    unit: 'cm²',
    dir: 'high',
    tol: 0.6,
    tol2: 1.5,
    base: { pre: 2.9, zero: null, surf: 3.8 },
    zeroNA: true,
    ticks: [2, 3, 4, 5, 6],
    main: (e) => e.v.sway,
    show: (e) => `${e.v.sway} cm² sway`,
    src: 'Force plate, typed in',
    fields: [
      {
        k: 'sway',
        label: 'Sway area, eyes closed on the foam pad',
        unit: 'cm²',
        min: 0.1,
        max: 30,
        step: 0.1,
        ph: '3.8',
      },
    ],
    pre: ['Feet together on the force plate', 'Arms crossed over your chest', 'A handrail or crewmate within reach'],
    link: 'Balance re-tunes every time gravity changes.',
    why: 'Your inner ear and balance re-tune with each gravity. Poor balance raises the risk of a fall in a suit.',
    adv: {
      ok: 'Done for this week.',
      watch: 'Avoid ladders and carrying loads until you retest in a few days.',
      alert: 'Sit down and avoid suit work. If you feel dizzy, report it.',
    },
    expect: 'Balance and the inner ear re-tune after every gravity change (NASA HRP, sensorimotor).',
    basis: 'Sensorimotor tests are part of NASA Standard Measures. The measure and bands are product assumptions.',
  },
  fit: {
    name: 'Fitness self-check',
    short: 'Leg strength',
    cad: 'Weekly',
    per: 7,
    hz: ['gravity'],
    unit: '%',
    dir: 'low',
    tol: 4,
    tol2: 12,
    base: { pre: 100, zero: 100, surf: 100 },
    ticks: [80, 90, 100, 110],
    main: (e) => e.v.pct,
    show: (e) => `leg press ${e.v.pct}% of pre-launch`,
    src: 'Exercise device, typed in',
    fields: [
      { k: 'pct', label: 'Leg press, as % of your pre-launch weight', unit: '%', min: 20, max: 150, step: 1, ph: '92' },
    ],
    link: 'On the ISS, strength and aerobic fitness fall 10–12% on average even with daily exercise.',
    why: 'You need leg and back strength for a heavy suit under gravity, and for your return to 1 g.',
    adv: {
      ok: 'Keep going.',
      watch: 'Keep the full 1.5 hours of exercise today, one level lighter on resistance.',
      alert: 'Tell your CMO. Your exercise plan may need to change.',
    },
    expect:
      'ISS crews lose 10–12% of strength and aerobic fitness on average, even exercising 1.5 hours a day (NASA HRP).',
    basis: 'The 10–12% figure is from NASA HRP. The band is a product assumption.',
  },
  temp: {
    name: 'Body temperature',
    short: 'Temperature',
    cad: 'When needed',
    opt: true,
    per: 7,
    hz: [],
    unit: '°C',
    dir: 'both',
    tol: 0.5,
    tol2: 1.4,
    base: { pre: 36.6, zero: 36.6, surf: 36.6 },
    ticks: [35.5, 36, 36.5, 37, 37.5],
    main: (e) => e.v.c,
    show: (e) => `${e.v.c} °C`,
    src: 'Thermometer, typed in',
    fields: [{ k: 'c', label: 'Temperature', unit: '°C', min: 30, max: 43, step: 0.1, ph: '36.6' }],
    link: '',
    why: 'A fever with a rash or other signs is a reason to bring in your CMO.',
    adv: { ok: 'Normal.', watch: 'Rest, drink water, and measure again in 2 hours.', alert: 'Tell your CMO now.' },
    expect: 'Ground reference values. I did not find space-specific temperature ranges in the NASA pages I read.',
    basis: 'Ground reference, applied here as a product assumption.',
  },
  glu: {
    name: 'Blood sugar',
    short: 'Blood sugar',
    cad: 'When needed',
    opt: true,
    per: 7,
    hz: [],
    unit: 'mg/dL',
    dir: 'both',
    tol: 14,
    tol2: 40,
    base: { pre: 88, zero: 88, surf: 88 },
    ticks: [60, 80, 100, 120, 140],
    main: (e) => e.v.mg,
    show: (e) => `${e.v.mg} mg/dL · ${(e.v.ctx || 'fasting').toLowerCase()}`,
    src: 'Glucose meter, typed in',
    fields: [
      { k: 'mg', label: 'Blood sugar', unit: 'mg/dL', min: 20, max: 600, step: 1, ph: '90' },
      { k: 'ctx', label: 'When did you last eat?', opts: ['Fasting', 'After eating'] },
    ],
    link: '',
    why: 'Eating less, or a big change in routine, can move blood sugar. It is a health indicator you can check yourself.',
    adv: {
      ok: 'Normal for the situation.',
      watch: 'Eat or drink as planned, and measure again in an hour. Tell your CMO if it stays outside your range.',
      alert: 'Tell your CMO now. Do not wait for the ground.',
    },
    expect: "Ground reference ranges. NASA's risk pages I read do not give space-specific blood sugar ranges.",
    basis: 'Ground reference, applied here as a product assumption. This is not a diagnosis.',
  },
  wt: {
    name: 'Body weight',
    short: 'Weight',
    cad: 'Weekly',
    per: 7,
    hz: ['dist'],
    unit: 'kg',
    dir: 'both',
    tol: 1.5,
    tol2: 4,
    base: { pre: 68, zero: 68, surf: 68 },
    ticks: [64, 66, 68, 70, 72],
    main: (e) => e.v.kg,
    show: (e) => `${e.v.kg} kg`,
    src: 'Mass scale, typed in',
    fields: [{ k: 'kg', label: 'Body weight', unit: 'kg', min: 30, max: 200, step: 0.1, ph: '68' }],
    link: 'Low appetite and menu fatigue both lower body weight.',
    why: 'Eating less affects both health and performance. NASA HRP lists inadequate food and nutrition as a risk.',
    adv: {
      ok: 'Nothing to change.',
      watch: 'Check your food log. Menu fatigue and low appetite are common.',
      alert: 'Tell your CMO. A fast change in weight needs a check.',
    },
    expect: 'NASA HRP lists inadequate food and nutrition as a risk. Crews can eat less when the menu repeats.',
    basis: 'The band is a product assumption.',
  },
};
function stNum(v, base, tol, tol2, dir) {
  const d = v - base,
    bad = dir === 'low' ? -d : dir === 'high' ? d : Math.abs(d);
  return bad <= tol ? 'ok' : bad <= tol2 ? 'watch' : 'alert';
}
export function judge(id, e) {
  const I = IND[id],
    k = PHK();
  if (id === 'bp') {
    const b = BP_BASE[k],
      v = e.v;
    let st = worst([
      stNum(v.sys, b.sys, 8, 22, 'both'),
      stNum(v.dia, b.dia, 6, 16, 'both'),
      stNum(v.spo2, b.spo2, 2, 5, 'low'),
    ]);
    if (v.spo2 < 90 || v.sys >= 180 || v.sys <= 80 || v.dia >= 120) st = 'alert';
    return st;
  }
  if (id === 'temp') {
    const c = e.v.c;
    return c >= 38 || c <= 35 ? 'alert' : stNum(c, 36.6, 0.5, 1.4, 'both');
  }
  if (id === 'glu') {
    const mg = e.v.mg;
    if (mg < 54 || mg > 250) return 'alert';
    return e.v.ctx === 'After eating' ? stNum(mg, 110, 30, 80, 'both') : stNum(mg, 88, 14, 40, 'both');
  }
  if (id === 'urine') {
    const c = +e.v.c;
    return c <= 3 ? 'ok' : c <= 5 ? 'watch' : 'alert';
  }
  const base = I.base[k];
  if (base == null) return 'nodata';
  const demo = id === 'cog' && e.src === 'input';
  return stNum(I.main(e), base, demo ? 150 : I.tol, demo ? 250 : I.tol2, I.dir);
}
export const baseTxt = (id, k) => {
  const I = IND[id];
  k = k || PHK();
  if (id === 'bp') {
    const b = BP_BASE[k];
    return `${b.sys}/${b.dia} mmHg · SpO₂ ${b.spo2}%`;
  }
  const b = I.base[k];
  return b == null ? 'not testable' : `${b} ${I.unit}`;
};
export function isDue(id) {
  const I = IND[id];
  if (I.opt || (I.zeroNA && ctx().zero) || todayE(id)) return false;
  const L = latest(id);
  return !L || -L.d >= I.per - 1;
}
export function sigNum(id) {
  const I = IND[id],
    L = latest(id),
    k = PHK(),
    base = I.base[k],
    c = ctx();
  const o = {
    id,
    name: I.name,
    cad: I.cad,
    hz: I.hz,
    src: I.src,
    meas: id,
    link: I.link,
    why: I.why,
    basis: I.basis,
    unit: I.unit,
    st: 'nodata',
    head: '',
    now: '',
    base: `Baseline ${baseTxt(id)}`,
    vals: null,
    priv: false,
    todo: '',
  };
  if (I.zeroNA && c.zero)
    return {
      ...o,
      head: 'Not testable in 0 g. You float, so there is no fall risk to measure.',
      base: '',
      todo: 'Balance comes back when you are on a surface.',
      pill: ['N/A', 'minus', 'nodata'],
    };
  if (!L)
    return {
      ...o,
      head: 'No readings yet. Record one to start.',
      todo: 'Record your first reading. It takes about a minute.',
    };
  const st = judge(id, L),
    ent = sorted(id),
    dv = I.main(L) - base,
    age = -L.d,
    stale = age > I.per * 2 && !I.opt;
  o.st = stale ? 'nodata' : st;
  o.head = stale
    ? `Last reading ${age} days ago`
    : st === 'ok'
      ? `${I.short} within your baseline`
      : id === 'bp' && L.v.spo2 < 90
        ? 'SpO₂ below 90%'
        : `${I.short} ${r1(Math.abs(dv))}${I.unit === '%' ? '%' : ' ' + I.unit} ${dv > 0 ? 'above' : 'below'} your baseline`;
  if (isDue(id)) o.head += ' · due today';
  o.now = `Latest: ${I.show(L)} · ${dayRel(L.d)}${L.src === 'sample' ? ' · wearable' : ''}`;
  if (ent.length > 1) {
    o.vals = ent.map((e) => I.main(e));
    o.xs = ent.map((e) => String(c.n + e.d));
    o.lo = base - I.tol;
    o.hi = base + I.tol;
    o.ticks = I.ticks;
    o.xLabel = c.day.toUpperCase();
  }
  o.todo = I.adv[st] || '';
  return o;
}
export const stLab = (s) => ST[s][0];
export const MIN = {
  cog: '3 min',
  bp: '4 min',
  bal: '3 min',
  fit: '10 min',
  sleep: '1 min',
  cardio: '30 s',
  wt: '1 min',
  temp: '1 min',
  glu: '1 min',
};
const recState = (id) => {
  const L = latest(id);
  if (IND[id].zeroNA && ctx().zero) return ['Not testable in 0 g', 'N/A', 'nodata'];
  if (!L) return ['No readings yet', 'Missing', 'nodata'];
  const st = judge(id, L);
  return [`${IND[id].show(L)} · ${dayRel(L.d)}`, st === 'ok' ? 'OK' : stLab(st), st];
};
export const chk = (label, id) => {
  const r = recState(id);
  return [label, r[0], r[1], r[2], 0];
};
