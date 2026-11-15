// Entry point.
import { go } from './actions.js';
import { render } from './render.js';
import { S } from './state.js';
import { VIEWS } from './views/index.js';
import './events.js';

window.addEventListener('hashchange', () => {
  const v = location.hash.slice(1);
  if (VIEWS[v] && v !== S.view) {
    go(v);
    render(true);
  }
});
if (VIEWS[location.hash.slice(1)]) S.view = location.hash.slice(1);
render();

if (location.search.includes('debug')) import('./debug.js');
