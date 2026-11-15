// Sign-in, device onboarding (read devices, reaction test, well-being) and the dashboard build animation.
import { SILHOUETTE } from '../components/bodyFigure.js';
import { btn, head, ic, panel, pill, stPill } from '../components/primitives.js';
import { SIM_ID, ctx, dayLab, timeInfo } from '../data/env.js';
import { judge } from '../data/indicators.js';
import { SAMPLE, latest } from '../data/records.js';
import { changed, sigSt, signals } from '../data/signals.js';
import { hm, pad3, reduceMotion } from '../lib/util.js';
import { render } from '../render.js';
import { S } from '../state.js';
import { pvtPanel } from './entry.js';
import { MQ } from './health.js';
import { linkInfo } from './shell.js';

/* ---------- render + actions ---------- */
// ---------- sign-in and onboarding ----------
export const AVATAR = `<svg viewBox="0 0 96 96" class="h-24 w-24" aria-hidden="true"><defs><radialGradient id="avg" cx="50%" cy="32%" r="72%"><stop offset="0" stop-color="hsl(205 70% 42%)"/><stop offset="1" stop-color="hsl(222 60% 12%)"/></radialGradient></defs><circle cx="48" cy="48" r="46" fill="url(#avg)" stroke="hsl(var(--primary))" stroke-width="1.5"/><circle class="spin" cx="48" cy="48" r="40" fill="none" stroke="hsl(var(--primary) / .35)" stroke-dasharray="2 4"/><text x="48" y="57" text-anchor="middle" font-size="26" font-weight="600" font-family="IBM Plex Mono, monospace" fill="hsl(var(--foreground))">ML</text></svg>`;
const DEVICES = [
  {
    id: 'wrist',
    name: 'Wrist sensor',
    reads: 'Sleep, activity and light',
    fit: 'Snug, just above the wrist bone',
    x: 42,
    y: 190,
    w: 16,
    h: 9,
    side: 'L',
  },
  {
    id: 'chest',
    name: 'Chest patch',
    reads: 'Heart rate and ECG',
    fit: 'Left side of your chest, on clean dry skin',
    x: 113,
    y: 112,
    w: 14,
    h: 12,
    side: 'R',
  },
  {
    id: 'dose',
    name: 'Personal dosimeter',
    reads: 'Radiation dose',
    fit: 'Clipped to your chest pocket',
    x: 86,
    y: 130,
    w: 9,
    h: 14,
    side: 'L',
  },
];
const ONB_STEPS = [
  ['wear', 'Wear devices'],
  ['detect', 'Read devices'],
  ['pvt', 'Reaction test'],
  ['mind', 'Well-being'],
];
function wearIllus(scan) {
  const ox = 150,
    oy = 10,
    F = 'font-family="IBM Plex Mono, monospace"';
  let s = `<svg id="wear-svg" viewBox="0 0 460 420" class="mx-auto h-auto w-full max-w-md" role="img" aria-label="Where to wear the wrist sensor, chest patch and personal dosimeter">`;
  s += `<path d="${SILHOUETTE}" transform="translate(${ox} ${oy})" style="fill:hsl(var(--muted));stroke:hsl(var(--primary) / .55);stroke-width:1.2"/>`;
  if (scan)
    s += `<g transform="translate(${ox} ${oy})"><rect class="scanline" x="0" y="0" width="200" height="3" style="fill:hsl(var(--primary))"/><rect class="scanline" x="0" y="-18" width="200" height="18" style="fill:hsl(var(--primary) / .12)"/></g>`;
  DEVICES.forEach((d) => {
    const px = ox + d.x,
      py = oy + d.y,
      L = d.side === 'L',
      lx = L ? 8 : 452,
      ex = L ? 178 : 322;
    s += `<line x1="${ex}" y1="${py}" x2="${px}" y2="${py}" style="stroke:hsl(var(--primary) / .6);stroke-width:1;stroke-dasharray:3 3"/>`;
    s += `<rect x="${px - d.w / 2}" y="${py - d.h / 2}" width="${d.w}" height="${d.h}" style="fill:hsl(var(--primary));stroke:hsl(var(--card));stroke-width:2"/>`;
    s += `<text x="${lx}" y="${py - 3}" text-anchor="${L ? 'start' : 'end'}" font-size="11" font-weight="600" ${F} style="fill:hsl(var(--foreground))">${d.name.toUpperCase()}</text><text x="${lx}" y="${py + 12}" text-anchor="${L ? 'start' : 'end'}" font-size="10" ${F} style="fill:hsl(var(--muted-foreground))">${d.reads.toUpperCase()}</text>`;
  });
  return s + '</svg>';
}
function syncWearables() {
  ['sleep', 'cardio'].forEach((id) => {
    S.data[id] = S.data[id].filter((e) => e.src !== 'sample');
    SAMPLE[id].forEach(([d, v]) => S.data[id].push({ d, v, src: 'sample' }));
  });
  S.demo = true;
}
let scanTimer = null,
  scanBits = [];
export function stopScan() {
  clearTimeout(scanTimer);
  scanBits.forEach(clearTimeout);
}
export function startScan() {
  clearTimeout(scanTimer);
  scanBits.forEach(clearTimeout);
  scanBits = [[0, 'wrist'], [1], [2, 'chest'], [3, 'dose']].map(([i, id]) =>
    setTimeout(
      () => {
        rowDone(i);
        if (id) ring(id);
      },
      i * 750 + 700,
    ),
  );
  const fast = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  scanTimer = setTimeout(
    () => {
      syncWearables();
      if (S.onb) S.onb.scan = 'done';
      render(false);
    },
    fast ? 300 : 3400,
  );
}
function detectRows() {
  const sl = latest('sleep'),
    hr = latest('cardio');
  return [
    ['Sleep', 'Wrist sensor', sl ? `${sl.v.h} h last night · 14 nights synced` : '', sigSt('sleep')],
    ['Activity and light', 'Wrist sensor', 'Evening light above target on 3 of the last 4 days', 'watch'],
    ['Heart rate and ECG', 'Chest patch', hr ? `Resting ${hr.v.bpm} bpm · regular rhythm` : '', sigSt('cardio')],
    ['Radiation dose', 'Personal dosimeter', "Synced · today's total is on the Environment page", 'ok'],
  ];
}
export function vGate() {
  if (S.boot) return vBoot();
  const c = ctx(),
    o = S.onb;
  if (!o) {
    const row = (k, v) => `<div><dt class="lbl">${k}</dt><dd class="num mt-0.5 text-sm">${v}</dd></div>`,
      line = (k, v) =>
        `<div class="flex justify-between gap-3 border-t border-border pt-3 text-sm"><dt class="text-muted-foreground">${k}</dt><dd class="num text-right">${v}</dd></div>`,
      T = timeInfo();
    const rows = [
      ['Mission Day', pad3(c.md)],
      ['MET', T.met.replace('MET ', '')],
      ['UTC', T.utc.replace(' UTC', '')],
      ['Gravity', c.g],
      ...(T.sol
        ? [
            ['Sol', pad3(c.n)],
            ['LMST', hm(S.clock)],
          ]
        : []),
    ];
    const lines = [['Environment', c.name], ['Location', T.loc], ...(T.evaLoc ? [['EVA site', T.evaLoc]] : [])];
    return `<div class="gate-card mx-auto mt-[4vh] w-full max-w-md"><p class="glow mb-4 text-center text-lg font-bold tracking-[.2em]">ASTRAVIA</p>${panel(
      'Crew sign-in',
      `<div class="flex flex-col items-center text-center">${AVATAR}<p class="lbl mt-4">Welcome back</p><h1 class="mt-1 text-2xl font-bold">Mei Lin</h1><p class="lbl mt-1">Mission specialist</p><p class="num mt-2 text-xs uppercase tracking-[.14em] text-muted-foreground">Simulator ID <span class="text-foreground">${SIM_ID}</span></p>
      <dl class="mt-5 w-full border-y border-border py-4 text-left"><div class="grid grid-cols-2 gap-x-4 gap-y-3 pb-3">${rows.map((r) => row(r[0], r[1])).join('')}</div><div class="space-y-3">${lines.map((r) => line(r[0], r[1])).join('')}</div></dl>
      <div class="mt-5 w-full [&>button]:w-full">${btn('Log in', 'quickstart', 'primary')}</div><div class="mt-2 w-full [&>button]:w-full">${btn('Restart Onboard', 'login', 'outline')}</div><p class="mt-3 text-xs text-muted-foreground">After signing in, you put on your devices and take two short checks. It takes about 4 minutes.</p></div>`,
    )}<nav class="mt-4 flex justify-center gap-6 text-xs uppercase tracking-[.14em]" aria-label="Footer"><button type="button" data-act="about" data-v="how" class="text-muted-foreground hover:text-primary">How it works</button><button type="button" data-act="about" data-v="about" class="text-muted-foreground hover:text-primary">About</button></nav></div>`;
  }
  const idx = ONB_STEPS.findIndex((x) => x[0] === o.step);
  const stepper = `<ol class="mb-5 flex flex-wrap gap-x-1 gap-y-2 text-[12px] uppercase tracking-[.1em]">${ONB_STEPS.map((x, i) => `<li class="flex items-center gap-1.5 ${i === idx ? 'text-primary' : i < idx ? 'text-foreground' : 'text-muted-foreground'}" ${i === idx ? 'aria-current="step"' : ''}><span class="num grid h-6 w-6 place-items-center border text-xs ${i < idx ? 'border-ok text-ok' : i === idx ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}">${i < idx ? ic('check', 'h-3.5 w-3.5') : i + 1}</span>${x[1]}${i < 3 ? '<span class="mx-1 text-border">——</span>' : ''}</li>`).join('')}</ol>`;
  let body = '';
  if (o.step === 'wear') {
    body = panel(
      'Step 1 · Put on your devices',
      `${head('Wear all three, then tap Confirm', 'ASTRAVIA reads them for you, so you never type these in.')}<div class="grid gap-5 lg:grid-cols-12"><div class="min-w-0 lg:col-span-7">${wearIllus(false)}</div><div class="min-w-0 lg:col-span-5"><ul class="divide-y divide-border">${DEVICES.map((d, i) => `<li class="flex gap-3 py-3"><span class="num grid h-6 w-6 shrink-0 place-items-center border border-border text-xs text-muted-foreground">${i + 1}</span><div class="min-w-0"><p class="text-sm font-semibold">${d.name}</p><p class="text-sm text-muted-foreground">Reads ${d.reads.charAt(0).toLowerCase() + d.reads.slice(1)}</p><p class="text-xs text-muted-foreground">${d.fit}</p></div></li>`).join('')}</ul></div></div>
      <div class="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">${btn("Confirm, I'm wearing them", 'onbnext', 'primary', 'data-v="detect"')}</div>`,
    );
  } else if (o.step === 'detect') {
    const R = detectRows(),
      run = o.scan === 'running',
      done = o.scan === 'done';
    const rows = R.map(
      (r, i) =>
        `<li class="py-3" data-row="${i}"><div class="flex flex-wrap items-center justify-between gap-2"><div class="min-w-0"><p class="text-sm font-semibold">${r[0]}</p><p class="text-xs uppercase tracking-[.08em] text-muted-foreground">${r[1]}</p></div><span data-st>${done ? (r[3] === 'ok' ? pill('Read', 'check', 'ok') : stPill(r[3])) : run ? '<span class="text-xs uppercase tracking-[.1em] text-primary">Reading…</span>' : pill('Waiting', 'minus', 'nodata')}</span></div>${run ? `<div class="mt-2 h-1.5 bg-muted"><div class="fillbar h-1.5 bg-primary" style="animation-delay:${i * 0.75}s"></div></div>` : ''}${done ? `<p class="num mt-1 text-sm">${r[2]}</p>` : ''}</li>`,
    ).join('');
    body = panel(
      'Step 2 · Read your devices',
      `${head(done ? 'Your devices are read' : run ? 'Reading your devices…' : 'Ready to read your devices', done ? 'Here is what they recorded. Anything outside your baseline is flagged.' : 'Keep still for a few seconds while ASTRAVIA connects.')}<div class="grid gap-5 lg:grid-cols-12"><div class="min-w-0 lg:col-span-6">${wearIllus(run)}</div><div class="min-w-0 lg:col-span-6"><ul class="divide-y divide-border" aria-live="polite">${rows}</ul>${done ? `<p class="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">Wearable readings in this prototype are invented.</p>` : ''}</div></div>
      <div class="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">${done ? btn('Next: reaction test', 'onbnext', 'primary', 'data-v="pvt"') : btn(run ? 'Reading…' : 'Start reading', 'detect', 'primary', '', run)}${!run && !done ? btn('Back', 'onbnext', 'ghost', 'data-v="wear"') : ''}</div>`,
    );
  } else if (o.step === 'pvt') {
    if (!o.pvt)
      body = `${head('Step 3 · Reaction test', 'Reaction time is the most sensitive sign of sleep loss. It takes under a minute.')}${pvtPanel()}`;
    else {
      const e = latest('cog'),
        st = judge('cog', e);
      body = panel(
        'Step 3 · Reaction test',
        `<div class="flex flex-wrap items-center gap-3">${stPill(st)}<h3 class="text-base font-semibold">Average <span data-countup="${e.v.ms}">${e.v.ms}</span> ms</h3></div><p class="mt-2 text-sm text-muted-foreground">${st === 'ok' ? 'Within range. You can repeat it any time from Record.' : 'Slower than your baseline. Sleep first, then retake it before any high-risk task.'}</p><div class="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">${btn('Next: well-being', 'onbnext', 'primary', 'data-v="mind"')}</div>`,
      );
    }
  } else if (o.step === 'mind') {
    const d = S.mindDraft || (S.mindDraft = { mood: 3, stress: 3, fatigue: 4, sleepq: 2 });
    const scale = ([k, l, lo, hi]) =>
      `<div><div class="flex items-baseline justify-between gap-2"><p class="text-sm font-medium">${l}</p><p class="text-xs text-muted-foreground">${lo} → ${hi}</p></div><div class="mt-2 flex gap-2" role="radiogroup" aria-label="${l}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="${d[k] === n}" data-act="mindset" data-k="${k}" data-v="${n}" class="num h-10 w-10 border text-sm ${d[k] === n ? 'border-primary bg-ok-soft text-primary' : 'border-border text-muted-foreground hover:border-primary/60'}">${n}</button>`).join('')}</div></div>`;
    body = panel(
      'Step 4 · Well-being check-in',
      `${head('How are you today?', 'Four taps, about 30 seconds. Only you can see your answers.')}<div class="grid gap-5 sm:grid-cols-2">${MQ.map(scale).join('')}</div>
      <div class="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">${btn('Save and go to Today', 'onbfinish', 'primary')}${btn('Skip for now', 'onbskip', 'ghost')}</div>`,
    );
  }
  return `<div class="mx-auto w-full max-w-5xl"><div class="mb-4 flex flex-wrap items-center justify-between gap-3"><p class="glow text-lg font-bold tracking-[.2em]">ASTRAVIA</p><span class="lbl">Mei Lin · ${SIM_ID} · ${c.name} · Mission Day ${pad3(c.md)}</span></div>${stepper}${body}</div>`;
}
let bootT = null;
export function startBoot(msg) {
  clearTimeout(bootT);
  const D = 3600,
    t0 = performance.now();
  const step = (t) => {
    if (!S.boot) return;
    const k = Math.max(0, Math.min(1, (t - t0 - 300) / 2800)),
      el = document.querySelector('[data-bootpct]');
    if (el) el.textContent = Math.round(100 * (1 - Math.pow(1 - k, 3)));
    if (k < 1 || !el) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  bootT = setTimeout(() => {
    S.boot = false;
    S.toast = msg || "Setup complete. Today's readings are below.";
    render(true);
  }, D);
}
function vBoot() {
  const c = ctx(),
    n = changed().length;
  const lines = [
    ['Wearables', `${DEVICES.length} devices · 14 nights`],
    ['Baselines', `${c.zero ? '0 g' : c.g} phase · pre-launch kept`],
    ['Mission', `${c.name} · ${dayLab()}`],
    ['NASA data', c.id === 'station' ? 'ISS radiation · cabin CO₂' : 'RadLab radiation replay'],
    ['Earth link', linkInfo().st],
    ['Signals', `${signals().length} assessed · ${n} differ`],
  ];
  const sk = (w) => `<i class="bsk" style="width:${w}%"></i>`,
    fr = (cls, d, inner) => `<div class="bf ${cls}" style="--d:${d}">${inner}</div>`;
  return `<div class="boot" role="status" aria-live="polite" aria-label="Building your dashboard"><div class="boot-grid">
    ${fr('boot-side', 0, `<div class="flex items-center gap-3"><span class="bav"></span><div class="flex-1">${sk(70)}${sk(45)}</div></div><div class="mt-6">${[80, 60, 70, 55, 65, 50].map(sk).join('')}</div>`)}
    <div class="grid min-w-0 content-start gap-4">${fr('', 1, `<div class="flex gap-4">${[16, 12, 20, 14].map((w) => `<span style="flex:0 0 ${w}%">${sk(100)}</span>`).join('')}</div>`)}
      <div class="grid gap-4 sm:grid-cols-2">${fr('h-28', 2, sk(60) + sk(40))}${fr('h-28', 3, sk(55) + sk(35))}</div>
      <div class="grid gap-4 lg:grid-cols-12">${fr('h-80 lg:col-span-7', 4, `<div class="flex h-full gap-4"><svg class="bfig" viewBox="30 0 140 400" aria-hidden="true"><path pathLength="1" d="${SILHOUETTE}"/></svg><div class="flex-1 pt-2">${[70, 50, 65, 45, 60, 40].map(sk).join('')}</div></div>`)}${fr('h-80 lg:col-span-5', 5, `<div class="pt-2">${[75, 55, 70, 50, 65, 45].map(sk).join('')}</div>`)}</div></div></div>
    <div class="boot-scan" aria-hidden="true"></div>
    <div class="boot-hud panel"><div class="panel-b"><p class="glow text-center text-lg font-bold tracking-[.3em]">ASTRAVIA</p><p class="lbl mt-1 text-center">Building your dashboard</p>
      <ul class="blog mt-4 space-y-1.5 text-[12px]">${lines.map(([k, v], i) => `<li style="--i:${i}" class="flex items-baseline gap-3"><span class="w-28 shrink-0 uppercase tracking-[.08em] text-muted-foreground">${k}</span><span class="min-w-0 flex-1 truncate">${v}</span><span class="text-ok">OK</span></li>`).join('')}</ul>
      <div class="bbar mt-4"><i></i></div><p class="num mt-2 flex justify-between text-[11px] uppercase tracking-[.12em] text-muted-foreground"><span>Calibrating</span><span><span data-bootpct>0</span>%</span></p></div></div></div>`;
}
function ring(id) {
  const svg = document.getElementById('wear-svg');
  if (!svg || reduceMotion()) return;
  const d = DEVICES.find((x) => x.id === id),
    c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', 150 + d.x);
  c.setAttribute('cy', 10 + d.y);
  c.setAttribute('r', 14);
  c.setAttribute('class', 'ringpulse');
  svg.appendChild(c);
  setTimeout(() => c.remove(), 800);
}
function rowDone(i) {
  const el = document.querySelector(`[data-row="${i}"] [data-st]`);
  if (el) el.innerHTML = pill('Read', 'check', 'ok');
  const bar = document.querySelector(`[data-row="${i}"] .fillbar`);
  if (bar) bar.style.opacity = '.35';
}
