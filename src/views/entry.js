// Measurement entry forms (number, colour, photo, reaction test) and the result screen.
import { go } from '../actions.js';
import { back, btn, pageTitle, panel, pill, stPill } from '../components/primitives.js';
import { ctx } from '../data/env.js';
import { IND, baseTxt, judge } from '../data/indicators.js';
import { PHK, addEntry, dayRel, latest, sorted } from '../data/records.js';
import { $, r1, reduceMotion } from '../lib/util.js';
import { render } from '../render.js';
import { S } from '../state.js';
import { backName } from './care.js';
import { vHealth } from './health.js';

/* ---------- mission readiness ---------- */
// ---------- record: list, entry forms, results ----------
const URINE = ['#f6f3c7', '#efe9a4', '#e6dc7c', '#dcc95a', '#d2b13f', '#c1912f', '#a6702a', '#85501f'];
export const SPECIAL = {
  urine: {
    name: 'Urine colour',
    cad: 'When needed',
    hz: ['gravity'],
    why: 'Dark urine is an early sign you need more fluid.',
    src: 'Colour chart, tapped in',
    adv: {
      ok: 'You look hydrated. Keep drinking to your target.',
      watch: 'Drink a glass of water now and check again later today.',
      alert:
        'You are probably dehydrated. Drink fluids now. If the colour stays this dark after a few hours, tell your CMO.',
    },
    expect:
      'Dehydration plus calcium released from bone can raise the risk of kidney stones in spaceflight (NASA HRP, bone changes).',
    basis: 'The colour chart is a product assumption.',
  },
  skin: {
    name: 'Skin photo',
    cad: 'When needed',
    hz: ['closed'],
    why: 'Photos let you and your CMO compare a rash or sore day by day.',
    src: 'Camera',
    expect: 'Spaceflight stress can wake dormant viruses and cause rashes or cold sores (NASA HRP, immune system).',
    basis: 'Product design.',
  },
  us: {
    name: 'Ultrasound image',
    cad: 'With your CMO',
    hz: [],
    why: 'Images go to the flight surgeon with your records.',
    src: 'Image file',
    expect:
      'ISS crews are trained to use ultrasound, and NASA is testing devices that send vital signs and images to the ground (NASA HRP).',
    basis: 'ASTRAVIA does not interpret images.',
  },
};
export const pvtPanel = () =>
  `<p class="-mt-3 mb-5 text-sm text-muted-foreground">Tap the box as soon as it lights up. 5 times. If you're interrupted, start over.</p>${panel('Test', `<button type="button" id="pvt-pad" class="grid h-56 w-full place-items-center border border-border bg-muted text-center text-base uppercase tracking-[.2em]">Tap to start</button><p id="pvt-info" class="num mt-3 text-sm text-muted-foreground" aria-live="polite">0 / 5</p><p class="mt-1 text-xs text-muted-foreground">The demo shortens the 3-minute PVT-B to 5 taps and relaxes the pass mark.</p>`, { cls: 'max-w-xl scan' })}`;
const fld = (f, v) =>
  f.opts
    ? `<div class="sm:col-span-2"><p class="lbl mb-2">${f.label}</p><div class="flex flex-wrap gap-2" role="radiogroup" aria-label="${f.label}">${f.opts.map((o) => `<button type="button" role="radio" aria-checked="${v === o}" data-act="efset" data-k="${f.k}" data-v="${o}" class="min-h-[40px] border px-4 text-sm ${v === o ? 'border-primary bg-ok-soft text-primary' : 'border-border hover:border-primary/60'}">${o}</button>`).join('')}</div></div>`
    : `<div><label for="ef-${f.k}" class="lbl">${f.label}</label><div class="mt-2 flex items-center gap-2"><input id="ef-${f.k}" type="number" inputmode="decimal" data-ef="${f.k}" value="${v === undefined ? '' : v}" placeholder="${f.ph || ''}" min="${f.min}" max="${f.max}" step="${f.step}" class="num h-11 w-32 border border-border bg-muted px-3 text-lg text-foreground"><span class="text-sm text-muted-foreground">${f.unit}</span></div></div>`;
const formFoot = (hint) =>
  `${S.rec.err ? `<p role="alert" class="mt-4 border border-alert bg-alert-soft p-3 text-sm text-alert">${S.rec.err}</p>` : ''}<div class="mt-5 flex flex-wrap gap-2">${btn('Check and save', 'entrysave', 'primary')}${btn('Cancel', 'measback', 'ghost')}</div><p class="mt-3 text-xs text-muted-foreground">${hint}</p>`;
function numForm(id) {
  const I = IND[id],
    r = S.rec;
  if (I.zeroNA && ctx().zero)
    return panel(
      'Not available here',
      `<p class="text-sm text-muted-foreground">${I.name} can't be tested in 0 g: you float, so there is nothing to sway against. Switch the environment to a surface to record it.</p>`,
      { cls: 'max-w-xl' },
    );
  return `<p class="-mt-3 mb-5 max-w-2xl text-sm text-muted-foreground">${I.why}</p>${panel('Enter your reading', `${I.pre ? `<div class="mb-4 border border-border bg-muted p-3"><p class="lbl">Before you start</p><ul class="mt-1 list-disc pl-5 text-sm text-muted-foreground">${I.pre.map((x) => `<li>${x}</li>`).join('')}</ul></div>` : ''}<div class="grid gap-5 sm:grid-cols-2">${I.fields.map((f) => fld(f, r.vals[f.k])).join('')}</div>${formFoot('Typed in by you. Saved as your own entry.')}`, { cls: 'max-w-3xl' })}`;
}
function specialForm(id) {
  const r = S.rec,
    S2 = SPECIAL[id],
    photo = (label, cap) =>
      `<div><p class="lbl mb-2">${label}</p>${r.vals.img ? `<div class="flex flex-wrap items-end gap-3"><img src="${r.vals.img}" alt="Your photo" class="max-h-40 border border-border"><span>${pill('Added', 'check', 'ok')}</span></div>` : `<label for="rec-photo" class="btn btn-outline cursor-pointer">${cap}</label><input id="rec-photo" type="file" accept="image/*" ${id === 'skin' ? 'capture="environment"' : ''} class="sr-only" data-recphoto>`}</div>`;
  let body = '';
  if (id === 'urine')
    body = `<div><p class="lbl mb-2">Pick the colour that matches best (1 = pale, 8 = dark)</p><div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Urine colour">${URINE.map((col, i) => `<button type="button" role="radio" aria-checked="${r.vals.c === String(i + 1)}" aria-label="Colour ${i + 1}" data-act="efset" data-k="c" data-v="${i + 1}" class="num grid h-12 w-12 place-items-center border-2 text-sm font-semibold text-black ${r.vals.c === String(i + 1) ? 'border-primary' : 'border-transparent'}" style="background:${col}">${i + 1}</button>`).join('')}</div></div>`;
  if (id === 'skin')
    body = `${photo('Add a photo', 'Take or choose a photo')}<div class="mt-5"><p class="lbl mb-2">Compared with your last photo (optional)</p><div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Compared with last photo">${['Better', 'About the same', 'Larger or redder'].map((o) => `<button type="button" role="radio" aria-checked="${r.vals.cmp === o}" data-act="efset" data-k="cmp" data-v="${o}" class="min-h-[40px] border px-4 text-sm ${r.vals.cmp === o ? 'border-primary bg-ok-soft text-primary' : 'border-border hover:border-primary/60'}">${o}</button>`).join('')}</div></div><p class="mt-3 text-xs text-muted-foreground">Good light, about 20 cm away, same spot each time.</p>`;
  if (id === 'us')
    body = `${photo('Choose an ultrasound image', 'Choose an image')}<p class="mt-3 text-xs text-muted-foreground">ASTRAVIA does not read the image. It goes into the package for your flight surgeon.</p>`;
  return `<p class="-mt-3 mb-5 max-w-2xl text-sm text-muted-foreground">${S2.why}</p>${panel('Add an entry', `${body}${formFoot('Saved on this device in the prototype. Saved as your own entry.')}`, { cls: 'max-w-3xl' })}`;
}
function entryResult(id) {
  const done = `<div class="mt-4 flex flex-wrap gap-2">${btn('Done', 'measback', 'primary')}${btn('Record another', 'htab', 'outline', 'data-v="body"')}</div>`;
  const yours = '';
  if (id === 'skin') {
    const ent = sorted('skin'),
      cur = ent[ent.length - 1],
      prev = ent.length > 1 ? ent[ent.length - 2] : null,
      worse = cur.v.cmp === 'Larger or redder';
    return panel(
      'Saved',
      `<div class="grid gap-4 sm:grid-cols-2"><div><p class="lbl mb-1">Now</p><img src="${cur.v.img}" alt="Your latest photo" class="max-h-48 border border-border"></div>${prev ? `<div><p class="lbl mb-1">Before · ${dayRel(prev.d)}</p><img src="${prev.v.img}" alt="Your earlier photo" class="max-h-48 border border-border"></div>` : '<p class="text-sm text-muted-foreground">This is your first photo. Take the next one at the same spot tomorrow so you can compare.</p>'}</div>
      <div class="mt-4 flex flex-wrap items-center gap-3">${worse ? pill('Getting worse', 'alert', 'watch') : pill('Saved', 'check', 'ok')}</div><p class="mt-2 text-sm">${worse ? 'It looks larger or redder. Report it now so your CMO can see it today.' : 'Keep taking one photo a day at the same spot. If it grows, spreads or you get a fever, report it.'}</p><p class="mt-2 text-xs text-muted-foreground">${SPECIAL.skin.expect}</p>
      ${worse ? `<div class="mt-3">${btn('Report a rash', 'startflow', 'unwell', 'data-v="rash"')}</div>` : ''}${done}`,
      { right: yours },
    );
  }
  if (id === 'us')
    return panel(
      'Saved',
      `<p class="text-sm">${S.data.us.length} image${S.data.us.length > 1 ? 's' : ''} will go in your next package for the flight surgeon.</p><p class="mt-2 text-xs text-muted-foreground">${SPECIAL.us.expect} ASTRAVIA does not read the image.</p>${done}`,
      { right: yours },
    );
  const I = IND[id] || SPECIAL[id],
    e = latest(id),
    st = judge(id, e),
    c = ctx(),
    k = PHK();
  const base = IND[id] ? I.base[k] : null,
    dv = IND[id] ? I.main(e) - base : 0;
  const headline =
    st === 'ok'
      ? id === 'urine'
        ? 'You look hydrated'
        : 'Within your baseline'
      : id === 'bp' && e.v.spo2 < 90
        ? 'SpO₂ is below 90%'
        : id === 'urine'
          ? 'Darker than it should be'
          : `${I.short} is ${r1(Math.abs(dv))}${I.unit === '%' ? '%' : ' ' + I.unit} ${dv > 0 ? 'above' : 'below'} your baseline`;
  const rows = [['Your reading', IND[id] ? I.show(e) : `colour ${e.v.c} of 8`]];
  if (IND[id]) {
    rows.push([`Your ${c.zero ? 'weightless' : 'surface'} baseline`, baseTxt(id)]);
    rows.push(['Before launch', baseTxt(id, 'pre')]);
  }
  const extra = [];
  if (st !== 'ok' && id === 'cog') extra.push(btn('Retake the test', 'measure', 'outline', 'data-v="cog"'));
  if (st !== 'ok' && id === 'bal') extra.push(btn('Report dizziness', 'startflow', 'outline', 'data-v="dizzy"'));
  if (st !== 'ok' && id === 'sleep')
    extra.push(
      S.sleepPlan
        ? pill('Reminder set for tonight', 'check', 'ok')
        : btn("Set tonight's reminder", 'sleepplan', 'outline'),
    );
  if (st === 'alert') extra.push(btn('Report a symptom', 'unwell', 'unwell'));
  return `${panel('What this means', `<div class="flex flex-wrap items-center gap-3">${stPill(st)}<h3 class="text-base font-semibold">${headline}</h3></div><dl class="mt-3 divide-y divide-border text-sm">${rows.map((r) => `<div class="flex justify-between gap-3 py-2"><dt class="text-muted-foreground">${r[0]}</dt><dd class="num text-right">${r[1]}</dd></div>`).join('')}</dl>${rangeBar(id, e)}<div class="mt-3"><h3 class="lbl">Expected in spaceflight</h3><p class="mt-1 text-sm text-muted-foreground">${I.expect}</p></div>`, { right: yours })}
    <div class="mt-5">${panel('What to do', `<p class="text-sm">${I.adv[st]}</p>${st === 'ok' ? '' : '<p class="mt-2 text-sm text-muted-foreground">If this is still outside your range tomorrow, tell your CMO. Do not wait for the ground.</p>'}<div class="mt-4 flex flex-wrap gap-2">${extra.join('')}</div>${done}`)}</div>`;
}
export function vEntry() {
  const r = S.rec;
  if (!r) {
    go('health');
    return vHealth();
  }
  const id = r.ind,
    I = IND[id] || SPECIAL[id];
  const body = r.res ? entryResult(id) : id === 'cog' ? pvtPanel() : SPECIAL[id] ? specialForm(id) : numForm(id);
  return `${back(backName(), 'measback')}${pageTitle(I.name, I.cad + ' · ' + ctx().name)}${body}`;
}
function pvtFlash(ms) {
  const pad = document.getElementById('pvt-pad');
  if (!pad || reduceMotion()) return;
  const host = pad.parentElement;
  host.style.position = 'relative';
  const s = document.createElement('span');
  s.className = 'pvt-flash num';
  s.textContent = ms + ' ms';
  host.appendChild(s);
  setTimeout(() => s.remove(), 700);
}
function rangeBar(id, e) {
  const I = IND[id];
  if (!I || !I.ticks || I.base[PHK()] == null) return '';
  const lo = I.ticks[0],
    hi = I.ticks[I.ticks.length - 1],
    pct = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  const base = I.base[PHK()],
    pre = I.base.pre,
    v = I.main(e),
    st = judge(id, e),
    col = st === 'ok' ? 'var(--ok)' : st === 'watch' ? 'var(--warn)' : 'var(--alert)';
  const a = pct(base - I.tol),
    b = pct(base + I.tol),
    vp = pct(v);
  return `<div class="mt-4"><h3 class="lbl mb-2">Where your reading sits</h3><div class="relative h-9" aria-hidden="true"><div class="absolute inset-x-0 top-[17px] h-px bg-border"></div><div class="absolute top-3 h-3" style="left:${a}%;width:${Math.max(2, b - a)}%;background:hsl(var(--primary) / .2)"></div><div class="absolute top-2 h-5 w-px" style="left:${pct(base)}%;background:hsl(var(--primary))"></div><div class="absolute top-2 h-5 w-px border-l border-dashed border-muted-foreground" style="left:${pct(pre)}%"></div>
    <div data-slide data-from="${pct(base)}" data-to="${vp}" class="absolute top-0 h-9 w-0" style="left:${vp}%"><span class="absolute -left-[6px] top-[11px] h-3 w-3" style="background:hsl(${col});box-shadow:0 0 0 2px hsl(var(--card))"></span></div></div>
    <div class="flex justify-between text-[11px] uppercase tracking-[.08em] text-muted-foreground"><span>${lo}</span><span>Shaded: your baseline range · Solid line: baseline · Dashed: before launch</span><span>${hi} ${I.unit}</span></div></div>`;
}
export function pvtInit() {
  const pad = $('#pvt-pad'),
    info = $('#pvt-info');
  let times = [],
    t0 = 0,
    timer = null,
    phase = 'idle';
  const idle =
    'grid h-56 w-full place-items-center border border-border bg-muted text-center text-base uppercase tracking-[.2em]';
  const arm = () => {
    phase = 'wait';
    pad.textContent = 'Wait for it…';
    pad.className = idle;
    pad.style.boxShadow = '';
    timer = setTimeout(
      () => {
        phase = 'go';
        t0 = performance.now();
        pad.textContent = 'Tap!';
        pad.className = idle
          .replace('bg-muted', 'bg-primary text-primary-foreground')
          .replace('border-border', 'border-primary');
        pad.style.boxShadow = 'var(--glow-green)';
      },
      900 + Math.random() * 1800,
    );
  };
  pad.addEventListener('pointerdown', () => {
    if (phase === 'idle') return arm();
    if (phase === 'wait') {
      clearTimeout(timer);
      info.textContent = `Too early, that one doesn't count. ${times.length} / 5`;
      return arm();
    }
    if (phase === 'go') {
      times.push(performance.now() - t0);
      pvtFlash(Math.round(times[times.length - 1]));
      info.textContent = `${times.length} / 5 · this one ${Math.round(times[times.length - 1])} ms`;
      if (times.length < 5) return arm();
      const ms = Math.round(times.reduce((a, b) => a + b, 0) / 5);
      addEntry('cog', { ms });
      if (S.onb && S.view === 'onboard') S.onb.pvt = ms;
      else S.rec.res = true;
      render(true);
    }
  });
}
