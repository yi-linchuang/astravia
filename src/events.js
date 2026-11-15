// Document-level event delegation.
import { A } from './actions.js';
import { $ } from './lib/util.js';
import { render } from './render.js';
import { S } from './state.js';

document.addEventListener('change', (e) => {
  const el = e.target.closest && e.target.closest('[data-sel]');
  if (!el) return;
  A[el.dataset.sel]({ v: el.value });
  render(false);
});
document.addEventListener('focusin', (e) => {
  const t = e.target.closest && e.target.closest('.info-i');
  if (!t) return;
  const tp = $('#tip'),
    r = t.getBoundingClientRect();
  tp.textContent = t.dataset.tip;
  tp.hidden = false;
  tp.style.left = Math.max(8, r.left) + 'px';
  tp.style.top = r.bottom + 6 + 'px';
});
document.addEventListener('focusout', (e) => {
  if (e.target.closest && e.target.closest('.info-i')) $('#tip').hidden = true;
});
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  if (el.matches('[role="button"], [role="link"]') && e.target.closest('.info-i')) return;
  const r = A[el.dataset.act](el.dataset);
  if (r === false) return;
  render(r !== 'keep');
});
document.addEventListener('input', (e) => {
  const k = e.target.dataset && e.target.dataset.bind;
  if (k) S[k] = e.target.value;
  const ef = e.target.dataset && e.target.dataset.ef;
  if (ef && S.rec) S.rec.vals[ef] = e.target.value;
});
document.addEventListener('keydown', (e) => {
  const card = e.target.matches && e.target.matches('[role="button"][data-act], [role="link"][data-act]');
  if (card && (e.key === 'Enter' || (e.key === ' ' && e.target.getAttribute('role') === 'button'))) {
    e.preventDefault();
    e.target.click();
    return;
  }
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.ef) {
    A.entrysave();
    render(false);
  }
});
document.addEventListener('change', (e) => {
  if (!e.target.matches) return;
  const rec = e.target.matches('[data-recphoto]');
  if (!rec && !e.target.matches('[data-photo]')) return;
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    if (rec) S.rec.vals.img = rd.result;
    else S.care.photo = rd.result;
    render(false);
  };
  rd.readAsDataURL(file);
});
export const tip = $('#tip');
document.addEventListener('pointermove', (e) => {
  const t = e.target.closest && e.target.closest('[data-tip]');
  if (!t) {
    tip.hidden = true;
    return;
  }
  tip.textContent = t.dataset.tip;
  tip.hidden = false;
  const w = tip.offsetWidth;
  tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, e.clientX - w / 2)) + 'px';
  tip.style.top = e.clientY - 36 + 'px';
});
document.addEventListener('pointerleave', () => {
  tip.hidden = true;
});
