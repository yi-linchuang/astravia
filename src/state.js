// The single app state object and its factory functions.

/* ---------- state ---------- */
export function newCase() {
  return { flow: null, stage: 'pick', ans: {}, acts: {}, status: 'none', followAt: null, photo: null, shared: false };
}
const emptyData = () => ({
  sleep: [],
  cardio: [],
  cog: [],
  bp: [],
  bal: [],
  fit: [],
  temp: [],
  glu: [],
  wt: [],
  skin: [],
  urine: [],
  us: [],
});
function fresh() {
  return {
    view: 'home',
    htab: 'body',
    signal: null,
    task: null,
    clock: 490,
    toast: '',
    region: null,
    pickNote: false,
    care: newCase(),
    co2Fixed: false,
    mind: null,
    journal: '',
    prebreathe: false,
    shelter: false,
    evaCleared: false,
    sleepPlan: false,
    cmCheck: false,
    base: null,
    env: 'station',
    body: 'mars',
    data: emptyData(),
    demo: false,
    rec: null,
    measBack: 'home',
    authed: false,
    onb: null,
  };
}
export let S = fresh();
export function resetState() {
  S = fresh();
}
