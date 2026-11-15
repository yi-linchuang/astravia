# ASTRAVIA

**A health copilot that helps astronauts assess themselves when Earth is too far away to ask.**

On a Mars mission a message to Earth takes up to 20 minutes each way. Crews have to judge their own health, and their readiness for a task, alone. ASTRAVIA turns wearable readings and quick self-checks into one daily question: *what changed compared with my own baseline, and what should I do about it?*

Built as a prototype for the NASA Space Apps Challenge. It runs entirely in the browser, with no backend.

## Features

| Area | What it does |
| --- | --- |
| **Today** | The one thing to do now ("Must do"), any reported symptom, a body-map status overview, tasks, the daily routine and live environment readings. |
| **My health** | A body map. Each indicator sits on the body part it affects, with its trend against the crew member's own baseline, how to record it, and the countermeasures that protect that system. A second tab covers long-term change: bone, strength, eyes, radiation dose, blood chemistry. |
| **Guided care** | Report one symptom and a five-step flow (describe, check data, possible causes, act, follow up) shows only the escalation level that fits: self-care, the crew medical officer (CMO), the flight surgeon, or the emergency procedure. |
| **Mission readiness** | The same body state can be fine for routine work and not for an EVA. Each requirement is checked against current readings and the radiation rule for the outing. |
| **Environments** | Space station, deep-space vehicle, Moon or Mars base, rover. The same readings are judged differently in each, and the Earth link shows its maximum delay. A solar particle event opens a dose-rate and shelter-map modal on the surface bases. |
| **Onboarding** | Connect devices, run a short reaction test and a well-being check, then the dashboard builds from the result. |

## Data: real and simulated

| Data | Source | Status |
| --- | --- | --- |
| Radiation on Mars, in transit to Mars, in lunar orbit | NASA OSDR RadLab: Curiosity RAD (2024-05-20), ExoMars TGO Liulin-MO (2016-04-23), LRO CRaTER (2024-05-17) | Real, replayed as "today". Lunar orbit stands in for the Moon surface. The API returns no unit; µGy/h is inferred. |
| ISS cabin CO₂, temperature, humidity | NASA OSDR Environmental Data App, mission RR-6 (2017–2018) | Real, replayed. |
| Blood chemistry and IL-6 | NASA OSDR OSD-575 (Inspiration4) | Real, long-term tab only. |
| Radiation limits and shielding rules | NASA-STD-3001 Vol. 1 Rev C and Vol. 2, technical brief OCHMO-TB-020 | Published requirements. |
| Hazards, risks, measurements | NASA Human Research Program, Canadian Space Agency | Text only, used to shape the product. |
| The astronaut (Mei Lin, SIM-0412), wearable readings, baselines, schedule, cabin pressure and oxygen, personal dose | Invented | Simulated. Astronauts' daily health data is not public. |

Assumptions that belong to this product, not to NASA: the radiation alert level (50 µGy/h), the escalation levels and follow-up timing, the symptom thresholds, and UTC = LMST + 5 h 32 min for Mars.

## AI Usage Disclosure

ASTRAVIA was developed with the assistance of AI tools, including Claude and ChatGPT.

- **Product Design:** AI assisted with brainstorming, research synthesis, and design exploration.
- **Code:** AI assisted with generating and refining frontend components and application logic.
- **Data:** Simulated astronaut health data was generated with AI assistance for demonstration purposes. It does not represent real astronaut medical records.
- **Human Contribution:** The team defined the product concept, user experience, decision-making logic, and overall project direction, and reviewed and tested the implementation.

NASA research and publicly available resources were used as scientific references and are cited separately.

## Quick start

Requires Node.js 18 or later. The app itself has no build step; any static file server works.

```bash
npm install        # only needed for the dev tools below
npm start          # serves http://localhost:8080
```

Open `http://localhost:8080/?debug` to expose the app's internals on `window` (the tests use this).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Static dev server (`scripts/serve.mjs`, no dependencies) |
| `npm run build:css` | Recompile `styles/tailwind.css` after adding Tailwind classes (the compiled file is committed) |
| `npm run lint` | ESLint over `src` |
| `npm run format` | Prettier over `src` |
| `npm test` | End-to-end smoke test in Chromium (needs Playwright and a Chromium build) |

## Project layout

```
index.html              page shell and module entry point
styles/
  tailwind.css          compiled utilities (generated, committed)
  theme.css             colour tokens, panels, background
  motion.css            transitions, modal and dashboard-build animation
src/
  main.js               entry point, hash routing
  state.js              the single state object
  render.js             render pipeline and view transitions
  actions.js            every click action (data-act handlers)
  events.js             document-level event delegation
  data/                 radiation, environments, indicators, symptom flows, body regions, records
  components/           primitives, charts, body figure, modals
  views/                today, health, care, entry, mission, environment, account, onboarding
scripts/serve.mjs       tiny static server
tests/smoke.mjs         end-to-end smoke test
```

## How it is built

Vanilla JavaScript with ES modules, Tailwind CSS 3, no framework. State lives in one object (`src/state.js`). Views are functions that return HTML strings. One delegated listener handles clicks and calls the matching handler in `actions.js`. Routing uses the URL hash, so the app works on any static host.

## License

[MIT](LICENSE) © 2026 Yi-Lin. The MIT license covers this project's code and text. NASA and CSA source data keep their own terms of use.
