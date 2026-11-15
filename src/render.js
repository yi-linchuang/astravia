// Render pipeline: view transitions, changed-value highlight, staggered reveals.
import { bodyZoom } from './components/bodyFigure.js';
import { modalLayer } from './components/modals.js';
import { ic } from './components/primitives.js';
import { $, reduceMotion } from './lib/util.js';
import { S } from './state.js';
import { pvtInit } from './views/entry.js';
import { VIEWS } from './views/index.js';
import { vGate } from './views/onboarding.js';
import { chrome } from './views/shell.js';

let FADE = false,
  lastVK = null,
  lastSK,
  toastT = null;
const viewKey = () =>
  [
    S.authed,
    !!S.boot,
    S.view,
    S.onb && S.onb.step,
    S.signal,
    S.task,
    S.htab,
    S.base,
    S.rec && S.rec.ind,
    !!(S.rec && S.rec.res),
    S.care.stage,
    S.care.flow,
  ].join('|');
const staggerKey = () =>
  !S.authed || S.view === 'onboard'
    ? 'gate:' + (S.onb ? S.onb.step + (S.onb.pvt ? '+' : '') : 'login')
    : S.view === 'entry' && S.rec && S.rec.res
      ? 'res:' + S.rec.ind
      : null;
const HL_SEL = '#app [data-hl], #top [data-hl], #side [data-hl]';
function snapshot() {
  const m = {};
  document.querySelectorAll(HL_SEL).forEach((el) => {
    m[el.dataset.hl] = el.textContent.trim();
  });
  return m;
}
function diff(prev) {
  if (reduceMotion()) return;
  document.querySelectorAll(HL_SEL).forEach((el) => {
    const k = el.dataset.hl;
    if (k in prev && prev[k] !== el.textContent.trim()) el.classList.add('chg');
  });
}
function readSeg() {
  const o = {};
  document.querySelectorAll('#top [data-seg]').forEach((g) => {
    const on = g.querySelector('[aria-pressed="true"]');
    if (on) {
      const gr = g.getBoundingClientRect(),
        r = on.getBoundingClientRect();
      o[g.dataset.seg] = { l: r.left - gr.left, w: r.width, v: on.dataset.v };
    }
  });
  return o;
}
function animateSeg(old) {
  if (reduceMotion()) return;
  document.querySelectorAll('#top [data-seg]').forEach((g) => {
    const was = old[g.dataset.seg],
      on = g.querySelector('[aria-pressed="true"]');
    if (!was || !on || was.v === on.dataset.v) return;
    const gr = g.getBoundingClientRect(),
      r = on.getBoundingClientRect(),
      l = r.left - gr.left,
      ghost = document.createElement('div');
    ghost.className = 'seg-ghost';
    Object.assign(ghost.style, {
      left: l + 'px',
      top: r.top - gr.top + 'px',
      width: r.width + 'px',
      height: r.height + 'px',
    });
    g.appendChild(ghost);
    on.classList.add('seg-wait');
    const a = ghost.animate(
      [{ transform: `translateX(${was.l - l}px) scaleX(${was.w / r.width})` }, { transform: 'none' }],
      { duration: 200, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' },
    );
    a.onfinish = a.oncancel = () => {
      ghost.remove();
      on.classList.remove('seg-wait');
    };
  });
}
function post() {
  const app = $('#app');
  if (app.classList.contains('stagger'))
    [...app.querySelectorAll('.panel')].forEach((p, i) => p.style.setProperty('--i', Math.min(i, 5)));
  if (app.classList.contains('reveal-rows'))
    [...app.querySelectorAll('.scan li')].forEach((li, i) => li.style.setProperty('--j', Math.min(i, 5)));
  if (!reduceMotion()) {
    app.querySelectorAll('[data-slide]').forEach((el) => {
      const d = ((el.dataset.from - el.dataset.to) / 100) * el.parentElement.offsetWidth;
      el.animate([{ transform: `translateX(${d}px)` }, { transform: 'none' }], {
        duration: 400,
        delay: 150,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
        fill: 'backwards',
      });
    });
    app.querySelectorAll('[data-countup]').forEach((el) => {
      const to = +el.dataset.countup,
        t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 500);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  }
  if (S.celebrate) {
    S.celebrate = false;
    const c = app.querySelector('[data-celebrate]');
    if (c && !reduceMotion()) c.classList.add('celebrate');
  }
  const t = app.querySelector('.toast');
  if (t) {
    clearTimeout(toastT);
    toastT = setTimeout(() => {
      t.classList.add('leaving');
      setTimeout(() => t.remove(), 170);
    }, 4500);
  }
}
export function render(scroll) {
  const mEl = document.querySelector('.modal'),
    mTop = mEl ? mEl.scrollTop : 0,
    hadFocus = !!(mEl && mEl.contains(document.activeElement));
  const vk = viewKey(),
    changed = vk !== lastVK,
    sk = staggerKey(),
    stag = sk !== null && sk !== lastSK;
  const prev = snapshot(),
    seg = readSeg(),
    vt = !!document.startViewTransition && !reduceMotion();
  lastVK = vk;
  lastSK = sk;
  FADE = changed && !vt;
  const run = () => {
    paint(scroll);
    const a = $('#app');
    a.classList.toggle('vc', changed);
    a.classList.toggle('stagger', stag);
    const fh = !!S.firstHome && S.view === 'home' && S.authed;
    a.classList.toggle('reveal-rows', fh);
    if (fh) S.firstHome = false;
    if (!changed) diff(prev);
    animateSeg(seg);
    post();
    const m2 = document.querySelector('.modal');
    if (m2) {
      m2.scrollTop = mTop;
      if (hadFocus || !changed) m2.focus({ preventScroll: true });
    }
    const lock = !!m2;
    document.documentElement.classList.toggle('modal-open', lock);
    document.body.classList.toggle('modal-open', lock);
  };
  if (changed && vt) {
    // A newer transition may skip this one; the AbortError that follows is expected, so swallow it.
    const t = document.startViewTransition(run);
    for (const k of ['ready', 'finished', 'updateCallbackDone']) t[k].catch(() => {});
  } else run();
}
function paint(scroll) {
  const gate = !S.authed || S.view === 'onboard' || !!S.boot;
  $('#side').hidden = gate;
  $('#top').hidden = gate;
  if (!gate) chrome();
  const toast = S.toast
    ? `<div role="status" class="toast mb-4 flex items-center gap-2 border border-ok bg-ok-soft px-4 py-3 text-sm text-ok">${ic('check')}${S.toast}</div>`
    : '';
  $('#app').innerHTML =
    `<div class="${FADE ? 'fade' : ''}">${toast}${gate ? vGate() : VIEWS[S.view]()}</div>${!gate || S.modal === 'about' || S.modal === 'how' ? modalLayer() : ''}`;
  S.toast = '';
  if (
    (S.view === 'entry' && S.rec && S.rec.ind === 'cog' && !S.rec.res) ||
    (gate && S.onb && S.onb.step === 'pvt' && !S.onb.pvt)
  )
    pvtInit();
  if (S.view === 'health' && S.htab === 'body' && !S.signal) bodyZoom();
  if (scroll) window.scrollTo({ top: 0 });
  try {
    if (!gate && S.view !== 'entry' && location.hash.slice(1) !== S.view) history.replaceState(null, '', '#' + S.view);
  } catch {}
}
