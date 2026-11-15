# ASTRAVIA

**A health copilot that helps astronauts assess themselves when Earth is too far away to ask.**

A prototype for the NASA Space Apps Challenge. On a Mars mission a message to Earth takes up to 20 minutes each way, so crews must judge their own health and readiness for a task, alone. ASTRAVIA turns wearable data and quick self-checks into one question per day: *what changed, compared with my own baseline, and what should I do about it?*

Designed and built by Irene (product designer, DeepLearning.AI) with AI assistance.

## What it does

- **Today.** The one thing to do now (Must do), any reported symptom, a body-map status overview, tasks, the daily routine and live environment readings.
- **Body map (My health → Today).** Every health indicator sits on the body part it affects, with its trend against your own baseline, how to record it, and the countermeasures that protect that system. Long-term changes (bone, strength, eyes, radiation dose) are on the second tab.
- **Guided care.** Tell it one symptom. A five-step flow (describe, check data, possible causes, act, follow up) shows only the escalation level that matches what you said: handle it yourself, call the CMO, ask the flight surgeon, or start the emergency procedure.
- **Mission readiness.** The same body state can be fine for routine work and not for an EVA. Each requirement is checked against your readings and the radiation rule for the outing.
- **Environments.** Space station, deep-space vehicle, Moon or Mars base, rover. The same readings are judged differently in each, and the Earth link shows its maximum delay.

## Data: what is real and what is simulated

| Data | Source | Status |
| --- | --- | --- |
| Radiation on Mars, in transit to Mars, and in lunar orbit | NASA OSDR RadLab: Curiosity RAD (20 May 2024), ExoMars TGO Liulin-MO (2016), LRO CRaTER (17 May 2024) | Real, replayed as "today". Lunar orbit stands in for the Moon surface. The API returns no unit; µGy/h is inferred. |
| ISS cabin CO₂, temperature, humidity, radiation | NASA OSDR Environmental Data App, mission RR-6 (2017–2018) | Real, replayed. |
| Blood chemistry and IL-6 | NASA OSDR OSD-575 (Inspiration4) | Real, shown on the long-term tab only. |
| Radiation limits and shielding rules | NASA-STD-3001 Vol. 1 Rev C and Vol. 2, technical brief OCHMO-TB-020 | Published requirements. |
| Hazards, risks, measurements | NASA Human Research Program and Canadian Space Agency pages | Text only, used to shape the product. |
| The astronaut (Mei Lin, SIM-0412), wearable readings, baselines, schedule, cabin pressure and oxygen, personal dose | Invented | Simulated. Astronauts' daily health data is not public. |

Assumptions that are the product's own, not NASA's: the radiation alert level (50 µGy/h), the escalation levels and follow-up timing, symptom thresholds, and UTC = LMST + 5 h 32 min for Mars.

Details of the evidence behind each measurement are in the separate Validity document.

## Not a NASA product, not medical advice

ASTRAVIA is a student challenge project. It is not affiliated with or endorsed by NASA or the Canadian Space Agency. Thresholds marked "assumed" are product assumptions, not medical standards. The code, text, diagrams and simulated data were generated with AI assistance (Claude, by Anthropic) and reviewed by the author.

## Run it

No build step is needed to run the app. Any static file server works.

```bash
npm install        # only needed for the tools below
npm start          # serves http://localhost:8080
```

Open `http://localhost:8080/?debug` to expose the app's internals on `window` (used by the tests).

## Project layout

```
index.html              page shell and the module entry point
styles/
  tailwind.css          compiled utilities (generated, committed)
  theme.css             colour tokens, panels, background
  motion.css            transitions, modal and dashboard-build animation
src/
  main.js               entry point
  state.js              the single state object
  render.js             render pipeline and view transitions
  actions.js            every click action (data-act handlers)
  events.js             document-level event delegation
  data/                 NASA data, indicators, signals, symptom flows, body regions
  components/           panels, charts, body figure, modals
  views/                today, health, care, entry, mission, environment, account, onboarding
scripts/serve.mjs       tiny static server
tests/smoke.mjs         end-to-end smoke test
```

The app is vanilla JavaScript with ES modules. State lives in one object, views are functions that return HTML strings, and clicks are handled by one delegated listener that calls `actions.js`.

## Tools

```bash
npm run build:css   # recompile styles/tailwind.css after adding Tailwind classes
npm run lint
npm run format
npm test            # needs Playwright and a Chromium build
```

## Deploy to GitHub Pages

Settings → Pages → Deploy from a branch → select the branch and the `/ (root)` folder. The app has no backend and uses hash routing, so it works on Pages as is. Fonts (Geist, IBM Plex Mono) load from Google Fonts; without a connection the system fonts are used.

## License

Not chosen yet.
