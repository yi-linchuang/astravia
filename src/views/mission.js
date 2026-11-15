// Mission readiness: requirements per task, EVA radiation rule, preparation checklists.
import { back, btn, head, pageTitle, panel, pill, rdPill, stPill } from '../components/primitives.js';
import { ctx } from '../data/env.js';
import { FLOWS } from '../data/flows.js';
import { judge } from '../data/indicators.js';
import {
  ALERT,
  ISS_RAD,
  SRC_STD,
  clearMin,
  evaDose,
  eventDose,
  mGy,
  radLabel,
  radNow,
  radOk,
  radSrc,
  radTotal,
} from '../data/radiation.js';
import { caseActive, todayE } from '../data/records.js';
import { blockers, reqs, sigText, tasks } from '../data/signals.js';
import { hm } from '../lib/util.js';
import { S } from '../state.js';
import { taskTable } from './today.js';

export function vMission() {
  const c = ctx(),
    lbl = c.mainShort;
  if (!S.task)
    return `${pageTitle('Mission readiness', 'Layer 3 · Ready for the mission')}<p class="-mt-3 mb-5 max-w-3xl text-sm text-muted-foreground">The same body state can be fine for routine work and not fine for ${c.mainType === 'EVA' ? 'an EVA' : 'high-risk work'}, and fine in one environment and not in another. Showing tasks and requirements for ${c.name}. Change the environment at the top.</p>
    <div class="grid gap-5 lg:grid-cols-12"><div class="min-w-0 lg:col-span-8">${panel('Today and coming up', taskTable())}</div><div class="min-w-0 lg:col-span-4">${panel(
      'Task types',
      `<ul class="space-y-3 text-sm">${[
        ['EVA', 'Cognition, heart, oxygen and prebreathe, balance on a surface, radiation, symptoms, strength'],
        ['Gravity transition', 'Balance, motion sickness, blood pressure, fluids, manual piloting'],
        ['Routine', 'Cognition and sleep. Low risk: watch only'],
        ['Exercise', "Heart recovery. Adjust intensity, don't cancel"],
      ]
        .map((x) => `<li><p class="lbl">${x[0]}</p><p class="text-muted-foreground">${x[1]}</p></li>`)
        .join('')}</ul>`,
    )}</div></div>`;
  const t = tasks().find((x) => x.id === S.task);
  const top = `${back('All tasks', 'task', 'data-v=""')}<div class="mb-1 flex flex-wrap items-center gap-3"><h1 class="text-2xl font-bold">${t.name}</h1>${rdPill(t.st)}</div><p class="num mb-5 text-sm text-muted-foreground">${t.time ? `${hm(t.time)}–${hm(t.end)}` : t.why.split('.')[0]} · Type: ${t.type}</p>`;
  if (t.id === 'lab')
    return (
      top +
      panel(
        'Assessment',
        `${head('Go', 'You meet every requirement for a routine task.')}<p class="text-sm text-muted-foreground">Sleep and reaction time may be below baseline, but routine work is low risk. Just keep an eye on them.</p>`,
      )
    );
  if (t.id === 'ex')
    return (
      top +
      panel(
        'Assessment',
        `${head(t.st === 'modify' ? 'Drop one resistance level' : 'Go', t.st === 'modify' ? `${sigText('cardio')}. Your heart has not fully recovered.` : 'No heart-rate flag today.')}<ul class="list-disc space-y-1 pl-5 text-sm text-muted-foreground"><li>Do the full 1.5 hours${t.st === 'modify' ? ', one resistance level lower' : ''}.</li><li>Check your heart rate afterwards and see how fast it settles.</li><li>Don't skip it. Exercise is your main defence against bone, muscle and fitness loss.</li></ul>`,
      )
    );
  if (t.id === 'asc') {
    const n = c.next,
      B = todayE('bal'),
      P = todayE('bp'),
      bs = B && judge('bal', B),
      ps = P && judge('bp', P);
    const R = [
      [
        'Balance & motion sickness',
        c.zero
          ? 'Not testable in 0 g. Test as soon as you are in gravity'
          : B
            ? `Sway ${B.v.sway} cm²`
            : "Today's balance test is due",
        c.zero ? 'nodata' : B ? bs : 'nodata',
      ],
      ['Blood pressure regulation', P ? `${P.v.sys}/${P.v.dia}` : "Today's reading is due", P ? ps : 'nodata'],
      [
        'Fluid loading plan',
        'Starts the day before. Drinking more before a gravity change helps prevent low blood pressure',
        'nodata',
      ],
      ['Lower-body compression garment', 'Fit checked 10 days ago (simulated)', 'ok'],
      [
        'Manual piloting practice',
        'Last simulator run 9 days ago. NASA is still studying how gravity changes affect piloting',
        'watch',
      ],
      ['Seat and restraint check', 'Scheduled the day before', 'nodata'],
    ];
    return (
      top +
      `<div class="grid gap-5 lg:grid-cols-12"><div class="min-w-0 lg:col-span-8">${panel('Preparation checklist', `${head(`Getting ready for ${n.trans}`, 'Every gravity change affects orientation, hand-eye coordination, balance and blood pressure. You may need time to adapt before critical tasks.')}<div class="overflow-x-auto"><table class="w-full min-w-[460px] text-sm"><thead><tr class="border-b border-border text-left"><th class="lbl py-2 pr-3">What the transition needs</th><th class="lbl py-2 pr-3">Where you are</th><th class="lbl py-2">Status</th></tr></thead><tbody>${R.map((r) => `<tr class="border-b border-border last:border-0"><td class="py-2.5 pr-3 font-medium">${r[0]}</td><td class="py-2.5 pr-3 text-muted-foreground">${r[1]}</td><td class="py-2.5">${r[2] === 'nodata' ? pill('To do', 'minus', 'nodata') : stPill(r[2])}</td></tr>`).join('')}</tbody></table></div><p class="mt-3 text-xs text-muted-foreground">Checklist items and timing are product assumptions. Fluids and compression garments are the countermeasures NASA uses before landing.</p>`)}</div><div class="min-w-0 lg:col-span-4">${panel('Why this matters', `<p class="text-sm text-muted-foreground">Moving between gravity fields can cause motion sickness, light-headedness and fainting, and makes vehicle control harder.</p><div class="mt-4 flex flex-wrap gap-2">${c.zero || B ? '' : btn('Record balance', 'measure', 'outline', 'data-v="bal"')}${P ? '' : btn('Record blood pressure', 'measure', 'outline', 'data-v="bp"')}</div>`)}</div></div>`
    );
  }
  const Rq = reqs(),
    B2 = blockers(),
    f = S.care.flow && FLOWS[S.care.flow],
    by = (k) => Rq.find((r) => r.key === k);
  const acts = [],
    add = (key, name, subDone, subTodo, b) => {
      const r = by(key);
      acts.push({ done: !r.block, name, sub: !r.block ? subDone : subTodo, b });
    };
  if (c.id !== 'vehicle') {
    add(
      'cog',
      'Do the reaction test',
      by('cog').ev,
      '5 taps, under a minute',
      btn('Start test', 'measure', 'outline', 'data-v="cog"'),
    );
    add(
      'bp',
      'Record blood pressure and SpO₂',
      by('bp').ev,
      'About 4 min',
      btn('Record', 'measure', 'outline', 'data-v="bp"'),
    );
    if (!c.zero)
      add(
        'bal',
        'Record the balance test',
        by('bal').ev,
        'About 3 min',
        btn('Record', 'measure', 'outline', 'data-v="bal"'),
      );
    acts.push({
      done: S.prebreathe,
      name: 'Complete the prebreathe protocol',
      sub: S.prebreathe
        ? 'Done. Protects against decompression sickness'
        : 'Breathing oxygen before the outing clears nitrogen from your body',
      b: btn('Demo: mark complete', 'prebreathe', 'ghost'),
    });
    if (c.spe && clearMin() > 0)
      acts.push({
        done: radOk(),
        name: 'Wait for the radiation alert to clear',
        sub: radOk() ? 'Alert cleared' : `Alert expected to clear around ${hm(clearMin())}. Nothing to do meanwhile`,
        b: btn(`Demo: skip to ${hm(clearMin())}`, 'ff', 'ghost', `data-v="${clearMin()}"`),
      });
  }
  if (S.care.status !== 'none' && f && f.blocksEva)
    acts.push({
      done: !caseActive(),
      name: `${f.name} resolved`,
      sub: caseActive() ? 'Still being followed up' : 'Confirmed better',
      b: btn('View care', 'go', 'outline', 'data-v="care"'),
    });
  const left = acts.filter((a) => !a.done).length;
  const rowSt = (r) =>
    r.block
      ? pill('Blocking', 'alert', 'alert')
      : r.st === 'na'
        ? '<span class="badge b-nodata">N/A</span>'
        : stPill(r.st);
  return (
    top +
    `<div class="grid gap-5 lg:grid-cols-12"><div class="grid min-w-0 content-start gap-5 lg:col-span-7">
    ${panel('Requirements', `${head(S.evaCleared ? `Cleared for ${lbl}` : B2.length ? `${B2.length} requirement${B2.length > 1 ? 's' : ''} not met` : 'All requirements met', S.evaCleared ? 'Sleep and strength may still be below baseline. Plan shorter carries and rest afterwards.' : 'A high-risk task needs every requirement met.')}<div class="overflow-x-auto"><table class="w-full min-w-[460px] text-sm"><thead><tr class="border-b border-border text-left"><th class="lbl py-2 pr-3">What this task needs</th><th class="lbl py-2 pr-3">Current evidence</th><th class="lbl py-2">Status</th></tr></thead><tbody>${Rq.map((r) => `<tr class="border-b border-border last:border-0"><td class="py-2.5 pr-3 font-medium">${r.name}</td><td class="py-2.5 pr-3 text-muted-foreground" data-hl="reqev-${r.key}">${r.ev}</td><td class="py-2.5" data-hl="reqst-${r.key}">${rowSt(r)}</td></tr>`).join('')}</tbody></table></div><p class="mt-3 text-xs text-muted-foreground">Readings come from what you recorded today. Radiation limits follow NASA-STD-3001; the radiation event and everything else about Mei Lin is simulated. Which requirements block, and their thresholds, are product assumptions.</p>`, { edge: S.evaCleared ? 'green' : '', attr: 'data-celebrate' })}
    ${c.id === 'vehicle' ? '' : radRulePanel()}
    </div><div class="grid min-w-0 content-start gap-5 lg:col-span-5">
    ${panel(
      'To clear',
      `<p class="mb-3 text-sm text-muted-foreground">${left ? `${left} left. Any order.` : 'All done.'}</p><ul class="space-y-3">${acts.map((a) => `<li class="flex flex-wrap items-center justify-between gap-3 border ${a.done ? 'border-ok/50' : 'border-border'} p-3"><div class="min-w-0 flex-1"><p class="text-sm font-semibold">${a.name}</p><p class="num text-sm text-muted-foreground">${a.sub}</p></div>${a.done ? pill('Done', 'check', 'ok') : a.b}</li>`).join('')}</ul>
      <div class="mt-4 border-t border-border pt-4">${S.evaCleared ? pill('Reassessed: go', 'check', 'ok') : btn(`Reassess ${lbl}`, 'reeval', 'primary', '', left > 0)}${!S.evaCleared && left ? `<p class="mt-2 text-xs text-muted-foreground">Finish the ${left} item${left > 1 ? 's' : ''} above to reassess.</p>` : ''}</div>`,
    )}
    ${c.mainType === 'EVA' ? panel('After the outing', `<p class="text-sm text-muted-foreground">Joint pain, itching, tingling or odd symptoms after a spacewalk can be decompression sickness. Report them straight away.</p><div class="mt-3">${btn('Report symptoms after the outing', 'startflow', 'outline', 'data-v="dcs"')}</div>`) : ''}
    </div></div>`
  );
}
function radRule() {
  const c = ctx(),
    st = c.id === 'station',
    t = radTotal();
  const shelterMin =
    c.id === 'rover' ? '95 min from the base shelter. The rover itself has no shelter' : '40 min from the airlock';
  return [
    {
      name: 'No radiation alert',
      ok: radOk(),
      ev: st
        ? `No solar event reaches the station, which orbits inside Earth's magnetic field. ISS dose today about ${ISS_RAD.total[ctx().n - 1]} mGy/day (ISS data replayed)`
        : radOk()
          ? `Dose rate ${radNow()} µGy/h, below the alert level of ${ALERT} (${radLabel()})`
          : `Alert active: ${radNow()} µGy/h, alert level ${ALERT} (${radLabel()}). Expected to clear around ${hm(clearMin())}`,
      basis:
        "NASA requires the monitoring system to alert the crew when exposure rates pass predefined thresholds [V2 6164]. NASA does not publish the values, so 50 µGy/h is this product's assumption.",
    },
    {
      name: 'Shielding within 2 hours',
      ok: true,
      ev: `The farthest point of ${c.mainShort} is ${shelterMin}`,
      basis:
        'NASA: real-time alert dosimetry gives a very high level of protection for EVAs if the EVA ends within 2 hours and there is access to shielding (OCHMO-TB-020). The distance is simulated.',
    },
    {
      name: 'Dose within NASA limits',
      ok: true,
      ev: st
        ? `ISS dose so far this flight: ${t.now} mGy (ISS data replayed). A career limit of 600 mSv is far above that`
        : `The day so far: ${mGy(eventDose())} mGy (${radLabel()}). Mission total ${t.now} of 600 mSv (simulated)`,
      basis:
        'NASA limits: under 250 mSv effective dose from a design-reference solar particle event [V1 4031] and under 600 mSv over a career [V1 4030]. mGy and mSv are different units, so comparing them is rough.',
    },
  ];
}
function radRulePanel() {
  const R = radRule(),
    c = ctx(),
    q = (radSrc() ? radSrc().usual : 4) * 4;
  return panel(
    'Radiation rule for this ' + (c.mainType === 'EVA' ? 'outing' : 'task'),
    `<ul class="divide-y divide-border">${R.map((r) => `<li class="py-3 first:pt-0"><div class="flex flex-wrap items-start justify-between gap-2"><p class="min-w-0 flex-1 text-sm font-semibold">${r.name}</p>${r.ok ? pill('Met', 'check', 'ok') : pill('Blocking', 'alert', 'alert')}</div><p class="mt-1 text-sm">${r.ev}</p><p class="mt-1 text-xs text-muted-foreground">${r.basis}</p></li>`).join('')}</ul>
    ${c.spe ? `<div class="mt-1 border border-border bg-muted p-3"><p class="lbl">Keep it as low as reasonably achievable</p><div class="mt-2 grid gap-3 sm:grid-cols-2"><div><p class="num text-lg font-semibold">${mGy(evaDose())} mGy</p><p class="text-xs text-muted-foreground">Going today, 16:00–20:00</p></div><div><p class="num text-lg font-semibold">${mGy(q)} mGy</p><p class="text-xs text-muted-foreground">The same 4 hours on a quiet day</p></div></div><p class="mt-2 text-xs text-muted-foreground">Meeting the limits is not the goal: NASA requires every exposure to be minimised [V1 4029]. Going today costs about ${Math.round(evaDose() / q)}× a quiet day. Whether it is worth that is a call for you and the crew, not for this screen. Both numbers come from the replayed data.</p></div>` : ''}`,
    { right: SRC_STD },
  );
}
