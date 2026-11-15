// The six symptom flows (questions, data checks, causes, actions) and their helpers.
import { lineChart } from '../components/charts.js';
import { REAL } from '../components/primitives.js';
import { CO2_AVG7, I4, ctx, dayLab } from './env.js';
import { chk, stLab } from './indicators.js';
import { LONGV, envKey, lastOf, radOk } from './radiation.js';
import { todayE } from './records.js';
import { sigSt, sigText } from './signals.js';
import { has } from '../lib/util.js';
import { S } from '../state.js';

const SEV = ['Mild', 'Moderate', 'Severe'];
export const FLOWS = {
  headache: {
    name: 'Headache',
    risk: 'Sleep · hypoxia · cabin air',
    blocksEva: true,
    followMin: 60,
    followQ: 'Is your headache any better?',
    qs: [
      ['onset', 'When did it start?', ['Just now', '1–2 hours ago', 'Earlier today', 'Yesterday or before']],
      ['sev', 'How bad is it?', [...SEV, 'Sudden and intense']],
      [
        'withs',
        'Anything else? Pick all that apply',
        ['Stuffy nose', 'Puffy face', 'Nausea', 'Blurred vision', 'One-sided weakness or numbness', 'Trouble speaking'],
        true,
      ],
    ],
    defaults: { onset: '1–2 hours ago', sev: 'Moderate', withs: ['Stuffy nose'] },
    red: (a) =>
      a.sev === 'Sudden and intense' ||
      has(a.withs, 'One-sided weakness or numbness') ||
      has(a.withs, 'Trouble speaking'),
    check: () => [
      ['Cabin CO₂', `7-day avg ${CO2_AVG7} mmHg`, 'High', 'watch', ctx().id === 'station' ? 'data' : 0],
      ['Cabin oxygen', 'Partial pressure nominal', 'OK', 'ok', 0],
      ['Sleep', sigText('sleep'), stLab(sigSt('sleep')), sigSt('sleep'), 0],
      ['Workload', '11.5 h scheduled yesterday', 'High', 'watch', 0],
    ],
    checkNote: (a) =>
      has(a.withs, 'Blurred vision')
        ? "You mentioned blurred vision. Do the eye chart and Amsler grid too. I'll also notify your CMO."
        : '',
    get context() {
      return `${dayLab()}, ${ctx().n < 30 ? 'just' : 'long'} past the first week of flight.`;
    },
    causes: [
      [
        'High cabin CO₂',
        'Possible',
        'NASA found more headaches at higher CO₂ on the ISS, but another study found no link. Fixed sensors also miss local pockets near you.',
        'watch',
      ],
      ['Short sleep', 'Possible', 'Four short nights in a row can cause headaches on their own.', 'watch'],
      [
        'Mild hypoxia',
        'Less likely',
        'The cabin runs at reduced pressure, and mild hypoxia can cause headache, confusion and poor sleep. Cabin oxygen is nominal today. An SpO₂ reading would rule it out.',
        'nodata',
      ],
      ['Space adaptation headache', 'Unlikely', 'These mostly happen in the first week of flight.', 'nodata'],
    ],
    acts: [
      [
        'co2',
        'Report the CO₂ reading to environmental control',
        "I'll attach the last 7 sols. This asks them to adjust the cabin.",
        'Send report',
        'Reported',
      ],
      [
        'spo2',
        'Check your SpO₂',
        'One minute with the pulse oximeter rules out low oxygen.',
        'Record',
        'Recorded',
        { meas: 'bp', flag: 'bp' },
      ],
      ['rest', 'Rest 20 minutes and drink water', 'And protect your sleep window tonight.', "I've rested", 'Done'],
    ],
    med: [
      'Need pain relief?',
      "I don't suggest drug names or doses. Ask CMO Okafor; they'll follow the on-board medical procedures.",
    ],
  },
  rash: {
    name: 'Rash or cold sore',
    risk: 'Immune changes',
    photo: true,
    blocksEva: false,
    followMin: 720,
    followQ: 'How does the rash look now?',
    qs: [
      ['where', 'Where is it?', ['Lips or face', 'Arms or hands', 'Torso', 'Legs']],
      [
        'look',
        'What does it look like? Pick all that apply',
        ['Red patches', 'Small blisters', 'Cold sore on the lip', 'Itchy', 'Painful'],
        true,
      ],
      [
        'withs',
        'Anything else?',
        ['Fever or chills', 'Feeling unwell', 'Trouble breathing or swollen face', 'None of these'],
      ],
    ],
    defaults: { where: 'Lips or face', look: ['Cold sore on the lip'], withs: 'None of these' },
    red: (a) => a.withs === 'Trouble breathing or swollen face',
    check: () => [
      [
        'Radiation today',
        ctx().spe ? (radOk() ? 'No active event' : 'Solar event (replay)') : 'ISS dose steady',
        ctx().spe && !radOk() ? 'High' : 'OK',
        ctx().spe && !radOk() ? 'alert' : 'ok',
        0,
      ],
      ['Sleep', sigText('sleep'), stLab(sigSt('sleep')), sigSt('sleep'), 0],
      ['Workload', '11.5 h scheduled yesterday', 'High', 'watch', 0],
      ['Last saliva sample', 'About 4 weeks ago, results pending', 'Old', 'nodata', 0],
    ],
    chart: () =>
      `<div class="mt-4 border border-border p-3"><div class="flex flex-wrap items-center gap-2"><p class="lbl">Inflammation marker IL-6 · Inspiration4 crew</p>${REAL}</div>${lineChart({ label: 'Inspiration4 crew average serum IL-6 before and after flight', vals: I4.il6, xs: I4.xs, ticks: [0, 2, 4, 6, 8], fmt: (v) => v + ' pg/mL', tip: (x, v) => `${x}: ${v} pg/mL (crew average)`, xLabel: 'DAYS BEFORE LAUNCH (L) / AFTER RETURN (R)', H: 190 })}<p class="text-xs text-muted-foreground">Average of 4 crew, NASA OSDR OSD-575. IL-6 rose about 1.8× the day after a 3-day flight, then settled back. It shows spaceflight changes the immune system; it is not Mei Lin's data and does not measure rash risk.</p></div>`,
    checkNote: (a) =>
      a.withs === 'Fever or chills' ? "Fever with a rash needs your CMO today. I'll include it in the handover." : '',
    context:
      'NASA lists radiation, poor sleep and microgravity as stressors that can change the immune system. Photos are kept so you and your CMO can compare day by day.',
    causes: [
      [
        'A dormant virus waking up',
        'Possible',
        'Spaceflight stress can reactivate viruses such as the ones behind cold sores and shingles. Radiation and short sleep both add to that stress.',
        'watch',
      ],
      [
        'Allergy or skin irritation',
        'Possible',
        'Some astronauts report rashes and unusual allergies in flight.',
        'watch',
      ],
    ],
    acts: [
      [
        'photo',
        'Take a photo every day at the same spot',
        'So changes are easy to see.',
        'Set daily reminder',
        'Reminder set',
      ],
      [
        'share',
        'Keep towels and utensils to yourself for now',
        'Microbes pass between people more easily in a closed habitat.',
        'Got it',
        'Done',
      ],
      ['sleep', 'Protect your sleep window tonight', 'Rest helps your immune system.', 'Set reminder', 'Reminder set'],
    ],
    med: [
      'Need a cream or medication?',
      "I don't suggest treatments. Ask CMO Okafor; they'll follow the on-board medical procedures.",
    ],
  },
  dizzy: {
    name: 'Dizziness or motion sickness',
    risk: 'Balance & inner ear',
    blocksEva: true,
    followMin: 60,
    followQ: 'Is the dizziness any better?',
    qs: [
      ['when', 'When does it happen?', ['When I move my head', 'When I stand up', 'All the time']],
      ['sev', 'How bad is it?', SEV],
      ['withs', 'Anything else? Pick all that apply', ['Nausea', 'Vomiting', 'Blurred vision', 'I fainted'], true],
    ],
    defaults: { when: 'When I stand up', sev: 'Mild', withs: ['Nausea'] },
    red: (a) => has(a.withs, 'I fainted'),
    check: () => [
      ['How common', 'Most astronauts get motion sickness in spaceflight', 'NASA HRP', 'info', 'hrp'],
      chk('Balance test', 'bal'),
      chk('Blood pressure', 'bp'),
      ['Hydration log', 'Below target yesterday', 'Low', 'watch', 0],
    ],
    checkNote: () => '',
    get context() {
      return `${dayLab()} in ${ctx().g}. Motion sickness is most common right after a gravity change.`;
    },
    causes: [
      [
        'Low blood pressure or dehydration',
        'Possible',
        'Dizziness on standing often goes with low fluid intake. Your hydration log was below target yesterday.',
        'watch',
      ],
      [
        'Inner ear still adapting',
        'Less likely',
        'Most adaptation happens soon after a gravity change, and that was a while ago.',
        'nodata',
      ],
    ],
    acts: [
      ['sit', 'Sit down and secure yourself', 'Avoid ladders and the rover until this passes.', "I'm seated", 'Done'],
      ['water', 'Drink some water and log it', 'Your hydration log was below target yesterday.', 'Logged', 'Logged'],
      [
        'bal',
        'Do the balance test once you feel steady',
        'It shows whether your sway has changed.',
        'Start test',
        'Done',
        { meas: 'bal', flag: 'bal' },
      ],
    ],
    med: ['Need motion sickness medication?', "I don't suggest drug names or doses. Ask CMO Okafor."],
  },
  vision: {
    name: 'Vision change',
    risk: 'SANS',
    blocksEva: true,
    followMin: 120,
    followQ: 'Is your vision any better?',
    qs: [
      [
        'what',
        'What has changed? Pick all that apply',
        ['Blurry up close', 'Blurry far away', 'Straight lines look bent', 'A blind spot', 'Sudden loss of vision'],
        true,
      ],
      ['eye', 'Which eye?', ['Left', 'Right', 'Both']],
      ['withs', 'Anything else?', ['Headache', 'Eye pain', 'None of these']],
    ],
    defaults: { what: ['Blurry up close'], eye: 'Both', withs: 'None of these' },
    red: (a) => has(a.what, 'Sudden loss of vision'),
    check: () => [
      ['How common', 'About 70% of ISS astronauts show swelling at the back of the eye', 'NASA HRP', 'info', 'hrp'],
      ['Optic nerve (OCT)', `+${lastOf(LONGV.eye[envKey()])} µm since launch`, 'Monitor', 'watch', 0],
      ['Last eye exam', ctx().n > 20 ? '12 days ago' : 'Before launch', 'OK', 'ok', 0],
      ['Next OCT scan', 'In about 2 weeks', 'Planned', 'nodata', 0],
    ],
    checkNote: () => "Vision changes always go to your CMO. I've added this to their list.",
    context: 'About 70% of ISS astronauts show some swelling at the back of the eye.',
    causes: [
      [
        'Fluid shift affecting the eye (SANS)',
        'Possible',
        'In low gravity, fluid moves toward the head and can swell the optic nerve. Your OCT trend has been rising.',
        'watch',
      ],
      [
        'Eye strain or dry eyes',
        'Possible',
        'Long screen work and dry cabin air can blur vision for a while.',
        'watch',
      ],
    ],
    acts: [
      [
        'chart',
        'Do the eye chart, one eye at a time',
        'Wear your usual glasses. Use the lit panel in the lab.',
        'Start eye chart',
        'Done: 20/25 both eyes',
      ],
      [
        'amsler',
        'Do the Amsler grid',
        'Tell me if any lines look bent or missing.',
        'Start grid',
        'Done: no distortion',
      ],
      [
        'oct',
        'Bring the next OCT scan forward',
        'Bring it forward to tomorrow, if your CMO agrees.',
        'Request scan',
        'Requested',
      ],
    ],
    med: [
      'Thinking about thigh cuffs or supplements?',
      'NASA is still researching both for SANS. They are not recommended here.',
    ],
  },
  dcs: {
    name: 'Pain or odd symptoms after EVA',
    risk: 'Decompression sickness',
    blocksEva: true,
    direct: true,
    qs: [
      ['when', 'When did it start?', ['During the EVA', 'Within 2 hours after', 'Later']],
      [
        'what',
        'What do you feel? Pick all that apply',
        [
          'Joint or muscle pain',
          'Itching or mottled skin',
          'Tingling or numbness',
          'Trouble breathing',
          'Weakness or confusion',
        ],
        true,
      ],
    ],
    defaults: { when: 'Within 2 hours after', what: ['Joint or muscle pain'] },
    red: (a) =>
      has(a.what, 'Trouble breathing') || has(a.what, 'Weakness or confusion') || has(a.what, 'Tingling or numbness'),
    emerg: 'Stay in the pressurised habitat. If you are still suited, end the EVA safely but quickly and repressurise.',
  },
  mood: {
    name: 'Low mood or stress',
    risk: 'Behavioral health',
    private: true,
    blocksEva: false,
    followMin: 720,
    followQ: 'How are you feeling now?',
    causesTitle: 'What may be adding to it',
    qs: [
      ['feel', 'What fits best? Pick all that apply', ['Low', 'Anxious', 'Irritable', 'Flat', 'Homesick'], true],
      ['long', 'For how long?', ['Just today', 'A few sols', 'More than a week']],
      ['withs', 'Is it affecting anything?', ['My sleep', 'My work', 'Getting on with the crew', 'Not really']],
    ],
    defaults: { feel: ['Low'], long: 'A few sols', withs: 'My sleep' },
    red: () => false,
    check: () => [
      ['Expected stressor', 'Long isolation can raise anxiety and low mood', 'NASA HRP', 'info', 'hrp'],
      ['Sleep', sigText('sleep'), stLab(sigSt('sleep')), sigSt('sleep'), 0],
      ['Workload', '11.5 h scheduled yesterday', 'High', 'watch', 0],
      ['Time in the mission', dayLab(), '', 'nodata', 0],
    ],
    checkNote: () => '',
    context: 'Only you can see this. Nothing here goes to your CMO or the ground unless you choose to share it.',
    causes: [
      [
        'Short sleep and a heavy schedule',
        'Likely adding to it',
        'Sleep loss and work overload lower mood and make stress harder to handle.',
        'watch',
      ],
      [
        'Isolation and distance from home',
        'Common',
        'Months in a small space, far from family, wear on most crews. That is expected, not a failing.',
        'nodata',
      ],
    ],
    acts: [
      ['journal', 'Write for 10 minutes', 'NASA encourages crews to keep a journal.', 'Open journal', 'Done'],
      [
        'green',
        'Spend 15 minutes at the window or in the greenhouse',
        'Windows and tending plants both ease the sense of confinement.',
        "I'll do that",
        'Planned',
      ],
      [
        'relax',
        'Block out an hour of free time tonight',
        "I'll hold 20:00–21:00 on your schedule.",
        'Hold the time',
        'Held',
      ],
    ],
  },
};
export const STEPS = [
  ['assess', 'Describe'],
  ['check', 'Check data'],
  ['interpret', 'Possible causes'],
  ['act', 'Act'],
  ['follow', 'Follow up'],
];
export const actDone = (a) => S.care.acts[a[0]] || (a[5] && a[5].flag && todayE(a[5].flag));
export const ansLine = () =>
  Object.values(S.care.ans)
    .map((v) => (Array.isArray(v) ? v.join(', ') : v))
    .filter(Boolean)
    .join(' · ')
    .toLowerCase();
