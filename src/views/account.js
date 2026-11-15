// My account and the baseline review.
import { C } from '../components/charts.js';
import { back, btn, ic, pageTitle, panel, pill } from '../components/primitives.js';
import { HRW, baseRows, fixedRows, nowCol } from '../data/baselines.js';
import { ctx, dayLab } from '../data/env.js';
import { FLOWS } from '../data/flows.js';
import { IND } from '../data/indicators.js';
import { anyData, todayE } from '../data/records.js';
import { changed, sigText } from '../data/signals.js';
import { S } from '../state.js';

export function vProfile() {
  if (S.base) return vBaseline();
  const c = S.care,
    f = c.flow && FLOWS[c.flow];
  const ev = changed().map((x) => [dayLab(), `${x.name}: ${x.head}`]);
  if (c.status !== 'none' && f && !(f.private && !c.shared))
    ev.push([
      dayLab(),
      `${f.name} reported${c.status === 'resolved' ? ', eased at follow-up' : c.status === 'cmo' ? ', passed to CMO' : ', follow-up set'}`,
    ]);
  Object.keys(IND).forEach((id) => {
    const t = todayE(id);
    if (t && t.src === 'input') ev.push([dayLab(), IND[id].name + ': ' + IND[id].show(t)]);
  });
  if (S.evaCleared) ev.push([dayLab(), `${ctx().mainShort} reassessed: go`]);
  if (!ev.length) ev.push([dayLab(), 'Nothing recorded or flagged yet']);
  return `${pageTitle('My account')}<div class="grid gap-5 lg:grid-cols-2">
    ${panel(
      'My baselines',
      `<p class="mb-3 text-sm text-muted-foreground">Re-set in each mission phase, because your body adapts to each gravity. Every "compared with usual" uses the surface column.</p><div class="overflow-x-auto"><table class="w-full min-w-[380px] text-sm"><thead><tr class="border-b border-border text-left"><th class="lbl py-2 pr-3">Signal</th><th class="lbl py-2 pr-3">Pre-launch</th><th class="lbl py-2 text-primary">${ctx().zero ? 'In 0 g' : 'On a surface'} · now</th></tr></thead><tbody>${baseRows()
        .map(
          (b) =>
            `<tr class="border-b border-border last:border-0"><td class="py-2 pr-3">${b.n}</td><td class="num py-2 pr-3 text-muted-foreground">${b.pre}</td><td class="num py-2 text-primary">${nowCol(b)}</td></tr>`,
        )
        .join(
          '',
        )}</tbody></table></div><p class="mt-3 text-xs text-muted-foreground">Re-set 14 days after the last gravity change, once you confirm it. Bone, strength, eyes and radiation dose always keep the pre-launch reference.</p><div class="mt-3">${btn('How baselines are re-set' + ic('right', 'h-3.5 w-3.5'), 'base', 'outline', 'data-v="view"')}</div>`,
    )}
    ${panel("This week's medical summary", `<p class="mb-3 text-sm text-muted-foreground">Prepared before your weekly private conference with the flight surgeon. Well-being check-ins and your journal are never included.</p><ul class="space-y-2 text-sm">${ev.map((x) => `<li class="flex gap-3"><span class="num w-28 shrink-0 text-muted-foreground">${x[0]}</span><span>${x[1]}</span></li>`).join('')}</ul>`)}
    ${panel('Who can see my data', `<ul class="space-y-2 text-sm"><li class="flex justify-between gap-3"><span>CMO Okafor</span><span class="text-right text-muted-foreground">When you report symptoms or escalate</span></li><li class="flex justify-between gap-3"><span>Flight surgeon</span><span class="text-right text-muted-foreground">Weekly summary and cases you send</span></li><li class="flex justify-between gap-3"><span>Other crew</span><span class="text-right text-muted-foreground">Mission readiness only</span></li><li class="flex justify-between gap-3"><span>Well-being and journal</span><span class="text-right text-primary">Only you</span></li></ul>`)}
    
    <div class="flex flex-wrap gap-2 lg:col-span-2">${btn('Log out', 'logout', 'outline')}${btn('Reset demo', 'reset', 'ghost')}</div>
  </div>`;
}
function phaseChart() {
  const c = ctx(),
    W = 1000,
    H = 280,
    l = 44,
    r = 118,
    t = 34,
    b = 40,
    F = 'font-family="IBM Plex Mono, monospace"';
  const P = [['PRE-LAUNCH · 1 G', HRW.pre, 54, 'L−']];
  if (c.zero) P.push(['WEIGHTLESS · 0 G', HRW.z, 56, 'Week ']);
  else {
    P.push(['IN TRANSIT · 0 G', HRW.tr, 56, 'Transit week ']);
    P.push([`SURFACE · ${c.g.toUpperCase()}`, HRW.su, 58, 'Surface week ']);
  }
  const last = P.length - 1,
    vals = P.flatMap((p) => p[1]),
    n = vals.length,
    mn = 48,
    mx = 66;
  const x = (i) => l + ((W - l - r) * i) / (n - 1),
    y = (v) => t + (H - t - b) * (1 - (v - mn) / (mx - mn)),
    step = (W - l - r) / (n - 1);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="h-auto w-full" role="img" aria-label="Resting heart rate by week across mission phases. Each phase has its own baseline band; the pre-launch value stays as a dashed line.">`;
  [50, 55, 60, 65].forEach((v) => {
    s += `<line x1="${l}" x2="${W - r}" y1="${y(v)}" y2="${y(v)}" style="stroke:${C.bd};stroke-width:.75"/><text x="${l - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" ${F} style="fill:${C.mut}">${v}</text>`;
  });
  let i0 = 0;
  P.forEach((p, k) => {
    const a = x(i0) - (k ? step / 2 : 0),
      z = x(i0 + p[1].length - 1) + (k < last ? step / 2 : 0);
    s += `<rect x="${a}" y="${y(p[2] + 3)}" width="${z - a}" height="${y(p[2] - 3) - y(p[2] + 3)}" style="fill:${C.line};opacity:${k === last ? 0.16 : 0.08}"/><text x="${a + 6}" y="${t - 14}" font-size="11" ${F} style="fill:${k === last ? C.line : C.mut}">${p[0]}</text><text x="${k ? z - 6 : a + 6}" y="${y(p[2] + 3) - 5}" text-anchor="${k ? 'end' : 'start'}" font-size="10" ${F} style="fill:${C.mut}">BASELINE ${p[2]}</text>`;
    if (k)
      s += `<line x1="${a}" x2="${a}" y1="${t - 26}" y2="${H - b}" style="stroke:${C.bd};stroke-width:1"/><rect x="${a}" y="${t}" width="${step * 2}" height="${H - t - b}" style="fill:hsl(var(--warn));opacity:.10"/><text x="${a + 4}" y="${H - b - 6}" font-size="10" ${F} style="fill:hsl(var(--warn))">ADAPTING</text>`;
    i0 += p[1].length;
  });
  s += `<line x1="${l}" x2="${W - r}" y1="${y(54)}" y2="${y(54)}" style="stroke:${C.fg};stroke-width:1;stroke-dasharray:4 4;opacity:.6"/><text x="${W - r + 8}" y="${y(54) + 4}" font-size="11" ${F} style="fill:${C.fg}">PRE-LAUNCH 54</text><text x="${W - r + 8}" y="${y(54) + 18}" font-size="10" ${F} style="fill:${C.mut}">NEVER MOVES</text>`;
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  s += `<path d="${d}" style="fill:none;stroke:${C.line};stroke-width:5;opacity:.18"/><path d="${d}" style="fill:none;stroke:${C.line};stroke-width:1.75;stroke-linejoin:round"/>`;
  s += `<rect x="${x(n - 1) - 5}" y="${y(vals[n - 1]) - 5}" width="10" height="10" style="fill:${C.line};stroke:${C.bg};stroke-width:2"/><text x="${W - r + 8}" y="${y(vals[n - 1]) + 4}" font-size="12" font-weight="600" ${F} style="fill:${C.line}">NOW ${vals[n - 1]} BPM</text>`;
  i0 = 0;
  P.forEach((p, k) => {
    p[1].forEach((v, j) => {
      const i = i0 + j;
      s += `<rect x="${x(i) - step / 2}" y="${t}" width="${step}" height="${H - t - b}" fill="transparent" data-tip="${k ? p[3] + (j + 1) : p[3] + (8 - j) + ' weeks'}: ${v} bpm · phase baseline ${p[2]}"/>`;
    });
    i0 += p[1].length;
  });
  return (
    s +
    `<text x="${W - r}" y="${H - 8}" text-anchor="end" font-size="11" ${F} style="fill:${C.mut}">WEEKLY AVERAGE · RESTING HEART RATE, BPM</text></svg>`
  );
}
function baseTable() {
  const z = ctx().zero,
    c = ctx();
  return `<div class="overflow-x-auto"><table class="w-full min-w-[620px] text-sm"><thead><tr class="border-b border-border text-left"><th class="lbl py-2 pr-3">Signal</th><th class="lbl py-2 pr-3">Pre-launch · 1 g</th><th class="lbl py-2 pr-3 ${z ? 'text-primary' : ''}">In 0 g${z ? ' · now' : ''}</th>${z ? '' : `<th class="lbl py-2 pr-3 text-primary">On a surface · ${c.g} · now</th>`}<th class="lbl py-2">Now vs. pre-launch</th></tr></thead><tbody>${baseRows()
    .map(
      (b) =>
        `<tr class="border-b border-border last:border-0"><td class="py-2.5 pr-3 font-medium">${b.n}</td><td class="num py-2.5 pr-3 text-muted-foreground">${b.pre}</td><td class="num py-2.5 pr-3 ${z ? 'font-semibold text-primary' : 'text-muted-foreground'}">${b.tr}</td>${z ? '' : `<td class="num py-2.5 pr-3 font-semibold text-primary">${b.su}</td>`}<td class="py-2.5 text-muted-foreground">${z ? b.diffZ : b.diff}</td></tr>`,
    )
    .join('')}</tbody></table></div>`;
}
function vBaseline() {
  const c = ctx(),
    z = c.zero,
    g = c.g;
  if (S.base === 'review') {
    return `${back('My baselines', 'base', 'data-v="view"')}${pageTitle('Baseline review · day 14', c.id === 'station' ? 'Due today' : 'Demo replay of a past review')}<p class="-mt-3 mb-5 max-w-3xl text-sm text-muted-foreground">You have been in ${g} for 14 days. Your body has settled in, so comparing you with your earlier numbers would raise false alarms. Here is what changed. Nothing becomes your new normal until you confirm it.</p>
      <div class="grid gap-5 lg:grid-cols-12"><div class="min-w-0 lg:col-span-8">${panel(
        'Proposed baseline',
        `<p class="mb-2 text-sm text-muted-foreground">Proposed from days 8–14, after the first week of adapting.</p><ul class="divide-y divide-border">${baseRows()
          .map(
            (b) =>
              `<li class="grid gap-x-4 gap-y-1 py-3 sm:grid-cols-12"><p class="text-sm font-semibold sm:col-span-4">${b.n}</p><p class="num text-sm sm:col-span-4"><span class="text-muted-foreground">${z ? b.pre : b.tr}</span> <span class="text-muted-foreground">→</span> <span class="font-semibold text-primary">${nowCol(b)}</span></p><div class="sm:col-span-4 sm:text-right">${b.flag && !z ? pill('Needs CMO review', 'alert', 'watch') : pill('Expected', 'check', 'ok')}</div><p class="text-xs text-muted-foreground sm:col-span-12">Before launch ${b.pre}. Now ${z ? b.diffZ : b.diff} than before launch. ${b.chk}.${b.flag && !z ? " I can't tell adapting from a real balance problem here, so this one goes to CMO Okafor together with your pre-launch value." : ''}</p></li>`,
          )
          .join('')}</ul>
        <div class="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">${btn('Confirm new baseline', 'baseconfirm', 'primary')}${btn('Not yet: keep adapting 7 more days', 'basewait', 'outline')}</div><p class="mt-2 text-xs text-muted-foreground">Confirming applies the expected values now.${z ? '' : ' Balance applies once the CMO has reviewed it.'}</p>`,
      )}</div>
      <div class="min-w-0 lg:col-span-4">${panel(
        'What does not change',
        `<p class="text-sm text-muted-foreground">Slow changes stay measured against your pre-launch values, so a re-set can never hide a loss.</p><ul class="mt-3 space-y-2 text-sm">${fixedRows()
          .map(
            (f) =>
              `<li class="flex justify-between gap-3"><span>${f[0]}</span><span class="text-right text-muted-foreground">Fixed reference</span></li>`,
          )
          .join('')}</ul>`,
      )}</div></div>`;
  }
  const rules = [
    [
      'Adapting, not abnormal',
      'For the first 14 days of a new phase, changes are labelled "Adapting". Emergency warning signs still fire.',
    ],
    [
      'I propose, you confirm',
      'On day 14 I propose a new baseline from the last 7 days. It applies only when you confirm it.',
    ],
    [
      'A bad week cannot become normal',
      'Values outside the expected adaptation range go to the CMO instead. Days that were off baseline are left out of the next proposal.',
    ],
    [
      'Slow changes are never re-set',
      'Bone, strength, eyes and radiation dose keep the pre-launch reference for the whole mission.',
    ],
  ];
  return `${back('My account', 'base', 'data-v=""')}${pageTitle('My baselines', 'What "compared with usual" means')}<p class="-mt-3 mb-5 max-w-3xl text-sm text-muted-foreground">Your body adapts to each gravity, so "usual" changes during the mission. ASTRAVIA keeps two references: a phase baseline that is re-set when the gravity changes, and your pre-launch values, which never move.</p>
    <div class="grid gap-5 lg:grid-cols-12">
    ${panel('One signal, ' + (z ? 'two' : 'three') + ' baselines', `<div class="overflow-x-auto"><div style="min-width:720px">${phaseChart()}</div></div><p class="mt-2 text-xs text-muted-foreground">The band is the baseline for that phase. In the amber weeks you were still adapting, so readings were not flagged against the old baseline. ${anyData() ? sigText('cardio') + '.' : "Record a heart rate to see today's reading against it."}</p>`, { cls: 'lg:col-span-12' })}
    <div class="grid min-w-0 content-start gap-5 lg:col-span-8">
      ${panel('Day-to-day signals · re-set each phase', `${baseTable()}<p class="mt-3 text-xs text-muted-foreground">Every "compared with your baseline" on other screens uses the "now" column.</p>`)}
      ${panel(
        'Slow changes · never re-set',
        `<ul class="divide-y divide-border">${fixedRows()
          .map(
            (f) =>
              `<li class="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm"><span class="font-medium">${f[0]}</span><span class="text-right text-muted-foreground">${f[1]}</span></li>`,
          )
          .join(
            '',
          )}</ul><div class="mt-3">${btn('Open long-term trends' + ic('right', 'h-3.5 w-3.5'), 'htab', 'ghost', 'data-v="long"')}</div>`,
      )}
    </div>
    <div class="grid min-w-0 content-start gap-5 lg:col-span-4">
      ${panel('Re-set history', `<ol class="space-y-3 text-sm"><li><p class="font-semibold">Pre-launch</p><p class="text-muted-foreground">Set over the 8 weeks before launch.</p></li><li><p class="font-semibold">Weightless phase · day 14</p><p class="text-muted-foreground">${c.id === 'station' ? 'Due today. Replay it below.' : 'Confirmed by you.'}</p></li>${z ? '' : `<li><p class="font-semibold text-primary">Surface phase · day 14</p><p class="text-muted-foreground">Confirmed by you. Balance reviewed by CMO Okafor the next day.</p></li>`}<li><p class="font-semibold">${z ? 'Next gravity change' : 'Return transit'}</p><p class="text-muted-foreground">${z ? 'Review 14 days after you reach gravity.' : 'Next review 14 days after ascent.'}</p></li></ol><div class="mt-4 border-t border-border pt-4">${S.base === 'done' ? pill('Replay finished', 'check', 'ok') : btn('Demo: replay the day 14 review', 'base', 'primary', 'data-v="review"')}</div>`)}
      ${panel('The rules', `<ol class="space-y-3">${rules.map((x, i) => `<li class="flex gap-3"><span class="num grid h-6 w-6 shrink-0 place-items-center border border-border text-xs text-muted-foreground">${i + 1}</span><div class="min-w-0"><p class="text-sm font-semibold">${x[0]}</p><p class="text-sm text-muted-foreground">${x[1]}</p></div></li>`).join('')}</ol><p class="mt-3 text-xs text-muted-foreground">These rules, the 14-day window and the expected ranges are product assumptions. They need medical review before real use.</p>`)}
    </div></div>`;
}
