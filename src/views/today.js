// Today: Must do, Reported symptom, Status, live Environment, tasks and routine.
import { thumb } from '../components/bodyFigure.js';
import { btn, head, ic, infoI, panel, pill, rdPill, stPill } from '../components/primitives.js';
import { CO2_MEAN, RH, TEMP, ctx } from '../data/env.js';
import { FLOWS, ansLine } from '../data/flows.js';
import { IND, MIN, isDue } from '../data/indicators.js';
import { REG, regSt } from '../data/measures.js';
import { ALERT, ISS_RAD, radNow, radOk, speActive, speLine } from '../data/radiation.js';
import { anyData, todayE } from '../data/records.js';
import { changed, tasks } from '../data/signals.js';
import { capF, hm, reduceMotion } from '../lib/util.js';
import { S } from '../state.js';

function bodyOverview() {
  const keys = Object.keys(REG).filter((k) => k !== 'rad');
  const fig = `<button type="button" data-act="bodyto" data-v="" aria-label="Open the body map" class="block w-full max-w-[150px] shrink-0 border border-border bg-background p-2 hover:border-primary">${thumb(keys, true)}</button>`;
  const list = Object.keys(REG)
    .map(
      (k) =>
        `<li><button type="button" data-act="bodyto" data-v="${k}" class="row-btn"><span class="min-w-0 flex-1"><span class="block text-sm font-medium">${REG[k].name}</span><span class="block text-sm text-muted-foreground">${REG[k].items()[0].val}</span></span>${stPill(regSt(k))}</button></li>`,
    )
    .join('');
  return panel(
    'Status',
    `<div class="flex flex-wrap items-start gap-4 sm:flex-nowrap">${fig}<ul class="min-w-0 flex-1 divide-y divide-border">${list}</ul></div>`,
    { cls: 'scan' },
  );
}
/* ---------- home ---------- */
function routine() {
  const exDone = S.clock >= 870,
    c = ctx(),
    items = [];
  const row = (name, sub, done, action) => items.push({ name, sub, done, action });
  const rec = (id, label, weekly) => {
    const t = todayE(id),
      I = IND[id];
    return row(
      (weekly ? 'Weekly: ' : '') + label,
      t
        ? I.show(t) + (t.src === 'sample' ? ' · wearable' : '')
        : isDue(id)
          ? `Due today · about ${MIN[id]}`
          : 'Not due',
      t ? 'Done' : '',
      btn('Record', 'measure', 'outline', `data-v="${id}"`),
    );
  };
  const auto = todayE('sleep') && todayE('cardio');
  row(
    'Sleep & heart rate',
    auto ? 'Recorded automatically' : 'Not recorded yet',
    auto ? 'Done' : '',
    btn('Add by hand', 'measure', 'outline', 'data-v="sleep"'),
  );
  rec('cog', 'Reaction test');
  row(
    'Well-being check-in',
    S.mind ? 'Saved privately' : '4 taps, 30 seconds. Private',
    S.mind ? 'Done' : '',
    btn('Check in', 'htab', 'outline', 'data-v="mind"'),
  );
  row('Exercise', exDone ? '1.5 h completed' : '13:00 · 1.5 h', exDone ? 'Done' : '', pill('13:00', 'clock', 'info'));
  rec('bp', 'Blood pressure & SpO₂', true);
  if (!c.zero) rec('bal', 'Balance test', true);
  rec('fit', 'Fitness self-check', true);
  const todo = items.filter((i) => !i.done),
    done = items.filter((i) => i.done);
  const li = (i) =>
    `<li class="flex flex-wrap items-center justify-between gap-3 py-2.5"><div class="min-w-0 flex-1"><p class="text-sm font-medium">${i.name}</p><p class="num text-sm text-muted-foreground">${i.sub}</p></div>${i.action}</li>`;
  const dn = (i) =>
    `<li class="flex items-center justify-between gap-3 py-1.5 text-xs text-muted-foreground opacity-70"><span class="min-w-0 flex-1 truncate">${i.name} <span class="num">· ${i.sub}</span></span>${pill('Done', 'check', 'ok')}</li>`;
  return panel(
    "Today's routine",
    `<p class="mb-1 text-sm text-muted-foreground">About 4 minutes of checks, plus 1.5 hours of exercise.</p>
    ${todo.length ? `<ul class="divide-y divide-border">${todo.map(li).join('')}</ul>` : '<p class="py-2 text-sm">Everything on today\'s list is done.</p>'}
    ${done.length ? `<ul class="mt-3 divide-y divide-border border-t border-border pt-2">${done.map(dn).join('')}</ul>` : ''}`,
  );
}
export function vHome() {
  const ch = changed(),
    c = S.care,
    f = c.flow && FLOWS[c.flow],
    E = ctx();
  let follow = '';
  if (c.status === 'followup' && S.clock >= c.followAt)
    follow = panel(
      'Follow-up',
      `${head(f.followQ, `You reported it at ${hm(c.followAt - f.followMin)}. Checking back as planned.`)}<div class="flex flex-wrap gap-2">${btn('Much better', 'followup', 'primary', 'data-v="better"')}${btn('About the same', 'followup', 'outline', 'data-v="same"')}${btn('Worse', 'followup', 'outline', 'data-v="worse"')}</div>`,
      { edge: 'info' },
    );
  else if (c.status !== 'none' && f) follow = symptomPanel();
  const rad = speActive()
    ? panel(
        'Space weather',
        `<div class="flex flex-wrap items-center justify-between gap-3"><p class="min-w-0 flex-1 text-sm"><span class="pulse mr-1 inline-flex align-middle text-alert">${ic('alert', 'h-4 w-4')}</span><span class="font-semibold text-alert">Solar particle event.</span> ${speLine()}</p>${btn('Take action', 'takeaction', 'danger', 'data-v="spe"')}</div>`,
        { edge: 'alert' },
      )
    : '';
  const top = ch[0];
  const first = !anyData()
    ? '<p class="text-sm">Record your first reading.</p><p class="mt-2 text-sm text-muted-foreground">It takes about a minute, and everything else builds on it.</p>'
    : top
      ? `<p class="text-sm"><span class="text-primary">${top.name}.</span> ${top.head}.</p><p class="mt-2 text-sm text-muted-foreground">${top.todo}</p>`
      : '<p class="text-sm">Nothing stands out today.</p><p class="mt-2 text-sm text-muted-foreground">Keep your routine, and record anything that is due.</p>';
  const must = mustPanel(top, first);
  return `<div class="grid gap-5 lg:grid-cols-12">
    <div class="grid min-w-0 content-start gap-5 lg:col-span-12">${rad}<div class="grid gap-5 ${follow ? 'lg:grid-cols-2' : ''}">${must}${follow}</div></div>
    <div class="grid min-w-0 content-start gap-5 lg:col-span-7">
      ${bodyOverview()}
      ${liveEnvPanel()}
      <button type="button" data-act="takeaction" data-v="help" class="flex w-full flex-wrap items-center justify-between gap-x-5 gap-y-1 border border-border px-4 py-2 text-left text-xs text-muted-foreground hover:border-primary/60"><span class="lbl">Who can help</span><span>CMO Okafor · ${E.id === 'rover' ? 'at the base, by radio' : 'on board, available now'}</span><span>Flight surgeon · ${E.id === 'station' ? 'live video' : 'reply in ' + E.reply}</span><span class="uppercase tracking-[.1em] text-primary">When to call whom</span></button>
    </div>
    <div class="grid min-w-0 content-start gap-5 lg:col-span-5">
      ${panel("Today's tasks", taskTable())}
      ${routine()}
    </div></div>`;
}
export function taskTable() {
  return `<ul class="divide-y divide-border">${tasks()
    .map(
      (t) => `<li><button type="button" data-act="task" data-v="${t.id}" class="row-btn flex-wrap">
    <span class="num w-16 shrink-0 text-sm text-primary">${t.time ? hm(t.time) : t.when.replace('Mission Day', 'Day')}</span><span class="min-w-0 flex-1"><span class="block text-sm font-medium">${t.name} <span class="lbl ml-1">${t.type}</span></span><span class="block text-sm text-muted-foreground" data-hl="taskwhy-${t.id}">${t.why}</span></span><span data-hl="task-${t.id}" class="inline-flex">${rdPill(t.st)}</span>${ic('right', 'h-4 w-4 text-muted-foreground')}</button></li>`,
    )
    .join('')}</ul>`;
}
function liveRows() {
  const c = ctx(),
    st = c.id === 'station';
  const rate = st ? (ISS_RAD.total[c.n - 1] * 1000) / 24 : radNow();
  const rows = [
    {
      k: 'rad',
      label: 'Radiation rate',
      base: rate,
      amp: rate * 0.04,
      dp: 1,
      unit: 'µGy/h',
      st: !st && !radOk() ? 'alert' : 'ok',
      sub:
        !st && !radOk() ? 'Above the alert level' : st ? 'Steady, no solar event' : 'Below the alert level of ' + ALERT,
    },
    {
      k: 'co2',
      label: 'Cabin CO₂',
      base: CO2_MEAN[6],
      amp: 0.035,
      dp: 2,
      unit: 'mmHg',
      st: CO2_MEAN[6] > 2.5 ? 'watch' : 'ok',
      sub: 'Reference 2.5 · limit 3.0',
    },
    {
      k: 'o2',
      label: st ? 'Oxygen' : 'Oxygen (partial pressure)',
      base: st ? 21 : 19.2,
      amp: 0.06,
      dp: 1,
      unit: st ? '%' : 'kPa',
      st: 'ok',
      sub: 'Nominal',
    },
    {
      k: 'p',
      label: 'Cabin pressure',
      base: st ? 101.3 : 56.5,
      amp: 0.12,
      dp: 1,
      unit: 'kPa',
      st: 'ok',
      sub: st ? 'Sea-level pressure' : 'Reduced on purpose',
    },
    { k: 't', label: 'Temperature', base: TEMP[6], amp: 0.12, dp: 1, unit: '°C', st: 'ok', sub: 'Comfortable' },
    { k: 'h', label: 'Humidity', base: RH[6], amp: 0.6, dp: 0, unit: '%', st: 'ok', sub: 'Within range' },
  ];
  return rows;
}
const liveVal = (r) =>
  r.base +
  r.amp * (Math.sin(Date.now() / 1300 + r.base) * 0.6 + Math.sin(Date.now() / 410 + r.base * 3) * 0.4) +
  (Math.random() - 0.5) * r.amp * 0.3;
function liveEnvPanel() {
  const tone = { ok: '', watch: 'text-warn', alert: 'text-alert' };
  const tile = (r) =>
    `<div class="min-w-0 border border-border bg-muted p-3"><div class="flex items-center justify-between gap-2"><p class="lbl truncate">${r.label}</p><span class="pulse-live h-1.5 w-1.5 shrink-0" style="background:hsl(${r.st === 'alert' ? 'var(--alert)' : r.st === 'watch' ? 'var(--warn)' : 'var(--ok)'})"></span></div><p class="num mt-1 text-lg font-semibold ${tone[r.st]}"><span data-live="${r.k}" data-base="${r.base}" data-amp="${r.amp}" data-dp="${r.dp}">${liveVal(r).toFixed(r.dp)}</span> <span class="text-xs font-normal text-muted-foreground">${r.unit}</span></p><p class="text-xs text-muted-foreground">${r.sub}</p></div>`;
  return panel(
    'Environment',
    `<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">${liveRows().map(tile).join('')}</div>`,
    {
      right:
        infoI(
          ctx().id === 'station'
            ? 'Real NASA ISS data replayed, with a small simulated fluctuation so it looks live'
            : 'Replayed NASA radiation data and simulated cabin values, with a small fluctuation so it looks live',
        ) + btn('Open Environment' + ic('right', 'h-3.5 w-3.5'), 'go', 'ghost', 'data-v="habitat"'),
    },
  );
}
function tickLive() {
  if (S.view !== 'home' || !S.authed) return;
  const rows = {};
  liveRows().forEach((r) => {
    rows[r.k] = r;
  });
  document.querySelectorAll('[data-live]').forEach((el) => {
    const r = rows[el.dataset.live];
    if (!r) return;
    const t = liveVal(r).toFixed(r.dp);
    if (el.textContent === t) return;
    el.textContent = t;
    if (!reduceMotion()) {
      el.classList.remove('chg');
      void el.offsetWidth;
      el.classList.add('chg');
    }
  });
}
setInterval(tickLive, 2000);
function symptomPanel() {
  const c = S.care,
    f = c.flow && FLOWS[c.flow];
  if (!f || c.status === 'none') return '';
  const tag = {
    active: ['In progress', 'clock', 'info'],
    followup: ['Follow-up set', 'clock', 'info'],
    cmo: ['With your CMO', 'care', 'info'],
    fs: ['With the flight surgeon', 'care', 'info'],
    resolved: ['Eased', 'check', 'ok'],
  }[c.status] || ['', 'minus', 'nodata'];
  return panel(
    'Reported symptom',
    `<p class="text-sm"><span class="text-primary">${f.name}${f.private ? ' · private' : ''}.</span> ${capF(ansLine())}${f.blocksEva && c.status !== 'resolved' ? `. Holds ${ctx().mainShort}` : ''}.</p><div class="mt-3 flex flex-wrap items-center gap-3">${pill(tag[0], tag[1], tag[2])}${c.status === 'resolved' ? '' : btn('Take action', 'takeaction', 'primary', 'data-v="symptom"')}</div>`,
    { edge: c.status === 'resolved' ? '' : 'info' },
  );
}
function mustPanel(top, first) {
  if (!anyData())
    return panel(
      'Must do',
      `<p class="text-sm">Record your first reading.</p><div class="mt-3">${btn('Take action', 'htab', 'primary', 'data-v="body"')}</div>`,
      { edge: 'info' },
    );
  if (!top) return panel('Must do', `<p class="text-sm">Nothing stands out today.</p>`, { edge: 'info' });
  return panel(
    'Must do',
    `<p class="text-sm"><span class="text-primary">${top.name}.</span> ${top.head}.</p><div class="mt-3">${btn('Take action', 'takeaction', 'primary', 'data-v="must"')}</div>`,
    { edge: 'info' },
  );
}
