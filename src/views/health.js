// My health: body map (Today tab), long-term tab, signal detail, well-being check-in.
import { STC2, faceSvg } from '../components/bodyFigure.js';
import { lineChart, spark } from '../components/charts.js';
import { REAL, back, btn, ic, pageTitle, panel, pill, sigPill, stPill } from '../components/primitives.js';
import { LAB, ctx } from '../data/env.js';
import { IND, baseTxt, isDue } from '../data/indicators.js';
import { LONG } from '../data/longterm.js';
import { CM_ST, REG, cmFor, regSt } from '../data/measures.js';
import { radTotal } from '../data/radiation.js';
import { PHK, anyData } from '../data/records.js';
import { changed, signals } from '../data/signals.js';
import { S } from '../state.js';

/* ---------- my health ---------- */
const HTABS = [
  ['body', 'Today'],
  ['long', 'Long-term'],
];
export function vHealth() {
  if (S.signal) return vSignal();
  const tabs = `<div role="tablist" class="mb-5 flex flex-wrap border-b border-border">${HTABS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${S.htab === k}" data-act="htab" data-v="${k}" class="-mb-px border-b-2 px-4 py-2 text-[13px] uppercase tracking-[.12em] ${S.htab === k ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}">${l}</button>`).join('')}</div>`;
  const body = (S.htab === 'long' ? hLong : hBody)();
  return `${pageTitle('My health', 'Layer 1 · Understand my health')}${tabs}${body}`;
}
function vSignal() {
  const s = signals().find((x) => x.id === S.signal),
    I = IND[s.id],
    c = ctx();
  let chart;
  const rec = I ? `<div class="mt-4">${btn('Record a reading', 'measure', 'primary', `data-v="${s.id}"`)}</div>` : '';
  if (s.vals && s.vals.length > 1)
    chart = panel(
      s.name + ` · ${s.vals.length} readings`,
      `<p class="mb-2 text-sm text-muted-foreground">${s.now} · ${s.base}</p>${lineChart({ label: s.name + ' trend', vals: s.vals, xs: s.xs, lo: s.lo, hi: s.hi, ticks: s.ticks, fmt: (v) => v + ' ' + s.unit, tip: (x, v) => `${c.day} ${x}: ${v} ${s.unit}`, xLabel: s.xLabel, draw: true })}${rec}`,
    );
  else if (I)
    chart = panel(
      'Readings',
      `<p class="num glow text-2xl font-bold">${s.na ? '—' : s.now ? s.now.replace('Latest: ', '') : 'No readings yet'}</p><p class="lbl mt-1">${s.base}</p>${s.pill ? '' : rec}`,
    );
  else
    chart = panel(
      "Today's log",
      `<p class="text-sm text-muted-foreground">${S.care.status === 'none' ? 'Nothing logged yet.' : s.head + '.'}</p><div class="mt-4">${btn('Report a symptom', 'unwell', 'outline')}</div>`,
    );
  const row = (t, b) => (b ? `<div><h3 class="lbl">${t}</h3><p class="mt-1 text-sm">${b}</p></div>` : '');
  const which =
    I && I.base[PHK()] != null
      ? `Your ${c.zero ? 'weightless' : 'surface'} baseline: ${baseTxt(s.id)}. Before launch: ${baseTxt(s.id, 'pre')}.`
      : '';
  return `${back('My health', 'signal', 'data-v=""')}
    <div class="mb-2 flex flex-wrap items-center gap-3"><h1 class="text-2xl font-bold">${s.name}</h1>${sigPill(s)}</div><p class="mb-5 text-base text-muted-foreground">${s.head}</p>
    <div class="grid gap-5 lg:grid-cols-12"><div class="grid min-w-0 content-start gap-5 lg:col-span-8">${chart}</div>
    <div class="min-w-0 lg:col-span-4">${panel('Analysis', `<div class="space-y-4">${row('What it may be linked to', s.link)}${row('Which baseline', which)}${row('Expected in spaceflight', I && I.expect)}${row('Why it matters', s.why)}${row('What you can do', s.todo)}</div>`)}</div></div>`;
}
export const MQ = [
  ['mood', 'Mood', 'Low', 'Good'],
  ['stress', 'Stress', 'Calm', 'Tense'],
  ['fatigue', 'Fatigue', 'Fresh', 'Worn out'],
  ['sleepq', 'Sleep quality', 'Poor', 'Restful'],
];
function hMind() {
  const m = S.mind,
    d = S.mindDraft || (S.mindDraft = { mood: 3, stress: 3, fatigue: 4, sleepq: 2 });
  const scale = ([k, l, lo, hi]) =>
    `<div><div class="flex items-baseline justify-between gap-2"><p class="text-sm font-medium">${l}</p><p class="text-xs text-muted-foreground">${lo} → ${hi}</p></div><div class="mt-2 flex gap-2" role="radiogroup" aria-label="${l}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="${d[k] === n}" data-act="mindset" data-k="${k}" data-v="${n}" ${m ? 'disabled' : ''} class="num h-10 w-10 border text-sm ${d[k] === n ? 'border-primary bg-ok-soft text-primary' : 'border-border text-muted-foreground hover:border-primary/60'}">${n}</button>`).join('')}</div></div>`;
  const low = d.mood <= 2 || d.stress >= 4;
  return `<div class="grid gap-5 lg:grid-cols-12"><div class="grid min-w-0 content-start gap-5 lg:col-span-7">
    ${panel(
      "Today's check-in",
      `<p class="mb-4 text-sm text-muted-foreground">Four taps, about 30 seconds. ${m ? 'Saved for today.' : ''}</p><div class="grid gap-5 sm:grid-cols-2">${MQ.map(scale).join('')}</div>
      <div class="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">${m ? pill('Saved privately', 'check', 'ok') : btn('Save check-in', 'mindsave', 'primary')}${m ? btn('Edit', 'mindedit', 'ghost') : ''}</div>
      ${m && low ? `<div class="mt-4 border border-border bg-muted p-3 text-sm"><p>Today looks like a heavier day. If you want, I can walk you through a few things that help.</p><div class="mt-2">${btn('Open mood &amp; stress support', 'startflow', 'outline', 'data-v="mood"')}</div></div>` : ''}`,
    )}
    ${panel('Journal', `<label for="journal" class="lbl">Today's entry</label><textarea id="journal" data-bind="journal" rows="4" class="mt-2 w-full border border-border bg-muted p-3 text-sm text-foreground" placeholder="Anything you want to remember about today.">${S.journal}</textarea><p class="mt-2 text-xs text-muted-foreground">NASA encourages crews to keep a journal. Entries never leave this device.</p>`)}
    </div><div class="min-w-0 lg:col-span-5">${panel('Private by default', `<ul class="space-y-3 text-sm"><li><span class="font-semibold">Only you see your answers.</span> <span class="text-muted-foreground">Your CMO and the ground see nothing unless you choose to share.</span></li><li><span class="font-semibold">Not in the weekly medical summary.</span> <span class="text-muted-foreground">Check-ins and journal entries are left out.</span></li><li><span class="font-semibold">Does not affect task readiness.</span> <span class="text-muted-foreground">Your answers never block a task.</span></li></ul><p class="mt-3 text-xs text-muted-foreground">Privacy rules are product assumptions. NASA lists privacy as a top priority for crew well-being.</p>`)}</div></div>`;
}
function hLong() {
  const rt = radTotal(),
    organ = [
      ['Skin', 1.13],
      ['Eyes', 1.07],
      ['Blood-forming organs', 0.97],
    ].map(([n, k]) => [n, +(rt.now * k).toFixed(1)]);
  return `<p class="-mt-2 mb-4 text-sm text-muted-foreground">These change slowly, so we track them over the whole mission. They do not affect today's task decisions.</p>
    <div class="grid gap-5 md:grid-cols-2">${LONG.map((L) => panel(L.name, `<p class="mb-3 text-sm text-muted-foreground">${L.text}</p>${lineChart({ label: L.name, vals: L.vals, xs: L.xs, ticks: L.ticks, fmt: L.fmt, tip: (x, v) => `${x}: ${L.fmt(v)}`, xLabel: L.unit, H: 190 })}<div class="mt-2 flex flex-wrap items-center justify-between gap-2"><p class="text-xs text-muted-foreground">Next check: ${L.next}</p></div>`, { right: (L.hz[0] === 'rad' && ctx().id === 'station' ? REAL + ' ' : '') + pill(L.badge, L.st === 'ok' ? 'check' : L.st === 'info' ? 'activity' : 'alert', L.st) })).join('')}
    ${panel('Organ dose estimates', `<p class="mb-3 text-sm text-muted-foreground">Estimated behind different shielding depths, the way MOSFET dosimeters do it.</p><ul class="space-y-2">${organ.map(([n, v]) => `<li><div class="flex justify-between gap-3 text-sm"><span>${n}</span><span class="num text-foreground">${v} ${rt.unit}</span></div><div class="mt-1 h-1.5 bg-muted"><div class="h-1.5 bg-primary" style="width:${Math.round((100 * v) / (rt.now * 1.2))}%"></div></div></li>`).join('')}</ul><p class="mt-3 text-xs text-muted-foreground">Warning levels need medical review before they are set.</p>`)}
    ${panel('Immune markers', `<p class="text-sm text-muted-foreground">Spaceflight stress can wake dormant viruses and cause rashes or cold sores. Saliva and blood samples are collected on a schedule; results come back as research data, not in real time.</p><ul class="mt-3 space-y-2 text-sm"><li class="flex justify-between gap-3"><span>Last saliva sample</span><span class="num text-muted-foreground">About 4 weeks ago</span></li><li class="flex justify-between gap-3"><span>Next sample</span><span class="num text-muted-foreground">In about 2 weeks</span></li></ul><div class="mt-3">${btn('Report a rash or cold sore', 'startflow', 'outline', 'data-v="rash"')}</div>`)}
    ${panel('Blood chemistry · potassium', `<p class="mb-3 text-sm text-muted-foreground">Below the reference range the day after landing, back in range by day 45. The same layout would hold Mei Lin's own labs.</p>${lineChart({ label: 'Serum potassium before and after flight', vals: LAB.vals, xs: LAB.xs, lo: 3.5, hi: 5.3, bandLabel: 'REFERENCE RANGE', ticks: [2.5, 3.5, 4.5, 5.5], fmt: (v) => v + ' mmol/L', tip: (x, v) => `${x}: ${v} mmol/L`, xLabel: 'DAYS BEFORE LAUNCH (L) / AFTER RETURN (R)', W: 1000, H: 240 })}<p class="mt-2 text-xs text-muted-foreground">Real data: Inspiration4 crew member C003 (OSDR OSD-575). Not Mei Lin's data; a 3-day flight, so not comparable to a Mars mission.</p>`, { right: REAL, cls: 'md:col-span-2' })}</div>`;
}
function regItem(i) {
  const zeroNA = i.rec && IND[i.rec] && IND[i.rec].zeroNA && ctx().zero;
  const recBtn =
    i.rec && !zeroNA
      ? (IND[i.rec] && isDue(i.rec) ? pill('Due today', 'clock', 'info') : '') +
        btn('Record', 'measure', 'outline', `data-v="${i.rec}"`)
      : '';
  const actBtn = i.act ? btn(i.act[2], i.act[0], 'outline', `data-v="${i.act[1]}"`) : '';
  const trend = i.go
    ? `<button type="button" data-act="${i.go[0]}" data-v="${i.go[1]}" class="text-xs uppercase tracking-[.12em] text-primary hover:underline">View trend →</button>`
    : '';
  const tag = i.label
    ? pill(
        i.label,
        i.st === 'ok' ? 'check' : i.st === 'info' ? 'activity' : i.st === 'nodata' ? 'minus' : 'alert',
        i.st,
      )
    : stPill(i.st);
  if (i.quiet) {
    const parts = [i.meta, i.label].filter(Boolean).join(' · ');
    return `<li class="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-0"><div class="min-w-0 flex-1"><p class="text-sm font-medium text-muted-foreground">${i.name}</p>${parts ? `<p class="text-[11px] uppercase tracking-[.08em] text-muted-foreground/80">${parts}</p>` : ''}<p class="text-xs text-muted-foreground">${i.val}</p></div><div class="flex shrink-0 flex-wrap items-center gap-2">${recBtn}${actBtn}</div></li>`;
  }
  const foot =
    recBtn || actBtn || trend
      ? `<div class="mt-2 flex flex-wrap items-center gap-3">${recBtn}${actBtn}${trend}</div>`
      : '';
  return `<li class="border-b border-border py-3 last:border-0"><div class="flex flex-wrap items-start justify-between gap-2"><span class="min-w-0"><span class="flex items-center gap-2 text-sm font-semibold">${i.name}${i.real ? REAL : ''}</span>${i.meta ? `<span class="block text-[11px] uppercase tracking-[.08em] text-muted-foreground">${i.meta}</span>` : ''}</span><span class="flex flex-wrap items-center gap-2">${tag}</span></div>
    <div class="mt-1 flex items-end justify-between gap-3"><div class="min-w-0"><p class="text-sm text-muted-foreground">${i.val}</p>${i.now ? `<p class="num mt-1 text-xs text-muted-foreground">${i.now}</p><p class="num text-xs text-muted-foreground">${i.base}</p>` : ''}</div>${i.vals && i.vals.length > 1 ? spark(i.vals, i.lo, i.hi, i.st) : ''}</div>${foot}</li>`;
}
function cmRow(m) {
  const on = m.st === 'adopted',
    meta = [m.cad, m.adh ? `${m.adh[0]} of ${m.adh[1]} days this week` : '', on ? '' : CM_ST[m.st][0]]
      .filter(Boolean)
      .join(' · ');
  return `<li class="border-b border-border py-3 last:border-0"><div class="flex flex-wrap items-start justify-between gap-3"><div class="min-w-0 flex-1"><p class="text-sm font-semibold ${on ? '' : 'text-muted-foreground'}">${m.name}</p><p class="text-[11px] uppercase tracking-[.08em] text-muted-foreground">${meta}</p></div>${m.go ? btn(m.go[2], m.go[0], 'outline', `data-v="${m.go[1]}"`) : ''}</div><p class="mt-1 text-sm text-muted-foreground">${m.what}</p>${m.today && on ? `<p class="mt-1 text-sm">${m.today}</p>` : ''}${m.adh ? `<div class="mt-2 h-1.5 bg-muted"><div class="h-1.5 ${m.adh[0] / m.adh[1] >= 0.8 ? 'bg-primary' : 'bg-warn'}" style="width:${Math.round((m.adh[0] / m.adh[1]) * 100)}%"></div></div>` : ''}</li>`;
}
function regionDetail(k) {
  const r = REG[k],
    st = regSt(k);
  const acts = r
    .acts()
    .map(([l, a, v, done]) => (done ? pill(l, 'check', 'ok') : btn(l, 'regionact', v, `data-v="${a}"`)))
    .join('');
  return panel(
    r.name,
    `<div class="mb-3 flex items-center gap-2">${stPill(st)}</div><p class="text-sm">${r.why}</p>
    <h3 class="lbl mt-5">What we track here</h3><ul>${r.items().map(regItem).join('')}</ul>${cmFor(k).length ? `<h3 class="lbl mt-5">What protects you</h3><ul>${cmFor(k).map(cmRow).join('')}</ul>` : ''}
    ${acts ? `<div class="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">${acts}</div>` : ''}`,
    { edge: st === 'alert' ? 'alert' : '' },
  );
}
function hBody() {
  const keys = Object.keys(REG),
    ch = changed();
  const lead = `<p class="mb-3 text-base font-semibold">${anyData() ? `<span class="glow">${ch.length}</span> signal${ch.length === 1 ? '' : 's'} differ from your baseline today.` : 'No readings yet. Open a body system below and record one.'}</p>`;
  const overview = panel(
    'Body systems',
    `<p class="mb-2 text-sm text-muted-foreground">Choose a highlighted area on the body, or from this list.</p><ul class="divide-y divide-border">${keys.map((k) => `<li><button type="button" data-act="region" data-v="${k}" class="row-btn"><span class="min-w-0 flex-1"><span class="block text-sm font-medium">${REG[k].name}</span><span class="block text-sm text-muted-foreground">${REG[k].items()[0].val}</span></span>${stPill(regSt(k))}</button></li>`).join('')}</ul>`,
  );
  const legend = `<div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">${[
    ['watch', 'Watch'],
    ['alert', 'Abnormal'],
    ['info', 'Expected change'],
    ['nodata', 'No recent data'],
    ['ok', 'Normal'],
  ]
    .map(
      ([k, l]) =>
        `<span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5" style="background:hsl(${STC2[k]})"></span>${l}</span>`,
    )
    .join('')}</div>`;
  const figs = `<div class="grid grid-cols-2 gap-3">${[0, 1].map((fc) => `<div class="min-w-0"><p class="lbl mb-1 text-center">${fc ? 'Back' : 'Front'}</p><div class="border border-border bg-background">${faceSvg(fc)}</div></div>`).join('')}</div>`;
  return `<div class="grid gap-5 lg:grid-cols-12"><div class="min-w-0 lg:col-span-6">${panel(S.region ? REG[S.region].name : 'Full body', `${lead}${figs}${legend}`, { right: S.region ? btn(ic('left', 'h-3.5 w-3.5') + 'Full body', 'unzoom', 'ghost') : '', cls: 'scan' })}</div>
    <div class="min-w-0 lg:col-span-6">${S.region ? regionDetail(S.region) : overview}</div></div>${S.showMind ? `<div class="mt-5">${hMind()}</div>` : ''}`;
}
