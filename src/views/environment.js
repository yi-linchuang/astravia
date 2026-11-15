// Environment page: space weather, radiation and cabin charts, shelter map.
import { lineChart } from '../components/charts.js';
import { REAL, REAL_S, btn, ic, pageTitle, panel, pill, tile } from '../components/primitives.js';
import { CO2_AVG7, CO2_MEAN, CO2_PEAK, RH, TEMP, ctx } from '../data/env.js';
import {
  ALERT,
  ISS_RAD,
  clearMin,
  radBadge,
  radBadgeS,
  radLabel,
  radNow,
  radOk,
  radSrc,
  radTotal,
  speLine,
} from '../data/radiation.js';
import { hm, r1 } from '../lib/util.js';
import { S } from '../state.js';

/* ---------- habitat & radiation ---------- */
export function shelterMap() {
  const Z = [
    ['Airlock', 8, 62, 0.06],
    ['Lab', 74, 92, 0.14],
    ['Galley', 170, 70, 0.2],
    ['Crew quarters', 244, 84, 0.32],
    ['Storm shelter', 332, 60, 0.6],
  ];
  const here = S.shelter ? 4 : 1,
    F = 'font-family="IBM Plex Mono, monospace"';
  return `<svg viewBox="0 0 400 132" class="h-auto w-full" role="img" aria-label="Habitat floor plan. The storm shelter gives the most shielding, the airlock the least.">
    ${Z.map(([n, x, w, o], i) => `<g><rect x="${x}" y="26" width="${w}" height="70" style="fill:hsl(var(--ok));fill-opacity:${o};stroke:hsl(var(--${i === 4 ? 'ok' : 'border'}));stroke-width:${i === 4 ? 1.5 : 1}"/><text x="${x + w / 2}" y="${i % 2 ? 112 : 18}" text-anchor="middle" font-size="9.5" ${F} style="fill:hsl(var(--${i === 4 ? 'ok' : 'muted-foreground'}))">${n.toUpperCase()}</text>${i === here ? `<circle cx="${x + w / 2}" cy="61" r="6" style="fill:hsl(var(--warn));stroke:hsl(var(--card));stroke-width:2"/><text x="${x + w / 2}" y="84" text-anchor="middle" font-size="9" ${F} style="fill:hsl(var(--warn))">YOU</text>` : ''}</g>`).join('')}
    <text x="8" y="128" font-size="9" ${F} style="fill:hsl(var(--muted-foreground))">BRIGHTER = MORE SHIELDING</text></svg>`;
}
export function vHabitat() {
  const c = ctx(),
    st = c.id === 'station',
    spe = c.spe && !radOk(),
    now = Math.min(23, Math.floor(S.clock / 60)),
    tr = radTotal(),
    sr = radSrc(),
    peak = sr ? Math.max(...sr.series) : 0,
    evt = peak >= ALERT;
  const xs7 = [0, 1, 2, 3, 4, 5, 6].map((i) => String(c.n - 6 + i)),
    stand = st ? REAL : '',
    tag = st ? REAL_S : '';
  const item = (n, t, b) =>
    `<li class="flex flex-wrap items-center justify-between gap-3 py-3"><div class="min-w-0 flex-1"><p class="text-sm font-semibold">${n}</p><p class="text-sm text-muted-foreground">${t}</p></div>${b}</li>`;
  const links = panel(
    'How this can change your readings',
    `<ul class="divide-y divide-border">${item('Cabin CO₂', 'High CO₂ can bring on a headache before you notice the air.', btn('Report a headache', 'startflow', 'ghost', 'data-v="headache"'))}${item('Oxygen and cabin pressure', 'Low oxygen lowers SpO₂ and can cause headache, confusion and poor sleep (NASA HRP, hypoxia).', btn('Record SpO₂', 'measure', 'ghost', 'data-v="bp"'))}${item('Radiation', c.spe ? 'A solar particle event can stop an outing and send you to shelter.' : "The station orbits inside Earth's magnetic field, which shields it from most solar events. Daily dose still adds up.", btn(`See the ${c.mainShort} radiation rule`, 'task', 'ghost', 'data-v="eva"'))}${item('Temperature and humidity', 'Comfort affects how well you sleep.', btn('Sleep signal', 'signal', 'ghost', 'data-v="sleep"'))}</ul>`,
    { cls: 'lg:col-span-12' },
  );
  const event = c.spe
    ? panel(
        evt ? 'Solar particle event · ' + radLabel() : 'Space weather',
        spe
          ? `<div class="flex flex-wrap items-center justify-between gap-3"><p class="min-w-0 flex-1 text-sm"><span class="pulse mr-1 inline-flex align-middle text-alert">${ic('alert', 'h-4 w-4')}</span><span class="font-semibold text-alert">Event in progress.</span> ${speLine()}</p>${btn('Take action', 'takeaction', 'danger', 'data-v="spe"')}</div>`
          : `<div class="flex flex-wrap items-center gap-3">${pill('No active event', 'check', 'ok')}<p class="text-sm text-muted-foreground">Dose rate is ${radNow()} µGy/h, below the alert level. ${evt ? 'The replayed event ended around ' + hm(clearMin()) + '.' : 'No solar event on this day of the real data.'}</p></div>`,
        { edge: spe ? 'alert' : '', cls: 'lg:col-span-12' },
      )
    : '';
  const doseChart = st
    ? panel(
        'ISS radiation · Mission Day 1 to ' + c.n,
        `${lineChart({ label: 'ISS daily radiation dose', vals: ISS_RAD.total.slice(0, c.n), xs: ISS_RAD.total.slice(0, c.n).map((_, i) => String(1 + i)), every: 2, ticks: [0.2, 0.25, 0.3, 0.35], fmt: (v) => v + ' mGy', tip: (x, v) => `Mission Day ${x}: ${v} mGy/day`, xLabel: 'MISSION DAY · DAILY TOTAL' })}<p class="mt-2 text-xs text-muted-foreground">ISS area dosimetry from mission RR-6 (15 Dec 2017 to 1 Feb 2018), replayed as mission days. The file does not state the unit; the values match typical ISS levels in mGy/day. Steady dose, no solar event.</p>`,
        { right: REAL },
      )
    : panel(
        'Dose rate · ' + sr.name,
        `${lineChart({ label: 'Radiation dose rate, ' + sr.name, vals: sr.series, xs: sr.series.map((_, i) => hm(i * 60)), every: 4, ticks: peak > 150 ? [0, 100, 200, 300] : peak > 30 ? [0, 50, 100, 150] : [0, 10, 20, 30], fmt: (v) => v + ' µGy/h', tip: (x, v, i) => `${x}: ${r1(v)} µGy/h${i > now ? ' (still ahead)' : ''}`, xLabel: 'HABITAT TIME · HOURLY', fc: now, area: true, lines: peak > 30 ? [{ v: ALERT, t: 'ALERT LEVEL', t2: '50 · ASSUMED' }] : undefined })}<p class="mt-2 text-xs text-muted-foreground">${sr.note} NASA requires an alert when exposure rates pass predefined thresholds but does not publish the values, so the alert level is assumed. The API returns no unit; the values match published levels in µGy/h. The dashed part is still ahead of habitat time.</p>`,
        { right: radBadge() },
      );
  const co2 = panel(
    'Cabin CO₂ · 7 days',
    `<p class="mb-2 text-sm text-muted-foreground">7-day average <span class="num text-foreground">${CO2_AVG7} mmHg</span>, above the 2.5 reference. The 1-hour peak went over 3.0 on 2 days.${S.co2Fixed ? ' Environmental control is adjusting the scrubbers.' : ''}</p>${lineChart(
      {
        label: 'Cabin CO2, daily peak 1-hour average',
        vals: CO2_PEAK,
        xs: xs7,
        ticks: [1.5, 2, 2.5, 3, 3.5],
        fmt: (v) => v + ' mmHg',
        tip: (x, v, i) => `${c.day} ${x}: peak ${v} · mean ${CO2_MEAN[i]} mmHg`,
        xLabel: c.day.toUpperCase() + ' · DAILY PEAK 1-H AVERAGE',
        lines: [
          { v: 3, t: 'LIMIT 3.0', t2: '1-HOUR' },
          { v: 2.5, t: 'REF 2.5', t2: '7-DAY AVG' },
        ],
      },
    )}<p class="mt-2 text-xs text-muted-foreground">${st ? 'ISS cabin readings from 25–31 Jan 2018, replayed as mission days. Converted from ppm at 760 mmHg.' : 'Stand-in values copied from ISS readings (25–31 Jan 2018). They were not measured in this environment.'}</p>`,
    { right: stand },
  );
  const press = st
    ? [
        ['Cabin pressure', '101 kPa', 'Sea-level pressure'],
        ['Oxygen', '21% · 21 kPa', 'Partial pressure nominal'],
      ]
    : [
        ['Cabin pressure', '56.5 kPa', 'Reduced on purpose'],
        ['Oxygen', '34% · 19.2 kPa', 'Partial pressure nominal'],
      ];
  const doseTiles = st
    ? `${tile('Dose today', ISS_RAD.total[c.n - 1] + ' mGy', 'ISS area monitor, replayed', REAL_S)}${tile('Since Mission Day 1', ISS_RAD.acc[c.n - 1] + ' mGy', 'ISS data replayed', REAL_S)}${tile('Your dosimeter', 'Not in prototype', 'Personal total would show here', '')}${tile('Neutron share', 'About 30%', 'CSA: share of ISS dose', '')}`
    : `${tile('Dose rate now', r1(radNow()) + ' µGy/h', 'Usual ' + sr.usual, radBadgeS())}${tile('Your dose today', spe ? '0.9 mSv' : '1.1 mSv', 'Personal dosimeter')}${tile('Mission total', tr.now + ' mSv', 'Since launch')}${tile('Neutron share', 'Not measured', 'About 30% of ISS dose', '')}`;
  return `${pageTitle('Environment', 'Secondary · what affects your readings')}<p class="-mt-3 mb-5 max-w-3xl text-sm text-muted-foreground">The state of the ${c.id === 'base' ? c.name : c.name.toLowerCase()}, not of your body. These are not health indicators, but they change them: CO₂ and oxygen touch headache and SpO₂, radiation touches what you may do outside.</p>
    <div class="grid gap-5 lg:grid-cols-12">${links}${event}
    <div class="grid min-w-0 content-start gap-5 lg:col-span-7">${doseChart}${co2}</div>
    <div class="grid min-w-0 content-start gap-5 lg:col-span-5">
      ${panel('Radiation dose', `<div class="grid gap-3 sm:grid-cols-2">${doseTiles}</div><div class="mt-3 flex flex-wrap items-center justify-between gap-2">${btn('Long-term dose', 'htab', 'ghost', 'data-v="long"')}</div><p class="mt-2 text-xs text-muted-foreground">The 30% neutron figure is from the Canadian Space Agency. Its CANS instrument, built to measure neutrons continuously, is still in development.</p>`)}
      ${panel('Cabin air & comfort', `<div class="grid gap-3 sm:grid-cols-2">${tile('Temperature', TEMP[6] + ' °C', `7-day range ${Math.min(...TEMP)}–${Math.max(...TEMP)}`, tag)}${tile('Humidity', RH[6] + ' %', `7-day range ${Math.min(...RH)}–${Math.max(...RH)}`, tag)}${tile(press[0][0], press[0][1], press[0][2])}${tile(press[1][0], press[1][1], press[1][2])}${tile('Noise', '58 dBA', 'Sleep area 47 dBA')}${tile('Lighting', 'Day mode', 'Dims at 21:30')}</div><p class="mt-2 text-xs text-muted-foreground">Some deep-space cabins are planned to run at reduced pressure to cut prebreathe time before EVA. That raises the risk of mild hypoxia, so oxygen sits next to SpO₂ in your checks.</p>`)}
      ${panel('Sensor status', `<ul class="space-y-2 text-sm"><li class="flex justify-between gap-3"><span>Cabin air sensors</span>${pill('Online', 'check', 'ok')}</li><li class="flex justify-between gap-3"><span>Area dosimeter</span>${pill('Online', 'check', 'ok')}</li><li class="flex justify-between gap-3"><span>Personal dosimeter</span><span class="num text-muted-foreground">Synced ${hm(S.clock - 6)}</span></li></ul>`)}
    </div></div>`;
}
