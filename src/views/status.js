// Today: the Status panel (body map + systems list) with a collapsible one-line summary.
import { thumb } from '../components/bodyFigure.js';
import { ic, panel, stPill } from '../components/primitives.js';
import { REG, regSt } from '../data/measures.js';
import { anyData } from '../data/records.js';
import { S } from '../state.js';

const SHORT = { rad: 'Radiation' };
const regName = (k) => SHORT[k] || REG[k].name;
const SEV = { alert: 2, watch: 1 };
const MAX_LISTED = 3;

/* Regions that differ from the baseline, most severe first (ties keep body-map order). */
function flagged() {
  return Object.keys(REG)
    .map((k, i) => ({ k, i, st: regSt(k) }))
    .filter((r) => SEV[r.st])
    .sort((a, b) => SEV[b.st] - SEV[a.st] || a.i - b.i);
}
const stripNote = (v) => v.replace(/\s*\([^)]*\)\s*$/, '');
function cause(k, st) {
  const items = REG[k].items().filter((i) => !i.quiet && i.st === st);
  const it = items[0];
  if (!it) return '';
  const text = k === 'rad' ? stripNote(it.val) : `${it.name}: ${it.val}`;
  return `${regName(k)}: ${k === 'rad' ? text : it.val}`.replace(/\.$/, '') + '.';
}
const expected = () =>
  Object.keys(REG)
    .flatMap((k) => REG[k].items().filter((i) => !i.quiet && i.st === 'info'))
    .map((i) => i.name);

/* Collapsed content: one of four states. */
export function statusSummary() {
  if (!anyData()) return '<p class="text-sm">No readings yet. Expand to record the first one.</p>';
  const f = flagged();
  if (f.length) {
    const tone = f[0].st === 'alert' ? 'text-alert' : 'text-warn';
    const names = f.slice(0, MAX_LISTED).map((r) => regName(r.k));
    const more = f.length - names.length;
    const list =
      more > 0
        ? `${names.join(', ')} and ${more} more`
        : names.length > 1
          ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
          : names[0];
    const n = f.length;
    return `<p class="text-sm ${tone}">${n} signal${n === 1 ? '' : 's'} ${n === 1 ? 'differs' : 'differ'} from your baseline in ${list}.</p><p class="mt-1 text-sm text-muted-foreground">${cause(f[0].k, f[0].st)}</p>`;
  }
  const exp = expected();
  return `<p class="text-sm">Everything is within your baseline.</p>${exp.length ? `<p class="mt-1 text-sm text-muted-foreground">Expected change only: ${exp.join(', ')}.</p>` : ''}`;
}

function systems() {
  const keys = Object.keys(REG).filter((k) => k !== 'rad');
  const fig = `<button type="button" data-act="bodyto" data-v="" aria-label="Open the body map" class="block w-full max-w-[150px] shrink-0 border border-border bg-background p-2 hover:border-primary">${thumb(keys, true)}</button>`;
  const list = Object.keys(REG)
    .map(
      (k) =>
        `<li class="border-b border-border"><button type="button" data-act="bodyto" data-v="${k}" class="row-btn"><span class="min-w-0 flex-1"><span class="block text-sm font-medium">${REG[k].name}</span><span class="block text-sm text-muted-foreground">${REG[k].items()[0].val}</span></span>${stPill(regSt(k))}</button></li>`,
    )
    .join('');
  return `<div class="flex flex-wrap items-start gap-4 sm:flex-nowrap">${fig}<ul class="grid min-w-0 flex-1 gap-x-6 sm:grid-cols-2">${list}</ul></div>`;
}

export function statusPanel() {
  const open = !S.statusCollapsed;
  const toggle = `<button type="button" data-act="statustoggle" aria-expanded="${open}" aria-controls="status-body" aria-label="${open ? 'Collapse' : 'Expand'} Status" class="status-toggle">${ic('down', 'h-4 w-4')}</button>`;
  return panel('Status', `<div id="status-body">${open ? systems() : statusSummary()}</div>`, {
    cls: `scan ${open ? '' : 'is-collapsed'}`,
    right: toggle,
  });
}
