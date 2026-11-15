// SVG charts (line chart, sparkline) and axis tick helpers.

/* ---------- charts ---------- */
export const C = {
  line: 'hsl(var(--chart))',
  mut: 'hsl(var(--muted-foreground))',
  bd: 'hsl(var(--border))',
  bg: 'hsl(var(--card))',
  fg: 'hsl(var(--foreground))',
};
const STC = {
  ok: 'hsl(var(--ok))',
  watch: 'hsl(var(--warn))',
  alert: 'hsl(var(--alert))',
  nodata: 'hsl(var(--muted-foreground))',
};
export function spark(vals, lo, hi, st) {
  const W = 120,
    H = 36,
    p = 5,
    mn = Math.min(...vals, lo),
    mx = Math.max(...vals, hi),
    n = vals.length;
  const x = (i) => p + ((W - 2 * p) * i) / (n - 1),
    y = (v) => p + (H - 2 * p) * (1 - (v - mn) / (mx - mn || 1));
  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" class="h-9 w-[120px] shrink-0" aria-hidden="true">
    <rect x="0" y="${y(hi)}" width="${W}" height="${Math.max(2, y(lo) - y(hi))}" style="fill:${C.line};opacity:.12"/>
    <polyline points="${pts}" style="fill:none;stroke:${C.mut};stroke-width:1.5;stroke-linejoin:round"/>
    <rect x="${x(n - 1) - 4}" y="${y(vals[n - 1]) - 4}" width="8" height="8" style="fill:${STC[st]};stroke:${C.bg};stroke-width:2"/></svg>`;
}
export function lineChart(o) {
  const W = o.W || 560,
    H = o.H || 220,
    l = 44,
    r = o.lines ? 104 : 20,
    t = 22,
    b = 48,
    n = o.vals.length,
    mn = o.ticks[0],
    mx = o.ticks[o.ticks.length - 1];
  const x = (i) => l + ((W - l - r) * i) / (n - 1),
    y = (v) => t + (H - t - b) * (1 - (v - mn) / (mx - mn));
  const end = o.fc == null ? n - 1 : o.fc,
    seg = (a, z) =>
      o.vals
        .slice(a, z + 1)
        .map((v, i) => `${i ? 'L' : 'M'}${x(a + i).toFixed(1)} ${y(v).toFixed(1)}`)
        .join(' ');
  const F = `font-family="IBM Plex Mono, monospace"`;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="h-auto w-full" role="img" aria-label="${o.label}">`;
  o.ticks.forEach((v) => {
    s += `<line x1="${l}" x2="${W - r}" y1="${y(v)}" y2="${y(v)}" style="stroke:${C.bd};stroke-width:.75"/><text x="${l - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" ${F} class="num" style="fill:${C.mut}">${v}</text>`;
  });
  if (o.lo != null)
    s += `<rect x="${l}" y="${y(o.hi)}" width="${W - l - r}" height="${y(o.lo) - y(o.hi)}" style="fill:${C.line};opacity:.10"/><text x="${l + 6}" y="${y(o.hi) + 13}" font-size="11" ${F} style="fill:${C.mut}">${o.bandLabel || 'YOUR BASELINE'}</text>`;
  (o.lines || []).forEach((L) => {
    s += `<line x1="${l}" x2="${W - r}" y1="${y(L.v)}" y2="${y(L.v)}" style="stroke:${C.fg};stroke-width:1;stroke-dasharray:4 4;opacity:.6"/><text x="${W - r + 8}" y="${y(L.v) + 4}" font-size="11" ${F} style="fill:${C.fg}">${L.t}</text>${L.t2 ? `<text x="${W - r + 8}" y="${y(L.v) + 18}" font-size="10" ${F} style="fill:${C.mut}">${L.t2}</text>` : ''}`;
  });
  if (o.area)
    s += `<path d="${seg(0, end)} L${x(end)} ${y(mn)} L${x(0)} ${y(mn)} Z" style="fill:${C.line};opacity:.10"/>`;
  s += `<path ${o.draw ? 'class="draw" pathLength="1" ' : ''}d="${seg(0, end)}" style="fill:none;stroke:${C.line};stroke-width:5;opacity:.18"/><path ${o.draw ? 'class="draw" pathLength="1" ' : ''}d="${seg(0, end)}" style="fill:none;stroke:${C.line};stroke-width:1.75;stroke-linejoin:round"/>`;
  if (end < n - 1)
    s += `<path d="${seg(end, n - 1)}" style="fill:none;stroke:${C.line};stroke-width:1.75;stroke-dasharray:3 5"/><text x="${x(n - 1)}" y="${y(o.vals[n - 1]) + 16}" text-anchor="end" font-size="11" ${F} style="fill:${C.mut}">STILL AHEAD</text>`;
  const ex = x(end),
    ey = y(o.vals[end]);
  s += `<rect ${o.draw ? 'class="draw-pt" ' : ''}x="${ex - 5}" y="${ey - 5}" width="10" height="10" style="fill:${C.line};stroke:${C.bg};stroke-width:2"/>`;
  s += `<text x="${end === n - 1 ? ex : ex + 10}" y="${end === n - 1 ? (o.lines ? ey + 20 : ey - 11) : ey - 6}" text-anchor="${end === n - 1 ? 'end' : 'start'}" font-size="12" font-weight="600" ${F} class="num" style="fill:${C.line}">${o.fmt(o.vals[end])}</text>`;
  o.xs.forEach((lab, i) => {
    if (i % (o.every || 1) === 0)
      s += `<text x="${x(i)}" y="${H - 28}" text-anchor="middle" font-size="11" ${F} class="num" style="fill:${C.mut}">${lab}</text>`;
  });
  const cw = (W - l - r) / (n - 1);
  o.vals.forEach((v, i) => {
    s += `<rect x="${x(i) - cw / 2}" y="${t}" width="${cw}" height="${H - t - b}" fill="transparent" data-tip="${o.tip(o.xs[i], v, i)}"/>`;
  });
  return (
    s +
    `<text x="${W - r}" y="${H - 6}" text-anchor="end" font-size="11" ${F} style="fill:${C.mut}">${o.xLabel}</text></svg>`
  );
}
export const negTicks = (a) => {
  const m = Math.abs(Math.min(...a)),
    lo = m < 2 ? -Math.ceil(m * 2) / 2 : -Math.ceil(m / 4) * 4;
  return [lo, (lo * 2) / 3, lo / 3, 0].map((x) => +x.toFixed(1));
};
export const posTicks = (a) => {
  const t = Math.max(10, Math.ceil(Math.max(...a) / 10) * 10);
  return [0, t / 2, t];
};
const niceTop = (v) => [5, 10, 20, 50, 100, 200, 300, 400, 600].find((t) => t >= v * 1.05) || 600;
export const radTicks = (v) => {
  const t = niceTop(v);
  return [0, t / 4, t / 2, (t * 3) / 4, t].map((x) => +x.toFixed(1));
};
