// Reusable UI building blocks: icons, pills, buttons, panels, headings, tiles and the info tooltip icon.
import { has } from '../lib/util.js';
import { S } from '../state.js';

/* ---------- components (scificn recipes) ---------- */
const ICON = {
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-5M12 8h.01',
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  care: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  flag: 'M4 22V4h13l-2 4 2 4H4',
  user: 'M20 21a8 8 0 0 0-16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  check: 'M5 12l5 5L20 7',
  alert: 'M12 3 2 21h20L12 3zM12 10v5M12 18v.01',
  minus: 'M5 12h14',
  right: 'M9 6l6 6-6 6',
  left: 'M19 12H5M11 6l-6 6 6 6',
  down: 'M6 9l6 6 6-6',
  shrink: 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  signal: 'M5 13a7 7 0 0 1 14 0M8.5 13a3.5 3.5 0 0 1 7 0M12 13v7',
  x: 'M6 6l12 12M18 6 6 18',
  habitat: 'M3 20h18M5 20v-7a7 7 0 0 1 14 0v7M10 20v-5h4v5',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  body: 'M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM7 22v-8L5 9h14l-2 5v8M10 14v8M14 14v8',
};
export const ic = (n, c = 'h-4 w-4') =>
  `<svg class="${c} shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
export const ST = {
  ok: ['Normal', 'check'],
  watch: ['Watch', 'alert'],
  alert: ['Abnormal', 'alert'],
  nodata: ['No recent data', 'minus'],
  info: ['Expected', 'activity'],
};
const RD = {
  ready: ['Go', 'check', 'ok'],
  modify: ['Modify', 'alert', 'watch'],
  reassess: ['Reassess', 'alert', 'alert'],
  prepare: ['Prepare', 'clock', 'info'],
  done: ['Done', 'check', 'nodata'],
};
export const pill = (label, icon, tone) => `<span class="badge b-${tone}">${ic(icon, 'h-3 w-3')}${label}</span>`;
export const stPill = (s) => pill(ST[s][0], ST[s][1], s);
export const rdPill = (s) => pill(RD[s][0], RD[s][1], RD[s][2]);
function panelHead(title, right = '') {
  const m = /^(<span class="info-i"[^>]*>.*?<\/span>)/s.exec(right);
  return `<div class="flex min-w-0 items-center gap-2"><h2 class="lbl">${title}</h2>${m ? m[1] : ''}</div>${m ? right.slice(m[1].length) : right}`;
}
export const panel = (title, inner, o = {}) =>
  `<section class="panel ${o.edge ? 'edge-' + o.edge : ''} ${o.cls || ''}" ${o.attr || ''}>${title ? `<header class="panel-h">${panelHead(title, o.right)}</header>` : ''}<div class="panel-b">${inner}</div></section>`;
export const head = (t, sub = '') =>
  `<div class="mb-3"><h3 class="text-base font-semibold">${t}</h3>${sub ? `<p class="text-sm text-muted-foreground">${sub}</p>` : ''}</div>`;
const BTN = {
  primary: 'btn-exec',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-abort',
  unwell: 'btn-unwell',
};
export const btn = (label, act, v = 'primary', data = '', dis = false) =>
  `<button type="button" data-act="${act}" ${data} ${dis ? 'disabled' : ''} class="btn ${BTN[v]}">${label}</button>`;
export const back = (label, act, data = '') =>
  `<button type="button" data-act="${act}" ${data} class="mb-3 inline-flex items-center gap-1 text-xs uppercase tracking-[.14em] text-muted-foreground hover:text-primary">${ic('left', 'h-3.5 w-3.5')}${label}</button>`;
export function infoI(t) {
  return `<span class="info-i" tabindex="0" role="img" aria-label="${t}" data-tip="${t}">${ic('info', 'h-3.5 w-3.5')}</span>`;
}
export const REAL = infoI('Real NASA open data');
export const pageTitle = (t) => `<div class="mb-5"><h1 class="cursor text-2xl font-bold">${t}</h1></div>`;
export const sigPill = (s) => (s.pill ? pill(s.pill[0], s.pill[1], s.pill[2]) : stPill(s.st));
export const REAL_S = infoI('NASA open data');
export const tile = (label, value, sub, tag = '') =>
  `<div class="min-w-0 border border-border bg-muted p-3"><div class="flex flex-wrap items-center gap-2"><span class="lbl">${label}</span>${tag}</div><div class="num mt-1 text-lg font-semibold text-foreground">${value}</div>${sub ? `<p class="text-xs text-muted-foreground">${sub}</p>` : ''}</div>`;
export const chips = (key, opts, multi) =>
  `<div class="flex flex-wrap gap-2">${opts
    .map((o) => {
      const a = S.care.ans,
        on = multi ? has(a[key], o) : a[key] === o;
      return `<button type="button" data-act="chip" data-k="${key}" data-v="${o}" data-m="${multi ? 1 : ''}" aria-pressed="${on}" class="min-h-[40px] border px-3 text-sm ${on ? 'border-primary bg-ok-soft text-primary' : 'border-border bg-card hover:border-primary/60'}">${on ? '■ ' : '□ '}${o}</button>`;
    })
    .join('')}</div>`;
