// Body systems (regions), the protective measures behind each, and region status.
import { ctx } from './env.js';
import { IND, MIN } from './indicators.js';
import { LONG } from './longterm.js';
import { ALERT, ISS_RAD, clearMin, radLabel, radNow, radOk, radSrc } from './radiation.js';
import { caseActive, pvtPass, todayE } from './records.js';
import { signals } from './signals.js';
import { hm, r1 } from '../lib/util.js';
import { S } from '../state.js';
import { SPECIAL } from '../views/entry.js';

/* ---------- same body, different environment ---------- */
/* ---------- countermeasure plan ---------- */
/* Measures and their status come from NASA HRP risk pages and CSA (see Spec v2, section 8). Adherence and effect numbers are SIMULATED. */
export const CM_ST = {
  adopted: ['Adopted by NASA', 'check', 'ok'],
  research: ['Research only', 'minus', 'nodata'],
  medical: ['Medical team decides', 'minus', 'nodata'],
};
function measures() {
  const exDone = S.clock >= 870;
  return {
    gravity: [
      {
        name: 'Resistance and aerobic exercise',
        st: 'adopted',
        cad: 'Daily · 1.5 h',
        adh: [6, 7],
        what: 'ISS crews train 1.5 hours a day, 6 to 7 days a week. Strength and aerobic fitness still fall 10–12% on average, so every session counts.',
        today: exDone ? 'Done today, one level lighter' : 'Today 13:00, one resistance level lighter',
        go: ['task', 'ex', "Today's session"],
      },
      {
        name: 'Hydration',
        st: 'adopted',
        cad: 'Daily target',
        adh: [5, 7],
        what: 'Dehydration plus calcium released from bone can raise the risk of kidney stones. Extra fluids before a gravity change help prevent low blood pressure.',
        today: 'Below target yesterday',
      },
      {
        name: 'Lower-body compression garment',
        st: 'adopted',
        cad: 'Before gravity changes',
        what: 'Worn with extra fluids before landing to prevent low blood pressure and fainting.',
        today: ctx().next
          ? `Next use: ${ctx().next.name.toLowerCase()}, ${ctx().day.toLowerCase()} ${ctx().next.at}`
          : 'No gravity change planned',
        go: ['task', 'asc', 'Transition checklist'],
      },
      {
        name: 'Bone medication',
        st: 'medical',
        cad: 'Not self-managed',
        what: 'NASA studies found bisphosphonate drugs could help limit bone loss. ASTRAVIA never suggests medication.',
      },
      {
        name: 'Thigh cuffs',
        st: 'research',
        cad: 'Not recommended',
        what: 'Being tested to keep more fluid in the legs and protect the eyes from SANS.',
      },
      {
        name: 'Daily B-vitamin supplement',
        st: 'research',
        cad: 'Not recommended',
        what: 'Being tested to see whether it can prevent the brain and eye changes of SANS.',
      },
    ],
    iso: [
      {
        name: 'Light and caffeine timing',
        st: 'adopted',
        cad: 'Daily',
        adh: [4, 7],
        what: "LED lighting mimics Earth's day–night cycle. Light and caffeine both shift your body clock, so their timing matters.",
        today: S.sleepPlan ? 'Lights down at 21:30 tonight' : 'Evening light above target on 3 of the last 4 days',
      },
      {
        name: 'Free time and self-care',
        st: 'adopted',
        cad: 'Daily',
        adh: [3, 7],
        what: 'Crews get set times to relax, to prevent burnout. Journaling, looking out of a window and tending plants all ease the sense of confinement.',
        today: S.mind ? 'Checked in today' : 'Not checked in yet today',
        go: ['htab', 'mind', 'Well-being'],
      },
    ],
    rad: [
      {
        name: 'Shelter during solar events',
        st: 'adopted',
        cad: 'During events',
        what: "Move to the best-shielded part of the habitat. CSA's Radi-N2 mapped the best-protected areas of the ISS for this reason.",
        today: !ctx().spe
          ? 'Not needed here today'
          : radOk()
            ? 'No active event'
            : S.shelter
              ? 'You are in the storm shelter'
              : ctx().noShelter
                ? 'Event in progress: head back toward the base'
                : 'Event in progress: move to the shelter',
        go: ['go', 'habitat', 'Environment'],
      },
      {
        name: 'Schedule EVAs around radiation',
        st: 'adopted',
        cad: 'Before each EVA',
        what: "An EVA waits while a radiation alert is active, and never goes further than 2 hours from shielding. You can't feel radiation, so this relies on the dosimeters.",
        today: radOk()
          ? `Alert clear. ${ctx().mainShort} window open`
          : `${ctx().mainShort} waits for the alert to clear, about ${hm(clearMin())}`,
        go: ['task', 'eva', ctx().mainShort],
      },
    ],
    closed: [
      {
        name: 'Prebreathe before EVA',
        st: 'adopted',
        cad: 'Before each EVA',
        what: 'Breathing high-oxygen air before an EVA clears nitrogen from the body and prevents decompression sickness.',
        today: S.prebreathe ? `Done for ${ctx().mainShort}` : `Due before ${ctx().mainShort}`,
        go: ['task', 'eva', 'EVA-04'],
      },
      {
        name: 'Report cabin air readings',
        st: 'adopted',
        cad: 'When readings are high',
        what: 'High CO₂ is fixed by adjusting the habitat, not by treating you.',
        today: S.co2Fixed ? 'Reported today' : 'CO₂ 7-day average above the 2.5 reference',
        go: ['go', 'habitat', 'Cabin air'],
      },
    ],
    dist: [
      {
        name: 'Varied, balanced meals',
        st: 'adopted',
        cad: 'Daily',
        adh: [5, 7],
        what: 'Eating the same foods for months causes menu fatigue, and crews eat less. Good nutrition protects both health and performance.',
        today: 'Logged 5 of the last 7 sols',
      },
    ],
  };
}
const CM_ORDER = ['gravity', 'iso', 'rad', 'closed', 'dist'];
/* ---------- body map (a tab of My health) ---------- */
const RANK = { alert: 4, watch: 3, nodata: 2, info: 1, ok: 0 };
export const worst = (list) => list.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), 'ok');
const longItem = (n) => {
  const L = LONG.find((x) => x.name === n);
  return { name: L.name, val: L.sum, st: L.st, label: L.badge, real: false };
};
const sigItem = (id) => {
  const s = signals().find((x) => x.id === id),
    I = IND[id];
  if (!s)
    return {
      name: I ? I.name : id,
      val: 'No readings yet',
      st: 'nodata',
      quiet: true,
      rec: I ? id : null,
      meta: I ? I.src : '',
    };
  return {
    name: s.name,
    val: s.head,
    st: s.st,
    real: false,
    go: ['signal', id],
    vals: s.vals,
    lo: s.lo,
    hi: s.hi,
    now: s.now,
    base: s.base,
    rec: I ? id : null,
    meta: I ? I.src + (MIN[id] ? ' · ' + MIN[id] : '') : '',
  };
};
export const REG = {
  head: {
    name: 'Brain & head',
    hz: ['closed', 'iso', 'rad'],
    why: 'Sleep loss, heavy workload and cabin air show up here first: slower reactions, headaches, more mistakes.',
    items: () => [sigItem('cog'), sigItem('sleep'), sigItem('sym')],
    acts: () => [
      ['Report a headache', 'flow:headache', 'primary'],
      [pvtPass() ? 'Reaction test passed' : 'Do reaction test', 'meas:cog', 'outline', pvtPass()],
    ],
  },
  eyes: {
    name: 'Eyes',
    hz: ['gravity'],
    why: "In low gravity, fluid shifts toward your head. Over months this can swell the optic nerve and change your vision (SANS). You often can't feel it, so it's tracked with OCT scans.",
    items: () => [
      {
        name: 'Vision symptoms',
        val: S.care.flow === 'vision' && S.care.status !== 'none' ? 'Vision change reported' : 'None reported',
        st: S.care.flow === 'vision' && caseActive() ? 'watch' : 'ok',
        real: false,
      },
      longItem('Eyes (optic nerve thickness)'),
    ],
    acts: () => [
      ['Report a vision change', 'flow:vision', 'primary'],
      ['See eye scan trend', 'long', 'outline'],
    ],
  },
  heart: {
    name: 'Heart & lungs',
    hz: ['gravity', 'closed'],
    why: 'Your heart and blood vessels adapt to each gravity. That matters most during EVA, hard exercise, and at the next gravity change. SpO₂ is your check on cabin oxygen.',
    items: () => [sigItem('cardio'), sigItem('bp')],
    acts: () => [
      [todayE('bp') ? 'BP and SpO₂ recorded' : 'Record BP and SpO₂', 'meas:bp', 'primary', !!todayE('bp')],
      ['See heart rate trend', 'sig:cardio', 'outline'],
    ],
  },
  bones: {
    name: 'Bones · hips & spine',
    hz: ['gravity'],
    why: "Without Earth's load, weight-bearing bones lose 1–1.5% of density a month in weightlessness, mostly in the hips and spine. Exercise slows the loss.",
    items: () => [longItem('Bone (hip density)')],
    acts: () => [
      ["See today's exercise", 'task:ex', 'primary'],
      ['See bone trend', 'long', 'outline'],
    ],
  },
  muscles: {
    name: 'Leg muscles & balance',
    hz: ['gravity'],
    why: 'Leg and back muscles weaken fastest, and balance re-tunes with each gravity. You need both for a surface EVA in a heavy suit.',
    items: () => [sigItem('fit'), sigItem('bal'), longItem('Whole-body strength')],
    acts: () => [
      [todayE('bal') ? 'Balance recorded' : 'Record balance', 'meas:bal', 'primary', !!todayE('bal') || ctx().zero],
      ['Report dizziness', 'flow:dizzy', 'outline'],
    ],
  },
  rad: {
    name: 'Whole body · radiation',
    hz: ['rad', 'dist'],
    why: "Radiation reaches every tissue and you can't feel it. Only the dosimeters can tell you. A solar particle event can deliver days of normal dose in a few hours.",
    items: () => [
      ctx().id === 'station'
        ? { name: 'Dose today', val: `${ISS_RAD.total[ctx().n - 1]} mGy/day · steady`, st: 'ok', real: true }
        : {
            name: 'Dose rate now',
            val: `${r1(radNow())} µGy/h · alert level ${ALERT} (${radLabel()})`,
            st: radOk() ? 'ok' : 'alert',
            real: !!radSrc() && radSrc().kind === 'real',
          },
      longItem('Cumulative radiation dose'),
    ],
    acts: () => [
      ['Open environment', 'go:habitat', 'primary'],
      [`See ${ctx().mainShort} blockers`, 'task:eva', 'outline'],
    ],
  },
};
export const regSt = (k) => {
  const a = REG[k]
    .items()
    .filter((i) => !i.quiet)
    .map((i) => i.st);
  return a.length ? worst(a) : 'nodata';
};
(() => {
  const add = (k, f) => {
    const o = REG[k].items;
    REG[k].items = () => f(o());
  };
  const spItem = (id, cad) => {
    const n = S.data[id].length;
    return {
      name: SPECIAL[id].name,
      meta: SPECIAL[id].src + ' · ' + cad,
      val: n ? `${n} saved` : 'No entries yet',
      st: n ? 'ok' : 'nodata',
      quiet: true,
      rec: id,
    };
  };
  const off = (name, val, label, extra) => ({ name, val, st: 'nodata', quiet: true, label, ...extra });
  add('head', (a) => [
    ...a.map((i) => (i.name === 'Symptoms' ? { ...i, act: ['unwell', '', 'Report a symptom'] } : i)),
    off(
      'Brain and eye MRI',
      'Needs a scanner on Earth. NASA scans before and after a mission.',
      'Before and after only',
    ),
  ]);
  add('eyes', (a) => [
    ...a,
    {
      name: 'Vision self-checks',
      val: 'Letter chart and Amsler grid on screen',
      meta: 'Screen · 2 min',
      st: 'ok',
      quiet: true,
      label: 'When needed',
      act: ['startflow', 'vision', 'Start'],
    },
  ]);
  add('bones', (a) => [
    ...a,
    off(
      'Bone density scan',
      'Needs a scanner on Earth. Values during the mission are simulated estimates.',
      'Before and after only',
    ),
  ]);
  add('rad', (a) => [
    ...a,
    {
      name: 'Cabin air and pressure',
      val: 'CO₂, temperature, humidity, pressure and oxygen are recorded by cabin sensors',
      meta: 'Cabin sensors · no effort',
      st: 'ok',
      quiet: true,
      label: 'Recorded for you',
      act: ['go', 'habitat', 'Open environment'],
    },
    off('Neutron dose', 'No flight instrument yet. Neutrons are about 30% of the dose on the ISS.', 'Not measured'),
  ]);
  const rad = REG.rad;
  delete REG.rad;
  REG.whole = {
    name: 'Whole body',
    hz: [],
    why: 'Some things belong to the whole body, not one part: mood and stress, temperature, blood sugar, weight, hydration, skin and lab samples.',
    items: () => {
      const m = sigItem('mind');
      return [
        { ...m, go: null, act: ['htab', 'mind', S.mind ? 'Edit check-in' : 'Check in'] },
        sigItem('temp'),
        sigItem('glu'),
        sigItem('wt'),
        spItem('urine', '30 s'),
        spItem('skin', '1 min'),
        {
          name: 'Blood, urine and saliva samples',
          val: 'Collected with the CMO every 30 days. Results are slow, not a same-day answer.',
          meta: 'With the CMO',
          st: 'nodata',
          quiet: true,
          label: 'Scheduled',
          act: ['htab', 'long', 'View'],
        },
        spItem('us', 'every 30 days with the CMO'),
      ];
    },
    acts: () => [['See long-term trends', 'long', 'outline']],
  };
  REG.rad = rad;
  rad.name = 'Radiation';
})();
const CM_MAP = {
  'Resistance and aerobic exercise': ['muscles', 'bones'],
  'Lower-body compression garment': ['heart'],
  'Bone medication': ['bones'],
  'Thigh cuffs': ['eyes'],
  'Daily B-vitamin supplement': ['eyes'],
  'Light and caffeine timing': ['head'],
  'Shelter during solar events': ['rad'],
  'Schedule EVAs around radiation': ['rad'],
  'Prebreathe before EVA': ['heart'],
  'Report cabin air readings': ['rad'],
};
export const cmFor = (k) => {
  const M = measures();
  return CM_ORDER.flatMap((h) => M[h]).filter((m) => (CM_MAP[m.name] || ['whole']).includes(k));
};
