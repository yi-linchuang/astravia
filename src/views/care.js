// Guided care: symptom picker, five-step flow, escalation levels.
import { callUI } from '../components/modals.js';
import { back, btn, chips, head, ic, infoI, pageTitle, panel, pill } from '../components/primitives.js';
import { ctx } from '../data/env.js';
import { FLOWS, STEPS, actDone, ansLine } from '../data/flows.js';
import { hm, listF } from '../lib/util.js';
import { S } from '../state.js';

function ladder() {
  const c = S.care,
    f = c.flow && FLOWS[c.flow],
    E = ctx(),
    st = c.stage;
  if (st === 'pick' && (c.status === 'none' || !f)) return '';
  if (!f && st !== 'emergency') return '';
  const red = f && f.red && st !== 'pick' && f.red(c.ans);
  const lvl =
    st === 'emergency' || red
      ? 4
      : st === 'fs' || c.status === 'fs'
        ? 3
        : (f && f.direct) || c.status === 'cmo' || st === 'cmo'
          ? 2
          : 1;
  const T = {
    1: [
      'Handle it yourself',
      'One signal, mild, no other symptoms.',
      'Watch it, or re-measure with guidance. If it does not ease, the next step is your CMO.',
      '',
    ],
    2: [
      'Call your CMO',
      f && f.direct
        ? "Symptoms after an EVA can't be judged by self-care."
        : 'The change persists, or comes with symptoms.',
      'CMO Okafor handles this in the habitat. No need to wait for Earth. If it does not improve or the cause is unclear, ' +
        E.ladder3.charAt(0).toLowerCase() +
        E.ladder3.slice(1) +
        '.',
      callUI('CMO Okafor', 'primary'),
    ],
    3: [
      'Ask the flight surgeon',
      'No improvement after your CMO, or the cause is unclear.',
      E.ladder3 + '. Related tasks hold while you wait.',
      E.id === 'station' ? callUI('Flight surgeon', 'primary') : btn('Send records', 'sendfs', 'primary'),
    ],
    4: [
      'Emergency procedure',
      red ? 'You selected a warning sign.' : 'You started the emergency procedure.',
      "Start now. Notify Earth, don't wait for a reply.",
      st === 'emergency' ? '' : btn('Start emergency procedure', 'emergency', 'danger'),
    ],
  }[lvl];
  return panel(
    'Who to call',
    `<div class="border p-4 ${lvl === 4 ? 'border-alert bg-alert-soft' : 'border-primary bg-ok-soft'}"><p class="lbl">${f ? f.name : 'Emergency'}</p><h3 class="mt-1 text-base font-semibold">${T[0]}</h3><p class="mt-1 text-sm text-muted-foreground">${T[1]}</p><p class="mt-1 text-sm">${T[2]}</p>${T[3] ? `<div class="mt-3 flex flex-wrap gap-2">${T[3]}</div>` : ''}</div>${f && f.private ? '<p class="mt-3 text-xs text-muted-foreground">Low mood follows its own private path.</p>' : ''}`,
    { edge: lvl === 4 ? 'alert' : '' },
  );
}
function checkHead(f) {
  const rows = f.check(),
    flag = rows.filter((x) => x[3] === 'watch' || x[3] === 'alert'),
    ok = rows.filter((x) => x[3] === 'ok'),
    miss = rows.filter((x) => x[3] === 'nodata' && x[2] && x[4] !== 'hrp');
  const sub = [
    flag.length ? flag.map((x) => `${x[0]}: ${x[1].replace(/\.$/, '')}`).join('. ') + '.' : '',
    ok.length ? `Normal: ${listF(ok.map((x) => x[0]))}.` : '',
    miss.length ? `Missing: ${listF(miss.map((x) => x[0]))}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return head(
    flag.length
      ? `${listF(flag.map((x) => x[0]))} ${flag.length > 1 ? 'stand' : 'stands'} out.`
      : 'Nothing in your data stands out.',
    sub,
  );
}
function careGrid(main) {
  const l = ladder();
  return `<div class="grid gap-5 lg:grid-cols-12"><div class="min-w-0 ${l ? 'lg:col-span-7' : 'lg:col-span-12'}">${main}</div>${l ? `<div class="min-w-0 lg:col-span-5">${l}</div>` : ''}</div>`;
}
function fsPanel() {
  const c = S.care,
    f = FLOWS[c.flow],
    E = ctx();
  return panel(
    'Escalated · level 3',
    `${head('The flight surgeon has been asked', "The CMO's care did not help, so this moved up one more level. You don't need to explain it again.")}<div class="border border-border bg-muted p-4 text-sm"><p class="lbl">Sent to the flight surgeon</p><ul class="mt-2 list-disc space-y-1 pl-5 text-muted-foreground"><li>${f.name}: ${ansLine()}</li><li>Your CMO's notes and what was tried so far</li><li>Vital signs, the last 24 hours of readings${c.photo ? ' and 1 photo' : ''}</li></ul></div><p class="mt-3 text-sm text-muted-foreground">${E.ladder3}. Related tasks hold while you wait.${f.blocksEva ? ` ${E.mainShort} stays on Reassess until this clears.` : ''}</p><div class="mt-4 flex flex-wrap gap-2">${E.id === 'station' ? callUI('Flight surgeon', 'primary') : btn('Send records', 'sendfs', 'primary')}${btn('Back to Today', 'go', 'outline', 'data-v="home"')}</div>`,
  );
}
export function vCare() {
  const c = S.care,
    st = c.stage,
    f = c.flow && FLOWS[c.flow];
  let main = '';
  if (st === 'pick') {
    const cur =
      c.status !== 'none' && f
        ? panel(
            'Current case',
            `<div class="flex flex-wrap items-center justify-between gap-3"><div><h3 class="text-base font-semibold">${f.name}: ${c.status === 'resolved' ? 'eased' : c.status === 'cmo' ? 'with your CMO' : 'follow-up set'}</h3><p class="text-sm text-muted-foreground">${c.status === 'followup' ? `I'll check in on Today at ${hm(c.followAt)}.` : c.status === 'resolved' ? (f.private && !c.shared ? 'Kept private.' : "Logged in this week's medical summary.") : 'Okafor will come to you.'}</p></div>${btn('Back to Today', 'go', 'outline', 'data-v="home"')}</div>`,
            { cls: 'mb-5' },
          )
        : '';
    main =
      cur +
      panel(
        "What's wrong?",
        `<p class="mb-3 text-sm text-muted-foreground">Pick the main one. Each walks you through the same 5 steps.</p><div class="grid gap-2 sm:grid-cols-2">${Object.entries(
          FLOWS,
        )
          .map(
            ([k, x]) =>
              `<button type="button" data-act="startflow" data-v="${k}" class="flex min-h-[56px] items-center justify-between gap-3 border border-border bg-card px-4 py-2 text-left hover:border-primary"><span class="min-w-0"><span class="block text-sm font-medium">${x.name}</span><span class="block text-xs text-muted-foreground">${x.risk}${x.private ? ' · private' : ''}${x.photo ? ' · photo' : ''}</span></span>${ic('right', 'h-4 w-4 shrink-0 text-muted-foreground')}</button>`,
          )
          .join('')}</div>`,
      ) +
      panel(
        'Emergency',
        `<div class="flex flex-wrap items-center justify-between gap-3"><div class="min-w-0"><h3 class="text-base font-semibold">Chest pain, trouble breathing, sudden vision loss, fainting, or weakness on one side?</h3><p class="text-sm text-muted-foreground">Skip the questions. Start the emergency procedure now.</p></div>${btn('Start emergency procedure', 'emergency', 'danger')}</div>`,
        { edge: 'alert', cls: 'mt-5' },
      );
  } else if (st === 'emergency') {
    main = panel(
      'Emergency procedure active',
      `<div class="flex items-center gap-2 text-alert">${ic('alert', 'h-5 w-5 pulse')}<h1 class="text-xl font-bold">Emergency procedure started</h1></div><ol class="mt-4 space-y-3 text-sm"><li class="flex gap-3">${pill('Done', 'check', 'ok')}<span>All crew notified. CMO Okafor is on the way.</span></li><li class="flex gap-3">${pill('Done', 'check', 'ok')}<span>Your symptoms, vital signs and the last 24 hours of readings were sent to Earth. Follow the habitat procedure; don't wait for a reply.</span></li><li class="flex gap-3">${pill('Now', 'clock', 'info')}<span>${f && f.emerg ? f.emerg : "Stay where you are and sit or lie down. Don't move to fetch equipment."}</span></li></ol><p class="mt-4 text-xs text-muted-foreground">Demo screen. Real steps follow the mission's emergency medical procedure cards, including the cardiovascular emergency training Mars crews receive.</p><div class="mt-4">${btn('End demo, back to symptoms', 'carereset', 'outline')}</div>`,
      { edge: 'alert' },
    );
  } else if (st === 'cmo') {
    const done = f.acts
      ? f.acts
          .filter(actDone)
          .map((a) => a[1].toLowerCase())
          .join('; ')
      : '';
    main = panel(
      'Escalated · level 2',
      `${head('CMO Okafor has been notified', f.direct ? "Symptoms after an EVA can't be judged by self-care, so this goes straight to your CMO." : "It did not improve, so it moved up one level. You don't need to explain it again.")}<div class="border border-border bg-muted p-4 text-sm"><p class="lbl">Sent to your CMO</p><ul class="mt-2 list-disc space-y-1 pl-5 text-muted-foreground"><li>${f.name}: ${ansLine()}</li>${
        f.check
          ? `<li>${f
              .check()
              .map((x) => x[0] + ': ' + x[1].toLowerCase())
              .join('; ')}</li>`
          : '<li>EVA log, suit pressure record and prebreathe times</li>'
      }${done ? `<li>Done so far: ${done}</li>` : ''}${c.photo ? '<li>1 photo attached</li>' : ''}</ul></div><p class="mt-3 text-sm text-muted-foreground">${f.direct ? "Stay in the pressurised habitat until Okafor has seen you. This follows NASA's current approach to decompression sickness: end the EVA safely but quickly and return to a pressurised space. " : ''}If it needs the flight surgeon, the same package goes to Earth with your vital signs and any images.${f.blocksEva ? ` ${ctx().mainShort} stays on Reassess until this clears.` : ''}</p><div class="mt-4 flex flex-wrap gap-2">${btn('Back to Today', 'go', 'primary', 'data-v="home"')}${f.private ? '' : btn('Still no improvement', 'fsescalate', 'outline')}${btn('Report another symptom', 'stage', 'ghost', 'data-v="pick"')}</div>`,
    );
  } else if (st === 'fs') {
    main = fsPanel();
  } else if (st === 'share') {
    main = panel(
      'Your choice',
      `${head('Would you like someone to know?', "It hasn't eased. You decide whether to share it, and with whom.")}<div class="grid gap-2">${btn('Share with CMO Okafor', 'moodshare', 'outline', 'data-v="cmo"')}${btn(`Send a message to ground support · reply ${ctx().reply === 'live' ? 'live' : 'in ' + ctx().reply}`, 'moodshare', 'outline', 'data-v="ground"')}${btn('Keep it private for now', 'moodshare', 'ghost', 'data-v="private"')}</div><p class="mt-3 text-xs text-muted-foreground">Support from Earth is by message, not live call, because of the delay.</p>`,
      { edge: 'info' },
    );
  } else {
    const idx = STEPS.findIndex((x) => x[0] === st);
    const stepper = `<ol class="mb-5 flex flex-wrap gap-x-1 gap-y-2 text-[12px] uppercase tracking-[.1em]">${STEPS.map((x, i) => `<li class="flex items-center gap-1.5 ${i === idx ? 'text-primary' : i < idx ? 'text-foreground' : 'text-muted-foreground'}" ${i === idx ? 'aria-current="step"' : ''}><span class="num grid h-6 w-6 place-items-center border text-xs ${i < idx ? 'border-ok text-ok' : i === idx ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}">${i < idx ? ic('check', 'h-3.5 w-3.5') : i + 1}</span>${i === 2 && f.causesTitle ? 'Context' : x[1]}${i < 4 ? '<span class="mx-1 text-border">——</span>' : ''}</li>`).join('')}</ol>`;
    const nav = (prev, next, label, dis) =>
      `<div class="mt-5 flex flex-wrap justify-between gap-2">${btn('Back', 'stage', 'ghost', `data-v="${prev}"`)}${btn(label, next.startsWith('!') ? next.slice(1) : 'stage', 'primary', `data-v="${next}"`, dis)}</div>`;
    let body = '',
      title = '';
    if (st === 'assess') {
      title = 'Step 1 · Describe';
      const photo = f.photo
        ? `<div><p class="lbl mb-2">Add a photo (optional)</p>${c.photo ? `<div class="flex flex-wrap items-end gap-3"><img src="${c.photo}" alt="Your photo of the affected area" class="max-h-40 border border-border"><span>${pill('Photo added', 'check', 'ok')}</span></div>` : `<label for="care-photo" class="btn btn-outline cursor-pointer">Take or choose a photo</label><input id="care-photo" type="file" accept="image/*" capture="environment" class="sr-only" data-photo><p class="mt-2 text-xs text-muted-foreground">Good light, about 20 cm away. The photo stays on this device in the prototype.</p>`}</div>`
        : '';
      body = `${head(`Tell me about it`, "Just tap. I'll fill in the mission phase and habitat data.")}<div class="space-y-5">${f.qs.map((q) => `<div><p class="lbl mb-2">${q[1]}</p>${chips(q[0], q[2], q[3])}</div>`).join('')}${photo}</div>${nav('pick', '!assessnext', f.direct ? 'Next' : 'Next: check data')}`;
    }
    if (st === 'check') {
      title = 'Step 2 · Check data';
      const note = f.checkNote(c.ans);
      body = `${checkHead(f)}<div class="grid gap-3 sm:grid-cols-2">${f
        .check()
        .map(
          (x) =>
            `<div class="border border-border bg-muted p-3"><div class="flex flex-wrap items-center justify-between gap-2"><span class="lbl">${x[0]}</span>${x[2] ? pill(x[2], x[3] === 'ok' ? 'check' : x[3] === 'nodata' ? 'minus' : x[3] === 'info' ? 'activity' : 'alert', x[3]) : ''}</div><p class="num mt-1 text-sm">${x[1]}</p><p class="mt-1 text-[11px] uppercase tracking-[.1em] ${x[4] === 'data' ? 'text-info' : 'text-muted-foreground'}">${x[4] === 'data' ? infoI('Real NASA open data') : x[4] === 'hrp' ? infoI('Source: NASA Human Research Program') : ''}</p></div>`,
        )
        .join(
          '',
        )}</div>${f.chart ? f.chart() : ''}${note ? `<div class="mt-4 border border-warn bg-warn-soft p-3 text-sm text-warn">${note}</div>` : ''}<p class="mt-4 text-sm text-muted-foreground">${f.context}</p>${nav('assess', 'interpret', 'Next')}`;
    }
    if (st === 'interpret') {
      title = 'Step 3 · ' + (f.causesTitle || 'Possible causes');
      body = `${head(f.causesTitle || 'What could be causing it', "I don't diagnose. These match your data; they are not conclusions.")}<div class="space-y-3">${f.causes.map((x) => `<div class="border border-border p-4"><div class="flex flex-wrap items-center justify-between gap-2"><span class="text-sm font-semibold">${x[0]}</span>${pill(x[1], x[3] === 'nodata' ? 'minus' : 'alert', x[3])}</div><p class="mt-1 text-sm text-muted-foreground">${x[2]}</p></div>`).join('')}</div>${nav('check', 'act', 'Next: what to do now')}`;
    }
    if (st === 'act') {
      title = 'Step 4 · Act';
      const any = f.acts.some(actDone);
      body = `${head('What you can do now', 'All of these can be done in the habitat. Mark each one as you go.')}<ul class="space-y-3">${f.acts.map((a) => `<li class="flex flex-wrap items-center justify-between gap-3 border border-border p-4"><div class="min-w-0 flex-1"><p class="text-sm font-semibold">${a[1]}</p><p class="text-sm text-muted-foreground">${a[2]}</p></div>${actDone(a) ? pill(a[4], 'check', 'ok') : btn(a[3], 'careact', 'outline', `data-v="${a[0]}"`)}</li>`).join('')}</ul>${f.med ? `<div class="mt-4 border border-border bg-muted p-4 text-sm"><p class="font-semibold">${f.med[0]}</p><p class="text-muted-foreground">${f.med[1]}</p><div class="mt-3">${callUI('CMO Okafor')}</div></div>` : ''}${nav('interpret', 'follow', 'Next: set follow-up', !any)}${any ? '' : '<p class="mt-2 text-right text-xs text-muted-foreground">Complete at least one action to continue.</p>'}`;
    }
    if (st === 'follow') {
      title = 'Step 5 · Follow up';
      const hrs = f.followMin / 60;
      body = `${head(`I'll check back in ${hrs} hour${hrs > 1 ? 's' : ''}`, `At ${hm(S.clock + f.followMin)} I'll ask: "${f.followQ}"`)}<ul class="list-disc space-y-1 pl-5 text-sm text-muted-foreground">${f.private ? "<li>If you feel better: nothing else happens.</li><li>If you don't: I'll ask whether you want to share it. You decide.</li><li>This stays out of the weekly medical summary unless you share it.</li>" : `<li>If it's better: I'll update your health status${f.blocksEva ? `, and ${ctx().mainShort} loses one blocker` : ''}.</li><li>If it isn't, or something new appears: I'll notify your CMO and hand over your records.</li><li>This case goes into this week's summary for the flight surgeon.</li>`}</ul><p class="mt-3 text-xs text-muted-foreground">Follow-up timing is a product assumption.</p>${nav('act', '!setfollow', 'Set reminder and go to Today')}`;
    }
    main = `${back('Symptoms', 'stage', 'data-v="pick"')}<div class="mb-4 flex flex-wrap items-center gap-3"><h1 class="text-2xl font-bold">${f.name}</h1>${f.private ? pill('Private', 'check', 'info') : ''}</div>${f.direct ? '' : stepper}${panel(title, body)}`;
  }
  return `${st === 'pick' ? pageTitle('Guided care', 'Layer 2 · Know what to do') + '<p class="-mt-3 mb-5 text-sm text-muted-foreground">Tell me one symptom. I\'ll walk you through describing it, checking data, possible causes, what to do, and follow-up.</p>' : ''}${careGrid(main)}`;
}
/* ---------- guided measurements ---------- */
export const backName = () =>
  ({
    home: 'Today',
    record: 'Record',
    health: 'My health',
    care: 'Guided care',
    mission: 'Mission readiness',
    habitat: 'Environment',
  })[S.measBack] || 'Back';
