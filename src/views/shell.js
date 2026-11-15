// Page chrome: sidebar, top bar with time strip, environment selector and Earth link.
import { btn, ic } from '../components/primitives.js';
import { SIM_ID, ctx, dayLab, timeInfo } from '../data/env.js';
import { $, hm, pad3 } from '../lib/util.js';
import { S } from '../state.js';
import { AVATAR } from './onboarding.js';

/* ---------- chrome ---------- */
const NAV = [
  ['home', 'Today', 'home'],
  ['health', 'My health', 'body'],
  ['care', 'Guided care', 'care'],
  ['mission', 'Mission readiness', 'flag'],
  ['habitat', 'Environment', 'habitat'],
  ['profile', 'My account', 'user'],
];
const ENV_BTNS = [
  ['station', 'Space station'],
  ['vehicle', 'Deep-space vehicle'],
  ['base', 'Moon or Mars base'],
  ['rover', 'Rover outing'],
];
export function chrome() {
  const c = ctx(),
    cur = S.view === 'entry' ? S.measBack : S.view;
  $('#side').innerHTML =
    `<div class="panel"><div class="px-4 pb-3 pt-4"><div class="glow text-lg font-bold tracking-[.2em]">ASTRAVIA</div><div class="lbl mt-1" data-hl="side">${c.name} · ${dayLab()} · ${c.g}</div>
    <div class="mt-3 flex items-center gap-3 border-t border-border pt-3">${AVATAR.replace('h-24 w-24', 'h-11 w-11 shrink-0').replace(/avg/g, 'avgs')}<div class="min-w-0"><p class="truncate text-sm font-semibold">Mei Lin</p><p class="lbl truncate">Mission specialist</p><p class="num text-[11px] text-muted-foreground">${SIM_ID}</p></div></div></div>
    <div class="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col">${NAV.map(([v, l, i]) => `<button type="button" data-act="go" data-v="${v}" ${cur === v ? 'aria-current="page"' : ''} class="flex shrink-0 items-center gap-2 border-l-2 px-3 py-2 text-left text-[13px] uppercase tracking-[.08em] ${cur === v ? 'border-primary bg-muted text-primary' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}">${ic(i)}${l}</button>`).join('')}</div></div>`;
  const T = timeInfo();
  const sel = (name, val, opts, label) =>
    `<label class="inline-flex items-center gap-2"><span class="lbl">${label}</span><select data-sel="${name}" aria-label="${label}" style="color-scheme:dark" class="min-h-[36px] border border-border bg-card px-3 text-[12px] uppercase tracking-[.1em] text-foreground">${opts.map(([k, l]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
  $('#top').innerHTML = `<div class="panel"><div class="flex items-start justify-between gap-4 px-4 py-2.5">
    <div class="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2"><div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px]">${[
      ['UTC', T.utc.replace(' UTC', ''), 'glow'],
      ['Mission Day', pad3(c.md)],
      ['MET', T.met.replace('MET ', '')],
      ...(T.sol
        ? [
            ['Sol', pad3(c.n)],
            ['LMST', hm(S.clock)],
          ]
        : []),
      ['Location', T.loc],
      ...(T.eva
        ? [['EVA', T.eva.replace('EVA ', '') + ' · ' + T.evaLoc, 'glow']]
        : T.evaLoc
          ? [['EVA site', T.evaLoc]]
          : []),
    ]
      .map(
        ([k, v, cl]) =>
          `<span class="whitespace-nowrap"><span class="lbl mr-1.5">${k}</span><span data-hl="top-${k}" class="num ${cl || 'text-foreground'}">${v}</span></span>`,
      )
      .join('')}${linkStrip()}</div>
    <div class="flex flex-wrap items-center gap-2">${sel('env', S.env, ENV_BTNS, 'Environment')}${
      S.env === 'base' || S.env === 'rover'
        ? sel(
            'body',
            S.body,
            [
              ['mars', 'Mars'],
              ['moon', 'Moon'],
            ],
            'World',
          )
        : ''
    }</div></div>
    <div class="shrink-0">${btn(ic('care') + 'I feel unwell', 'unwell', 'unwell')}</div></div></div>`;
}
export const linkInfo = () => {
  const c = ctx(),
    moon = S.body === 'moon';
  if (c.id === 'station')
    return {
      st: 'Live · no delay',
      det: 'Near real time. Mission control answers live, so most questions can wait for a call.',
      col: 'var(--ok)',
      lt: '1.4s',
    };
  if (c.id === 'vehicle') return { st: 'Delay up to 20 min', det: c.link, col: 'var(--warn)', lt: '5s' };
  return moon
    ? { st: 'Delay about 1.3 s', det: c.link, col: 'var(--ok)', lt: '2.2s' }
    : { st: 'Delay up to 20 min', det: c.link, col: 'var(--warn)', lt: '5s' };
};
function linkStrip() {
  const L = linkInfo();
  return `<span class="inline-flex items-center gap-2 whitespace-nowrap" data-tip="${L.det}"><span class="lbl">Earth link</span><span class="link" style="color:hsl(${L.col});--lt:${L.lt}" aria-hidden="true"><i></i><b></b><i></i></span><span data-hl="top-link" class="num" style="color:hsl(${L.col})">${L.st}</span></span>`;
}
