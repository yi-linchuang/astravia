// End-to-end smoke test. Starts the static server, drives the app in Chromium and asserts the main flows.
// Usage: npm test   (needs `playwright` and a Chromium build)
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { serve } from '../scripts/serve.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const server = await serve(0);
const base = `http://localhost:${server.address().port}/index.html`;
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));

const text = () => page.evaluate(() => document.body.innerText);
// Views change inside a View Transition (applied on the next frame), so give each click a moment to settle.
const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(250); };
const tap = async (act, v) => click(v === undefined ? `[data-act="${act}"]` : `[data-act="${act}"][data-v="${v}"]`);
const inDialog = (sel) => page.locator(`[role="dialog"] ${sel}`).first();
const wait = (ms) => page.waitForTimeout(ms);
const settle = () => wait(300);
const state = (expr) => page.evaluate(expr);
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${name}\n       ${e.message.split('\n')[0]}`);
  }
}
async function fresh(hash = '') {
  await page.goto('about:blank'); // forces a real reload, so state never leaks between tests
  await page.goto(`${base}?debug${hash}`);
  await page.waitForFunction(() => window.S);
}
async function signedIn() {
  await fresh('#home');
  await state(() => {
    S.authed = true;
    S.onb = null;
    loadSample();
    render();
  });
  await wait(300);
}

await test('sign-in shows the crew card and a Welcome back greeting', async () => {
  await fresh();
  assert.match(await text(), /welcome back/i);
  assert.match(await text(), /Mei Lin/);
});

await test('onboarding runs through devices, reaction test and well-being, then builds the dashboard', async () => {
  await tap('login');
  assert.equal(await state(() => S.onb.step), 'wear');
  await tap('onbnext');
  await tap('detect');
  await page.waitForFunction(() => S.onb.scan === 'done', null, { timeout: 15000 });
  await click('[data-act="onbnext"][data-v="pvt"]');
  for (let i = 0; i < 6; i++) {
    await page.locator('#pvt-pad').dispatchEvent('pointerdown').catch(() => {});
    await page.waitForFunction(() => !document.querySelector('#pvt-pad') || document.querySelector('#pvt-pad').textContent === 'Tap!', null, { timeout: 5000 }).catch(() => {});
    await wait(80);
  }
  await wait(500);
  await click('[data-act="onbnext"][data-v="mind"]');
  await tap('onbskip');
  await wait(600);
  assert.equal(await page.locator('.boot').count(), 1, 'dashboard build animation is visible');
  await page.waitForFunction(() => !S.boot, null, { timeout: 8000 });
  await settle();
  assert.match(await text(), /must do/i);
});

await test('sidebar has no Record or Countermeasures page', async () => {
  await signedIn();
  const nav = await state(() => [...document.querySelectorAll('#side [data-act="go"]')].map((b) => b.textContent.trim().toLowerCase()));
  assert.deepEqual(nav, ['today', 'my health', 'guided care', 'mission readiness', 'environment', 'my account']);
});

await test('Earth link shows the maximum delay for each environment', async () => {
  await signedIn();
  const link = () => state(() => document.querySelector('[data-hl="top-link"]').textContent);
  assert.match(await link(), /Live/);
  await page.selectOption('[data-sel="env"]', 'vehicle');
  assert.match(await link(), /up to 20 min/);
  await page.selectOption('[data-sel="env"]', 'base');
  await page.selectOption('[data-sel="body"]', 'moon');
  assert.match(await link(), /1\.3 s/);
});

await test('Must do opens a modal; Escape and the overlay both close it', async () => {
  await signedIn();
  await tap('takeaction', 'must');
  assert.equal(await page.locator('[role="dialog"]').count(), 1);
  assert.equal(await state(() => getComputedStyle(document.body).overflow), 'hidden', 'page scroll is locked');
  await inDialog('[data-act="sleepplan"]').click();
  await inDialog('[data-act="cmcheck"]').click();
  assert.match(await inDialog('').innerText(), /did it work/i);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('[role="dialog"]').count(), 0);
  await tap('takeaction', 'must');
  await page.mouse.click(30, 450);
  assert.equal(await page.locator('[role="dialog"]').count(), 0);
  assert.notEqual(await state(() => getComputedStyle(document.body).overflow), 'hidden', 'scroll lock released');
});

await test('Who to call: only the matching level is shown, and a red flag jumps to Emergency', async () => {
  await signedIn();
  await state(() => { go('care'); render(true); }); await settle();
  assert.doesNotMatch(await text(), /who to call/i);
  await tap('startflow', 'headache');
  assert.match(await text(), /handle it yourself/i);
  assert.doesNotMatch(await text(), /call cmo okafor/i, 'no call button at level 1');
  await tap('chip', 'Sudden and intense');
  assert.match(await text(), /you selected a warning sign/i);
});

await test('symptom flow escalates: follow-up, worse, CMO, then flight surgeon', async () => {
  await signedIn();
  await state(() => { go('care'); render(true); }); await settle();
  await tap('startflow', 'headache');
  await tap('assessnext');
  assert.match(await text(), /stand out/i, 'step 2 states a conclusion');
  await state(() => { go('home'); render(true); }); await settle();
  assert.match(await text(), /reported symptom/i);
  await tap('takeaction', 'symptom');
  await inDialog('[data-act="careact"]').click();
  await inDialog('[data-act="setfollow"]').click();
  assert.equal(await state(() => S.care.status), 'followup');
  await tap('takeaction', 'symptom');
  await inDialog('[data-act="ff"]').click();
  await inDialog('[data-act="followup"][data-v="worse"]').click();
  assert.equal(await state(() => S.care.status), 'cmo');
  assert.match(await text(), /call cmo okafor/i);
  await tap('fsescalate');
  assert.equal(await state(() => S.care.status), 'fs');
  assert.match(await text(), /ask the flight surgeon/i);
});

await test('Who can help opens a modal with call-to-action buttons; the CMO call connects', async () => {
  await signedIn();
  await tap('takeaction', 'help');
  const d = await inDialog('').innerText();
  assert.match(d, /call your cmo/i);
  assert.match(d, /emergency procedure/i);
  await inDialog('[data-act="call"]').click();
  await page.waitForFunction(() => S.call && S.call.stage === 'live', null, { timeout: 6000 });
  await inDialog('[data-act="endcall"]').click();
  assert.equal(await state(() => S.call.stage), 'ended');
});

await test('solar particle event (Mars base) opens a modal with dose rate and shelter map', async () => {
  await signedIn();
  await state(() => { S.env = 'base'; S.body = 'mars'; S.clock = 300; go('home'); render(true); }); await settle();
  assert.match(await text(), /solar particle event/i);
  await tap('takeaction', 'spe');
  const d = await inDialog('').innerText();
  assert.match(d, /dose rate/i);
  assert.match(d, /expected below alert/i);
  assert.match(d, /where to shelter/i);
  await inDialog('[data-act="shelter"]').click();
  assert.equal(await state(() => S.shelter), true);
});

await test('no solar event on the station; the Environment page has its own entry to the modal on the base', async () => {
  await signedIn();
  assert.doesNotMatch(await text(), /solar particle event/i);
  await state(() => { S.env = 'base'; S.clock = 300; go('habitat'); render(true); }); await settle();
  await tap('takeaction', 'spe');
  assert.equal(await page.locator('[role="dialog"]').count(), 1);
});

await test('body map: a region lists what it tracks and what protects you; Whole body holds well-being', async () => {
  await signedIn();
  await tap('bodyto', 'bones');
  const t = await text();
  assert.match(t, /what we track here/i);
  assert.match(t, /what protects you/i);
  assert.match(t, /Resistance and aerobic exercise/);
  await state(() => { go('home'); render(true); }); await settle();
  await tap('htab', 'mind');
  assert.equal(await state(() => S.region), 'whole');
  assert.match(await text(), /today's check-in/i);
});

await test('recording a reading from the body map ends in an explained result', async () => {
  await signedIn();
  await tap('bodyto', 'whole');
  await click('[data-act="measure"][data-v="temp"]');
  await page.locator('[data-ef="c"]').fill('36.8');
  await tap('entrysave');
  assert.match(await text(), /what this means/i);
});

await browser.close();
server.close();
if (problems.length) {
  failed++;
  console.log('  FAIL console/page errors:\n    ' + [...new Set(problems)].join('\n    '));
}
console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
