// Small shared helpers: DOM lookup, time and number formatting, list joining.

export const $ = (s) => document.querySelector(s);
export const hm = (m) => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
export const pad3 = (n) => String(n).padStart(3, '0');
export const r1 = (v) => Math.round(v * 10) / 10;
/* ---------- guided care: six symptom flows, one five-step engine ---------- */
export const has = (arr, v) => Array.isArray(arr) && arr.includes(v);
export const capF = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
export const listF = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
export const fmtT = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
// ---------- motion ----------
export const reduceMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
