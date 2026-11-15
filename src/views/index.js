// View registry.
import { vProfile } from './account.js';
import { vCare } from './care.js';
import { vEntry } from './entry.js';
import { vHabitat } from './environment.js';
import { vHealth } from './health.js';
import { vMission } from './mission.js';
import { vHome } from './today.js';

export const VIEWS = {
  home: vHome,
  health: vHealth,
  habitat: vHabitat,
  care: vCare,
  mission: vMission,
  profile: vProfile,
  entry: vEntry,
};
