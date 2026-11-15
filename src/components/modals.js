// Modal dialogs (Take action, Who to call, Solar particle event), the simulated call, and the modal layer.
import { lineChart } from './charts.js';
import { btn, ic, panel, pill } from './primitives.js';
import { ctx } from '../data/env.js';
import { FLOWS, actDone } from '../data/flows.js';
import { ALERT, clearMin, radLabel, radNow, radSrc, speActive } from '../data/radiation.js';
import { changed } from '../data/signals.js';
import { fmtT, hm, r1 } from '../lib/util.js';
import { render } from '../render.js';
import { S } from '../state.js';
import { shelterMap } from '../views/environment.js';

function helpModal() {
  const E = ctx(),
    card = (lvl, title, when, who, cta, alert) =>
      `<li class="border p-4 ${alert ? 'border-alert bg-alert-soft' : 'border-border bg-muted'}"><div class="flex items-center gap-2"><span class="num grid h-5 w-5 place-items-center border text-[11px] ${alert ? 'border-alert text-alert' : 'border-primary text-primary'}">${lvl}</span><h3 class="text-sm font-semibold">${title}</h3></div><p class="mt-2 text-sm"><span class="lbl">When</span><br>${when}</p><p class="mt-2 text-sm text-muted-foreground">${who}</p><div class="mt-3 flex flex-wrap gap-2">${cta}</div></li>`;
  return modalShell(
    'Who to call',
    `<p class="mb-3 text-sm text-muted-foreground">If it is mild and only one signal, handle it yourself: watch it, or re-measure with guidance. Otherwise pick the closest situation below. ${E.link}</p><ol class="space-y-3">
    ${card(2, 'Call your CMO', 'A change that persists, or comes with symptoms.', `CMO Okafor is ${E.id === 'rover' ? 'at the base, reachable by radio' : 'on board and available now'}. No need to wait for Earth.`, callUI('CMO Okafor', 'primary'))}
    ${card(3, 'Ask the flight surgeon', 'No improvement after your CMO, an unclear cause, or it affects a high-risk task.', `${E.ladder3}. Related tasks hold while you wait.`, E.id === 'station' ? callUI('Flight surgeon', 'primary') : btn('Send records', 'sendfs', 'primary'))}
    ${card(4, 'Emergency procedure', 'Chest pain, trouble breathing, sudden severe headache, sudden vision loss, one-sided weakness, or fainting.', "Start now. Notify Earth, don't wait for a reply.", btn('Start emergency procedure', 'emergency', 'danger'), true)}</ol>`,
  );
}
function speModal() {
  if (!speActive())
    return modalShell(
      'Space weather',
      `<p class="text-sm">${pill('No active event', 'check', 'ok')} The dose rate is ${r1(radNow())} µGy/h, below the alert level.</p>`,
    );
  const c = ctx(),
    sr = radSrc(),
    peak = Math.max(...sr.series),
    started = sr.series.findIndex((v) => v > ALERT),
    now = Math.min(23, Math.floor(S.clock / 60));
  const row = (k, v) =>
    `<li class="flex justify-between gap-3 border-b border-border py-2 last:border-0"><span class="text-muted-foreground">${k}</span><span class="num text-right">${v}</span></li>`;
  const chart = lineChart({
    label: 'Radiation dose rate, ' + sr.name,
    vals: sr.series,
    xs: sr.series.map((_, i) => hm(i * 60)),
    every: 4,
    ticks: peak > 150 ? [0, 100, 200, 300] : [0, 50, 100, 150],
    fmt: (v) => v + ' µGy/h',
    tip: (x, v, i) => `${x}: ${r1(v)} µGy/h${i > now ? ' (still ahead)' : ''}`,
    xLabel: 'HABITAT TIME · HOURLY',
    fc: now,
    area: true,
    lines: [{ v: ALERT, t: 'ALERT LEVEL', t2: '50 · ASSUMED' }],
  });
  const shelter = c.noShelter
    ? '<p class="text-sm text-warn">There is no shelter on a rover. Head back toward the base and stay within 2 hours of it.</p>'
    : `${shelterMap()}<p class="mt-2 text-xs text-muted-foreground">The floor plan and shielding levels are invented. The idea comes from CSA's Radi-N2, which mapped the best-protected areas of the ISS.</p>`;
  const act = c.noShelter
    ? ''
    : S.shelter
      ? pill('You are in the storm shelter', 'check', 'ok')
      : btn("I've moved to the shelter", 'shelter', 'primary');
  return modalShell(
    'Solar particle event · ' + radLabel(),
    `<div class="flex items-center gap-2 text-alert">${ic('alert', 'h-5 w-5 pulse')}<h3 class="text-base font-bold">Move to the shelter now</h3></div>
    <div class="mt-4 grid gap-5 md:grid-cols-2"><div class="min-w-0"><h3 class="lbl mb-1">Dose rate</h3><ul class="text-sm">${row('Now', `<span class="text-alert">${r1(radNow())} µGy/h</span>`)}${row('Alert level', ALERT + ' µGy/h')}${row('Peak today', `${r1(peak)} µGy/h · about ${Math.round(peak / sr.usual)}× usual`)}${row('Started', started <= 0 ? 'Before midnight' : hm(started * 60))}${row('Expected below alert', 'after ' + hm(clearMin()))}</ul>
      <div class="mt-3">${chart}</div></div>
      <div class="min-w-0"><h3 class="lbl mb-2">Where to shelter</h3>${shelter}<div class="mt-3 flex flex-wrap gap-2">${act}${btn(`${c.mainShort} blockers`, 'task', 'ghost', 'data-v="eva"')}</div></div></div>`,
    true,
  );
}
let callT = null,
  callI = null;
export function startCall(who) {
  clearTimeout(callT);
  clearInterval(callI);
  S.call = { who, stage: 'ringing' };
  callT = setTimeout(() => {
    if (!S.call || S.call.stage !== 'ringing') return;
    S.call.stage = 'live';
    S.call.t0 = Date.now();
    render(false);
    callI = setInterval(() => {
      const el = document.getElementById('call-t');
      if (el && S.call && S.call.stage === 'live') el.textContent = fmtT(Math.floor((Date.now() - S.call.t0) / 1000));
    }, 500);
  }, 1800);
}
export function endCall() {
  clearTimeout(callT);
  clearInterval(callI);
  const k = S.call;
  S.call = k && k.stage === 'live' ? { who: k.who, stage: 'ended', dur: Math.floor((Date.now() - k.t0) / 1000) } : null;
}
export function callUI(who, v = 'outline') {
  const k = S.call,
    box = 'flex flex-wrap items-center gap-3 border px-3 py-2 text-sm';
  if (!k || k.who !== who) return btn(ic('care') + 'Call ' + who, 'call', v, `data-v="${who}"`);
  if (k.stage === 'ringing')
    return `<div class="${box} border-border bg-muted"><span class="pulse text-primary">${ic('care')}</span>Calling ${who}…${btn('Cancel', 'endcall', 'ghost')}</div>`;
  if (k.stage === 'live')
    return `<div class="${box} border-primary bg-ok-soft"><span class="callbars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Connected to ${who} · <span id="call-t" class="num">${fmtT(Math.floor((Date.now() - k.t0) / 1000))}</span>${btn('End call', 'endcall', 'outline')}</div>`;
  return `<div class="${box} border-border bg-muted">${pill('Call ended', 'check', 'ok')}<span class="text-muted-foreground">${fmtT(k.dur)} · your records were on screen</span>${btn('Call again', 'call', 'ghost', `data-v="${who}"`)}</div>`;
}
function symptomModal() {
  const c = S.care,
    f = c.flow && FLOWS[c.flow];
  if (!f || c.status === 'none') return '';
  const E = ctx(),
    due = c.status === 'followup' && S.clock >= c.followAt,
    hrs = f.followMin ? f.followMin / 60 : 0;
  const acts = f.acts
    ? `<h3 class="lbl">What to do now</h3><ul class="mt-2 space-y-2">${f.acts.map((a) => `<li class="flex flex-wrap items-center justify-between gap-3 border border-border p-3"><div class="min-w-0 flex-1"><p class="text-sm font-semibold">${a[1]}</p><p class="text-sm text-muted-foreground">${a[2]}</p></div>${actDone(a) ? pill(a[4], 'check', 'ok') : btn(a[3], 'careact', 'outline', `data-v="${a[0]}"`)}</li>`).join('')}</ul>`
    : `<h3 class="lbl">What to do now</h3><p class="mt-2 text-sm">${f.emerg || 'Stay in the pressurised habitat until CMO Okafor has seen you.'}</p>`;
  const med = f.med
    ? `<div class="mt-3 border border-border bg-muted p-3 text-sm"><p class="font-semibold">${f.med[0]}</p><p class="text-muted-foreground">${f.med[1]}</p><div class="mt-2">${callUI('CMO Okafor')}</div></div>`
    : '';
  let follow = '';
  if (c.status === 'active')
    follow = `<p class="text-sm">When you have done what you can, I'll check back in ${hrs} hour${hrs > 1 ? 's' : ''} and ask: "${f.followQ}"</p><div class="mt-3">${btn('Set follow-up', 'setfollow', 'primary')}</div>`;
  else if (c.status === 'followup')
    follow = due
      ? `<p class="text-sm">${f.followQ}</p><div class="mt-3 flex flex-wrap gap-2">${btn('Much better', 'followup', 'primary', 'data-v="better"')}${btn('About the same', 'followup', 'outline', 'data-v="same"')}${btn('Worse', 'followup', 'outline', 'data-v="worse"')}</div>`
      : `<p class="text-sm">I'll check in at ${hm(c.followAt)}. If it is better, your status updates${f.blocksEva ? ` and ${E.mainShort} loses a blocker` : ''}. If not, I notify your CMO and hand over your records.</p><div class="mt-3">${btn('Demo: skip to ' + hm(c.followAt), 'ff', 'ghost', `data-v="${c.followAt}"`)}</div>`;
  else if (c.status === 'cmo')
    follow = `<p class="text-sm">CMO Okafor has your records. If there is still no improvement after their care, the next step is the flight surgeon.</p><div class="mt-3 flex flex-wrap gap-2">${callUI('CMO Okafor', 'primary')}${btn('Still no improvement', 'fsescalate', 'outline')}${btn('It has eased', 'followup', 'ghost', 'data-v="better"')}</div>`;
  else if (c.status === 'fs')
    follow = `<p class="text-sm">${E.ladder3}. Related tasks hold while you wait.</p><div class="mt-3 flex flex-wrap gap-2">${E.id === 'station' ? callUI('Flight surgeon', 'primary') : btn('Send records', 'sendfs', 'primary')}${btn('It has eased', 'followup', 'ghost', 'data-v="better"')}</div>`;
  const worse =
    c.status === 'active' || (c.status === 'followup' && !due)
      ? `<div class="mt-4 border-t border-border pt-4"><p class="text-sm text-muted-foreground">Getting worse?</p><div class="mt-2 flex flex-wrap gap-2">${btn('It is getting worse', 'followup', 'outline', 'data-v="worse"')}${btn('Emergency', 'emergency', 'danger')}</div></div>`
      : '';
  return modalShell(
    'Take action · ' + f.name,
    `${acts}${med}<h3 class="lbl mt-5">Follow up</h3><div class="mt-2">${follow}</div>${worse}`,
  );
}
const HOW = [
  [
    'Understand Your Body',
    'Interactive Body Map',
    'Wearable data and self-assessments are compared against personal health baselines. An interactive body map highlights changes, helping astronauts identify areas that may need attention.',
  ],
  [
    'Know What to Do',
    'Guided Care',
    'When astronauts experience symptoms, ASTRAVIA guides them through a step-by-step assessment, provides actionable care recommendations, and indicates when medical support may be needed.',
  ],
  [
    'Check Mission Readiness',
    'Mission Readiness Assessment',
    'Before critical tasks like spacewalks, ASTRAVIA considers personal health, environmental conditions, and mission requirements to identify potential risks and flag tasks that may need reassessment.',
  ],
];
function howModal() {
  return modalShell(
    'How it works',
    `<p class="text-sm text-muted-foreground">ASTRAVIA helps astronauts understand their health and make informed decisions through three connected experiences:</p><ol class="mt-4 space-y-4">${HOW.map((h, i) => `<li class="flex gap-3"><span class="num grid h-6 w-6 shrink-0 place-items-center border border-primary text-xs text-primary">${i + 1}</span><div class="min-w-0"><p class="text-sm font-semibold">${h[0]} <span class="font-normal text-muted-foreground">· ${h[1]}</span></p><p class="mt-1 text-sm text-muted-foreground">${h[2]}</p></div></li>`).join('')}</ol>`,
  );
}
const REPO_URL = 'https://github.com/yi-linchuang/astravia';
function aboutModal() {
  return modalShell(
    'About',
    `<h3 class="lbl">About Project</h3><p class="mt-2 text-sm">ASTRAVIA goes beyond health monitoring, helping astronauts know what to do next when immediate medical support from Earth is unavailable. By turning personal health data and spaceflight risks into actionable guidance, it helps crews assess their condition and readiness for critical missions. ASTRAVIA supports independent health decisions, reduces preventable risks, and protect both crew well-being and mission safety.</p><h3 class="lbl mt-5">Contributor</h3><p class="mt-2 text-sm">Yi-Lin, an AI product designer with over 8 years of experience in B2C SaaS product design, exploring human-centered design in space field. With a non-engineering background, they used AI as a development partner while taking ownership of product decisions, UX/UI design, implementation, and quality assurance.</p><div class="mt-5"><a href="${REPO_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Go to Github Project</a></div>`,
  );
}
const modalShell = (title, inner, wide) =>
  `<div class="modal-back${MODAL_FIRST ? ' enter' : ''}" data-act="closemodal"></div><div class="modal${MODAL_FIRST ? ' enter' : ''}${wide ? ' modal-wide' : ''}" role="dialog" aria-modal="true" aria-label="${title}" tabindex="-1">${panel(title, inner, { right: `<button type="button" data-act="closemodal" aria-label="Close" class="p-1 text-muted-foreground hover:text-primary">${ic('x')}</button>` })}</div>`;
let shownModal = null,
  MODAL_FIRST = false;
export const modalLayer = () => {
  if (!S.modal) {
    shownModal = null;
    return '';
  }
  MODAL_FIRST = shownModal !== S.modal;
  shownModal = S.modal;
  return S.modal === 'how'
    ? howModal()
    : S.modal === 'about'
      ? aboutModal()
      : S.modal === 'symptom'
        ? symptomModal()
        : S.modal === 'must'
          ? mustModal(changed()[0])
          : S.modal === 'help'
            ? helpModal()
            : S.modal === 'spe'
              ? speModal()
              : '';
};
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && S.modal) {
    S.modal = null;
    render(false);
  }
});
function mustModal(top) {
  if (!top) return '';
  if (top.id !== 'sleep')
    return modalShell(
      'Take action · Must do',
      `<p class="text-sm"><span class="text-primary">${top.name}.</span> ${top.head}.</p><p class="mt-2 text-sm text-muted-foreground">${top.todo}</p>`,
    );
  const done = S.cmCheck;
  const steps = [
    ['Pick one factor', 'Sleep. It has been off your baseline the longest and affects the most tasks.', true],
    ['Do one concrete thing', 'Lights down at 21:30, in bed by 22:30, no caffeine after 14:00.', S.sleepPlan],
    [
      'Check whether it worked',
      done
        ? 'Checked 3 days later: 3 nights after compared with the 4 nights before.'
        : 'In 3 days, compare the next 3 nights with the 4 nights before.',
      done,
    ],
  ];
  const cmp = (label, b, a, unit) =>
    `<div class="min-w-0 border border-border bg-muted p-3"><p class="lbl">${label}</p><p class="num mt-1 text-sm"><span class="text-muted-foreground">${b} ${unit}</span> → <span class="text-primary">${a} ${unit}</span></p></div>`;
  const action = !S.sleepPlan
    ? btn("Set tonight's reminder", 'sleepplan', 'primary')
    : !done
      ? btn('Demo: skip 3 days', 'cmcheck', 'ghost')
      : pill('Working. Keep going', 'check', 'ok');
  return modalShell(
    'Take action · Must do',
    `<p class="text-sm"><span class="text-primary">${top.name}.</span> ${top.head}.</p><p class="mt-1 text-sm text-muted-foreground">${top.todo}</p><ol class="mt-4 space-y-3">${steps.map((s, i) => `<li class="flex gap-3"><span class="num grid h-6 w-6 shrink-0 place-items-center border text-xs ${s[2] ? 'border-ok text-ok' : 'border-border text-muted-foreground'}">${s[2] ? ic('check', 'h-3.5 w-3.5') : i + 1}</span><div class="min-w-0"><p class="text-sm font-semibold">${s[0]}</p><p class="text-sm text-muted-foreground">${s[1]}</p></div></li>`).join('')}</ol>${done ? `<div class="mt-4"><p class="lbl mb-2">Did it work?</p><div class="grid gap-3 sm:grid-cols-2">${cmp('Sleep, nightly average', 5.8, 6.9, 'h')}${cmp('Reaction test', 302, 279, 'ms')}</div><p class="mt-3 text-sm text-muted-foreground">Sleep is back inside your baseline range, so the focus moves to the next factor that is off.</p></div>` : ''}<div class="mt-4">${action}</div>`,
  );
}
