// Signals shown on Today, mission-readiness requirements and the day's tasks.
import { ctx } from './env.js';
import { FLOWS } from './flows.js';
import { judge, sigNum } from './indicators.js';
import { ALERT, ISS_RAD, radLabel, radNow, radOk } from './radiation.js';
import { caseActive, caseBlocks, latest, todayE } from './records.js';
import { S } from '../state.js';

export function signals() {
  const c = S.care,
    f = c.flow && FLOWS[c.flow];
  const sym = {
    id: 'sym',
    name: 'Symptoms',
    cad: 'When needed',
    hz: [],
    st: caseActive() ? 'watch' : 'ok',
    head:
      c.status === 'none'
        ? 'Nothing reported today'
        : c.status === 'resolved'
          ? `${f.name} has eased`
          : c.status === 'cmo'
            ? `${f.name}: passed to your CMO`
            : `${f.name}: follow-up set`,
    now: '',
    base: '',
    vals: null,
    src: 'Reported by you',
    link: '',
    why: 'Some changes only you can feel. The earlier you report, the easier it is to find the cause.',
    todo:
      c.status === 'none'
        ? 'When you feel unwell, press "I feel unwell" in the top bar.'
        : 'Open Guided care to see where you are.',
    basis: '',
  };
  const mind = {
    id: 'mind',
    name: 'Well-being check-in',
    cad: 'Daily · 30 s',
    hz: ['iso'],
    st: S.mind ? 'ok' : 'nodata',
    pill: S.mind ? ['Private', 'check', 'info'] : ['Not done', 'minus', 'nodata'],
    head: S.mind ? 'Checked in today. Only you can see your answers' : 'Not checked in yet today',
    now: '',
    base: '',
    vals: null,
    src: 'Your own answers',
    priv: true,
  };
  const list = [
    sigNum('sleep'),
    sigNum('cardio'),
    sigNum('cog'),
    sym,
    sigNum('bp'),
    sigNum('bal'),
    sigNum('fit'),
    mind,
  ];
  ['temp', 'glu', 'wt'].forEach((id) => {
    if (S.data[id].length) list.push(sigNum(id));
  });
  return list;
}
export const sigText = (id) => {
  const s = signals().find((x) => x.id === id);
  return s ? s.head : '';
};
export const sigSt = (id) => {
  const s = signals().find((x) => x.id === id);
  return s ? s.st : 'nodata';
};
export const changed = () => signals().filter((s) => !s.priv && (s.st === 'watch' || s.st === 'alert'));
export function reqs() {
  const c = ctx(),
    f = S.care.flow && FLOWS[S.care.flow],
    veh = c.id === 'vehicle',
    T = (id) => todayE(id),
    rows = [];
  const R = (key, name, st, ev, block) => ({ key, name, st, ev, block: !!block });
  const cg = T('cog'),
    cgs = cg && judge('cog', cg);
  rows.push(
    cg
      ? R(
          'cog',
          'Reaction & cognition',
          cgs,
          `Today ${cg.v.ms} ms${cgs === 'ok' ? ', within range' : ', slower than your baseline'}`,
          !veh && cgs !== 'ok',
        )
      : R('cog', 'Reaction & cognition', 'nodata', 'No reaction test today', !veh),
  );
  const bp = T('bp'),
    bps = bp && judge('bp', bp);
  rows.push(
    bp
      ? R(
          'bp',
          'Heart & blood pressure',
          bps,
          `BP ${bp.v.sys}/${bp.v.dia}, SpO₂ ${bp.v.spo2}%${bps === 'ok' ? ', within baseline' : ''}`,
          bps === 'alert',
        )
      : R('bp', 'Heart & blood pressure', 'nodata', 'No blood pressure reading today', !veh),
  );
  rows.push(
    veh
      ? R('pre', 'Oxygen & prebreathe', 'na', 'No EVA planned in this phase. Prebreathe is not needed', false)
      : R(
          'pre',
          'Oxygen & prebreathe',
          S.prebreathe ? 'ok' : 'nodata',
          S.prebreathe ? 'Prebreathe complete. Cabin O₂ nominal' : 'Prebreathe not done yet. Cabin O₂ nominal',
          !S.prebreathe,
        ),
  );
  const bl = T('bal'),
    bls = bl && judge('bal', bl);
  rows.push(
    c.zero
      ? R('bal', 'Balance', 'na', 'Not tested in 0 g. You float, so there is no fall risk', false)
      : bl
        ? R('bal', 'Balance', bls, `Sway ${bl.v.sway} cm²${bls === 'ok' ? ', within baseline' : ''}`, bls === 'alert')
        : R('bal', 'Balance', 'nodata', 'No balance test today', true),
  );
  const ft = latest('fit'),
    fts = ft && judge('fit', ft);
  rows.push(
    R(
      'fit',
      'Leg strength',
      ft ? (fts === 'ok' ? 'ok' : 'watch') : 'nodata',
      ft
        ? `Leg press ${ft.v.pct}% of pre-launch${fts === 'ok' ? '' : veh ? '. Protect it now: you will need it on arrival' : '. Does not block; plan shorter carries'}`
        : 'No strength reading yet',
      false,
    ),
  );
  if (c.id === 'station')
    rows.push(
      R(
        'rad',
        'Radiation',
        'ok',
        `No solar event reaches the station inside Earth's magnetic field. ISS dose today about ${ISS_RAD.total[ctx().n - 1]} mGy/day (ISS data replayed)`,
        false,
      ),
    );
  else if (veh)
    rows.push(
      R(
        'rad',
        'Radiation',
        radOk() ? 'ok' : 'alert',
        radOk()
          ? `No alert: ${radNow()} µGy/h (${radLabel()})`
          : `Solar event: ${radNow()} µGy/h (${radLabel()}). Stay near the storm shelter`,
        false,
      ),
    );
  else
    rows.push(
      R(
        'rad',
        'Radiation',
        radOk() ? (c.noShelter ? 'watch' : 'ok') : 'alert',
        radOk()
          ? `No alert: ${radNow()} µGy/h (${radLabel()}).${c.noShelter ? ' There is no shelter on board: stay within 2 hours of the base' : ''}`
          : `Radiation alert active: ${radNow()} µGy/h, alert level ${ALERT} (${radLabel()}).${c.noShelter ? ' No shelter on board: do not leave the base' : ''}`,
        !radOk(),
      ),
    );
  rows.push(
    R(
      'sym',
      'Symptoms',
      caseBlocks() ? 'watch' : 'ok',
      caseBlocks() ? `${f.name} still being followed up` : 'No active symptoms that affect this task',
      caseBlocks(),
    ),
  );
  const sl = sigNum('sleep');
  rows.push(
    R(
      'sleep',
      'Sleep recovery',
      S.data.sleep.length ? (sl.st === 'ok' ? 'ok' : 'watch') : 'nodata',
      S.data.sleep.length
        ? sl.st === 'ok'
          ? 'Within your baseline'
          : sl.head + '. Does not block alone; rest afterwards'
        : 'No sleep data yet',
      false,
    ),
  );
  return rows;
}
export const blockers = () => reqs().filter((r) => r.block);
export function tasks() {
  const c = ctx(),
    b = blockers(),
    cd = sigSt('cardio'),
    exMod = S.data.cardio.length && cd !== 'ok' && cd !== 'nodata';
  const list = [
    {
      id: 'lab',
      time: 540,
      end: 660,
      name: c.id === 'vehicle' ? 'Systems check' : 'Lab maintenance',
      type: 'Routine',
      st: 'ready',
      why: 'Nothing blocking',
    },
    {
      id: 'ex',
      time: 780,
      end: 870,
      name: 'Resistance & aerobic exercise',
      type: 'Exercise',
      st: exMod ? 'modify' : 'ready',
      why: exMod ? sigText('cardio') : 'No heart-rate flag',
    },
    {
      id: 'eva',
      time: 960,
      end: 1200,
      name: c.main,
      type: c.mainType,
      st: S.evaCleared ? 'ready' : 'reassess',
      why: S.evaCleared
        ? 'All requirements met. Rest afterwards'
        : b.length
          ? `${b.length} requirement${b.length > 1 ? 's' : ''} not met`
          : 'All requirements met. Reassess to confirm',
    },
  ];
  if (c.next)
    list.push({
      id: 'asc',
      time: null,
      end: null,
      name: c.next.name,
      type: c.next.type,
      st: 'prepare',
      when: `${c.day} ${c.next.at}`,
      why: `${c.day} ${c.next.at}, in ${c.next.at - c.n} days. Preparation checklist open`,
    });
  list.forEach((t) => {
    if (t.end && S.clock >= t.end) {
      t.st = 'done';
      t.why = '';
    }
  });
  return list;
}
