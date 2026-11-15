// Test/debug hook. Loaded only when the page URL contains ?debug. Exposes app internals on `window` for the Playwright tests.
import { S } from './state.js';
import { newCase, resetState } from './state.js';
import { render } from './render.js';
import { go, A } from './actions.js';
import { VIEWS } from './views/index.js';
import { loadSample, clearSample } from './data/records.js';
import { ctx } from './data/env.js';
import { signals, changed } from './data/signals.js';
import { FLOWS } from './data/flows.js';
import { speActive } from './data/radiation.js';
import { startBoot } from './views/onboarding.js';

Object.defineProperty(window, 'S', { get: () => S, configurable: true });
Object.assign(window, {
  render,
  go,
  A,
  VIEWS,
  loadSample,
  clearSample,
  ctx,
  signals,
  changed,
  FLOWS,
  speActive,
  startBoot,
  newCase,
  resetState,
});
