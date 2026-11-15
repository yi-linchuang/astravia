// All click actions (the data-act handlers) and navigation.
import { resetFigure } from './components/bodyFigure.js';
import { endCall, startCall } from './components/modals.js';
import { ctx } from './data/env.js';
import { FLOWS } from './data/flows.js';
import { IND } from './data/indicators.js';
import { addEntry, clearSample, loadSample } from './data/records.js';
import { has, hm } from './lib/util.js';
import { S, newCase, resetState } from './state.js';
import { startBoot, startScan, stopScan } from './views/onboarding.js';

export const go = (v) => {
  S.view = v;
  S.signal = null;
  S.task = null;
  S.base = null;
  S.pickNote = false;
  S.region = null;
  S.showMind = false;
  S.modal = null;
  resetFigure();
};
const startFlow = (k) => {
  const f = FLOWS[k];
  S.care = newCase();
  S.care.flow = k;
  S.care.stage = 'assess';
  S.care.ans = JSON.parse(JSON.stringify(f.defaults));
  go('care');
};
export const A = {
  go: (d) => go(d.v),
  bodyto: (d) => {
    go('health');
    S.htab = 'body';
    S.signal = null;
    S.region = d.v || null;
  },
  takeaction: (d) => {
    S.modal = d.v || 'symptom';
    setTimeout(() => {
      const d = document.querySelector('[role=dialog]');
      if (d) d.focus();
    }, 40);
    return 'keep';
  },
  closemodal: () => {
    S.modal = null;
    return 'keep';
  },
  fsescalate: () => {
    const c = S.care;
    c.status = 'fs';
    go('care');
    c.stage = 'fs';
  },
  call: (d) => {
    startCall(d.v);
    return 'keep';
  },
  endcall: () => {
    endCall();
    return 'keep';
  },
  sendfs: () => {
    S.toast = 'Records sent to the flight surgeon. A reply usually takes ' + ctx().reply + '.';
    return 'keep';
  },
  htab: (d) => {
    go('health');
    S.htab = d.v === 'long' ? 'long' : 'body';
    if (d.v === 'mind') {
      S.region = 'whole';
      S.showMind = true;
    }
  },
  signal: (d) => {
    go('health');
    S.htab = 'body';
    S.signal = d.v || null;
  },
  task: (d) => {
    go('mission');
    S.task = d.v || null;
  },
  region: (d) => {
    S.region = S.region === d.v ? null : d.v;
    return 'keep';
  },
  part: (d) => {
    S.region = S.region === d.v ? null : d.v;
    return 'keep';
  },
  unzoom: () => {
    S.region = null;
    return 'keep';
  },
  regionact: (d) => {
    const [k, v] = d.v.split(':');
    if (k === 'flow') startFlow(v);
    else if (k === 'meas') A.measure({ v });
    else if (k === 'sig') A.signal({ v });
    else if (k === 'task') A.task({ v });
    else if (k === 'go') go(v);
    else if (k === 'long') {
      go('health');
      S.htab = 'long';
    }
  },
  unwell: () => {
    go('care');
    const c = S.care;
    if (c.stage === 'emergency') S.care = newCase();
    else if (c.status === 'cmo') c.stage = 'cmo';
    else if (c.status === 'followup' || c.status === 'resolved' || !c.flow) c.stage = 'pick';
  },
  startflow: (d) => startFlow(d.v),
  stage: (d) => {
    S.care.stage = d.v;
    if (d.v === 'pick' && ['none', 'active'].includes(S.care.status)) S.care = newCase();
  },
  emergency: () => {
    S.care.stage = 'emergency';
    go('care');
    S.care.stage = 'emergency';
  },
  carereset: () => {
    S.care = newCase();
  },
  chip: (d) => {
    const a = S.care.ans;
    if (d.m) a[d.k] = has(a[d.k], d.v) ? a[d.k].filter((x) => x !== d.v) : [...(a[d.k] || []), d.v];
    else a[d.k] = d.v;
    return 'keep';
  },
  assessnext: () => {
    const c = S.care,
      f = FLOWS[c.flow];
    if (f.red(c.ans)) {
      c.stage = 'emergency';
      return;
    }
    c.status = f.direct ? 'cmo' : 'active';
    c.stage = f.direct ? 'cmo' : 'check';
    if (f.blocksEva) S.evaCleared = false;
  },
  careact: (d) => {
    const c = S.care,
      f = FLOWS[c.flow],
      a = f.acts.find((x) => x[0] === d.v);
    if (a[5] && a[5].meas) return A.measure({ v: a[5].meas });
    c.acts[d.v] = true;
    if (c.flow === 'headache' && d.v === 'co2') {
      S.co2Fixed = true;
      S.toast = 'CO₂ reading sent to environmental control.';
    }
    if (c.flow === 'mood' && d.v === 'journal') {
      go('health');
      S.htab = 'body';
      S.region = 'whole';
      S.showMind = true;
      S.toast = "Your journal is below. Come back to Guided care when you're done.";
      return;
    }
    return 'keep';
  },
  setfollow: () => {
    const c = S.care,
      f = FLOWS[c.flow];
    c.status = 'followup';
    c.followAt = S.clock + f.followMin;
    c.stage = 'pick';
    go('home');
    S.toast = `Reminder set. I'll check in at ${hm(c.followAt)}.`;
  },
  ff: (d) => {
    S.clock = Math.max(S.clock, +d.v);
    return 'keep';
  },
  followup: (d) => {
    const c = S.care,
      f = FLOWS[c.flow];
    if (d.v === 'better') {
      c.status = 'resolved';
      S.toast = f.private
        ? 'Glad to hear it. Nothing was shared.'
        : `Health status updated.${f.blocksEva ? ` ${ctx().mainShort} has one fewer blocker.` : ''}`;
    } else if (f.private) {
      c.stage = 'share';
      go('care');
      c.stage = 'share';
    } else {
      c.status = 'cmo';
      go('care');
      c.stage = 'cmo';
    }
  },
  moodshare: (d) => {
    const c = S.care;
    if (d.v === 'private') {
      c.status = 'resolved';
      c.stage = 'pick';
      go('home');
      S.toast = 'Kept private. You can come back any time.';
    } else {
      c.shared = true;
      c.status = 'resolved';
      c.stage = 'pick';
      go('home');
      S.toast =
        d.v === 'cmo'
          ? "Shared with CMO Okafor. They'll find a quiet moment to talk."
          : `Message sent to ground support. Expect a reply ${ctx().reply === 'live' ? 'soon' : 'in ' + ctx().reply}.`;
    }
  },
  measure: (d) => {
    S.modal = null;
    S.measBack = S.view === 'entry' ? S.measBack : S.view;
    S.measTask = S.task;
    S.view = 'entry';
    S.rec = { ind: d.v, vals: {}, err: '', res: null };
  },
  login: () => {
    S.authed = true;
    S.onb = { step: 'wear' };
    S.view = 'onboard';
  },
  onbnext: (d) => {
    S.onb.step = d.v;
  },
  detect: () => {
    S.onb.scan = 'running';
    startScan();
    return 'keep';
  },
  onbfinish: () => {
    S.mind = { ...S.mindDraft };
    S.onb = null;
    S.firstHome = true;
    go('home');
    S.boot = true;
    startBoot();
  },
  onbskip: () => {
    S.onb = null;
    S.firstHome = true;
    go('home');
    S.boot = true;
    startBoot('Setup complete. You can do the well-being check-in later.');
  },
  logout: () => {
    stopScan();
    resetState();
  },
  env: (d) => {
    S.env = d.v;
    S.evaCleared = false;
    return 'keep';
  },
  body: (d) => {
    S.body = d.v;
    S.evaCleared = false;
    return 'keep';
  },
  sample: () => {
    if (S.demo) {
      clearSample();
      S.toast = 'Sample data cleared.';
    } else {
      loadSample();
      S.toast = 'Sample data loaded. Every sample value is marked as a sample.';
    }
    return 'keep';
  },
  efset: (d) => {
    S.rec.vals[d.k] = d.v;
    return 'keep';
  },
  entrysave: () => {
    const r = S.rec;
    r.err = '';
    if (r.ind === 'urine') {
      if (!r.vals.c) {
        r.err = 'Pick the colour that matches best.';
        return 'keep';
      }
      addEntry('urine', { c: +r.vals.c });
      r.res = true;
      return 'keep';
    }
    if (r.ind === 'skin' || r.ind === 'us') {
      if (!r.vals.img) {
        r.err = 'Add a photo or image first.';
        return 'keep';
      }
      addEntry(r.ind, { img: r.vals.img, cmp: r.vals.cmp || '' }, true);
      r.res = true;
      return 'keep';
    }
    const I = IND[r.ind],
      v = {};
    for (const f of I.fields) {
      const x = r.vals[f.k];
      if (f.opts) {
        v[f.k] = x || '';
        continue;
      }
      if (x === undefined || x === '') {
        r.err = `Enter ${f.label.toLowerCase()}.`;
        return 'keep';
      }
      const n = parseFloat(x);
      if (isNaN(n) || n < f.min || n > f.max) {
        r.err = `${f.label}: ${x} looks wrong. Check the reading and enter it again (${f.min}–${f.max} ${f.unit}).`;
        return 'keep';
      }
      v[f.k] = n;
    }
    if (r.ind === 'bp' && v.sys <= v.dia) {
      r.err = 'The top number must be higher than the bottom number. Check the reading.';
      return 'keep';
    }
    if (r.ind === 'glu' && !v.ctx) {
      r.err = 'Choose when you last ate.';
      return 'keep';
    }
    addEntry(r.ind, v);
    r.res = true;
    return 'keep';
  },
  measback: () => {
    const v = S.measBack,
      t = S.measTask;
    go(v);
    S.task = v === 'mission' ? t : null;
  },
  mindset: (d) => {
    S.mindDraft[d.k] = +d.v;
    return 'keep';
  },
  mindsave: () => {
    S.mind = { ...S.mindDraft };
    S.toast = 'Check-in saved. Only you can see it.';
    return 'keep';
  },
  mindedit: () => {
    S.mind = null;
    return 'keep';
  },
  base: (d) => {
    go('profile');
    S.base = d.v || null;
  },
  baseconfirm: () => {
    S.base = 'done';
    S.toast = 'Replay finished. This is the baseline you confirmed on day 14.';
  },
  basewait: () => {
    S.base = 'view';
    S.toast = 'In the real flow, changes stay labelled "Adapting" for 7 more sols, then the review comes back.';
  },
  prebreathe: () => {
    S.prebreathe = true;
    return 'keep';
  },
  shelter: () => {
    S.shelter = true;
    S.toast = "Noted. I'll tell you when the dose rate drops below the alert level.";
    return 'keep';
  },
  cmcheck: () => {
    S.cmCheck = true;
    S.toast = 'Three days later: sleep and reaction time are back near baseline.';
    return 'keep';
  },
  reeval: () => {
    S.evaCleared = true;
    S.celebrate = true;
    S.toast = `${ctx().mainShort} reassessed: go.`;
    return 'keep';
  },
  sleepplan: () => {
    S.sleepPlan = true;
    return 'keep';
  },
  reset: () => {
    resetState();
  },
};
